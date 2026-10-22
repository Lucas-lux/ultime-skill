# Workflow structure and security

Versions verified on 2026-10-21 (majors of actions and tools). Every action written from these
references is pinned by `pin_actions.py --latest` before use, never left as `@vN`: some have no moving
major tag (`astral-sh/setup-uv`, `sigstore/cosign-installer`), hence their exact version here. For a
tool, `git ls-remote --tags https://github.com/<owner>/<repo>`.

## Levels

| Level | Trigger | Content | Budget |
|---|---|---|---|
| PR | `pull_request` | format, lint, typing, unit and integration tests, build, secrets, dependencies, workflows, container and manifests if touched | < 10 min |
| Main | `push` to the main branch | PR + full end to end, trial deployment (kind), SBOM, published image, staging | < 25 min |
| Nightly | `schedule` (cron) + `workflow_dispatch` | full matrix (versions, OS), mutation, load (k6) and Lighthouse on staging, Scorecard, dependency audit | free |
| Release | `v*` tag or `release: published` | artifacts, provenance, signing, production | per CD |

`paths` or `dorny/paths-filter@v4` to run heavy jobs (container, kind, mobile) only if their files
change. A skipped job (path filter, `if:`) counts as a failure for `alls-green`: list it in
`allowed-skips` of `ci-ok`, and only it (a job that is always expected never appears there).

## ci.yml skeleton

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
  merge_group:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
defaults:
  run:
    shell: bash
jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup       # action composite : runtime, cache, installation figee
      - run: make lint
  # typecheck, test, build, e2e, security, container, k8s, iac... depending on the stack
  ci-ok:
    if: always()
    needs: [lint, typecheck, test, build, security, e2e, container, k8s]   # every job, skippable ones included
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: re-actors/alls-green@release/v1
        with:
          jobs: ${{ toJSON(needs) }}
          allowed-skips: e2e, container, k8s   # exactly the jobs filtered by paths-filter or if:
```

## Enforced rules

- `permissions: contents: read` at the top; each job widens only what it uses
  (`packages: write`, `id-token: write`, `security-events: write`, `pull-requests: write`).
- Actions pinned by SHA with the version in a comment; Dependabot `github-actions` updates them.
- `persist-credentials: false` on each checkout that does not push.
- `timeout-minutes` on each job; `concurrency` that cancels obsolete PR runs, never those of the main
  branch or of deployments.
- Never a `${{ github.event.* }}` expression (title, branch, body) in a `run:`: pass it through `env:`
  (injection). `pull_request_target` forbidden except for an explicit need, and then without checking
  out the PR code.
- No secret in logs or artifacts; `environment:` for every deployment secret.
- Caches through the `setup-*` actions (key = lockfile); frozen installation (`--frozen-lockfile`,
  `npm ci`, `uv sync --locked`), never floating resolution in CI.
- Useful artifacts on failure (Playwright report, coverage, SARIF) with `if: failure()` or
  `always()` and a short `retention-days` (7).
- Stable and short job names (`lint`, `typecheck`, `test`, `build`, `e2e`, `security`, `container`,
  `k8s`, `iac`, `mobile`): they show up in PRs.
- `merge_group` present to work with a merge queue.
- Validation: `actionlint` (1.7.12) and `zizmor` (1.31.1) without errors before the PR.
- Local actions: `uses: ./.github/actions/<name>`. zizmor (`self-repository`) suggests the `$/` syntax
  that actionlint 1.7.12 still refuses: keep `./` and declare the exception in `.github/zizmor.yml`
  with its reason and a review date.
- Condition on an optional secret: `env:` at the job level then `if: env.X != ''` (never
  `secrets.X` in an `if:`).

## Local hooks

- `lefthook.yml` (lefthook 2.2.2): `pre-commit` in parallel on staged files (format, lint),
  `pre-push` for typing and fast tests if under 30 s. Installation through the project's manager
  (`lefthook` as a devDependency and `lefthook install` in a `prepare` script).
- `.pre-commit-config.yaml` (pre-commit 4.7.0) for Python: ruff (`ruff-check --fix`, `ruff-format`),
  basic checks (end of file, YAML, large files), gitleaks.
- Local hooks never replace the CI: they only save a round trip.
