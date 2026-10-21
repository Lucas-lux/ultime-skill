---
name: analyze
description: Reverse engineer a codebase into the output behavioral specs with provenance
arguments:
  - name: path
    description: Path to the target (source code, bundle, binary, or installed software)
    required: true
  - name: --exclude
    description: >
      Comma-separated list of source types to exclude from analysis.
      Valid types: source, docs, sdk, community, runtime, binary, git-history, tests, visual, contracts.
      By default, all available sources are analyzed.
    required: false
    default: (none)
  - name: --container-runtime
    description: Container runtime to use for runtime observation mode
    required: false
    default: auto-detect (docker, then podman)
    values: [docker, podman]
  - name: --workspace
    description: Path to the workspace directory. Created if it does not exist.
    required: false
    default: ./analysis-workspace
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Task
  - Bash
  - Agent
  - TodoWrite
  - LSP
---

# /analyze - Reverse Engineering

Target: $ARGUMENTS

## THE APPROACH

**Analyze deeply. Output behaviorally.**

- **Analysis:** Tear apart the target through every available intelligence source. Trace every code path. Observe every runtime behavior. Read every public document.
- **Output:** Write specs using behavioral language. No source identifiers. Every claim carries provenance.

You READ `Ab2()` and trace what it does.
You WRITE "entry point parses arguments and routes to mode handler."

## EXHAUSTIVE READING (NON-NEGOTIABLE)

**Every line of code must be read. Every routine must be identified.**

- Do NOT skim code. Do NOT skip "boring" sections.
- Grep patterns are for INDEXING - they are NOT a substitute for reading.
- If you haven't read a line, you don't know what it does.
- If you haven't traced a code path, you can't document its behavior.

Agents MUST use the Read tool on every source file. Head/tail samples are not enough.

## CLI INTERFACE

```
/analyze path                              # Discover and consume everything available
/analyze path --exclude source             # Black-box analysis (skip source code)
/analyze path --exclude git-history,tests  # Skip git mining and test suite analysis
```

## EXIT CODES

| Code | Meaning |
|------|---------|
| 0 | Success. Analysis completed, all gates passed. |
| 1 | Failure. Gate failure, workspace conflict, container unavailable, etc. |
| 2 | Invalid arguments. Bad mode name, missing path, etc. |

## OUTPUT STRUCTURE

```
workspace/
├── .git/                    # Git repository (initialized by /analyze)
├── .gitignore               # Exclusions
├── workspace.json           # Workspace metadata
├── inventory.md             # Intelligence source inventory (from discovery)
│
├── public/                  # PUBLIC: From public sources only
│   ├── docs/                # Official documentation findings
│   ├── standards/           # RFC/standard mappings
│   ├── ecosystem/           # SDK analysis, test mining
│   ├── community/           # Tutorials, reviews, forums, issues
│   └── contracts/           # Machine-readable contract definitions
│
├── raw/                 # RAW: Source-derived analysis artifacts
│   ├── source/              # Source code analysis artifacts
│   │   ├── chunks/          # Bundle decomposition output
│   │   ├── analysis/        # Per-chunk analysis files
│   │   ├── functions/       # Extracted function analyses
│   │   ├── manifests/       # Bundle manifests
│   │   ├── exploration/     # Targeted-extractor output per focus area
│   │   └── decompiled/      # Decompiled binary/bytecode output
│   │
│   ├── runtime/             # Runtime observation artifacts
│   │   ├── cli/             # CLI interaction transcripts
│   │   ├── web/             # Web UI screenshots, state maps
│   │   ├── behaviors/       # Observed behaviors
│   │   ├── ux/              # UX capture (output formats, errors, prompts)
│   │   └── visual/          # Visual exploration output
│   │       ├── screenshots/ # Key screen captures
│   │       └── flows/       # UI flow sequences
│   │
│   ├── binary/              # Binary analysis artifacts
│   │   ├── survey/          # Initial triage output
│   │   └── analysis/        # Deep analysis output
│   │
│   ├── project-history/     # Git archaeology findings
│   │
│   ├── test-evidence/       # Test suite analysis output
│   │
│   ├── synthesis/           # Layer 2 synthesized findings
│   │   ├── features/        # Aggregated feature inventory
│   │   ├── architecture/    # Synthesized architecture
│   │   ├── api/             # Synthesized API surface
│   │   └── module-map.md    # All modules identified
│   │
│   ├── specs/               # Layer 3+4 raw specs (pre-sanitization)
│   │   ├── modules/         # Per-module behavioral specs (analysis organization)
│   │   ├── journeys/        # End-to-end user flows
│   │   ├── contracts/       # External interfaces
│   │   ├── protocols/       # Wire protocols
│   │   ├── ui/              # User-visible text
│   │   ├── tests/           # Test specifications
│   │   ├── test-vectors/    # Concrete input/output pairs
│   │   └── validation/      # Acceptance criteria
│   │
│   └── audit/               # Detailed per-finding audit reports from Layers 6 and 7
│
├── output/                   # Sanitized specs for the implementer
│   ├── specs/
│   │   ├── domains/         # Behavioral specs merged by domain (NOT original modules)
│   │   ├── journeys/        # Sanitized user journey specs
│   │   └── contracts/       # External contracts + behavioral integration requirements
│   ├── test-vectors/        # Output test vectors
│   ├── validation/          # Output acceptance criteria
│   ├── audit/               # Top-level PASS/FAIL summaries of Layers 6 and 7
│   └── implementation/      # Implementation output
│
└── provenance/              # AUDIT: Trail and citations
    ├── sessions/            # Subagent JSONL copies
    └── audit-log.md         # Human-readable audit log
```

## THE PIPELINE

All agents are dispatched as `greenfield:analyzer` (or `greenfield:sanitizer` for Layer 5) with role-specific prompts. Each prompt specifies the role, which skill to follow, inputs, outputs, and DOD.

```
Workspace Init              → workspace/ (git init, directory structure, workspace.json)
         ↓
Layer 1: Intelligence       → discovery-agent, then analyzer per approved source type
         ↓
Layer 2: Synthesis          → analyzer × 3 roles (parallel), then synthesizer, then mapper
         ↓
Layer 3: Deep Documentation → analyzer × 4 roles (deep-dive per module, behavior docs,
                              journeys, contracts)
         ↓
Gate 1:  Verification       → analyzer as spec-verifier (remediation loop, up to 3 attempts)
         ↓
Gate 1b: Source Completeness → analyzer × N (grep source for tools, env vars, flags, commands;
                               diff against specs; remediate gaps before proceeding)
         ↓
Layer 4: Test & Validation  → analyzer × 3 roles (test vectors, test specs, acceptance criteria)
         ↓
Gate 2:  Review             → analyzer as spec-reviewer (remediation loop, up to 3 attempts)
         ↓
Decision Point:             → Ask user: stop here with raw specs, or sanitize?
         ↓ (only if user opts in)
Layer 5: Sanitization       → sanitizer × N (one per domain group, REWRITE not copy)
         ↓
Layer 6: Second-Pass Review →  Phase 1: analyzer × 3 (semantic structural, content, completeness)
                              Phase 2: analyzer × N (deep-read auditors, 4-5 files each)
                              (remediation: sanitizer rewrites, up to 3 rounds)
         ↓
Layer 7: Fidelity Check     → analyzer × N (cross-validate raw vs output for info loss)
                              (remediation: sanitizer restores lost detail, up to 3 rounds)
```

---

## Step 0: Argument Validation

Validate all arguments before any work begins.

```bash
# Validate path exists
[ -d "$ARGUMENTS" ] || [ -f "$ARGUMENTS" ] || { echo "ERROR: Target path does not exist: $ARGUMENTS"; exit 2; }

# Validate --exclude (if provided)
# Valid values: source, docs, sdk, community, runtime, binary, git-history, tests, visual, contracts
# Reject unknown type names immediately with exit code 2

# Validate --container-runtime (if provided)
# Valid values: docker, podman
# Only relevant when runtime observation is active

# Validate --workspace
# If workspace exists and contains .git, proceed with incremental analysis
# If workspace does not exist, create fresh
```

---

## Step 1: Workspace Initialization

```bash
WORKSPACE="${WORKSPACE_ARG:-./analysis-workspace}"
```

### If `$WORKSPACE/.git` exists (incremental):

Existing workspace detected. Running incremental analysis per **incremental-analysis skill**.

```bash
cd "$WORKSPACE"

# Read workspace.json for original configuration (target path, excluded types, etc.)
# Read agent_runs to find last completed agent
# Read current_layer to know where we are in the pipeline
# Skip all completed steps
# Resume from the first incomplete step

# Log: "Resuming from Layer {N}, after {last-agent-name}"
```

### If `$WORKSPACE/.git` does NOT exist (fresh start):

Initialize the git-versioned workspace.

```bash
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"
git init

# Create full directory structure with .gitkeep files
mkdir -p public/docs public/standards public/ecosystem public/community
mkdir -p public/contracts
mkdir -p raw/source/chunks raw/source/analysis raw/source/functions raw/source/manifests raw/source/exploration
mkdir -p raw/source/decompiled
mkdir -p raw/runtime/cli raw/runtime/web raw/runtime/behaviors raw/runtime/ux-flows
mkdir -p raw/runtime/visual/screenshots raw/runtime/visual/flows
mkdir -p raw/binary/survey raw/binary/analysis
mkdir -p raw/project-history
mkdir -p raw/test-evidence
mkdir -p raw/synthesis/features raw/synthesis/architecture raw/synthesis/api
mkdir -p raw/specs/modules raw/specs/journeys raw/specs/contracts raw/specs/protocols raw/specs/ui raw/specs/tests raw/specs/test-vectors raw/specs/validation
mkdir -p output/specs/domains output/specs/journeys output/specs/contracts output/test-vectors output/validation/acceptance-criteria output/public
mkdir -p provenance/sessions

# Place .gitkeep in every leaf directory
find . -type d -empty -not -path './.git/*' -exec touch {}/.gitkeep \;

# Write workspace.json with initial values
# (version, target, excluded_types, created_at, updated_at, current_layer: 1, gates_passed: [], agent_runs: [])

# Write .gitignore (container build artifacts, large binaries, temp files, OS/editor artifacts, node_modules)

# Initial commit
git add -A
git commit -m "[init] Create analysis workspace for <target-name>"
```

---

## Step 2: Autonomous Discovery

Instead of relying on user-specified modes, Layer 1 begins with autonomous discovery of all available intelligence sources.

### 2a: Dispatch discovery agent

Dispatch `greenfield:analyzer`:
- Prompt: "Role: discovery-agent. Follow the **autonomous-discovery skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Excluded types: `<--exclude value or 'none'>`. Probe the target for all available intelligence sources: source code, documentation, SDK/package presence, community content, runtime executability, binary artifacts, git history, test suites, visual UI, and machine-readable contracts. Write an inventory to `workspace/inventory.md` listing each source type, its availability (available/unavailable/excluded), and a brief rationale."
- Commit: `[L1:discovery] Intelligence source inventory`

### 2b: Present inventory for negotiation

After the discovery agent returns, read `workspace/inventory.md` and present the inventory to the user. The user may approve the plan, exclude additional sources, or override unavailability judgments. Update `workspace/inventory.md` with the negotiated plan and commit:

```bash
git add workspace/inventory.md
git commit -m "[L1:discovery] Negotiated intelligence source plan"
```

### 2c: Pre-flight Dispatch Count

Before the fan-out begins, print a count of the agent dispatches this run will attempt, based on the approved source types in `workspace/inventory.md`. This is NOT a budget or a dollar estimate - we can't predict token usage, dollar cost, or precise wall-clock from the orchestrator side. It is a structural count so the user knows whether the run is 10 agents or 100.

Compute the count from the negotiated inventory. The bundle-splitter's chunk count is known only after it runs, so Layer 1's `source` line is the only number with a wide range; everything else is deterministic from the inventory.

```
========================================================================
Pre-flight dispatch count (Layers 1–4, before sanitization decision point):

  Layer 1 (Intelligence)
    - 1 discovery agent (already ran)
    - Per approved source type:
        source       1 bundle-splitter + 1 per chunk (count known after
                     splitting) + 1 function-analyzer (Haiku)
        docs         1 doc-researcher
        community    1 community-analyst
        sdk          1–2 agents
        runtime      4 agents (cli-explorer, web-ui-explorer,
                     behavior-observer, ux-documenter)
        binary       2 agents (surveyor + deep-analyzer)
        git-history  1 agent
        tests        1–2 agents
        visual       1 agent
        contracts    1 agent
  Layer 2 (Synthesis):       5 agents
  Layer 3 (Deep docs):       1 deep-dive per module (module count known
                             after Layer 2) + 3 cross-cutting roles
  Gate 1 + Gate 1b:          2 agents + up to 3 remediation rounds each
  Layer 4 (Validation):      3 agents
  Gate 2:                    1 agent + up to 3 remediation rounds

  If you opt in to Layers 5–7 at the decision point after Gate 2:
    Layer 5 (Sanitization):   1 sanitizer per domain group + contamination
                              judges (batched 4–5 files each)
    Layer 6 (Second-Pass):    3 semantic reviewers + deep-read auditors
                              (batched 4–5 files each)
    Layer 7 (Fidelity):       fidelity validators (batched 4–5 modules each)

  Token usage, dollar cost, and wall-clock depend on target size,
  language, source quality, and how many remediation rounds the gates
  need - the orchestrator can't predict them. If your session budget is
  tight, narrow the inventory via --exclude and/or decline Layers 5–7 at
  the decision point.
========================================================================
```

Ask the user to confirm. On `y`, proceed. On `n`, stop with exit 0 and leave the workspace in place (discovery output is preserved; user can resume with `/analyze` later).

---

## Agent Dispatch Protocol

Every agent dispatch in this pipeline uses the **Agent tool** with `subagent_type: "greenfield:analyzer"`.

### Dispatch pattern

For each role listed below:

1. **Call the Agent tool** with:
   - `subagent_type`: `"greenfield:analyzer"`
   - `prompt`: Include the **role**, which **skill** to follow, the workspace absolute path, what to read, what to produce, and where to write.
   - `description`: Short label for the task (shown in UI)
   - `model`: Override to `"haiku"` only for function-analyzer role (high-volume, simple extraction)

2. **After the agent returns**, commit its output:
   ```bash
   cd <workspace>
   git add -A
   git commit -m "<commit-message>"
   ```

3. **Parallel dispatch with batching**: When multiple agents in the same phase have no dependencies on each other, dispatch them in a single message with multiple Agent tool calls - BUT cap the batch size at **4 parallel agents**. Firing 20+ agents in a single parallel burst is a reliable way to hit the Opus rate limit mid-pipeline. Wait for each batch of 4 to complete, commit its output, then dispatch the next batch of 4. This applies to chunk-analyzers (Layer 1), deep-dive analyzers (Layer 3), contamination judges (Layer 5 verification), deep-read auditors (Layer 6 Phase 2), and fidelity batches (Layer 7). If the runtime exposes remaining-quota info, prefer a dynamic batch size; otherwise stick to 4.

### Session capture

The Agent tool returns an `agentId` for each dispatch. After the agent completes, this ID maps to a session JSONL file. To capture provenance:

```bash
# The session JSONL lives at ~/.claude/projects/<encoded-cwd>/<agentId>.jsonl
# <encoded-cwd> encodes the working directory path: / becomes -
# Example: /Users/jesse/project → -Users-jesse-project

ENCODED_CWD=$(echo "$PWD" | sed 's|/|-|g')
SESSION_JSONL=~/.claude/projects/${ENCODED_CWD}/${AGENT_ID}.jsonl

# Copy to workspace provenance directory (if the file exists)
if [ -f "$SESSION_JSONL" ]; then
  cp "$SESSION_JSONL" workspace/provenance/sessions/<agent-name>-<short-id>.jsonl
fi
```

Session capture is best-effort. If the JSONL file cannot be found, log a warning and continue.

---

## Layer 1: Intelligence Gathering

Dispatch agents for each approved source type from the negotiated inventory. Sources are independent - dispatch all approved sources in parallel where possible.

Read `workspace/inventory.md` to determine which source types are approved. For each approved source type, dispatch the corresponding agent(s) below. Skip any source type marked as excluded or unavailable.

### Source: source (Source Code Analysis)

**Step 1: bundle-splitter**

Dispatch `greenfield:analyzer`:
- Prompt: "Role: bundle-splitter. Follow the **source-analysis skill** Phases B1-B5. Target source path: `<target-path>`. Workspace: `<workspace-path>`. Read every source file. Decompose the target into logical chunks. Write chunk manifest to `workspace/raw/source/manifests/` and individual chunk files to `workspace/raw/source/chunks/`."
- Commit: `[L1:bundle-splitter] Decompose main bundle into N chunks`

**Beautification (if minified):**
```bash
cd workspace/raw/source/chunks
find . -name "*.js" -exec npx js-beautify -r {} \; 2>/dev/null || true
```

**Step 2: chunk-analyzer (parallel, one per chunk)**

For each chunk from the manifest, dispatch `greenfield:analyzer`:
- Prompt: "Role: chunk-analyzer. Follow the **source-analysis skill** Phase 6. Workspace: `<workspace-path>`. Read chunk file at `workspace/raw/source/chunks/<chunk-file>` and its corresponding source files. Write analysis to `workspace/raw/source/analysis/<chunk-name>.md`."
- Dispatch all chunk-analyzer workers in parallel (multiple Agent tool calls in one message)
- Commit: `[L1:chunk-analyzer] Analyze N chunks`

**Step 3: function-analyzer**

Dispatch `greenfield:analyzer` with `model: "haiku"`:
- Prompt: "Role: function-analyzer. Follow the **source-analysis skill** Phase 7. Workspace: `<workspace-path>`. Read all chunk analyses in `workspace/raw/source/analysis/` and the source files they reference. Extract function-level analysis. Write to `workspace/raw/source/functions/`."
- Commit: `[L1:function-analyzer] Extract function-level analysis`

### Source: docs (Official Documentation)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: doc-researcher. Follow the **doc-research skill** for the full methodology. Target: `<target-path>`. Workspace: `<workspace-path>`. Research official documentation for this project. Search the web for official docs, README, guides. Extract behavioral claims. Write findings to `workspace/public/docs/`."
- Commit: `[L1:doc-researcher] Extract behavioral claims from official docs`

### Source: community (Community Intelligence)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: community-analyst. Follow the **community-intelligence skill** for the full methodology. Target: `<target-path>`. Workspace: `<workspace-path>`. Search for tutorials, blog posts, reviews, forum threads, GitHub issues, and video content about this product. Extract behavioral observations from community sources. Write findings to `workspace/public/community/`."
- Commit: `[L1:community-analyst] Extract behavioral observations from community sources`

### Source: sdk (SDK & Ecosystem Analysis)

Dispatch these two in parallel:

**sdk-analyzer** → `greenfield:analyzer`:
- Prompt: "Role: sdk-analyzer. Follow the **ecosystem-analysis skill** for the full methodology. Target: `<target-path>`. Workspace: `<workspace-path>`. Analyze the SDK surface, package registry presence, and integration patterns. Write findings to `workspace/public/ecosystem/`."
- Commit: `[L1:sdk-analyzer] Analyze SDK surface and integration patterns`

**integration-test-miner** → `greenfield:analyzer`:
- Prompt: "Role: integration-test-miner. Follow the **ecosystem-analysis skill** for the full methodology. Target: `<target-path>`. Workspace: `<workspace-path>`. Find and analyze public test suites for behavioral claims. Write findings to `workspace/public/ecosystem/`."
- Commit: `[L1:integration-test-miner] Extract behavioral claims from public test suites`

### Source: runtime (Runtime Observation)

Requires container runtime. Uses `--container-runtime` flag or auto-detects (docker, then podman).

First, build/start the container for the target (per container-execution skill).

Then dispatch all four runtime agents in parallel:

**cli-explorer** → `greenfield:analyzer`:
- Prompt: "Role: cli-explorer. Follow the **runtime-observation skill** for the five-phase methodology, and the **container-execution skill** for container interaction. Explore the CLI interface by running commands. Exploration phases: help text discovery, subcommand enumeration, flag discovery per subcommand, flag combination testing, error message collection. Workspace: `<workspace-path>`. Container: `<container-name>`. Write transcripts to `workspace/raw/runtime/cli/`."
- Commit: `[L1:cli-explorer] CLI exploration session`

**web-ui-explorer** → `greenfield:analyzer`:
- Prompt: "Role: web-ui-explorer. Follow the **runtime-observation skill** for the five-phase methodology, and the **container-execution skill** for container interaction. Explore any web UI exposed by the target. Exploration phases: port discovery, landing page capture, navigation mapping, form/API endpoint discovery, authentication flow probing. Workspace: `<workspace-path>`. Container: `<container-name>`. Write findings to `workspace/raw/runtime/web/`."
- Commit: `[L1:web-ui-explorer] Web UI exploration session`

**behavior-observer** → `greenfield:analyzer`:
- Prompt: "Role: behavior-observer. Follow the **runtime-observation skill** for the five-phase methodology, and the **container-execution skill** for container interaction. Observe runtime behaviors through interaction and system monitoring. Exploration phases: state machine discovery, persistence probing, concurrency behavior, resource limit testing, signal handling. Workspace: `<workspace-path>`. Container: `<container-name>`. Write to `workspace/raw/runtime/behaviors/`."
- Commit: `[L1:behavior-observer] Observe runtime behaviors`

**ux-documenter** → `greenfield:analyzer`:
- Prompt: "Role: ux-documenter. Follow the **runtime-observation skill** for observation format and confidence rules, and the **container-execution skill** for container interaction. Document the actual user experience: onboarding, primary workflow journeys, error recovery paths, error message catalog, interactive flows, output formatting, timing. Write IMMEDIATELY as you go - do not accumulate. Workspace: `<workspace-path>`. Container: `<container-name>`. Write to `workspace/raw/runtime/ux-flows/`."
- Commit: `[L1:ux-documenter] Document UX patterns`

### Source: binary (Binary Analysis)

Dispatch sequentially (deep-analyzer depends on surveyor output):

**Step 1: binary-surveyor** → `greenfield:analyzer`:
- Prompt: "Role: binary-surveyor. Follow the **binary-analysis skill** Phase 1 (Survey). Target: `<target-path>`. Workspace: `<workspace-path>`. Triage the binary: identify format, sections, symbols, strings. Write survey to `workspace/raw/binary/survey/`."
- Commit: `[L1:binary-surveyor] Binary triage: format, sections, symbols, strings`

**Step 2: binary-deep-analyzer** → `greenfield:analyzer`:
- Prompt: "Role: binary-deep-analyzer. Follow the **binary-analysis skill** Phase 2 (Deep Analysis). Workspace: `<workspace-path>`. Read survey results from `workspace/raw/binary/survey/`. Perform deep analysis: control flow, data structures, behavioral patterns. Write to `workspace/raw/binary/analysis/`."
- Commit: `[L1:binary-deep-analyzer] Deep binary analysis`

### Source: git-history (Git Archaeology)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: git-archaeologist. Follow the **git-archaeology skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Mine the git history for behavioral evolution: major refactors, feature introductions, removed features, configuration changes, migration patterns, and commit message conventions. Write findings to `workspace/raw/project-history/`."
- Commit: `[L1:git-archaeologist] Mine git history for behavioral evolution`

### Source: tests (Test Suite Analysis)

Always dispatch the test-reader. Optionally dispatch the test-runner if the target has a runnable test suite.

**test-reader** → `greenfield:analyzer`:
- Prompt: "Role: test-reader. Follow the **test-suite-analysis skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Read the target's test suite exhaustively. Extract behavioral claims: what each test asserts, edge cases covered, expected error conditions, integration boundaries. Write findings to `workspace/raw/test-evidence/`."
- Commit: `[L1:test-reader] Extract behavioral claims from test suite`

**test-runner** (optional, if test suite is runnable) → `greenfield:analyzer`:
- Prompt: "Role: test-runner. Follow the **test-suite-analysis skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Run the target's test suite and capture results: passing tests confirm expected behaviors, failing tests reveal gaps or regressions, skipped tests indicate known limitations. Write results to `workspace/raw/test-evidence/`."
- Commit: `[L1:test-runner] Execute test suite and capture results`

### Source: visual (Visual Exploration)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: visual-explorer. Follow the **visual-exploration skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Capture visual state of the running application: screenshots of key screens, UI flow sequences, visual state transitions. Write screenshots to `workspace/raw/runtime/visual/screenshots/` and flow documentation to `workspace/raw/runtime/visual/flows/`."
- Commit: `[L1:visual-explorer] Capture visual UI state and flows`

### Source: contracts (Machine-Readable Contracts)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: contract-parser. Follow the **contract-detection skill**. Target: `<target-path>`. Workspace: `<workspace-path>`. Parse machine-readable contract definitions: OpenAPI/Swagger specs, JSON Schema files, Protocol Buffer definitions, GraphQL schemas, WSDL files, AsyncAPI specs. Extract behavioral constraints and interface contracts. Write findings to `workspace/public/contracts/`."
- Commit: `[L1:contract-parser] Parse machine-readable contract definitions`

### Layer 1 Gate Check (ENFORCED)

Verify each approved source type from the inventory produced output.

```bash
GATE_FAIL=0

# Read inventory.md to get list of approved source types
# For each approved source type, verify its output directory contains files

check_output() {
  local source_type="$1"
  local output_dir="$2"
  local file_count
  file_count=$(find "$output_dir" -name '*.md' -o -name '*.json' -o -name '*.js' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$file_count" -eq 0 ]; then
    echo "LAYER 1 GATE FAILED: $source_type produced 0 files in $output_dir"
    GATE_FAIL=1
  else
    echo "$source_type: $file_count files"
  fi
}

# Check each approved source against its expected output location:
# source    → workspace/raw/source/analysis/
# docs      → workspace/public/docs/
# community → workspace/public/community/
# sdk       → workspace/public/ecosystem/
# runtime   → workspace/raw/runtime/
# binary    → workspace/raw/binary/survey/
# git-history → workspace/raw/project-history/
# tests     → workspace/raw/test-evidence/
# visual    → workspace/raw/runtime/visual/
# contracts → workspace/public/contracts/

if [ "$GATE_FAIL" -eq 1 ]; then
  echo "STOP: Layer 1 gate failed. Re-dispatch failed source agents before proceeding."
  exit 1
fi
echo "LAYER 1 GATE PASSED: All approved sources produced output."
```

---

## Layer 2: Synthesis & Mapping

Combine raw intelligence from all Layer 1 modes into a unified structural understanding. If only one mode ran, synthesis operates in pass-through mode (still runs, but draws from a single source).

### Phase 2a: Parallel extraction

Dispatch all three in parallel:

**feature-discoverer** → `greenfield:analyzer`:
- Prompt: "Role: feature-discoverer. Follow the **multi-source-synthesis skill** Section 1 (Feature Discovery). Workspace: `<workspace-path>`. Read all Layer 1 output from `workspace/raw/source/`, `workspace/public/` (including `public/community/` if it exists), `workspace/raw/runtime/`, `workspace/raw/binary/` (whichever exist). Aggregate a feature inventory. Write to `workspace/raw/synthesis/features/`."
- Commit: `[L2:feature-discoverer] Aggregate feature inventory from N intelligence sources`

**architecture-analyst** → `greenfield:analyzer`:
- Prompt: "Role: architecture-analyst. Follow the **multi-source-synthesis skill** Section 2 (Architecture Reverse Engineering). Workspace: `<workspace-path>`. Read all Layer 1 output. Synthesize the architecture model. Write to `workspace/raw/synthesis/architecture/`."
- Commit: `[L2:architecture-analyst] Synthesize architecture model`

**api-extractor** → `greenfield:analyzer`:
- Prompt: "Role: api-extractor. Follow the **multi-source-synthesis skill** Section 3 (API Surface Extraction). Workspace: `<workspace-path>`. Read all Layer 1 output. Extract and synthesize the API surface. Write to `workspace/raw/synthesis/api/`."
- Commit: `[L2:api-extractor] Synthesize API surface`

### Phase 2b: Cross-mode synthesis (after 2a completes)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: analysis-synthesizer. Follow the **multi-source-synthesis skill** Section 4 (Cross-Source Synthesis). Workspace: `<workspace-path>`. Read the parallel synthesis outputs in `workspace/raw/synthesis/features/`, `workspace/raw/synthesis/architecture/`, `workspace/raw/synthesis/api/`. Merge them, resolve contradictions, produce unified findings. Update files in `workspace/raw/synthesis/`."
- Commit: `[L2:analysis-synthesizer] Cross-mode synthesis complete`

### Phase 2c: Module mapping (after 2b completes)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: module-mapper. Follow the **multi-source-synthesis skill** Section 5 (Module Mapping). Workspace: `<workspace-path>`. Read the unified synthesis in `workspace/raw/synthesis/`. Identify all modules and their boundaries. Write `workspace/raw/synthesis/module-map.md`. NOTE: The module map is an analysis organizational artifact for ensuring exhaustive analysis coverage. It belongs to the analysis workspace and does not appear in the output."
- Commit: `[L2:module-mapper] Identify N modules for deep documentation`

### Layer 2 Gate Check (ENFORCED)

```bash
GATE_FAIL=0

# Feature inventory exists
feat_count=$(ls workspace/raw/synthesis/features/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$feat_count" -eq 0 ]; then
  echo "LAYER 2 GATE FAILED: No feature inventory files produced."
  GATE_FAIL=1
fi

# Architecture model exists
arch_count=$(ls workspace/raw/synthesis/architecture/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$arch_count" -eq 0 ]; then
  echo "LAYER 2 GATE FAILED: No architecture model files produced."
  GATE_FAIL=1
fi

# Module map exists with modules identified
if [ ! -f "workspace/raw/synthesis/module-map.md" ]; then
  echo "LAYER 2 GATE FAILED: module-map.md does not exist."
  GATE_FAIL=1
else
  module_count=$(grep -c "^### " workspace/raw/synthesis/module-map.md 2>/dev/null || echo 0)
  if [ "$module_count" -eq 0 ]; then
    echo "LAYER 2 GATE FAILED: module-map.md contains no module definitions."
    GATE_FAIL=1
  fi
  echo "Module map: $module_count modules identified"
fi

if [ "$GATE_FAIL" -eq 1 ]; then
  echo "STOP: Layer 2 gate failed. Re-dispatch synthesis agents before proceeding."
  exit 1
fi
echo "LAYER 2 GATE PASSED: Feature inventory, architecture model, and module map verified."
```

---

## Layer 3: Deep Documentation (THE CORE WORK)

### Phase 3a: Deep dive per module

**For EVERY module (P0, P1, P2, P3 -- ALL of them), spawn deep-dive-analyzer:**

ANALYZE ALL MODULES - not just P0! Priority determines implementation order, NOT what to analyze.

Read the module map at `workspace/raw/synthesis/module-map.md` to get the list of modules.

For each module, dispatch `greenfield:analyzer`:
- Prompt: "Role: deep-dive-analyzer. Follow the **behavioral-spec-writing skill** "Per-Module Behavioral Specification" section for the spec template, SPEC ID format, requirement levels, State Box, and uncertainty categories. Workspace: `<workspace-path>`. Module: `<module-name>`. Read all relevant Layer 1 and Layer 2 analysis from `workspace/raw/`. Write a complete behavioral specification to `workspace/raw/specs/modules/<module-slug>.md`. Read every relevant source file exhaustively - do NOT skim."
- Dispatch P0 modules in parallel, then P1, then P2/P3
- Commit after each batch: `[L3:deep-dive-analyzer] <module-name> module spec`

Each agent:
1. READS the code in excruciating detail
2. Traces every decision tree
3. Documents every state machine
4. Covers every error condition
5. WRITES using behavioral language (no source identifiers)
6. Annotates every claim with provenance citations

**Output translation:**
- `Ab2()` -> "application entry point"
- `r0.jobId` -> "session identifier (UUID v4)"
- `Fx3 class` -> "record parsing module"

### Phase 3b: Behavioral documentation

Dispatch `greenfield:analyzer`:
- Prompt: "Role: behavior-documenter. Follow the **behavioral-spec-writing skill** "Behavior Documentation" section. Workspace: `<workspace-path>`. Read all module specs in `workspace/raw/specs/modules/` and Layer 1 output. Synthesize user-visible behaviors organized by behavioral domain. Write to `workspace/raw/specs/behavioral-docs/`."
- Commit: `[L3:behavior-documenter] Document user-visible behaviors`

### Phase 3c: User journeys

Dispatch `greenfield:analyzer`:
- Prompt: "Role: user-journey-analyzer. Follow the **behavioral-spec-writing skill** "User Journey Analysis" section. Workspace: `<workspace-path>`. Read module specs in `workspace/raw/specs/modules/` and all Layer 1 output. Document end-to-end user flows. Write to `workspace/raw/specs/journeys/`."
- Commit: `[L3:user-journey-analyzer] Document N end-to-end user flows`

Documents end-to-end flows relevant to the target. Typical categories include:
- First-run / setup experience
- Primary happy-path workflow
- Error recovery from common failure modes
- Configuration changes and their effects
- Batch or non-interactive invocation paths
- Resume or retry of an interrupted operation

Pick the journey categories that actually apply to the target; not every target has every category.

### Phase 3d: External interfaces

Dispatch `greenfield:analyzer`:
- Prompt: "Role: contract-extractor. Follow the **behavioral-spec-writing skill** "Contract Extraction" section for external contract format, BIR table format, external system contract templates, and analysis/implementation boundary rules. Workspace: `<workspace-path>`. Read module specs in `workspace/raw/specs/modules/` and all Layer 1 output. Extract all external interfaces (CLI, env vars, config) and wire protocols (API, gRPC, LSP). **Also identify external systems the target depends on but does not own** - shared databases, third-party APIs, external CLI tools, imposed file formats. For each, produce a dedicated external system contract using the templates in the skill (database.md, api-{service}.md, cli-{tool}.md, format-{name}.md). The test: can the reimplementor redesign this interface? If NO, it needs an external system contract. Extract inter-module integration contracts (analysis internal only - stays in raw/). Extract behavioral integration requirements (BIR table - flows through to output/). Write contracts to `workspace/raw/specs/contracts/` and protocols to `workspace/raw/specs/protocols/`."
- Commit: `[L3:contract-extractor] Extract external interfaces, wire protocols, external system contracts, and behavioral integration requirements`

Documents:
- CLI commands, flags, arguments -> `workspace/raw/specs/contracts/cli.md`
- Environment variables -> `workspace/raw/specs/contracts/environment.md`
- Config file formats -> `workspace/raw/specs/contracts/configuration.md`
- Wire protocols (API, gRPC, LSP) -> `workspace/raw/specs/protocols/`
- External database schemas -> `workspace/raw/specs/contracts/database.md`
- External API contracts -> `workspace/raw/specs/contracts/api-{service}.md`
- External CLI tool contracts -> `workspace/raw/specs/contracts/cli-{tool}.md`
- External file format contracts -> `workspace/raw/specs/contracts/format-{name}.md`

### Layer 3 Gate Check (ENFORCED)

```bash
GATE_FAIL=0

# ALL modules must have specs - not just P0!
total_modules=$(grep -cP "^### " workspace/raw/synthesis/module-map.md)
spec_count=$(ls workspace/raw/specs/modules/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Modules in map: $total_modules"
echo "Specs written: $spec_count"
if [ "$spec_count" -lt "$total_modules" ]; then
  echo "LAYER 3 GATE FAILED: Missing specs for $(($total_modules - $spec_count)) modules."
  GATE_FAIL=1
fi

# Journeys must exist
journey_count=$(ls workspace/raw/specs/journeys/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$journey_count" -eq 0 ]; then
  echo "LAYER 3 GATE FAILED: No user journey specs produced."
  GATE_FAIL=1
fi
echo "Journeys: $journey_count files"

# Contracts must exist
contract_count=$(ls workspace/raw/specs/contracts/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$contract_count" -eq 0 ]; then
  echo "LAYER 3 GATE FAILED: No contract specs produced."
  GATE_FAIL=1
fi
echo "Contracts: $contract_count files"

if [ "$GATE_FAIL" -eq 1 ]; then
  echo "STOP: Layer 3 gate failed. Re-dispatch failed agents before proceeding to Gate 1."
  exit 1
fi
echo "LAYER 3 GATE PASSED: All module specs, journeys, and contracts verified."
```

**DO NOT proceed to Gate 1 until ALL modules have specs, journeys exist, and contracts exist.**

---

## Gate 1: Verification (QUALITY GATE)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: spec-verifier (Gate 1). Follow the **validation-methodology skill** for gate criteria and confidence thresholds. Process: (1) Extract all verifiable claims from every spec, grouped by topic. (2) Detect contradictions between specs. (3) Spot-check crypto, constants, field names against source code. (4) Gap analysis - could someone reimplement from these specs alone? (5) Research-derived checks #8-14. (6) Provenance verification - citation coverage per module. (7) Confidence distribution - thresholds per module. Workspace: `<workspace-path>`. Read all specs in `workspace/raw/specs/` and cross-check against source artifacts in `workspace/raw/source/`. Write verification report to `workspace/raw/specs/verification-report.md`. All 14 pass criteria must be evaluated."
- Commit: `[gate:spec-verifier] Verification report - PASS|FAIL`

The verifier:
1. Extracts all factual claims from every module spec
2. Cross-checks claims between specs for contradictions (e.g., one spec says "MD5", another says "SHA-256")
3. Spot-checks key claims against the actual source code (crypto operations, constants, field names)
4. Identifies gaps that would block reimplementation (missing test vectors, undocumented schemas, etc.)
5. **Provenance verification:** checks that every behavioral claim has a provenance citation, validates citation coverage percentage

### Gate Check

```bash
[ -f "workspace/raw/specs/verification-report.md" ] || { echo "BLOCKED: No verification report"; exit 1; }
grep -q "Status: PASS" workspace/raw/specs/verification-report.md || { echo "BLOCKED: Verification failed"; }
```

### Remediation Loop (up to 3 attempts)

```
attempt=0
max_attempts=3

while [ $attempt -lt $max_attempts ]; do
  # Run spec-verifier
  # If PASS: tag and proceed
  if grep -q "Status: PASS" workspace/raw/specs/verification-report.md; then
    git tag -a gate-1-pass -m "Gate 1 passed: spec-verifier"
    break
  fi

  # If FAIL: remediate
  attempt=$((attempt + 1))
  echo "Gate 1 failed (attempt $attempt/$max_attempts). Remediating..."

  # 1. Read the verification report
  # 2. Fix each affected spec (the report specifies which file, section, and correction)
  # 3. Re-run spec-verifier

  if [ $attempt -ge $max_attempts ]; then
    echo "FATAL: Gate 1 failed after $max_attempts remediation attempts"
    exit 1
  fi
done
```

**DO NOT proceed to Gate 1b until Gate 1 passes.**

---

## Gate 1b: Source-to-Spec Completeness

After Gate 1 confirms the specs are internally consistent, Gate 1b checks that the specs actually captured everything from the source. This catches tools, env vars, CLI flags, subcommands, dispatched events, and config keys that exist in the source but were never written into any spec.

Follow the **source-completeness skill** for the full methodology.

### Dispatch

Dispatch `greenfield:analyzer`:
- Prompt: "Role: source-completeness-checker. Follow the **source-completeness skill**. Workspace: `<workspace-path>`. Run all 7 checks (tools, env vars, CLI flags, subcommands, dispatched events, config keys, error categories) by grepping the source at `<target-path>` and diffing against the specs in `workspace/raw/specs/`. Write report to `workspace/raw/audit/source-to-spec-completeness.md`."
- Commit: `[gate-1b:source-completeness] Source-to-spec completeness check - PASS|FAIL`

### Gate Check

```bash
[ -f "workspace/raw/audit/source-to-spec-completeness.md" ] || { echo "BLOCKED: No completeness report"; exit 1; }
grep -q "Verdict: PASS" workspace/raw/audit/source-to-spec-completeness.md || { echo "BLOCKED: Source completeness FAIL"; }
```

### Remediation

If P0 gaps are found (missing user-facing tools, env vars, or CLI flags):
1. Dispatch deep-dive agents to write specs for the missing surfaces
2. Re-run the completeness check
3. Maximum 3 remediation rounds

```bash
git tag -a source-completeness-pass -m "Gate 1b: Source-to-spec completeness validated"
```

**DO NOT proceed to Layer 4 until Gate 1b passes.**

---

## Layer 4: Test & Validation

### Test vectors (MANDATORY)

**This phase is NOT optional.** Without test vectors, an implementor cannot verify compatibility.

Dispatch `greenfield:analyzer`:
- Prompt: "Role: test-vector-generator. Follow the **validation-methodology skill** for quality criteria and DOD. Workspace: `<workspace-path>`. Read all specs in `workspace/raw/specs/modules/`, `workspace/raw/specs/contracts/`, `workspace/raw/specs/protocols/`. Generate concrete test vectors: CLI invocations with expected outputs, protocol request/response pairs, error conditions, state transition sequences, cryptographic known-answer-tests (if crypto involved). Write to `workspace/raw/specs/test-vectors/`. All vectors must have concrete input/output pairs and provenance citations."
- Commit: `[L4:test-vector-generator] Generate N test vectors`

### Test specifications

Dispatch `greenfield:analyzer`:
- Prompt: "Role: test-generator. Follow the **validation-methodology skill** for quality criteria and DOD. Workspace: `<workspace-path>`. Read all specs in `workspace/raw/specs/` and test vectors in `workspace/raw/specs/test-vectors/`. Generate black-box test specifications in Given/When/Then format with reference test implementations. Write to `workspace/raw/specs/tests/`. Test inputs and outputs only - no internal state testing."
- Commit: `[L4:test-generator] Generate test specifications`

### Acceptance criteria

Dispatch `greenfield:analyzer`:
- Prompt: "Role: acceptance-criteria-writer. Follow the **validation-methodology skill** for AC format (Given/When/Then), ID format (AC-{MODULE}-{NNN}), priority levels (P0-P2), and verification methods. Workspace: `<workspace-path>`. Read all specs in `workspace/raw/specs/modules/` and test vectors in `workspace/raw/specs/test-vectors/`. Write formal acceptance criteria. Write to `workspace/raw/specs/validation/acceptance-criteria/`."
- Commit: `[L4:acceptance-criteria-writer] Write acceptance criteria for N modules`

### Layer 4 Gate Check (ENFORCED)

```bash
GATE_FAIL=0

# Must have test vector files
tv_count=$(ls workspace/raw/specs/test-vectors/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$tv_count" -eq 0 ]; then
  echo "LAYER 4 GATE FAILED: No test vector files produced."
  GATE_FAIL=1
fi
echo "Test vectors: $tv_count files"

# Must have test specs
test_count=$(ls workspace/raw/specs/tests/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$test_count" -eq 0 ]; then
  echo "LAYER 4 GATE FAILED: No test specification files produced."
  GATE_FAIL=1
fi
echo "Test specs: $test_count files"

# Must have acceptance criteria
ac_count=$(find workspace/raw/specs/validation/ -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
if [ "$ac_count" -eq 0 ]; then
  echo "LAYER 4 GATE FAILED: No acceptance criteria files produced."
  GATE_FAIL=1
fi
echo "Acceptance criteria: $ac_count files"

# Test vectors must contain concrete input/output pairs
if [ "$tv_count" -gt 0 ]; then
  pair_count=$(grep -c "Input\|Expected" workspace/raw/specs/test-vectors/*.md 2>/dev/null || echo 0)
  if [ "$pair_count" -eq 0 ]; then
    echo "LAYER 4 GATE FAILED: Test vectors contain no concrete input/output pairs."
    GATE_FAIL=1
  fi
  echo "Input/output pairs: $pair_count"
fi

if [ "$GATE_FAIL" -eq 1 ]; then
  echo "STOP: Layer 4 gate failed. Re-dispatch test/validation agents before proceeding to Gate 2."
  exit 1
fi
echo "LAYER 4 GATE PASSED: Test vectors, test specs, and acceptance criteria verified."
```

**DO NOT proceed to Gate 2 until test vectors and acceptance criteria exist.**

---

## Gate 2: Spec Review (QUALITY GATE)

Dispatch `greenfield:analyzer`:
- Prompt: "Role: spec-reviewer (Gate 2). Follow the **validation-methodology skill** for Gate 2 criteria and DOD. Process: (1) Check for implementation leakage - flag specific algorithms, data structures, design patterns by name, code structure descriptions. (2) Check inter-spec contradictions. (3) Check completeness - every component has docs, every behavior has tests. (4) Check clarity - flag 'usually', 'typically', 'generally'. (5) Check acceptance criteria - every module has ACs, valid format, P0 ACs have test vectors. (6) Check provenance in validation artifacts. (7) Check contamination in validation artifacts. Workspace: `<workspace-path>`. Read all specs in `workspace/raw/specs/`. Write review report to `workspace/raw/specs/review-notes.md`. Review specs ONLY - do NOT read source code. NEVER use WebSearch or WebFetch."
- Commit: `[gate:spec-reviewer] Review report - PASS|FAIL`

The reviewer checks:
1. Implementation leakage (no source code references)
2. **Contradictions between specs** (different claims about the same topic)
3. Completeness (every component has docs, every behavior has tests)
4. Clarity (no ambiguous language)
5. Acceptance criteria coverage (every module has acceptance criteria)

### Remediation Loop (up to 3 attempts)

```
attempt=0
max_attempts=3

while [ $attempt -lt $max_attempts ]; do
  # Run spec-reviewer
  # If PASS: tag and proceed
  if grep -q "Status: PASS" workspace/raw/specs/review-notes.md; then
    git tag -a gate-2-pass -m "Gate 2 passed: spec-reviewer"
    break
  fi

  # If FAIL: remediate
  attempt=$((attempt + 1))
  echo "Gate 2 failed (attempt $attempt/$max_attempts). Remediating..."

  # 1. Read the review notes
  # 2. Fix each flagged issue
  # 3. Re-run spec-reviewer

  if [ $attempt -ge $max_attempts ]; then
    echo "FATAL: Gate 2 failed after $max_attempts remediation attempts"
    exit 1
  fi
done
```

**DO NOT proceed past Gate 2 until it passes.**

---

## Decision Point: Stop Here or Sanitize?

Layers 1–4 are complete. Gate 2 has signed off. The workspace now contains:

- Per-module behavioral specs with source provenance citations (`workspace/raw/specs/modules/`)
- User journey specs with cross-refs (`workspace/raw/specs/journeys/`)
- External and wire-protocol contracts (`workspace/raw/specs/contracts/`, `protocols/`)
- Test vectors and acceptance criteria (`workspace/raw/specs/test-vectors/`, `validation/`)
- Source-completeness verified (Gate 1b) and quality reviewed (Gate 2)

**This is already the most useful artifact for most users.** Every behavioral claim carries a `<!-- cite: source/file:L42-L58 -->` pointer back to the source. You can grep for any identifier and find where it lives.

**Layers 5–7 exist for a narrower purpose: producing specs an implementor can use without seeing the source.** They strip every source identifier, internal name, and provenance citation from the specs, rewriting them from understanding so an implementor with zero source access can rebuild the product. Typical reasons to run them:

1. The implementor cannot legally see the source (e.g., clean-room legal separation, external audit, compliance).
2. You want to rewrite from scratch with zero code-bias from the original.
3. You're handing the spec to a third party who must not learn your internals.

**Costs of running Layers 5–7:**

- Additional agent dispatches and wall-clock time.
- Output is smaller (provenance citations and internal examples are removed).
- Citation traceability is lost in `workspace/output/` - you lose the ability to grep-to-source.
- Every round of sanitization must be second-pass-reviewed (Layer 6) and fidelity-validated (Layer 7), so contamination disputes add more rounds.

### Ask the user

```
echo ""
echo "========================================================================"
echo "Layers 1–4 complete. Raw specs with full provenance are at:"
echo "  $WORKSPACE/raw/specs/"
echo ""
echo "You can stop here and use those directly, or continue to Layers 5–7 to"
echo "produce sanitized specs (implementation details stripped, provenance"
echo "removed)."
echo ""
echo "Run Layers 5–7 (sanitization + second-pass review + fidelity)?"
echo "  [y]   yes, produce sanitized specs in $WORKSPACE/output/"
echo "  [n]   no, stop here with raw specs (default)"
echo "  [?]   explain what sanitization does and when I need it"
echo "========================================================================"
```

Use the **AskUserQuestion** tool to present this choice. Include a third option for explanation if the user is unsure.

**If the user chooses `n` (default):**

```bash
git tag -a analysis-complete-raw -m "Analysis complete: raw specs with provenance (Layers 5-7 skipped by user)"
```

Skip directly to **Print Summary**. Exit 0.

**If the user chooses `y`:**

Proceed to Layer 5. Every subsequent layer runs.

**If the user chooses `?`:**

Print a longer explanation:

```
Sanitization (Layer 5) rewrites every raw spec from behavioral understanding,
producing specs that contain no source identifiers. Second-pass review (Layer 6)
then reviews the rewritten specs for residual contamination. Fidelity validation
(Layer 7) confirms no behavioral detail was lost in the rewrite.

You need this if your implementor cannot see the source (clean-room separation,
legal/compliance requirement, third-party handoff).

You do NOT need this if you have legitimate access to the source and want
comprehensive behavioral documentation - the raw specs are strictly more
informative, because they include provenance citations.

Re-ask the question.
```

Then re-invoke the AskUserQuestion with `[y]` / `[n]`.

---

## Layer 5: Sanitization

The sanitization is the most critical step in the pipeline. It MUST produce specs that contain zero source code identifiers. The sanitizer works by READING raw specs and REWRITING them from understanding - NOT by copying and cleaning.

Because specs are large, dispatch one `greenfield:sanitizer` per domain group (4-5 raw module specs → 1 output domain spec). This keeps each agent's context manageable.

For each domain group, dispatch `greenfield:sanitizer`:
- Prompt: "Workspace: `<workspace-path>`. Follow the **spec-sanitization skill**, especially the Rewrite Rule and the External System Exception. Read these raw specs: [list of raw module spec paths]. Understand the behaviors they describe. Then WRITE a fresh output domain spec to `workspace/output/specs/domains/<domain-name>.md`. Do NOT copy text from raw specs - rewrite every sentence from your understanding. The output specs must contain ONLY: behavioral descriptions, user-facing identifiers (env vars, CLI flags, config keys, API fields, protocol constants), and numeric constants. No function names, no variable names, no minified identifiers, no internal feature flags, no telemetry event names, no source paths, no provenance citations. **Exception:** External system contracts (database schemas, third-party API fields, external CLI tool flags, imposed file formats) document systems the app does not own - preserve their details as behavioral constraints. The test: could someone read this spec with zero access to the source code and understand every word?"
- Commit: `[L5:spec-sanitizer] Rewrite <domain-name> domain spec to output/`

Similarly dispatch sanitizers for:
- External contracts (cli, environment, configuration, behavioral-integration) → `output/specs/contracts/`
- **External system contracts** (database, api-{service}, cli-{tool}, format-{name}) → `output/specs/contracts/` - these document systems the app doesn't own. **Pass through with details intact** (table names, column names, API fields, etc. are behavioral constraints, not contamination). Apply the spec-sanitization skill's External System Exception.
- Protocol specs (rest-api, plugin-protocol, session-format, ipc-messaging) → `output/specs/contracts/`
- Journey specs → `output/specs/journeys/`
- Test vectors → `output/test-vectors/`
- Acceptance criteria → `output/validation/acceptance-criteria/`
- Public artifacts → `output/public/` (copy as-is, these are already clean of source content)

Do NOT copy `inter-module.md` or `module-map.md` to output/.

Write sanitization report to `workspace/output/sanitization-report.md` - this report lives in output/ so the implementer reads it. Include ONLY: file inventory, domain descriptions, and implementation guidance. No source module names, raw paths, or descriptions of what was sanitized.

### Contamination Check (ENFORCED)

After all sanitizers complete, run LLM judge verification. Batch the output specs files into groups of 4-5 and dispatch one `greenfield:analyzer` per batch as a contamination-judge.

For each batch, dispatch `greenfield:analyzer`:
- Prompt: "Role: contamination-judge (Layer 5 verification). Follow the **spec-sanitization skill**, specifically the reimplementor test. Workspace: `<workspace-path>`. Read these output specs end-to-end: [list of 4-5 files from `workspace/output/specs/`]. For every identifier, name, path, or reference in each file, apply the reimplementor test: would someone with zero access to the source code understand this term? External contract files (database.md, api-*.md, cli-*.md, format-*.md) document systems the app doesn't own - their contents are behavioral constraints, not contamination. Produce a structured verdict for each file: PASS or FAIL with specific findings. Write verdicts to `workspace/raw/audit/contamination-judge-batch-N.md`."
- Dispatch all batches in parallel
- Commit: `[L5:contamination-judge] Contamination verification batch N`

```bash
# Check all judge verdicts
FAIL=0
for verdict in workspace/raw/audit/contamination-judge-batch-*.md; do
  if grep -qi "FAIL" "$verdict" 2>/dev/null; then
    echo "LAYER 5 CONTAMINATION CHECK: FAIL in $verdict"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "LAYER 5 CONTAMINATION CHECK FAILED."
  echo "Re-dispatching sanitizers for affected files..."
  # Re-sanitize files that received FAIL verdicts, then re-run judges
  exit 1
else
  echo "LAYER 5 PASSED: All contamination judges returned PASS."
fi
```

Tag sanitization complete:
```bash
git tag -a specs-ready -m "Layer 5: All raw specs sanitized to output/"
```

---

## Layer 6: Second-Pass Review

**DO NOT proceed to implementation until Layer 6 passes.**

Layer 6 is an independent review of `workspace/output/`. Three parallel agents audit the sanitized output for structural leakage, content contamination, and behavioral completeness. They read ONLY from `workspace/output/` - never from `workspace/raw/` or source code.

### Phase 1: Semantic Review (3 parallel specialist agents)

Dispatch all three in parallel:

**structural-leakage-reviewer** → `greenfield:analyzer`:
- Prompt: "Role: structural-leakage-reviewer (Layer 6 Audit). Follow the **second-pass-review skill** structural-leakage-reviewer section. Workspace: `<workspace-path>`. Read ONLY from `workspace/output/specs/`. Apply LLM-based semantic review for all 8 structural leakage categories (SL-1 through SL-8): module names in headers, Part N: headers, module counts, cross-module sections, module IDs, interface consumption tables, domain-to-module mappings, raw paths. For each finding, apply contextual judgment - would an implementor encounter this structure without seeing the source? Write detailed report to `workspace/raw/audit/structural-leakage.md`. Write summary (PASS/FAIL only, no remediation details, no file names, no examples of what was found) to `workspace/output/audit/structural-summary.md`. Do NOT read `workspace/raw/` for any reason."
- Commit: `[L6:structural-leakage-reviewer] Structural audit - PASS|FAIL`

**content-contamination-reviewer** → `greenfield:analyzer`:
- Prompt: "Role: content-contamination-reviewer (Layer 6 Audit). Follow the **second-pass-review skill** content-contamination-reviewer section. Workspace: `<workspace-path>`. Read ONLY from `workspace/output/specs/`. Apply LLM-based semantic review for all 12 content contamination categories (CC-1 through CC-12): minified IDs, line numbers, source paths, internal function/class names, code structure language, IPC channels, store properties, feature flags, CSS classes, DB schemas, internal filenames, state selectors. Apply false positive guidance from the skill - use contextual judgment rather than pattern matching alone. Write detailed report to `workspace/raw/audit/content-contamination.md`. Write summary (PASS/FAIL only, no remediation details, no file names, no examples of what was found) to `workspace/output/audit/content-summary.md`. Do NOT read `workspace/raw/` for any reason."
- Commit: `[L6:content-contamination-reviewer] Content audit - PASS|FAIL`

**behavioral-completeness-reviewer** → `greenfield:analyzer`:
- Prompt: "Role: behavioral-completeness-reviewer (Layer 6 Audit). Follow the **second-pass-review skill** behavioral-completeness-reviewer section. Workspace: `<workspace-path>`. Read ONLY from `workspace/output/specs/`, `workspace/output/test-vectors/`, `workspace/output/validation/`. Apply LLM-based semantic review for all 9 completeness categories (BC-1 through BC-9): SPEC ID coverage, state machines, error conditions, edge cases, decision trees, AC-to-SPEC linkage, test vector coverage, constant preservation, requirement levels. Write detailed report to `workspace/raw/audit/behavioral-completeness.md`. Write summary (PASS/FAIL only) to `workspace/output/audit/completeness-summary.md`. Do NOT read `workspace/raw/` for any reason."
- Commit: `[L6:behavioral-completeness-reviewer] Completeness audit - PASS|FAIL`

### Phase 2: Deep-Read Audit

After Phase 1 completes (regardless of PASS/FAIL), dispatch deep-read auditors. These agents READ every file end-to-end and apply contextual judgment using the principle from the **second-pass-review skill**: "Would an implementor encounter this exact string without seeing the source code?"

Batch the output specs files into groups of 4-5 and dispatch one `greenfield:analyzer` per batch:

**deep-read-auditor** (one per batch) → `greenfield:analyzer`:
- Prompt: "Role: deep-read auditor (Layer 6, Phase 2). Follow the **second-pass-review skill** Deep Contextual Audit Protocol. Workspace: `<workspace-path>`. Read these files END TO END: `workspace/output/specs/domains/<file1>.md`, `workspace/output/specs/domains/<file2>.md`, ... For every identifier, name, or reference, apply the test: would an implementor encounter this exact string without seeing the source code? If not, it is contamination. Write findings to `workspace/raw/audit/deep-read-batch-N.md`. Do NOT read `workspace/raw/`."
- Dispatch all batches in parallel
- Commit: `[L6:deep-read-auditor] Deep-read audit batch N - PASS|FAIL`

Also dispatch deep-read auditors for journeys, contracts, test vectors, and acceptance criteria (batch similarly).

### Phase 2 Gate Check

If any deep-read auditor reports FAIL, the entire Layer 6 audit is FAIL - even if all Phase 1 semantic reviews passed.

### Audit Gate Check

```bash
# All three audit summaries must exist and show PASS
mkdir -p workspace/output/audit/

for report in structural-summary content-summary completeness-summary; do
  [ -f "workspace/output/audit/${report}.md" ] || { echo "BLOCKED: Missing audit report: ${report}"; exit 1; }
  grep -qi "FAIL" "workspace/output/audit/${report}.md" && { echo "BLOCKED: Audit FAIL in ${report}"; }
done
```

### Remediation Loop (up to 3 attempts)

```
attempt=0
max_attempts=3

while [ $attempt -lt $max_attempts ]; do
  # Check if all three audits passed
  all_pass=true
  for report in structural-summary content-summary completeness-summary; do
    if grep -qi "FAIL" "workspace/output/audit/${report}.md" 2>/dev/null; then
      all_pass=false
      break
    fi
  done

  if $all_pass; then
    git add -A
    git commit -m "[L6:audit] All second-pass reviews PASS"
    git tag -an review-complete -m "Layer 6: Independent audit passed (semantic review + deep-read)"
    break
  fi

  # Remediate
  attempt=$((attempt + 1))
  echo "Audit failed (attempt $attempt/$max_attempts). Remediating..."

  # 1. Read detailed reports from workspace/raw/audit/
  # 2. Re-sanitize affected files using greenfield:sanitizer
  #    with targeted prompts referencing specific failed categories
  # 3. Re-run all three audit agents

  if [ $attempt -ge $max_attempts ]; then
    echo "FATAL: Independent audit failed after $max_attempts remediation attempts"
    exit 1
  fi
done
```

**DO NOT proceed to Layer 7 until Layer 6 passes.**

---

## Layer 7: Fidelity Validation

After Layer 6 confirms the output specs are free of contamination, Layer 7 checks the other direction: did sanitization lose any behavioral detail?

### Dispatch: Fidelity Cross-Validators

Batch the 22 raw module specs into groups of 4-5. For each batch, dispatch `greenfield:analyzer`:
- Prompt: "Role: fidelity-validator. Follow the **fidelity-validation skill**. Workspace: `<workspace-path>`. Read these raw specs: [list]. Read the corresponding output domain spec: [list]. For each behavioral claim in the raw specs (numeric constants, error conditions, decision branches, state transitions, features), verify it appears in the output spec with equal precision. Write findings to `workspace/raw/audit/fidelity-batch-N.md` using Status: MATCH | WEAKENED | MISSING | CHANGED."
- Dispatch all batches in parallel
- Commit: `[L7:fidelity-validator] Fidelity check batch N`

### Fidelity Gate Check

```bash
# Check for P0 issues (critical path behaviors that were lost or weakened)
for report in workspace/raw/audit/fidelity-batch-*.md; do
  p0_issues=$(grep -c 'P0-CRITICAL\|P0-WEAKENED' "$report" 2>/dev/null || echo 0)
  [ "$p0_issues" -gt 0 ] && echo "BLOCKED: P0 fidelity issues in $report"
done
```

### Remediation

If any P0 behaviors were lost or weakened:
1. Read the fidelity report to identify exactly what was lost
2. Dispatch `greenfield:sanitizer` to restore the missing detail - the sanitizer reads the fidelity report and the raw specs, then updates the output spec to include the missing behavioral claim WITHOUT reintroducing source identifiers
3. Re-run the fidelity validator on affected files
4. Also re-run the Layer 6 deep-read audit on any modified files to confirm no contamination was reintroduced
5. Maximum 3 remediation rounds

### Fidelity Pass

```bash
git add -A
git commit -m "[L7:fidelity] Fidelity validation PASS"
git tag -a fidelity-check-complete -m "Layer 7: Fidelity validation passed - all P0 behaviors preserved"
```

**DO NOT proceed to implementation until Layer 7 passes.**

---

## Container Cleanup

If runtime mode was active, stop and remove the target container after all pipeline work is complete:

```bash
# Stop and remove container
docker rm -f <container-name> 2>/dev/null || podman rm -f <container-name> 2>/dev/null || true
```

---

## Session JSONL Capture Protocol

After EVERY agent dispatch completes, the Agent tool returns an `agentId`. Use this to capture the session log:

```bash
# The agentId maps to a session JSONL at:
# ~/.claude/projects/<encoded-cwd>/<agentId>.jsonl
# where <encoded-cwd> is the working directory with / replaced by -

ENCODED_CWD=$(echo "$PWD" | sed 's|/|-|g')
AGENT_SESSION="$HOME/.claude/projects/${ENCODED_CWD}/${AGENT_ID}.jsonl"

# Copy to workspace provenance directory (best-effort)
if [ -f "$AGENT_SESSION" ]; then
  cp "$AGENT_SESSION" workspace/provenance/sessions/<agent-name>-${AGENT_ID:0:8}.jsonl
fi

# Update workspace.json agent_runs array with:
#   { agent, agentId, started_at, completed_at, status, output_files }

# Append entry to provenance/audit-log.md

# Stage and commit all changes together:
#   - Agent output files
#   - Session JSONL copy (if captured)
#   - Updated workspace.json
#   - Updated provenance/audit-log.md
```

If the JSONL file cannot be found (agent ran in a different process or path encoding differs), log a warning and continue. The provenance citations embedded in the output files are the primary audit trail; session JSONLs are supplementary.

---

## Git Commit Protocol

Every agent run produces a commit. The commit message format:

```
[L{N}:{agent-name}] Description of what was produced
```

Examples:
```
[init] Create analysis workspace for acme-cli
[L1:bundle-splitter] Decompose main bundle into 47 chunks
[L1:chunk-analyzer] Analyze chunk-023: record parsing module
[L1:doc-researcher] Extract behavioral claims from official docs
[L2:feature-discoverer] Aggregate feature inventory from 3 intelligence sources
[L2:module-mapper] Identify 12 modules for deep documentation
[L3:deep-dive-analyzer] Session management module spec
[L3:user-journey-analyzer] Login flow end-to-end journey
[gate:spec-verifier] Verification and provenance audit - PASS
[L4:test-vector-generator] 156 test vectors for session management
[L4:acceptance-criteria-writer] Acceptance criteria: 12 modules
[gate:spec-reviewer] Review report - PASS
[L5:spec-sanitizer] Sanitize record parsing module spec
```

Gate tags:
```bash
git tag -a gate-1-pass -m "Gate 1 passed: spec-verifier (N contradictions, M% provenance coverage)"
git tag -a source-completeness-pass -m "Gate 1b: Source-to-spec completeness validated"
git tag -a gate-2-pass -m "Gate 2 passed: spec-reviewer (0 implementation leaks)"
git tag -a specs-ready -m "Layer 5: All raw specs sanitized to output/"
git tag -an review-complete -m "Layer 6: Independent audit passed (semantic review + deep-read)"
git tag -a fidelity-check-complete -m "Layer 7: Fidelity validation passed (N claims, M% match rate)"
```

---

## Failure Handling

| Failure Type | Response |
|-------------|----------|
| Agent produces no output | Log warning, continue. Quality gates will catch the gap. |
| Agent produces partial output | Commit partial output. Flag for review. Continue. |
| Gate fails | Remediate up to 3 times. If still failing, abort with exit code 1. |
| Container build/crash | Log error. Mark runtime mode as unavailable/degraded. Continue with other modes. |
| User interruption | Workspace state preserved in git. Re-run `/analyze` to resume automatically. |

---

## Print Summary

After pipeline completion (or failure), print a summary. Shape depends on whether the user opted in to sanitization.

**Raw-only path (Layers 5–7 skipped):**

```
=== ANALYSIS SUMMARY ===
Target:            <target-name>
Workspace:         <workspace-path>
Sources analyzed:  source, docs, sdk, community, git-history, tests
Sources skipped:   runtime (no container runtime), binary (no binaries found)
Agents dispatched: N
Gate 1:            PASS
Gate 1b:           PASS
Gate 2:            PASS
Sanitization:      SKIPPED (user opted out)
Output:            workspace/raw/specs/ (with provenance citations)
Next steps:        Read raw/specs/ directly, or rerun /analyze and opt in
                   to sanitization when you need a source-free spec.
```

**Full sanitization path (Layers 5–7 ran):**

```
=== ANALYSIS SUMMARY ===
Target:             <target-name>
Workspace:          <workspace-path>
Sources analyzed:   source, docs, sdk, community, git-history, tests
Sources skipped:    runtime (no container runtime), binary (no binaries found)
Agents dispatched:  N
Gate 1:             PASS
Gate 1b:            PASS
Gate 2:             PASS
Sanitization:       COMPLETE (rewrite, not copy)
Second-Pass Review: PASS
Fidelity Check:     PASS
Contamination:      NONE DETECTED
Output:             workspace/output/ (sanitized) + workspace/raw/ (with provenance)
Next steps:         Hand off workspace/output/ to the implementation team
```

---

## ANALYSIS RULES

1. **Analyze exhaustively** - Every code path, every decision, every edge case
2. **Output behaviorally** - No source identifiers in specs
3. **Preserve interfaces** - Env vars, CLI flags, config keys ARE behavioral
4. **Remove internals** - Function names, variable names, line numbers are NOT
5. **Annotate provenance** - Every behavioral claim must have a `<!-- cite: -->` annotation

## WHAT TO PRESERVE vs REMOVE

**PRESERVE (behavioral interfaces):**
- `DATABASE_URL` (env var)
- `--format` (CLI flag)
- `upstreams` (config key)
- `request_id`, `batch_size` (API fields)

**REMOVE (implementation details):**
- `Ab2()`, `parseArgs()` (function names)
- `r0`, `jobId`, `sp` (variable names)
- `Fx3`, `JobScheduler` (class names)
- "Line 1234", "in src/cli.ts" (locations)
- `workspace/raw/source/analysis/chunk-12.md:45` (raw file paths in output)

---

## AFTER ANALYSIS

### If the user opted out of sanitization (raw-only path)

1. Verify `analysis-complete-raw` tag exists.
2. Verify `workspace/raw/specs/` contains module specs, journeys, contracts, test vectors, and acceptance criteria.
3. The raw specs are the deliverable. Provenance citations point back to source.
4. No Layer 5/6/7 artifacts exist - `workspace/output/` is empty or absent.

### If the user opted in to sanitization (full path)

1. Verify `review-complete` tag exists (Layer 6 second-pass review passed - semantic review + deep-read)
2. Verify `fidelity-check-complete` tag exists (Layer 7 fidelity validation - no P0 behaviors lost)
3. Verify `workspace/output/` contains sanitized specs, test vectors, acceptance criteria, and audit summaries
4. If contaminated: dispatch sanitizer rewrites → re-run Layer 6 deep-read audit
5. If fidelity gaps: dispatch sanitizer to restore detail → re-run Layer 6 + Layer 7
6. Implementation reads from `workspace/output/` - hand off the specs, test vectors, and acceptance criteria to the implementation team
