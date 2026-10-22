---
name: app-clone
description: >
  app-factory clone mode: reproduces the value of a reference app (features, journeys, quality)
  as a distinct, customized product, without copying brand, assets, texts or code. Use to
  clone, copy, reproduce, take inspiration from or build "the same app as" an existing app, or
  "app-clone".
---

# Cloning an app while customizing it

"Cloning" means here: shipping a product that provides the same service, as well or better, under its
own identity. That is what is legal and what passes store review. A slavish copy exposes you to
infringement (trademark, copyright on texts, visuals and code), unfair competition and
parasitism, and rejection: Apple refuses copycat apps (rule 4.1 of the App Review Guidelines) and
Google Play penalizes impersonation.

This skill covers phase P0 of clone mode. Then `app-factory` takes over at P1.

## What we take, what we do not take

| Take (ideas, functions) | Never take |
|---|---|
| Features, journeys, visible business rules | Name, logo, brand, icon, recognizable visual identity |
| Quality level, good ergonomic ideas | Texts, illustrations, photos, sounds, videos |
| Business model in general | Source code, assets or private APIs of the app |
| Standard platform interface conventions | Contents of its database (catalog, reviews, profiles) |

## Observation sources

- **Allowed**: using the app as a user (browser or device, the user's account),
  store listing, marketing site, public documentation and APIs, release notes, public reviews (for the
  pain points to fix, without republishing their content).
- **Respect the app's terms of use**: no mass scraping, no bypassing of authentication or
  paywall, no fake account.
- **Source code or binary**: only if the user holds the rights to it (their former app, an
  open source project whose license is respected). In that case, `greenfield` (`/greenfield:analyze`)
  produces "clean room" behavioural specs with no inherited code. Decompiling a third-party
  app to reproduce it is excluded.

## Steps

1. **Frame** (multiple-choice questions): reference app (web and store links), what
   the user wants to keep, target market and languages, desired differentiation, platforms.
2. **Observe**: agent `reverse-spec-analyst`. Inventory of screens, journeys, roles, visible business
   rules, notifications, onboarding, settings, monetization, integrations. Screenshots and notes in
   `.app-factory/reference/` (internal use, never shipped nor versioned if they contain
   third-party data).
3. **Write the behavioural spec** `docs/product/reference-spec.md`: user capabilities and
   acceptance criteria, written in your own words. No text of the app copied.
4. **Parity matrix** `docs/product/parity-matrix.md`: each feature classified as essential,
   useful, to ignore or to improve, plus the pain points found in the reviews, which become
   differentiators.
5. **Customization brief** (agent `product-strategist`): name (`product-name`), positioning
   (`positioning-ideas`, `value-proposition`), own visual identity (ui-design pack), tone, languages,
   monetization suited to the market, local obligations. Name availability to be checked by
   the user (INPI and EUIPO databases, stores, domain name): the agent lists the searches, it does not
   conclude in place of a lawyer.
6. **Distinctiveness check** (agent `gate-verifier`): name, icon, colors, screenshots, texts and
   signature journeys must not be confusable with the reference app. Any doubtful point is
   fixed before G0.
7. **Hand over**: `docs/product/brief.md` completed, then `app-factory` at P1 (lightened discovery:
   the reference app is the first competitor analyzed).

## Deliverables

`docs/product/reference-spec.md`, `docs/product/parity-matrix.md`, `docs/product/brief.md`, distinctiveness
report in `.app-factory/gates/G0.md`.
