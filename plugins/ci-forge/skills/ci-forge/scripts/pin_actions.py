"""Pin every `uses: owner/repo@ref` of GitHub workflows to a full commit SHA, with the tag as a comment.

Tags are read with `git ls-remote` (no token, public actions). By default a major tag (`@v4`) is pinned to
the latest release of that major; with --latest, to the latest stable release overall (check the action's
changelog for breaking inputs, then run actionlint). Already pinned lines keep their major unless --latest.
A ref that is neither a version, a tag nor a branch (a short SHA), or a major with no x.y.z release, is an
error, never a silent jump. A `uses:` line the script cannot parse is reported as a warning. Line endings
are kept as they are.

Usage:
    python pin_actions.py [--latest] [--dry-run] PATH...      (files or directories, e.g. .github/workflows)
"""

import argparse
import os
import re
import subprocess
import sys
from functools import lru_cache
from pathlib import Path

USES = re.compile(r"^(?P<prefix>\s*(?:-\s+)?uses:\s*)(?P<quote>[\"']?)(?P<action>[\w.-]+/[\w.-]+)(?P<path>/[^@\s\"']*)?"
                  r"@(?P<ref>[^\s#\"']+)(?P=quote)(?P<comment>\s*#\s*(?P<tag>\S+)(?P<rest>.*?))?\s*$")
ANY_USES = re.compile(r"^\s*(?:-\s+)?uses:\s*(?P<value>.*)$")
SEMVER = re.compile(r"^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$")
SHA = re.compile(r"^[0-9a-f]{40}$")
# Never wait on a credential prompt (git or Git Credential Manager): a private or missing repo just fails.
GIT_ENV = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"}


def ls_remote(action: str, kind: str) -> list[tuple[str, str]]:
    """(sha, ref) pairs of `git ls-remote --tags|--heads` on the action repository."""
    result = subprocess.run(["git", "ls-remote", f"--{kind}", f"https://github.com/{action}"],
                            capture_output=True, text=True, timeout=60, env=GIT_ENV)
    if result.returncode != 0:
        raise RuntimeError(f"cannot list {kind} of {action}: {result.stderr.strip()[:200]}")
    return [tuple(line.split("\t", 1)) for line in result.stdout.splitlines() if "\t" in line]


@lru_cache(maxsize=None)
def remote_tags(action: str) -> dict[str, str]:
    """Map each tag of an action repository to the commit it points to (annotated tags peeled)."""
    tags: dict[str, str] = {}
    for sha, ref in ls_remote(action, "tags"):
        name = ref.removeprefix("refs/tags/")
        if name.endswith("^{}"):
            tags[name[:-3]] = sha
        else:
            tags.setdefault(name, sha)
    return tags


@lru_cache(maxsize=None)
def remote_branches(action: str) -> dict[str, str]:
    """Map each branch of an action repository to its head commit (actions like @stable or @release/v1)."""
    return {ref.removeprefix("refs/heads/"): sha for sha, ref in ls_remote(action, "heads")}


def version(tag: str) -> tuple[int, int, int] | None:
    match = SEMVER.match(tag)
    return tuple(int(part or 0) for part in match.groups()) if match else None


def resolve(action: str, ref: str, tag: str | None, latest: bool) -> tuple[str, str]:
    """Return (sha, tag) for the release to pin; raise RuntimeError when the ref cannot be resolved safely."""
    tags = remote_tags(action)
    wanted = tag or ref
    if not version(wanted):
        if wanted in tags:
            return tags[wanted], wanted
        branches = remote_branches(action)
        if wanted in branches:
            return branches[wanted], wanted
        raise RuntimeError(f"{action}@{wanted}: not a version, a tag nor a branch (short SHA?): pin it by hand")
    releases = [(version(name), name) for name in tags if version(name) and name.count(".") == 2]
    if not latest:
        major = version(wanted)[0]
        releases = [release for release in releases if release[0][0] == major]
    if not releases:
        if wanted in tags:
            return tags[wanted], wanted
        scope = "release" if latest else f"x.y.z release of major {version(wanted)[0]}"
        raise RuntimeError(f"{action}@{wanted}: no {scope} found")
    _, best = max(releases)
    return tags[best], best


def comment_after(match: re.Match, pinned: bool) -> str:
    """Text to keep after the new tag: the comment minus its old version tag."""
    tag, rest = match["tag"], match["rest"] or ""
    if not tag or pinned or version(tag) or tag == match["ref"]:
        return rest.rstrip()
    return f" {tag}{rest}".rstrip()


def pin_file(path: Path, latest: bool, dry_run: bool) -> tuple[list[str], list[str], list[str]]:
    """Pin one workflow file; return (changes, errors, warnings), each line prefixed with path:line."""
    changes, errors, warnings = [], [], []
    with path.open(encoding="utf-8", newline="") as handle:
        lines = handle.read().splitlines(keepends=True)
    for index, line in enumerate(lines):
        body = line.rstrip("\r\n")
        where = f"{path.as_posix()}:{index + 1}"
        match = USES.match(body)
        if not match:
            loose = ANY_USES.match(body)
            value = loose["value"].strip().strip("\"'") if loose else ""
            # Local actions (./path) and docker:// images have nothing to pin; anything else is reported.
            if loose and not value.startswith(("./", "docker://")):
                warnings.append(f"{where}  uses: line not understood, pin it by hand: {body.strip()}")
            continue
        if match["action"].startswith("."):
            continue
        ref, tag = match["ref"], match["tag"]
        pinned = bool(SHA.match(ref))
        if pinned and not tag:
            continue  # pinned without a tag comment: leave it, nothing to resolve from
        try:
            sha, new_tag = resolve(match["action"], ref, tag if pinned else None, latest)
        except (RuntimeError, subprocess.TimeoutExpired) as error:
            errors.append(f"{where}  {error}")
            continue
        quote = match["quote"]
        updated = (f"{match['prefix']}{quote}{match['action']}{match['path'] or ''}@{sha}{quote}"
                   f" # {new_tag}{comment_after(match, pinned)}")
        if updated != body:
            changes.append(f"{where}  {match['action']}@{ref} -> {new_tag}")
            lines[index] = updated + line[len(body):]
    if changes and not dry_run:
        with path.open("w", encoding="utf-8", newline="") as handle:
            handle.write("".join(lines))
    return changes, errors, warnings


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--latest", action="store_true", help="move to the latest stable release, majors included")
    parser.add_argument("--dry-run", action="store_true", help="print the changes, write nothing")
    args = parser.parse_args()
    files = [f for p in args.paths for f in ([p] if p.is_file() else sorted([*p.rglob("*.yml"), *p.rglob("*.yaml")]))]
    failures = 0
    for file in files:
        changes, errors, warnings = pin_file(file, args.latest, args.dry_run)
        for change in changes:
            print(change)
        for warning in warnings:
            print(f"warning {warning}", file=sys.stderr)
        for error in errors:
            print(f"error   {error}", file=sys.stderr)
        failures += len(errors)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
