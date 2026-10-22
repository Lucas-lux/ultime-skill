---
name: ultime-profile
description: >
  Installs and manages for a project the ultime-skill (ultime-factory) skills it needs, and only those:
  project detection, installation of packs at project level, disabling the rest, adjustment when the
  task changes. Use to install, configure, update or slim down a project's skills, or
  "ultime-factory", "ultime-skill", "ultime-profile".
---

# Installing and managing a project's skills

Each skill of an active plugin adds its description to the context **on every turn**, and Claude Code
only keeps a limited budget of them (about 1 % of the window): installing the whole catalog degrades
skill triggering. This skill therefore installs, project by project, only the useful packs.
`ultime-factory` designates the full catalog it chooses from, not a bundle to install as is.

Catalog of packs, their role and their cost: [references/catalog.md](references/catalog.md).

## 1. Prerequisites

- The CLI: `claude`; if it is not in the PATH, `~/.local/bin/claude` (Windows:
  `%USERPROFILE%\.local\bin\claude.exe`).
- The marketplace: `claude plugin marketplace list`. If `ultime-skill` is missing:
  `claude plugin marketplace add Lucas-lux/ultime-skill`. If the repository is private, git access is
  required; without an SSH key, `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` with git credentials configured
  (`gh auth setup-git`).
- Up-to-date catalog: `claude plugin marketplace update ultime-skill`.

## 2. Understand the need

- Read the project: dependencies and manifests (`package.json`, `app.json`, `pubspec.yaml`, Xcode project,
  `build.gradle`, `pyproject.toml`, `Dockerfile`, Terraform, dbt...), structure, `CLAUDE.md`.
- Listen to the request: a project to carry from A to Z, to clone or to take over adds `app-factory` and
  `product-management`; a mobile app adds the pack of its technology; a launch adds stores and growth.
- `python <skill>/scripts/suggest_profile.py .`: packs justified by the repository's signals (table
  `references/stack-map.json`), packs already at user level (`user_level`), per-language rules (chosen
  from the `paths:` frontmatter of each rule), permissions. It is the basis of the proposal; the profiles
  table below completes it according to the request.
- Propose the list through a multiple-choice question (several answers), with the cost of each pack.
  Empty project: ask what is going to be built.

## 3. Install

- **Scope**: `project` if the profile must be shared with the team (written to `.claude/settings.json`,
  to commit); `local` for personal use (`.claude/settings.local.json`, outside git). Ask.
- In `project` scope, also declare the marketplace for the team:
  `claude plugin marketplace add Lucas-lux/ultime-skill --scope project`.
- Install each chosen pack **individually**:
  `claude plugin install <pack>@ultime-skill --scope <scope>`. Never an `ultime-*` bundle: it pulls in
  all its packs.
- If ultime-skill packs or bundles are already active at user level without being useful here:
  `claude plugin disable <name>@ultime-skill --scope <scope>` (a bundle with a disabled dependency fails
  to load, so disable it too).
- Never touch plugins from other marketplaces.
- **Per-language rules**: `suggest_profile.py . --write-rules` copies into `.claude/rules/ultime/` the
  rules of the languages present (`paths:` frontmatter, loaded only when Claude touches those files: zero
  cost elsewhere). Folder fully regenerated on each run, to commit in project scope.
- **Permissions** (with consent, chosen scope): `--write-permissions project|local` adds the project's
  verification commands to `allow` (tests, lint, typing, build) and puts publishing and deployment in
  `ask` (npm publish, terraform apply, kubectl apply, docker push...). Existing rules are kept.
- Reload: the user runs `/reload-plugins` (or restarts the session). Then check with
  `claude plugin list` and summarize what is active and its cost.

## 4. Adjust along the way

When the task changes domain, install or enable the needed pack (moving from code to the store listing,
from build to launch), reload, and disable it afterwards if the use was one-off.
`app-factory` does it at its key steps (framing, stack choice, pre-production, launch).

## Typical profiles

The source of truth for the packs pulled from the repository's signals is `references/stack-map.json`
(read by `suggest_profile.py`); the "signal" rows below summarize it, the "request" rows add what the
repository does not reveal. Every code project also gets `agent-skills`, `ci-forge` and `security`
(`always_for_code`). In case of discrepancy, stack-map.json prevails: fix this table.

| Project or task | Source | Packs |
|---|---|---|
| Project run by app-factory (creation, clone, takeover) | signal `app-factory` | app-factory, product-management, then the packs of the stack; greenfield only to rebuild code you have the rights to |
| Web app (React, Next.js, Vue, Svelte...) | signal `web-front` | fullstack, ui-design, compliance, monitoring, prod-testing |
| API or backend | signal `api` | devops, monitoring, prod-testing; data-engineering if a database (signal `database`) |
| Mobile Expo or React Native | signal `expo` | mobile, mobile-expo, ui-design, compliance |
| Native iOS mobile | signal `ios` | mobile, mobile-ios, ui-design, compliance |
| Native Android mobile | signal `android` | mobile, mobile-android, ui-design, compliance |
| Flutter mobile | signal `flutter` | mobile, mobile-flutter, ui-design, compliance |
| Data | signal `data` | data-engineering, dataviz |
| ML or LLM | signal `ml` | ml-engineering, monitoring |
| Containers, Kubernetes, Terraform | signals `containers`, `kubernetes`, `terraform` | devops, monitoring, finops |
| Infrastructure and operations (in addition) | request | prod-testing |
| Publishing and store listing (at launch) | request | app-stores, then store-apple and/or store-google depending on the targeted stores, store-aso |
| Marketing and acquisition | request | growth (always: shared product context), then depending on the task growth-seo, growth-ads, growth-social, growth-analytics, growth-cro; video-editing and motion-design to produce videos |
| Security audit | request | sec-audit, sec-defense |
| Content, motion, video | request | ui-design, motion-design, video-editing |

`guardrails` and `ponytail` are not part of the per-project install list: the install scripts put them
at user level, and `suggest_profile.py` reports them separately (`user_level`: already at user level,
project copy optional for a team or the cloud). Only propose them at project level for a project shared
in a team or run in the cloud (autopilot):

- `guardrails` (guardrails through hooks): `node <plugin guardrails>/runtime/setup.cjs install-project`,
  to commit with `.claude/`.
- `ponytail`: `claude plugin install ponytail@ultime-skill --scope project`. It injects its rule (smallest
  complete change) into every session and every subagent (about 2,900 characters); never disable it in a
  project unless asked. `superpowers` also adds a session hook: propose it only if its method is wanted.
  `sec-offense` is installed only on explicit request, for authorized testing.

## Other coding agents (Codex, Gemini CLI, Cursor, Copilot, OpenCode...)

Outside Claude Code there is no `claude plugin`: the same packs install through the universal
installer, the same choices apply (only the useful packs, project scope for a team).

- Install: `npx github:Lucas-lux/ultime-skill install <pack...> --agent <id> --scope project --dir .`
  (`--agent` among codex, gemini, qwen, antigravity, cursor, copilot, windsurf, devin, junie, droid,
  opencode, kilo, cline, kiro, amp, goose, zed; `auto` detects them). Add `--dry-run` to show the plan.
- Remove or slim down: `npx github:Lucas-lux/ultime-skill uninstall <pack...> --agent <id> --scope project --dir .`.
- Skills land in `.agents/skills/` (read by most agents), subagents and commands in the agent's own
  folder, guardrails as a hook in its format, always-on rules in `AGENTS.md` (or its equivalent). Commit
  them in project scope.
- `suggest_profile.py` works the same; `--write-rules` and `--write-permissions` are Claude Code only.
- Have the user restart the agent afterwards.
