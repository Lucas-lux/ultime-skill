# On-disk state and resume

The state makes it possible to resume a project in a new session, on another machine or after a
context compaction. It is versioned with the project (except `reports/`, see below).

## Tree

```
.app-factory/
  state.json        # current state, source of truth of the orchestration
  decisions.md      # log of the user's decisions (date, gate, decision, reason)
  gates/G0.md ...   # gate-verifier reports
  reports/          # raw agent reports (to ignore in git if they contain sensitive data)
  reference/        # clone mode: screenshots and observation notes, internal use only, never shipped
```

At the autopilot level, `.app-factory/` no longer lives on the main branch but on the
`claude/autopilot-state` branch (no code, no CI), whose root holds the content of `.app-factory/` and which
is mounted as a worktree in place of `.app-factory/` (ignored by git on the main branch): the
paths stay the same, the wake-ups write the state without a PR or conflict with the code, and the push serves
as a lock. An agent launched with `isolation: "worktree"` does not see this folder: pass it absolute
paths to the state files it must read, and only have the orchestrator write the state. An interactive
session on an autopilot project mounts this worktree before reading the state (protocol of the
`autopilot` skill, step 1), then pushes its state changes to this branch.

## state.json schema

```json
{
  "version": 1,
  "project": "project-name",
  "mode": "creation",
  "platforms": ["web", "ios", "android"],
  "market": {"countries": ["FR"], "languages": ["fr"]},
  "autonomy": "standard",
  "phase": "P5",
  "status": "in_progress",
  "gates": {
    "G0": {"status": "approved", "date": "2026-10-21", "report": ".app-factory/gates/G0.md"}
  },
  "artifacts": {
    "brief": "docs/product/brief.md",
    "prd": "docs/product/prd.md",
    "backlog": "docs/product/backlog.md"
  },
  "milestones": [
    {"id": "M0", "title": "Skeleton", "status": "done", "stories": ["S-001", "S-002"]}
  ],
  "stories": {
    "S-003": {"status": "review", "branch": "feat/s-003-signup", "attempts": 1, "reqs": ["REQ-004"]}
  },
  "open_questions": [],
  "risks": [],
  "next_action": "Run code-reviewer on S-003"
}
```

At the `autopilot` level, one more block (created by `init_autopilot.py`, detail in the `autopilot` skill,
references `budget.md` and `decision-policy.md`):

```json
"autopilot": {
  "repo": "owner/name", "owner": "github-login", "base_branch": "main", "dashboard_issue": 1,
  "paused": false, "allow_defaults": false, "default_after_hours": 72, "spend_free_threshold": 0,
  "lock": {"run_id": "2026-10-21T14:00Z", "started_at": "2026-10-21T14:00:12Z"},
  "last_run": "2026-10-21T14:00:12Z",
  "budget": {"per_run": {"agents": 8, "stories": 3, "upgraded": 1}, "per_day": {"agents": 30},
             "usage": {"day": "2026-10-21", "agents": 5}}
}
```

Values: project `status` among `in_progress`, `awaiting_gate`, `blocked`, `done`; story
`status` among `todo`, `in_progress`, `review`, `qa`, `done`, `blocked`.

## Writing

- Update `state.json` after each significant step (agent finished, gate passed, story
  changed status), not only at the end of the session.
- Rewrite the whole file, valid JSON, with no secret or personal data.
- Every user decision also goes into `decisions.md`, with the date.

## Resume protocol

1. Read `state.json`, `decisions.md` and the latest gate report.
2. **Check against reality**: do the referenced deliverables exist? Do the story branches
   exist, are they merged? Do the tests pass? Does the last commit match what
   the state describes? The state is a claim, the repository is the reference.
3. Report each discrepancy to the user and propose the state correction before continuing.
4. Summarize in a few lines where the project stands and resume at `next_action`.
