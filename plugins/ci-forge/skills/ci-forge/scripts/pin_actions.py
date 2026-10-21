"""Pin every `uses: owner/repo@ref` of GitHub workflows to a full commit SHA, with the tag as a comment.

Tags are read with `git ls-remote` (no token, public actions). By default a major tag (`@v4`) is pinned to
the latest release of that major; with --latest, to the latest stable release overall (check the action's
changelog for breaking inputs, then run actionlint). Already pinned lines keep their major unless --latest.

Usage:
    python pin_actions.py [--latest] [--dry-run] PATH...      (files or directories, e.g. .github/workflows)
"""

import argparse
import re
import subprocess
import sys
from functools import lru_cache
from pathlib import Path

USES = re.compile(r"^(?P<prefix>\s*(?:-\s+)?uses:\s*)(?P<action>[\w.-]+/[\w.-]+)(?P<path>/[^@\s]*)?@(?P<ref>[^\s#]+)(?P<comment>\s*#\s*(?P<tag>\S+))?\s*$")
SEMVER = re.compile(r"^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$")
SHA = re.compile(r"^[0-9a-f]{40}$")


@lru_cache(maxsize=None)
def remote_tags(action: str) -> dict[str, str]:
    """Map each tag of an action repository to the commit it points to (annotated tags peeled)."""
    result = subprocess.run(["git", "ls-remote", "--tags", f"https://github.com/{action}"],
                            capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"cannot list tags of {action}: {result.stderr.strip()[:200]}")
    tags: dict[str, str] = {}
    for line in result.stdout.splitlines():
        sha, ref = line.split("\t")
        name = ref.removeprefix("refs/tags/")
        if name.endswith("^{}"):
            tags[name[:-3]] = sha
        else:
            tags.setdefault(name, sha)
    return tags


@lru_cache(maxsize=None)
def remote_branches(action: str) -> dict[str, str]:
    """Map each branch of an action repository to its head commit (actions like @stable or @release/v1)."""
    result = subprocess.run(["git", "ls-remote", "--heads", f"https://github.com/{action}"],
                            capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"cannot list branches of {action}: {result.stderr.strip()[:200]}")
    return {ref.removeprefix("refs/heads/"): sha for sha, ref in (line.split("	") for line in result.stdout.splitlines())}


def version(tag: str) -> tuple[int, int, int] | None:
    match = SEMVER.match(tag)
    return tuple(int(part or 0) for part in match.groups()) if match else None


def resolve(action: str, ref: str, tag: str | None, latest: bool) -> tuple[str, str]:
    """Return (sha, tag) for the release to pin."""
    tags = remote_tags(action)
    wanted = tag or ref
    if not version(wanted) and wanted not in tags:
        branches = remote_branches(action)
        if wanted in branches:
            return branches[wanted], wanted
    releases = [(version(name), name) for name in tags if version(name) and name.count(".") == 2]
    if not releases:
        if wanted in tags:
            return tags[wanted], wanted
        raise RuntimeError(f"{action}: no release tag found for {wanted}")
    if not latest and version(wanted):
        major = version(wanted)[0]
        releases = [release for release in releases if release[0][0] == major] or releases
    _, best = max(releases)
    return tags[best], best


def pin_file(path: Path, latest: bool, dry_run: bool) -> tuple[list[str], list[str]]:
    changes, errors = [], []
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    for index, line in enumerate(lines):
        match = USES.match(line.rstrip("\r\n"))
        # Local actions (./path) are skipped; docker:// images never match the owner/repo pattern.
        if not match or match["action"].startswith("."):
            continue
        ref, tag = match["ref"], match["tag"]
        if SHA.match(ref) and not tag:
            continue  # pinned without a tag comment: leave it, nothing to resolve from
        try:
            sha, new_tag = resolve(match["action"], ref, tag if SHA.match(ref) else None, latest)
        except (RuntimeError, subprocess.TimeoutExpired) as error:
            errors.append(f"{path.as_posix()}:{index + 1}  {error}")
            continue
        updated = f"{match['prefix']}{match['action']}{match['path'] or ''}@{sha} # {new_tag}"
        ending = line[len(line.rstrip("\r\n")):]
        if updated != line.rstrip("\r\n"):
            changes.append(f"{path.as_posix()}:{index + 1}  {match['action']}@{ref} -> {new_tag}")
            lines[index] = updated + ending
    if changes and not dry_run:
        path.write_text("".join(lines), encoding="utf-8")
    return changes, errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--latest", action="store_true", help="move to the latest stable release, majors included")
    parser.add_argument("--dry-run", action="store_true", help="print the changes, write nothing")
    args = parser.parse_args()
    files = [f for p in args.paths for f in ([p] if p.is_file() else sorted([*p.rglob("*.yml"), *p.rglob("*.yaml")]))]
    failures = 0
    for file in files:
        changes, errors = pin_file(file, args.latest, args.dry_run)
        for change in changes:
            print(change)
        for error in errors:
            print(f"error   {error}", file=sys.stderr)
        failures += len(errors)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
