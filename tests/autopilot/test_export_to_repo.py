"""Tests of autopilot's export_to_repo.py against the built plugins/ directory.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "authored" / "app-factory" / "skills" / "autopilot" / "scripts" / "export_to_repo.py"
PLUGINS = ROOT / "plugins"


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
        self.assertFalse(any("CLAUDE_PLUGIN_ROOT" in c for c in commands))

    def test_reexport_is_idempotent(self):
        export(self.target, "--packs", "mobile")
        first = sorted(self.commands())
        export(self.target, "--packs", "mobile")
        self.assertEqual(sorted(self.commands()), first)

    def test_ported_ponytail_hook_runs_from_the_project(self):
        export(self.target)
        settings = json.loads((self.target / ".claude" / "settings.json").read_text(encoding="utf-8"))
        command = next(h["command"] for g in settings["hooks"]["SessionStart"] for h in g["hooks"] if "ponytail" in h["command"])
        result = subprocess.run([shutil.which("bash") or "bash", "-c", command], input=json.dumps({"hook_event_name": "SessionStart", "source": "startup"}),
                                capture_output=True, text=True,
                                env={**__import__("os").environ, "CLAUDE_PROJECT_DIR": str(self.target),
                                     "CLAUDE_CONFIG_DIR": str(self.target / "config")})
        self.assertIn("PONYTAIL MODE ACTIVE", result.stdout)


if __name__ == "__main__":
    unittest.main()
