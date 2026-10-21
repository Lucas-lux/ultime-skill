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

# Kubernetes et Helm

- Chaque conteneur : requests et limits, probes (readiness, liveness), `runAsNonRoot`,
  `readOnlyRootFilesystem`, image epinglee (jamais `latest`).
- Secrets par l'outil du cluster (External Secrets, Sealed Secrets), jamais en clair dans le depot.
- Valider le rendu (`helm template`, `kustomize build`) avec kubeconform avant de rendre la main.
- Jamais `kubectl apply`, `delete` ou `helm upgrade` sur un cluster reel sans confirmation.
