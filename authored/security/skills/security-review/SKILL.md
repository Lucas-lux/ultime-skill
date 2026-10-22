---
name: security-review
description: >
  Security review of a project, a branch or a PR with the house method: scope, choice of the right
  review, evidence, severity, minimal tested fix, report. Use for "security review",
  "security audit", "find the vulnerabilities", before a merge or a production release.
---

# Security review

Single entry point: this skill sets the method and the deliverable, and delegates the in-depth analysis
to the specialized skill that fits. A review without evidence is not a review: every finding is
demonstrated.

## 1. Frame

- **Scope**: a diff (PR, branch, commit), a module, or the whole repository. Without detail: the diff of
  the current branch against the main branch if there is one, otherwise the whole repository.
- **Context**: existing threat model (`docs/security/`), data handled (personal, payment, health),
  exposed surfaces (public API, upload, webhooks, auth), target environment.
- **Load**: a diff under 400 lines is read in full; beyond that, triage first (files that touch auth,
  authorization, external inputs, queries, crypto, configuration, CI).

## 2. Choose the review

| Need | Skill | Pack |
|---|---|---|
| Diff, PR, branch | `reviewing-code-changes` | security |
| Full repository or module | `auditing-code-for-vulnerabilities` (passes, variants, false positive elimination) | security |
| No threat model | `security-threat-model` first | security |
| OWASP and ASVS categories | `owasp-security` | security |
| Tooled static analysis | `sast` (Semgrep, CodeQL) | security |
| Dependencies and supply chain | `auditing-supply-chain` | security |
| GitHub Actions workflows | `gha-security-review` | security |
| Cryptography | `reviewing-cryptography` | sec-audit |
| LLM, agents, MCP | `securing-ai-systems`, `auditing-mcp-servers` | sec-audit |
| Mobile | `mobile-security-masvs` | mobile |

Always, in addition: the list of design footguns in [references/footguns.md](references/footguns.md)
over the code and configuration touched.

## 3. Prove each finding

- A finding = a concrete path: attacker-controlled source, transformations, dangerous sink, with
  `file:line` at each step. No path, no finding.
- **Confidence**: `certain` (full path verified, ideally reproduced by a test or a request locally),
  `probable` (path verified, one condition not proven, stated explicitly), `to verify` (lead). Only
  `certain` and `probable` are findings; leads go in a separate section.
- Before keeping a finding: look for the protection that would cancel it (upstream validation,
  middleware, ORM that parameterizes, framework configuration). Finding it = false positive, note it in
  one line.
- A confirmed finding: look for its **variants** (same pattern elsewhere in the repository) before
  reporting it; a fix that leaves a variant closes nothing.
- Secret found: type, file, line, since when (git history), never the value, neither in the report nor
  in a command.

## 4. Grade

- **Blocking**: exploitable without authentication or by any user, impact on other people's data,
  money, code execution or an exposed secret. Nothing merges or ships to production.
- **Major**: exploitable under a realistic condition (role, configuration, interaction), or a clear
  weakening of an existing control.
- **Minor**: defense in depth, hardening, hygiene.

## 5. Fix

- The smallest fix that closes the cause and its variants (ponytail method), with a test that fails
  before and passes after. Never weaken another control to make the fix pass.
- What the review fixes on its own: the repository's code and configuration, on a branch, with a PR.
- What belongs to the user (decision card in autopilot): rotation of an exposed secret, purge of the git
  history, data breach notification (`compliance` pack), production hotfix, acceptance of a risk.

## 6. Deliver

Report in the user's language in `docs/security/review-<date>-<scope>.md`:

```
# Security review: <scope> (<date>)
Scope and method: <diff or repository, skills used, tools run with their version>
| # | Severity | Confidence | Finding | Evidence (file:line, path) | Fix | Status |
False positives ruled out: <one line each, with the protection found>
Leads to verify: <...>
Not covered: <what was not looked at and why>
```

In the PR or the app-factory gate: the table and the verdict (blocking findings remaining or not), the
detail stays in the file.
