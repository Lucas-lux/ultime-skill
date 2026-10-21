# Mobile

Les runners macOS coutent environ dix fois plus que Linux : iOS natif et builds signes en principale ou
la nuit, jamais sur chaque PR, sauf si les fichiers natifs changent (`paths`).

## Expo et React Native

| Job | Commande | Niveau |
|---|---|---|
| doctor | `npx expo-doctor` | PR |
| js | lint, typage, tests Jest de `node.md` | PR |
| bundle | `npx expo export --platform all` (le bundle se construit, sans erreur de resolution) | PR |
| fingerprint | `npx expo-updates fingerprint:generate` compare a la branche principale : un changement natif impose un nouveau build, sinon une mise a jour OTA suffit | PR |
| build | `expo/expo-github-action@9.0.1` puis `eas build --profile preview --non-interactive --no-wait` | principale, si `EXPO_TOKEN` |
| e2e | Maestro (2.11.0) : flows dans `.maestro/`, sur EAS (`eas build` + workflow Maestro) ou sur emulateur Android (`reactivecircus/android-emulator-runner`) | nuit |
| update | `eas update --branch preview` apres fusion si le fingerprint est inchange | principale, si `EXPO_TOKEN` |

## Flutter

`subosito/flutter-action@v2` (canal stable, version figee dans `pubspec.yaml` ou `.fvmrc`) :
`dart format --output=none --set-exit-if-changed .`, `flutter analyze --fatal-infos`,
`flutter test --coverage`, `flutter build apk --debug` (PR) ; `flutter build ipa --no-codesign` sur macOS
la nuit ; tests d'integration (`integration_test`) sur emulateur la nuit.

## Android natif

`actions/setup-java@v6` (distribution temurin, version du projet) puis `gradle/actions/setup-gradle@v6` :
`./gradlew lint testDebugUnitTest assembleDebug` (PR), `detekt` ou `ktlintCheck` si configures,
`./gradlew connectedCheck` sur emulateur la nuit. Validation du wrapper Gradle incluse dans setup-gradle.

## iOS natif

macOS : `xcodebuild -scheme <app> -destination 'platform=iOS Simulator,name=<iPhone recent>' test` avec
`-resultBundlePath`, SwiftLint (`swiftlint --strict`), build `-configuration Release` sans signature.
Signature et TestFlight : seulement en release, avec les secrets du store (voir pack `mobile`,
skill `mobile-release`).
