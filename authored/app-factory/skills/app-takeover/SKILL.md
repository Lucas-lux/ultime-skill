---
name: app-takeover
description: >
  app-factory takeover mode: inventory, reverse spec, quality audit and plan to finish and improve
  an existing, unfinished or abandoned app. Use to take over, finish, complete, rescue, audit
  or improve an existing app or a project left hanging, or "app-takeover".
---

# Taking over an existing app

Goal: know precisely what exists, what works, what is missing and what is dangerous, before
writing a line. This skill covers phase P0 of takeover mode; `app-factory` then takes over at P2
(PRD to complete) or directly at P4 if the scope is already clear.

## Golden rule: break nothing

- Work on a branch; no modification during the inventory and the audit.
- If a production exists: no write access, no migration, no deployment at this stage.
  Production data is only read with the user's explicit consent, read-only.
- A secret found in the code or the git history is reported (file, line, type) without ever
  displaying its value, with the recommendation to revoke it and move it out of the code.

## Steps

1. **Inventory** (agent `codebase-mapper`): stack and real versions, structure, entry points,
   how to run the app locally (and whether it works: `run` skill), state of the tests (do they pass? what
   do they cover?), CI, deployment and infrastructure, environments, database schema and state of the
   migrations, third-party services, secrets management, outdated or vulnerable dependencies, licenses.
   Deliverable: `docs/takeover/inventory.md`.
2. **Reverse specification** (agent `reverse-spec-analyst`): what the app really does, written for a
   product reader. Skills: `code-to-prd` (overview per page and per endpoint), `schematic` (for
   a branch in progress), `shipping-artifacts` (architecture, permissions, variables, test
   coverage). Deliverable: `docs/product/as-is-prd.md`.
3. **Intent versus reality**: gather what the app was supposed to do (user, old specs,
   tickets, mockups), then `intended-vs-implemented` to list unfinished features, broken journeys,
   documented but unenforced rules.
4. **Audit against the quality bar** (agents in parallel: `security-engineer`, `data-architect`,
   `compliance-officer`, `ux-designer`, `sre`, `finops-analyst`, and `code-reviewer` with `ponytail-audit` then
   `ponytail-debt` for the code: bugs, vulnerabilities, load handling, risky code without tests, what is to be
   deleted or merged), each on its domain of
   `app-factory/references/quality-bar.md`. Each finding: evidence (file, line, command), impact,
   severity (blocking, major, minor), proposed fix. Deliverable: `docs/takeover/audit.md`.
5. **Decision per module**: keep, fix, finish or redo. Redo only if it is justified
   (structural defects, lack of tests on a critical area, debt that costs more than the rewrite)
   and recorded in an ADR. No full rewrite by default.
6. **Takeover plan**: an **M0 stabilization** milestone comes first (tests on the critical
   journeys, a CI that blocks (`ci-forge` skill: gap audit then full CI, autonomous), tested backups and restore, basic monitoring, secrets moved out of the
   code, blocking vulnerabilities fixed), then the features to finish, then the improvements.
   Deliverable: initial backlog in `docs/product/backlog.md`.
7. **G0**: the user validates the inventory, the audit, the decisions per module and the plan.

## Deliverables

`docs/takeover/inventory.md`, `docs/product/as-is-prd.md`, `docs/takeover/audit.md`, ADRs of the structuring
decisions, `docs/product/backlog.md`, then the rest of the `app-factory` cycle.
