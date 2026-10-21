# ultime-skill

Bibliothèque de skills Claude prête pour la production, installable en une commande. Elle réunit les
meilleures skills open source du moment (sélectionnées, nettoyées, épinglées à un commit) et servira de
base aux skills que nous créerons nous-mêmes.

**482 skills, 24 agents, 44 packs, 10 bundles.** Chaque pack est un plugin Claude Code indépendant ; les
bundles en installent plusieurs d'un coup via les dépendances de plugins.

## Installation

### Une fois par machine

```bash
claude plugin marketplace add Lucas-lux/ultime-skill
claude plugin install ultime-profile@ultime-skill
```

Ou, depuis un clone : `./install.sh` (Windows : `./install.ps1`), qui installe le point d'entrée
`ultime-profile`, les garde-fous `guardrails` (voir [Garde-fous](#garde-fous)) et `ponytail`, la règle du
plus petit changement complet appliquée à chaque session et chaque sous-agent (`--no-guardrails`,
`--no-ponytail`, ou `-NoGuardrails`, `-NoPonytail` sous Windows, pour s'en passer). Rien d'autre ne pèse sur le contexte des sessions.

Le dépôt est privé : il faut un accès git au dépôt. Sans clé SSH GitHub, poser
`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` pour cloner en HTTPS via les identifiants git déjà stockés
(`gh auth login` puis `gh auth setup-git` les met en place).

### Dans chaque projet

Ouvrir Claude Code dans le projet et demander simplement, par exemple :

> Installe les skills ultime-factory dont ce projet a besoin.

Claude lit le projet et la demande, propose les packs utiles avec leur coût en contexte, puis les installe
au niveau du projet. Il choisit avec vous le scope :
- **partagé** (`.claude/settings.json`, à committer) : l'équipe reçoit le même profil ;
- **personnel** (`.claude/settings.local.json`).

Il désactive ce qui ne sert pas, puis vous fait lancer `/reload-plugins`. Quand le travail change de
domaine (passer du code à la fiche store, du build au lancement), redemandez-lui, ou laissez
l'orchestrateur `app-factory` le faire à ses étapes clés.

### Tout installer pour tous les projets (déconseillé)

```bash
./install.sh ultime-dev                  # un ou plusieurs bundles ou packs, actifs partout
./install.sh --with-tools ultime-mobile  # installe aussi les CLI externes (graphify, rea, asc, gplay)
```

Un bundle large actif partout dépasse le budget de descriptions de Claude Code (voir
[Économie de contexte](#économie-de-contexte)). `ULTIME_SKILL_SOURCE=.` installe depuis le clone plutôt
que depuis GitHub, mais l'installation par projet suppose ensuite la source GitHub.

Redémarrer Claude Code ou lancer `/reload-plugins` après installation.

## Bundles

| Bundle | Contenu |
|---|---|
| `ultime-all` | Tous les packs (déconseillé : préférer l'installation par projet) |
| `ultime-dev` | ponytail, superpowers, agent-skills, skill-factory, devops, fullstack, security, sc-conventions |
| `ultime-data` | data-engineering, dataviz, ml-engineering, graphify |
| `ultime-media` | ui-design, motion-design, video-editing |
| `ultime-security` | security, sec-audit, sec-defense, rea |
| `ultime-web` | fullstack, ui-design, compliance |
| `ultime-ops` | devops, finops, monitoring, prod-testing |
| `ultime-mobile` | mobile, mobile-expo, mobile-ios, mobile-android, mobile-flutter, app-stores, store-apple, store-google, store-aso, ui-design, compliance, security |
| `ultime-growth` | growth, growth-seo, growth-ads, growth-social, growth-analytics, growth-cro, store-aso, video-editing, motion-design |
| `ultime-factory` | app-factory et tout ce qu'il pilote : product-management, greenfield, agent-skills, fullstack, ui-design, compliance, security, devops, data-engineering, monitoring, prod-testing, finops, et tous les packs mobile, stores, growth et production vidéo |

Chaque bundle installe aussi `ultime-profile` (voir [Économie de contexte](#économie-de-contexte)).

Le pack `sec-offense` (pentest offensif, tests autorisés uniquement) n'est tiré par aucun bundle, y compris
`ultime-all` : il s'installe explicitement avec `claude plugin install sec-offense@ultime-skill`.

## Économie de contexte

Chaque skill d'un pack activé ajoute sa description au contexte **à chaque tour**, qu'elle serve ou non ;
son contenu complet ne se charge que lorsqu'elle est utilisée. Claude Code réserve à cette liste environ
1 % de la fenêtre de contexte : au-delà, il retire des descriptions et les skills concernées ne se
déclenchent plus. Installer `ultime-all` et tout laisser actif est donc contre-productif.

- **Un profil par projet** : la skill `ultime-profile` détecte le type de projet, propose les packs utiles
  et désactive les autres pour ce dépôt seulement (`claude plugin enable|disable --scope local|project`).
  Elle s'ajuste quand la tâche change de domaine (passer du code à la fiche store, par exemple).
- **Mode sobre global** : tout désactiver au niveau utilisateur et laisser chaque projet activer son profil.
- **Coût de chaque pack et bundle** : généré au build dans
  `plugins/ultime-profile/skills/ultime-profile/references/catalog.md`, affiché par `scripts/build.py`.
- **Côté maison** : descriptions de 400 caractères au plus (contrôlé par `scripts/check.py`), `SKILL.md`
  de moins de 500 lignes avec le détail en références, agents d'`app-factory` avec un modèle adapté à
  leur rôle, des comptes rendus courts et la règle ponytail du plus petit changement complet.
- **Côté imports** : les descriptions d'origine ne sont pas réécrites (elles portent les mots qui
  déclenchent la skill) ; seuls les chargements excessifs sont corrigés, comme l'agent `analyzer` de
  greenfield qui préchargeait ses 22 skills à chaque appel et ne charge plus que celle de sa mission.

## Catalogue

### Produit et orchestration

| Pack | Skills | Rôle |
|---|---|---|
| `app-factory` | 4 + 18 agents | Orchestrateur de projet de A à Z, en trois modes : création depuis une idée, clone personnalisé d'une app de référence, reprise d'une app existante ou inachevée. Huit phases avec portes de validation, état sur disque et reprise, sous-agents spécialisés, mode autopilot. Écrit maison. |
| `product-management` | 46 | Découverte, stratégie, marché, PRD, user stories, roadmap, pre-mortem, rétro, notes de version (phuryn), rétro-spécification d'un code existant (code-to-prd, schematic). |
| `greenfield` | 22 + 2 agents | Rétro-ingénierie « salle blanche » : specs comportementales, vecteurs de test et critères d'acceptation extraits d'un code sans hériter de son implémentation (`/greenfield:analyze`). Pipeline lourd, réservé au code dont on détient les droits. |

Démarrer un projet : installer `ultime-factory`, ouvrir le dépôt du projet (vide ou existant) et lancer
`/app-factory:app-factory`. L'orchestrateur demande le mode, le brief et le niveau d'autonomie, puis
avance phase par phase. Il fait valider chaque porte et toute action irréversible : paiement, création de
compte, publication, déploiement en production. L'état vit dans `.app-factory/` : une nouvelle session
reprend là où la précédente s'est arrêtée.

**Mode autopilot** (skill `autopilot`) : après le cadrage, le projet avance seul par réveils planifiés
(tâche planifiée Claude Code dans le cloud, payée par le forfait Claude), sans session ouverte. Les agents
décident ce qui est réversible et le tracent ; seules les décisions de vision, d'argent, de droit ou
irréversibles arrivent sous forme d'issue GitHub qui vous est assignée, à laquelle on répond par un
commentaire depuis l'app GitHub. Les PR sont fusionnées par GitHub quand les checks requis sont verts,
le staging se déploie par la CI, la production attend toujours votre approbation. La mise en place
(export des skills dans le dépôt, labels, workflows, protection de branche, tâche planifiée) est décrite
dans `references/setup.md` de la skill et se fait par vous : Claude ne crée rien sur votre compte Claude
ni dans le cloud.

### Mobile et stores

| Pack | Skills | Rôle |
|---|---|---|
| `mobile` | 7 | Multiplateforme, écrit maison : publication iOS et Android (signature, versions, TestFlight, pistes Play, fastlane, EAS), sécurité OWASP MASVS, notifications push, deep links, tests de bout en bout (Maestro, Detox), accessibilité mobile, achats intégrés. |
| `mobile-expo` | 22 | Skills officielles Expo (router, UI native, design system, modules, upgrade, EAS Build, Submit, Update et Workflows, migration web vers natif), performance et upgrade React Native, React Navigation (Callstack), React Native Testing Library. |
| `mobile-ios` | 5 | SwiftUI, concurrence Swift, Swift Testing, SwiftData (Paul Hudson), accessibilité iOS. |
| `mobile-android` | 24 | Skills officielles Google (Compose, Navigation 3, AGP 9, R8, ANR, tests, sécurité, politiques Play) et Google Play Billing. |
| `mobile-flutter` | 14 | Skills officielles Flutter et Dart. |
| `app-stores` | 3 | Écrit maison : dossier de fiche pour les deux stores, formulaire Data safety, saisie dans les consoles via le navigateur pour ce que les API ne couvrent pas. |
| `store-apple` | 19 | App Store Connect par le CLI `asc`, prévention des rejets App Review, labels de confidentialité Apple. |
| `store-google` | 13 | Google Play par le CLI `gplay`, audit des politiques Google Play. |
| `store-aso` | 16 | ASO des deux stores : audit, mots-clés, métadonnées, captures (générateur inclus), vidéo, icône, pages produit, tests A/B, avis. |

Les stores passent d'abord par les CLI et API officielles ; le navigateur (Claude in Chrome, avec vos
sessions) ne sert qu'à ce qu'elles ne couvrent pas. Connexion, double authentification, paiement,
acceptation des contrats, envoi en revue et publication restent à l'utilisateur.

### Growth et marketing

| Pack | Skills | Rôle |
|---|---|---|
| `growth` | 8 | Socle : contexte produit partagé par toutes les skills marketing, plan marketing, lancement, relations presse. Écrit maison : campagnes d'installation d'app, production de créatives et vidéos, publication sur les réseaux sociaux, conformité marketing France et UE. |
| `growth-seo` | 7 | Audit SEO, recherche IA (GEO), données structurées, SEO programmatique, architecture du site, stratégie de contenu, netlinking. |
| `growth-ads` | 9 | Publicité Google, Meta, TikTok, LinkedIn, créatives, copywriting, psychologie, images et vidéos marketing, Apple Ads, campagnes d'acquisition d'app. |
| `growth-social` | 3 | Réseaux sociaux, influence et créateurs, communauté. |
| `growth-analytics` | 5 | Plan de marquage, GA4, attribution, suivi des conversions, tests A/B, attribution mobile. |
| `growth-cro` | 11 | Conversion des pages, inscription, onboarding, paywalls, popups, emails et SMS, churn, parrainage, tunnel web vers app. |

Les skills issues de marketingskills lisent un contexte commun (`.agents/product-marketing.md`, créé par
la skill `product-marketing`) : activer `growth` avec n'importe quel pack `growth-*`. Aucune campagne,
dépense ni publication ne part sans validation de l'utilisateur. Quelques outils cités par marketingskills
sont des partenaires rémunérés de ce dépôt d'origine : ils sont signalés comme tels et présentés à côté
de leurs alternatives.

### Fondations

| Pack | Skills | Rôle |
|---|---|---|
| `ponytail` | 6 | Mode dev senior paresseux : plus petit changement complet, YAGNI, revue et audit. Hooks d'activation. |
| `superpowers` | 15 | Méthode de travail d'obra : plans, TDD, debug systématique, sous-agents, vérification. Hook de session. |
| `agent-skills` | 25 | Cycle de vie logiciel complet (Addy Osmani) : spec, build, test, revue, sécurité, perf, CI/CD, livraison. |
| `skill-factory` | 2 | Créer et tester des skills et des serveurs MCP (skill-creator, mcp-builder). |
| `sc-conventions` | 1 | Conventions d'équipe SensCritique transverses (méthode, rédaction, secrets). Écrit maison, rien de confidentiel. |
| `guardrails` | 1 + hooks | Garde-fous imposés par hooks et configurables (em dash, emoji, push sur main, hooks git, secrets, commits, marqueur IA, identifiants de prod). Installé par défaut. Écrit maison. |

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
| `ci-forge` | 1 | CI/CD générée seule selon la stack et l'architecture cible : lint, typage, tests, end to end, conteneurs, Kubernetes, IaC, sécurité, SBOM, staging et prod ; actions épinglées par SHA, check requis `ci-ok`. Écrit maison. |
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
| `ui-design` | 7 | Design anti AI-slop : impeccable, frontend-design, Web Interface Guidelines, deslop, refonte. |
| `compliance` | 10 | RGAA, WCAG, conformité d'une feature, sécurité du développement (ANSSI). Skills FR écrites maison : RGPD/CNIL, cookies et consentement, mentions légales et CGU/CGV. |

### Créatif

| Pack | Skills | Rôle |
|---|---|---|
| `motion-design` | 11 | GSAP, principes de motion (LottieFiles), Manim. |
| `video-editing` | 4 | Montage par conversation (video-use), FFmpeg, transcription locale (faster-whisper), Manim. |

## Outils externes

Certaines skills pilotent un outil à installer à part (`./install.sh --with-tools` installe `rea`,
`graphify`, `asc` et `gplay`) :

- `rea` : serveur MCP `rea-agents` (`npx rea-agents setup --client claude_code`).
- `graphify` : paquet Python `graphifyy` (`uv tool install graphifyy`).
- `video-editing` : `ffmpeg` sur le PATH ; `faster-whisper` et `video-use` ont des dépendances Python (voir leurs README). `video-use` utilise l'API payante ElevenLabs pour la transcription : lui préférer `faster-whisper` en local.
- `ml-engineering`, `data-engineering` : les outils de chaque écosystème (dbt, Airflow, HF, vLLM, MLflow) selon la skill.
- `store-apple` : CLI `asc` (App Store Connect) et `store-google` : CLI `gplay` (Play Console). L'installeur
  télécharge la version épinglée et vérifie son empreinte SHA-256. `asc` envoie par défaut une télémétrie
  d'usage pseudonyme : l'installeur la désactive (`asc telemetry disable`, ou `ASC_TELEMETRY_DISABLED=1`).
  Les sous-commandes `asc web` passent par une session web Apple non officielle : à utiliser en
  connaissance de cause. Clés d'API App Store Connect et compte de service Google Play à créer par
  l'utilisateur.
- `mobile` et `mobile-expo` : fastlane, EAS CLI, Maestro ou Detox selon le projet, à installer depuis leur
  documentation officielle.
- SEO technique et audit publicitaire approfondis : les plugins
  [claude-seo](https://github.com/AgriciDaniel/claude-seo) et [claude-ads](https://github.com/AgriciDaniel/claude-ads)
  complètent `growth-seo` et `growth-ads`. Ils ne sont pas importés : ce sont des systèmes complets avec
  leur environnement Python, qui recoupent largement marketingskills. Les installer depuis leur dépôt si
  besoin.
- iOS avancé : le plugin [Axiom](https://github.com/CharlesWiltgen/Axiom) (StoreKit, notifications,
  sécurité, App Review) complète `mobile-ios`. Il n'est pas importé : ses skills dépendent de ses propres
  binaires, de son serveur MCP et de ses commandes. L'installer depuis son marketplace si besoin.

## Garde-fous

Le pack `guardrails` fait respecter des règles par des hooks : Claude ne peut ni les oublier ni les
contourner. Par défaut, il bloque :
- l'em dash ajouté dans un fichier, un commit, une PR ou une issue ;
- l'emoji non demandé (le marqueur IA ✨ et la ligne d'attribution restent permis) ;
- le push sur `main` ou `master` (refspec, branche courante, `HEAD`, suppression) ;
- tout contournement des hooks git (`--no-verify`, `core.hooksPath`, `HUSKY=0`) ;
- les secrets dans un fichier, une commande ou un commit, et les fichiers `.env` dans git ;
- un message de commit hors format Conventional Commits, un titre de PR ou d'issue sans marqueur IA ;
- la recherche d'identifiants de production hors du projet (secrets Kubernetes, coffres, historique du
  shell, `.env` d'un autre projet, tunnels vers la prod).

Il avertit seulement quand une configuration de lint est modifiée ou qu'une suppression d'avertissement
est ajoutée, et demande votre accord avant toute modification de sa propre configuration.

Chaque règle se règle ou se coupe dans `.claude/guardrails.json` (projet) ou `~/.claude/guardrails.json`
(machine) ; `"enabled": false` coupe tout, `claude plugin disable guardrails@ultime-skill` retire le
plugin. Pour une équipe sans le plugin, les sessions cloud ou l'autopilot,
`node <plugin>/runtime/setup.cjs install-project` copie les garde-fous dans le `.claude/` du projet.
Détail dans la skill `guardrails`. Nécessite `node`.

## Hooks de session

Deux packs installent un hook `SessionStart` qui s'exécute à chaque démarrage de session :

- `ponytail` active son mode (aussi dans chaque sous-agent, environ 2 900 caractères) et peut proposer
  une status line. Installé par défaut ; les agents d'app-factory s'appuient sur ses skills
  (`ponytail-review` en revue, `ponytail-audit` et `ponytail-debt` en reprise).
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
- Les skills Vercel (`fullstack`, `ui-design`) déclarent MIT en frontmatter mais leur dépôt n'a pas de fichier
  LICENSE ; la mention de licence voyage dans le frontmatter de la skill.
- Les skills Flutter sont en **BSD-3-Clause** ; Android (Google) et Play Billing (RevenueCat) en Apache-2.0.

Aucune skill sous licence non permissive bloquante (Semgrep Rules License, Databricks, AGPL) n'a été
retenue.

## Maintenance

La bibliothèque est reproductible : `plugins/` est entièrement régénéré, rien n'y est édité à la main. Les
skills importées viennent des dépôts épinglés ; les skills écrites maison vivent sous `authored/` et sont
superposées dans `plugins/` au build.

```bash
python scripts/build.py          # tout : vendor.json + import + overlay authored + manifestes + check
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
