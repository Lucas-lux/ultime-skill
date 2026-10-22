# Decision policy

Goal: the owner only sees what requires their vision or commits to something irreversible. Everything
else is decided by the team of agents, traced, and can be reversed later. Question to ask:
**if we are wrong, how much does going back cost, and who pays for it?**

## The four classes

**A. Decided alone, traced in `decisions.md`** (reversible, within the already validated scope)
- Internal technical choices: code structure, permissively licensed library, naming, patterns,
  refactoring, tests, documentation.
- Story order, splitting a story, postponing a non-critical story.
- Provisional interface texts, UX details compliant with the design system.
- Bug, security, compliance and accessibility fixes that do not change the scope.
- Choices among options already validated by the owner.
- Passing gates G4 and G5 when `gate-verifier` returns PASS.

**B. Decided alone, flagged in the dashboard** (reversible but notable)
- Deviation from an ADR that is not structuring, significant new dependency, minor reduction of
  a milestone's scope, risk accepted with a `gate-verifier` reservation.
- Passing G3 outside security and compliance with a PASS WITH RESERVATIONS verdict.

**C. Decision card to the owner** (vision, money, law, irreversible); the project continues on
everything that does not depend on it
- Vision: go, pivot or stop (G1); target, positioning, value proposition.
- Scope: PRD freeze (G2), adding or removing an MVP feature.
- Money: price, business model, any spend or subscription, any recurring cost above
  `autopilot.spend_free_threshold` (0 by default).
- Brand: name, identity, brand tone, domain.
- Structuring and costly to undo: stack, database, host, authentication
  or payment provider, published data model.
- Law: terms of use, processing of sensitive data, minors, health, transfer outside the EU, security and
  compliance part of G3 if `gate-verifier` did not return PASS.
- External: go / no-go for production (G6), store submission, publication, campaign,
  email or notification to users, account creation, contract, access to real data.
- Failure: a story or a gate blocked after the bounded fix loop.
- Anything the team does not know how to classify.

**D. Excluded**: the "Excluded" list of `autonomy.md` (credentials taken elsewhere, secrets in the code,
bypassing guardrails, fake reviews, dark patterns, copying a brand or code).

## Default on expiry

- A card can carry a default: the recommended option applies by itself after `default_after_hours`
  (72 h by default) **only if** the decision is reversible AND `autopilot.allow_defaults` is
  true. The wake-up then comments on the card (`<!-- autopilot -->` then "default applied") and closes it.
- Never a default for: money, law, brand, production release, external, stack. These cards
  wait; the project moves forward on the rest or goes dormant (empty wake-ups).

## Card format (GitHub issue)

Title: `[Decision] <one-line question> ✨`. Labels: `decision`. Assignee: the owner.
Body, in the user's language, readable on a phone, 20 lines at most:

```
<!-- autopilot -->
**Context**: <3 lines at most, what led to the question>
**What is waiting**: <what is blocked, and what continues in the meantime>

1. <option>: <one-line consequence, cost, reversibility>
2. <option>: ...
3. <option>: ...

**Recommendation**: <number> because <one-line reason>.
**Default**: <number> applied on <date> if no answer | none (non-reversible decision).
**Detail**: <path of the deliverable or the PR, for whoever wants to dig in>

Reply with a comment: `1`, `2`, `3`, or your own answer in one sentence.
✨
```

- One question per card. No needless jargon, concrete consequences (euros, delay, what
  the end user will see).
- If several decisions are linked, a single card that presents them together.

## Reading the answer

- Only a comment from `autopilot.owner` counts. A number chooses the option. A free sentence is
  interpreted; if it remains ambiguous, a clarification question in the same thread.
- The decision is recorded in `decisions.md` (date, card, decision, reason if given), then the card
  is closed with a comment that starts with `<!-- autopilot -->` then one line: "Noted, applied
  in <PR or phase>. ✨".
- The owner can at any time reverse a class A or B decision, or impose one, by
  opening an issue themselves with the `decision` label: its body is the decision (the
  `autopilot-wake` workflow wakes the project up). A comment on the dashboard is not read.
