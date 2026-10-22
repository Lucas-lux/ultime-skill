---
paths:
  - "**/*.sql"
  - "**/migrations/**"
  - "**/alembic/**"
  - "**/prisma/**"
  - "**/schema.prisma"
---

# SQL and migrations

- One migration = one reversible change (up and down); never modify a migration already applied, add a
  new one.
- Zero-downtime changes: add a nullable column then backfill then constrain; indexes created without a
  blocking lock (`CONCURRENTLY` in Postgres) on a large table.
- No personal data in clear in fixtures; never production data locally.
