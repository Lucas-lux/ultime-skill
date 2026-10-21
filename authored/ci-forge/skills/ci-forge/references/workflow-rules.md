# Structure et securite des workflows

Versions verifiees le 2026-10-21 (majeures des actions et outils). Toute action ecrite d'apres ces
references est epinglee par `pin_actions.py --latest` avant usage, jamais laissee en `@vN` : certaines
n'ont pas de tag majeur mobile (`astral-sh/setup-uv`, `sigstore/cosign-installer`), d'ou leur version
exacte ici. Pour un outil, `git ls-remote --tags https://github.com/<owner>/<repo>`.

## Niveaux

| Niveau | Declencheur | Contenu | Budget |
|---|---|---|---|
| PR | `pull_request` | format, lint, typage, tests unitaires et integration, build, secrets, dependances, workflows, conteneur et manifestes si touches | < 10 min |
| Principale | `push` sur la branche principale | PR + end to end complet, deploiement d'essai (kind), SBOM, image publiee, staging | < 25 min |
| Nuit | `schedule` (cron) + `workflow_dispatch` | matrice complete (versions, OS), mutation, charge (k6) et Lighthouse sur staging, Scorecard, audit des dependances | libre |
| Release | tag `v*` ou `release: published` | artefacts, provenance, signature, production | selon CD |

`paths` ou `dorny/paths-filter@v4` pour ne lancer les jobs lourds (conteneur, kind, mobile) que si leurs
fichiers changent. Un job saute (filtre de chemins, `if:`) compte comme un echec pour `alls-green` : le
lister dans `allowed-skips` de `ci-ok`, et seulement lui (un job toujours attendu n'y figure jamais).

## Squelette de ci.yml

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
  merge_group:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
defaults:
  run:
    shell: bash
jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup       # action composite : runtime, cache, installation figee
      - run: make lint
  # typecheck, test, build, e2e, security, container, k8s, iac... selon la stack
  ci-ok:
    if: always()
    needs: [lint, typecheck, test, build, security, e2e, container, k8s]   # tous les jobs, sautables compris
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: re-actors/alls-green@release/v1
        with:
          jobs: ${{ toJSON(needs) }}
          allowed-skips: e2e, container, k8s   # exactement les jobs filtres par paths-filter ou if:
```

## Regles imposees

- `permissions: contents: read` en tete ; chaque job elargit seulement ce qu'il utilise
  (`packages: write`, `id-token: write`, `security-events: write`, `pull-requests: write`).
- Actions epinglees par SHA avec la version en commentaire ; Dependabot `github-actions` les met a jour.
- `persist-credentials: false` sur chaque checkout qui ne pousse pas.
- `timeout-minutes` sur chaque job ; `concurrency` qui annule les runs obsoletes de PR, jamais ceux de la
  branche principale ni des deploiements.
- Jamais d'expression `${{ github.event.* }}` (titre, branche, corps) dans un `run:` : la passer par `env:`
  (injection). `pull_request_target` interdit sauf besoin explicite, et alors sans checkout du code de la PR.
- Pas de secret dans les logs ni dans les artefacts ; `environment:` pour tout secret de deploiement.
- Caches par les actions `setup-*` (cle = lockfile) ; installation figee (`--frozen-lockfile`, `npm ci`,
  `uv sync --locked`), jamais de resolution flottante en CI.
- Artefacts utiles en cas d'echec (rapport Playwright, couverture, SARIF) avec `if: failure()` ou
  `always()` et une `retention-days` courte (7).
- Noms de jobs stables et courts (`lint`, `typecheck`, `test`, `build`, `e2e`, `security`, `container`,
  `k8s`, `iac`, `mobile`) : ils apparaissent dans les PR.
- `merge_group` present pour fonctionner avec une merge queue.
- Validation : `actionlint` (1.7.12) et `zizmor` (1.31.1) sans erreur avant la PR.
- Actions locales : `uses: ./.github/actions/<nom>`. zizmor (`self-repository`) propose la syntaxe `$/`
  qu'actionlint 1.7.12 refuse encore : garder `./` et declarer l'exception dans `.github/zizmor.yml`
  avec sa raison et une date de revue.
- Condition sur un secret optionnel : `env:` au niveau du job puis `if: env.X != ''` (jamais
  `secrets.X` dans un `if:`).

## Hooks locaux

- `lefthook.yml` (lefthook 2.2.2) : `pre-commit` en parallele sur les fichiers indexes (format, lint),
  `pre-push` pour typage et tests rapides si moins de 30 s. Installation par le gestionnaire du projet
  (`lefthook` en devDependency et `lefthook install` dans un script `prepare`).
- `.pre-commit-config.yaml` (pre-commit 4.7.0) pour Python : ruff (`ruff-check --fix`, `ruff-format`),
  verifications de base (fin de fichier, YAML, gros fichiers), gitleaks.
- Les hooks locaux ne remplacent jamais la CI : ils evitent seulement un aller-retour.
