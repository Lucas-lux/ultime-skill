---
name: app-factory
description: >
  End-to-end project orchestrator: from an idea, an app to clone and customize, or an existing
  app to finish, up to the finished product in production, with subagents, phases and validation
  gates. Use to build a complete app ("from A to Z"), clone or reproduce an app, take over, finish
  or improve an existing app, drive a whole project, or "app-factory".
---

# App factory: from project to finished product

This skill makes the main session the **conductor**. It does not do everything itself:
it breaks down the work, delegates to the `app-factory:*` subagents via the Agent tool, keeps the project state, and has
each phase validated by the user. Subagents do not launch other agents: only
the orchestrator dispatches, which keeps the flow readable and reproducible.

Outside Claude Code (installed with the universal installer): the subagent `app-factory:<role>` is
`app-factory-<role>`; if the agent cannot run subagents, play each role yourself, one at a time, from
`roles/<role>.md` next to this skill, and keep the same gates.

References to load as needed:
- [references/phases.md](references/phases.md): detail of phases, agents, skills, deliverables, gates.
- [references/state.md](references/state.md): on-disk state and resume protocol.
- [references/quality-bar.md](references/quality-bar.md): what "finished product" means, per domain.
- [references/stack-selection.md](references/stack-selection.md): choosing the stack without dogma.
- [references/autonomy.md](references/autonomy.md): what the orchestrator does alone, what it gets validated.

Autonomous mode: after G0, the `autopilot` level moves the project forward through scheduled wake-ups, with no
open session; the user only settles vision decisions through a GitHub issue. Offer this
level at the end of G0 and, if it is chosen, hand over to the `autopilot` skill (its `setup.md` reference
describes the setup, done by the user).

## Startup (on every invocation)

1. **Resume if a project exists.** If the `claude/autopilot-state` branch exists on `origin`, the project
   is in autopilot: first mount the state (`autopilot` skill, step 1). Then, if `.app-factory/state.json`
   exists, follow the resume protocol
   of `state.md`: reread the state, check it against the real repository (files, git, tests), report the
   discrepancies, then continue at `next_action`.
2. **Otherwise, choose the mode** with a multiple-choice question:
   - **Creation**: start from an idea.
   - **Clone**: reproduce the value of a reference app while customizing it. Load the
     `app-clone` skill for phase P0.
   - **Takeover**: finish and improve an existing or unfinished app. Load the `app-takeover` skill
     for phase P0.
3. **Collect the minimal brief** (multiple-choice questions, no assumptions): platforms (web,
   iOS, Android, API), target users, market and languages, constraints (budget, deadline, imposed stack,
   hosting, sensitive data), autonomy level (see `autonomy.md`).
4. **Enable only the useful packs.** With the `ultime-profile` skill, propose the project profile
   (packs enabled for this repository only), then adjust it when the work changes domain: after the
   stack choice in P3, and in P6-P7 for the launch packs (stores, growth). A missing pack is
   not blocking: the agent applies the principles of its prompt and the orchestrator reports the gap.

## Phases and gates

| Phase | Purpose | Main agents | Gate |
|---|---|---|---|
| P0 Framing | Mode, brief, inventory (clone or takeover) | product-manager, reverse-spec-analyst, codebase-mapper | G0 brief validated |
| P1 Discovery | Problem, targets, competition, risky assumptions, business model | product-strategist | G1 go, pivot or stop |
| P2 Specification | PRD, non-functional requirements, scope, obligations, cost envelope | product-manager, compliance-officer, finops-analyst | G2 PRD frozen |
| P3 Design | Architecture and ADRs, data model, UX and design system, threat model, costs | software-architect, then data-architect, ux-designer, security-engineer, finops-analyst, compliance-officer | G3 design validated |
| P4 Planning | Roadmap, milestones, backlog, acceptance criteria, definition of done | project-manager | G4 backlog ready |
| P5 Build | Per milestone: skeleton (M0) then stories, each implemented, reviewed, tested | implementer, code-reviewer, qa-engineer, security-engineer, ux-designer | G5 per milestone |
| P6 Pre-production | CI/CD, reversible deployment, monitoring, backups, final audits | release-engineer, sre, security-engineer, compliance-officer, finops-analyst, qa-engineer | G6 go / no-go |
| P7 Launch | Go to production, launch, measurement, retro, next iteration | release-engineer, growth-lead, project-manager | G7 post-launch review |

A small project can merge P1 and P2, or P3 and P4. G2, the security and
compliance part of G3, and G6 are never skipped.

## Dispatch rules

- **One bounded task per agent.** Each agent prompt gives: the expected role, the inputs (file
  paths, not their copied content), the deliverable and its exact path, the definition of done, the skills
  to load. Template in `phases.md`.
- **Parallelize what is independent** by sending several Agent calls in the same message (for
  example in P3, after the architect: data, UX, security, finops, compliance in parallel).
- **Parallel build** only between stories that touch disjoint files, each with
  `isolation: "worktree"`, then sequential integration and tests after each merge.
- **Verify rather than believe.** An agent's report is a claim, not a fact. Check
  the deliverable (it exists, it meets the definition of done), rerun the tests yourself, and hand the
  in-depth verification to `gate-verifier`.
- **No secret in an agent prompt.** Secrets stay in the project's `.env`, ignored by git.
- **Bounded fix loop**: two round trips at most on the same failure, then escalate to
  the user with the diagnosis.

## Token economy

- **Read as needed**: a reference only when the phase requires it, and only its section (search
  for the phase title in `phases.md` then read that excerpt).
- **Thin agent prompts**: paths and decisions, never copied content or the history.
- **Short reports**: 15 lines at most, the detail stays in the deliverables; do not reread an
  entire deliverable to summarize it.
- **The right model**: each agent has a model suited to its role; pass `model: "opus"` only for
  a story that failed twice or a structuring decision, `model: "haiku"` for an inventory,
  a reformatting or a simple search.
- **No agent for a command**: what fits in one read or one command is done directly.
- **Parallelize without speculating**: group independent tasks, no "just in case" fan-out.
- **The on-disk state is authoritative**: after a compaction, reread `state.json`, not the conversation.

## Running a gate

1. Launch `gate-verifier` with the gate checklist (`phases.md`); it writes
   `.app-factory/gates/Gn.md`.
2. Fix the blocking points (bounded loop), rerun the verification if needed.
3. Present the user with a short summary (deliverables, decisions made, risks, what remains) and
   ask with a multiple-choice question: validate, fix a given point, go back to a phase, stop.
4. Record the decision in `.app-factory/decisions.md` and update `state.json`.

## Permanent guardrails

- Irreversible or externally visible actions are always confirmed at the moment they are done:
  payment, account creation, contract acceptance, store submission, ad spend,
  publication, production deployment, migration on real data, resource deletion.
  Detail in `autonomy.md`.
- Clone mode: we reproduce the value, never someone else's brand, assets, texts or code.
- Data: local database first, never production data in development without explicit consent.
- The target repository's rules (its `CLAUDE.md`, its conventions) take precedence; report contradictions.

## End of each work session

Update `state.json` (phase, status, `next_action`), then report to the user: what was done,
what was verified and how, what remains blocked, and the next step.
