---
name: mobile-release
description: >
  Ship an iOS and Android app end to end: signing, versions, builds, TestFlight, Google Play tracks,
  staged rollout, fastlane, EAS, CI. Use to sign, build, publish, submit or update a mobile app,
  configure fastlane (match, pilot, deliver, supply), a test track or a rollout.
---

# Releasing a mobile app

Official or dedicated CLIs come first (`asc-*` skills from the store-apple pack, `gplay-*` from the
store-google pack, `eas-app-stores` for Expo); fastlane remains the cross-platform standard. Every
submission, publication or contract acceptance is confirmed by the user at the moment it is done.

## Prerequisites (done by the user)

- Apple and Google Play developer accounts in their name or the organization's (identity
  verification, D-U-N-S number for an organization at Apple, registration fees): the agent does not
  create accounts and does not pay.
- API keys: App Store Connect key (.p8) and Google Play service account with minimal rights, stored
  outside the repository (CI secrets manager, `.env` ignored by git).

## Identity and versions

- Stable identifiers from the start: iOS bundle ID, Android `applicationId`; they never change after
  the first publication.
- iOS: `CFBundleShortVersionString` (visible version) and `CFBundleVersion` (build, increasing).
  Android: `versionName` and `versionCode` (strictly increasing integer). Increment them in CI, not by
  hand.

## Signing

- **iOS**: certificates and profiles managed by `fastlane match` (shared encrypted storage) or by the
  account's automatic signing through the API; never a certificate in plain text in the repository.
- **Android**: Android App Bundle (AAB) and Play App Signing, mandatory for new apps; Google holds the
  app signing key, the team keeps the upload key (backed up, with a documented reset procedure). The
  SHA-256 fingerprint of the Play signing key is also used for App Links (skill `deep-links`).

## Test tracks and distribution

- **iOS**: TestFlight, internal testers (App Store Connect team members) then external testers
  (subject to a beta review). Production release with phased release over 7 days, pausable.
- **Android**: internal, closed, open and production tracks; staged rollout by percentage, pausable
  and haltable. A recent personal developer account must run a closed test with a minimum number of
  testers for a given period before accessing production: check the current thresholds in the Play
  Console help.
- Requirements that change every year: Android target API level, memory page size, minimum SDK and
  Xcode version to submit. Check them in the official documentation before each release, do not
  assume them.

## Automation

- **fastlane**: `match` (signing), `gym` (iOS build), `pilot` (TestFlight), `deliver` (App Store
  metadata and submission), `supply` (Play upload and metadata), `snapshot` and `screengrab`
  (screenshots).
- **Expo**: EAS Build and EAS Submit (skill `eas-app-stores`), OTA updates with EAS Update
  (`eas-update`) for JavaScript and assets only; an OTA update does not change the app's purpose nor
  bypass review.
- **CI**: signed build on every tag, automatic upload to the test track, manual promotion to
  production. Secrets injected by CI; logs without secrets.

## Pre-submission checklist

- Version and build incremented; release notes in each language (`release-notes`).
- Listing, screenshots, privacy and rating up to date (app-stores pack).
- iOS: privacy manifest (`PrivacyInfo.xcprivacy`) for required-reason APIs and the relevant SDKs;
  account deletion from within the app if the app lets users create one.
- Android: Data safety form consistent with the code (skill `play-data-safety`); account deletion
  from within the app and through a web link if the app lets users create one.
- Demo account provided to reviewers if the app requires login, sent through the console, never
  committed.
- Crash reporting and monitoring active (skill `setting-up-monitoring`, mobile layer); rollback plan
  (rollout pause, previous build ready).
