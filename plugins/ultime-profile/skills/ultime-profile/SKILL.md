---
name: ultime-profile
description: >
  Installe et gere pour un projet les skills ultime-skill (ultime-factory) dont il a besoin, et seulement
  celles-la : detection du projet, installation des packs au niveau du projet, desactivation du reste,
  ajustement quand la tache change. A utiliser pour installer, configurer, mettre a jour ou alleger les
  skills d'un projet, ou "ultime-factory", "ultime-skill", "ultime-profile".
---

# Installer et gerer les skills d'un projet

Chaque skill d'un plugin actif ajoute sa description au contexte **a chaque tour**, et Claude Code n'en
garde qu'un budget limite (environ 1 % de la fenetre) : installer tout le catalogue degrade le
declenchement des skills. Cette skill installe donc, projet par projet, les seuls packs utiles.
`ultime-factory` designe le catalogue complet dans lequel elle choisit, pas un bundle a installer tel quel.

Catalogue des packs, de leur role et de leur cout : [references/catalog.md](references/catalog.md).

## 1. Prerequis

- La CLI : `claude` ; si elle n'est pas dans le PATH, `~/.local/bin/claude` (Windows :
  `%USERPROFILE%\.local\bin\claude.exe`).
- Le marketplace : `claude plugin marketplace list`. S'il manque `ultime-skill` :
  `claude plugin marketplace add Lucas-lux/ultime-skill`. Depot prive : il faut un acces git ; sans cle
  SSH, `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` avec des identifiants git configures (`gh auth setup-git`).
- Catalogue a jour : `claude plugin marketplace update ultime-skill`.

## 2. Comprendre le besoin

- Lire le projet : dependances et manifestes (`package.json`, `app.json`, `pubspec.yaml`, projet Xcode,
  `build.gradle`, `pyproject.toml`, `Dockerfile`, Terraform, dbt...), structure, `CLAUDE.md`.
- Ecouter la demande : un projet a mener de A a Z, a cloner ou a reprendre ajoute `app-factory` et
  `product-management` ; une app mobile ajoute le pack de sa technologie ; un lancement ajoute stores et
  growth.
- `python <skill>/scripts/suggest_profile.py .` : packs justifies par les signaux du
  depot (table `references/stack-map.json`), packs deja au niveau utilisateur (`user_level`), regles
  par langage (choisies d'apres le frontmatter `paths:` de chaque regle), permissions. C'est la base de
  la proposition ; le tableau des profils ci-dessous la complete selon la demande.
- Proposer la liste par question a choix multiples (plusieurs reponses), avec le cout de chaque pack.
  Projet vide : demander ce qui va etre construit.

## 3. Installer

- **Scope** : `project` si le profil doit etre partage avec l'equipe (ecrit dans `.claude/settings.json`,
  a committer) ; `local` pour un usage personnel (`.claude/settings.local.json`, hors git). Demander.
- En scope `project`, declarer aussi le marketplace pour l'equipe :
  `claude plugin marketplace add Lucas-lux/ultime-skill --scope project`.
- Installer chaque pack retenu **individuellement** :
  `claude plugin install <pack>@ultime-skill --scope <scope>`. Jamais un bundle `ultime-*` : il tire tous
  ses packs.
- Si des packs ou bundles ultime-skill sont deja actifs au niveau utilisateur sans etre utiles ici :
  `claude plugin disable <nom>@ultime-skill --scope <scope>` (un bundle dont une dependance est
  desactivee echoue au chargement, donc le desactiver aussi).
- Ne jamais toucher aux plugins d'autres marketplaces.
- **Regles par langage** : `suggest_profile.py . --write-rules` copie dans `.claude/rules/ultime/` les
  regles des langages presents (frontmatter `paths:`, chargees seulement quand Claude touche ces
  fichiers : cout nul ailleurs). Dossier entierement regenere a chaque passage, a committer en scope
  projet.
- **Permissions** (avec accord, scope choisi) : `--write-permissions project|local` ajoute les commandes
  de verification du projet en `allow` (tests, lint, typage, build) et met en `ask` la publication et le
  deploiement (npm publish, terraform apply, kubectl apply, docker push...). Les regles existantes sont
  gardees.
- Faire recharger : l'utilisateur lance `/reload-plugins` (ou redemarre la session). Verifier ensuite avec
  `claude plugin list` et resumer ce qui est actif et son cout.

## 4. Ajuster en cours de route

Quand la tache change de domaine, installer ou activer le pack necessaire (passer du code a la fiche
store, du build au lancement), recharger, et le desactiver apres si l'usage etait ponctuel.
`app-factory` le fait a ses etapes cles (cadrage, choix de stack, pre-production, lancement).

## Profils types

La source de verite des packs tires des signaux du depot est `references/stack-map.json` (lu par
`suggest_profile.py`) ; les lignes "signal" ci-dessous la resument, les lignes "demande" ajoutent ce que
le depot ne revele pas. Tout projet de code recoit en plus `agent-skills`, `ci-forge` et `security`
(`always_for_code`). En cas d'ecart, stack-map.json fait foi : corriger ce tableau.

| Projet ou tache | Source | Packs |
|---|---|---|
| Projet mene par app-factory (creation, clone, reprise) | signal `app-factory` | app-factory, product-management, puis les packs de la stack ; greenfield seulement pour reconstruire un code dont on a les droits |
| App web (React, Next.js, Vue, Svelte...) | signal `web-front` | fullstack, ui-design, compliance, monitoring, prod-testing |
| API ou backend | signal `api` | devops, monitoring, prod-testing ; data-engineering si base de donnees (signal `database`) |
| Mobile Expo ou React Native | signal `expo` | mobile, mobile-expo, ui-design, compliance |
| Mobile iOS natif | signal `ios` | mobile, mobile-ios, ui-design, compliance |
| Mobile Android natif | signal `android` | mobile, mobile-android, ui-design, compliance |
| Mobile Flutter | signal `flutter` | mobile, mobile-flutter, ui-design, compliance |
| Data | signal `data` | data-engineering, dataviz |
| ML ou LLM | signal `ml` | ml-engineering, monitoring |
| Conteneurs, Kubernetes, Terraform | signaux `containers`, `kubernetes`, `terraform` | devops, monitoring, finops |
| Infrastructure et exploitation (en plus) | demande | prod-testing |
| Publication et fiche store (au lancement) | demande | app-stores, puis store-apple et/ou store-google selon les stores vises, store-aso |
| Marketing et acquisition | demande | growth (toujours : contexte produit partage), puis selon la tache growth-seo, growth-ads, growth-social, growth-analytics, growth-cro ; video-editing et motion-design pour produire des videos |
| Audit de securite | demande | sec-audit, sec-defense |
| Contenu, motion, video | demande | ui-design, motion-design, video-editing |

`guardrails` et `ponytail` ne font pas partie de la liste a installer par projet : les scripts
d'installation les mettent au niveau utilisateur, et `suggest_profile.py` les rapporte a part
(`user_level` : deja au niveau utilisateur, copie dans le projet optionnelle pour une equipe ou le
cloud). Ne les proposer au niveau projet que pour un projet partage en equipe ou pilote en cloud
(autopilot) :

- `guardrails` (garde-fous par hooks) : `node <plugin guardrails>/runtime/setup.cjs install-project`, a
  committer avec `.claude/`.
- `ponytail` : `claude plugin install ponytail@ultime-skill --scope project`. Il injecte sa regle (plus
  petit changement complet) dans chaque session et chaque sous-agent (environ 2 900 caracteres) ; ne
  jamais le desactiver dans un projet sauf demande. `superpowers` ajoute aussi un hook de
session : le proposer seulement si sa methode est voulue. `sec-offense` ne s'installe que sur demande explicite,
pour des tests autorises.
