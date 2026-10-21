"""Suggest a project's ultime-skill profile, and optionally write its rules and permissions.

Reads the repository (manifests and file names, never runs project code) against references/stack-map.json
and prints JSON: packs to install (with the signals that justify each), path-scoped rules, permission
rules. With --write-rules it copies the rules to .claude/rules/ultime/ (that folder is replaced whole);
with --write-permissions SCOPE it merges the permission rules into .claude/settings.json (project) or
.claude/settings.local.json (local), keeping every rule already there.

Usage:
    python suggest_profile.py [repo] [--write-rules] [--write-permissions project|local]
"""

import argparse
import fnmatch
import json
import re
import shutil
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
STACK_MAP = SKILL / "references" / "stack-map.json"
RULES_DIR = SKILL / "rules"
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", "target", "vendor", ".terraform",
             "__pycache__", ".turbo", "Pods", ".gradle", ".dart_tool", "coverage", ".claude"}
CODE_SUFFIXES = {".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".go", ".rs", ".java", ".kt", ".swift", ".dart",
                 ".php", ".rb", ".cs", ".sh", ".tf", ".sql", ".vue", ".svelte"}


def files_of(root: Path) -> list[str]:
    """Repository files as forward-slash paths relative to the root, dependency folders skipped."""
    found = []
    stack = [root]
    while stack:
        directory = stack.pop()
        try:
            entries = list(directory.iterdir())
        except OSError:
            continue
        for entry in entries:
            if entry.is_dir():
                if entry.name not in SKIP_DIRS and (not entry.name.startswith(".") or entry.name in {".app-factory", ".github"}):
                    stack.append(entry)
            else:
                found.append(entry.relative_to(root).as_posix())
    return found


def matches(path: str, glob: str) -> bool:
    """Glob match where `**/` also matches zero folders, as in the rules frontmatter."""
    return fnmatch.fnmatch(path, glob) or (glob.startswith("**/") and fnmatch.fnmatch(path, glob[3:]))


def dependencies(root: Path, files: list[str]) -> set[str]:
    """Dependency names declared by every package.json, pyproject.toml and requirements file."""
    names: set[str] = set()
    for rel in files:
        name = rel.rsplit("/", 1)[-1]
        path = root / rel
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if name == "package.json":
            try:
                manifest = json.loads(text)
            except ValueError:
                continue
            for key in ("dependencies", "devDependencies", "peerDependencies"):
                names.update((manifest.get(key) or {}).keys())
        elif name == "pyproject.toml" or name.startswith("requirements") and name.endswith(".txt"):
            names.update(match.lower() for match in re.findall(r"(?:^|[\s\"'\[,])([A-Za-z][\w.-]*)\s*(?:[<>=~!;\[\"',]|$)", text, re.M))
    return names


def package_managers(files: list[str]) -> list[str]:
    roots = set(files)
    managers = []
    for manager, lock in [("uv", "uv.lock"), ("poetry", "poetry.lock"), ("pnpm", "pnpm-lock.yaml"), ("yarn", "yarn.lock"),
                          ("bun", "bun.lock"), ("bun", "bun.lockb"), ("npm", "package-lock.json"), ("make", "Makefile"),
                          ("go", "go.mod"), ("rust", "Cargo.toml")]:
        if any(f == lock or f.endswith("/" + lock) for f in roots) and manager not in managers:
            managers.append(manager)
    return managers


def suggest(root: Path) -> dict:
    stack_map = json.loads(STACK_MAP.read_text(encoding="utf-8"))
    files = files_of(root)
    deps = dependencies(root, files)
    packs: dict[str, list[str]] = {}
    is_code = any(Path(f).suffix in CODE_SUFFIXES for f in files)
    if is_code:
        for pack in stack_map["always_for_code"]:
            packs.setdefault(pack, []).append("code")
    for signal in stack_map["signals"]:
        hit = [d for d in signal.get("deps", []) if d.lower() in deps]
        hit += [g for g in signal.get("files", []) if any(matches(f, g) for f in files)]
        if hit:
            for pack in signal["packs"]:
                packs.setdefault(pack, []).append(f"{signal['id']} ({', '.join(hit[:3])})")
    rules = [name for name, globs in stack_map["rules"].items() if any(matches(f, g) for f in files for g in globs)]
    managers = package_managers(files)
    allow = [rule for manager in managers for rule in stack_map["permissions"]["allow"].get(manager, [])]
    return {
        "root": str(root),
        "packs": [{"pack": pack, "because": reasons} for pack, reasons in packs.items()],
        "rules": rules,
        "package_managers": managers,
        "permissions": {"allow": allow, "ask": stack_map["permissions"]["ask"] if is_code else []},
    }


def write_rules(root: Path, rules: list[str]) -> None:
    target = root / ".claude" / "rules" / "ultime"
    shutil.rmtree(target, ignore_errors=True)
    target.mkdir(parents=True)
    for name in rules:
        shutil.copy2(RULES_DIR / f"{name}.md", target / f"{name}.md")
    print(f"rules   {len(rules)} written to .claude/rules/ultime/: {', '.join(rules) or 'none'}", file=sys.stderr)


def write_permissions(root: Path, scope: str, permissions: dict) -> None:
    path = root / ".claude" / ("settings.json" if scope == "project" else "settings.local.json")
    settings = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    current = settings.setdefault("permissions", {})
    for kind in ("allow", "ask"):
        existing = current.get(kind, [])
        current[kind] = existing + [rule for rule in permissions[kind] if rule not in existing]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(settings, indent=2) + "\n", encoding="utf-8")
    print(f"perms   merged into {path.relative_to(root).as_posix()}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("repo", nargs="?", default=".", type=Path)
    parser.add_argument("--write-rules", action="store_true", help="copy the matching rules to .claude/rules/ultime/")
    parser.add_argument("--write-permissions", choices=["project", "local"], help="merge permission rules into settings")
    args = parser.parse_args()
    root = args.repo.resolve()
    if not root.is_dir():
        sys.exit(f"error: {root} is not a directory")
    result = suggest(root)
    print(json.dumps(result, indent=2))
    if args.write_rules:
        write_rules(root, result["rules"])
    if args.write_permissions:
        write_permissions(root, args.write_permissions, result["permissions"])


if __name__ == "__main__":
    main()
