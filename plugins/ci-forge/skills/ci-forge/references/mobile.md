# Mobile

macOS runners cost about ten times more than Linux: native iOS and signed builds on main or nightly,
never on every PR, unless native files change (`paths`).

## Expo and React Native

| Job | Command | Level |
|---|---|---|
| doctor | `npx expo-doctor` | PR |
| js | lint, typing, Jest tests from `node.md` | PR |
| bundle | `npx expo export --platform all` (the bundle builds, without resolution errors) | PR |
| fingerprint | `npx expo-updates fingerprint:generate` compared to the main branch: a native change requires a new build, otherwise an OTA update is enough | PR |
| build | `expo/expo-github-action@9.0.1` then `eas build --profile preview --non-interactive --no-wait` | main, if `EXPO_TOKEN` |
| e2e | Maestro (2.11.0): flows in `.maestro/`, on EAS (`eas build` + Maestro workflow) or on an Android emulator (`reactivecircus/android-emulator-runner`) | nightly |
| update | `eas update --branch preview` after merge if the fingerprint is unchanged | main, if `EXPO_TOKEN` |

## Flutter

`subosito/flutter-action@v2` (stable channel, version pinned in `pubspec.yaml` or `.fvmrc`):
`dart format --output=none --set-exit-if-changed .`, `flutter analyze --fatal-infos`,
`flutter test --coverage`, `flutter build apk --debug` (PR); `flutter build ipa --no-codesign` on macOS
nightly; integration tests (`integration_test`) on an emulator nightly.

## Native Android

`actions/setup-java@v6` (temurin distribution, project version) then `gradle/actions/setup-gradle@v6`:
`./gradlew lint testDebugUnitTest assembleDebug` (PR), `detekt` or `ktlintCheck` if configured,
`./gradlew connectedCheck` on an emulator nightly. Gradle wrapper validation included in setup-gradle.

## Native iOS

macOS: `xcodebuild -scheme <app> -destination 'platform=iOS Simulator,name=<iPhone recent>' test` with
`-resultBundlePath`, SwiftLint (`swiftlint --strict`), `-configuration Release` build without signing.
Signing and TestFlight: only on release, with the store secrets (see the `mobile` pack,
`mobile-release` skill).
