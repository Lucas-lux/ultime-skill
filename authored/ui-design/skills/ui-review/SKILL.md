---
name: ui-review
description: >
  Review of a web interface in the code and on screen: accessibility, interactions, forms, states,
  perceived performance, content, consistency with the design system, with evidence and fixes. Use
  for "UI review", "review my UI", "audit design", "check accessibility", "UX review".
---

# Interface review

Golden rule: look at the rendered interface, not only the code. Every finding has evidence: screenshot,
`file:line`, or measurement (contrast, target size, time).

## 1. Prepare

- Pages and flows to review (without detail: the critical flows of the PRD, otherwise the home page,
  login and the main flow).
- Run the app locally (`run` skill) and open each page at desktop width (1440 px) and mobile
  (375 px), in light and dark theme if the site has both.
- Load the project's design system (tokens, components): it is the reference before any taste.

## 2. Run the checklist

Detailed checklist: [references/web-interface-guidelines.md](references/web-interface-guidelines.md)
(Vercel's Web Interface Guidelines, MIT license attached). Order, from most severe to finest:

1. **Accessibility**: full keyboard navigation, visible focus, logical order, accessible roles and
   names, contrast (4.5:1 for text, 3:1 for large text and components), alternative text,
   `prefers-reduced-motion` respected. Measure with `@axe-core/playwright` or Lighthouse.
2. **Forms**: associated labels, correct types and `autocomplete`, errors near the field and
   announced, value kept after an error, submit disabled only while sending.
3. **States**: loading, empty, error, success, offline; no blank screen or layout shift.
4. **Interactions**: targets of at least 44 px on touch, hover not required, immediate feedback on every
   action, destructive actions confirmed or undoable.
5. **Layout**: no horizontal overflow at 375 px, safe areas on mobile, readable line length, alignments
   and spacing on the token grid.
6. **Perceived performance**: images sized and lazy off screen, fonts without text shift, no blocking
   on click (LCP, CLS, INP measurements).
7. **Content**: clear and consistent text, numbers and dates in the language's format, no placeholder
   text, tone consistent with the brand.
8. **Consistency**: design system components rather than local variants, no generic pattern of
   generated interfaces (see the `impeccable` and `frontend-design` skills of the ui-design pack).

## 3. Fix and deliver

- Fix directly what belongs to the code (accessibility, states, forms) with the smallest change, and an
  end to end test or an axe check that prevents regression.
- What changes the design (brand color, layout of a screen, tone) is proposed with a before and after
  screenshot, not imposed.
- Report in the user's language (`docs/design/ui-review-<date>.md`): table severity (blocking, major, minor) / page /
  finding / evidence / fix / status, then what was not reviewed.
