"""Tests of ultime-profile's suggest_profile.py on throwaway repositories.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "authored" / "ultime-profile" / "skills" / "ultime-profile" / "scripts" / "suggest_profile.py"
spec = importlib.util.spec_from_file_location("suggest_profile", SCRIPT)
suggest_profile = importlib.util.module_from_spec(spec)
spec.loader.exec_module(suggest_profile)


def build(files: dict[str, str]) -> Path:
    root = Path(tempfile.mkdtemp(prefix="profile-test-"))
    for relative, content in files.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    return root


class SuggestProfileTest(unittest.TestCase):
    def test_next_and_expo_monorepo(self):
        root = build({
            "pnpm-lock.yaml": "",
            "apps/web/package.json": json.dumps({"dependencies": {"next": "16.0.0", "react": "19.0.0"}}),
            "apps/web/app/page.tsx": "export default function Page() { return null }\n",
            "apps/mobile/package.json": json.dumps({"dependencies": {"expo": "54.0.0"}}),
            "apps/web/e2e/home.spec.ts": "",
            "node_modules/django/package.json": "{}",
        })
        result = suggest_profile.suggest(root)
        packs = {p["pack"] for p in result["packs"]}
        self.assertTrue({"guardrails", "ponytail", "ci-forge", "fullstack", "ui-design", "mobile-expo"} <= packs)
        self.assertNotIn("data-engineering", packs)
        self.assertEqual(set(result["rules"]), {"typescript", "react", "tests"})
        self.assertIn("Bash(pnpm test *)", result["permissions"]["allow"])
        self.assertIn("Bash(npm publish *)", result["permissions"]["ask"])

    def test_writes_rules_and_merges_permissions(self):
        root = build({"main.py": "print('x')\n", "uv.lock": "", ".claude/settings.json": json.dumps({"permissions": {"allow": ["Bash(ls *)"]}})})
        result = suggest_profile.suggest(root)
        suggest_profile.write_rules(root, result["rules"])
        suggest_profile.write_permissions(root, "project", result["permissions"])
        suggest_profile.write_permissions(root, "project", result["permissions"])
        self.assertTrue((root / ".claude" / "rules" / "ultime" / "python.md").read_text(encoding="utf-8").startswith("---\npaths:"))
        settings = json.loads((root / ".claude" / "settings.json").read_text(encoding="utf-8"))
        allow = settings["permissions"]["allow"]
        self.assertEqual(allow[0], "Bash(ls *)")
        self.assertEqual(len(allow), len(set(allow)))
        self.assertIn("Bash(uv run pytest *)", allow)

    def test_documents_only_repo_gets_no_code_packs(self):
        root = build({"README.md": "# notes\n"})
        result = suggest_profile.suggest(root)
        self.assertEqual(result["packs"], [])
        self.assertEqual(result["permissions"]["ask"], [])


if __name__ == "__main__":
    unittest.main()
