<!-- ultime:code-graph -->
## Code graph (read this first)

IMPORTANT: for any question about how this codebase is organised, where something lives, how a flow works
or what a change impacts, your FIRST step is to query the prebuilt code graph with the graphify CLI, before
any Grep, Glob or Read: `graphify query "<question>"`, `graphify explain "<symbol>"`,
`graphify path "A" "B"`. Then read only the files the graph points to. The graph only orients you: verify
every file path, dependency direction, signature, line number and count in the source before stating it.
Rebuild it after large changes with `graphify update .` (no tokens).
<!-- /ultime:code-graph -->
