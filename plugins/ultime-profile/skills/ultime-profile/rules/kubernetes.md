---
paths:
  - "**/k8s/**"
  - "**/kubernetes/**"
  - "**/manifests/**"
  - "**/charts/**"
  - "**/helm/**"
  - "**/kustomization.y*ml"
  - "**/Chart.yaml"
---

# Kubernetes and Helm

- Each container: requests and limits, probes (readiness, liveness), `runAsNonRoot`,
  `readOnlyRootFilesystem`, pinned image (never `latest`).
- Secrets through the cluster's tool (External Secrets, Sealed Secrets), never in clear in the repository.
- Validate the render (`helm template`, `kustomize build`) with kubeconform before handing back.
- Never `kubectl apply`, `delete` or `helm upgrade` on a real cluster without confirmation.
