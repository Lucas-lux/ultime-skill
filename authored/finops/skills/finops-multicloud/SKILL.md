---
name: finops-multicloud
description: >
  Vendor-neutral multi-cloud FinOps: FOCUS, unit economics, showback and chargeback, Kubernetes cost
  (OpenCost, Kubecost), anomalies. Use when the user mentions FinOps, multi-cloud costs, FOCUS, unit
  economics, showback, chargeback, Kubernetes cost, OpenCost, Kubecost, cost allocation, or optimizing
  a multi-provider cloud bill.
---

# Multi-cloud FinOps

Complements the per-provider skills of the `finops` pack (AWS, Google Cloud, Azure, Infracost) with a
normalized, cross-cloud view. Framework: FinOps Framework (inform, optimize, operate). Check the figures
against the actual billing exports, not against an estimate.

## Normalizing costs (FOCUS)

- Providers' billing exports have different schemas. **FOCUS** (FinOps Open Cost and Usage
  Specification) is a normalized format: aligning with it makes it possible to aggregate AWS, Google
  Cloud and Azure in the same model (common columns: billed cost, amortized cost, service, region,
  account, tags...).
- Ingest the FOCUS exports (or converted Cost and Usage Reports) into a warehouse (see the
  `data-engineering` pack) and build cost models by team, product and environment.
- Distinguish billed cost, amortized cost (spread commitments) and effective cost after discounts.

## Unit economics

- Relate cost to a business unit: cost per request, per active user, per order, per tenant, per 1000
  inferences. This is the metric that makes a cost increase interpretable.
- Track the unit cost trend: a bill that grows with usage is healthy, a unit cost that grows is not.
- Link to the `monitoring` pack: expose the unit cost as a metric tracked over time.

## Showback and chargeback

- **Showback**: show each team the cost it generates, without billing it back. First step toward
  accountability.
- **Chargeback**: actually bill the costs back to teams or entities.
- Both rely on reliable **allocation**: a tagging policy applied and verified (account, team, product,
  environment), and a documented rule for splitting shared costs (network, cluster, support).
- Measure the tag coverage rate: an untagged cost cannot be allocated.

## Kubernetes cost

- A shared cluster hides who consumes what. **OpenCost** (open source, CNCF standard) or **Kubecost**
  allocate cost to namespaces, workloads and labels, based on requests and actual usage (CPU, memory,
  storage, network).
- Spot over-requested resources (requests far above usage), workloads without limits, orphaned
  volumes, and rightsize (rightsizing, VPA). See also the `gke-cost-optimization` skill of the finops
  pack for GKE.
- Allocate the cluster cost to teams through labels, to feed showback.

## Cross-cutting optimization

- Commitments (reserved instances, savings plans, committed use) driven by coverage and utilization
  rate, not by guesswork.
- Idle or orphaned resources (volumes, IPs, stopped but billed instances, old snapshots).
- Rightsizing guided by actual usage metrics, not by default values.
- Storage tiering by access frequency; inter-region and inter-cloud data egress monitored, it is an
  often underestimated cost.

## Anomaly detection and culture

- Alert on cost drift (daily and per service) through the providers' anomaly detectors or in-house
  tracking on the FOCUS data.
- Budgets per team and per environment, with alerts as the threshold approaches.
- FinOps loop: visibility (inform), optimization (optimize), then continuous governance (operate), with
  a regular review shared between engineering, product and finance.

## Definition of done

- Provider costs are normalized (FOCUS) and aggregated in a common model.
- At least one business unit cost is tracked over time.
- Tag-based allocation covers most of the cost; showback in place per team.
- Kubernetes cost is allocated per namespace and team.
- Anomaly alerts and budgets are active.
