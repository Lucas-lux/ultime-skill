# Deploiement continu

Principe : le meme artefact (image par digest, build signe) passe de staging a la production ; la
production attend toujours l'approbation de l'utilisateur via l'environnement GitHub `production`.

## Environnements GitHub

- `staging` : pas de relecteur, deploiement automatique a chaque fusion sur la branche principale.
- `production` : relecteur obligatoire (l'utilisateur), branches autorisees : principale et tags `v*`.
- Les secrets de deploiement vivent dans l'environnement, jamais au niveau du depot ni dans le code.
- Cloud : OIDC (`id-token: write`) vers AWS (`aws-actions/configure-aws-credentials`), GCP
  (`google-github-actions/auth`, Workload Identity Federation), Azure (`azure/login`) ; aucune cle longue.

## Workflow deploy.yml

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  staging:
    environment: staging
    concurrency: { group: deploy-staging, cancel-in-progress: false }
    # deploiement de l'artefact construit par ci.yml (image par digest), puis smoke tests
  production:
    needs: staging
    environment: production        # attend l'approbation de l'utilisateur
    concurrency: { group: deploy-production, cancel-in-progress: false }
```

Apres chaque deploiement : smoke tests sur l'URL deployee (sante, parcours critique), puis rollback
automatique si echec (version precedente, ou revert du deploiement de la plateforme). Le rollback se
teste au moins une fois en staging (pack `prod-testing`, skill `testing-in-production`).

## Par plateforme

| Cible | Deploiement | Notes |
|---|---|---|
| Vercel | integration Git de Vercel (apercus de PR) ; ou `vercel deploy --prebuilt` avec `VERCEL_TOKEN` | e2e et Lighthouse contre l'URL d'apercu |
| Netlify, Cloudflare Pages ou Workers | CLI (`netlify deploy`, `wrangler deploy`) avec token d'environnement | |
| Fly.io, Render, Railway | `flyctl deploy --image <digest>` ou hook de deploiement | |
| Kubernetes | GitOps (Argo CD, Flux) : la CI met a jour le tag d'image dans le depot de config ; sinon `helm upgrade --install --atomic` | `--atomic` annule seul un echec |
| AWS ECS, Cloud Run, App Service | action officielle de la plateforme avec OIDC | |
| Mobile | EAS Submit, fastlane, `asc`, `gplay` (pack `mobile`, `app-stores`) | soumission en store toujours confirmee |

## Autopilot

- Le check requis de la branche principale est `ci-ok` ; il est note dans `state.json`.
- Le deploiement de staging part du push sur la branche principale fait par la fusion automatique
  (`autopilot-merge`, token dedie : les pushes du `GITHUB_TOKEN` ne declenchent pas d'autre workflow).
- La production reste une carte de decision (G6) puis l'approbation de l'environnement.
