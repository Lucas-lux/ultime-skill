---
name: store-console-browser
description: >
  Drives the Play Console and App Store Connect in the user's browser for what the APIs and CLIs do not
  cover (app creation, questionnaires, Data safety, privacy, declarations), from a prepared file set,
  with review before each submission. Use to fill in the Play Console or App Store Connect through the
  browser, or create a store listing in the console.
---

# Store consoles in the browser

Order of preference: APIs and CLIs first (`asc-*`, `gplay-*`, fastlane), browser only for what they do
not cover. What often belongs to the interface (to recheck, the APIs evolve): app creation in the Play
Console, rating questionnaire, Data safety form, target audience and content, declarations
(advertising, government apps, financial or health features), and at Apple some sections such as app
privacy.

The `asc web` tool of the asc CLI also automates part of these screens through an unofficial Apple web
session: offer it as an alternative, at the user's discretion.

## Before starting

- Load the skill for the browser in use (`chrome-browser` for Claude in Chrome) and follow its rules.
- Have the file set ready: `store/listing.md`, `store/data-safety.md`, visuals, questionnaire answers
  (skills `store-listing`, `play-data-safety`).
- Work in a new tab, on the user's developer account.

## What the user does themselves

- Signing in, two-factor authentication, CAPTCHAs, identity verification.
- Creating the developer account, paying the fees, accepting contracts and agreements (including the
  payment and tax agreements needed to sell).
- Clicking the buttons that commit: submit for review, publish, start a production rollout.

## Procedure

1. Open the section to fill in, read the current state before any change.
2. Fill in field by field from the file set, without improvising an answer missing from it: ask.
3. Before each save: summarize what is going to be saved and wait for approval.
4. After each section: check that the console shows no error or warning, and record the state in
   `store/console-log.md` (section, date, value entered, status).
5. Never write a secret visible on screen into a file or a log; the demo account for reviewers is
   typed by the user or pasted from their password manager.

## When blocked

Changed interface, element not found, unexpected message: stop, describe the screen, and ask the user
rather than clicking at random.
