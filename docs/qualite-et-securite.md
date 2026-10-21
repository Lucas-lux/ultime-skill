# Qualité et sécurité

La qualité ne repose pas sur la bonne volonté de l'agent : elle est imposée à trois niveaux, de plus en
plus tard dans le cycle.

| Niveau | Quand | Outil |
|---|---|---|
| Avant chaque action | à chaque commande, écriture ou lecture de Claude | hooks `guardrails` |
| Pendant le travail | à chaque fichier touché, à chaque revue | règles par langage, `ponytail`, skills de revue |
| Avant chaque fusion | sur chaque PR | CI générée par `ci-forge`, check requis `ci-ok` |

## Garde-fous (`guardrails`)

Un hook unique, écrit en Node, examine chaque commande, écriture et lecture de Claude avant qu'elle ne
s'exécute.

| Règle | Défaut | Ce qui est refusé |
|---|---|---|
| `em-dash` | bloque | em dash ajouté dans un fichier, un commit, une PR, une issue, un texte écrit par commande ; lignes indexées au commit |
| `emoji` | bloque | emoji non demandé (le marqueur IA et la ligne d'attribution restent permis ; exceptions par chemin) |
| `protected-push` | bloque | push vers `main` ou `master`, y compris depuis la branche courante, via `HEAD`, après un checkout dans la même commande, suppression, `--all`, `--mirror` |
| `no-verify` | bloque | `--no-verify`, `commit -n`, `core.hooksPath`, `HUSKY=0` et équivalents |
| `secrets` | bloque | clés et jetons connus, mot de passe en clair, dans un fichier, une commande ou les lignes indexées (fichiers `.env` exemptés) |
| `env-file` | bloque | `git add` ou commit d'un fichier `.env` |
| `conventional-commit` | bloque | message hors format Conventional Commits, première ligne de plus de 72 caractères |
| `ai-marker` | bloque | titre de PR ou d'issue rédigé par l'IA sans le marqueur |
| `prod-credentials` | bloque | secrets Kubernetes, coffres-forts, historique du shell, `.env` d'un autre projet, tunnel vers la production |
| `lint-config` | avertit | configuration de lint modifiée, suppression d'avertissement ajoutée |
| `config-tamper` | demande | toute modification de la configuration ou du retrait des garde-fous |

Chaque refus donne la règle, la raison et la correction. Les règles se règlent ou se coupent dans
`.claude/guardrails.json` (projet) ou `~/.claude/guardrails.json` (machine). Une copie installée dans le
projet (`setup.cjs install-project`) sert l'équipe et les sessions cloud ; celle du plugin se tait alors.
Une erreur interne laisse passer l'action plutôt que de bloquer le travail. Le moteur est couvert par 16
tests de bout en bout et a été vérifié en session réelle.

## CI/CD générée (`ci-forge`)

`detect_stack.py` lit les manifestes du dépôt ; la skill en déduit une CI par niveau :

- **PR** : format, lint, typage, tests avec couverture en cliquet, build, recherche de secrets, audit des
  dépendances, contrôle des workflows, et selon les fichiers touchés conteneur et manifestes Kubernetes ;
- **branche principale** : en plus, end to end complet, déploiement d'essai sur un cluster éphémère, SBOM,
  image publiée, staging ;
- **nuit** : matrice complète, tests de mutation, charge et Lighthouse sur le staging, audit de sécurité
  dynamique ;
- **release** : artefacts, provenance, signature, production.

Les actions sont épinglées par SHA (`pin_actions.py`, à partir des tags publiés), les permissions sont
minimales, les commandes viennent d'un task runner unique pour que local et CI donnent le même résultat,
et `actionlint` et `zizmor` valident les workflows. Toutes les commandes sont exécutées en local avant la
PR (dans un conteneur officiel si un outil manque) : un essai réel a montré qu'une CI jamais exécutée
peut échouer sur un fichier qu'elle a elle-même généré.

## Revues

| Skill | Ce qu'elle exige |
|---|---|
| `security-review` | une preuve par constat (fichier, ligne, chemin de la source au puits), un niveau de confiance, une gravité, la recherche des variantes, une correction minimale testée, une liste des pièges de conception |
| `sast` | Semgrep et CodeQL en local, tri de chaque résultat en vrai positif, faux positif justifié ou piste |
| `ui-review` | l'interface rendue en bureau et mobile, accessibilité mesurée, états, formulaires, performance perçue |
| `ponytail-review` | justesse, sûreté, tenue en charge, tests, et l'utilité de chaque ligne |
| `gate-verifier` | une boucle fixe (build, typage, lint, tests, dépendances, secrets, diff) rendue en tableau ; un contrôle non lancé n'est jamais compté comme réussi |

## Règles par langage

Onze règles courtes (Python, TypeScript, React et Next.js, Go, Rust, shell, SQL, Docker, Terraform,
Kubernetes, tests), écrites dans `.claude/rules/ultime/` par `ultime-profile`. Chacune porte un champ
`paths:` et ne se charge que lorsque Claude lit ou modifie un fichier concerné.

## Ponytail partout

`ponytail` injecte dans chaque session et chaque sous-agent la règle du plus petit changement complet :
réutiliser avant d'écrire, ne rien ajouter qui ne serve la tâche, expliquer en une lecture. Il pèse
environ 2 900 caractères par session.
