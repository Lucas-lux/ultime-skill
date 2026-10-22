"""Import upstream skills into the library at the commits pinned in vendor.json.

Never executes anything from the upstream repositories: it only fetches and copies files.

Usage:
    python scripts/vendor.py                 # import every entry
    python scripts/vendor.py --only ponytail # import the entries of one source
    python scripts/vendor.py --cache DIR     # reuse clones kept in DIR
"""

import argparse
import fnmatch
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "vendor.json"
THIRD_PARTY = ROOT / "THIRD_PARTY.md"
DEFAULT_CACHE = ROOT / ".cache" / "vendor"
ALWAYS_EXCLUDED = [".git", "node_modules", "__pycache__", ".DS_Store"]
# The library forbids the em dash and invisible characters everywhere; upstream text is normalized on
# import. These constants are built from code points so this source file stays pure ASCII.
EM_DASH_CHAR = chr(0x2014)
EM_DASH = re.compile("[ \t]*" + EM_DASH_CHAR + "[ \t]*")
INVISIBLE_RANGES = [(0x200B, 0x200F), (0x202A, 0x202E), (0x2060, 0x2064), (0xFEFF, 0xFEFF)]
INVISIBLE = re.compile("[" + "".join(f"{chr(a)}-{chr(b)}" for a, b in INVISIBLE_RANGES) + "]")
# Files changed at import, per license folder: Apache 2.0 (4.b) and CC licenses ask modified files to say so.
MODIFIED: dict[Path, dict[str, dict[str, set[str]]]] = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
REASONS = {
    "normalize": "em dashes replaced with a hyphen, invisible Unicode characters removed",
    "strip_tail": "self-promotion footer removed",
    "drop_lines": "self-promotion links removed",
    "replace": "passage adapted (reduced context, telemetry or advertising removed)",
    "rename": "frontmatter name field aligned with the folder name",
}


def run_git(*args: str, cwd: Path | None = None) -> str:
    result = subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def checkout(repo: str, commit: str, cache: Path) -> Path:
    """Return a working tree of `repo` at `commit`, fetching only that commit when needed."""
    tree = cache / repo.replace("/", "__")
    if tree.exists():
        try:
            if run_git("rev-parse", "HEAD", cwd=tree) == commit:
                return tree
        except subprocess.CalledProcessError:
            pass
    else:
        tree.mkdir(parents=True)
        run_git("init", "-q", cwd=tree)
        run_git("remote", "add", "origin", f"https://github.com/{repo}", cwd=tree)
    run_git("fetch", "-q", "--depth", "1", "origin", commit, cwd=tree)
    run_git("checkout", "-q", "--force", "--detach", "FETCH_HEAD", cwd=tree)
    return tree


def normalize(path: Path) -> None:
    """Replace em dashes and strip invisible characters in a text file; binary files are untouched."""
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return
    original = text
    if EM_DASH_CHAR in text:
        text = EM_DASH.sub(" - ", text)
        text = re.sub(r"^ - ", "- ", text, flags=re.MULTILINE)
    text = INVISIBLE.sub("", text)
    if text != original:
        path.write_text(text, encoding="utf-8", newline="")


def rename_skill(target: Path) -> None:
    """Rewrite a skill's frontmatter `name:` to its folder name, after an import renamed the folder."""
    skill = target / "SKILL.md"
    if not skill.is_file():
        return
    text = skill.read_text(encoding="utf-8")
    new_text = re.sub(r"(?m)^(name:[ \t]*).*$", r"\g<1>" + target.name, text, count=1)
    if new_text != text:
        skill.write_text(new_text, encoding="utf-8", newline="")


def strip_tail(path: Path, marker: str | None) -> None:
    """Cut a text file from the first line that starts with `marker` to its end.

    Used to drop an upstream self-promotion footer (for example a forced citation block).
    """
    if not marker or path.suffix.lower() not in (".md", ".markdown", ".txt"):
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    except (UnicodeDecodeError, OSError):
        return
    for index, line in enumerate(lines):
        if line.lstrip().startswith(marker):
            kept = "".join(lines[:index]).rstrip()
            # A footer is often introduced by a horizontal rule, which would be left dangling.
            kept = re.sub(r"\n+-{3,}$", "", kept).rstrip()
            path.write_text(kept + "\n", encoding="utf-8", newline="")
            return


def drop_lines(path: Path, pattern: str | None) -> None:
    """Remove every line matching the regex `pattern` (for example an inline self-promotion link)."""
    if not pattern or path.suffix.lower() not in (".md", ".markdown", ".txt"):
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    except (UnicodeDecodeError, OSError):
        return
    regex = re.compile(pattern)
    kept = [line for line in lines if not regex.search(line)]
    if len(kept) != len(lines):
        path.write_text("".join(kept), encoding="utf-8", newline="")


def apply_replacements(target: Path, replacements: list[list[str]]) -> None:
    """Apply [relative_file, regex, replacement] patches to imported files; a patch that matches nothing fails.

    Used to adapt an upstream file without forking it, for example to stop an agent preloading every skill.
    """
    for relative, pattern, replacement in replacements:
        path = target / relative if target.is_dir() else target
        text = path.read_text(encoding="utf-8")
        new_text, count = re.subn(pattern, replacement, text, flags=re.MULTILINE)
        if not count:
            sys.exit(f"Patch did not apply to {path.relative_to(ROOT).as_posix()}: {pattern}")
        path.write_text(new_text, encoding="utf-8", newline="")


def ignore_patterns(origin: Path, patterns: list[str]):
    """Exclude entries whose name or path relative to `origin` matches a glob pattern."""
    def ignore(directory: str, names: list[str]) -> set[str]:
        relative = Path(directory).relative_to(origin)
        return {
            name for name in names
            if any(fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch((relative / name).as_posix(), pattern)
                   for pattern in patterns)
        }
    return ignore


def import_entry(entry: dict, source: dict, tree: Path) -> Path:
    origin = tree / entry["from"]
    target = ROOT / entry["to"]
    if not origin.exists():
        sys.exit(f"Missing upstream path {source['repo']}:{entry['from']}")
    if target.exists():
        shutil.rmtree(target) if target.is_dir() else target.unlink()
    target.parent.mkdir(parents=True, exist_ok=True)
    if origin.is_dir():
        shutil.copytree(origin, target, ignore=ignore_patterns(origin, ALWAYS_EXCLUDED + entry.get("exclude", [])))
        files = [path for path in target.rglob("*") if path.is_file()]
        license_directory = target
    else:
        shutil.copy2(origin, target)
        files = [target]
        license_directory = target.parent
    origin_label = f"{source['repo']}@{source['commit'][:12]}"
    notice_directory = license_directory if "license_to" not in entry else ROOT / entry["license_to"]
    # Every .md of agents/ and commands/ is loaded as a component: the notice goes one level up.
    if notice_directory.name in {"agents", "commands"}:
        notice_directory = notice_directory.parent
    changes = MODIFIED[notice_directory][origin_label]

    def track(step: str, action) -> None:
        before = {path: path.read_bytes() for path in files if path.exists()}
        action()
        for path, content in before.items():
            if path.exists() and path.read_bytes() != content:
                changes[path.relative_to(ROOT).as_posix()].add(REASONS[step])

    for path in files:
        track("normalize", lambda: normalize(path))
        track("strip_tail", lambda: strip_tail(path, entry.get("strip_tail")))
        track("drop_lines", lambda: drop_lines(path, entry.get("drop_lines")))
    track("replace", lambda: apply_replacements(target, entry.get("replace", [])))
    if origin.is_dir():
        track("rename", lambda: rename_skill(target))
    if not entry.get("license", True):
        return target
    if "license_to" in entry:
        license_directory = ROOT / entry["license_to"]
    if not any(license_directory.glob("LICENSE*")):
        originals = [path for pattern in ("LICENSE*", "NOTICE*")
                     for path in sorted(tree.glob(pattern)) if path.is_file()]
        if not originals:
            print(f"  no license file at the root of {source['repo']} for {target.relative_to(ROOT).as_posix()}")
        for path in originals:
            copy = license_directory / path.name
            shutil.copy2(path, copy)
            normalize(copy)
    # Written after the copy: its name also matches LICENSE* and would otherwise block it.
    if entry.get("license_note"):
        note = license_directory / "LICENSE-NOTE.md"
        note.write_text(f"# License note\n\n{entry['license_note']}\n", encoding="utf-8")
    return target


def write_modifications() -> None:
    """Write MODIFICATIONS.md in every license folder whose files were changed at import."""
    for directory, origins in MODIFIED.items():
        lines = ["# Modifications", "",
                 "Files in this folder modified by ultime-skill at import (scripts/vendor.py), compared with",
                 "their original version. The rest of the content is unchanged.", ""]
        for origin, files in sorted(origins.items()):
            if not files:
                continue
            lines += [f"Origin: https://github.com/{origin.split('@')[0]} (commit {origin.split('@')[1]})", ""]
            base = directory.relative_to(ROOT)
            for file, reasons in sorted(files.items()):
                shown = Path(file).relative_to(base).as_posix() if Path(file).is_relative_to(base) else file
                lines.append(f"- `{shown}`: {'; '.join(sorted(reasons))}")
            lines.append("")
        if any(origins.values()):
            (directory / "MODIFICATIONS.md").write_text("\n".join(lines), encoding="utf-8")


def write_third_party(manifest: dict) -> None:
    lines = [
        "# Third-party components",
        "",
        "Content imported from public repositories, at the commits shown, by `scripts/vendor.py`.",
        "Changes at import: em dashes are replaced with a hyphen, invisible Unicode characters are",
        "removed, and flagged self-promotion blocks or links (for example a mandatory citation footer, a",
        "link to a newsletter) are removed. A few files are adapted to reduce the loaded context or",
        "remove telemetry (`replace` option in `scripts/gen_vendor.py`).",
        "The original license is copied into each imported folder.",
        "",
        "| Path in the library | Source repository | Source path | Commit | License |",
        "|---|---|---|---|---|",
    ]
    for entry in sorted(manifest["imports"], key=lambda item: item["to"]):
        source = manifest["sources"][entry["source"]]
        lines.append(
            f"| `{entry['to']}` | [{source['repo']}](https://github.com/{source['repo']}) "
            f"| `{entry['from']}` | `{source['commit'][:12]}` | {source['license']}"
            f"{' (' + entry['license_note'].split('.')[0] + ')' if entry.get('license_note') else ''} |"
        )
    THIRD_PARTY.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", action="append", help="source key to import (repeatable)")
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE, help="directory holding the upstream clones")
    arguments = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = [entry for entry in manifest["imports"] if not arguments.only or entry["source"] in arguments.only]
    trees: dict[str, Path] = {}
    for entry in entries:
        source = manifest["sources"][entry["source"]]
        if entry["source"] not in trees:
            trees[entry["source"]] = checkout(source["repo"], source["commit"], arguments.cache)
        target = import_entry(entry, source, trees[entry["source"]])
        print(f"{entry['source']:>24}  {entry['from']}  ->  {target.relative_to(ROOT).as_posix()}")
    write_modifications()
    write_third_party(manifest)


if __name__ == "__main__":
    main()
