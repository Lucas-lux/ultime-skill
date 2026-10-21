# Phases, agents, livrables et portes

Les livrables vivent dans le depot du projet (ils sont sa documentation durable) ; l'etat de
l'orchestration vit dans `.app-factory/` (voir `state.md`). Les noms de skills entre backticks sont a
charger via l'outil Skill quand le pack correspondant est installe.

## Gabarit de prompt d'agent

```
Role : <role> pour le projet <nom> (mode <creation|clone|reprise>), phase <Pn>.
Contexte a lire : <chemins : brief, PRD, ADR, etc.>
Tache : <une tache bornee>
Livrable : <chemin exact du fichier a ecrire ou du code a produire>
Definition of done : <criteres verifiables>
Skills a charger : <noms>
Contraintes : <stack, conventions du depot, decisions deja prises>
Rends : un resume court (fait, fichiers produits, verifications faites, questions ouvertes, risques).
```

## P0 Cadrage

- **Creation** : affiner l'idee avec l'utilisateur (`interview-me`, `idea-refine` ou `brainstorming`).
- **Clone** : skill `app-clone` (dossier de reference, matrice de parite, brief de personnalisation).
- **Reprise** : skill `app-takeover` (inventaire, retro-spec, audit, plan de reprise).
- Livrable : `docs/product/brief.md` (probleme, cible, plateformes, marche et langues, contraintes,
  criteres de succes, mode, niveau d'autonomie).
- **G0** : le brief est complet et valide par l'utilisateur ; en clone, le controle de distinction est
  fait ; en reprise, l'inventaire et l'audit sont partages.

## P1 Decouverte

- Agent `product-strategist`. Skills : `competitor-analysis`, `user-personas`, `market-segments`,
  `market-sizing` (si utile), `identify-assumptions-new` ou `identify-assumptions-existing`,
  `opportunity-solution-tree`, `value-proposition`, `positioning-ideas`, `business-model`,
  `monetization-strategy`, `pricing-strategy`, `north-star-metric`.
- Livrable : `docs/product/discovery.md` (cibles et besoins, alternatives, positionnement, modele
  economique, metrique nord, hypotheses les plus risquees et comment les tester).
- **G1** : go, pivot ou stop. Les hypotheses risquees ont chacune un test ou une mitigation. Aucun
  chiffre de marche presente comme un fait sans source.

## P2 Specification

- `product-manager` : `create-prd`, puis `strategy-red-team` ou `pre-mortem` sur le PRD. Exigences non
  fonctionnelles chiffrees : performance, disponibilite, securite, accessibilite, langues, hors ligne
  (mobile), volumetrie. Perimetre MVP, versions suivantes, non-objectifs.
- `compliance-officer` : scan reglementaire initial (donnees personnelles, cookies, mentions legales,
  CGU/CGV si vente, accessibilite, IA, contenus publies par les utilisateurs, secteurs sensibles : sante,
  mineurs, finance ; politiques des stores si mobile).
- `finops-analyst` : premiere enveloppe de cout (hebergement, services tiers, frais de stores, outils,
  budget d'acquisition) en fourchettes sourcees.
- Livrables : `docs/product/prd.md`, `docs/compliance/obligations.md`, `docs/finops/cost-envelope.md`.
- **G2** : chaque exigence est testable et identifiee (`REQ-xxx`), aucune question bloquante ouverte, les
  obligations reglementaires sont listees, l'enveloppe de cout est acceptee.

## P3 Conception

Sequence : l'architecte d'abord (il fixe la stack et les frontieres), puis les autres en parallele.

- `software-architect` : stack via `stack-selection.md`, ADR (`documentation-and-adrs`), vue C4
  contexte et conteneurs, contrats d'API (`api-and-interface-design`), environnements (dev, staging,
  prod), integrations, strategie de test. Livrables : `docs/architecture/architecture.md`,
  `docs/adr/NNNN-*.md`.
- `data-architect` : modele de donnees, migrations, index, contraintes, droits, sauvegardes,
  retention. Livrable : `docs/architecture/data-model.md`.
- `ux-designer` : parcours, ecrans, etats (vide, chargement, erreur), design system et tokens,
  accessibilite. Livrable : `docs/design/ux.md` (et maquettes si un outil est disponible).
- `security-engineer` : modele de menace (`security-threat-model`), authentification, autorisation,
  gestion des secrets, niveau ASVS ou MASVS vise. Livrable : `docs/security/threat-model.md`.
- `finops-analyst` : enveloppe affinee, cout unitaire, budgets et alertes prevus.
- `compliance-officer` : privacy by design (registre, bases legales, AIPD si requise, sous-traitants),
  plan des pages legales et du consentement. Livrable : `docs/compliance/privacy-by-design.md`.
- **G3** : chaque `REQ-xxx` est rattachee a un composant ; aucun ADR ouvert ; securite, conformite et
  finops ont chacune signe ; les choix sont coherents entre documents (verification croisee).

## P4 Planification

- `project-manager` : `outcome-roadmap`, `user-stories` (criteres d'acceptation en Etant donne / Quand /
  Alors), `test-scenarios`, `prioritization-frameworks`, `sprint-plan`.
- Jalons : **M0 squelette** (depot, lint, tests, CI, environnements, deploiement en staging d'un premier
  ecran, monitoring de base, migrations outillees), puis des tranches verticales de valeur, puis un jalon
  de durcissement et de lancement.
- Livrables : `docs/product/roadmap.md`, `docs/product/backlog.md` (stories `S-xxx` reliees aux
  `REQ-xxx`), definition of done du projet (base : `quality-bar.md`).
- Creation d'issues ou de milestones sur une forge : seulement si l'utilisateur le demande (action
  visible de l'exterieur).
- **G4** : tracabilite complete REQ vers stories, M0 en premier, stories INVEST, dependances et risques
  identifies.

## P5 Construction (boucle par jalon)

Pour chaque story prete, dans l'ordre des dependances :
1. `implementer` : `test-driven-development`, `incremental-implementation`, commits petits sur une branche
   dediee. UI : `frontend-ui-engineering` et les skills du pack ui-design.
2. `code-reviewer` : `code-review-and-quality` sur le diff.
3. `qa-engineer` : criteres d'acceptation verifies, tests de bout en bout des parcours touches.
4. `security-engineer` : `differential-review` ou `security-review` sur le diff si la story touche
   authentification, autorisation, donnees personnelles, paiement, upload ou entree externe.
5. `ux-designer` : revue des ecrans touches (accessibilite, coherence avec le design system).
6. Corrections par `implementer`, boucle bornee. La story passe `done` quand la definition of done est
   remplie et verifiee par l'orchestrateur (tests relances).

- **G5** (fin de jalon) : `gate-verifier` fait l'audit de jalon (stories acceptees, tests verts, revue
  propre, migrations reversibles, pas de regression), demo a l'utilisateur (skill `run` pour lancer
  l'app), `retro` courte, ajustement du backlog.

## P6 Pre-production

- `release-engineer` : pipeline (`ci-cd-and-automation`, `github-actions`,
  `deployment-pipeline-design`), parite staging et prod, deploiement progressif et rollback teste
  (`testing-in-production`), domaine et TLS, infrastructure as code (`terraform-skill`) si pertinent.
- `sre` : `setting-up-monitoring`, SLO (`slo-implementation`), alertes, runbooks, `incident-response`,
  sauvegardes et **restauration testee**.
- `security-engineer` : audit final (`owasp-security`, `semgrep`, `supply-chain-risk-auditor`, secrets,
  en-tetes, limitation de debit).
- `compliance-officer` : pages legales, politique de confidentialite, consentement, declaration
  d'accessibilite, registre ; en mobile, labels de confidentialite des stores.
- `finops-analyst` : budgets et alertes en place, prevision de cout au lancement.
- `qa-engineer` : regression complete, tests de charge (`k6`), audit d'accessibilite.
- Mobile : `release-engineer` avec `mobile-release` (signature, pistes de test, rollout),
  `security-engineer` avec `mobile-security-masvs`, `compliance-officer` avec `store-listing` et
  `play-data-safety` ; profil de packs ajuste (`ultime-profile` : app-stores, store-apple, store-google).
- Livrable : `docs/ops/release-readiness.md`.
- **G6** go / no-go : la liste des actions irreversibles a venir est presentee explicitement.

## P7 Lancement et apprentissage

- `release-engineer` : mise en production apres confirmation, smoke tests, deploiement progressif.
- `growth-lead` : plan de lancement, SEO de base, fiches stores si mobile (pack store-aso, saisie via
  `store-console-browser` ou les CLI), analytics conformes au
  consentement, tableau de bord de la metrique nord, `release-notes`.
- `project-manager` : `retro`, revue des metriques a J+7 et J+30, backlog de l'iteration suivante.
- **G7** : revue post-lancement avec l'utilisateur ; l'iteration suivante repart en P4.
