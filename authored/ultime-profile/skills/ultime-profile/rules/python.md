---
paths:
  - "**/*.py"
  - "**/pyproject.toml"
---

# Python

- Typage complet des fonctions publiques ; `from __future__ import annotations` inutile en 3.13+.
- Outils du projet d'abord (ruff, mypy ou pyright, pytest) : lancer `ruff check --fix` et `ruff format`
  sur les fichiers touches avant de rendre la main.
- Pas de `except Exception: pass` ; capturer l'exception precise, journaliser avec contexte.
- Chemins avec `pathlib`, dates avec fuseau (`datetime.now(tz=...)`), pas d'etat global mutable.
- Dependances declarees dans `pyproject.toml` avec le gestionnaire du projet (`uv add`, `poetry add`),
  jamais `pip install` a la main dans le projet.
- SQL : requetes parametrees uniquement ; migrations par l'outil du projet (Alembic, Django).
