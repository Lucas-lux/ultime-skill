# Data pipeline

A pipeline (ingestion, transformation, loading, Airflow/Dagster/dbt orchestration) is monitored on two
axes: execution (does the job run) and the data produced (is it correct). Both are needed: a green job
that produces wrong data is the worst case.

## Job execution

- Success, failure, duration and delays per job and per task. Compare the duration to its baseline: a
  job twice as long is a signal before the failure.
- Alert on failure, but also on **not starting** (dead man's switch): a job that should have run and did
  not start.
- Overlap: a run that spills over onto the next one. Freshness of the last successful run.
- Retries and idempotency: track the number of retries; a job must be replayable without duplicates.

## Data quality

- **Freshness**: age of the most recent data per table. Alert if a table was not updated within its
  expected window.
- **Volume**: number of rows per run, compared to the baseline. A drop or a spike signals a broken source
  or a duplicate.
- **Schema**: detect a change of columns, types, nullability (data contract). Alert on a contract break
  before it propagates.
- **Values**: rate of nulls, of duplicates, expected bounds and ranges, distribution of categories,
  referential integrity. Tools: dbt tests, Great Expectations (API 1.x), Soda. See `data-engineering`
  (`data-quality-frameworks`).
- **Data contracts and SLAs**: formalize the expected freshness, completeness and schema per table, and
  measure against them.

## Lineage

- Track the dependencies between datasets (OpenLineage, dbt lineage) to trace the impact of a broken
  source and find the cause of a downstream anomaly.

## Instrumentation

- Emit execution metrics from the orchestrator (Airflow, Dagster expose metrics; otherwise push to
  Prometheus Pushgateway for short jobs).
- Structured logs per task with a run identifier, correlated with the quality metrics.

## Dashboards

- Execution view (success, duration, delays, freshness per pipeline).
- Quality view (freshness, volume, nulls, schema breaks per table).
- Lineage view for impact analysis.
