---
name: in-app-purchases
description: >
  iOS and Android in-app purchases and subscriptions without depending on a third-party service:
  StoreKit 2, Google Play Billing, react-native-iap, expo-iap, Flutter in_app_purchase, server
  verification, entitlements, restore, testing, store rules. Use to add in-app purchases,
  subscriptions, paywall, StoreKit, Play Billing or receipt verification.
---

# In-app purchases and subscriptions

Managed option: RevenueCat (third-party service, paid beyond a threshold). This skill describes the
direct route; Android details in the `play-billing-*` skills (mobile-android pack).

## Architecture

- **The server is the source of truth for entitlements**: the app displays, the server decides.
- iOS: StoreKit 2; listen to `Transaction.updates` from launch; signed transactions (JWS) to verify;
  server side, App Store Server API and App Store Server Notifications V2.
- Android: Google Play Billing Library; **acknowledge every purchase** (otherwise it is refunded
  automatically after a few days); verification through the Google Play Developer API; real-time
  notifications (RTDN) through Pub/Sub.
- Cross-platform: `react-native-iap` or `expo-iap` (React Native, Expo with a development build),
  `in_app_purchase` (Flutter). Verification stays server side.

## Flows to cover

- Purchase, pending purchase (deferred payment method), cancellation, failure.
- Subscription: trial, renewal, plan change, grace period, suspension, cancellation, refund,
  resubscription (skill `play-billing-subscription-states` for Android).
- **Restore purchases**: visible button, mandatory on iOS.
- Account login: link purchases to the user (account identifier passed to the store) to find them on
  another device.

## Store rules

- Digital goods and content consumed in the app go through the store's in-app purchase, except for
  exceptions by region and app type (external payment links, DMA-related alternatives in the EU...).
  These rules and the commissions change: check them in the App Review Guidelines and Google Play's
  Payments policy at design time.
- Paywall: price, period, automatic renewal and terms shown clearly before purchase; link to manage
  or cancel the subscription.

## Tests

- iOS: StoreKit configuration file in Xcode (local tests), sandbox accounts, then TestFlight.
- Android: license testers and test tracks; active products in the Play Console.
- Test accelerated renewals, payment failures, refunds, restore and device change. Check that the
  server processes notifications idempotently.

## Data and compliance

- Store only the transaction identifier and the entitlement state, no card data (the store handles
  it).
- Declare purchases in the Apple labels and the Google Data safety form.
- CGV (conditions generales de vente, terms of sale) and pre-contractual information (skill
  `mentions-legales-cgu-cgv`).
