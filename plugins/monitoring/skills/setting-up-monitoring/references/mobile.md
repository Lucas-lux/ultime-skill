# Mobile application

Mobile monitoring is constrained by distribution (you cannot hotfix, users stay on old versions) and by
the field (variable networks, varied devices).

## Stability

- **Crash-free rate** (sessions and users without a crash), per version and per OS. It is the number one
  health metric. Alert on a drop after a release.
- **ANR** (Android) and freezes/hangs (iOS): the application stops responding without crashing.
- Stack symbolication (iOS dSYM, Android mapping) to make use of the reports.

## Perceived performance

- Cold and warm start, render time of the first screen, frames per second and frozen frames on critical
  screens.
- Consumption: battery, memory, network data.

## Network

- Latency and error rate of API calls seen from the mobile (often worse than on the server side: radio,
  loss, timeouts). Offline behavior and recovery.

## Adoption and rollout

- Distribution of installed versions and adoption speed of a new version. Essential to interpret a
  regression (it only affects one version) and to know when a buggy version has disappeared from the
  installed base.

## Setup

- Mobile SDK (Firebase Crashlytics, Sentry, Datadog, Embrace) or mobile OpenTelemetry depending on the
  stack. Keep crash reporting even when staying minimalist.
- No personal data in events. Respect consent (see the `compliance` skill).

## Dashboards

- Stability view (crash-free per version and OS, ANR, post-release trend).
- Performance view (startup, rendering, consumption).
- Adoption view (version distribution).
