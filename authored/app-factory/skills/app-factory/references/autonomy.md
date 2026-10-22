# Autonomy and guardrails

The autonomy level is chosen in P0 and recorded in `state.json`. Whatever the level, some
actions always require a confirmation at the moment they are done, and others are excluded.

## Levels

- **Cautious**: validation at each gate and before each story.
- **Standard** (default): validation at each gate; between two gates, the orchestrator chains
  the stories alone.
- **Extended**: validation at gates G2, G3, G6 and G7 only; the other gates produce their
  report and continue if `gate-verifier` finds no blocker.
- **Autopilot**: the project moves forward through scheduled wake-ups, with no open session (`autopilot` skill).
  The user only settles decisions of vision, money, law and irreversibility, through a GitHub
  issue; the rest follows the decision policy of `autopilot`. Chosen after G0, which stays interactive.
  This level additionally allows, without confirmation at the moment it is done: pushing `claude/*` branches,
  opening PRs and issues, letting GitHub merge an `autopilot` PR when the required checks are
  green, deploying to staging through the CI. Production stays approved by the user via
  the GitHub `production` environment.

## Done alone, at any level

Reading and writing the project's code and documentation, creating branches and local commits, running
the tests, the local database and the app locally, installing development dependencies, running
read-only audits.

## Always confirmed at the moment it is done

At the autopilot level, pushing `claude/*` branches, PRs, issues and staging deployment through
the CI are no longer confirmed one by one (limits described above); everything else on this list,
production included, still is.

- Pushing to a remote repository, opening a PR or issues.
- Deploying, to staging the first time, to production every time.
- Running a migration or a script on real data; accessing production data.
- Creating an account (cloud, store, ad network, social network), accepting terms or a
  contract, entering or using a payment method, subscribing to a plan.
- Submitting an app for review on a store, publishing a listing, launching a campaign that spends
  money, posting on a social network, sending an email or a notification to users.
- Changing a DNS record, deleting a resource, an environment, a database or a bucket.

For these actions, the agent prepares everything (configuration, contents, exact command, estimated cost) and
the user triggers or confirms.

## Browser control

- Official APIs and CLIs first; the browser (Claude in Chrome, with the user's sessions)
  only for what the APIs do not cover.
- Stop and hand back control for any login, two-factor authentication, CAPTCHA, identity
  verification or payment entry: it is up to the user to do it.
- Fill in the forms, then have them reviewed before any button that submits, publishes or pays.

## Excluded

- Fetching credentials from anywhere other than the configuration set up for the project (another repository,
  vault, shell history, files of another project), even if asked.
- Putting a secret in the code, a commit, a log or an agent prompt.
- Bypassing a hook, a security check or a branch protection.
- Fake reviews, fake ratings, fake accounts, impersonation of a brand or a person, dark patterns,
  collection of personal data without a legal basis.
- Copying the brand, assets, texts or code of a third-party app (clone mode).
