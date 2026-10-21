# ultime-skill

Bibliothèque de skills Claude prête pour la production, installable en une commande. Elle réunit les
meilleures skills open source du moment (sélectionnées, nettoyées, épinglées à un commit) et servira de
base aux skills que nous créerons nous-mêmes.

**313 skills, 24 agents, 26 packs, 8 bundles.** Chaque pack est un plugin Claude Code indépendant ; les
bundles en installent plusieurs d'un coup via les dépendances de plugins.

## Installation en une commande

Dans un clone du dépôt :

```bash
./install.sh                 # tout : le bundle ultime-all
./install.sh ultime-dev      # un ou plusieurs bundles ou packs
./install.sh --with-tools ultime-data   # installe aussi les CLIs externes (graphify, rea)
```

Sous Windows (PowerShell) : `./install.ps1`, mêmes arguments (`-WithTools` pour les CLIs).

Le script enregistre le marketplace local puis installe les cibles demandées. À la main, c'est la même chose :

```bash
claude plugin marketplace add .            # depuis le clone (chemin absolu accepté aussi)
claude plugin install ultime-all@ultime-skill
```

L'installation se fait aussi sans clone, depuis GitHub :

```bash
claude plugin marketplace add Lucas-lux/ultime-skill
claude plugin install ultime-all@ultime-skill
```

Le dépôt est privé : il faut un accès git au dépôt. Sans clé SSH GitHub, poser
`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` pour cloner en HTTPS via les identifiants git déjà stockés
(`gh auth login` puis `gh auth setup-git` les met en place).

Redémarrer Claude Code ou lancer `/reload-plugins` après installation.

## Bundles

| Bundle | Contenu |
|---|---|
| `ultime-all` | Tous les packs |
| `ultime-dev` | ponytail, superpowers, agent-skills, skill-factory, devops, fullstack, security, sc-conventions |
| `ultime-data` | data-engineering, dataviz, ml-engineering, graphify |
| `ultime-media` | design, motion-design, video-editing |
| `ultime-security` | security, sec-audit, sec-defense, rea |
| `ultime-web` | fullstack, design, compliance |
| `ultime-ops` | devops, finops, monitoring, prod-testing |
| `ultime-factory` | app-factory et tout ce qu'il pilote : product-management, greenfield, agent-skills, fullstack, design, compliance, security, devops, data-engineering, monitoring, prod-testing, finops |

Le pack `sec-offense` (pentest offensif, tests autorisés uniquement) n'est tiré par aucun bundle, y compris
`ultime-all` : il s'installe explicitement avec `claude plugin install sec-offense@ultime-skill`.

## Catalogue

### Produit et orchestration

| Pack | Skills | Rôle |
|---|---|---|
| `app-factory` | 3 + 18 agents | Orchestrateur de projet de A à Z, en trois modes : création depuis une idée, clone personnalisé d'une app de référence, reprise d'une app existante ou inachevée. Huit phases avec portes de validation, état sur disque et reprise, sous-agents spécialisés. Écrit maison. |
| `product-management` | 47 | Découverte, stratégie, marché, PRD, user stories, roadmap, pre-mortem, rétro, notes de version (phuryn), rétro-spécification d'un code existant (code-to-prd, schematic). |
| `greenfield` | 22 + 2 agents | Rétro-ingénierie « salle blanche » : specs comportementales, vecteurs de test et critères d'acceptation extraits d'un code sans hériter de son implémentation (`/greenfield:analyze`). Pipeline lourd, réservé au code dont on détient les droits. |

Démarrer un projet : installer `ultime-factory`, ouvrir le dépôt du projet (vide ou existant) et lancer
`/app-factory:app-factory`. L'orchestrateur demande le mode, le brief et le niveau d'autonomie, puis
avance phase par phase. Il fait valider chaque porte et toute action irréversible : paiement, création de
compte, publication, déploiement en production. L'état vit dans `.app-factory/` : une nouvelle session
reprend là où la précédente s'est arrêtée.

### Fondations

| Pack | Skills | Rôle |
|---|---|---|
| `ponytail` | 6 | Mode dev senior paresseux : plus petit changement complet, YAGNI, revue et audit. Hooks d'activation. |
| `superpowers` | 15 | Méthode de travail d'obra : plans, TDD, debug systématique, sous-agents, vérification. Hook de session. |
| `agent-skills` | 25 | Cycle de vie logiciel complet (Addy Osmani) : spec, build, test, revue, sécurité, perf, CI/CD, livraison. |
| `skill-factory` | 2 | Créer et tester des skills et des serveurs MCP (skill-creator, mcp-builder). |
| `sc-conventions` | 1 | Conventions d'équipe SensCritique transverses (méthode, rédaction, secrets). Écrit maison, rien de confidentiel. |

### Sécurité

| Pack | Skills | Rôle |
|---|---|---|
| `security` | 12 | Audit et revue de sécurité : OWASP, revue de diff, Semgrep, CodeQL, variantes, supply chain, modèle de menace. |
| `sec-audit` | 30 | Recherche de vulnérabilités et reverse (trilwu core). Usage autorisé uniquement. |
| `sec-defense` | 22 | DFIR, détection (Sigma, Yara), investigation et durcissement cloud (trilwu defense). |
| `sec-offense` | 40 | Pentest offensif, tests autorisés uniquement (trilwu offense). Hors bundles, installation explicite. |
| `rea` | 1 | Reverse Engineer Anything. Nécessite le serveur MCP `rea-agents`. |

### Ops

| Pack | Skills | Rôle |
|---|---|---|
| `devops` | 17 | Terraform, Docker, Kubernetes, GitOps, CI/CD, SLO, PromQL, k6, monitoring synthétique, incident. |
| `finops` | 6 | Coûts AWS, GKE/Google Cloud, Azure, et scan shift-left de l'infra as code (Infracost). |
| `monitoring` | 1 | Observabilité complète adaptée au type de projet (web, API, RAG/LLM, data, cron, ML, mobile) : métriques, logs, traces, SLO, alertes, coût. Écrit maison. |
| `prod-testing` | 1 | Stratégie de test de bout en bout et validation en production : pyramide CI/CD, smoke tests, canary et rollback automatique, feature flags, monitoring synthétique, tests instables. Écrit maison. |

### Data et IA

| Pack | Skills | Rôle |
|---|---|---|
| `data-engineering` | 12 | dbt, Airflow, SQL multi-dialecte, exploration, PySpark, Postgres, qualité des données. |
| `dataviz` | 5 | Choix de graphique, matplotlib/plotly, dashboards HTML, figures scientifiques, Grafana. |
| `ml-engineering` | 10 | Fine-tuning (LoRA/QLoRA), évaluation LLM, TRL, RAG, serving vLLM, scikit-learn, MLflow, HF Hub. |
| `graphify` | 1 | Graphe de connaissances d'un dépôt. Nécessite le paquet Python `graphifyy`. |

### Web

| Pack | Skills | Rôle |
|---|---|---|
| `fullstack` | 2 | Performance React/Next.js et composition React 19. À combiner avec `agent-skills`. |
| `design` | 7 | Design anti AI-slop : impeccable, frontend-design, Web Interface Guidelines, deslop, refonte. |
| `compliance` | 10 | RGAA, WCAG, conformité d'une feature, sécurité du développement (ANSSI). Skills FR écrites maison : RGPD/CNIL, cookies et consentement, mentions légales et CGU/CGV. |

### Créatif

| Pack | Skills | Rôle |
|---|---|---|
| `motion-design` | 11 | GSAP, principes de motion (LottieFiles), Manim. |
| `video-editing` | 4 | Montage par conversation (video-use), FFmpeg, transcription locale (faster-whisper), Manim. |

## Outils externes

Certaines skills pilotent un outil à installer à part (`./install.sh --with-tools` le fait pour les deux
premiers) :

- `rea` : serveur MCP `rea-agents` (`npx rea-agents setup --client claude_code`).
- `graphify` : paquet Python `graphifyy` (`uv tool install graphifyy`).
- `video-editing` : `ffmpeg` sur le PATH ; `faster-whisper` et `video-use` ont des dépendances Python (voir leurs README). `video-use` utilise l'API payante ElevenLabs pour la transcription : lui préférer `faster-whisper` en local.
- `ml-engineering`, `data-engineering` : les outils de chaque écosystème (dbt, Airflow, HF, vLLM, MLflow) selon la skill.

## Hooks de session

Deux packs installent un hook `SessionStart` qui s'exécute à chaque démarrage de session :

- `ponytail` active son mode et peut proposer une status line.
- `superpowers` injecte sa méthode de travail.

Ces hooks ont un coût en contexte et modifient le comportement par défaut. Les retirer : désinstaller le
pack, ou supprimer le champ `hooks` de son `plugin.json`.

## Licences

Le travail propre à ce dépôt (scripts, manifestes, documentation) est sous licence MIT. Chaque skill
importée garde la licence de son projet d'origine, copiée dans son dossier et recensée dans
[THIRD_PARTY.md](THIRD_PARTY.md). Points d'attention :

- Les skills `security` issues de Trail of Bits sont en **CC-BY-SA-4.0** (attribution et partage à
  l'identique). Elles restent isolées dans leurs dossiers, avec leur licence ; l'agrégation ne contamine
  pas le reste de la bibliothèque, mais toute modification d'une de ces skills doit rester en CC-BY-SA.
- Les skills `devops` issues de HashiCorp sont en **MPL-2.0** (copyleft faible, par fichier).
- Les skills Vercel (`fullstack`, `design`) déclarent MIT en frontmatter mais leur dépôt n'a pas de fichier
  LICENSE ; la mention de licence voyage dans le frontmatter de la skill.

Aucune skill sous licence non permissive bloquante (Semgrep Rules License, Databricks, AGPL) n'a été
retenue.

## Maintenance

La bibliothèque est reproductible : `plugins/` est entièrement régénéré, rien n'y est édité à la main. Les
skills importées viennent des dépôts épinglés ; les skills écrites maison vivent sous `authored/` et sont
superposées dans `plugins/` au build.

```bash
python scripts/build.py          # tout : vendor + overlay authored + manifestes + check
claude plugin validate .         # validation par la CLI Claude Code
```

Détail des étapes, lancées par `build.py` (ou à la main) :

```bash
python scripts/gen_vendor.py     # réécrit vendor.json (sources épinglées + liste des imports)
python scripts/vendor.py         # réimporte depuis les dépôts, nettoie, écrit THIRD_PARTY.md
python scripts/gen_manifests.py  # réécrit les plugin.json, les bundles et marketplace.json
python scripts/check.py          # contrôles (frontmatter, em dash, unicode invisible, motifs à risque)
```

- Ajouter ou changer une skill **importée** : éditer `scripts/gen_vendor.py` (et le catalogue dans
  `scripts/gen_manifests.py` si c'est un nouveau pack), puis `python scripts/build.py`.
- Ajouter une skill **écrite maison** : la créer sous `authored/<pack>/skills/<skill>/SKILL.md`, déclarer
  le pack dans `scripts/gen_manifests.py` s'il est nouveau, puis `python scripts/build.py`.

`scripts/vendor.py` ne modifie jamais les dépôts d'origine et n'exécute aucun de leurs scripts.
