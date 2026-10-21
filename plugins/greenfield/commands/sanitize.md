---
name: sanitize
description: Sanitization - Provenance-aware sanitization of raw specs for independent separation
arguments:
  - name: workspace_path
    description: Path to the analysis workspace directory
    required: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Bash
  - Task
  - TodoWrite
---

# /sanitize - Spec Sanitization (Sanitization)

Workspace: $ARGUMENTS

## YOUR MISSION

**Remove ALL implementation contamination from analysis specs while preserving provenance metadata.**

The sanitization pass turns raw analysis into specs an implementer can build from. Source-code references have no place in the output. But provenance metadata (confidence levels, source types, agent names) must be preserved - only raw file paths are stripped.

## PHASE 1: Initial Assessment

First, verify the workspace and assess scope:

```bash
# Verify workspace structure
[ -d "$ARGUMENTS/raw/specs/" ] || { echo "ERROR: No raw specs found at $ARGUMENTS/raw/specs/"; exit 2; }

# Count files to sanitize
echo "=== Sanitization Scope ==="
echo "Raw specs files: $(find $ARGUMENTS/raw/specs/ -name '*.md' -type f | wc -l)"
echo "Public artifacts: $(find $ARGUMENTS/public/ -name '*.md' -type f 2>/dev/null | wc -l)"
```

## PHASE 2: Public Source Pass-Through

Public artifacts contain no implementation details and pass through without modification:

```bash
# Copy public artifacts directly (no sanitization needed)
if [ -d "$ARGUMENTS/public/" ]; then
  mkdir -p $ARGUMENTS/output/public/
  cp -r $ARGUMENTS/public/* $ARGUMENTS/output/public/
  echo "Public artifacts copied: $(find $ARGUMENTS/output/public/ -name '*.md' | wc -l) files"
fi
```

## PHASE 3: Agent-Based Sanitization

**For EACH spec file in the raw tree, invoke the sanitizer worker.**

```bash
# List all spec files
find $ARGUMENTS/raw/specs/ -name '*.md' -type f
```

For each file (or batch of related files), dispatch `greenfield:sanitizer`:

- Prompt: "Follow the **spec-sanitization skill** for the full transformation methodology. Read `$ARGUMENTS/raw/specs/<file-path>`. Understand the behavioral intent. Rewrite without source references. Transform provenance citations (strip raw refs, preserve confidence). Write to `$ARGUMENTS/output/specs/<relative-path>`. For module specs, merge into behavioral domain files in `$ARGUMENTS/output/specs/domains/`."

### Provenance Citation Transformation

During sanitization, provenance citations are transformed:

**Raw citations** (source=source-code, source=runtime-observation, source=binary-analysis):
- Strip the `ref` field (contains raw file paths)
- Preserve `source`, `confidence`, `agent`, and `corroborated_by` fields

**Public citations** (source=official-docs, source=sdk-analysis, source=public-api):
- Pass through without modification (ref fields point to public URLs or workspace/public/ paths)

**Before (raw):**
```markdown
<!-- cite: source=source-code, ref=workspace/raw/source/analysis/chunk-0013.md:42, confidence=confirmed, agent=deep-dive-analyzer, corroborated_by=runtime-observation -->
```

**After (clean):**
```markdown
<!-- cite: source=source-code, confidence=confirmed, agent=deep-dive-analyzer, corroborated_by=runtime-observation -->
```

## PHASE 4: Validation Artifact Sanitization

Acceptance criteria and test vectors also need sanitization:

```bash
# Sanitize acceptance criteria
find $ARGUMENTS/raw/specs/validation/ -name '*.md' -type f
```

For each validation artifact:
- Strip raw `ref` paths from provenance citations
- Preserve Given/When/Then structure
- Preserve AC IDs (AC-{MODULE}-{NNN})
- Write to `$ARGUMENTS/output/validation/`

## PHASE 5: Verification

After all agents complete, verify the output specs using LLM judgment.

**For EACH file in `$ARGUMENTS/output/specs/`**, read the file end-to-end and evaluate against these criteria:

### Verification Criteria

1. **No implementation details** - The spec must not contain source file paths, line numbers, function/class names from source code, minified identifiers, IPC channel names, state management library references, CSS class names, or database migration identifiers. External contract files (`contracts/`) may reference technical formats (SQL types, API endpoints) since those describe the external system's interface, not the app's implementation.

2. **External contracts preserved** - Any behavioral contracts with external systems (databases, APIs, CLIs, file formats) must still fully describe the interface the app depends on. These are requirements, not implementation details.

3. **Behavioral completeness** - Decision trees, state machines, error conditions, edge cases, and acceptance criteria from the raw original must all be present in the output version. Sanitization removes *how the source code did it*, not *what the system must do*.

4. **No raw provenance leaks** - Provenance citations must not contain `ref=` fields pointing to `workspace/raw/` paths. The `source`, `confidence`, `agent`, and `corroborated_by` fields should be preserved.

5. **No structural contamination** - No "Part N:" headers from source chunking, no module IDs (MOD-NNN), no module counts, no cross-module/inter-module references, no domain-to-module mapping language.

### The Reimplementor Test

For each spec, ask: *"Could a competent engineer who has never seen the original source code read this spec and build a correct implementation from scratch?"* If the answer is no because implementation details are missing, the spec FAILS. If the answer is no because behavioral requirements were lost during sanitization, the spec also FAILS.

### Verification Report

Produce a verification report listing each file with PASS or FAIL and a brief reason for any failure:

```
=== Verification Report ===
output/specs/domains/process-lifecycle.md  PASS
output/specs/domains/data-management.md    PASS
output/specs/contracts/database.md         PASS
output/specs/journeys/first-run.md         FAIL - contains reference to src/init.ts:42
...
RESULT: PASS (all files clean) | FAIL (N files need re-sanitization)
```

**Any FAIL is a hard stop** - re-run the sanitizer worker on the affected files before proceeding.

## PHASE 6: Completeness Audit

For each sanitized spec, verify behavioral information was preserved:
- Decision trees still documented
- State machines still described
- Error conditions still listed
- Edge cases still covered

**If sanitization LOST behavioral information, flag for analysis revision.**

## OUTPUT STRUCTURE

```
$ARGUMENTS/
├── raw/specs/        # Intermediate analysis artifacts
│   ├── modules/
│   ├── journeys/
│   ├── contracts/
│   ├── test-vectors/
│   └── validation/
├── public/               # Public artifacts (no contamination)
│   ├── docs/
│   └── ecosystem/
├── output/                # Sanitized - THE IMPLEMENTER USES THIS
│   ├── public/           # Copied from public/ directly
│   ├── specs/            # Sanitized specs
│   │   ├── domains/
│   │   ├── journeys/
│   │   └── contracts/
│   ├── test-vectors/     # Output test vectors (sibling of specs/)
│   ├── validation/       # Output acceptance criteria (sibling of specs/)
│   └── sanitization-report.md
```

## SANITIZATION REPORT

Write to `$ARGUMENTS/output/sanitization-report.md`.

This report is read alongside the output specs by the implementation team. Its job is to help them navigate the output - *what's here and how to use it* - not to describe the original codebase. An implementer anchored to the original's module decomposition will reproduce the original's design instead of choosing the best design for the new implementation; the report therefore omits anything that would anchor the reader to that original architecture.

**The report must NOT contain:**
- Source module names or filenames from `raw/`
- Mapping of domain files to source modules
- Raw file paths
- Any reference to the original's internal structure

**The report MUST contain only:**
- What files are available in `output/` (counts and directory structure)
- Domain file inventory (name, SPEC ID prefixes, line count - no source mapping)
- Provenance citation format explanation (so the implementer understands confidence levels)
- SPEC ID coverage count
- Guidance for the implementer (architectural freedom, requirement levels, priority tiers)

```markdown
# Sanitization Report

## Clean Output
| Category | File Count | Notes |
|----------|------------|-------|
| Domain specs | [N] | Behavioral specifications organized by functional area |
| Contracts | [N] | External contracts |
| Journeys | [N] | End-to-end user journey specifications |
| ... | ... | ... |

## Domain Files
| Domain File | SPEC ID Prefixes | Lines |
|-------------|------------------|-------|
| `process-lifecycle.md` | PROC, UTIL, ... | [N] |
| ... | ... | ... |

## Provenance Citations
[Explain the citation format: source, confidence, agent fields]

## SPEC ID Coverage
- Unique SPEC IDs: [N]
- Requirement levels: MUST, SHOULD, MAY
- Priority tiers: P0 (critical), P1 (major), P2 (advisory)

## Directory Structure
[Tree of output/ - files only, no source mapping]

## For the implementer
- All specs describe observable behavior - you choose the architecture
- P0 acceptance criteria MUST all pass
- Treat `assumed` confidence claims with caution
```

## EXIT CODES

| Code | Meaning |
|------|---------|
| 0 | Sanitization completed. All contamination removed. |
| 1 | Sanitization failed. Residual contamination detected. |
| 2 | Invalid arguments (workspace path does not exist or is not a valid workspace). |

## GIT COMMIT

After successful sanitization:

```bash
cd $ARGUMENTS
git add output/
git commit -m "Layer 5: sanitization complete"
git tag specs-ready
```

## CRITICAL RULES

1. **Agents READ specs** - Don't just grep, understand the content
2. **Agents REWRITE specs** - Transform, don't just delete
3. **Preserve behavior** - Sanitization must not lose information
4. **Transform provenance** - Strip raw refs, preserve confidence
5. **Pass through public** - Public artifacts are not contaminated
6. **Verify with judgment** - Read every output specs and apply the reimplementor test
7. **Work from specs only** - You.re in a fresh session; the raw analysis artifacts are not in your context

## HANDOFF

When complete:

1. All specs in `$ARGUMENTS/output/specs/`
2. Public artifacts in `$ARGUMENTS/output/public/`
3. Verification report all PASS
4. Completeness audit passed
5. Tell user: "Specs sanitized; end this session. Hand off `workspace/output/` to the implementation team."
