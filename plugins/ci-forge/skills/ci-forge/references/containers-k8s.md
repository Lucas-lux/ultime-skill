# Conteneurs et Kubernetes

## Conteneurs (un Dockerfile ou un compose detecte)

| Job | Comment | Niveau |
|---|---|---|
| lint | `hadolint/hadolint-action@v3.5.0` (hadolint 2.15.1), `failure-threshold: warning` | PR |
| build | `docker/setup-buildx-action@v4` puis `docker/build-push-action@v7` avec `load: true`, `cache-from/to: type=gha`, `platforms` de la cible | PR |
| scan | `aquasecurity/trivy-action@v0.36.0` (Trivy 0.76.1) sur l'image : `severity: HIGH,CRITICAL`, `ignore-unfixed: true`, `exit-code: 1`, SARIF publie si GitHub Advanced Security | PR |
| structure | `container-structure-test` (1.22.1) : utilisateur non root, ports, fichiers attendus, absence d'outils de build dans l'image finale | PR |
| smoke | `docker compose up -d --wait` (healthchecks obligatoires), requete sur `/health` et un parcours minimal, `docker compose logs` si echec | PR |
| publish | `docker/login-action@v4` sur GHCR avec `GITHUB_TOKEN` (`packages: write`), `docker/metadata-action@v6` (tags SHA et version), push | principale |
| sbom | `anchore/sbom-action@v0.24.3` (SPDX) attache a l'image ; `actions/attest-build-provenance@v4` (`id-token: write`, `attestations: write`) | principale |
| sign | `sigstore/cosign-installer@v4.1.2` (pas de tag majeur mobile `v4`) puis `cosign sign --yes` en keyless (OIDC) | release |

Exigences verifiees : build multi-etapes, image de base epinglee par digest (Dependabot `docker`),
utilisateur non root, `HEALTHCHECK` ou probe equivalente, pas de secret en `ARG` ou `ENV`,
`.dockerignore` present.

## Kubernetes (manifestes, Helm ou Kustomize detectes)

| Job | Comment | Niveau |
|---|---|---|
| render | `helm lint --strict` puis `helm template` (Helm 4.3.1, `azure/setup-helm@v5`) ; `kustomize build` | PR |
| schema | `kubeconform -strict -summary -ignore-missing-schemas` (0.8.0) avec le catalogue de CRD (`-schema-location default -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'`) sur le rendu | PR |
| policy | `kube-linter lint` (0.8.3) sur le rendu : limites de ressources, probes, `runAsNonRoot`, `readOnlyRootFilesystem`, pas de `latest` ; `trivy config` en complement | PR |
| deploy-test | `helm/kind-action@v1` (kind 0.33.0) : cluster ephemere, `kind load docker-image` de l'image construite, `helm upgrade --install --wait --timeout 5m` (ou `kubectl apply -k`), `kubectl rollout status`, test de fumee par `kubectl port-forward` ou Job de test, `kubectl get events` et logs si echec | principale (PR si chart modifie) |
| upgrade | dans le meme cluster : installer la version precedente du chart, puis la nouvelle (montee de version sans casse) | nuit |

- Valeurs de CI dediees (`values-ci.yaml`) : une replique, ressources faibles, dependances en
  sous-charts ou conteneurs de service.
- Pas d'acces a un cluster reel depuis la CI de PR ; le deploiement reel passe par `cd.md` (GitOps ou
  environnement GitHub).
