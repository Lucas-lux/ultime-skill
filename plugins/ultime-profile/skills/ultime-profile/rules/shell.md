---
paths:
  - "**/*.sh"
  - "**/*.bash"
  - "**/Makefile"
  - "**/justfile"
---

# Shell

- `set -euo pipefail` at the top of a bash script; variables in double quotes (`"$var"`).
- Never a script downloaded then executed on the fly: pinned download, verified (SHA-256 checksum),
  read, then executed.
- Temporary paths through `mktemp`, cleaned up by `trap`.
- Script clean for `shellcheck`.
