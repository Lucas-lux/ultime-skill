---
name: ci-forge
description: >
  Generates on its own the most complete CI/CD for a project from its stack and target architecture:
  lint, format, typing, tests and coverage, end to end, build, containers, Kubernetes, IaC, security,
  SBOM, staging and prod deployment, local hooks, updates. Use to create, complete, audit or harden a
  CI, a pipeline, GitHub Actions, or "ci-forge".
---

# Tailored CI/CD, hands-off

Autonomous mission: no question to the user except a secret to provide or a repository setting that only
they can make. The result is a PR that makes the CI green on the current code, or that fixes the code so
it becomes green. A CI that passes by weakening the checks is a failure.

References (read only those of the detected stack):
- [references/workflow-rules.md](references/workflow-rules.md): structure, levels, workflow security. Always.
- [references/python.md](references/python.md), [references/node.md](references/node.md) (Next.js, React, Expo
  web), [references/containers-k8s.md](references/containers-k8s.md), [references/iac.md](references/iac.md),
  [references/mobile.md](references/mobile.md), [references/other-languages.md](references/other-languages.md)
  (Go, Rust, JVM, PHP, Ruby, shell and PowerShell scripts).
- [references/security.md](references/security.md): secrets, dependencies, SAST, SBOM, provenance. Always.
- [references/cd.md](references/cd.md): staging, production, environments, OIDC, autopilot.

## 1. Understand the project

1. `python <skill>/scripts/detect_stack.py .` (Python 3.11 or later, for `tomllib`; otherwise
   `uv run --python 3.13 <skill>/scripts/detect_stack.py .`): components (language, package manager,
   frameworks, tools already configured), containers, Kubernetes, IaC, existing CI, task runner, local
   hooks.
2. Target architecture and hosting: ADRs and `docs/architecture/`, `.app-factory/state.json` (stack, P3),
   README, platform files (`vercel.json`, `fly.toml`, `render.yaml`, `app.json`, `eas.json`,
   `wrangler.toml`, Helm charts). Without a known target: full CI, CD limited to the artifact build, and
   note it in the report.
3. Existing CI: keep it if it is sound, complete and harden it; list the gaps against the references
   (missing job, unpinned action, broad permissions, disabled check).

## 2. Design

- A table: component x level (PR, main branch, nightly, release) x job, with the exact command.
  Everything that applies to the detected stack is included; what requires a missing secret is prepared
  but conditional (see 5).
- **A single source for commands**: each check is a target of the project's task runner
  (`Makefile`, `justfile`, `package.json` scripts, `noxfile.py`) that the CI calls; locally, the same
  command gives the same result. Aggregate `ci` target that chains the fast checks.
- Thresholds: coverage set at the current level rounded down (ratchet, it can only go up), never an
  arbitrary number that breaks or protects nothing.
- Single required check `ci-ok` (final job that depends on all the others): it is the one branch
  protection and autopilot require, jobs can change without touching the GitHub settings.

## 3. Generate

- `.github/workflows/ci.yml` (PR and main branch), `nightly.yml` (long checks, scheduled),
  `release.yml` or `deploy.yml` (see `cd.md`); local composite actions for the repeated installation.
- `.github/dependabot.yml`: each detected ecosystem plus `github-actions`, grouping of minor updates,
  weekly cadence.
- Fast local hooks: `lefthook.yml` (Node or polyglot project) or `.pre-commit-config.yaml`
  (Python): format, lint of modified files, secret scanning. Never long tests.
- Configuration of tools missing but expected (ruff, ESLint or Biome, strict tsconfig, Playwright,
  hadolint, kubeconform...): create with strict rules; if the existing code violates them, fix the code,
  or for debt that is too large, a per-file list of exceptions, dated and tracked in `docs/ops/ci.md`,
  never a rule turned off globally.
- `docs/ops/ci.md`: each job, what it guarantees, the local command, the expected secrets.

## 4. Pin and validate

1. `python <skill>/scripts/pin_actions.py --latest .github/workflows`: each action pinned by SHA,
   version in a comment. An action that changes major version: read its `action.yml` at the pinned
   version (`gh api repos/<owner>/<repo>/contents/action.yml?ref=<tag>`) and adjust the inputs.
   Every action from the references must go through this script before use: a `@vN` without a moving
   major tag (e.g. `astral-sh/setup-uv`) does not resolve as is. The script fails on a reference it
   cannot resolve (short SHA, major without an x.y.z version) and reports the `uses:` lines it does not
   understand (`warning`): fix them by hand.
2. `actionlint` then `zizmor` (workflow security audit): `uvx zizmor .github/workflows` or
   `docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/zizmorcore/zizmor:1.31.1 .github/workflows`; for
   actionlint, the binary if installed, otherwise
   `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -color` (version verified on 2026-10-21, to re-verify).
   No error left.
3. **Run every task runner target locally, without exception**: it is the only proof that the CI will
   be green (a file written by the mission itself can break the lint). Missing tool: run it in the
   official image (`ghcr.io/astral-sh/uv:python<version>-bookworm-slim`, `node:<lts>`,
   `golang:<version>`...), never install it globally or skip the step. On Windows with Git Bash,
   prefix `docker run` with `MSYS_NO_PATHCONV=1` and mount an absolute path (`-v "C:/path:/repo"`).
   A failure is a real problem: fix the code (or the tool's config if it is wrong), not the check. Only
   jobs that require CI infrastructure (kind, OS matrix, macOS) are validated on the PR.
4. Coverage threshold **measured** by the local run, never estimated by reading the code.

## 5. Deliver

- Branch `ci/forge-<date>` (`claude/ci-forge-<date>` in autopilot), commits per topic. The push and the PR
  follow the project's autonomy level: on their own in autopilot, otherwise after the user's consent
  (the rest of the mission is done without them). PR in the user's language with the jobs table, the gaps fixed, the
  checks done and what remains conditional. Wait for the PR's CI and fix until green.
- Missing secrets (deployment, private registry, `EXPO_TOKEN`, `CODECOV_TOKEN`...): the job exists and
  skips cleanly. `secrets` is forbidden in a step `if:`: copy the secret into `env:` at the job level
  (`X: ${{ secrets.X }}`) and test `if: env.X != ''`; or carry the job through the GitHub environment.
  The list of secrets to create goes in the PR.
- File whose write is refused (hook, protected file such as a hooks config): do not get around it; put
  its exact content in the PR and flag it as a step to validate. In autopilot: a single decision card that groups them.
- Settings only the user makes: protection of the main branch with `ci-ok` required, `staging` and
  `production` environments (mandatory reviewer), GitHub Advanced Security if the repository is private
  and CodeQL or dependency-review are wanted. List them, with the exact `gh` commands.
- In app-factory: state updated, `ci-ok` noted as a required check in `state.json` (autopilot block).

## When to call it

- app-factory: milestone M0 (skeleton) for the CI, P6 for the CD; resume mode after the audit.
- Existing project: on request, or as soon as the stack changes (new component, Dockerfile, chart).
- Periodic review (nightly or monthly in autopilot): `pin_actions.py` without `--latest` and Dependabot
  keep versions up to date; rerun the gap audit once per quarter.
