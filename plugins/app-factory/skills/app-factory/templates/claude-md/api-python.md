# {project}

{one sentence: what the product does, for whom}. Brief: `docs/product/brief.md`, PRD: `docs/product/prd.md`,
architecture: `docs/architecture/`. app-factory state: `.app-factory/state.json`.

## Stack

Python {3.13}, {FastAPI | Django}, {SQLAlchemy 2 + Alembic}, Postgres {17}, uv, Docker container,
deployment {platform}.

## Commands

| Goal | Command |
|---|---|
| Install | `uv sync --locked` |
| Run | `uv run uvicorn {package}.main:app --reload` |
| Check everything | `make ci` (ruff, mypy, pytest, audit) |
| Tests | `uv run pytest` |
| Migration | `uv run alembic revision --autogenerate -m "<subject>"` then `uv run alembic upgrade head` |
| Local database | `docker compose up -d db` |

## Map

- `src/{package}/`: application (routes, services, models), `tests/`: tests.
- `alembic/versions/`: migrations, one per change, reversible.
- `openapi.json`: published contract, regenerated and compared in CI.

## Definition of done

- The `make ci` target (or its equivalent) passes locally before handing back; `ci-ok` green on the PR.
- A new behaviour has its test; a fixed bug has a test that reproduced it.
- Touched docs updated (README, `docs/ops/ci.md`, ADR if a decision changes).

## Rules

- Per-language rules: `.claude/rules/ultime/` (loaded according to the touched files). Guardrails through
  hooks: `.claude/guardrails.json` (do not bypass them; a rule that gets in the way is reported).
- Branch and PR for every change, never a push to the main branch.
- Secrets in `.env` (ignored by git), template in `.env.example`. Local database for development.
