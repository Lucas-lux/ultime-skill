"""Detect what a repository is made of, for CI generation. Prints a JSON report on stdout.

Reads manifests only (never runs project code). The report lists components (one per project root in a
monorepo), their language, package manager, frameworks, test and lint tools already configured, plus
repository-wide facts: containers, Kubernetes, infrastructure as code, existing CI, task runner.

Usage:
    python detect_stack.py [repo_root]
"""

import json
import re
import sys
import tomllib
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", "target", "vendor", ".terraform",
             "__pycache__", ".tox", "coverage", ".turbo", "Pods", ".gradle", ".dart_tool", "out"}
MAX_DEPTH = 4
# Loose source files reveal languages that have no manifest (scripts, hooks, tooling).
EXTENSIONS = {".py": "python", ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript", ".ts": "typescript",
              ".sh": "shell", ".bash": "shell", ".ps1": "powershell", ".go": "go", ".rs": "rust", ".rb": "ruby",
              ".php": "php", ".java": "java", ".kt": "kotlin", ".swift": "swift", ".dart": "dart", ".sql": "sql",
              ".tf": "terraform", ".lua": "lua"}


def walk(root: Path, depth: int = 0):
    """Yield files under root, skipping dependency and build folders, up to MAX_DEPTH levels."""
    try:
        entries = sorted(root.iterdir())
    except OSError:
        return
    for entry in entries:
        if entry.is_dir():
            if entry.name not in SKIP_DIRS and depth < MAX_DEPTH and not entry.name.startswith("."):
                yield from walk(entry, depth + 1)
            elif entry.name in {".github", ".gitlab", ".circleci"}:
                yield from walk(entry, depth + 1)
        else:
            yield entry


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def read_toml(path: Path) -> dict:
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def node_component(directory: Path) -> dict:
    manifest = read_json(directory / "package.json")
    deps = {**manifest.get("dependencies", {}), **manifest.get("devDependencies", {})}
    scripts = manifest.get("scripts", {})
    managers = [("pnpm", "pnpm-lock.yaml"), ("yarn", "yarn.lock"), ("bun", "bun.lockb"), ("bun", "bun.lock"), ("npm", "package-lock.json")]
    manager = next((name for name, lock in managers if (directory / lock).exists()), None)
    if not manager and manifest.get("packageManager"):
        manager = manifest["packageManager"].split("@")[0]
    frameworks = [name for name, dep in [
        ("next", "next"), ("react", "react"), ("vue", "vue"), ("nuxt", "nuxt"), ("svelte", "svelte"),
        ("sveltekit", "@sveltejs/kit"), ("astro", "astro"), ("remix", "@remix-run/react"), ("vite", "vite"),
        ("nestjs", "@nestjs/core"), ("express", "express"), ("fastify", "fastify"), ("hono", "hono"),
        ("expo", "expo"), ("react-native", "react-native"), ("electron", "electron"), ("prisma", "prisma"),
        ("drizzle", "drizzle-orm"), ("storybook", "storybook"), ("trpc", "@trpc/server"),
    ] if dep in deps]
    tools = [name for name, dep in [
        ("typescript", "typescript"), ("eslint", "eslint"), ("biome", "@biomejs/biome"), ("prettier", "prettier"),
        ("vitest", "vitest"), ("jest", "jest"), ("playwright", "@playwright/test"), ("cypress", "cypress"),
        ("testing-library", "@testing-library/react"), ("knip", "knip"), ("size-limit", "size-limit"),
        ("lighthouse-ci", "@lhci/cli"), ("axe", "@axe-core/playwright"), ("stryker", "@stryker-mutator/core"),
        ("turbo", "turbo"), ("nx", "nx"), ("lefthook", "lefthook"), ("husky", "husky"),
    ] if dep in deps]
    engines = manifest.get("engines", {}).get("node")
    nvmrc = text(directory / ".nvmrc").strip() or text(directory / ".node-version").strip() or None
    return {"language": "typescript" if "typescript" in tools else "javascript", "package_manager": manager or "npm",
            "frameworks": frameworks, "tools": tools, "scripts": sorted(scripts), "node_version": nvmrc or engines,
            "workspaces": bool(manifest.get("workspaces")) or (directory / "pnpm-workspace.yaml").exists()}


def python_component(directory: Path) -> dict:
    pyproject = read_toml(directory / "pyproject.toml")
    project = pyproject.get("project", {})
    tool = pyproject.get("tool", {})
    declared = list(project.get("dependencies", []))
    for group in [*project.get("optional-dependencies", {}).values(), *(pyproject.get("dependency-groups") or {}).values()]:
        # A dependency group may also hold {"include-group": ...} tables: keep the requirement strings only.
        declared += [item for item in group if isinstance(item, str)]
    deps_text = " ".join(declared)
    deps_text += " " + text(directory / "requirements.txt") + " " + text(directory / "requirements-dev.txt")
    deps_text += " " + json.dumps(tool.get("poetry", {}).get("dependencies", {})) + json.dumps(tool.get("poetry", {}).get("group", {}))
    lowered = deps_text.lower()
    manager = ("uv" if (directory / "uv.lock").exists() else "poetry" if (directory / "poetry.lock").exists() or "poetry" in tool
               else "pdm" if (directory / "pdm.lock").exists() else "pip")
    frameworks = [name for name in ["django", "fastapi", "flask", "starlette", "litestar", "celery", "sqlalchemy", "alembic",
                                    "pydantic", "airflow", "dbt-core", "torch", "streamlit", "scrapy"]
                  if re.search(rf"(^|[\s\"'\[,]){re.escape(name)}([\s\"'<>=~!\[,;]|$)", lowered)]
    tools = [name for name in ["ruff", "mypy", "pyright", "basedpyright", "pytest", "pytest-cov", "hypothesis", "black",
                               "isort", "flake8", "pylint", "bandit", "pre-commit", "tox", "nox", "mutmut", "schemathesis",
                               "deptry", "pip-audit", "coverage", "pytest-xdist", "testcontainers"]
             if name in tool or re.search(rf"(^|[\s\"'\[,]){re.escape(name)}([\s\"'<>=~!\[,;]|$)", lowered)]
    return {"language": "python", "package_manager": manager, "frameworks": frameworks, "tools": sorted(set(tools)),
            "requires_python": project.get("requires-python") or tool.get("poetry", {}).get("dependencies", {}).get("python"),
            "python_version_file": text(directory / ".python-version").strip() or None,
            "django_manage": (directory / "manage.py").exists(),
            "alembic": (directory / "alembic.ini").exists()}


SIMPLE_COMPONENTS = {
    "go.mod": ("go", lambda d: {"go_version": next(iter(re.findall(r"^go (\S+)", text(d / "go.mod"), re.M)), None),
                                "tools": [t for t in ["golangci"] if any(d.glob(".golangci.*"))]}),
    "Cargo.toml": ("rust", lambda d: {"workspace": "[workspace]" in text(d / "Cargo.toml"),
                                      "tools": [t for t, f in [("cargo-deny", "deny.toml"), ("clippy", "clippy.toml")] if (d / f).exists()]}),
    "pom.xml": ("java", lambda d: {"build": "maven"}),
    "build.gradle": ("jvm", lambda d: {"build": "gradle", "android": "com.android" in text(d / "build.gradle")}),
    "build.gradle.kts": ("jvm", lambda d: {"build": "gradle", "android": "com.android" in text(d / "build.gradle.kts")}),
    "composer.json": ("php", lambda d: {"frameworks": [f for f in ["laravel/framework", "symfony/framework-bundle"]
                                                       if f in json.dumps(read_json(d / "composer.json"))],
                                        "tools": [t for t, f in [("phpstan", "phpstan.neon"), ("phpstan", "phpstan.neon.dist"),
                                                                 ("phpunit", "phpunit.xml"), ("phpunit", "phpunit.xml.dist")] if (d / f).exists()]}),
    "Gemfile": ("ruby", lambda d: {"frameworks": ["rails"] if "rails" in text(d / "Gemfile") else []}),
    "pubspec.yaml": ("dart", lambda d: {"frameworks": ["flutter"] if "flutter:" in text(d / "pubspec.yaml") else []}),
    "Package.swift": ("swift", lambda d: {"build": "swiftpm"}),
}


def detect(root: Path) -> dict:
    files = list(walk(root))
    rel = lambda p: p.relative_to(root).as_posix()
    components = []
    seen = set()
    for file in files:
        directory = file.parent
        key = None
        if file.name == "package.json" and directory not in seen:
            key, info = "node", node_component(directory)
        elif file.name in {"pyproject.toml", "setup.py", "requirements.txt"} and ("python", directory) not in seen:
            seen.add(("python", directory))
            key, info = "python", python_component(directory)
        elif file.name in SIMPLE_COMPONENTS:
            language, extra = SIMPLE_COMPONENTS[file.name]
            if (language, directory) in seen:
                continue
            seen.add((language, directory))
            key, info = language, {"language": language, **extra(directory)}
        if key == "node":
            seen.add(directory)
        if key:
            components.append({"path": rel(directory) if directory != root else ".", **info})

    any_xcode = [rel(f) for f in files if f.suffix in {".xcodeproj", ".xcworkspace"} or f.name == "project.pbxproj"]
    dockerfiles = [rel(f) for f in files if f.name == "Dockerfile" or f.name.startswith("Dockerfile.") or f.suffix == ".dockerfile"]
    compose = [rel(f) for f in files if re.fullmatch(r"(docker-)?compose(\.[\w-]+)?\.ya?ml", f.name)]
    k8s_manifests = []
    for f in files:
        if f.suffix in {".yaml", ".yml"} and "apiVersion:" in (content := text(f))[:4000] and re.search(r"^kind:\s*(Deployment|Service|Ingress|StatefulSet|CronJob|ConfigMap|Kustomization)", content, re.M):
            k8s_manifests.append(rel(f))
    helm = [rel(f.parent) for f in files if f.name == "Chart.yaml"]
    kustomize = [rel(f.parent) for f in files if f.name in {"kustomization.yaml", "kustomization.yml"}]
    terraform = sorted({rel(f.parent) for f in files if f.suffix in {".tf", ".tofu"}})
    workflows = [rel(f) for f in files if rel(f).startswith(".github/workflows/") and f.suffix in {".yml", ".yaml"}]
    other_ci = [rel(f) for f in files if f.name in {".gitlab-ci.yml", "Jenkinsfile", "azure-pipelines.yml", "bitbucket-pipelines.yml"}
                or rel(f).startswith(".circleci/")]
    task_runners = [name for name in ["Makefile", "justfile", "Taskfile.yml", "Taskfile.yaml", "noxfile.py", "tox.ini"] if (root / name).exists()]
    local_hooks = [name for name in [".pre-commit-config.yaml", "lefthook.yml", ".lefthook.yml", ".husky"] if (root / name).exists()]
    languages: dict[str, int] = {}
    for f in files:
        language = EXTENSIONS.get(f.suffix.lower())
        if language:
            languages[language] = languages.get(language, 0) + 1
    migrations = sorted({rel(f.parent) for f in files if f.parent.name in {"migrations", "versions"} and f.suffix in {".py", ".sql"}}
                        | {rel(f.parent) for f in files if f.name == "schema.prisma"})
    return {
        "root": str(root),
        "components": components,
        "mobile_native": {"ios": bool(any_xcode), "android": any(c.get("android") for c in components)},
        "containers": {"dockerfiles": dockerfiles, "compose": compose},
        "kubernetes": {"manifests": k8s_manifests[:50], "helm_charts": helm, "kustomize": kustomize},
        "iac": {"terraform": terraform, "pulumi": (root / "Pulumi.yaml").exists(), "serverless": (root / "serverless.yml").exists()},
        "ci": {"github_workflows": workflows, "other": other_ci, "dependabot": (root / ".github" / "dependabot.yml").exists(),
               "renovate": any((root / n).exists() for n in ["renovate.json", ".github/renovate.json", "renovate.json5"])},
        "task_runners": task_runners,
        "local_hooks": local_hooks,
        "migrations": migrations,
        "file_languages": dict(sorted(languages.items(), key=lambda item: -item[1])),
        "env_example": [rel(f) for f in files if f.name in {".env.example", ".env.sample", ".env.template"}],
    }


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not root.is_dir():
        sys.exit(f"error: {root} is not a directory")
    print(json.dumps(detect(root), indent=2))


if __name__ == "__main__":
    main()
