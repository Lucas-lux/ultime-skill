---
name: mobile-accessibility
description: >
  Accessibility of Android (Compose, views), React Native and Flutter mobile apps: TalkBack and
  VoiceOver screen readers, labels, roles, target sizes, enlarged text, contrast, reduced motion,
  testing. Use to make a mobile app accessible or audit it, TalkBack, VoiceOver, mobile accessibility
  or EN 301 549.
---

# Mobile accessibility

For native iOS in depth: skill `ios-accessibility` (mobile-ios pack). The European standard EN
301 549 also covers mobile applications; it is the basis for the European Accessibility Act.

## Common requirements

- Every interactive element has an understandable label, a role and a state announced by the screen
  reader; decorative images are ignored.
- Target sizes: at least 44 x 44 points (iOS) and 48 x 48 dp (Android).
- Text that follows the system size setting without being truncated or overlapping; layouts that
  adapt.
- Sufficient contrast (4.5:1 for body text); information never relies on color alone.
- Logical focus order; grouping of related elements; announcements of dynamic changes.
- Respect reduced motion; no flashing content.

## By technology

- **React Native**: `accessible`, `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`,
  `accessibilityState`; do not disable `allowFontScaling`; `AccessibilityInfo` for the screen reader
  and reduced motion.
- **Jetpack Compose**: `contentDescription`, `Modifier.semantics` (role, state),
  `semantics(mergeDescendants = true)` to group, `clearAndSetSemantics` to replace.
- **Android views**: `contentDescription`, `importantForAccessibility`, `labelFor`.
- **Flutter**: `Semantics` widget, `semanticsLabel`, `ExcludeSemantics`, `MergeSemantics`; test with
  an enlarged `MediaQuery.textScaler`.

## Testing

- Manually: critical flows with TalkBack and VoiceOver on, text at maximum, dark mode, high
  contrast.
- Tools: Accessibility Scanner (Android), Accessibility Inspector (Xcode), automatic checks in UI
  tests when the framework allows it.
- Record the gaps and the level reached (accessibility statement if the app is subject to one).
