---
name: ci-forge
description: >
  Genere seul la CI/CD la plus complete pour un projet selon sa stack et son architecture cible :
  lint, format, typage, tests et couverture, end to end, build, conteneurs, Kubernetes, IaC, securite,
  SBOM, deploiement staging et prod, hooks locaux, mises a jour. A utiliser pour creer, completer,
  auditer ou durcir une CI, une pipeline, des GitHub Actions, ou "ci-forge".
---

# CI/CD sur mesure, sans intervention

Mission autonome : aucune question a l'utilisateur sauf un secret a fournir ou un reglage de depot
qu'il est seul a pouvoir faire. Le resultat est une PR qui rend la CI verte sur le code actuel, ou qui
corrige le code pour qu'elle le devienne. Une CI qui passe en affaiblissant les controles est un echec.

References (lire seulement celles de la stack detectee) :
- [references/workflow-rules.md](references/workflow-rules.md) : structure, niveaux, securite des workflows. Toujours.
- [references/python.md](references/python.md), [references/node.md](references/node.md) (Next.js, React, Expo
  web), [references/containers-k8s.md](references/containers-k8s.md), [references/iac.md](references/iac.md),
  [references/mobile.md](references/mobile.md), [references/other-languages.md](references/other-languages.md)
  (Go, Rust, JVM, PHP, Ruby, scripts shell et PowerShell).
- [references/security.md](references/security.md) : secrets, dependances, SAST, SBOM, provenance. Toujours.
- [references/cd.md](references/cd.md) : staging, production, environnements, OIDC, autopilot.

## 1. Comprendre le projet

1. `python <skill>/scripts/detect_stack.py .` (Python 3.11 ou plus, pour `tomllib` ; sinon
   `uv run --python 3.13 <skill>/scripts/detect_stack.py .`) : composants (langage, gestionnaire de
   paquets, frameworks, outils deja configures), conteneurs, Kubernetes, IaC, CI existante, task runner,
   hooks locaux.
2. Architecture cible et hebergement : ADR et `docs/architecture/`, `.app-factory/state.json` (stack, P3),
   README, fichiers de plateforme (`vercel.json`, `fly.toml`, `render.yaml`, `app.json`, `eas.json`,
   `wrangler.toml`, charts Helm). Sans cible connue : CI complete, CD limite au build d'artefact, et le
   noter dans le compte rendu.
3. CI existante : la garder si elle est saine, la completer et la durcir ; faire la liste des ecarts avec
   les references (job manquant, action non epinglee, permissions larges, controle desactive).

## 2. Concevoir

- Une table : composant x niveau (PR, branche principale, nuit, release) x job, avec la commande exacte.
  Tout ce qui s'applique a la stack detectee est inclus ; ce qui exige un secret absent est prepare mais
  conditionne (voir 5).
- **Une seule source pour les commandes** : chaque controle est une cible du task runner du projet
  (`Makefile`, `justfile`, scripts `package.json`, `noxfile.py`) que la CI appelle ; en local, la meme
  commande donne le meme resultat. Cible agregee `ci` qui enchaine les controles rapides.
- Seuils : couverture fixee au niveau actuel arrondi a l'inferieur (cliquet, elle ne peut que monter),
  jamais un chiffre arbitraire qui casse ou qui ne protege rien.
- Check requis unique `ci-ok` (job final qui depend de tous les autres) : c'est lui que la protection de
  branche et l'autopilot exigent, les jobs peuvent changer sans toucher aux reglages GitHub.

## 3. Generer

- `.github/workflows/ci.yml` (PR et branche principale), `nightly.yml` (controles longs, planifies),
  `release.yml` ou `deploy.yml` (voir `cd.md`) ; actions composites locales pour l'installation repetee.
- `.github/dependabot.yml` : chaque ecosysteme detecte plus `github-actions`, regroupement des mises a
  jour mineures, cadence hebdomadaire.
- Hooks locaux rapides : `lefthook.yml` (projet Node ou polyglotte) ou `.pre-commit-config.yaml`
  (Python) : format, lint des fichiers modifies, recherche de secrets. Jamais de tests longs.
- Configuration des outils absents mais attendus (ruff, ESLint ou Biome, tsconfig strict, Playwright,
  hadolint, kubeconform...) : creer avec des regles strictes ; si le code existant les viole, corriger le
  code, ou pour une dette trop large, une liste d'exceptions par fichier datee et tracee dans
  `docs/ops/ci.md`, jamais une regle coupee globalement.
- `docs/ops/ci.md` : chaque job, ce qu'il garantit, la commande locale, les secrets attendus.

## 4. Epingler et valider

1. `python <skill>/scripts/pin_actions.py --latest .github/workflows` : chaque action epinglee par SHA,
   version en commentaire. Une action qui change de version majeure : lire son `action.yml` a la
   version epinglee (`gh api repos/<owner>/<repo>/contents/action.yml?ref=<tag>`) et ajuster les inputs.
   Toute action des references doit passer par ce script avant usage : un `@vN` sans tag majeur mobile
   (ex. `astral-sh/setup-uv`) ne se resout pas tel quel. Le script echoue sur une reference qu'il ne sait
   pas resoudre (SHA court, majeur sans version x.y.z) et signale les lignes `uses:` qu'il ne comprend pas
   (`warning`) : les corriger a la main.
2. `actionlint` puis `zizmor` (audit de securite des workflows) : `uvx zizmor .github/workflows` ou
   `docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/zizmorcore/zizmor:1.31.1 .github/workflows` ; pour
   actionlint, le binaire s'il est installe, sinon
   `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -color` (version verifiee le 2026-10-21, a re-verifier).
   Aucune erreur restante.
3. **Lancer chaque cible du task runner en local, sans exception** : c'est la seule preuve que la CI
   sera verte (un fichier ecrit par la mission elle-meme peut casser le lint). Outil absent : l'executer
   dans l'image officielle (`ghcr.io/astral-sh/uv:python<version>-bookworm-slim`, `node:<lts>`,
   `golang:<version>`...), jamais l'installer globalement ni sauter l'etape. Sous Windows avec Git Bash,
   prefixer `docker run` de `MSYS_NO_PATHCONV=1` et monter un chemin absolu (`-v "C:/chemin:/repo"`).
   Un echec est un vrai probleme : corriger le code (ou la config de l'outil si elle est fausse), pas le
   controle. Seuls les jobs qui exigent l'infra de CI (kind, matrice d'OS, macOS) se valident sur la PR.
4. Seuil de couverture **mesure** par l'execution locale, jamais estime a la lecture du code.

## 5. Livrer

- Branche `ci/forge-<date>` (`claude/ci-forge-<date>` en autopilot), commits par sujet. Le push et la PR
  suivent le niveau d'autonomie du projet : seuls en autopilot, sinon apres l'accord de l'utilisateur
  (tout le reste de la mission se fait sans lui). PR en francais avec la table des jobs, les ecarts corriges,
  les verifications faites et ce qui reste conditionne. Attendre la CI de la PR et corriger jusqu'au vert.
- Secrets absents (deploiement, registre prive, `EXPO_TOKEN`, `CODECOV_TOKEN`...) : le job existe et
  se saute proprement. `secrets` est interdit dans un `if:` d'etape : copier le secret dans `env:` au
  niveau du job (`X: ${{ secrets.X }}`) et tester `if: env.X != ''` ; ou porter le job par
  l'environnement GitHub. La liste des secrets a creer va dans la PR.
- Fichier dont l'ecriture est refusee (hook, fichier protege comme une config de hooks) : ne pas
  contourner ; mettre son contenu exact dans la PR et le signaler comme etape a valider. En autopilot : une carte de decision unique qui les regroupe.
- Reglages que seul l'utilisateur fait : protection de la branche principale avec `ci-ok` requis,
  environnements `staging` et `production` (relecteur obligatoire), GitHub Advanced Security si le depot
  est prive et que CodeQL ou dependency-review sont voulus. Les lister, avec les commandes `gh` exactes.
- En app-factory : etat mis a jour, `ci-ok` note comme check requis dans `state.json` (bloc autopilot).

## Quand l'appeler

- app-factory : jalon M0 (squelette) pour la CI, P6 pour le CD ; mode reprise apres l'audit.
- Projet existant : a la demande, ou des que la stack change (nouveau composant, Dockerfile, chart).
- Revue periodique (nuit ou mensuelle en autopilot) : `pin_actions.py` sans `--latest` et Dependabot
  gardent les versions a jour ; relancer l'audit des ecarts une fois par trimestre.
