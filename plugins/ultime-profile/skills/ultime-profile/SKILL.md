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
- `python <skill>/scripts/suggest_profile.py .` : packs justifies par les signaux du depot (table
  `references/stack-map.json`), regles par langage, permissions. C'est la base de la proposition ; le
  tableau des profils ci-dessous la complete selon la demande.
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

| Projet ou tache | Packs |
|---|---|
| Projet mene par app-factory (creation, clone, reprise) | app-factory, ci-forge, product-management, puis les packs de la stack ; greenfield seulement pour reconstruire un code dont on a les droits |
| App web (React, Next.js) | agent-skills, ci-forge, fullstack, ui-design, compliance, security, monitoring, prod-testing |
| API ou backend | agent-skills, ci-forge, security, devops, monitoring, prod-testing ; data-engineering si base de donnees |
| Mobile Expo ou React Native | mobile, mobile-expo, ui-design, compliance, security |
| Mobile iOS natif | mobile, mobile-ios, ui-design, compliance, security |
| Mobile Android natif | mobile, mobile-android, ui-design, compliance, security |
| Mobile Flutter | mobile, mobile-flutter, ui-design, compliance, security |
| Publication et fiche store (au lancement) | app-stores, puis store-apple et/ou store-google selon les stores vises, store-aso |
| Marketing et acquisition | growth (toujours : contexte produit partage), puis selon la tache growth-seo, growth-ads, growth-social, growth-analytics, growth-cro ; video-editing et motion-design pour produire des videos |
| Data | data-engineering, dataviz, monitoring |
| ML ou LLM | ml-engineering, data-engineering, monitoring |
| Infrastructure et exploitation | devops, finops, monitoring, security, prod-testing |
| Audit de securite | security, sec-audit, sec-defense |
| Contenu, motion, video | ui-design, motion-design, video-editing |

`guardrails` (garde-fous par hooks) est installe au niveau utilisateur par les scripts d'installation.
Pour un projet partage en equipe ou pilote en cloud (autopilot), proposer aussi sa copie dans le projet :
`node <plugin guardrails>/runtime/setup.cjs install-project`, a committer avec `.claude/`.

`ponytail` est actif partout : installe au niveau utilisateur par les scripts d'installation, il injecte
sa regle (plus petit changement complet) dans chaque session et chaque sous-agent (environ 2 900
caracteres) ; ne jamais le desactiver dans un projet sauf demande. `superpowers` ajoute aussi un hook de
session : le proposer seulement si sa methode est voulue. `sec-offense` ne s'installe que sur demande explicite,
pour des tests autorises.
