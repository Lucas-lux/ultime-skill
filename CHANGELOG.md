# Changelog

All notable changes to this project. The format follows [Keep a Changelog](https://keepachangelog.com),
and versions follow [Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-10-22

First open-source release.

### Added

- Universal installer `npx github:Lucas-lux/ultime-skill`: installs packs for Codex, Gemini CLI, Qwen Code,
  Antigravity, Cursor, GitHub Copilot, Windsurf, Devin, Junie, Factory Droid, OpenCode, Kilo Code, Cline,
  Kiro, Amp, Goose and Zed (skills, converted subagents and commands, guardrails hooks, always-on rules),
  at user or project scope, with a clean uninstall.
- Guardrails for other agents: `guard.cjs --harness <id>` translates each agent's tool calls (including
  Codex `apply_patch`) and answers in its protocol; `setup.cjs install-project --harness <list>|all` wires
  the project copy for each agent.
- Cursor marketplace (`.cursor-plugin/`), generated with the Claude Code one.
- Agent Skills standard checks in `scripts/check.py`, CI on GitHub Actions (check and reproducible
  rebuild), contribution guide, security policy, code of conduct, issue and pull request templates.

### Changed

- Everything is in English: README, docs, in-house skills and agents, pack descriptions, guardrails
  messages. Skill names are unchanged. Skills that wrote their reports or PRs in French now write them
  in the user's language.

### Unchanged for Claude Code

- Plugins, marketplace, agents, commands and hooks keep the same names, fields and wiring; the 473
  imported skills are byte-identical.

## Before 1.0.0

Private development: 43 packs and 11 bundles (orchestrator `app-factory` and autopilot, guardrails,
`ci-forge`, per-project profiles, in-house mobile, stores, growth, monitoring, testing in production,
security and compliance skills, permissive-license audit).
