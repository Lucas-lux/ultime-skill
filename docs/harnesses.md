# Coding agents (harnesses)

ultime-skill is written once and installs into every major AI coding agent. Claude Code gets the native
plugin marketplace, with every feature. The other agents get the same skills, converted subagents and
commands, the guardrails as a hook in their own protocol, and always-on rules in their instructions file.

## Install for another agent

```bash
npx github:Lucas-lux/ultime-skill install --agent codex            # entry point, guardrails, ponytail
npx github:Lucas-lux/ultime-skill install ultime-dev --agent gemini,cursor
npx github:Lucas-lux/ultime-skill install mobile mobile-expo --agent copilot --scope project --dir .
npx github:Lucas-lux/ultime-skill agents                            # supported agents, * = detected here
npx github:Lucas-lux/ultime-skill uninstall --agent codex           # removes only what it installed
```

- `--agent`: one or more ids (table below), `all`, or `auto` (default: the agents detected on this machine).
- `--scope user` (default) writes into your home directory; `--scope project --dir <path>` writes into the
  project, to commit for the team.
- `--no-guardrails`, `--no-ponytail`: leave them out. `--dry-run`: show the plan, write nothing.
- Requires Node.js 18 or later. Restart the agent afterwards.

Skills only, with the community installer: `npx skills add Lucas-lux/ultime-skill` reads the same
marketplace and lets you pick skills and agents (it installs no subagents, hooks or commands).

Agents that read Claude Code plugins directly (Codex, GitHub Copilot CLI and VS Code, Junie, Factory
Droid, Qwen Code) can also add the marketplace with their own command, for example
`codex plugin marketplace add Lucas-lux/ultime-skill` or `copilot plugin marketplace add Lucas-lux/ultime-skill`.
This route brings the skills (and the agents where the harness supports them); run the installer above
to get the guardrails wired in that agent's hook format.

## What each agent gets

| Agent | id | Skills | Subagents | Commands | Guardrails | Always-on rules |
|---|---|---|---|---|---|---|
| Claude Code | `claude` | native plugins | native | native | native hooks | native hooks |
| OpenAI Codex | `codex` | `.agents/skills` | `.codex/agents/*.toml` | - | `.codex/hooks.json` | `AGENTS.md` |
| Gemini CLI | `gemini` | `.agents/skills` | `.gemini/agents` | `.gemini/commands/<pack>/*.toml` | `.gemini/settings.json` | `GEMINI.md` |
| Qwen Code | `qwen` | `.agents/skills` | `.qwen/agents` | `.qwen/commands` | `.qwen/settings.json` | `QWEN.md` |
| Google Antigravity | `antigravity` | `.agents/skills` | `.agents/agents` | - | written rules | `AGENTS.md`, `GEMINI.md` |
| Cursor | `cursor` | `.agents/skills` | `.cursor/agents` | `.cursor/commands` | `.cursor/hooks.json` | `.cursor/rules/ultime-skill.mdc` |
| GitHub Copilot | `copilot` | `.agents/skills` | `.github/agents`, `~/.copilot/agents` | `.github/prompts` | `.github/hooks/guardrails.json` | `AGENTS.md` |
| Windsurf / Devin Desktop | `windsurf` | `.agents/skills` | - | - | written rules | `AGENTS.md` |
| Devin CLI | `devin` | `.agents/skills` | `.devin/agents` | - | written rules | `AGENTS.md` |
| JetBrains Junie | `junie` | `.agents/skills` | `.junie/agents` | - | written rules | `AGENTS.md` |
| Factory Droid | `droid` | `.agents/skills` | `.factory/droids` | - | `.factory/settings.json` | `AGENTS.md` |
| OpenCode | `opencode` | `.agents/skills` | `.opencode/agents` | `.opencode/commands` | `.opencode/plugins/guardrails.js` | `AGENTS.md` |
| Kilo Code | `kilo` | `.agents/skills` | `.kilo/agents` | `.kilo/commands` | `.kilo/plugins/guardrails.js` | `AGENTS.md` |
| Cline | `cline` | `.cline/skills` | - | - | written rules | `AGENTS.md` |
| Kiro | `kiro` | `.kiro/skills` | - | - | `.kiro/hooks/guardrails.json` (project) | `.kiro/steering/` |
| Amp | `amp` | `.agents/skills` | - | - | written rules | `AGENTS.md` |
| Goose | `goose` | `.agents/skills` | - | - | written rules | `AGENTS.md` |
| Zed (Zed Agent) | `zed` | `.agents/skills` | - | - | written rules | `AGENTS.md` |

Paths are relative to the project (project scope) or to the home directory (user scope); a few differ
at user scope (for example `~/.codex/AGENTS.md`, `~/.config/opencode/`), see `bin/lib/harnesses.cjs`.
"Written rules" means the agent has no hook the installer can use: the rules are written in its
instructions file and the agent is asked to follow them, but nothing enforces them. Aider has no skills or
hooks and is not a target.

## What is different from Claude Code

- **Skill names are flat.** Claude Code namespaces skills by pack (`app-factory:app-factory`); elsewhere a
  skill is just its name. When two packs ship the same name, the second one installed gets a `<pack>-`
  prefix (today only `agent-skills-test-driven-development`).
- **Subagents** are renamed `<pack>-<role>` (for example `app-factory-implementer`). Agents that cannot
  run subagents get the roles next to the orchestrating skill, in `roles/`, and the skill plays them one
  at a time.
- **Model choice** is not portable: Claude model aliases are dropped, except for Codex where a light model
  becomes a lower reasoning effort.
- **Guardrails** run the same rules through `guard.cjs --harness <id>`, which reads each agent's tool
  calls (shell, file writes, edits, Codex `apply_patch`) and answers in its protocol. Where an agent
  cannot ask the user from a hook, a rule set to `ask` becomes a denial that tells the agent to get your
  explicit approval. The configuration stays in `.claude/guardrails.json` whatever the agent.
- **ponytail and session hooks**: ponytail's rules go into the always-on instructions; superpowers'
  session hook is not ported (its skills are installed).
- **Autopilot** relies on Claude Code cloud routines and stays Claude Code only.

## How sure is this

Formats come from each agent's documentation as of October 2026. The installer and the hook adapters
are covered by automated tests that replay each documented payload shape (`tests/guardrails`,
`tests/installer`); they have been run end to end with Claude Code, not inside every other agent. Agents
change fast: if a path or a payload moved, open an issue with the agent's version.
