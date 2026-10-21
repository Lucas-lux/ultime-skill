---
paths:
  - "**/*.sql"
  - "**/migrations/**"
  - "**/alembic/**"
  - "**/prisma/**"
  - "**/schema.prisma"
---

# SQL et migrations

- Une migration = un changement reversible (montee et descente) ; jamais modifier une migration deja
  appliquee, en ajouter une.
- Changements sans interruption : ajouter une colonne nullable puis remplir puis contraindre ; index
  crees sans verrou bloquant (`CONCURRENTLY` en Postgres) sur une grosse table.
- Pas de donnees personnelles en clair dans les fixtures ; jamais de donnees de production en local.
