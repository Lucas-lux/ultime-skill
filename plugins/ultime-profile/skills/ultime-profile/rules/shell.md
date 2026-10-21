---
paths:
  - "**/*.sh"
  - "**/*.bash"
  - "**/Makefile"
  - "**/justfile"
---

# Shell

- `set -euo pipefail` en tete de script bash ; variables entre guillemets (`"$var"`).
- Jamais un script telecharge puis execute a la volee : telechargement epingle, verifie (somme
  SHA-256), lu, puis execute.
- Chemins temporaires par `mktemp`, nettoyes par `trap`.
- Script propre pour `shellcheck`.
