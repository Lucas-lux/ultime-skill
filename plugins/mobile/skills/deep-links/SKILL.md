---
name: deep-links
description: >
  Mobile deep links: iOS Universal Links, Android App Links, custom schemes, deferred links, Expo Router,
  React Navigation and go_router routing, testing and security. Use to add or debug deep links,
  universal links, app links, apple-app-site-association, assetlinks.json, or links that open the app.
---

# Deep links

## iOS: Universal Links

- `apple-app-site-association` file (JSON, no extension) served over HTTPS at
  `https://<domaine>/.well-known/apple-app-site-association`, without redirect, with a JSON type.
- Associated Domains entitlement: `applinks:<domaine>`.
- Apple caches this file through its CDN: a change is not visible immediately; the Associated Domains
  developer mode helps when testing.

## Android: App Links

- `https://<domaine>/.well-known/assetlinks.json` file with the package name and the SHA-256 fingerprint
  of the signing certificate. With Play App Signing, it is the fingerprint of Google's signing key
  (shown in the Play Console), not the upload key's.
- Intent filter with `android:autoVerify="true"` on the relevant hosts.
- Check the state: `adb shell pm get-app-links <package>`.

## Custom schemes

- `monapp://...`: useful for an authentication return or as a fallback, but any app can declare the
  same scheme. Never pass a secret through it; prefer verified HTTPS links.

## Deferred links (before install)

- Firebase Dynamic Links has been shut down: do not use it anymore. Alternatives: an attribution or
  linking provider (Branch, AppsFlyer, Adjust...) or an in-house solution.
- Android: the Play Install Referrer passes a parameter at install time. iOS offers no equivalent
  deterministic mechanism; avoid fingerprinting, which goes against privacy rules.

## In-app routing

- Expo Router: file routes are links by default; declare the scheme in the app config
  (skill `expo-router`).
- React Native without Expo: React Navigation `linking` configuration (skill `react-navigation`).
- Flutter: `go_router` (skill `flutter-setup-declarative-routing`).
- Native: `onOpenURL` / scene delegate (iOS), activity intent (Android), with Navigation 3 or the
  project's navigation.

## Security

- Validate and normalize every parameter; a link never triggers a sensitive action on its own
  (payment, deletion, email change): it opens a screen that asks for confirmation.
- No authentication token in a link; watch out for open redirects.

## Tests

- iOS: `xcrun simctl openurl booted "<url>"`; Android:
  `adb shell am start -W -a android.intent.action.VIEW -d "<url>" <package>`.
- Cases: app installed and closed, in the background, not installed (fallback web page), invalid link.
