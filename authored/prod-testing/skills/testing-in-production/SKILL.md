---
name: testing-in-production
description: >
  End-to-end tests and validation in production: CI/CD pyramid, smoke tests, canary and blue-green
  with automatic rollback, feature flags, synthetic monitoring. Use for testing in production, smoke
  tests, canary, blue-green, rollback, feature flags, OpenFeature, synthetic monitoring, CI/CD
  strategy, contract testing (Pact), or unstable (flaky) tests.
---

# Testing in production (end-to-end strategy)

Goal: know that a deployment is healthy before and after it goes live, and be able to roll back
automatically on an objective signal. Vendor-neutral. Combines with the `devops` pack (pipelines,
k6, github-actions) and the `monitoring` pack (SLOs, signals).

## Which test at which stage

A pyramid, from cheapest to most expensive, each level blocking the next:

1. **Unit**: isolated logic, fast, the majority.
2. **Contract** (consumer-driven, for example Pact): checks that a service and its consumers share the
   same API contract, without deploying the whole chain. Essential as soon as there are several services.
3. **Integration**: real components (database, queue, cache) via ephemeral containers.
4. **End to end**: critical journeys on an environment close to production (see the `playwright-cli`
   skill of the devops pack).
5. **Post-deploy smoke**: after each release, a small set of checks on the real environment (health,
   critical routes, reachable dependencies).
6. **Canary**: progressive exposure to a fraction of real traffic, under watch.

Define for each stage what blocks the pipeline and what is only informative.

## Post-deploy smoke tests

- A short and deterministic set that runs right after the deployment, against the real environment:
  health page, one or two critical routes, connection to dependencies, one non-destructive business
  transaction.
- On failure, the deployment is considered failed and triggers the rollback.
- Never run a destructive smoke test against production; use a dedicated test account and test data.

## Progressive deployment and automatic rollback

- **Canary**: route a small percentage of traffic to the new version, compare its signals to the stable
  version (error rate, p95/p99 latency, business signals), increase in steps if all goes well.
- **Automatic analysis**: define the promotion and rollback criteria in advance (for example canary error
  rate significantly above the baseline, or p99 latency beyond a threshold over a given window). Tools:
  Argo Rollouts analysis, Flagger, or equivalent. Otherwise, a documented manual comparison.
- **Rollback**: return to the stable version automatically when a criterion is crossed. The rollback must
  be tested, not only configured.
- **Blue-green**: two environments, traffic switch when the new one passes the smoke tests, immediate
  return possible.

## Feature flags (OpenFeature)

- Decouple deployment (putting the code in production) from release (turning it on). A flag protects a
  risky feature and serves as a kill switch.
- Use a standard API (OpenFeature) so as not to be tied to a vendor. An open source backend (flagd) or a
  service, as the team chooses.
- **Lifecycle**: name the flag, define the owner and the removal date at creation; deploy off; enable
  progressively (percentage, cohort); measure; clean up the flag once the feature is stable. A forgotten
  flag is debt and a risk.
- Avoid dependencies between flags and untested combinations.

## Self-hosted synthetic monitoring

- Scripted checks that run continuously from the outside (login, search, purchase journeys) and alert
  before users do. Scheduled k6 (devops pack), or blackbox_exporter for simple probes.
- Separate test accounts and data, tag synthetic traffic to exclude it from business metrics.

## Unstable (flaky) tests

- Detect: non-deterministic failure rate per test, tracked over time.
- Quarantine an unstable test (it no longer blocks the pipeline but stays visible and tracked), create a
  ticket, fix the cause (implicit waits, order dependencies, clocks, network), then reinstate it.
- Never mask instability with systematic reruns without tracking: it hides real bugs.

## Definition of done

- The pyramid is in place with clear gates per stage, contract included as soon as there are several
  services.
- Every deployment passes a smoke test; failure triggers the rollback.
- Progressive deployment has automatic promotion and rollback criteria, tested.
- Risky features are behind a flag with an owner and a removal date.
- Synthetic checks cover the critical journeys.
- Unstable tests are tracked and handled, not ignored.
