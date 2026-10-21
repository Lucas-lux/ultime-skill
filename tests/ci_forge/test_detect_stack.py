"""Tests of ci-forge's detect_stack.py on throwaway repositories.

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "authored" / "ci-forge" / "skills" / "ci-forge" / "scripts" / "detect_stack.py"
spec = importlib.util.spec_from_file_location("detect_stack", SCRIPT)
detect_stack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(detect_stack)


def build(files: dict[str, str]) -> Path:
    """Write a repository from a {relative path: content} map and return its root."""
    root = Path(tempfile.mkdtemp(prefix="ci-forge-test-"))
    for relative, content in files.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    return root


class DetectStackTest(unittest.TestCase):
    def test_next_app_with_pnpm(self):
        root = build({
            "package.json": json.dumps({"dependencies": {"next": "16.0.0", "react": "19.0.0"},
                                        "devDependencies": {"typescript": "5.9.0", "@playwright/test": "1.64.0", "vitest": "4.0.0"},
                                        "scripts": {"build": "next build", "test": "vitest"}}),
            "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
            ".nvmrc": "24\n",
            "node_modules/x/package.json": "{}",
        })
        report = detect_stack.detect(root)
        self.assertEqual(len(report["components"]), 1)
        app = report["components"][0]
        self.assertEqual((app["language"], app["package_manager"], app["node_version"]), ("typescript", "pnpm", "24"))
        self.assertIn("next", app["frameworks"])
        self.assertTrue({"playwright", "vitest"} <= set(app["tools"]))

    def test_fastapi_uv_with_docker_helm_terraform(self):
        root = build({
            "pyproject.toml": '[project]\nname = "api"\nrequires-python = ">=3.13"\ndependencies = ["fastapi>=0.120", "sqlalchemy", "alembic"]\n'
                              '[dependency-groups]\ndev = ["pytest", "ruff", {include-group = "lint"}]\nlint = ["mypy"]\n[tool.ruff]\nline-length = 100\n',
            "uv.lock": "version = 1\n",
            "alembic.ini": "[alembic]\n",
            "Dockerfile": "FROM python:3.13-slim\n",
            "compose.yaml": "services: {}\n",
            "deploy/chart/Chart.yaml": "apiVersion: v2\nname: api\n",
            "deploy/k8s/deployment.yaml": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\n",
            "infra/main.tf": 'terraform {\n  required_version = ">= 1.9"\n}\n',
            ".github/workflows/old.yml": "on: push\n",
        })
        report = detect_stack.detect(root)
        api = report["components"][0]
        self.assertEqual((api["language"], api["package_manager"], api["requires_python"]), ("python", "uv", ">=3.13"))
        self.assertTrue({"fastapi", "sqlalchemy", "alembic"} <= set(api["frameworks"]))
        self.assertTrue({"pytest", "ruff", "mypy"} <= set(api["tools"]))
        self.assertTrue(api["alembic"])
        self.assertEqual(report["containers"], {"dockerfiles": ["Dockerfile"], "compose": ["compose.yaml"]})
        self.assertEqual(report["kubernetes"]["helm_charts"], ["deploy/chart"])
        self.assertIn("deploy/k8s/deployment.yaml", report["kubernetes"]["manifests"])
        self.assertEqual(report["iac"]["terraform"], ["infra"])
        self.assertEqual(report["ci"]["github_workflows"], [".github/workflows/old.yml"])

    def test_monorepo_lists_each_component(self):
        root = build({
            "package.json": json.dumps({"workspaces": ["apps/*"], "devDependencies": {"turbo": "2.0.0"}}),
            "package-lock.json": "{}",
            "apps/web/package.json": json.dumps({"dependencies": {"vite": "7.0.0", "react": "19.0.0"}}),
            "apps/mobile/package.json": json.dumps({"dependencies": {"expo": "54.0.0", "react-native": "0.81.0"}}),
            "services/worker/go.mod": "module worker\n\ngo 1.25\n",
        })
        report = detect_stack.detect(root)
        paths = {c["path"]: c for c in report["components"]}
        self.assertEqual(set(paths), {".", "apps/web", "apps/mobile", "services/worker"})
        self.assertTrue(paths["."]["workspaces"])
        self.assertIn("expo", paths["apps/mobile"]["frameworks"])
        self.assertEqual(paths["services/worker"]["go_version"], "1.25")

    def test_null_keys_and_bom_manifests(self):
        root = build({"web/package.json": "", "api/pyproject.toml": ""})
        (root / "web" / "package.json").write_text(json.dumps({"dependencies": None, "devDependencies": {"typescript": "5"},
                                                              "scripts": None, "engines": None}), encoding="utf-8-sig")
        (root / "api" / "pyproject.toml").write_text('[project]\nrequires-python = ">=3.13"\ndependencies = ["django"]\n', encoding="utf-8-sig")
        paths = {c["path"]: c for c in detect_stack.detect(root)["components"]}
        self.assertEqual(paths["web"]["language"], "typescript")
        self.assertEqual(paths["web"]["scripts"], [])
        self.assertEqual(paths["api"]["requires_python"], ">=3.13")
        self.assertIn("django", paths["api"]["frameworks"])

    def test_android_from_manifest_with_version_catalog(self):
        root = build({
            "settings.gradle.kts": 'include(":app")\n',
            "build.gradle.kts": "plugins {\n    alias(libs.plugins.android.application) apply false\n}\n",
            "gradle/libs.versions.toml": '[plugins]\nandroid-application = { id = "com.android.application", version = "8.13.0" }\n',
            "app/build.gradle.kts": "plugins {\n    alias(libs.plugins.android.application)\n}\n",
            "app/src/main/AndroidManifest.xml": "<manifest />\n",
        })
        report = detect_stack.detect(root)
        self.assertTrue(report["mobile_native"]["android"])
        self.assertTrue(all(c["android"] for c in report["components"]))

    def test_requirements_folder(self):
        root = build({"requirements/base.txt": "flask==3.1\n", "requirements/dev.txt": "pytest\nruff\n", "app.py": ""})
        components = detect_stack.detect(root)["components"]
        self.assertEqual([c["path"] for c in components], ["."])
        self.assertIn("flask", components[0]["frameworks"])
        self.assertTrue({"pytest", "ruff"} <= set(components[0]["tools"]))


if __name__ == "__main__":
    unittest.main()
