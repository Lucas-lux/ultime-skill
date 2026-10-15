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
            path.write_text("".join(lines[:index]).rstrip() + "\n", encoding="utf-8", newline="")
            return


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
    for path in files:
        normalize(path)
        strip_tail(path, entry.get("strip_tail"))
    if origin.is_dir():
        rename_skill(target)
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
    return target


def write_third_party(manifest: dict) -> None:
    lines = [
        "# Composants tiers",
        "",
        "Contenu importé depuis des dépôts publics, aux commits indiqués, par `scripts/vendor.py`.",
        "Modifications à l'import : les em dash sont remplacés par un tiret simple, les caractères Unicode",
        "invisibles sont retirés, et les blocs d'autopromotion signalés (par exemple un footer de citation",
        "imposé) sont coupés. La licence d'origine est copiée dans chaque dossier importé.",
        "",
        "| Chemin dans la bibliothèque | Dépôt d'origine | Chemin d'origine | Commit | Licence |",
        "|---|---|---|---|---|",
    ]
    for entry in sorted(manifest["imports"], key=lambda item: item["to"]):
        source = manifest["sources"][entry["source"]]
        lines.append(
            f"| `{entry['to']}` | [{source['repo']}](https://github.com/{source['repo']}) "
            f"| `{entry['from']}` | `{source['commit'][:12]}` | {source['license']} |"
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
    write_third_party(manifest)


if __name__ == "__main__":
    main()
