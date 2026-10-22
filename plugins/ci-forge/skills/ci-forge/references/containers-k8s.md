# Containers and Kubernetes

## Containers (a Dockerfile or a compose file detected)

| Job | How | Level |
|---|---|---|
| lint | `hadolint/hadolint-action@v3.5.0` (hadolint 2.15.1), `failure-threshold: warning` | PR |
| build | `docker/setup-buildx-action@v4` then `docker/build-push-action@v7` with `load: true`, `cache-from/to: type=gha`, the target's `platforms` | PR |
| scan | `aquasecurity/trivy-action@v0.36.0` (Trivy 0.76.1) on the image: `severity: HIGH,CRITICAL`, `ignore-unfixed: true`, `exit-code: 1`, SARIF published if GitHub Advanced Security | PR |
| structure | `container-structure-test` (1.22.1): non-root user, ports, expected files, no build tools in the final image | PR |
| smoke | `docker compose up -d --wait` (healthchecks mandatory), request on `/health` and a minimal journey, `docker compose logs` on failure | PR |
| publish | `docker/login-action@v4` on GHCR with `GITHUB_TOKEN` (`packages: write`), `docker/metadata-action@v6` (SHA and version tags), push | main |
| sbom | `anchore/sbom-action@v0.24.3` (SPDX) attached to the image; `actions/attest-build-provenance@v4` (`id-token: write`, `attestations: write`) | main |
| sign | `sigstore/cosign-installer@v4.1.2` (no moving major tag `v4`) then `cosign sign --yes` keyless (OIDC) | release |

Verified requirements: multi-stage build, base image pinned by digest (Dependabot `docker`), non-root
user, `HEALTHCHECK` or equivalent probe, no secret in `ARG` or `ENV`, `.dockerignore` present.

## Kubernetes (manifests, Helm or Kustomize detected)

| Job | How | Level |
|---|---|---|
| render | `helm lint --strict` then `helm template` (Helm 4.3.1, `azure/setup-helm@v5`); `kustomize build` | PR |
| schema | `kubeconform -strict -summary -ignore-missing-schemas` (0.8.0) with the CRD catalog (`-schema-location default -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'`) on the render | PR |
| policy | `kube-linter lint` (0.8.3) on the render: resource limits, probes, `runAsNonRoot`, `readOnlyRootFilesystem`, no `latest`; `trivy config` as a complement | PR |
| deploy-test | `helm/kind-action@v1` (kind 0.33.0): ephemeral cluster, `kind load docker-image` of the built image, `helm upgrade --install --wait --timeout 5m` (or `kubectl apply -k`), `kubectl rollout status`, smoke test through `kubectl port-forward` or a test Job, `kubectl get events` and logs on failure | main (PR if the chart changed) |
| upgrade | in the same cluster: install the previous version of the chart, then the new one (upgrade without breakage) | nightly |

- Dedicated CI values (`values-ci.yaml`): one replica, low resources, dependencies as subcharts or
  service containers.
- No access to a real cluster from the PR CI; the real deployment goes through `cd.md` (GitOps or
  GitHub environment).
