---
name: guardrails
description: >
  Guardrails enforced by hooks: no em dash, no unrequested emoji, no push to main, no bypassing git
  hooks, no secret or .env in git, Conventional Commits, AI marker, golden rule of production
  credentials. Use to install, configure, relax or explain a guardrails block, or "guardrails".
---

# Guardrails

The rules are enforced by hooks: Claude cannot forget them. A block comes with the rule (`[id]`) and
the steps to follow. Never try to get around a rule (another tool, another wording, a script): fix the
work, or tell the user what is blocking.

## Rules and levels

| id | What is checked | Default |
|---|---|---|
| `em-dash` | Em dash added in a file, a commit, a PR, an issue, a text written by command; staged lines at commit | block |
| `emoji` | Emoji added in a file, a commit, a PR or an issue; `allow` (by default the AI marker and the attribution line) and `allow_paths` | block |
| `protected-push` | Push to `branches` (main, master): refspec, current branch, `HEAD`, checkout in the same command, deletion, `--all`, `--mirror` | block |
| `no-verify` | `--no-verify`, `commit -n`, `core.hooksPath`, `HUSKY=0`, `LEFTHOOK=0`, `SKIP=` | block |
| `secrets` | Keys and tokens (AWS, GitHub, Anthropic, OpenAI, Stripe, Google, Slack, private key, password in a URL or in clear) in a file, a command or the staged lines; `.env` files are exempt | block |
| `env-file` | `git add` or commit of a `.env` file (`patterns`) | block |
| `conventional-commit` | `type(scope): description`, `types`, `max_subject` (72), lowercase, no trailing period | block |
| `ai-marker` | PR or issue title (gh or REST API) ending with `marker` | block |
| `merge-approval` | Merge or approval on behalf of the user: `gh pr merge`, `gh pr review --approve`, and through `gh api` the merge of a PR, an `APPROVE` review, the approval of a deployment; in autopilot, GitHub merges on its own and production is approved in the GitHub environment | ask |
| `prod-credentials` | Kubernetes secrets, vaults (Bitwarden, 1Password, Vault, AWS, GCP, Azure), shell history, `.env` of another project, tunnel to production (`prod_patterns`); `allowed_files` | block |
| `lint-config` | Lint, format or typing configuration modified, warning suppression added | warn |
| `config-tamper` | Modification of the guardrails configuration or removal of the guardrails | ask |

Levels: `block` (refuses the call), `ask` (asks the user; refuses when nobody can answer, in the
cloud), `warn` (lets it through with a warning), `off`.

## Configuration

Merged in this order: defaults, `~/.claude/guardrails.json` (the whole machine),
`.claude/guardrails.json` of the project (shared, committed), `.claude/guardrails.local.json` (personal).

```json
{
  "rules": {
    "emoji": {"allow_paths": ["docs/marketing/**"]},
    "protected-push": {"branches": ["main", "master", "develop"]},
    "ai-marker": "off",
    "secrets": {"exclude_paths": ["tests/fixtures/**"]}
  },
  "exclude_paths": ["vendor/**"]
}
```

- A rule can be written `"id": "off"`. `"enabled": false` turns everything off.
- For one session: variables `GUARDRAILS_DISABLED=1` or `GUARDRAILS_DISABLED_RULES=emoji,ai-marker`
  in the Claude Code environment (not in a command).
- **Changing the configuration requires the user's consent** (`config-tamper` rule). When the user
  asks for an emoji or an exception, propose the exact line to add, then write it after their consent.

## Installation

- **On the machine** (all projects): the `guardrails` plugin, installed by default by the
  `install.sh` and `install.ps1` scripts of ultime-skill (`--no-guardrails` to skip it). Disable:
  `claude plugin disable guardrails@ultime-skill`.
- **In a project** (team without the plugin, cloud sessions, autopilot):
  `node <plugin guardrails>/runtime/setup.cjs install-project`, then commit `.claude/`. The project's
  copy answers on its own in that project, the plugin's copy stays silent. `status` and
  `uninstall-project` exist. Autopilot's `export_to_repo.py` does it when the `guardrails` pack is part
  of the export.
- Requires `node` (18 or later). An internal error lets the call through and is displayed, it never
  blocks the work.

## Explaining a block

Give the rule, the reason and the fix. If it is a real false positive, propose the narrowest exception
(a path in `exclude_paths` or `allow_paths`), never disabling the whole rule.
