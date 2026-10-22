"""Tests of ultime-profile's suggest_profile.py on throwaway repositories.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import json
import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SKILL_DIR = Path(__file__).resolve().parents[2] / "authored" / "ultime-profile" / "skills" / "ultime-profile"
SCRIPT = SKILL_DIR / "scripts" / "suggest_profile.py"
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
        self.assertTrue({"ci-forge", "fullstack", "ui-design", "mobile-expo"} <= packs)
        self.assertNotIn("data-engineering", packs)
        self.assertTrue({"guardrails", "ponytail"}.isdisjoint(packs))
        self.assertEqual({p["pack"] for p in result["user_level"]}, {"guardrails", "ponytail"})
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
        self.assertEqual(result["user_level"], [])
        self.assertEqual(result["permissions"]["ask"], [])

    def test_walk_skips_symlinks_and_junctions(self):
        root = build({"main.py": "", "real/inner.py": ""})
        outside = build({"secret.py": "", "package.json": json.dumps({"dependencies": {"torch": "2"}})})
        linked = 0
        try:
            os.symlink(outside, root / "link", target_is_directory=True)
            linked += 1
        except (OSError, NotImplementedError):
            pass
        if os.name == "nt":
            import _winapi
            _winapi.CreateJunction(str(outside), str(root / "junction"))
            _winapi.CreateJunction(str(root), str(root / "real" / "loop"))
            linked += 1
        if not linked:
            self.skipTest("cannot create links here")
        self.assertEqual(sorted(suggest_profile.files_of(root)), ["main.py", "real/inner.py"])
        self.assertNotIn("ml-engineering", {p["pack"] for p in suggest_profile.suggest(root)["packs"]})

    def test_dependencies_reads_only_manifests(self):
        root = build({"big.bin": "x", "src/app.py": "", "package.json": "{}"})
        read = []
        original = Path.read_text
        with mock.patch.object(Path, "read_text", lambda self, *a, **k: read.append(self.name) or original(self, *a, **k)):
            suggest_profile.dependencies(root, suggest_profile.files_of(root))
        self.assertEqual(read, ["package.json"])

    def test_bom_manifests_and_requirements_folder(self):
        root = build({"requirements/base.txt": "fastapi==0.120\n", "web/x.ts": ""})
        (root / "web" / "package.json").write_text(json.dumps({"dependencies": {"next": "16"}}), encoding="utf-8-sig")
        (root / "pyproject.toml").write_text('[project]\ndependencies = ["torch"]\n', encoding="utf-8-sig")
        deps = suggest_profile.dependencies(root, suggest_profile.files_of(root))
        self.assertTrue({"fastapi", "next", "torch"} <= deps)
        (root / ".claude").mkdir()
        (root / ".claude" / "settings.json").write_text(json.dumps({"permissions": {"allow": ["Bash(ls *)"]}}), encoding="utf-8-sig")
        suggest_profile.write_permissions(root, "project", {"allow": ["Bash(make test *)"], "ask": []})
        allow = json.loads((root / ".claude" / "settings.json").read_text(encoding="utf-8"))["permissions"]["allow"]
        self.assertEqual(allow, ["Bash(ls *)", "Bash(make test *)"])

    def test_monorepo_and_folder_globs(self):
        root = build({
            "services/api/go.mod": "module api\n",
            "apps/app/pubspec.yaml": "flutter:\n",
            "deploy/Dockerfile.prod": "FROM x\n",
            "k8s/deploy.yaml": "kind: Deployment\n",
        })
        result = suggest_profile.suggest(root)
        reasons = " ".join(r for p in result["packs"] for r in p["because"])
        for signal in ("api (**/go.mod)", "flutter", "containers (**/Dockerfile.*)", "kubernetes (**/k8s/**/*.y*ml)"):
            self.assertIn(signal, reasons)
        self.assertTrue({"go", "docker", "kubernetes"} <= set(result["rules"]))
        self.assertTrue(suggest_profile.matches("k8s/a.yaml", "**/k8s/**/*.y*ml"))
        self.assertTrue(suggest_profile.matches("a/b/k8s/c/d.yml", "**/k8s/**/*.y*ml"))
        self.assertFalse(suggest_profile.matches("k8s.yaml", "**/k8s/**/*.y*ml"))
        self.assertFalse(suggest_profile.matches("src/a.py", "*.py"))

    def test_every_rule_has_paths_and_is_selectable(self):
        stack_map = json.loads((SKILL_DIR / "references" / "stack-map.json").read_text(encoding="utf-8"))
        self.assertNotIn("rules", stack_map)
        rules = sorted(SKILL_DIR.glob("rules/*.md"))
        self.assertTrue(rules)
        for rule in rules:
            globs = suggest_profile.rule_paths(rule)
            self.assertTrue(globs, rule.name)
            for glob in globs:
                sample = re.sub(r"\*\*/", "a/", glob).replace("**", "x").replace("*", "x").replace("?", "x")
                root = build({sample: "", "package.json": json.dumps({"dependencies": {"react": "19"}})})
                self.assertIn(rule.stem, suggest_profile.suggest(root)["rules"], f"{rule.name}: {glob}")

    def test_react_rule_needs_react(self):
        root = build({"app/main.py": "", "pyproject.toml": '[project]\ndependencies = ["fastapi"]\n'})
        self.assertNotIn("react", suggest_profile.suggest(root)["rules"])

    def test_skill_table_matches_stack_map(self):
        stack_map = json.loads((SKILL_DIR / "references" / "stack-map.json").read_text(encoding="utf-8"))
        signals = {s["id"]: set(s["packs"]) for s in stack_map["signals"]}
        rows = [line for line in (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8").splitlines() if re.search(r"\| signals? `", line)]
        covered = set()
        for row in rows:
            _, _, source, packs, _ = row.split("|")
            ids = re.findall(r"`([\w-]+)`", source)
            covered.update(ids)
            listed = {p.strip() for p in packs.split(";")[0].split(",") if " " not in p.strip()}
            self.assertEqual(listed, set().union(*(signals[i] for i in ids)), row)
        self.assertEqual(covered, set(signals) - {"database"})


if __name__ == "__main__":
    unittest.main()
