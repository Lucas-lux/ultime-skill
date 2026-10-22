---
paths:
  - "**/Dockerfile"
  - "**/Dockerfile.*"
  - "**/*.dockerfile"
  - "**/compose*.y*ml"
  - "**/docker-compose*.y*ml"
---

# Docker

- Multi-stage build, pinned base image (version and ideally digest), non-root user.
- No secret in `ARG`, `ENV` or a copied file; build secrets through `--mount=type=secret`.
- `.dockerignore` up to date; a dependencies layer before the code for the cache.
- `HEALTHCHECK` or the platform's probe; compose with healthchecks and `depends_on: condition`.
