# ML model training and serving (MLOps)

Two distinct phases. Training produces a versioned model; serving exposes it. Monitor both, and the link
between them (which model, trained on which data, serves in production).

## Training

- **Experiment tracking**: parameters, metrics (loss, accuracy, F1, AUC depending on the task),
  artifacts, version of the dataset and of the code. MLflow or Weights & Biases. Every run reproducible.
- **Curves**: training and validation loss, to see over/underfitting. Alert on a divergence (NaN, loss
  going back up).
- **Training data**: size, class distribution, null rate, data leakage checked. Version the dataset
  (DVC, Delta, snapshot) and link it to the run.
- **Resources**: GPU/CPU usage, memory, duration, cost of the run. A GPU at 20 % signals a bottleneck
  on the data side.
- **Model registry**: versions, aliases (for example `champion`, `challenger`) rather than deprecated
  stages, and the promotion trail (who, when, on which metrics).

## Serving

- **Service signals** (base layer + `api-service.md`): p95/p99 inference latency, throughput, error
  rate, GPU saturation. For a served LLM (vLLM, TGI): TTFT, tokens/s, batch size, queued requests. See
  `ml-engineering` (`serving-llms-vllm`).
- **Input data drift**: compare the distribution of features in production with the training one (PSI,
  KS, population distance). Alert beyond a threshold.
- **Prediction drift**: the distribution of outputs changes even if the input looks stable.
- **Performance decay**: when the true label arrives (sometimes with a delay), recompute the business
  metric (accuracy, precision) on the recent window and alert on a drop.
- **Feature freshness**: age of each served feature (especially with a feature store). A stale feature
  gives silently wrong predictions.
- **Feedback loop**: rate of predictions corrected or rejected by the user, to trigger a retraining.

## MLOps dashboards

- Serving view (latency, throughput, errors, saturation).
- Model quality view (input drift, output drift, performance when the label is available).
- Data view (feature freshness, volume, nulls).
- Lineage view: model version in production, training dataset, promotion date.
