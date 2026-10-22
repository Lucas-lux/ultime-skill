# Budget and token economy

A cloud session cannot read its cost in dollars (no `--max-budget-usd` outside `-p` mode, no
documented `/cost` in the cloud). The budget is therefore kept in units that the wake-up counts itself, and in
wake-up frequency, set in the scheduled task. Wake-ups consume the owner's Claude
plan: a wake-up refused for a usage limit is not an error, the next one will resume.

## Caps (in `state.json`, `autopilot.budget` block)

```json
"budget": {
  "per_run": {"agents": 8, "stories": 3, "upgraded": 1},
  "per_day": {"agents": 30},
  "usage": {"day": "2026-10-21", "agents": 0}
}
```

- `per_run.agents`: calls to the Agent tool per wake-up (a workflow counts for its agents).
- `per_run.stories`: stories carried through to the PR per wake-up.
- `per_run.upgraded`: calls with a model higher than the agent's (see below).
- `per_day.agents`: when it is reached, the wake-up only reads the decisions and fixes a
  red PR, until the next day.
- Empty wake-ups: they write nothing, so they are not counted; the dashboard gives the date of the
  last wake-up that did work. If it is often old while the task is running, the frequency
  is too high for the project's activity: the owner adjusts it.
- Reset `usage` to zero when the date changes. Increment `usage.agents` as the wake-up goes.

## The right engine for each task

| Task | How |
|---|---|
| Reading, one command, a small fix | Directly, without an agent |
| Inventory, simple search, reformatting | Agent with the `haiku` model |
| Standard story, review, QA, phase deliverable | The agent with its default model (`sonnet`) |
| Architecture, data, security, compliance, gate verification | Agent in `inherit` (session model) |
| Repeated failure (2 attempts) or structuring decision | `model: "opus"`, counted in `per_run.upgraded` |

- Effort: leave the agent's; only raise the effort for a repeated failure.
- No "just in case" fan-out: only parallelize decided and independent tasks.
- Thin agent prompts (paths, decisions), reports of 15 lines at most.
- An empty wake-up (nothing to do, everything waits on a decision) stops after the reads of steps 2 and 3,
  without loading a reference or launching an agent.

## Recommended frequency of the scheduled task

- Active build (P5): every 1 to 2 h during the day.
- Specification, design, waiting for decisions: 2 to 3 times a day.
- Dormant project or after launch: once a day.
- The "answer to a card" trigger (`autopilot-wake` workflow) wakes the project up without waiting;
  it is what allows a low frequency without losing responsiveness.
