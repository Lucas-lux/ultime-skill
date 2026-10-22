# Phases, agents, deliverables and gates

Deliverables live in the project repository (they are its durable documentation); the
orchestration state lives in `.app-factory/` (see `state.md`). Skill names in backticks are to be
loaded via the Skill tool when the matching pack is installed.

## Agent prompt template

```
Role: <role> for the project <name> (mode <creation|clone|takeover>), phase <Pn>.
Context to read: <paths: brief, PRD, ADR, etc.>
Task: <one bounded task>
Deliverable: <exact path of the file to write or the code to produce>
Definition of done: <verifiable criteria>
Skills to load: <names>
Constraints: <stack, repository conventions, decisions already made>
Return: a short summary (done, files produced, checks done, open questions, risks).
```

## P0 Framing

- **Creation**: refine the idea with the user (`interview-me`, `idea-refine` or `brainstorming`).
- **Clone**: `app-clone` skill (reference dossier, parity matrix, customization brief).
- **Takeover**: `app-takeover` skill (inventory, reverse spec, audit, takeover plan).
- Deliverable: `docs/product/brief.md` (problem, target, platforms, market and languages, constraints,
  success criteria, mode, autonomy level).
- **G0**: the brief is complete and validated by the user; in clone, the distinctiveness check is
  done; in takeover, the inventory and the audit are shared.

## P1 Discovery

- Agent `product-strategist`. Skills: `competitor-analysis`, `user-personas`, `market-segments`,
  `market-sizing` (if useful), `identify-assumptions-new` or `identify-assumptions-existing`,
  `opportunity-solution-tree`, `value-proposition`, `positioning-ideas`, `business-model`,
  `monetization-strategy`, `pricing-strategy`, `north-star-metric`.
- Deliverable: `docs/product/discovery.md` (targets and needs, alternatives, positioning, business
  model, north star metric, riskiest assumptions and how to test them).
- **G1**: go, pivot or stop. The risky assumptions each have a test or a mitigation. No
  market figure presented as a fact without a source.

## P2 Specification

- `product-manager`: `create-prd`, then `strategy-red-team` or `pre-mortem` on the PRD. Quantified
  non-functional requirements: performance, availability, security, accessibility, languages, offline
  (mobile), volumes. MVP scope, next versions, non-goals.
- `compliance-officer`: initial regulatory scan (personal data, cookies, legal notices,
  terms of use / terms of sale if selling, accessibility, AI, user-published content, sensitive sectors: health,
  minors, finance; store policies if mobile).
- `finops-analyst`: first cost envelope (hosting, third-party services, store fees, tools,
  acquisition budget) in sourced ranges.
- Deliverables: `docs/product/prd.md`, `docs/compliance/obligations.md`, `docs/finops/cost-envelope.md`.
- **G2**: each requirement is testable and identified (`REQ-xxx`), no blocking question open, the
  regulatory obligations are listed, the cost envelope is accepted.

## P3 Design

Sequence: the architect first (it sets the stack and the boundaries), then the others in parallel.

- `software-architect`: stack via `stack-selection.md`, ADRs (`documentation-and-adrs`), C4 view
  context and containers, API contracts (`api-and-interface-design`), environments (dev, staging,
  prod), integrations, test strategy. Deliverables: `docs/architecture/architecture.md`,
  `docs/adr/NNNN-*.md`.
- `data-architect`: data model, migrations, indexes, constraints, permissions, backups,
  retention. Deliverable: `docs/architecture/data-model.md`.
- `ux-designer`: journeys, screens, states (empty, loading, error), design system and tokens,
  accessibility. Deliverable: `docs/design/ux.md` (and mockups if a tool is available).
- `security-engineer`: threat model (`security-threat-model`), authentication, authorization,
  secrets management, targeted ASVS or MASVS level. Deliverable: `docs/security/threat-model.md`.
- `finops-analyst`: refined envelope, unit cost, planned budgets and alerts.
- `compliance-officer`: privacy by design (record of processing, legal bases, DPIA if required, processors),
  plan of the legal pages and of consent. Deliverable: `docs/compliance/privacy-by-design.md`.
- **G3**: each `REQ-xxx` is attached to a component; no open ADR; security, compliance and
  finops have each signed off; the choices are consistent across documents (cross-check).

## P4 Planning

- `project-manager`: `outcome-roadmap`, `user-stories` (acceptance criteria as Given / When /
  Then), `test-scenarios`, `prioritization-frameworks`, `sprint-plan`.
- Milestones: **M0 skeleton** (repository, lint, tests, CI, environments, staging deployment of a first
  screen, basic monitoring, tooled migrations), then vertical slices of value, then a hardening
  and launch milestone.
- Deliverables: `docs/product/roadmap.md`, `docs/product/backlog.md` (stories `S-xxx` linked to the
  `REQ-xxx`), project definition of done (base: `quality-bar.md`).
- Creating issues or milestones on a forge: only if the user asks for it (externally
  visible action).
- **G4**: full traceability REQ to stories, M0 first, INVEST stories, dependencies and risks
  identified.

## P5 Build (loop per milestone)

Milestone M0: the project's `CLAUDE.md` is written from the closest template in
`templates/claude-md/` (under 200 lines, the project's real commands, nothing generic), then
`ultime-profile` writes the per-language rules. `release-engineer` runs the `ci-forge` skill (ci-forge pack) from the skeleton on, without waiting for
the user: full CI for the stack, required check `ci-ok`, local hooks, Dependabot. The following
stories only move to `done` with `ci-ok` green.

For each ready story, in dependency order:
1. `implementer`: `test-driven-development`, `incremental-implementation`, small commits on a dedicated
   branch. UI: `frontend-ui-engineering` and the skills of the ui-design pack.
2. `code-reviewer`: `code-review-and-quality` on the diff.
3. `qa-engineer`: acceptance criteria verified, end-to-end tests of the touched journeys.
4. `security-engineer`: `security-review` on the diff if the story touches
   authentication, authorization, personal data, payment, upload or external input.
5. `ux-designer`: review of the touched screens (accessibility, consistency with the design system).
6. Fixes by `implementer`, bounded loop. The story moves to `done` when the definition of done is
   met and verified by the orchestrator (tests rerun).

- **G5** (end of milestone): `gate-verifier` does the milestone audit (stories accepted, tests green, clean
  review, reversible migrations, no regression), demo to the user (`run` skill to launch
  the app), short `retro`, backlog adjustment.

## P6 Pre-production

- `release-engineer`: CD with `ci-forge` (reference `cd.md`) then pipeline (`ci-cd-and-automation`, `github-actions`,
  `deployment-pipeline-design`), staging and prod parity, progressive deployment and tested rollback
  (`testing-in-production`), domain and TLS, infrastructure as code (`terraform-skill`) if relevant.
- `sre`: `setting-up-monitoring`, SLOs (`slo-implementation`), alerts, runbooks, `incident-response`,
  backups and **tested restore**.
- `security-engineer`: final audit (`security-review`, `sast`, `auditing-supply-chain`, `owasp-security`, secrets,
  headers, rate limiting).
- `compliance-officer`: legal pages, privacy policy, consent, accessibility
  statement, record of processing; on mobile, store privacy labels.
- `finops-analyst`: budgets and alerts in place, cost forecast at launch.
- `qa-engineer`: full regression, load tests (`k6`), accessibility audit.
- Mobile: `release-engineer` with `mobile-release` (signing, test tracks, rollout),
  `security-engineer` with `mobile-security-masvs`, `compliance-officer` with `store-listing` and
  `play-data-safety`; pack profile adjusted (`ultime-profile`: app-stores, store-apple, store-google).
- Deliverable: `docs/ops/release-readiness.md`.
- **G6** go / no-go: the list of upcoming irreversible actions is presented explicitly.

## P7 Launch and learning

- `release-engineer`: go to production after confirmation, smoke tests, progressive deployment.
- `growth-lead`: launch plan, basic SEO, store listings if mobile (store-aso pack, entry via
  `store-console-browser` or the CLIs), analytics compliant with
  consent, north star metric dashboard, `release-notes`.
- `project-manager`: `retro`, metrics review at D+7 and D+30, backlog of the next iteration.
- **G7**: post-launch review with the user; the next iteration starts again at P4.
