---
name: sast
description: >
  Tooled local static security analysis with Semgrep and CodeQL: rule selection by stack, execution,
  triage of results into true and false positives, fixes and custom rules. Use for "semgrep", "codeql",
  "SAST", "static analysis", or to complement a security review.
---

# Static analysis (Semgrep, CodeQL)

The tool finds candidates; the proof comes from triage. An untriaged result is neither a finding nor a
false positive. For CI integration, see the `ci-forge` skill (reference `security.md`); this skill is
for local analyses, deeper ones, and for triage.

## Choose the tool

- **Semgrep** (CE, `--metrics=off`): fast, every stack, readable rules; default first pass.
- **CodeQL**: inter-procedural data flow, slower; for compiled languages and when Semgrep leaves doubts
  about a source-to-sink path. Free for local analysis and public repositories; in the CI of a private
  repository, GitHub Advanced Security is required.
- Native tools as a complement when the stack has them: bandit (already covered by ruff's `S` rules),
  gosec, Brakeman, PHPStan with security extensions.

## Semgrep

1. Isolated install: `uvx semgrep` (or the `semgrep/semgrep` image in Docker); version noted in the
   report.
2. Rules by detected stack: `p/default` plus `p/<language>` (`p/python`, `p/javascript`,
   `p/typescript`, `p/golang`, `p/java`, `p/php`), and `p/secrets`, `p/dockerfile`, `p/terraform`,
   `p/kubernetes` if those files exist.
3. `semgrep scan --metrics=off --config <rules> --sarif --output semgrep.sarif --error .` excluding
   generated folders and dependencies (`.semgrepignore`).
4. Custom rule when a project-specific pattern recurs (dangerous internal function, call without an
   authorization check): `.semgrep/<name>.yml` with a test (`semgrep --test`), then add it to the CI.

## CodeQL

1. CodeQL CLI (official bundle, version noted), one database per language:
   `codeql database create db-<lang> --language=<lang> --source-root . [--command "<build>"]` (compiled
   languages: the project's build command).
2. `codeql database analyze db-<lang> codeql/<lang>-queries:codeql-suites/<lang>-security-extended.qls
   --format=sarif-latest --output codeql-<lang>.sarif`.
3. Databases and SARIF outside the repository (or ignored by git): they are large and regenerable.

## Triage

For each result, in order:
1. Is the code reachable in production (not a test, an example, dead code)?
2. Is the source controlled by an attacker (request, file, webhook, external variable)?
3. Does a protection on the path cancel it (validation, escaping by the framework, parameterized
   query, constraining type)? Cite it with `file:line`.
4. Verdict: **true positive** (goes into the `security-review` review with its severity), **false
   positive** (reason in one line, then a narrow exception: `nosemgrep: <rule>` comment with the reason,
   or `.semgrepignore` for a folder), **to verify** (named lead).
- Group results of the same rule: triage one representative thoroughly, then check that the others
  follow the same path before applying the verdict to them.
- Never disable a whole rule to silence a result.

## Deliver

In the `security-review` report (or `docs/security/sast-<date>.md` if run alone): tools and versions,
rules used, number of results per verdict, table of true positives, list of exceptions added with their
reason. SARIF files stay as artifacts, not in the repository.
