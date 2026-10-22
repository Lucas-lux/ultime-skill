# ultime-skill

[![CI](https://github.com/Lucas-lux/ultime-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/Lucas-lux/ultime-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-standard-black.svg)](https://agentskills.io)

A production-ready library of skills, subagents and guardrails for AI coding agents. It gives your agent
the know-how of a complete team (product, code, design, mobile, app stores, security, compliance, ops,
data, growth), an orchestrator that takes a project from idea to production, optionally on its own,
guardrails that cannot be forgotten, and a CI generated for each stack. Each project enables only what
it needs.

**473 skills, 24 subagents, 43 packs, 11 bundles**, all under permissive licenses. Works natively in
**Claude Code** and installs into **Codex, Gemini CLI, Cursor, GitHub Copilot, OpenCode, Qwen Code,
Antigravity, Windsurf, Devin, Junie, Factory Droid, Kilo Code, Cline, Kiro, Amp, Goose and Zed**.

## Quick start

**Claude Code** (native plugins, every feature):

```bash
claude plugin marketplace add Lucas-lux/ultime-skill && claude plugin install ultime-starter@ultime-skill
```

**Any other coding agent** (Node.js 18+):

```bash
npx github:Lucas-lux/ultime-skill install --agent codex      # or gemini, cursor, copilot, opencode... or auto
```

Both install the starter set: the `ultime-profile` entry point, the `guardrails` and `ponytail`. Then,
in each project, ask your agent:

> Install the ultime-factory skills this project needs.

It reads the project, proposes the useful packs with their context cost, and installs them for that
project only.

**Skills only**, with the community installer: `npx skills add Lucas-lux/ultime-skill`.

## Supported agents

| Agent | Skills | Subagents | Commands | Guardrails (hooks) |
|---|---|---|---|---|
| Claude Code | native | native | native | native |
| OpenAI Codex | yes | yes (TOML) | - | yes |
| Gemini CLI, Qwen Code | yes | yes | yes | yes |
| Cursor | yes | yes | yes | yes |
| GitHub Copilot (CLI, VS Code, coding agent) | yes | yes | yes (prompts) | yes |
| OpenCode, Kilo Code | yes | yes | yes | yes (plugin) |
| Factory Droid | yes | yes | - | yes |
| Kiro | yes | - | - | yes (project) |
| Antigravity, Windsurf, Devin, Junie, Cline, Amp, Goose, Zed | yes | where supported | - | written rules |

Paths, formats and differences from Claude Code: [Coding agents](docs/harnesses.md).

## What you get

- **An orchestrator, `app-factory`**: from an idea, an app to clone and personalize, or an unfinished app,
  to a finished product in production. Eight phases with validation gates, state on disk and resume,
  18 specialized subagents, and an **autopilot** mode where the project moves forward on scheduled
  wakeups and only vision, money, legal or irreversible decisions reach you as a GitHub issue.
- **Guardrails enforced by hooks**: no em dash or unrequested emoji, no push to `main`, no git hook bypass,
  no secrets or `.env` in git, Conventional Commits, an AI marker on PR and issue titles, and a golden rule
  on production credentials. Configurable rule by rule, and wired into every agent that has hooks.
- **A CI generated for the stack (`ci-forge`)**: lint, typing, tests, end to end, containers, Kubernetes,
  IaC, security scanning, SBOM, staging and production, actions pinned by SHA.
- **Per-project profiles (`ultime-profile`)**: only the packs a project needs, because every enabled
  skill costs context on every turn.
- **The best open-source skills**, imported at pinned commits with their licenses, plus skills written
  in-house where the public ones were missing or too weak (mobile release, stores, monitoring,
  testing in production, security review, French and EU compliance...).

## Documentation

- [Why, and what it brings](docs/why.md): the problem, the concrete gain, the limits.
- [Getting started](docs/getting-started.md): install, equip a project, FAQ.
- [Coding agents](docs/harnesses.md): Codex, Gemini CLI, Cursor, Copilot, OpenCode and the others.
- [Architecture](docs/architecture.md): packs, bundles, profiles, context economy, reproducible build.
- [App factory and autopilot](docs/app-factory-and-autopilot.md): from idea to production, autonomously.
- [Quality and security](docs/quality-and-security.md): guardrails, generated CI, reviews, rules.
- [Licenses](docs/licenses.md) and [Maintenance](docs/maintenance.md).

## Installation options

### Claude Code

`ultime-starter` installs `ultime-profile`, `guardrails` and `ponytail` (the smallest-complete-change rule,
applied in every session and subagent). To install the entry point only:

```bash
claude plugin marketplace add Lucas-lux/ultime-skill
claude plugin install ultime-profile@ultime-skill
```

From a clone: `./install.sh` (Windows: `./install.ps1`), with `--no-guardrails`, `--no-ponytail`
(`-NoGuardrails`, `-NoPonytail` on Windows) and `--with-tools` (also installs the CLIs some skills drive:
`rea`, `asc`, `gplay`, pinned and checked by SHA-256). In each project, Claude installs the packs at
project scope, shared (`.claude/settings.json`, to commit) or personal (`.claude/settings.local.json`),
disables what is not needed, and asks you to run `/reload-plugins`.

### Other agents

```bash
npx github:Lucas-lux/ultime-skill install [packs or bundles...] --agent <ids|all|auto> [--scope user|project] [--dir <project>]
npx github:Lucas-lux/ultime-skill uninstall [packs...] --agent <ids>
npx github:Lucas-lux/ultime-skill list      # packs and bundles
npx github:Lucas-lux/ultime-skill agents    # supported agents, the detected ones starred
```

Skills go once into the shared `.agents/skills` folder, subagents and commands into each agent's folder
and format, the guardrails into its hook file, and the always-on rules into `AGENTS.md` (or `GEMINI.md`,
`.cursor/rules/`...). Uninstall removes only what the installer wrote, and leaves your own content in
shared files untouched.

### Everything, everywhere (not recommended)

```bash
./install.sh ultime-dev                  # one or more bundles or packs, active in every project
./install.sh --with-tools ultime-mobile  # also installs the external CLIs
```

A large bundle active everywhere overflows the skill description budget of the agent (see
[Context economy](#context-economy)).

## Bundles

| Bundle | Contents |
|---|---|
| `ultime-starter` | ultime-profile, guardrails, ponytail: the recommended install |
| `ultime-all` | Every pack (not recommended: prefer per-project install) |
| `ultime-dev` | ponytail, superpowers, agent-skills, skill-factory, devops, fullstack, security, team-conventions, prod-testing, guardrails, ci-forge |
| `ultime-data` | data-engineering, dataviz, ml-engineering |
| `ultime-media` | ui-design, motion-design, video-editing |
| `ultime-security` | security, sec-audit, sec-defense, rea |
| `ultime-web` | fullstack, ui-design, compliance |
| `ultime-ops` | devops, finops, monitoring, prod-testing, ci-forge |
| `ultime-mobile` | mobile, mobile-expo, mobile-ios, mobile-android, mobile-flutter, app-stores, store-apple, store-google, store-aso, ui-design, compliance, security |
| `ultime-growth` | growth, growth-seo, growth-ads, growth-social, growth-analytics, growth-cro, store-aso, video-editing, motion-design |
| `ultime-factory` | app-factory and everything it drives: guardrails, ci-forge, product-management, greenfield, agent-skills, fullstack, ui-design, compliance, security, devops, data-engineering, monitoring, prod-testing, finops, and every mobile, store, growth and video pack |

Every bundle also installs `ultime-profile`. The `sec-offense` pack (offensive pentest, authorized testing
only) is pulled in by no bundle, not even `ultime-all`: install it explicitly.

## Context economy

Every skill of an enabled pack adds its description to the context **on every turn**, used or not; its
full content loads only when it is used. Claude Code keeps about 1% of the context window for that list:
beyond it, descriptions are dropped and those skills stop triggering. Other agents have similar limits.
Installing `ultime-all` and leaving everything on is counterproductive.

- **One profile per project**: `ultime-profile` detects the project type, proposes the useful packs and
  disables the others for that repository only, and adjusts when the task changes domain.
- **Cost of each pack and bundle**: generated at build time in
  `plugins/ultime-profile/skills/ultime-profile/references/catalog.md`.
- **In-house skills**: descriptions of 400 characters at most (checked by `scripts/check.py`), `SKILL.md`
  under 500 lines with the detail in references, `app-factory` subagents with a model suited to their
  role, short reports.
- **Imported skills**: original descriptions are not rewritten (they carry the words that trigger the
  skill); only excessive loading is fixed.

## Catalog

### Product and orchestration

| Pack | Skills | Role |
|---|---|---|
| `app-factory` | 4 + 18 agents | End-to-end project orchestrator in three modes: creation from an idea, personalized clone of a reference app, takeover of an existing or unfinished app. Eight phases with gates, state on disk, specialized subagents, autopilot mode. In-house. |
| `product-management` | 46 | Discovery, strategy, market, PRD, user stories, roadmap, pre-mortem, retro, release notes (phuryn), reverse specification of existing code (code-to-prd, schematic). |
| `greenfield` | 22 + 2 agents | Clean-room reverse engineering: behavioral specs, test vectors and acceptance criteria extracted from code without inheriting its implementation (`/greenfield:analyze`). Heavy pipeline, for code you own the rights to. |

### Mobile and stores

| Pack | Skills | Role |
|---|---|---|
| `mobile` | 7 | Cross-platform, in-house: iOS and Android release (signing, versions, TestFlight, Play tracks, fastlane, EAS), OWASP MASVS security, push notifications, deep links, end-to-end tests (Maestro, Detox), mobile accessibility, in-app purchases. |
| `mobile-expo` | 22 | Official Expo skills (router, native UI, design system, modules, upgrade, EAS Build, Submit, Update and Workflows, web to native migration), React Native performance and upgrade, React Navigation (Callstack), React Native Testing Library. |
| `mobile-ios` | 5 | SwiftUI, Swift concurrency, Swift Testing, SwiftData (Paul Hudson), iOS accessibility. |
| `mobile-android` | 24 | Official Google skills (Compose, Navigation 3, AGP 9, R8, ANR, tests, security, Play policies) and Google Play Billing. |
| `mobile-flutter` | 14 | Official Flutter and Dart skills. |
| `app-stores` | 3 | In-house: listing kit for both stores, Data safety form, entering what the APIs do not cover in the consoles through the browser. |
| `store-apple` | 19 | App Store Connect through the `asc` CLI, App Review rejection prevention, Apple privacy labels. |
| `store-google` | 13 | Google Play through the `gplay` CLI, Google Play policy audit. |
| `store-aso` | 16 | ASO for both stores: audit, keywords, metadata, screenshots (generator included), video, icon, product pages, A/B tests, reviews. |

Stores go through the official CLIs and APIs first; the browser (with your sessions) only covers what
they do not. Sign-in, two-factor authentication, payment, accepting agreements, submitting for review and
publishing stay with you.

### Growth and marketing

| Pack | Skills | Role |
|---|---|---|
| `growth` | 8 | Base: product context shared by every marketing skill, marketing plan, launch, press relations. In-house: app install campaigns, creative and video production, social media publishing, marketing compliance for France and the EU. |
| `growth-seo` | 7 | SEO audit, AI search (GEO), structured data, programmatic SEO, site architecture, content strategy, link building. |
| `growth-ads` | 9 | Google, Meta, TikTok, LinkedIn ads, creatives, copywriting, psychology, marketing images and videos, Apple Ads, app acquisition campaigns. |
| `growth-social` | 3 | Social media, influencers and creators, community. |
| `growth-analytics` | 5 | Tracking plan, GA4, attribution, conversion tracking, A/B tests, mobile attribution. |
| `growth-cro` | 11 | Page conversion, signup, onboarding, paywalls, popups, emails and SMS, churn, referral, web to app funnel. |

The marketingskills skills read a shared context (`.agents/product-marketing.md`, created by the
`product-marketing` skill): enable `growth` with any `growth-*` pack. No campaign, spend or publication
goes out without your approval. A few tools cited by marketingskills are paid partners of that upstream
repository: they are flagged as such and listed next to their alternatives.

### Foundations

| Pack | Skills | Role |
|---|---|---|
| `ponytail` | 6 | Lazy senior developer mode: smallest complete change, YAGNI, review and audit. Activation hooks. |
| `superpowers` | 15 | obra's working method: plans, TDD, systematic debugging, subagents, verification. Session hook. |
| `agent-skills` | 25 | Full software lifecycle (Addy Osmani): spec, build, test, review, security, performance, CI/CD, delivery. |
| `skill-factory` | 2 | Create and test skills and MCP servers (skill-creator, mcp-builder). |
| `team-conventions` | 1 | Cross-cutting team working conventions (method, writing, secrets). In-house. |
| `guardrails` | 1 + hooks | Guardrails enforced by hooks and configurable (em dash, emoji, push to main, git hooks, secrets, commits, AI marker, production credentials). Installed by default. In-house. |

### Security

| Pack | Skills | Role |
|---|---|---|
| `security` | 9 | In-house security review (method, evidence, severity, design pitfalls), Semgrep and CodeQL static analysis (in-house), code and diff audit, supply chain, OWASP, threat model, GitHub Actions. |
| `sec-audit` | 30 | Vulnerability research and reversing (trilwu core). Authorized use only. |
| `sec-defense` | 22 | DFIR, detection (Sigma, Yara), cloud investigation and hardening (trilwu defense). |
| `sec-offense` | 40 | Offensive pentest, authorized testing only (trilwu offense). Outside bundles, explicit install. |
| `rea` | 1 | Reverse Engineer Anything. Requires the `rea-agents` MCP server. |

### Ops

| Pack | Skills | Role |
|---|---|---|
| `devops` | 17 | Terraform, Docker, Kubernetes, GitOps, CI/CD, SLOs, PromQL, k6, synthetic monitoring, incidents. |
| `finops` | 6 | AWS, GKE/Google Cloud and Azure costs, and shift-left scanning of infrastructure as code (Infracost). |
| `monitoring` | 1 | Complete observability for the project type (web, API, RAG/LLM, data, cron, ML, mobile): metrics, logs, traces, SLOs, alerts, cost. In-house. |
| `ci-forge` | 1 | CI/CD generated for the stack and target architecture: lint, typing, tests, end to end, containers, Kubernetes, IaC, security, SBOM, staging and prod; actions pinned by SHA, required check `ci-ok`. In-house. |
| `prod-testing` | 1 | End-to-end test strategy and production validation: CI/CD pyramid, smoke tests, canary and automatic rollback, feature flags, synthetic monitoring, flaky tests. In-house. |

### Data and AI

| Pack | Skills | Role |
|---|---|---|
| `data-engineering` | 12 | dbt, Airflow, multi-dialect SQL, exploration, PySpark, Postgres, data quality. |
| `dataviz` | 5 | Chart choice, matplotlib/plotly, HTML dashboards, scientific figures, Grafana. |
| `ml-engineering` | 10 | Fine-tuning (LoRA/QLoRA), LLM evaluation, TRL, RAG, vLLM serving, scikit-learn, MLflow, HF Hub. |

### Web

| Pack | Skills | Role |
|---|---|---|
| `fullstack` | 2 | React/Next.js performance and React 19 composition. Combine with `agent-skills`. |
| `ui-design` | 7 | Anti AI-slop design: impeccable, frontend-design, Web Interface Guidelines, deslop, redesign, UI review (in-house). |
| `compliance` | 10 | RGAA, WCAG, feature compliance, secure development (ANSSI). In-house French-law skills: GDPR/CNIL, cookies and consent, legal notices and terms. |

### Creative

| Pack | Skills | Role |
|---|---|---|
| `motion-design` | 11 | GSAP, motion principles (LottieFiles), Manim. |
| `video-editing` | 4 | Conversational editing (video-use), FFmpeg, local transcription (faster-whisper), Manim. |

## External tools

Some skills drive a tool installed separately (`./install.sh --with-tools` installs `rea`, `asc` and
`gplay`):

- `rea`: the `rea-agents` MCP server (`npx rea-agents setup --client claude_code`, or the client of your agent).
- `video-editing`: `ffmpeg` on the PATH; `faster-whisper` and `video-use` have Python dependencies (see
  their READMEs). `video-use` uses the paid ElevenLabs API for transcription: prefer local `faster-whisper`.
- `ml-engineering`, `data-engineering`: each ecosystem's tools (dbt, Airflow, HF, vLLM, MLflow) as needed.
- `store-apple`: the `asc` CLI (App Store Connect) and `store-google`: the `gplay` CLI (Play Console). The
  installer downloads the pinned version and checks its SHA-256. `asc` sends pseudonymous usage telemetry
  by default: the installer turns it off (`asc telemetry disable`, or `ASC_TELEMETRY_DISABLED=1`). The
  `asc web` subcommands use an unofficial Apple web session: use them knowingly. App Store Connect API
  keys and the Google Play service account are created by you.
- `mobile` and `mobile-expo`: fastlane, EAS CLI, Maestro or Detox depending on the project, from their
  official documentation.
- Deeper technical SEO and ad audits: [claude-seo](https://github.com/AgriciDaniel/claude-seo) and
  [claude-ads](https://github.com/AgriciDaniel/claude-ads) complement `growth-seo` and `growth-ads`. They
  are not imported: they are complete systems with their own Python environment that largely overlap
  marketingskills.
- Advanced iOS: [Axiom](https://github.com/CharlesWiltgen/Axiom) complements `mobile-ios`. It is not
  imported: its skills depend on its own binaries, MCP server and commands.

## Session hooks (Claude Code)

Two packs install a `SessionStart` hook that runs at every session start:

- `ponytail` turns on its mode (also in each subagent, about 2,900 characters) and can offer a status
  line. Installed by default; `app-factory` subagents rely on its skills (`ponytail-review` in review,
  `ponytail-audit` and `ponytail-debt` in takeover). Other agents get its rules in their instructions file.
- `superpowers` injects its working method.

These hooks cost context and change the default behavior. To remove them, uninstall the pack.

## Licenses

The original work of this repository (scripts, manifests, installer, in-house skills, documentation) is
under the [MIT license](LICENSE). Each imported skill keeps the license of its upstream project, copied
into its folder and listed in [THIRD_PARTY.md](THIRD_PARTY.md).

- **Permissive licenses only**: MIT, Apache-2.0 and BSD-3-Clause. No copyleft (GPL, AGPL, CC-BY-SA, MPL)
  or unlicensed source is imported; the skills that were (Trail of Bits, HashiCorp, Sentry's security
  review) were removed and replaced by in-house skills or permissively licensed equivalents.
- Every imported folder whose files were changed at import time contains a `MODIFICATIONS.md` saying which
  ones and how (Apache-2.0 section 4.b), next to the upstream license and `NOTICE`.
- Trademarks (Expo, Vercel, Flutter, Apple...) are not granted by these licenses, nor the rights to the
  Apple device frames of `app-store-screenshots`: for an App Store listing, prefer Apple's official frames.

Details in [Licenses](docs/licenses.md).

## Contributing

Issues and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). The library is reproducible:
`plugins/` is fully regenerated by `python scripts/build.py` and never edited by hand; in-house content
lives in `authored/`. Security issues: [SECURITY.md](SECURITY.md).
