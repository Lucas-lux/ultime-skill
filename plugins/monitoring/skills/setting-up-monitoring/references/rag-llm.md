# RAG or LLM application (LLMOps)

A RAG or an LLM application is monitored on two planes: the application layer (it is also an API or a
web app: apply `api-service.md` or `web-app.md` and the base) and the LLMOps layer below. Everything
must be monitored: an answer that goes out fast but is wrong is an outage that classic signals do not
see.

## Trace the chain end to end

Instrument each step as a span (OpenTelemetry; OTel GenAI conventions, or an LLM tracing tool such as
MLflow Tracing, Langfuse, Phoenix, LangSmith depending on the stack):

- user request -> rewriting -> embedding -> retrieval -> re-ranking -> prompt construction -> model
  call -> post-processing and guardrails -> answer.
- For each span: duration, and for the model call the model name, the number of input/output tokens, the
  cost. Keep the trace id to link the answer to the whole chain.

## Cost and tokens

- Input and output tokens per request, per model, per feature. Derived cost (model price per token).
  Track the cost per request and the aggregated cost per day and per feature.
- Alert on a drift of the cost per request (prompt change that inflates the context, agent loop that
  spins out of control) and on a daily budget.
- Track the cache hit rate (prompt caching, semantic cache): it is the main lever for cost and latency.

## Latency per step

- End-to-end and per-step latency (retrieval, model call, re-ranking). Time to first token (TTFT) and
  token throughput (tokens/s) for a streamed answer.
- Separate the model provider's latency from the application's own latency.

## Retrieval quality (the R in RAG)

- Recall@k and precision@k on a set of reference questions with their expected passages.
- Relevance of the retrieved context (context relevance) and rate of passages actually used in the
  answer.
- Rate of "nothing found" and distribution of similarity scores: a drop signals an index, embedding or
  data problem.

## Answer quality (online and offline eval)

- **Offline**: a golden set replayed on every change of prompt, model or index. Metrics: groundedness or
  faithfulness (does the answer rely on the context), relevance, accuracy, completeness. Automatic
  judges (LLM-as-judge) calibrated against human annotations, plus deterministic metrics when they
  exist.
- **Online**: sample production exchanges and score them continuously with the same judges. Track the
  estimated hallucination rate, the refusal rate, the share of off-topic answers.
- Track drift: the distribution of real questions moves away from the golden set -> the eval is no
  longer representative, the set must be enriched.

## Guardrails and security

- Guardrail trigger rate: prompt injection detected, toxic content, leak of personal data or a secret,
  output out of schema.
- LLM-specific security surface: see the `sec-audit` skill (`securing-ai-systems`) for what to test.
  Monitor injection attempts and tool overreach (excessive agency) on the agent side.

## Feedback and product signals

- Explicit feedback (thumbs up/down, rating) and implicit feedback (rephrasing, abandonment, copying the
  answer, click on a source). Link them to the trace id to go back up the full chain of a bad feedback.
- Loop: bad feedback feeds the golden set and regression detection.

## LLMOps dashboards

- Cost view (tokens, cost per request and per feature, cache hits).
- Latency view (end to end, TTFT, per step, provider share).
- Quality view (groundedness, retrieval recall, hallucination rate, feedback).
- Guardrails view (triggers per type).
