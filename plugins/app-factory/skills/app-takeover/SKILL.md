---
name: app-takeover
description: >
  Mode reprise de app-factory : inventaire, retro-spec, audit qualite et plan pour terminer et ameliorer
  une app existante, inachevee ou abandonnee. A utiliser pour reprendre, finir, terminer, sauver, auditer
  ou ameliorer une app existante ou un projet laisse en plan, ou "app-takeover".
---

# Reprendre une app existante

Objectif : savoir precisement ce qui existe, ce qui marche, ce qui manque et ce qui est dangereux, avant
d'ecrire une ligne. Cette skill couvre la phase P0 du mode reprise ; `app-factory` reprend ensuite en P2
(PRD a completer) ou directement en P4 si le perimetre est deja clair.

## Regle d'or : ne rien casser

- Travailler sur une branche ; aucune modification pendant l'inventaire et l'audit.
- Si une production existe : aucun acces en ecriture, aucune migration, aucun deploiement a ce stade.
  Les donnees de production ne sont lues qu'avec l'accord explicite de l'utilisateur, en lecture seule.
- Un secret trouve dans le code ou l'historique git est signale (fichier, ligne, type) sans jamais
  afficher sa valeur, avec la recommandation de le revoquer et de le sortir du code.

## Etapes

1. **Inventaire** (agent `codebase-mapper`) : stack et versions reelles, structure, points d'entree,
   comment lancer l'app en local (et si ca marche : skill `run`), etat des tests (ils passent ? que
   couvrent-ils ?), CI, deploiement et infrastructure, environnements, schema de base et etat des
   migrations, services tiers, gestion des secrets, dependances obsoletes ou vulnerables, licences.
   Livrable : `docs/takeover/inventory.md`.
2. **Retro-specification** (agent `reverse-spec-analyst`) : ce que l'app fait reellement, ecrit pour un
   lecteur produit. Skills : `code-to-prd` (vue d'ensemble par page et par endpoint), `schematic` (pour
   une branche en cours), `shipping-artifacts` (architecture, permissions, variables, couverture de
   tests). Livrable : `docs/product/as-is-prd.md`.
3. **Intention contre realite** : recueillir ce que l'app devait faire (utilisateur, anciennes specs,
   tickets, maquettes), puis `intended-vs-implemented` pour lister fonctions inachevees, parcours casses,
   regles documentees mais non appliquees.
4. **Audit contre la barre de qualite** (agents en parallele : `security-engineer`, `data-architect`,
   `compliance-officer`, `ux-designer`, `sre`, `finops-analyst`, et `code-reviewer` avec `ponytail-audit` puis
   `ponytail-debt` pour le code : bugs, failles, tenue en charge, code a risque sans test, ce qui est a
   supprimer ou fusionner), chacun sur son domaine de
   `app-factory/references/quality-bar.md`. Chaque constat : preuve (fichier, ligne, commande), impact,
   gravite (bloquant, majeur, mineur), correction proposee. Livrable : `docs/takeover/audit.md`.
5. **Decision par module** : garder, corriger, finir ou refaire. Refaire seulement si c'est justifie
   (defauts structurels, absence de tests sur une zone critique, dette qui coute plus que la reecriture)
   et consigne dans un ADR. Pas de reecriture totale par defaut.
6. **Plan de reprise** : un jalon **M0 stabilisation** passe en premier (tests sur les parcours
   critiques, CI qui bloque (skill `ci-forge` : audit des ecarts puis CI complete, autonome), sauvegardes et restauration testees, monitoring de base, secrets sortis du
   code, failles bloquantes corrigees), puis les fonctionnalites a finir, puis les ameliorations.
   Livrable : backlog initial dans `docs/product/backlog.md`.
7. **G0** : l'utilisateur valide l'inventaire, l'audit, les decisions par module et le plan.

## Livrables

`docs/takeover/inventory.md`, `docs/product/as-is-prd.md`, `docs/takeover/audit.md`, ADR des decisions
structurantes, `docs/product/backlog.md`, puis la suite du cycle `app-factory`.
