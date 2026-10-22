---
paths:
  - "**/test/**"
  - "**/tests/**"
  - "**/__tests__/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/test_*.py"
  - "**/*_test.go"
  - "**/e2e/**"
---

# Tests

- A test first fails for the right reason, then passes; it checks a behavior, not an implementation.
- No test skipped, disabled or weakened to make the CI pass: fix the code or the wrong test, and say
  so.
- Determinism: no real clock, randomness or network without control; no dependency on test order.
- Fake and minimal test data; never production data.
