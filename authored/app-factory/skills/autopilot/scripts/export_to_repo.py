"""Copy ultime-skill packs into a project's .claude/ so cloud sessions can load them.

Cloud sessions and scheduled tasks do not install plugins: only the repository's own .claude/skills,
.claude/agents and .claude/commands are loaded. This script copies the skills, agents and commands of the
chosen packs there, records what it wrote in .claude/ultime-export.json, and on the next run replaces
exactly those paths (never a file it did not write).

Usage:
    python export_to_repo.py [--target DIR] [--packs app-factory,mobile-expo] [--source DIR] [--dry-run]

Without --packs, the packs are the ultime-skill plugins enabled in the target's .claude/settings.json,
plus app-factory. Bundles (ultime-*) are expanded to their packs; ultime-profile is never exported.
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

MARKETPLACE = "ultime-skill"
DEFAULT_SOURCE = Path.home() / ".claude" / "plugins" / "marketplaces" / MARKETPLACE / "plugins"
MANIFEST = Path(".claude") / "ultime-export.json"
ALWAYS = ["app-factory"]
# ultime-profile installs plugins, which a cloud session cannot do: never exported.
SKIPPED = {"ultime-profile"}
# Built in two parts so this file does not flag itself.
PLUGIN_ROOT_VAR = "CLAUDE_" + "PLUGIN_ROOT"


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def plugin_manifest(source: Path, pack: str) -> dict:
    path = source / pack / ".claude-plugin" / "plugin.json"
    if not path.exists():
        fail(f"pack '{pack}' not found in {source}")
    return json.loads(path.read_text(encoding="utf-8"))


def enabled_packs(target: Path) -> list[str]:
    settings = target / ".claude" / "settings.json"
    if not settings.exists():
        return []
    enabled = json.loads(settings.read_text(encoding="utf-8")).get("enabledPlugins", {})
    suffix = f"@{MARKETPLACE}"
    return [key[: -len(suffix)] for key, on in enabled.items() if on and key.endswith(suffix)]


def expand(source: Path, packs: list[str]) -> list[str]:
    """Replace each bundle by its dependencies, keep order, drop duplicates."""
    result: list[str] = []
    for pack in packs:
        dependencies = plugin_manifest(source, pack).get("dependencies")
        for name in expand(source, dependencies) if dependencies else [pack]:
            if name not in result and name not in SKIPPED:
                result.append(name)
    return result


def planned_copies(source: Path, packs: list[str]) -> list[tuple[Path, Path, str]]:
    """(source path, destination relative to the target, pack) for every skill, agent and command."""
    copies = []
    for pack in packs:
        root = source / pack
        for skill in sorted((root / "skills").glob("*/SKILL.md")):
            copies.append((skill.parent, Path(".claude/skills") / skill.parent.name, pack))
        for kind in ("agents", "commands"):
            for file in sorted((root / kind).glob("*.md")):
                copies.append((file, Path(".claude") / kind / file.name, pack))
    return copies


def warnings_for(source: Path, packs: list[str]) -> list[str]:
    found = []
    for pack in packs:
        if pack == "guardrails":
            continue
        if "hooks" in plugin_manifest(source, pack):
            found.append(f"{pack}: plugin hooks are not exported, copy them into .claude/settings.json by hand if needed")
        for file in (source / pack).rglob("*"):
            if file.is_file() and file.suffix in {".md", ".json", ".sh", ".py", ".js"}:
                if PLUGIN_ROOT_VAR in file.read_text(encoding="utf-8", errors="ignore"):
                    found.append(f"{pack}: {file.relative_to(source / pack).as_posix()} uses {PLUGIN_ROOT_VAR}, "
                                 "which is not set outside a plugin")
    return found


def source_commit(source: Path) -> str:
    try:
        return subprocess.run(["git", "-C", str(source.parent), "rev-parse", "HEAD"],
                              capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def remove(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--target", type=Path, default=Path.cwd(), help="project repository (default: cwd)")
    parser.add_argument("--packs", help="comma-separated packs or bundles (default: enabled ultime-skill plugins)")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="plugins/ directory of the marketplace")
    parser.add_argument("--dry-run", action="store_true", help="print the plan, write nothing")
    args = parser.parse_args()

    target, source = args.target.resolve(), args.source.resolve()
    if not (target / ".git").exists():
        fail(f"{target} is not a git repository root")
    if not source.is_dir():
        fail(f"{source} not found: run `claude plugin marketplace add Lucas-lux/{MARKETPLACE}` "
             f"then `claude plugin marketplace update {MARKETPLACE}`, or pass --source")

    requested = args.packs.split(",") if args.packs else enabled_packs(target)
    packs = expand(source, [p.strip() for p in ALWAYS + requested if p.strip()])
    copies = planned_copies(source, packs)

    manifest_path = target / MANIFEST
    previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    owned = {Path(p) for p in previous.get("paths", [])}

    seen: dict[Path, str] = {}
    for _, destination, pack in copies:
        if destination in seen:
            fail(f"{destination.as_posix()} is provided by both {seen[destination]} and {pack}")
        seen[destination] = pack
        if (target / destination).exists() and destination not in owned:
            fail(f"{destination.as_posix()} already exists and was not written by this script: rename or remove it")

    print(f"source  {source} ({source_commit(source)[:12]})")
    print(f"packs   {', '.join(packs)}")
    print(f"copies  {sum(1 for c in copies if 'skills' in c[1].parts)} skills, "
          f"{sum(1 for c in copies if 'agents' in c[1].parts)} agents, "
          f"{sum(1 for c in copies if 'commands' in c[1].parts)} commands")
    for warning in warnings_for(source, packs):
        print(f"warning {warning}")
    if args.dry_run:
        return

    for path in owned:
        remove(target / path)
    for origin, destination, _ in copies:
        full = target / destination
        full.parent.mkdir(parents=True, exist_ok=True)
        if origin.is_dir():
            shutil.copytree(origin, full)
        else:
            shutil.copy2(origin, full)

    manifest = {
        "marketplace": MARKETPLACE,
        "source_commit": source_commit(source),
        "packs": packs,
        "paths": sorted(destination.as_posix() for _, destination, _ in copies),
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"wrote   {MANIFEST.as_posix()}")
    if "guardrails" in packs:
        setup = source / "guardrails" / "runtime" / "setup.cjs"
        subprocess.run(["node", str(setup), "install-project", "--dir", str(target)], check=True)
    print("next    review and commit .claude/, then in this project disable the exported packs at project "
          f"scope (`claude plugin disable <pack>@{MARKETPLACE} --scope project`) so they do not load twice")


if __name__ == "__main__":
    main()
