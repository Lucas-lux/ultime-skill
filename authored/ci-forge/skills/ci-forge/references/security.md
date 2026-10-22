# Security in the CI (every project)

| Job | Tool | Level | Notes |
|---|---|---|---|
| secrets | gitleaks 8.30.1 as a CLI (pinned and verified binary, or the `zricethezav/gitleaks:v8.30.1` image): `gitleaks git --redact --exit-code 1` on the PR history | PR | the official action requires a license for organization accounts: use the CLI |
| deps | `google/osv-scanner-action` (reusable workflow `osv-scanner-reusable-pr.yml`, v2.7.0): new vulnerabilities introduced by the PR | PR | free, all ecosystems |
| deps-review | `actions/dependency-review-action@v5`: forbidden licenses, vulnerabilities | PR | public repository, or private with GitHub Advanced Security |
| sast | `github/codeql-action@v4` (init, autobuild, analyze), `security-extended` queries | PR + nightly | public, or private with Advanced Security |
| sast (without GHAS) | Semgrep CE 1.182: `semgrep scan --config p/default --config p/<language> --metrics=off --error` | PR | replaces CodeQL on a private repository without a license |
| workflows | `zizmor .github/workflows` (1.31.1) and `actionlint` (1.7.12) | PR | |
| iac and images | Trivy (`config`, `image`), see `containers-k8s.md` and `iac.md` | PR | |
| sbom and provenance | SPDX SBOM, `actions/attest-build-provenance@v4` | main, release | |
| scorecard | `ossf/scorecard-action@v2.5.0` | nightly | public repository only |
| dast | OWASP ZAP baseline (`zaproxy/action-baseline`) against staging | nightly | never against production without consent |

- SARIF results published in the security tab if Advanced Security is available
  (`security-events: write`), otherwise as an artifact and as a job failure.
- Exceptions (false positives) are in the tool's file (`.gitleaks.toml`, `.trivyignore`,
  `.semgrepignore`), one line per exception, with the reason and a review date.
- The `security` pack (skills `security-review`, `sast`, `auditing-supply-chain`, `gha-security-review`) is
  used to analyze the results; ci-forge installs the checks.
