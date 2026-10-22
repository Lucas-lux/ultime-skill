# Quality bar of a finished product

Basis of the project's definition of done (P4) and of the `gate-verifier` checklists. Adapt to the context
(an internal tool does not have the obligations of a consumer app), but any exclusion is written and
justified in `decisions.md`, never implicit.

## Product

- Each PRD requirement is delivered and accepted, or explicitly postponed.
- Onboarding, empty states, loading, errors and offline (mobile) are handled.
- The texts are proofread (`ux-copy` if available), in the languages of the target market.
- A support or contact channel exists.

## Code

- Unit tests on the business logic, integration tests on the boundaries (database, third-party APIs),
  end-to-end tests on the critical journeys. No arbitrary numeric coverage target: the
  critical journeys are covered.
- Strict lint, formatting and typing in CI; no test disabled without a ticket.
- Installation README that works on a fresh machine; ADR for each structuring choice.

## Security

- OWASP ASVS level 1 at minimum, level 2 as soon as there is sensitive data, payment or
  privileged accounts. Mobile: OWASP MASVS-L1, L2 for sensitive data.
- Authorization verified server-side on each route; proven authentication (recognized library or
  service, never home-made crypto); MFA offered for privileged accounts.
- Secrets out of the code and git; rotation possible. Audited dependencies; security headers;
  rate limiting on sensitive endpoints; logs without personal data or secrets.
- The threat model is up to date with the shipped code.

## Data and database

- Schema versioned by migrations, applied by the CI, reversible or in expand / contract mode for
  live changes.
- Integrity constraints in the database, indexes justified by the real queries (verified with EXPLAIN).
- Least-privilege database accounts, separated per environment; no real data in dev.
- Automatic backups and **tested restore**; point-in-time restore if the loss of
  recent data is unacceptable. Encryption in transit and at rest.
- Defined retention period and effective purge of personal data.

## Compliance (France and EU by default)

- GDPR: record of processing, legal bases, information of data subjects, exercise of rights, processors under
  contract, framed transfers outside the EU, DPIA if the processing requires it (`rgpd-cnil` skill).
- Cookies and trackers compliant with the CNIL recommendations (`cookies-consentement-cnil` skill).
- Legal notices, terms of use, terms of sale if selling (`mentions-legales-cgu-cgv` skill).
- Accessibility: RGAA or WCAG 2.1 AA targeted; the European Accessibility Act applies to some
  services since June 28, 2025 (`rgaa`, `wcag` skills).
- AI features: AI Act transparency obligations to check; user-published content:
  moderation and reporting to plan for.

## Design and UX

- Design system with tokens; responsive; compliant contrast and target sizes; keyboard navigation
  and screen reader on the critical journeys.
- No generic "AI" interface (ui-design pack: `impeccable`, `baseline-ui`). Mobile: platform
  conventions (Human Interface Guidelines, Material).

## Performance

- Web: Core Web Vitals within Google's "good" threshold (LCP 2.5 s, INP 200 ms, CLS 0.1) at the 75th
  percentile. API: p95 and p99 targets set in the PRD and measured (`k6`).
- Mobile: cold start, app size and consumption monitored.

## Operations

- Full CI/CD; staging close to prod; infrastructure as code when it exists.
- Reversible deployment, smoke tests after deployment, tested rollback.
- Monitoring, SLOs and alerts on symptoms; runbooks for each alert; incident plan.

## FinOps

- Budget and cost alerts in place; tagged resources; cost per business unit tracked; no
  idle resource; the envelope validated in P2 is respected or re-estimated with the user.

## Project management

- Backlog closed or explicitly postponed; decisions traced; release notes; retro done; the
  documentation describes what exists with the real versions.

## Launch

- Analytics compliant with consent; basic SEO (titles, meta, sitemap, robots, structured
  data); store listings if mobile; legal pages online; north star metric measured.
