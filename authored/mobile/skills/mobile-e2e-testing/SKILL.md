---
name: mobile-e2e-testing
description: >
  Mobile end-to-end testing: choose and set up Maestro, Detox, XCUITest, Espresso, Compose UI tests or
  Flutter integration_test, locally and in CI, with real devices or device farms. Use to test mobile
  app flows, Maestro, Detox, XCUITest, Espresso, mobile E2E tests or flaky tests on mobile.
---

# Mobile end-to-end testing

## Choosing the tool

| Situation | Tool |
|---|---|
| User flows, any stack (native, React Native, Flutter), fast to write | Maestro (YAML flows, black box) |
| React Native with fine synchronization on app state | Detox (gray box) |
| Native iOS | XCUITest (skill `swift-testing-pro` for unit tests) |
| Native Android | Espresso, Compose UI tests (skill `testing-setup`) |
| Flutter | `integration_test` (skill `flutter-add-integration-test`); Patrol for native interactions (permissions, notifications) |

Preferably a single E2E tool per project; most tests stay unit and integration tests (pyramid, skill
`testing-in-production`).

## Good practices

- Target elements by stable identifier (`testID`, accessibility identifier, `Key`), not by displayed
  text or position.
- One flow per critical journey: sign-up, login, purchase, main action, deep link, notification.
  Dedicated test data and accounts, reset between runs.
- Wait for a state, never a fixed delay. Disable animations on CI emulators.
- Stub unstable third-party services; keep one "real" flow in staging.

## CI

- Android: emulator in CI (with hardware acceleration); iOS: macOS runners with simulator.
- Device farms for coverage (Firebase Test Lab, BrowserStack, AWS Device Farm, Maestro Cloud): run
  the full suite before release, a subset on every PR.
- Keep screenshots, videos and logs of failures as artifacts.

## Flaky tests

- Measure the failure rate per test; quarantine with a ticket; fix the cause (wait, shared data,
  animation, network). Do not rerun in a loop until green.

## Installation

Follow each tool's official documentation, with a pinned version in CI; do not run a remote
install script without reading it first.
