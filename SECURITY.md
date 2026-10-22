# Security policy

## Reporting a vulnerability

Please do not open a public issue. Report it privately through
[GitHub private vulnerability reporting](https://github.com/Lucas-lux/ultime-skill/security/advisories/new),
with the affected file or pack, the agent and its version, and the steps to reproduce.

You will get an acknowledgement within a week. Fixes are released on `main`; there are no maintained
older versions.

## Scope

In scope:

- the guardrails engine and its adapters (`authored/guardrails/runtime/`): a bypass of a blocking rule, a
  crash that lets a forbidden action through, a hook that blocks everything;
- the installers (`bin/`, `install.sh`, `install.ps1`) and the build scripts (`scripts/`): writing outside
  the intended folders, running untrusted code, a checksum not enforced;
- in-house skills and agents (`authored/`) that instruct an agent to do something unsafe;
- an imported skill that hides malicious instructions or code (also report it upstream).

Out of scope: vulnerabilities of the coding agents themselves, and of the tools the skills drive (report
them to their vendors).

## What the library does to stay safe

- Imported skills are copied from commits pinned in `scripts/gen_vendor.py`; their scripts are never run
  at import time, invisible Unicode is stripped, and `scripts/check.py` flags risky shell patterns for
  review.
- External binaries installed by `--with-tools` are pinned versions checked against a recorded SHA-256.
- The `sec-offense` pack (authorized pentest) is in no bundle and is installed only when named.
