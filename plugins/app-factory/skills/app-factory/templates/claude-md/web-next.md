# {project}

{one sentence: what the product does, for whom}. Brief: `docs/product/brief.md`, PRD: `docs/product/prd.md`,
architecture: `docs/architecture/`. app-factory state: `.app-factory/state.json`.

## Stack

Next.js {version} (App Router), React {version}, strict TypeScript, {package manager: pnpm}, {style: Tailwind},
{data: Prisma + Postgres}, {auth}, deployment {Vercel | container}.

## Commands

| Goal | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Dev | `pnpm dev` (http://localhost:3000) |
| Check everything | `make ci` (lint, typing, tests, build) |
| Unit tests | `pnpm test` |
| End to end | `pnpm exec playwright test` |
| Local database | `docker compose up -d db` then `pnpm prisma migrate dev` |

## Map

- `app/`: routes (server components by default), `app/api/`: API routes.
- `components/`: shared UI (design system in `components/ui/`).
- `lib/`: business logic and data access (never imported by a client component if it reads a secret).
- `e2e/`: Playwright journeys.

## Definition of done

- The `make ci` target (or its equivalent) passes locally before handing back; `ci-ok` green on the PR.
- A new behaviour has its test; a fixed bug has a test that reproduced it.
- Touched docs updated (README, `docs/ops/ci.md`, ADR if a decision changes).

## Rules

- Per-language rules: `.claude/rules/ultime/` (loaded according to the touched files). Guardrails through
  hooks: `.claude/guardrails.json` (do not bypass them; a rule that gets in the way is reported).
- Branch and PR for every change, never a push to the main branch.
- Secrets in `.env` (ignored by git), template in `.env.example`. Local database for development.
