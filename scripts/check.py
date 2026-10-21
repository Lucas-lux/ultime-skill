"""Check the library before a commit or a release.

Errors (exit 1): invalid skill or agent frontmatter, skill name different from its folder, agent name
different from its file, plugin missing from the marketplace or manifest name mismatch, em dash, invisible
Unicode character, failing test of the hand-written runtimes (tests/, run with node when it is installed).
Warnings: skill name shared by several plugins, risky shell patterns in bundled files (to review by hand),
hand-written skill description over budget, SKILL.md over 500 lines.

Usage: python scripts/check.py
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIPPED_DIRECTORIES = {".git", ".cache", "node_modules", "__pycache__"}
MAX_DESCRIPTION_LENGTH = 1024
# Descriptions load into every session; SKILL.md bodies load on use. Limits from the Claude Code skill docs
# (keep SKILL.md under 500 lines) and from this library's own budget for hand-written skills.
MAX_AUTHORED_DESCRIPTION = 400
MAX_SKILL_LINES = 500
# Built from code points so this checker source holds no literal forbidden character.
EM_DASH = chr(0x2014)
INVISIBLE_RANGES = [(0x200B, 0x200F), (0x202A, 0x202E), (0x2060, 0x2064), (0xFEFF, 0xFEFF)]
INVISIBLE = re.compile("[" + "".join(f"{chr(a)}-{chr(b)}" for a, b in INVISIBLE_RANGES) + "]")
RISKY_PATTERNS = {
    "pipe to shell": re.compile(r"(curl|wget)[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b"),
    "base64 decode to shell": re.compile(r"base64\s+(-d|--decode)[^\n]*\|\s*(ba)?sh"),
    "credential read": re.compile(r"(\.aws/credentials|\.ssh/id_|security find-generic-password)"),
}


def text_files():
    for path in ROOT.rglob("*"):
        if path.is_file() and not SKIPPED_DIRECTORIES.intersection(path.relative_to(ROOT).parts):
            try:
                yield path, path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue


def frontmatter(text: str) -> dict[str, str] | None:
    """Read the top-level scalar keys of a YAML frontmatter, folded blocks included."""
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.DOTALL)
    if not match:
        return None
    fields: dict[str, str] = {}
    key = None
    for line in match.group(1).splitlines():
        top = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if top:
            key, value = top.group(1), top.group(2).strip()
            fields[key] = "" if value in (">", "|", ">-", "|-") else value.strip("\"'")
        elif key and line.startswith((" ", "\t")):
            fields[key] = (fields[key] + " " + line.strip()).strip()
    return fields


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    marketplace = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
    listed = {}
    for entry in marketplace["plugins"]:
        directory = ROOT / entry["source"]
        listed[directory.resolve()] = entry["name"]
        manifest = directory / ".claude-plugin" / "plugin.json"
        if not manifest.exists():
            errors.append(f"{entry['name']}: missing {manifest.relative_to(ROOT).as_posix()}")
        elif json.loads(manifest.read_text(encoding="utf-8"))["name"] != entry["name"]:
            errors.append(f"{entry['name']}: plugin.json name differs from the marketplace entry")
    for directory in sorted((ROOT / "plugins").iterdir()):
        if directory.is_dir() and directory.resolve() not in listed:
            errors.append(f"{directory.name}: plugin not listed in marketplace.json")

    owners: dict[str, list[str]] = {}
    authored = {path.parent.name for path in ROOT.glob("authored/*/skills/*/SKILL.md")}
    for skill in sorted(ROOT.glob("plugins/*/skills/*/SKILL.md")):
        location = skill.relative_to(ROOT).as_posix()
        fields = frontmatter(skill.read_text(encoding="utf-8"))
        if fields is None:
            errors.append(f"{location}: no frontmatter")
            continue
        if fields.get("name") != skill.parent.name:
            errors.append(f"{location}: name '{fields.get('name')}' differs from folder '{skill.parent.name}'")
        description = fields.get("description", "")
        if not description:
            errors.append(f"{location}: empty description")
        elif len(description) > MAX_DESCRIPTION_LENGTH:
            warnings.append(f"{location}: description of {len(description)} characters")
        elif len(description) > MAX_AUTHORED_DESCRIPTION and skill.parent.name in authored:
            warnings.append(f"{location}: authored description of {len(description)} characters, aim for "
                            f"{MAX_AUTHORED_DESCRIPTION} (it is in the context of every session)")
        if skill.read_text(encoding="utf-8").count("\n") > MAX_SKILL_LINES:
            warnings.append(f"{location}: over {MAX_SKILL_LINES} lines, move detail to references/")
        owners.setdefault(skill.parent.name, []).append(skill.parts[-4])
    for name, plugins in owners.items():
        if len(plugins) > 1:
            warnings.append(f"skill '{name}' in several plugins: {', '.join(plugins)}")

    agents = sorted(ROOT.glob("plugins/*/agents/*.md"))
    for agent in agents:
        location = agent.relative_to(ROOT).as_posix()
        fields = frontmatter(agent.read_text(encoding="utf-8"))
        if fields is None:
            errors.append(f"{location}: no frontmatter")
        elif fields.get("name") != agent.stem:
            errors.append(f"{location}: name '{fields.get('name')}' differs from file '{agent.stem}'")
        elif not fields.get("description"):
            errors.append(f"{location}: empty description")

    for path, text in text_files():
        location = path.relative_to(ROOT).as_posix()
        if EM_DASH in text:
            errors.append(f"{location}: em dash")
        if INVISIBLE.search(text):
            errors.append(f"{location}: invisible Unicode character")
        # The risky-pattern scan targets vendored skills, not this repo's own tooling.
        if not location.startswith("scripts/"):
            for label, pattern in RISKY_PATTERNS.items():
                if pattern.search(text):
                    warnings.append(f"{location}: {label}")

    tests = sorted(ROOT.glob("tests/**/*.test.cjs"))
    if tests and shutil.which("node"):
        run = subprocess.run(["node", "--test", *map(str, tests)], capture_output=True, text=True, encoding="utf-8")
        if run.returncode != 0:
            failed = [line for line in run.stdout.splitlines() if line.lstrip().startswith(("not ok", "✖"))]
            errors.append(f"tests failed: {'; '.join(failed[:5]) or run.stderr.strip()[:300]}")
    elif tests:
        warnings.append("node not found: tests/ not run")

    for message in warnings:
        print(f"warning  {message}")
    for message in errors:
        print(f"error    {message}")
    skills = sum(len(plugins) for plugins in owners.values())
    print(f"{len(marketplace['plugins'])} plugins, {skills} skills, {len(agents)} agents, "
          f"{len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
