"""Tests of autopilot's init_autopilot.py against a local bare origin and a stub of the GitHub CLI.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "authored" / "app-factory" / "skills" / "autopilot" / "scripts" / "init_autopilot.py"
STUB = '''import sys
args = sys.argv[1:]
with open(__file__ + ".log", "a", encoding="utf-8") as log:
    log.write(" ".join(args) + "\\n")
if args[:2] == ["repo", "view"]:
    print("o/r")
elif args[:2] == ["api", "user"]:
    print("owner1")
elif args[:2] == ["api", "repos/o/r"] and ".default_branch" in args:
    print("main")
elif args[:2] == ["api", "repos/o/r/issues"]:
    print("7")
'''


def git(cwd: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True).stdout.strip()


class InitAutopilotTest(unittest.TestCase):
    def setUp(self):
        base = Path(tempfile.mkdtemp(prefix="init-autopilot-test-"))
        self.origin = base / "origin.git"
        self.repo = base / "repo"
        git(base, "init", "-q", "--bare", "-b", "main", str(self.origin))
        git(base, "clone", "-q", str(self.origin), str(self.repo))
        git(self.repo, "config", "user.email", "t@example.com")
        git(self.repo, "config", "user.name", "T")
        state = {"version": 1, "project": "demo", "autonomy": "standard", "gates": {"G0": {"status": "approved"}}}
        (self.repo / ".app-factory").mkdir()
        (self.repo / ".app-factory" / "state.json").write_text(json.dumps(state), encoding="utf-8")
        (self.repo / ".app-factory" / "decisions.md").write_text("# Decisions\n", encoding="utf-8")
        (self.repo / "README.md").write_text("demo\n", encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "chore: init")
        git(self.repo, "push", "-q", "origin", "main")
        self.stub = base / "gh_stub.py"
        self.stub.write_text(STUB, encoding="utf-8")

    def run_init(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, "-I", str(SCRIPT), *args], cwd=self.repo, capture_output=True, text=True,
                              env={**os.environ, "INIT_AUTOPILOT_GH_STUB": str(self.stub)})

    def test_dry_run_changes_nothing(self):
        result = self.run_init()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("dry run", result.stdout)
        self.assertEqual(git(self.repo, "ls-remote", "--heads", "origin", "claude/autopilot-state"), "")

    def test_apply_moves_state_to_its_branch_and_mounts_it(self):
        result = self.run_init("--apply")
        self.assertEqual(result.returncode, 0, result.stderr)
        files = git(self.repo, "ls-tree", "--name-only", "origin/claude/autopilot-state").splitlines()
        self.assertEqual(sorted(files), ["decisions.md", "state.json"])
        state = json.loads(git(self.repo, "show", "origin/claude/autopilot-state:state.json"))
        self.assertEqual(state["autonomy"], "autopilot")
        self.assertEqual(state["autopilot"]["dashboard_issue"], 7)
        self.assertEqual(state["autopilot"]["owner"], "owner1")
        self.assertTrue((self.repo / ".app-factory" / ".git").is_file(), "state mounted as a worktree")
        self.assertTrue((self.repo / ".app-factory" / "decisions.md").exists())
        self.assertTrue((self.repo / ".app-factory.pre-autopilot" / "state.json").exists())
        self.assertNotIn(".app-factory/state.json", git(self.repo, "ls-files"))
        gitignore = (self.repo / ".gitignore").read_text(encoding="utf-8").splitlines()
        self.assertIn(".app-factory/", gitignore)
        self.assertTrue((self.repo / ".github" / "workflows" / "autopilot-merge.yml").exists())

    def test_rerun_after_apply_succeeds_without_a_second_dashboard(self):
        self.assertEqual(self.run_init("--apply").returncode, 0)
        log = Path(str(self.stub) + ".log")
        before = log.read_text(encoding="utf-8").count("api repos/o/r/issues -f title")
        result = self.run_init("--apply")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(log.read_text(encoding="utf-8").count("api repos/o/r/issues -f title"), before)


if __name__ == "__main__":
    unittest.main()
