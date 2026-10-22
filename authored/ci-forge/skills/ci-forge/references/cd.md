# Continuous deployment

Principle: the same artifact (image by digest, signed build) goes from staging to production; production
always waits for the user's approval through the GitHub `production` environment.

## GitHub environments

- `staging`: no reviewer, automatic deployment on each merge to the main branch.
- `production`: mandatory reviewer (the user), allowed branches: main and `v*` tags.
- Deployment secrets live in the environment, never at the repository level or in the code.
- Cloud: OIDC (`id-token: write`) to AWS (`aws-actions/configure-aws-credentials`), GCP
  (`google-github-actions/auth`, Workload Identity Federation), Azure (`azure/login`); no long-lived key.

## deploy.yml workflow

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

After each deployment: smoke tests on the deployed URL (health, critical journey), then automatic
rollback on failure (previous version, or revert of the platform deployment). The rollback is tested at
least once in staging (`prod-testing` pack, `testing-in-production` skill).

## Per platform

| Target | Deployment | Notes |
|---|---|---|
| Vercel | Vercel Git integration (PR previews); or `vercel deploy --prebuilt` with `VERCEL_TOKEN` | e2e and Lighthouse against the preview URL |
| Netlify, Cloudflare Pages or Workers | CLI (`netlify deploy`, `wrangler deploy`) with an environment token | |
| Fly.io, Render, Railway | `flyctl deploy --image <digest>` or deploy hook | |
| Kubernetes | GitOps (Argo CD, Flux): the CI updates the image tag in the config repository; otherwise `helm upgrade --install --atomic` | `--atomic` rolls back a failure on its own |
| AWS ECS, Cloud Run, App Service | official platform action with OIDC | |
| Mobile | EAS Submit, fastlane, `asc`, `gplay` (`mobile` pack, `app-stores`) | store submission always confirmed |

## Autopilot

- The required check of the main branch is `ci-ok`; it is noted in `state.json`.
- The staging deployment starts from the push to the main branch made by the automatic merge
  (`autopilot-merge`, dedicated token: pushes by `GITHUB_TOKEN` do not trigger other workflows).
- Production remains a decision card (G6) then the environment approval.
