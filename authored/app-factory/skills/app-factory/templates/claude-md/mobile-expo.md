# {projet}

{une phrase : ce que fait le produit, pour qui}. Brief : `docs/product/brief.md`, PRD : `docs/product/prd.md`,
architecture : `docs/architecture/`. Etat app-factory : `.app-factory/state.json`.

## Stack

Expo SDK {version}, React Native {version}, Expo Router, TypeScript strict, {gestionnaire}, EAS Build et
Update, {backend}.

## Commandes

| But | Commande |
|---|---|
| Installer | `pnpm install --frozen-lockfile` |
| Lancer | `pnpm expo start` |
| Verifier tout | `make ci` (expo-doctor, lint, typage, tests) |
| Tests | `pnpm test` |
| End to end | `maestro test .maestro/` |
| Build de test | `eas build --profile preview` (jamais `production` ni `submit` sans accord) |

## Carte

- `app/` : ecrans (Expo Router), `components/`, `lib/`.
- `.maestro/` : parcours end to end.
- `app.config.ts`, `eas.json` : configuration native et profils de build.

## Definition of done

- La cible `make ci` (ou son equivalent) passe en local avant de rendre la main ; `ci-ok` vert sur la PR.
- Un comportement nouveau a son test ; un bug corrige a un test qui le reproduisait.
- Docs touchees mises a jour (README, `docs/ops/ci.md`, ADR si une decision change).

## Regles

- Regles par langage : `.claude/rules/ultime/` (chargees selon les fichiers touches). Garde-fous par
  hooks : `.claude/guardrails.json` (ne pas les contourner ; une regle qui gene se signale).
- Branche et PR pour tout changement, jamais de push sur la branche principale.
- Secrets dans `.env` (ignore par git), modele dans `.env.example`. Base locale pour le developpement.
