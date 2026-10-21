# {projet}

{une phrase : ce que fait le produit, pour qui}. Brief : `docs/product/brief.md`, PRD : `docs/product/prd.md`,
architecture : `docs/architecture/`. Etat app-factory : `.app-factory/state.json`.

## Stack

{langages, frameworks, base de donnees, hebergement : versions reelles}.

## Commandes

| But | Commande |
|---|---|
| Installer | `{commande}` |
| Lancer | `{commande}` |
| Verifier tout | `make ci` |
| Tests | `{commande}` |

## Carte

- `{dossier}/` : {role}.

## Definition of done

- La cible `make ci` (ou son equivalent) passe en local avant de rendre la main ; `ci-ok` vert sur la PR.
- Un comportement nouveau a son test ; un bug corrige a un test qui le reproduisait.
- Docs touchees mises a jour (README, `docs/ops/ci.md`, ADR si une decision change).

## Regles

- Regles par langage : `.claude/rules/ultime/` (chargees selon les fichiers touches). Garde-fous par
  hooks : `.claude/guardrails.json` (ne pas les contourner ; une regle qui gene se signale).
- Branche et PR pour tout changement, jamais de push sur la branche principale.
- Secrets dans `.env` (ignore par git), modele dans `.env.example`. Base locale pour le developpement.
