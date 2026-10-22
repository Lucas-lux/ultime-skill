# API or backend service

Base layer (RED, USE, logs, traces, SLO) plus the following points.

## Per endpoint

- RED per logical route (`GET /users/:id`, not the URL with the id) and per status class. Latency as a
  histogram for p95/p99 per route.
- Request and response size if it varies strongly (upload, export).

## Outgoing dependencies

- For each dependency (database, cache, queue, third-party service, external http): latency, error
  rate, timeouts, and circuit breaker state if there is one. A trace links the outgoing call to the
  incoming request.
- SLO per critical dependency, and a latency budget split between dependencies.

## Infrastructure resources

- Database **connection pool**: active connections, waiting, saturation, acquisition time. It is a
  frequent cause of latency invisible on the CPU side.
- **Message queues**: depth, age of the oldest message, consumption vs production rate, messages in
  dead letter.
- **Cache**: hit ratio, evictions, latency.

## Resilience

- Rate of retries, of rate limiting (429), of rejection by the circuit breaker. Track client errors (4xx)
  separately from server errors (5xx): only 5xx errors consume the error budget in general.

## Application security

- Rate of failed authentication, denied authorization, rate limit reached. A spike is a signal of
  abuse. See the `security` skill for the review.

## Dashboards

- Endpoints view (RED per route, top slow and failing routes).
- Dependencies view (latency and errors per dependency, pools, queues, cache).
- SLO and error budget view.
