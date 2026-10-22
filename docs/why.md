# Why ultime-skill, and what it brings

## The problem

A coding assistant like Claude Code is very capable, but left to itself on a real project, it always
runs into the same obstacles:

- **It only knows what it is told.** The best practices of a stack (Next.js, FastAPI, Expo,
  Kubernetes), of a domain (GDPR compliance, App Store listing, SEO) or of a method (security review,
  end-to-end tests) are not applied consistently from one session to the next.
- **It waits to be driven.** Without orchestration, every step needs an instruction, a review and a
  human decision. The human becomes the bottleneck.
- **Rules do not hold.** An instruction written in an instructions file is forgotten after a long
  session; nothing prevents a direct push to the main branch or a committed secret.
- **Quality depends on the day.** Missing or incomplete CI, skipped tests, shallow reviews: the code
  "works" until production.
- **The context saturates.** Installing hundreds of skills loads their descriptions into every session;
  beyond a certain volume, Claude Code keeps only part of them and chooses less well.
- **Licenses are unclear.** Many public skills are copied without checking their rights.

## The answer

| Obstacle | What ultime-skill does |
|---|---|
| Inconsistent know-how | 473 skills and 24 agents, selected, cleaned and pinned to a version, covering the full cycle: product, code, design, mobile, stores, security, compliance, ops, data, growth |
| Constant driving | `app-factory` orchestrates a project from idea to production with specialized agents; `autopilot` mode moves it forward on its own and only escalates vision decisions |
| Forgotten rules | hooks (`guardrails`) refuse at the source what is forbidden: em dash, unrequested emoji, push to the main branch, secrets, bypassing git hooks, searching for production credentials |
| Variable quality | `ci-forge` generates the most complete CI/CD for the detected stack; the reviews (`security-review`, `sast`, `ui-review`, `ponytail-review`) require evidence for each finding; `ponytail` enforces the smallest complete change |
| Saturated context | 43 independent packs; `ultime-profile` installs in each project only the useful packs, and per-language rules loaded only when Claude touches those files |
| Unclear licenses | only permissive licenses (MIT, Apache-2.0, BSD-3-Clause), tooled audit, modification notices |

## The concrete gain on a project

Example: a Next.js application with a Postgres database.

**Without the library**, the session starts from scratch every time. The developer restates their
conventions, writes the CI themselves (often a lint and unit tests), reviews every change, remembers (or
not) accessibility, security headers, reversible migrations, and checks by hand that nothing is pushed to
the main branch.

**With the library**:

1. `ultime-profile` reads the repository and proposes 11 packs (about 24,000 characters of descriptions,
   or 13% of the full catalog) with the reason for each, writes the project's TypeScript, React and test
   rules, and allows the verification commands while requiring confirmation to publish or deploy.
2. The guardrails are active from the first command: what is forbidden is refused with the reason and the
   expected fix, without relying on the agent's memory.
3. `ci-forge` generates a complete CI: lint, type checking, tests with ratcheted coverage, Playwright with
   an accessibility check, build, Lighthouse, secret scanning, static analysis, dependency audit,
   container if present, staging and production deployment, actions pinned by SHA, and a single required
   check `ci-ok`. During a real trial on a FastAPI API, the generation also fixed three defects in the
   project (Alembic migrations without `env.py`, Postgres without a password, Docker image running as
   root).
4. `app-factory` splits the work into milestones and stories, has each story implemented, reviewed,
   tested and verified by dedicated agents, and has the gates (specification, design, pre-production)
   validated by an independent verifier.
5. In `autopilot`, the project moves forward through scheduled wake-ups: PRs merge when the CI is green,
   staging deploys, and only the decisions that commit the vision, money, the law or the irreversible
   reach the owner, as a GitHub issue they answer from their phone.

What concretely changes:

- **Fewer human interventions**: the human settles decisions, they no longer hand out tasks.
- **A guaranteed quality floor**: what the CI and the guardrails refuse can no longer get through,
  whatever the session or the agent.
- **Verifiable reviews**: each finding carries a file, a line and a path; a check that was not run is
  never counted as passed.
- **A controlled context cost**: a project only pays for the packs it uses.
- **A library reusable without legal risk**: everything can be used, modified and exploited commercially
  as long as the notices are kept.

## What the library does not do

- It does not replace human decisions: pricing, scope, brand, production release, spending, contracts and
  store submissions remain confirmed by the owner.
- It does not guarantee a defect-free product: it raises the quality floor and makes gaps visible, it
  does not exempt anyone from looking at what is delivered.
- Autopilot mode relies on Claude Code scheduled tasks in the cloud, still in preview: their behavior
  should be checked at the first wake-up (see [App factory and autopilot](app-factory-and-autopilot.md)).
- A cloud session does not know its cost in dollars: the budget there is held in number of agents per
  wake-up and per day, and by the frequency of wake-ups.
