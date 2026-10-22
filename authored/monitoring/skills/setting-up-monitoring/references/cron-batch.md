# Cron or batch

A periodic job often fails silently: nobody looks until an expected piece of data is missing. Monitoring
must make a missing run as visible as an error.

## Signals

- **Dead man's switch**: the job reports its success (ping to Healthchecks.io, Cronitor, a Prometheus
  Pushgateway with a last success timestamp, or a home-made heartbeat). Alert on the **absence** of a
  signal within the expected window, not only on an emitted error.
- Duration of each run vs baseline, and drift (a batch that grows ends up overrunning its window).
- Overlap: detect that a run spills over onto the next one (lock, concurrency).
- Exit code and number of items processed (0 items processed is often an anomaly, not a success).

## Robustness

- Idempotency: the job can be replayed without side effects or duplicates. Track retries.
- For a job that writes to the production database: trace the volume written and set a guard (refusal
  if the volume falls outside an expected range) to avoid a massive destructive operation.

## Setup

- Short jobs: Prometheus Pushgateway (the job pushes its metrics before finishing) or an external cron
  monitoring service.
- Orchestrated jobs: see `data-pipeline.md` (Airflow, Dagster already expose these signals).
- Structured logs with a run identifier, retention long enough for the post-mortem.

## Alerts

- No run within the window (high priority, it is the case missed most often).
- Failure, abnormal duration, overlap, volume out of range.
