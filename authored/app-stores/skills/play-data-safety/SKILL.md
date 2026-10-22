---
name: play-data-safety
description: >
  Builds the Google Play Data safety form answers from the code and the SDKs actually embedded: data
  types, collection, sharing, purposes, encryption, deletion. Use to fill in or check the Data safety
  form, the data safety section of the Play Console, or a Google Play rejection related to data.
---

# Data safety form (Google Play)

The form binds the developer: it must reflect what the app and **all its SDKs** actually do, not what
the team thinks they do. Apple equivalent: privacy labels (`privacy-policy`, `privacy-publish` from the
store-apple pack); both must be consistent with each other and with the privacy policy.

## Method

1. **Inventory the data sources**: manifest permissions, the app's network calls, forms, and every SDK
   (analytics, crash, advertising, attribution, authentication, payment, maps, chat). For each SDK,
   read its Data safety disclosure documentation (most vendors publish one).
2. **Classify each data item** according to the form's categories: location, personal info, financial
   info, health and fitness, messages, photos and videos, audio files, files and docs, calendar,
   contacts, app activity, web browsing, app info and performance, device or other IDs.
3. **For each data item**:
   - collected (leaves the device) or not; ephemeral processing or not;
   - shared with a third party or not (service providers acting on the developer's behalf do not
     count as sharing, according to Google's definitions, to be reread);
   - required or optional for the user;
   - purposes: app functionality, analytics, developer communications, advertising or marketing,
     fraud prevention and security, personalization, account management.
4. **Security practices**: encryption in transit, ability to request data deletion, any commitment to
   a families policy or an independent review.
5. **Write the answers table** in `store/data-safety.md` (data item, collected, shared, purposes,
   optional, source in the code or the SDK), to be validated by the user.
6. **Enter it**: through the Play Console (skill `store-console-browser`); the console also offers an
   import and export of the form, to use if available.

## Points of attention

- Advertising ID, analytics SDK installation ID, push token: these are device identifiers, to be
  declared.
- A permission that is declared but unnecessary must be removed from the manifest rather than
  justified.
- Any change (new SDK, new data item) requires updating the form before the release.
- Consistency with the RGPD (GDPR) record of processing and the privacy policy (skill `rgpd-cnil`).
