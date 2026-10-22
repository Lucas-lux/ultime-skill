# Maintenance

## Build and check

```bash
python scripts/build.py                          # regenerates vendor.json, plugins/, manifests, then checks
python scripts/build.py --cache .cache/vendor    # reuses the upstream clones already downloaded
python scripts/check.py                          # check only (frontmatter, em dash, Unicode, tests)
node --test tests/guardrails/guard.test.cjs tests/guardrails/harness.test.cjs tests/installer/installer.test.cjs
python -m unittest discover -s tests -p "test_*.py"
```

`build.py` deletes `plugins/` before rebuilding it: no shell or editor may have its current directory
inside it (on Windows, a busy folder blocks the deletion; the script retries for a few seconds, then stops
with a message).

Executable scripts: `plugins/` keeps the executable bit of each upstream file, which Linux and macOS
need (hook scripts above all). Git on Windows does not see file modes and keeps the mode recorded in the
index, so a new upstream executable committed from Windows lands as 644: the CI rebuild check then shows a
mode change, fixed with `git update-index --chmod=+x <file>`.

## Add an imported skill

1. Check the source's license at the target commit (see [Licenses](licenses.md)): only permissive
   licenses are accepted, and the skill's own license counts.
2. Add the source (repository, full commit, license) to `SOURCES` in `scripts/gen_vendor.py`, then the
   import (`pack_skill` or `add`) into the desired pack. Options: `exclude`, `strip_tail` (cut a
   promotional footer), `drop_lines` (remove lines), `replace` (adapt a passage), `license_note` (explain
   a special license case).
3. `python scripts/build.py`, then review the diff of `plugins/`, `THIRD_PARTY.md` and the generated
   `MODIFICATIONS.md` files.
4. Check that no existing skill already does the same job: a duplicate costs context and muddles
   the agent's choice.

## Write an in-house skill

- In `authored/<pack>/skills/<name>/SKILL.md`, overlaid on `plugins/<pack>/` at build time.
- English, plain ASCII, dense bullet points, a
  description of at most 400 characters that says what it does and when to use it, a `SKILL.md` under
  500 lines, the detail in `references/` read on demand.
- A new skill that drives a verifiable behavior comes with a script and tests in `tests/`.
- Declare a new pack in `PLUGINS` in `scripts/gen_manifests.py`, and add it to the relevant bundles.

## Support another coding agent

- Skills, subagents, commands and instructions files: one entry in `bin/lib/harnesses.cjs` (paths at user
  and project scope, agent and command formats). Conversions live in `bin/lib/convert.cjs`.
- Guardrails: the hook file and its format in `authored/guardrails/runtime/lib/wiring.cjs`, the tool
  names and payload fields in `authored/guardrails/runtime/lib/harness.cjs`, and a test replaying the
  documented payload in `tests/guardrails/harness.test.cjs`.
- Claude Code never goes through these adapters: its plugins, hooks and agents are the source, unchanged.
- Update the matrix in [Coding agents](harnesses.md), with the source of each path.

## Update a source

Change its commit in `scripts/gen_vendor.py`, rebuild, review the diff. If its license has changed, redo
the license check before keeping the update.

## Versions cited in the skills

The in-house skills cite concrete versions (GitHub actions, CI tools), verified at a given date. Review
them every quarter: `git ls-remote --tags https://github.com/<repository>` gives the latest published
version, and `pin_actions.py --latest` updates the generated workflows.
