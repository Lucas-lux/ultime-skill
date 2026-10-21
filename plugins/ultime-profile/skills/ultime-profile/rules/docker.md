---
paths:
  - "**/Dockerfile"
  - "**/Dockerfile.*"
  - "**/*.dockerfile"
  - "**/compose*.y*ml"
  - "**/docker-compose*.y*ml"
---

# Docker

- Build multi-etapes, image de base epinglee (version et idealement digest), utilisateur non root.
- Aucun secret en `ARG`, `ENV` ou fichier copie ; secrets de build par `--mount=type=secret`.
- `.dockerignore` a jour ; une couche de dependances avant le code pour le cache.
- `HEALTHCHECK` ou probe de la plateforme ; compose avec healthchecks et `depends_on: condition`.
