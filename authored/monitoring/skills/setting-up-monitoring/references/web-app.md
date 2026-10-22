# Web application (front)

The front is monitored on the browser side (RUM, real user monitoring) and not only on the server side.
A fast server render does not guarantee a good experience.

## Core Web Vitals (RUM)

- LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift). Track
  the p75 per page and per device type (mobile vs desktop) and per country if relevant.
- TTFB, First Contentful Paint as a complement. Link to deployments to see a regression.

## Client-side errors

- Uncaught JavaScript errors, promise rejections, resource errors, with source maps to find the line.
  Error rate per front version and per browser.
- API call errors seen from the client (status, perceived latency), which often differ from the errors
  seen by the server (network, CORS, timeouts on the user side).

## Journeys and usage

- Rate of error-free sessions, critical journeys (sign-up, search, reading, purchase) with completion
  rate and drop-off points.
- Adoption of front versions (especially with a service worker or aggressive caching: some users stay
  on an old version).

## Setup

- RUM via OpenTelemetry web, or the tool in place (Grafana Faro, Sentry, Datadog RUM). Sample for cost.
- Do not send personal data in RUM events (anonymize URLs with sensitive parameters).

## Dashboards

- Web Vitals view (p75 per page and device, trend per deployment).
- Client errors view (per version, browser, page).
- Journeys view (completion and drop-off of critical journeys).
