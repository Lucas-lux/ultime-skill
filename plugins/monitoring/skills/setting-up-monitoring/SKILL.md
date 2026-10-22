---
name: setting-up-monitoring
description: >
  Full monitoring adapted to the project type (web, API, RAG/LLM, data, cron, ML, mobile): metrics,
  logs, traces, SLOs, alerts, dashboards, cost; vendor-neutral (OpenTelemetry, Prometheus, Grafana). Use
  to monitor, observe, instrument, track in production, set up observability, SLOs, alerts or
  dashboards, or "monitoring", "observability", "LLMOps", "MLOps".
---

# Setting up full monitoring

Goal: a project fully observable, meaning you can answer "does it work", "is it slow", "why does it
break" and "how much does it cost" without adding instrumentation in the rush of an incident. A
composite project (example: a RAG = an application part + an LLM part) gets the base layer **and** each
domain layer that applies to it.

## Method

1. **Identify the project type or types.** Read the code and the infra, do not assume. A project can
   combine several types (an API that serves a model and reads a database, a RAG that exposes a web API).
2. **Lay down the base layer** (next section): it applies to every project that runs.
3. **Add each domain layer** through the references below, one per identified type.
4. **Define SLOs before alerts.** Alert on the symptoms seen by the user (the error budget that burns),
   not on every possible cause.
5. **Verify the instrumentation itself.** An empty dashboard or an alert that never fires is a silent
   outage: fire each alert once (in staging or through a test), confirm that the data arrives.
6. **Deliver a readable status**: what is monitored, the chosen SLOs, the alerts and their thresholds,
   the dashboards, the cost of the observability stack itself, and what remains to do.

Never put personal data in a log, a metric (labels included) or a trace. No secret, no token, no user
content in clear where it is not essential.

## Base layer (every project)

Detail and configuration examples: [references/baseline.md](references/baseline.md).

- **The four signals.** For an online service: latency, traffic, error rate, saturation (RED method on
  the request side, USE on the resource side). Expose them as metrics.
- **Structured logs** in JSON, with a level, a timestamp, a correlation identifier (trace id) and
  stable keys (no strings to parse). Never personal data.
- **Distributed traces** via OpenTelemetry: a trace id that crosses services, also propagated into the
  logs. It is the standard to set by default, whatever the backend.
- **SLI/SLO**: define what "it works" means (availability, p95/p99 latency), set a target and an error
  budget, alert on the budget burn rate (multi-window multi-burn-rate).
- **Alerts** routed (Alertmanager, PagerDuty, incident.io or equivalent) with severity, linked runbook,
  and no noise: every alert must be actionable.
- **Dashboards**: a health view (the SLOs and the four signals), a resources view, a business view.
- **Cost**: track the cost of the infra and of the observability stack (log volume, metric cardinality,
  trace sampling). Uncontrolled cardinality makes the bill explode.

## Domain layers

Apply the reference or references matching the project.

| Project type | Reference | Key signals on top of the base |
|---|---|---|
| Web application (front) | [references/web-app.md](references/web-app.md) | Core Web Vitals, JS errors, sessions, user journeys |
| API or backend service | [references/api-service.md](references/api-service.md) | RED per endpoint, dependencies, queues, connection pool |
| RAG or LLM application | [references/rag-llm.md](references/rag-llm.md) | Cost and tokens, latency per step, retrieval quality, groundedness, guardrails, feedback |
| ML training and serving | [references/ml-training-serving.md](references/ml-training-serving.md) | Data and prediction drift, feature freshness, performance decay |
| Data pipeline | [references/data-pipeline.md](references/data-pipeline.md) | Freshness, volume, schema, null rate, job success and duration, lineage |
| Cron or batch | [references/cron-batch.md](references/cron-batch.md) | Dead man's switch, duration, overlap, idempotency |
| Mobile application | [references/mobile.md](references/mobile.md) | Crash-free rate, cold start, ANR, network, version adoption |

## Choosing the stack

Vendor-neutral by default, to avoid lock-in:

- **Collection**: OpenTelemetry (SDK + Collector) for metrics, logs and traces.
- **Open source storage and visualization**: Prometheus (metrics), Loki (logs), Tempo (traces),
  Grafana (dashboards and alerts), Alertmanager (routing).
- **Managed equivalents** if the team already uses them: Datadog, Grafana Cloud, Honeycomb, New Relic,
  Elastic. Keep the instrumentation in OpenTelemetry so the backend can change without touching the
  code.

Choose what the project already uses rather than introducing one more stack. Flag it if the project has
no observability backend and propose one.

## Monitoring definition of done

- The four signals and the SLOs are visible on a health dashboard.
- Each domain layer of the project has its specific signals instrumented.
- Alerts are actionable, routed, linked to a runbook, and tested at least once.
- Logs are structured, correlated with traces, without personal data.
- The cost of the stack (cardinality, log volume, sampling) is under control and tracked.
- A document lists what is monitored, the SLOs, the alerts and what remains open.
