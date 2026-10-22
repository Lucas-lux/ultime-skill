---
name: push-notifications
description: >
  iOS and Android push notifications (APNs, FCM) in native, React Native, Expo and Flutter:
  permissions, tokens, server sending, channels, opening a screen, consent. Use to add, debug or
  design push notifications, APNs, FCM, expo-notifications, firebase_messaging, or marketing
  notifications.
---

# Push notifications

## Architecture

- **iOS**: APNs. Key-based authentication (.p8, recommended, does not expire) rather than
  certificate. Separate sandbox and production environments.
- **Android**: Firebase Cloud Messaging, HTTP v1 API with a service account (the legacy FCM APIs have
  been removed). FCM can also relay to APNs for an iOS app.
- **Expo**: `expo-notifications`, sending through Expo's push service or directly APNs/FCM.
- **Flutter**: `firebase_messaging` (and `flutter_local_notifications` for local display).
- **Server**: store one token per device and per user; tokens change (reinstall, restore,
  rotation): update on every launch and delete those the service reports as invalid. Asynchronous
  sending through a queue, with retries and rate limiting.

## Permissions

- iOS: ask for authorization at the right moment (after explaining the value), not on first launch;
  provisional authorization allows sending quietly to the notification center.
- Android 13 and later: `POST_NOTIFICATIONS` runtime permission. Notification channels by type (the
  user configures them one by one), created at startup.
- Handle refusal: the app works without, and offers to re-enable from the settings.

## Content and behavior

- Payload: title, body, and data to open the right screen (internal link, see `deep-links`).
- Handle the three cases: app in the foreground, in the background, closed (opened from the
  notification).
- Silent notifications (background update): limited and not guaranteed by the OSes, do not depend on
  them for critical logic.
- No sensitive data in a notification's text (visible on the lock screen).

## Consent and privacy

- Distinguish service notifications (related to usage) from marketing notifications; for
  prospecting, collect explicit consent and allow opting out by category in the app (skill
  `rgpd-cnil`).
- The push token is device-related data: declare it in the Apple labels and the Data safety form.

## Tests

- iOS: simulator (local payload sending) and real device for APNs; Android: emulator with Google
  services.
- Test the three app states, permission refusal, invalid token, and opening the target screen.
- Measure: opt-in, delivery and open rates; unsubscribes by category.
