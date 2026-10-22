# Node, TypeScript, Next.js and front

## Installation (composite action)

- pnpm: `pnpm/action-setup@v6` then `actions/setup-node@v7` with `cache: pnpm` and
  `node-version-file: .nvmrc` (otherwise `engines.node`, otherwise the active LTS), then
  `pnpm install --frozen-lockfile`. npm: `cache: npm`, `npm ci`. Yarn: `corepack enable`,
  `yarn install --immutable`. Bun: `oven-sh/setup-bun@v2`, `bun install --frozen-lockfile`.
- Monorepo (Turborepo, Nx, workspaces): commands through the tool (`turbo run lint test build --affected`
  on PR, remote cache only if configured), matrix per package otherwise.

## Jobs

| Job | Command | Notes |
|---|---|---|
| format | `prettier --check .` or `biome format` (via `biome ci`) | |
| lint | `eslint . --max-warnings=0` or `biome ci .` | `next lint` no longer exists in recent Next.js: ESLint directly with `eslint-config-next` |
| typecheck | `tsc --noEmit` (`vue-tsc --noEmit`, `astro check`, `svelte-check`) | `strict: true`, `noUncheckedIndexedAccess` for a new project |
| unused | `knip` | unused files, exports and dependencies: the CI prevents dead code from coming back |
| test | `vitest run --coverage` (or `jest --ci --coverage`) | ratcheted coverage thresholds in the config |
| build | `next build`, `vite build`, `tsc -b` | Next.js: `.next/cache` cache (key lockfile + sources); the build must pass without a secret variable |
| e2e | `playwright test` (Playwright 1.64) | see below |
| deps | `pnpm audit --audit-level=high` or `npm audit --audit-level=high` (in addition to osv-scanner) | |

## End to end with Playwright

- `npx playwright install --with-deps chromium` (cache of `~/.cache/ms-playwright` per version).
- The app started by `webServer` in `playwright.config` (prod build + `next start`), never `next dev`.
- PR: critical journeys on Chromium. Main and nightly: Chromium, Firefox, WebKit and a mobile profile,
  in shards (`--shard=${{ matrix.shard }}/4`) with report merging (`merge-reports`).
- Accessibility in the same tests: `@axe-core/playwright`, failure on any `serious` or `critical`
  violation.
- Visual regression (`toHaveScreenshot`) only if the reference screenshots are versioned and generated
  in the same container as the CI.
- HTML report and traces as artifacts on failure.

## Front performance and quality

- Lighthouse CI (`treosh/lighthouse-ci-action@12.6.2` or `@lhci/cli autorun`) on the local build on
  main, with `budgets.json` (LCP, CLS, TBT, JS weight); on the staging URL nightly.
- Bundle size: `size-limit` with caps per entry point, or the Next.js build analysis.
- Storybook: `storybook build` then interaction tests (`test-storybook`) if Storybook exists.
- Links and basic SEO for a site: `next-sitemap` present, metadata checked in the e2e tests.

## Node backend (NestJS, Express, Fastify, Hono, tRPC)

- Integration tests against `services:` (Postgres, Redis); Prisma migrations
  (`prisma migrate deploy`, then to detect an unmigrated schema, Prisma 7:
  `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`,
  shadow database declared in `prisma.config.ts`; Prisma 6: `--to-schema-datamodel prisma/schema.prisma
  --shadow-database-url $SHADOW_DATABASE_URL` instead; code 2 = unmigrated schema) or
  Drizzle (`drizzle-kit check`).
- API contract: generated OpenAPI schema compared to the repository's; `schemathesis` against the
  started app.

## Nightly level

- Mutation: Stryker (`@stryker-mutator/core`) on critical modules.
- Matrix of Node versions (active LTS) for a library.
