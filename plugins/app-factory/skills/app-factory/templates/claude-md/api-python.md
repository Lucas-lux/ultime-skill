# {projet}

{une phrase : ce que fait le produit, pour qui}. Brief : `docs/product/brief.md`, PRD : `docs/product/prd.md`,
architecture : `docs/architecture/`. Etat app-factory : `.app-factory/state.json`.

## Stack

Python {3.13}, {FastAPI | Django}, {SQLAlchemy 2 + Alembic}, Postgres {17}, uv, conteneur Docker,
deploiement {plateforme}.

## Commandes

| But | Commande |
|---|---|
| Installer | `uv sync --locked` |
| Lancer | `uv run uvicorn {paquet}.main:app --reload` |
| Verifier tout | `make ci` (ruff, mypy, pytest, audit) |
| Tests | `uv run pytest` |
| Migration | `uv run alembic revision --autogenerate -m "<sujet>"` puis `uv run alembic upgrade head` |
| Base locale | `docker compose up -d db` |

## Carte

- `src/{paquet}/` : application (routes, services, modeles), `tests/` : tests.
- `alembic/versions/` : migrations, une par changement, reversibles.
- `openapi.json` : contrat publie, regenere et compare en CI.

## Definition of done

- La cible `make ci` (ou son equivalent) passe en local avant de rendre la main ; `ci-ok` vert sur la PR.
- Un comportement nouveau a son test ; un bug corrige a un test qui le reproduisait.
- Docs touchees mises a jour (README, `docs/ops/ci.md`, ADR si une decision change).

## Regles

- Regles par langage : `.claude/rules/ultime/` (chargees selon les fichiers touches). Garde-fous par
  hooks : `.claude/guardrails.json` (ne pas les contourner ; une regle qui gene se signale).
- Branche et PR pour tout changement, jamais de push sur la branche principale.
- Secrets dans `.env` (ignore par git), modele dans `.env.example`. Base locale pour le developpement.
