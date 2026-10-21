# {projet}

{une phrase : ce que fait le produit, pour qui}. Brief : `docs/product/brief.md`, PRD : `docs/product/prd.md`,
architecture : `docs/architecture/`. Etat app-factory : `.app-factory/state.json`.

## Stack

Next.js {version} (App Router), React {version}, TypeScript strict, {gestionnaire : pnpm}, {style : Tailwind},
{donnees : Prisma + Postgres}, {auth}, deploiement {Vercel | conteneur}.

## Commandes

| But | Commande |
|---|---|
| Installer | `pnpm install --frozen-lockfile` |
| Dev | `pnpm dev` (http://localhost:3000) |
| Verifier tout | `make ci` (lint, typage, tests, build) |
| Tests unitaires | `pnpm test` |
| End to end | `pnpm exec playwright test` |
| Base locale | `docker compose up -d db` puis `pnpm prisma migrate dev` |

## Carte

- `app/` : routes (composants serveur par defaut), `app/api/` : routes d'API.
- `components/` : UI partagee (design system dans `components/ui/`).
- `lib/` : logique metier et acces aux donnees (jamais importee par un composant client si elle lit un secret).
- `e2e/` : parcours Playwright.

## Definition of done

- La cible `make ci` (ou son equivalent) passe en local avant de rendre la main ; `ci-ok` vert sur la PR.
- Un comportement nouveau a son test ; un bug corrige a un test qui le reproduisait.
- Docs touchees mises a jour (README, `docs/ops/ci.md`, ADR si une decision change).

## Regles

- Regles par langage : `.claude/rules/ultime/` (chargees selon les fichiers touches). Garde-fous par
  hooks : `.claude/guardrails.json` (ne pas les contourner ; une regle qui gene se signale).
- Branche et PR pour tout changement, jamais de push sur la branche principale.
- Secrets dans `.env` (ignore par git), modele dans `.env.example`. Base locale pour le developpement.
