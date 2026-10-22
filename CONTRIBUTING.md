# Contributing to ultime-skill

Thanks for helping. This library is reproducible: everything under `plugins/` is generated, so a change
always goes into the sources below, then through a rebuild.

## Where things live

| You want to | Edit | Then |
|---|---|---|
| Fix or add an in-house skill or agent | `authored/<pack>/skills/<name>/SKILL.md`, `authored/<pack>/agents/<name>.md` | `python scripts/build.py` |
| Import a skill from another repository | `scripts/gen_vendor.py` (source pinned to a commit, import list) | `python scripts/build.py` |
| Add a pack or change a bundle | `scripts/gen_manifests.py` | `python scripts/build.py` |
| Support a new coding agent, or fix a path | `bin/lib/harnesses.cjs`, guardrails adapters in `authored/guardrails/runtime/lib/` | tests, then [docs/harnesses.md](docs/harnesses.md) |
| Improve the docs | `README.md`, `docs/` | nothing |

Never edit `plugins/` by hand: the next build overwrites it.

## Rules for content

- **Licenses**: only permissive upstream licenses (MIT, Apache-2.0, BSD). Copyleft or unlicensed content
  is not imported, and is not paraphrased either (a paraphrase stays a derivative work). See
  [docs/licenses.md](docs/licenses.md).
- **Skills follow the [Agent Skills](https://agentskills.io) standard**: `name` is 1 to 64 lowercase
  letters, digits and single hyphens, equal to the folder name; `description` says what the skill does
  and when to use it, 400 characters at most for in-house skills; `SKILL.md` stays under 500 lines, the
  detail goes into `references/`.
- **No duplicates**: check that no existing skill already does the job. Each enabled skill costs context
  on every turn.
- **Writing**: English, plain ASCII where possible, no em dash (the check refuses it), no invisible
  Unicode, concrete versions ("Python 3.13", never "latest").
- **Claude Code stays the reference**: a change for another agent must not change what Claude Code loads
  or does. Adapters live beside the Claude Code files, never inside `skills/`, `agents/`, `commands/` or
  `hooks/` of a pack.

## Before opening a pull request

```bash
python scripts/build.py --cache .cache   # rebuild (keeps upstream clones in .cache)
python scripts/check.py                  # frontmatter, manifests, forbidden characters, every test
```

Both must pass; CI runs them again and also checks that a clean rebuild reproduces the committed
`plugins/`. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) in English
(`feat(guardrails): ...`). Describe in the pull request what you changed and how you checked it in a real
agent session when the change affects behavior.

## Reporting a problem

Open an issue with the agent and its version, the pack or skill, what you expected and what happened.
Security issues: see [SECURITY.md](SECURITY.md), not a public issue.
