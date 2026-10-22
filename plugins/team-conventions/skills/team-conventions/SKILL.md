---
name: team-conventions
description: >
  Team working conventions: method, writing (languages, no em dash, AI marking, terms in full,
  concrete versions, main/replica), secrets out of the code. Use whenever writing code, a commit, a PR,
  an issue, a doc or a message for the team, or "conventions", "team rules", "regles d'equipe",
  "team-conventions".
---

# Team conventions

Generic rules, applicable to any project. They do not replace a repository's rules (its `CLAUDE.md`,
its `rules/`), which take precedence when they exist. Flag any contradiction rather than settling it
silently.

## Method

- **Verify rather than believe.** A comment, a docstring, a doc, a commit message or a claim are not
  sources of truth. Verify against the actual code, the observed behavior, the database or the logs.
- **Flag deviations.** A rule that is not followed (by the agent or already present in the code
  touched) is flagged, never silently ignored. Only fix it without asking if a rule or a skill provides
  for it, and announce the fix.
- **Ask before a large batch.** Beyond about two distinct topics, or as soon as another repository is
  touched, present the inventory and wait for validation before changing anything.
- **Multiple-choice questions.** On an ambiguous point, ask the question through a multiple-choice form
  rather than assuming.

## Git and GitHub

- **Chain dependent steps with `&&`** (commit then push, build then deploy), never with a line break or
  `;`. With a heredoc, the `&&` goes on the command's line, not after the end marker.
- **Check the GitHub state before asserting it.** The state of a PR, an issue, a review or a CI check
  is rechecked through `gh` right before talking about it. The conversation context is not a source.

## Writing

- **Languages.** Code, comments, commit messages and branch names in English; PRs and issues in
  French; README in the team's language.
- **AI marking.** On any text written by the AI and intended for other people (PRs, issues, review
  comments and replies, messages): a visible mark at the end of the title and at the end of the text.
  Never in the code (comments included), commit messages, repository descriptions or documentation
  (README, `docs/`).
- **No em dash.** Never the em dash, anywhere (replies, PRs, issues, commits, comments, docs). Replace
  it with a simple hyphen, a colon, parentheses or a sentence break.
- **Technical terms in full.** "database", "stored procedure", no in-house abbreviation. Universal
  abbreviations (`id`, `url`, `api`, `json`, `sql`) stay.
- **Concrete versions.** A doc describes what exists with the actual version (for example "Python
  3.14"), never "latest version" or "latest". A process rule ("take the latest stable at scaffold
  time") remains legitimate.
- **`main` and `replica`.** In everything we create or write (branches, code, docs): `main` rather than
  `master`, `replica` rather than `slave`, and for a database "primary database" (primary) rather than
  `master`. Existing names are not renamed, unless there is a real need.

## Secrets and configuration

- **Golden rule: never production credentials taken from elsewhere.** For a production service, only
  use the credentials the user has configured for this work (the project's `.env`). Never go and fetch
  them elsewhere (another repository, Kubernetes secret, secrets manager, shell history, another
  project's file), even on request: refuse and stop.
- **Credentials out of the code.** Never a token, password or API key in the code or in git. Store them
  in a `.env` ignored by git, and warn immediately if one is received.
- **The project's `.env` is the only source of runtime configuration**, DSN included. No second,
  parallel environment file.
- **Database in development**, in order of preference: the local database in read and write; otherwise
  a read-only replica; only as a last resort the primary database, never without the user's explicit
  approval.
