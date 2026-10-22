# Base layer: instrumentation of every project

To set before any domain layer. Vendor-neutral: instrument with OpenTelemetry, plug the backend in
afterwards.

## Metrics: RED and USE

- **RED** (services that handle requests): Rate (requests/s), Errors (failing share), Duration
  (latency distribution). One series per endpoint and per status code class (`2xx`, `4xx`, `5xx`),
  never one series per user identifier or per full URL (cardinality).
- **USE** (resources: CPU, memory, disk, network, pool, queue): Utilization, Saturation, Errors.
- Expose in Prometheus (or OTLP to a collector). Histograms for latency, to compute the p50/p95/p99
  quantiles on the backend side.

Cardinality rule: a label takes only a small bounded set of values. Forbidden as labels: user
identifier, email, full URL, request identifier. They go in traces or logs, not in metrics.

## Structured logs

- JSON format, one line per event. Stable keys: `timestamp`, `level`, `message` (or a dotted event
  name, for example `payment.declined`), `service`, `trace_id`, `span_id`.
- Correlate with traces: inject `trace_id` into every log emitted during a request.
- Levels used with discipline: `error` for what wakes someone up, `warn` for the non-blocking abnormal,
  `info` for business events, `debug` outside production.
- Never personal data, secrets or user content in clear. Mask or hash if an identifier is essential for
  debugging.

## Distributed traces

- OpenTelemetry SDK in each service, Collector on the way out. Context propagation (W3C `traceparent`)
  between services, in queue messages and jobs.
- One span per significant operation: incoming request, outgoing call (database, cache, http), expensive
  processing. Useful attributes (method, route, status, size), without personal data.
- Sampling: keep 100 % of error and slow traces, sample the rest (for example tail-based sampling at the
  Collector level) to control cost.

## SLI, SLO and error budget

1. Define the SLIs seen by the user: availability (share of successful requests), latency (share of
   requests under a threshold, for example p95 < 300 ms).
2. Set an SLO (for example 99.9 % over a rolling 30 days) and derive the error budget from it.
3. Alert on the budget burn rate (multi-window multi-burn-rate: for example short-term 5 min and
   long-term 1 h windows, burn rate thresholds 14.4x and 6x). See the `devops` skill
   (`slo-implementation`) for the exact Prometheus expressions.

## Alerts

- On symptoms (SLO burning, diverging queue, saturation), not on every cause.
- Each alert: a severity, a runbook, a route (Alertmanager to PagerDuty, incident.io, Opsgenie or Slack
  depending on the team). A non-actionable alert should be deleted.
- Test each alert at least once (real firing in staging or a test rule) to verify that it goes out and
  arrives at the right place.

## Dashboards

- **Health**: the SLOs, the four signals, the state of dependencies.
- **Resources**: CPU, memory, disk, network, pools, queues.
- **Business**: the events that matter for the product (orders, sign-ups, reads depending on the
  domain).

## Cost of observability

- Track log volume, metric cardinality and trace sampling rate: these are the three items that make the
  bill go off the rails.
- Set a retention adapted to each data type (short traces, metrics aggregated over the long term, logs
  according to legal and debugging needs).
