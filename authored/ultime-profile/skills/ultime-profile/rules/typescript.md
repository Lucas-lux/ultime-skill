---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
  - "**/tsconfig*.json"
---

# TypeScript

- `strict` respected: no `any` (prefer `unknown` then a type guard), no unjustified `!`, no
  `@ts-ignore` (if needed `@ts-expect-error` with the reason).
- Types derived from data (`z.infer`, `typeof`, `satisfies`) rather than duplicated by hand.
- Errors: `Error` with `cause`, never a string rejection; every promise is awaited or handled.
- Imports: the project's own (`tsconfig` aliases), no barrels that create cycles.
- Check with `tsc --noEmit` and the project's lint on the touched files.
