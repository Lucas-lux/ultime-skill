"""Tests of autopilot's export_to_repo.py against the built plugins/ directory.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "authored" / "app-factory" / "skills" / "autopilot" / "scripts" / "export_to_repo.py"
PLUGINS = ROOT / "plugins"


def posix_bash() -> str | None:
    """The bash Claude Code runs hooks with: Git Bash on Windows (a bare "bash" there may be WSL's launcher)."""
    if os.name != "nt":
        return shutil.which("bash")
    git = shutil.which("git")
    if not git:
        return None
    # git.exe sits in Git/cmd or Git/mingw64/bin depending on the shell; bash.exe is in Git/bin.
    for git_root in Path(git).resolve().parents:
        candidate = git_root / "bin" / "bash.exe"
        if candidate.exists() and (git_root / "usr").is_dir():
            return str(candidate)
    return None


def export(target: Path, *args: str) -> str:
    return subprocess.run([sys.executable, "-I", str(SCRIPT), "--target", str(target), "--source", str(PLUGINS), *args],
                          capture_output=True, text=True, check=True).stdout


@unittest.skipUnless(shutil.which("node") and (PLUGINS / "ponytail").exists(), "needs node and a built plugins/")
class ExportTest(unittest.TestCase):
    def setUp(self):
        self.target = Path(tempfile.mkdtemp(prefix="export-test-"))
        subprocess.run(["git", "init", "-q", "-b", "main"], cwd=self.target, check=True)
        settings = self.target / ".claude" / "settings.json"
        settings.parent.mkdir()
        settings.write_text(json.dumps({"hooks": {"PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "echo mine"}]}]}}))

    def commands(self) -> list[str]:
        settings = json.loads((self.target / ".claude" / "settings.json").read_text(encoding="utf-8"))
        return [h["command"] for groups in settings["hooks"].values() for g in groups for h in g["hooks"]]

    def test_always_exports_guardrails_and_ponytail_with_hooks(self):
        output = export(self.target, "--packs", "mobile")
        self.assertIn("packs   app-factory, guardrails, ponytail, mobile", output)
        self.assertTrue((self.target / ".claude" / "skills" / "autopilot" / "SKILL.md").exists())
        self.assertTrue((self.target / ".claude" / "hooks" / "ponytail" / "hooks" / "ponytail-activate.js").exists())
        self.assertTrue((self.target / ".claude" / "hooks" / "guardrails" / "guard.cjs").exists())
        commands = self.commands()
        self.assertIn("echo mine", commands)
        self.assertTrue(any("CLAUDE_PROJECT_DIR + '/.claude/hooks/ponytail'" in c for c in commands))
        # The plugin root is set to the project copy, never read from the (unset) plugin variable.
        self.assertFalse(any("process.env.CLAUDE_PLUGIN_ROOT" in c or "${CLAUDE_PLUGIN_ROOT}" in c for c in commands))

    def test_reexport_is_idempotent(self):
        export(self.target, "--packs", "mobile")
        first = sorted(self.commands())
        export(self.target, "--packs", "mobile")
        self.assertEqual(sorted(self.commands()), first)

    @unittest.skipUnless(posix_bash(), "needs bash (Git Bash on Windows)")
    def test_ported_ponytail_hook_runs_from_the_project(self):
        export(self.target)
        settings = json.loads((self.target / ".claude" / "settings.json").read_text(encoding="utf-8"))
        command = next(h["command"] for g in settings["hooks"]["SessionStart"] for h in g["hooks"] if "ponytail" in h["command"])
        result = subprocess.run([posix_bash(), "-c", command], input=json.dumps({"hook_event_name": "SessionStart", "source": "startup"}),
                                capture_output=True, text=True,
                                env={**os.environ, "CLAUDE_PROJECT_DIR": str(self.target),
                                     "CLAUDE_CONFIG_DIR": str(self.target / "config")})
        self.assertIn("PONYTAIL MODE ACTIVE", result.stdout)

    def test_reexport_without_packs_keeps_previous_packs(self):
        export(self.target, "--packs", "mobile")
        settings = self.target / ".claude" / "settings.json"
        data = json.loads(settings.read_text(encoding="utf-8"))
        data["enabledPlugins"] = {"mobile@ultime-skill": False}
        settings.write_text(json.dumps(data), encoding="utf-8")
        output = export(self.target)
        self.assertIn("mobile", output.split("packs", 1)[1].splitlines()[0])

    @unittest.skipUnless(posix_bash(), "needs bash (Git Bash on Windows)")
    def test_ported_superpowers_hook_finds_its_skills(self):
        export(self.target, "--packs", "superpowers")
        settings = json.loads((self.target / ".claude" / "settings.json").read_text(encoding="utf-8"))
        command = next(h["command"] for g in settings["hooks"]["SessionStart"] for h in g["hooks"] if "superpowers" in h["command"])
        result = subprocess.run([posix_bash(), "-c", command], input=json.dumps({"hook_event_name": "SessionStart", "source": "startup"}),
                                capture_output=True, text=True, env={**os.environ, "CLAUDE_PROJECT_DIR": str(self.target)})
        self.assertIn("superpowers", result.stdout)
        self.assertNotIn("Error reading", result.stdout)


if __name__ == "__main__":
    unittest.main()
