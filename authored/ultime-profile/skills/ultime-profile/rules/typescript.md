---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
  - "**/tsconfig*.json"
---

# TypeScript

- `strict` respecte : pas de `any` (preferer `unknown` puis un garde de type), pas de `!` non justifie,
  pas de `@ts-ignore` (au besoin `@ts-expect-error` avec la raison).
- Types derives des donnees (`z.infer`, `typeof`, `satisfies`) plutot que dupliques a la main.
- Erreurs : `Error` avec `cause`, jamais un rejet de chaine ; toute promesse est attendue ou geree.
- Imports : ceux du projet (alias de `tsconfig`), pas de barrels qui creent des cycles.
- Verifier avec `tsc --noEmit` et le lint du projet sur les fichiers touches.
