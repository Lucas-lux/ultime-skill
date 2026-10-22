# Getting started

## Install with one command

```bash
claude plugin marketplace add Lucas-lux/ultime-skill && claude plugin install ultime-starter@ultime-skill
```

In PowerShell 5, replace `&&` with `;`. The `ultime-starter` bundle installs three packs for every
project on the machine:

- `ultime-profile`: the entry point that then installs, project by project, only the useful packs;
- `guardrails`: the hook-based guardrails (see [Quality and security](quality-and-security.md));
- `ponytail`: the smallest-complete-change rule, in every session and every subagent.

Prerequisites: Claude Code, `git`, `node` 18 or later (for the hooks), Python 3.10 or later (for the skills' scripts).
If you install from a private fork, you need git access to GitHub: an SSH key, or
`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` with configured git credentials (`gh auth login` then
`gh auth setup-git`).

Alternative from a clone, with the same options: `./install.sh` (Windows: `./install.ps1`), which accepts
`--no-guardrails`, `--no-ponytail` and `--with-tools` (also installs the CLIs some skills drive: rea, asc,
gplay, downloaded at a pinned version and verified by SHA-256 checksum).

## Another coding agent (Codex, Gemini CLI, Cursor, Copilot, OpenCode...)

```bash
npx github:Lucas-lux/ultime-skill install --agent codex
```

The same three packs, installed in the agent's own folders and formats; then, in a project, ask the
agent for the skills the project needs, as below. Every supported agent and what it gets:
[Coding agents](harnesses.md).

## Equip a project

Open Claude Code in the project and ask:

> Install the ultime-factory skills this project needs.

`ultime-profile` reads the repository (`scripts/suggest_profile.py`), proposes the packs with the reason
for each and their context cost, then, with your agreement on the scope (shared with the team or
personal):

- installs the packs at project level and disables those that are not needed;
- writes the per-language rules in `.claude/rules/ultime/`;
- adds the permissions: verification commands allowed, publishing and deployment subject to
  confirmation.

Repeat the same request when the work moves to another domain (moving on to the store listing, the
launch, the campaigns); `app-factory` does it on its own at its key steps.

## Run a project from A to Z

```
/app-factory:app-factory
```

The orchestrator asks for the mode (creation from an idea, customized clone of an app, takeover of an
existing app), the brief and the autonomy level, then moves forward phase by phase. Details in
[App factory and autopilot](app-factory-and-autopilot.md).

## Put an existing project through the whole chain

For a project already started: `app-factory` in takeover mode (`app-takeover`) does the inventory, the
reverse specification and the audit (security, data, compliance, UX, operations, costs, code with
`ponytail-audit`), then `ci-forge` brings the CI up to level, and the takeover plan prioritizes the fixes.

## Make a project autonomous

After scoping, choose the `autopilot` level and follow the setup described in the `autopilot` skill
(reference `setup.md`): export of the skills into the repository, GitHub preparation by script, branch
protection, scheduled task. Nothing is created in the cloud or on the Claude account without you.

## Frequently asked questions

**The guardrails block me for a good reason, how do I make an exception?**
Add the narrowest exception in the project's `.claude/guardrails.json` (for example a path in
`rules.emoji.allow_paths`). Claude asks for your agreement before modifying this file. `"enabled": false`
turns everything off; `claude plugin disable guardrails@ultime-skill` removes the plugin.

**How much context does it cost?**
The full catalog represents about 182,000 characters of descriptions; `ultime-starter` adds about 2,300,
and a typical web application or API profile between 24,000 and 27,000. The catalog
`plugins/ultime-profile/skills/ultime-profile/references/catalog.md` gives the cost of each pack.

**Can I install everything everywhere?**
`claude plugin install ultime-all@ultime-skill` allows it, but it is not recommended: the descriptions of
473 skills exceed what Claude Code keeps in context, and the choice of the right skill degrades.

**How do I update?**
`claude plugin marketplace update ultime-skill`, then `/reload-plugins` in the session.

**How do I uninstall?**
`claude plugin uninstall <pack>@ultime-skill` for each pack, then
`claude plugin marketplace remove ultime-skill`.
