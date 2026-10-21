---
name: app-factory
description: >
  Orchestrateur de projet de A a Z : prend une idee, une app de reference a cloner en la personnalisant,
  ou une app existante ou inachevee a terminer, et la mene jusqu'a un produit fini en production. Pilote
  des sous-agents specialises (produit, gestion de projet, architecture, base de donnees, design,
  securite, conformite, finops, developpement, revue, QA, release, SRE, growth) par phases avec des portes
  de validation, un etat sur disque et une reprise possible. A utiliser quand l'utilisateur veut creer
  une app complete, "faire une app de A a Z", cloner ou reproduire une app, reprendre, finir ou
  ameliorer une app existante, piloter tout un projet, ou dit "app-factory".
---

# App factory : du projet au produit fini

Cette skill fait de la session principale le **chef d'orchestre**. Elle ne fait pas tout elle-meme :
elle decoupe, delegue aux sous-agents `app-factory:*` via l'outil Agent, tient l'etat du projet, et fait
valider chaque phase par l'utilisateur. Les sous-agents ne lancent pas d'autres agents : seul
l'orchestrateur dispatche, ce qui garde le deroulement lisible et reproductible.

References a charger au besoin :
- [references/phases.md](references/phases.md) : detail des phases, agents, skills, livrables, portes.
- [references/state.md](references/state.md) : etat sur disque et protocole de reprise.
- [references/quality-bar.md](references/quality-bar.md) : ce que "produit fini" veut dire, par domaine.
- [references/stack-selection.md](references/stack-selection.md) : choisir la stack sans dogme.
- [references/autonomy.md](references/autonomy.md) : ce que l'orchestrateur fait seul, ce qu'il fait valider.

## Demarrage (a chaque invocation)

1. **Reprendre si un projet existe.** Si `.app-factory/state.json` existe, suivre le protocole de reprise
   de `state.md` : relire l'etat, le confronter au depot reel (fichiers, git, tests), signaler les
   ecarts, puis continuer a `next_action`.
2. **Sinon, choisir le mode** par une question a choix multiples :
   - **Creation** : partir d'une idee.
   - **Clone** : reproduire la valeur d'une app de reference en la personnalisant. Charger la skill
     `app-clone` pour la phase P0.
   - **Reprise** : terminer et ameliorer une app existante ou inachevee. Charger la skill `app-takeover`
     pour la phase P0.
3. **Recueillir le brief minimal** (questions a choix multiples, pas de suppositions) : plateformes (web,
   iOS, Android, API), utilisateurs cibles, marche et langues, contraintes (budget, delai, stack imposee,
   hebergement, donnees sensibles), niveau d'autonomie (voir `autonomy.md`).
4. **Verifier l'outillage.** Lister les packs utiles installes (le bundle `ultime-factory` les installe
   tous). Un pack absent n'est pas bloquant : l'agent applique alors les principes de son propre prompt,
   et l'orchestrateur signale le manque.

## Phases et portes

| Phase | Objet | Agents principaux | Porte |
|---|---|---|---|
| P0 Cadrage | Mode, brief, inventaire (clone ou reprise) | product-manager, reverse-spec-analyst, codebase-mapper | G0 brief valide |
| P1 Decouverte | Probleme, cibles, concurrence, hypotheses risquees, modele economique | product-strategist | G1 go, pivot ou stop |
| P2 Specification | PRD, exigences non fonctionnelles, perimetre, obligations, enveloppe de cout | product-manager, compliance-officer, finops-analyst | G2 PRD gele |
| P3 Conception | Architecture et ADR, modele de donnees, UX et design system, modele de menace, couts | software-architect, puis data-architect, ux-designer, security-engineer, finops-analyst, compliance-officer | G3 conception validee |
| P4 Planification | Roadmap, jalons, backlog, criteres d'acceptation, definition of done | project-manager | G4 backlog pret |
| P5 Construction | Par jalon : squelette (M0) puis stories, chacune implementee, revue, testee | implementer, code-reviewer, qa-engineer, security-engineer, ux-designer | G5 par jalon |
| P6 Pre-production | CI/CD, deploiement reversible, monitoring, sauvegardes, audits finaux | release-engineer, sre, security-engineer, compliance-officer, finops-analyst, qa-engineer | G6 go / no-go |
| P7 Lancement | Mise en prod, lancement, mesure, retro, iteration suivante | release-engineer, growth-lead, project-manager | G7 revue post-lancement |

Un petit projet peut fusionner P1 et P2, ou P3 et P4. On ne saute jamais G2, la partie securite et
conformite de G3, ni G6.

## Regles de dispatch

- **Une tache bornee par agent.** Chaque prompt d'agent donne : le role attendu, les entrees (chemins de
  fichiers, pas leur contenu recopie), le livrable et son chemin exact, la definition of done, les skills
  a charger. Gabarit dans `phases.md`.
- **Paralleliser ce qui est independant** en envoyant plusieurs appels Agent dans le meme message (par
  exemple en P3, apres l'architecte : donnees, UX, securite, finops, conformite en parallele).
- **Construction parallele** seulement entre stories qui touchent des fichiers disjoints, chacune avec
  `isolation: "worktree"`, puis integration sequentielle et tests apres chaque fusion.
- **Verifier plutot que croire.** Le compte rendu d'un agent est une affirmation, pas un fait. Controler
  le livrable (il existe, il repond a la definition of done), relancer les tests soi-meme, et confier la
  verification de fond a `gate-verifier`.
- **Pas de secret dans un prompt d'agent.** Les secrets restent dans le `.env` du projet, ignore par git.
- **Boucle de correction bornee** : deux allers-retours maximum sur un meme echec, puis escalade a
  l'utilisateur avec le diagnostic.

## Deroulement d'une porte

1. Lancer `gate-verifier` avec la checklist de la porte (`phases.md`) ; il ecrit
   `.app-factory/gates/Gn.md`.
2. Corriger les points bloquants (boucle bornee), relancer la verification si besoin.
3. Presenter a l'utilisateur un resume court (livrables, decisions prises, risques, ce qui reste) et
   demander par question a choix multiples : valider, corriger tel point, revenir a une phase, arreter.
4. Consigner la decision dans `.app-factory/decisions.md` et mettre a jour `state.json`.

## Garde-fous permanents

- Les actions irreversibles ou visibles de l'exterieur sont toujours confirmees au moment de les faire :
  paiement, creation de compte, acceptation de contrat, soumission en store, depense publicitaire,
  publication, deploiement en production, migration sur des donnees reelles, suppression de ressources.
  Detail dans `autonomy.md`.
- Mode clone : on reproduit la valeur, jamais la marque, les assets, les textes ni le code d'autrui.
- Donnees : base locale d'abord, jamais de donnees de production en developpement sans accord explicite.
- Les regles du depot cible (son `CLAUDE.md`, ses conventions) priment ; signaler les contradictions.

## Fin de chaque session de travail

Mettre a jour `state.json` (phase, statut, `next_action`), puis rendre a l'utilisateur : ce qui a ete fait,
ce qui a ete verifie et comment, ce qui reste bloque, et la prochaine etape.
