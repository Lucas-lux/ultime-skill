"""Prepare a GitHub repository for autopilot. Run by the owner, on their machine, from the project root.

Without --apply it only prints the plan. With --apply it:
- moves the app-factory state (.app-factory/, from an interactive G0) to the root of the branch
  claude/autopilot-state, switches it to the autopilot autonomy level and adds the autopilot block, then
  mounts that branch as a worktree at .app-factory/ (the old folder is kept as .app-factory.pre-autopilot/);
- creates the labels (decision, autopilot, needs-human, autopilot-dashboard) and the pinned dashboard issue;
- turns on auto-merge and branch deletion after merge in the repository settings;
- sets the AUTOPILOT_OWNER variable;
- copies the autopilot workflows into .github/workflows/ (never overwrites) and ignores .app-factory/.
It creates nothing on Claude or in any cloud: the scheduled task, its environment and the secrets stay
manual steps (see references/setup.md), printed at the end.

Usage:
    python init_autopilot.py [--repo owner/name] [--owner login] [--base main] [--apply]
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

STATE_BRANCH = "claude/autopilot-state"
TEMPLATES = Path(__file__).resolve().parent.parent / "templates" / "workflows"
LABELS = {
    "decision": ("d93f0b", "Decision qui attend le proprietaire"),
    "autopilot": ("0e8a16", "PR autopilot, fusion automatique si les checks requis sont verts"),
    "needs-human": ("fbca04", "A relire et fusionner a la main"),
    "autopilot-dashboard": ("5319e7", "Tableau de bord autopilot"),
}
AUTOPILOT_BLOCK = {
    "repo": None,
    "owner": None,
    "base_branch": None,
    "dashboard_issue": None,
    "paused": False,
    "allow_defaults": False,
    "default_after_hours": 72,
    "spend_free_threshold": 0,
    "lock": None,
    "last_run": None,
    "budget": {
        "per_run": {"agents": 8, "stories": 3, "upgraded": 1},
        "per_day": {"agents": 30},
        "usage": {"day": None, "agents": 0},
    },
}
DASHBOARD = ("<!-- autopilot -->\n**Autopilot** : initialise, en attente du premier reveil.\n\n"
             "Les decisions qui t'attendent arrivent en issues `decision` qui te sont assignees. ✨\n")


def run(*cmd: str, cwd: Path | None = None, check: bool = True) -> str:
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"error: {' '.join(cmd)}\n{result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


# Tests replace the GitHub CLI by a Python stub (path in INIT_AUTOPILOT_GH_STUB).
GH = [sys.executable, os.environ["INIT_AUTOPILOT_GH_STUB"]] if os.environ.get("INIT_AUTOPILOT_GH_STUB") else ["gh"]


def gh(*args: str, check: bool = True) -> str:
    return run(*GH, *args, check=check)


def gh_api(*args: str, check: bool = True) -> str:
    return gh("api", *args, check=check)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", help="owner/name (default: gh repo view)")
    parser.add_argument("--owner", help="GitHub login that answers decisions (default: gh api user)")
    parser.add_argument("--base", help="branch the PRs target (default: the repository default branch)")
    parser.add_argument("--apply", action="store_true", help="do it; without this flag only print the plan")
    args = parser.parse_args()

    root = Path(run("git", "rev-parse", "--show-toplevel"))
    branch_exists = bool(run("git", "ls-remote", "--heads", "origin", STATE_BRANCH))
    state = None
    # A re-run (to refresh workflows or labels) is fine once the state has moved to its branch.
    if not branch_exists:
        state_file = root / ".app-factory" / "state.json"
        if not state_file.exists():
            print("error: no .app-factory/state.json. Run the app-factory framing (G0) in an interactive session first.",
                  file=sys.stderr)
            sys.exit(1)
        state = json.loads(state_file.read_text(encoding="utf-8-sig"))
        if state.get("gates", {}).get("G0", {}).get("status") != "approved":
            print("error: gate G0 is not approved in state.json: autopilot never does the framing on its own.",
                  file=sys.stderr)
            sys.exit(1)

    repo = args.repo or gh("repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner")
    owner = args.owner or gh_api("user", "--jq", ".login")
    base = args.base or gh_api(f"repos/{repo}", "--jq", ".default_branch")
    workflows = [t.name for t in sorted(TEMPLATES.glob("*.yml"))
                 if not (root / ".github" / "workflows" / t.name).exists()]

    print(f"repo      {repo}  (owner {owner}, base {base})")
    print(f"state     {'already on ' + STATE_BRANCH if branch_exists else 'move .app-factory/ to ' + STATE_BRANCH}")
    print(f"labels    {', '.join(LABELS)}")
    print("settings  allow_auto_merge, delete_branch_on_merge, variable AUTOPILOT_OWNER")
    print(f"workflows {', '.join(workflows) or 'already present'}")
    if not args.apply:
        print("\ndry run: nothing changed. Re-run with --apply.")
        return

    for name, (color, description) in LABELS.items():
        gh_api(f"repos/{repo}/labels", "-f", f"name={name}", "-f", f"color={color}",
               "-f", f"description={description}", check=False)
    gh_api("-X", "PATCH", f"repos/{repo}", "-F", "allow_auto_merge=true", "-F", "delete_branch_on_merge=true")
    gh("variable", "set", "AUTOPILOT_OWNER", "--body", owner, "--repo", repo)

    if not branch_exists:
        block = state.get("autopilot") or json.loads(json.dumps(AUTOPILOT_BLOCK))
        block.update({"repo": repo, "owner": owner, "base_branch": base})
        if not block.get("dashboard_issue"):
            # A previous run may have created it before failing: reuse it rather than open a second one.
            existing = gh_api(f"repos/{repo}/issues?labels=autopilot-dashboard&state=open", "--jq", ".[0].number // empty")
            if existing:
                block["dashboard_issue"] = int(existing)
        if not block.get("dashboard_issue"):
            with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as body:
                body.write(DASHBOARD)
            number = gh_api(f"repos/{repo}/issues", "-f", "title=Autopilot : tableau de bord ✨",
                            "-F", f"body=@{body.name}", "-f", "labels[]=autopilot-dashboard", "--jq", ".number")
            Path(body.name).unlink()
            gh("issue", "pin", number, "--repo", repo, check=False)
            block["dashboard_issue"] = int(number)
        state["autonomy"] = "autopilot"
        state["autopilot"] = block

        workdir = Path(tempfile.mkdtemp(prefix="autopilot-state-"))
        try:
            run("git", "worktree", "add", "--detach", str(workdir), cwd=root)
            run("git", "checkout", "--orphan", STATE_BRANCH, cwd=workdir)
            run("git", "rm", "-rf", "--quiet", ".", cwd=workdir)
            # The branch root holds what .app-factory/ held: mounted at .app-factory/, paths stay the same.
            shutil.copytree(root / ".app-factory", workdir, dirs_exist_ok=True)
            (workdir / "state.json").write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            run("git", "add", "-A", cwd=workdir)
            run("git", "commit", "--quiet", "-m", "chore(autopilot): initial state", cwd=workdir)
            run("git", "push", "--quiet", "-u", "origin", STATE_BRANCH, cwd=workdir)
        finally:
            run("git", "worktree", "remove", "--force", str(workdir), cwd=root, check=False)
        # Main stops tracking .app-factory/ (staged for the owner's commit); the old folder is kept aside.
        run("git", "rm", "-r", "--cached", "--quiet", "--ignore-unmatch", ".app-factory", cwd=root)
        (root / ".app-factory").rename(root / ".app-factory.pre-autopilot")
        run("git", "fetch", "--quiet", "origin", f"+refs/heads/{STATE_BRANCH}:refs/remotes/origin/{STATE_BRANCH}", cwd=root)
        run("git", "worktree", "add", "--quiet", "-B", STATE_BRANCH, ".app-factory", f"origin/{STATE_BRANCH}", cwd=root)

    (root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
    for name in workflows:
        shutil.copy2(TEMPLATES / name, root / ".github" / "workflows" / name)
    gitignore = root / ".gitignore"
    lines = gitignore.read_text(encoding="utf-8").splitlines() if gitignore.exists() else []
    missing = [entry for entry in (".app-factory/", ".app-factory.pre-autopilot/") if entry not in lines]
    if missing:
        gitignore.write_text("\n".join(lines + missing) + "\n", encoding="utf-8")

    print(f"""
done. Still to do by hand (references/setup.md):
  1. Commit on a branch and merge: .gitignore, .github/workflows/, the export of .claude/ and the removal of
     .app-factory/ from {base} (already staged). The state lives on {STATE_BRANCH}, mounted at .app-factory/.
  2. Ruleset on {base}: pull request required, check ci-ok required, no direct or force push, and no bypass
     for anyone, admins included (the merge token below is yours).
  3. Secret AUTOPILOT_MERGE_TOKEN (fine-grained token, this repository only, contents and pull requests).
  4. Environments: staging without reviewer, production with you as required reviewer.
  5. Create the scheduled task on claude.ai/code, then the secrets AUTOPILOT_FIRE_URL and AUTOPILOT_FIRE_TOKEN.""")


if __name__ == "__main__":
    main()
