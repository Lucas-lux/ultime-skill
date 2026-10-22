---
name: app-install-campaigns
description: >
  Mobile app acquisition campaigns (installs and in-app events) on Apple Ads, Google App campaigns,
  Meta and TikTok: structure, optimization, iOS measurement (ATT, SKAdNetwork, AdAttributionKit), MMP,
  budget, custom store pages, consent. Use to launch or optimize install campaigns, user acquisition,
  CPI, app ROAS or mobile attribution.
---

# App install campaigns

Complements the skills `ads` (advertising strategy), `ua-campaign` and `apple-search-ads` (growth-ads
pack), `attribution-setup` (growth-analytics). Every campaign creation, every committed budget and every
launch happens after the user's confirmation, on their ad accounts.

## Prerequisites

- Measurement in place **before** spending: in-app events defined (sign-up, trial start, purchase,
  retention), attribution SDK or ad network SDKs, conversions reported and verified in testing.
- Store listing ready and consistent with the ads (store-aso and app-stores packs); custom product
  pages (Apple) or custom store listings (Google Play) per audience or message.
- Consent: in the EU, advertising and measurement SDKs that process identifiers require the user's
  consent; on iOS, access to the advertising identifier goes through App Tracking Transparency.
  Declare these SDKs in the Apple labels and the Data safety form.

## iOS and Android measurement

- iOS: without ATT consent, measurement goes through SKAdNetwork and its successor AdAttributionKit
  (aggregated, delayed data, with conversion values to configure); Apple Ads is attributed through the
  AdServices framework.
- Android: Play Install Referrer and advertising identifier depending on consent.
- An MMP (AppsFlyer, Adjust, Branch, Singular...) unifies multi-network measurement; without an MMP,
  use each network's SDKs and integrations. Choose based on budget, not by reflex.

## Structure by ad network

| Network | Key points |
|---|---|
| Apple Ads | Search intent in the App Store; campaigns by type (brand, generic, competitors, discovery); negative keywords; custom product pages per ad group. |
| Google App campaigns | Automated delivery (Search, Play, YouTube, Display) from text, image and video assets; bidding on cost per install, per action or on return on investment. |
| Meta (app promotion) | Optimization on installs, events or value; renewed volume of creatives; iOS campaigns subject to the measurement constraints above. |
| TikTok (app promotion) | Native vertical video formats, creatives in the platform's tone (UGC), fast renewal. |

- Separate iOS and Android, and the markets.
- Optimize on an event that has value (trial, purchase) as soon as the volume allows; installs alone
  attract poorly engaged users. Respect the minimum volumes recommended by each network to exit the
  learning phase.

## Steering

- Capped test budget, then gradual scale-up on what works; no abrupt change during learning.
- Indicators: cost per install, cost per action (trial, purchase), D1 / D7 / D30 retention, D7 / D30
  ROAS, acquisition cost payback period (together with `finops-analyst` and the business model).
- Creatives: test by concept (skill `marketing-creatives`), keep the winners, cut the losers, renew
  before fatigue.
- Weekly report: spend, results by network and by creative, learnings, decisions.

## Guardrails

- Daily and total budget caps defined with the user; spend alerts.
- No misleading promise, no fake interface or fake reviews in ads; French and European rules in
  `marketing-compliance-fr`.
