# Node, TypeScript, Next.js et front

## Installation (action composite)

- pnpm : `pnpm/action-setup@v6` puis `actions/setup-node@v7` avec `cache: pnpm` et
  `node-version-file: .nvmrc` (sinon `engines.node`, sinon la LTS active), puis
  `pnpm install --frozen-lockfile`. npm : `cache: npm`, `npm ci`. Yarn : `corepack enable`,
  `yarn install --immutable`. Bun : `oven-sh/setup-bun@v2`, `bun install --frozen-lockfile`.
- Monorepo (Turborepo, Nx, workspaces) : commandes par l'outil (`turbo run lint test build --affected`
  en PR, cache distant seulement si configure), matrice par paquet sinon.

## Jobs

| Job | Commande | Notes |
|---|---|---|
| format | `prettier --check .` ou `biome format` (via `biome ci`) | |
| lint | `eslint . --max-warnings=0` ou `biome ci .` | `next lint` n'existe plus dans Next.js recent : ESLint direct avec `eslint-config-next` |
| typecheck | `tsc --noEmit` (`vue-tsc --noEmit`, `astro check`, `svelte-check`) | `strict: true`, `noUncheckedIndexedAccess` pour un projet neuf |
| unused | `knip` | fichiers, exports et dependances inutilises : la CI empeche le code mort de revenir |
| test | `vitest run --coverage` (ou `jest --ci --coverage`) | seuils de couverture en cliquet dans la config |
| build | `next build`, `vite build`, `tsc -b` | Next.js : cache `.next/cache` (cle lockfile + sources) ; le build doit passer sans variable secrete |
| e2e | `playwright test` (Playwright 1.64) | voir plus bas |
| deps | `pnpm audit --audit-level=high` ou `npm audit --audit-level=high` (en plus de osv-scanner) | |

## End to end avec Playwright

- `npx playwright install --with-deps chromium` (cache de `~/.cache/ms-playwright` par version).
- L'app demarree par `webServer` dans `playwright.config` (build de prod + `next start`), jamais `next dev`.
- PR : parcours critiques sur Chromium. Principale et nuit : Chromium, Firefox, WebKit et un profil
  mobile, en shards (`--shard=${{ matrix.shard }}/4`) avec fusion des rapports (`merge-reports`).
- Accessibilite dans les memes tests : `@axe-core/playwright`, echec sur toute violation `serious` ou
  `critical`.
- Regression visuelle (`toHaveScreenshot`) seulement si les captures de reference sont versionnees et
  generees dans le meme conteneur que la CI.
- Rapport HTML et traces en artefact si echec.

## Performance et qualite front

- Lighthouse CI (`treosh/lighthouse-ci-action@12.6.2` ou `@lhci/cli autorun`) sur le build local en
  principale, avec `budgets.json` (LCP, CLS, TBT, poids JS) ; sur l'URL de staging la nuit.
- Taille des bundles : `size-limit` avec plafonds par point d'entree, ou l'analyse du build Next.js.
- Storybook : `storybook build` puis tests d'interaction (`test-storybook`) si Storybook existe.
- Liens et SEO de base pour un site : `next-sitemap` present, verification des metadonnees dans les e2e.

## Backend Node (NestJS, Express, Fastify, Hono, tRPC)

- Tests d'integration contre `services:` (Postgres, Redis) ; migrations Prisma
  (`prisma migrate deploy` puis `prisma migrate diff --exit-code` pour detecter un schema non migre) ou
  Drizzle (`drizzle-kit check`).
- Contrat d'API : schema OpenAPI genere compare a celui du depot ; `schemathesis` contre l'app demarree.

## Niveau nuit

- Mutation : Stryker (`@stryker-mutator/core`) sur les modules critiques.
- Matrice de versions de Node (LTS actives) pour une bibliotheque.
