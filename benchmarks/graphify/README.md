# graphify benchmark

Measurement, on October 21, 2026, of what graphify (a knowledge graph of a repository) brings to Claude
Code for understanding existing code: cost of building the graph, then cost, time and quality of the
answers to takeover questions, with and without the graph.

## In short

- **Building the graph of a codebase costs no tokens with the CLI** (`graphify update .`): 3 s for 66
  files, 14 s for 712, 116 s for 5,071. Through the skill, the same build costs **$0.56 to $1.48**,
  because it has subagents extract the documentation and images and the model name the communities.
- **The graphify skill as currently integrated brings nothing**: with the graph present, it did not
  trigger on its own in any of the 24 runs.
- **Querying the graph first (short instruction, without the skill) saves 16% of tokens and 7% of cost,
  but degrades the answers** (correctness 7.7 versus 8.3 out of 10): the model trusts the graph and no
  longer checks the code.
- **The hybrid variant (the graph orients, everything is checked in the code) keeps the quality of the
  baseline**, with 7% fewer tokens and 16% less time, for an almost identical cost (-1%).
- **The gain grows on the large repository** (cal.com, 5,071 files): -25% tokens and half as many turns
  with the short instruction, at equivalent average correctness but slightly lower completeness.
- **But delivered through a `CLAUDE.md` (the only way to install it in a project), this hybrid
  instruction no longer brings anything**: +5% cost for equivalent quality (condition E, at the end of the
  report).
- **Decision: graphify is removed from the library** (see the last section).

## Protocol

| Item | Value |
|---|---|
| Tools | Claude Code 2.1.289, graphifyy 0.9.90 (isolated virtual environment), Windows 11 |
| Answer model | Sonnet, fresh `claude -p` sessions, no MCP, tools Read, Grep, Glob, Bash, Skill; writing forbidden |
| Repositories | S: vercel/commerce `f7521d5` (66 code files, 4,000 lines); M: excalidraw `1d4dc2c` (712 files, 225,000 lines); L: cal.com `0f19cc4` (5,071 files, 551,000 lines) |
| Questions | 4 per repository, typical of a takeover: architecture overview, locating a feature, tracing a flow, impact analysis of a signature change (see `bench.py`); answer in at most 300 words with file paths |
| Repetitions | 2 per cell, each condition on its own copy of the repository |
| Judge | Opus, blind (answers anonymized and shuffled), checks the claims in the code and scores correctness and completeness out of 10 |

Conditions:

| Code | Condition |
|---|---|
| A | Baseline: no graph, no skill |
| B | Graph present and graphify skill loadable (current integration in the library) |
| C | Graph present, no skill, short instruction: query the graph (`graphify query`, `explain`, `path`) before reading the code |
| D | Like C, adding: the graph is used to get oriented, every path, dependency direction, signature, line and count is checked in the code before being stated |

A, B and C were judged together; A, C and D were judged together in a second pass. The baseline A,
scored twice, gives 8.29 then 8.08: **a difference of less than 0.3 points is noise**.

## Building and updating the graph

| Repository | CLI: duration | CLI: tokens | Graph | Through the skill: cost | Through the skill: duration |
|---|---|---|---|---|---|
| S | 3 s | 0 | 323 nodes, 744 edges | $0.56 | 98 s |
| M | 14 s | 0 | 8,069 nodes, 31,122 edges, 12 MB | $1.48 | 253 s |
| L | 116 s | 0 | 35,991 nodes, 106,131 edges, 47 MB | not measured | not measured |

- On repository M, the skill first stopped to ask which subfolder to analyze (68 documents and 52 images
  detected); in non-interactive mode, it had to be told to continue.
- Update after modifying one file: **the tested version re-extracts 100% of the files** on Windows
  (cache not working), so 20 s on M and 115 s on L at every update. Still without tokens, but a hook on
  every commit would be painful on a large repository.
- The communities built by the CLI remain anonymous; naming them requires the model (`graphify label`).
- The skill itself is 742 lines long (about 11,000 tokens loaded on every invocation).

## Query results

Averages per run. Tokens = input + cache (creation and read) + output.

### By condition (24 runs each)

| Condition | Cost | Tokens | Duration | Turns | Tool calls | Correctness | Completeness |
|---|---|---|---|---|---|---|---|
| A baseline | $0.121 | 173,900 | 21.0 s | 5.7 | 4.7 | 8.29 / 8.08 | 7.75 / 7.71 |
| B skill | $0.121 | 168,000 | 21.0 s | 6.0 | 5.0 | 8.25 | 7.79 |
| C graph first | $0.113 | 146,400 | 19.1 s | 4.3 | 3.3 | 7.71 / 7.75 | 7.08 / 7.00 |
| D hybrid | $0.120 | 162,400 | 17.6 s | 5.5 | 4.5 | 8.17 | 7.54 |

Two values: first judge pass / second pass.

### By repository size

| Repository | Condition | Cost | Tokens | Turns | Correctness (average of passes) | Completeness |
|---|---|---|---|---|---|---|
| S commerce | A | $0.098 | 137,900 | 4.0 | 8.63 | 8.00 |
| | C | $0.096 | 119,000 | 4.1 | 8.56 | 7.50 |
| | D | $0.113 | 146,300 | 4.9 | 9.00 | 7.63 |
| M excalidraw | A | $0.127 | 159,000 | 5.4 | 7.88 | 7.88 |
| | C | $0.123 | 150,900 | 5.0 | 6.63 | 6.56 |
| | D | $0.113 | 130,400 | 4.9 | 7.50 | 7.13 |
| L cal.com | A | $0.138 | 224,800 | 7.6 | 8.06 | 7.31 |
| | C | $0.121 | 169,300 | 3.9 | 8.00 | 7.06 |
| | D | $0.134 | 210,700 | 6.6 | 8.00 | 7.88 |

### By question type

| Question | Best condition | Note |
|---|---|---|
| Architecture | C and D (7.8 versus 7.5 to 7.7) | The only type where the graph slightly improves quality; skill B degrades it (6.5) |
| Locating | A and D (8.7) | C loses completeness (6.5 versus 8.3) |
| Tracing a flow | A and D (8.8 to 9.0) | C clearly loses (7.3 to 7.5); D reads about 20% fewer tokens than A |
| Impact of a change | B (9.0, a single pass); A, C and D between 7.3 and 8.0 | C loses completeness (6.7 to 6.8 versus 7.7 to 7.8) on the caller count |

## Why the "graph first" instruction degrades the answers

Errors noted by the judge in the C answers:
- paths inferred from node names without opening the file (an API route placed in `app/` instead of
  `pages/`);
- dependency direction reversed between two packages (the AST graph does not always distinguish who
  imports whom);
- wrong caller counts (about 70 announced for 200 actual occurrences in 56 files);
- approximate line numbers, private functions presented as public.

Variant D fixes these errors by enforcing verification, at the cost of part of the savings.

## What this benchmark does not measure

- Long sessions or agents that re-explore the same repository repeatedly (the `app-factory` case): the
  graph pays for itself over several queries, but the per-query savings measured here remain modest.
- Repositories larger than cal.com, languages other than TypeScript and JavaScript, other models
  (notably Haiku for the inventory), open questions without a length limit.
- The value of the visualization (`graph.html`) and of the `GRAPH_REPORT.md` report for a human.
- Two repetitions per cell: differences of less than 0.3 quality points or a few percent of cost are not
  significant.

## Recommendation (before verifying the integration, see the last section)

| Option | For | Against |
|---|---|---|
| Do not integrate | No risk, the baseline already answers well in 3 to 7 tool calls | Gives up a time gain on large repositories |
| **Light integration for takeover and large repositories** (proposed) | Token-free build through the CLI; hybrid instruction D in the project's `CLAUDE.md`; quality preserved, -16% time; no 11,000-token skill to load | Modest token gain (-7%); slow rebuild on a large repository as long as the cache does not work on Windows; an extra Python dependency |
| Integrate everywhere | Uniformity | Nothing to gain on small repositories; cost of the skill if it is used to build |

Proposed implementation for the light option: in `ultime-profile`, "takeover" and "large repository"
profiles (beyond a few thousand code files):
1. install `graphifyy` (pinned version) and build with `graphify update .`, without naming the
   communities;
2. add `graphify-out/` to `.gitignore`;
3. add the hybrid instruction D (two sentences) to the project's `CLAUDE.md`;
4. rebuild before a significant exploration task rather than on every commit;
5. do not enable the `graphify` pack (the skill) in these profiles.

## Cost of the benchmark

Answers $11.40, judges $10.95, builds through the skill $2.29: **$24.64** in total.

## Reproduce

```bash
python -m venv ~/graphify-bench/gvenv && ~/graphify-bench/gvenv/bin/pip install graphifyy==0.9.90
# clone the three repositories at the commits above into ~/graphify-bench/repos/<name>-G, build the graph
# (graphify update .), then copy each folder to <name>-A without graphify-out/
python bench.py run                 # conditions A, B, C (to add D: see run_one)
python judge.py                     # judges A, B, C; then: python judge.py ACD judge2
python analyze.py                   # tables and summary.json
python build_via_skill.py commerce excalidraw   # build cost through the skill (copies <name>-S)
# condition E: copy <name>-E of the repository with graph, data/claude-md-block.md appended to its CLAUDE.md
```

Data: `data/runs.csv` (metrics of the 112 runs), `data/claude-md-block.md` (block tested in E), `data/judgments.json` (scores and errors noted
by the judge), `data/builds-via-skill.json`, `data/summary.json`. The text of the answers is not versioned.

## Verification of the light integration (condition E) and decision

The light option recommended above was tested as it would be delivered: graph built by the CLI and
hybrid instruction written in the project's `CLAUDE.md` (and no longer injected into the system prompt
as in condition D), on repositories M and L, 16 runs, judged blind together with A and D.

- Worded as in D, the instruction was followed in only 1 question out of 4 from the `CLAUDE.md`
  (excalidraw already has its own `CLAUDE.md`). An imperative wording was needed ("your first step is to
  query the graph") for it to be followed in 16 cases out of 16.
- Result (averages over M and L):

| Condition | Cost | Tokens | Duration | Turns | Correctness | Completeness |
|---|---|---|---|---|---|---|
| A baseline | $0.133 | 191,900 | 22.8 s | 6.5 | 7.69 | 7.31 |
| D hybrid instruction in the system prompt | $0.123 | 170,500 | 19.1 s | 5.8 | 7.69 | 7.38 |
| E imperative instruction in `CLAUDE.md` (deliverable) | $0.139 | 200,800 | 23.0 s | 6.1 | 7.88 | 7.44 |

- Actually delivered, the integration costs a little more than the baseline (+5% cost and tokens, same
  duration) for equivalent quality: the model queries the graph **in addition to** reading the code, not
  instead of it. D's gain came from the instruction's place in the system prompt, which neither a skill
  nor a `CLAUDE.md` reproduces.

**Decision (October 21, 2026): graphify is removed from the library.** No measurable gain in real use,
and a real cost: Python dependency, 2-minute rebuild on a large repository (cache not working on
Windows), a graph that can become stale. The `graphify` pack is removed from the catalog and from the
`ultime-data` bundle, and the CLI is no longer installed by `--with-tools`. This report and its scripts
remain so the measurement can be redone if graphify evolves (working incremental cache, native
integration).

Total cost of the benchmark, condition E included: **$30.75**.
