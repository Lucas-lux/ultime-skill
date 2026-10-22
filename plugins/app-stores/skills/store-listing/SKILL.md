---
name: store-listing
description: >
  Builds the complete App Store and Google Play listing file set for a new app, within each store's
  limits: texts per language, categories, rating, privacy, URLs, visuals, review notes. Use to create
  or redo a store listing, prepare a first submission, or "App Store listing", "Play Store listing",
  "store listing", "fiche App Store", "fiche Play Store".
---

# Store listing file set (App Store and Google Play)

Produces a single file set, versioned in the repository, which then feeds the publishing tools
(`asc-metadata-sync`, `gplay-metadata-sync`, fastlane) or the entry in the consoles
(`store-console-browser`). Fine-tuning of keywords and visuals comes from the store-aso pack.

## Fields and limits

Most used character limits, to recheck in the stores' documentation before submission:

| App Store | Limit | Google Play | Limit |
|---|---|---|---|
| Name | 30 | Title | 30 |
| Subtitle | 30 | Short description | 80 |
| Promotional text (editable without a version) | 170 | Full description | 4000 |
| Description | 4000 | | |
| Keywords (comma-separated) | 100 | | |
| Release notes | 4000 | Release notes | 500 per language |

## File set contents

1. **Identity**: name (distinct from any existing app, see `app-clone`), subtitle, primary and
   secondary category, displayed developer.
2. **Texts per language**: written for the market (not a word-for-word translation), without unproven
   superlatives, without competitor names or other parties' brand keywords.
3. **Rating**: Apple age questionnaire and Google Play IARC questionnaire, filled in according to the
   actual content (user-generated content, purchases, communication between users).
4. **Privacy**: privacy policy URL (mandatory on both stores), Apple labels (`privacy-policy`,
   `privacy-publish`), Data safety form (`play-data-safety`), account deletion (in-app and web link).
5. **URLs**: support (mandatory at Apple), marketing site, terms of use if subscriptions.
6. **Visuals**: icon, screenshots for each required device size, Google Play feature graphic (1024 x
   500), optional video. Exact specifications to check (they follow new devices); production with
   `app-store-screenshots`, strategy with `screenshot-optimization`.
7. **Pricing and availability**: countries, price, declared in-app purchases and subscriptions.
8. **Review**: notes for reviewers, demo account sent through the console (never in the repository),
   specific declarations (advertising, encryption, sensitive content, target audience and children).

## Output format

- `store/listing.md`: overview reviewed by the user.
- One file per field and per language in the format of the chosen tool (see the tool's skill:
  `asc-metadata-sync`, `gplay-metadata-sync` or the `fastlane/metadata` structure).
- An automatic length check of each field before sending.

## Consistency

The listing describes the actual app: every feature mentioned exists, the screenshots show the app,
the declared privacy matches the code and the SDKs. An inconsistency is a frequent rejection reason.
