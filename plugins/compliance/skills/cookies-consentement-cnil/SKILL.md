---
name: cookies-consentement-cnil
description: >
  Cookies and trackers under CNIL rules: freely given consent, refusing as easy as accepting,
  lifetimes, proof, exemptions, cookie walls, CMP. Use when the user mentions cookies, trackers,
  traceurs, consent banner, bandeau or banniere de consentement, consent, consentement, CMP, tracking,
  audience measurement, mesure d'audience, or CNIL cookie compliance.
---

# Cookies and trackers (CNIL)

Framework: article 82 of the loi Informatique et Libertes (French Data Protection Act, transposing the
ePrivacy directive), clarified by the CNIL's 2020 guidelines and recommendation on "cookies et autres
traceurs" (cookies and other trackers). Check the site's actual behavior (what is set before consent),
not only the CMP configuration.

## Principle

Any tracker that is not strictly necessary to the service requires the user's **prior consent**.
Nothing that requires consent is set or read **before** a positive and informed action. Simply
continuing to browse does not count as consent.

## Concrete rules to check

- **Refusing as easy as accepting.** If there is an "Accept all" button, there is a "Refuse all" button
  of the same level, visible on the same screen. No refusal hidden behind several clicks.
- **No consent by default.** No pre-ticked box, no non-essential tracker active as long as the user has
  not consented. The default choice is refusal.
- **Granular consent.** Ability to consent per purpose (audience measurement, advertising, social
  networks...), not only all or nothing.
- **Clear information** before the choice: purposes, controllers and the ability to withdraw consent as
  easily as it was given.
- **Withdrawal**: a simple and permanent way to change one's choice (link or icon accessible at any
  time).

## Lifetimes

- **Tracker lifetime**: 13 months maximum after it is set, not extendable merely by the user's return
  (CNIL recommendation).
- **Information collected through trackers**: kept 25 months maximum.
- **Validity period of the choice**: the CNIL recommends keeping the choice (consent as well as refusal)
  for a period of around 6 months, so as not to ask again too often.
- Recheck these durations at the source before writing them into a policy: they are recommendations
  that may change.

## Proof of consent

Keep proof that consent was validly collected (timestamp, banner version, accepted purposes), so as to
be able to produce it. Log without superfluous personal data.

## Consent exemptions

Some trackers are exempt because strictly necessary: shopping cart, session authentication, language
preferences, load balancing, and **audience measurement** under strict conditions (purpose limited to
anonymous measurement, no cross-referencing with other processing, no tracking on other sites, limited
duration). The CNIL publishes the list of exempt audience measurement solutions: check it rather than
assuming.

## Cookie walls

The "cookie wall" (access conditional on accepting trackers) is not banned in principle but is assessed
**case by case** depending on whether a real alternative means of accessing the service exists. Do not
present it as always allowed or always banned.

## CMP integration (checklist)

- Effective blocking of trackers **before** consent (tags, third-party SDKs, pixels): check in the
  browser that no non-essential tracker fires before the choice.
- Accept and refuse buttons at the same level, granular choice per purpose.
- Consent state propagated to the tags (consent mode) and respected server side if needed.
- Withdrawal point accessible at all times, which actually resets the relevant trackers.
- Consent proof log.
- Test the full journey: first visit, refusal, partial acceptance, withdrawal, return visit after the
  choice expires.
