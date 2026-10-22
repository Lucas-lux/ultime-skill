---
name: mobile-security-masvs
description: >
  Security audit and hardening of an iOS, Android, React Native or Flutter mobile app following OWASP
  MASVS and MASTG: storage, crypto, authentication, network, platform, code, resilience, privacy. Use
  to secure or audit a mobile app, OWASP MASVS, MASTG, secure storage, pinning, or sensitive data on
  mobile.
---

# Mobile security (OWASP MASVS)

Reference: OWASP MASVS (requirements) and MASTG (testing methods), version 2: the categories below
replace the old breakdown. Target the L1 profile for any app, L2 for sensitive data (health, finance,
identity), and add resilience (R) when the app protects an asset against reverse engineering.

Only test the project's own app, on its development or staging environments.

## By category

| Category | What to check in the code and at runtime |
|---|---|
| MASVS-STORAGE | Secrets and tokens in the Keychain (iOS) or the Keystore / EncryptedSharedPreferences equivalents (Android), never in plain text (UserDefaults, SharedPreferences, AsyncStorage, files). Nothing sensitive in logs, app switcher screenshots, clipboard, backups. |
| MASVS-CRYPTO | Platform algorithms and APIs (CryptoKit, Keystore), no homemade crypto, no hardcoded key in the binary. |
| MASVS-AUTH | Authentication and authorization verified server side; biometrics bound to a Keystore or Keychain key, not to a mere boolean; revocable sessions. |
| MASVS-NETWORK | TLS everywhere (App Transport Security, Network Security Config without cleartext traffic); pinning only if the risk justifies it and with a rotation plan. |
| MASVS-PLATFORM | Deep links and intents validated and filtered (skill `deep-links`, `android-intent-security`); WebView without unnecessary JavaScript or native bridge; minimal permissions (`android-permissions-security`). |
| MASVS-CODE | Dependencies up to date and audited; validated inputs; reasonable minimum OS versions; forced update possible to retire a vulnerable version. |
| MASVS-RESILIENCE | Root or jailbreak detection, instrumentation and tampering detection, obfuscation (R8 on Android): as defense in depth, never as the only protection. |
| MASVS-PRIVACY | Data minimization, transparency (Apple labels, Google Data safety), consent, advertising identifiers only with consent (App Tracking Transparency on iOS). |

## Method

1. Read the project's threat model; otherwise create it (`security-threat-model`).
2. Code review by category (table above); specifically in React Native and Flutter: no secret in the
   JavaScript or Dart bundle (it is readable), secure storage through a library that uses Keychain and
   Keystore.
3. Static analysis of the binary (MobSF or equivalent) on a staging build.
4. MASTG dynamic tests on a test device or emulator: storage after use, network traffic, deep link
   behavior.
5. Report: MASVS requirement, evidence, severity, fix; blocking items addressed before release.

## Common pitfalls

- Third-party service API key embedded in the app: consider it public; go through a backend or
  restrict the key (domain, bundle, quotas).
- Session token in AsyncStorage or SharedPreferences in plain text.
- Debug logs enabled in production.
- Deep link that triggers a sensitive action without confirmation.
