# Setup (by the owner, once per project)

Claude prepares the files and can run the scripts **on the owner's machine, at their request**.
It never creates the scheduled task, the cloud environment, or anything on the Claude account itself: these
steps are done by the owner in claude.ai. Duration: 20 to 30 minutes the first time.

## 0. Prerequisites

- The project has passed G0 in an interactive session (`app-factory`: mode, brief, platforms, market), and
  `.app-factory/state.json` exists.
- The repository is on GitHub, the Claude GitHub app is installed on it (claude.ai/code, or `/install-github-app`).
- Locally: `gh` authenticated (`gh auth status`), Python 3.10 or higher, the ultime-skill marketplace up
  to date (`claude plugin marketplace update ultime-skill`).

## 1. Copy the skills into the repository

Cloud sessions do not install plugins: only the repository's `.claude/` is loaded.

```bash
python <autopilot>/scripts/export_to_repo.py --dry-run      # project's enabled packs + app-factory
python <autopilot>/scripts/export_to_repo.py --packs app-factory,mobile,mobile-expo,team-conventions
```

The export always adds `app-factory`, `guardrails` (project copy of the guardrails) and `ponytail` (its
hooks are carried into `.claude/hooks/ponytail/` and declared in `.claude/settings.json`).
`<autopilot>` is the folder of this skill (in the plugin cache, or `plugins/app-factory/skills/
autopilot` of the ultime-skill repository). Add `team-conventions` if the project follows the team rules: in
the cloud, the personal `~/.claude/CLAUDE.md` is not read, only the repository rules (`CLAUDE.md`,
`.claude/rules/`, exported skills) apply. Rerun the export after each update of the
marketplace. Then disable the exported packs at the project level so they are not loaded twice.

## 2. Prepare GitHub

```bash
python <autopilot>/scripts/init_autopilot.py            # shows the plan, changes nothing
python <autopilot>/scripts/init_autopilot.py --apply    # labels, dashboard, state branch mounted
                                                        # as .app-factory/, workflows
```

Then in the repository settings (browser or `gh`):
1. **Ruleset on the main branch**: PR required, `ci-ok` check **required**, no direct push
   or force push, and **no bypass allowed, administrators included**. Without a required check, the
   automatic merge would not wait for the CI; without the bypass ban, the merge token (yours)
   could override it. This is the central guardrail: in the cloud, the agent acts with your GitHub
   credentials, and the proxy does not limit the branches it can push.
2. **`AUTOPILOT_MERGE_TOKEN` secret**: fine-grained token limited to this repository, Contents and Pull
   requests permissions in read and write, short expiration (90 days, to renew). It only serves to enable
   GitHub's automatic merge.
3. **Environments**: `staging` without reviewer; `production` with you as required reviewer.
   Every production deployment thus waits for your approval (notification on the GitHub app).
   Deployment secrets go into these environments, never into the repository or the cloud
   environment. The deployment workflows are written by `release-engineer` in P6.
4. Commit on a branch and merge: `.gitignore`, `.github/workflows/`, `.claude/`, and the removal
   of `.app-factory/` from the main branch (already staged by the script). Locally, the state is now
   the worktree of `claude/autopilot-state` mounted as `.app-factory/`; the old folder stays in
   `.app-factory.pre-autopilot/` (to delete when everything works).

## 3. Create the scheduled task (claude.ai/code, scheduled tasks section)

1. **Cloud environment**: "Trusted" network access (default); no secret variable; setup
   script only if the stack requires it (the cloud already provides Python, Node, Docker, git, gh, jq).
2. **New task**: a single repository (the project; with several repositories, the `.claude/` settings do not
   apply), this environment, the prompt from `templates/routine-prompt.md`.
3. **Frequency**: see `budget.md` (every 2 h during build, 2 to 3 times a day otherwise; 1 h
   minimum).
4. **API trigger**: enable it, copy the URL and the token (shown only once) into the repository secrets
   `AUTOPILOT_FIRE_URL` and `AUTOPILOT_FIRE_TOKEN`. Compare the headers of the displayed curl example
   with those of `.github/workflows/autopilot-wake.yml` and fix if needed.

## 4. First wake-up, under supervision

- "Run now" from the task, then follow the session in the Claude app (Code tab).
- Check: the lock is taken then released on `claude/autopilot-state`, the `gh api` calls go through (no
  403), an `autopilot` PR triggers the `autopilot-merge` workflow, the dashboard is rewritten.
- Test the wake-up on answer: open a test `decision` issue, comment `1`, check that the
  `autopilot-wake` workflow starts and that a session starts.

## 5. Steering from the phone

- **GitHub app**: notifications of the `decision` cards (in the cloud they are created with your account, and
  GitHub does not notify you of your own actions: the `autopilot-wake` workflow then mentions you from
  `github-actions[bot]`, which triggers the notification), answer by comment,
  approval of production deployments, merge of `needs-human` PRs. The dashboard is
  the pinned issue of each repository.
- **Portfolio**: a GitHub project (Projects) "Portfolio" at your account level, with its built-in
  workflows "Auto-add to project" (one per repository: `label:decision`, `label:autopilot`) and "Item closed ->
  Done". It is the view of all your projects.
- **Claude app** (Code tab): follow or redirect a running session, launch a wake-up by hand.
- **Pause**: `"paused": true` in `state.json` (state branch) or disable the scheduled task.

## Known limits

- No dollar cap per wake-up in the cloud: the budget is kept in number of agents and in frequency.
- The maximum duration of a cloud session is not documented: the wake-up keeps its work units
  short (`per_run.stories`) and writes the state after each story.
- The scheduled tasks feature is in preview (research preview): check its behaviour at the
  first wake-up and at each announced change.
