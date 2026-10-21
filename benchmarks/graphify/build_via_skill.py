"""Measure the cost of building the graph through the graphify skill (the way Claude does it in a session)."""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bench  # noqa: E402

for repo in sys.argv[1:]:
    out = bench.RESULTS / repo / "build-via-skill.json"
    if out.exists():
        continue
    env = dict(os.environ)
    env["PATH"] = str(bench.GRAPHIFY_SCRIPTS) + os.pathsep + env["PATH"]
    cmd = [str(bench.CLAUDE), "-p", "/graphify:graphify . --no-viz  (non-interactive benchmark: proceed on the whole repository, do not ask any question)", "--output-format", "json", "--model", bench.MODEL,
           "--max-turns", "200", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
           "--plugin-dir", str(bench.GRAPHIFY_PLUGIN), "--permission-mode", "acceptEdits",
           "--allowedTools", "Read", "Grep", "Glob", "Bash", "Skill", "Agent", "Write"]
    started = time.time()
    proc = subprocess.run(cmd, cwd=bench.REPOS / f"{repo}-S", env=env, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=7200)
    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError:
        result = {"raw": proc.stdout[-2000:]}
    graph = bench.REPOS / f"{repo}-S" / "graphify-out" / "graph.json"
    record = {"repo": repo, "wall_s": round(time.time() - started, 1), "cost_usd": result.get("total_cost_usd"),
              "turns": result.get("num_turns"), "usage": result.get("usage"), "graph_built": graph.exists(),
              "result_tail": str(result.get("result", result.get("raw", "")))[-1500:], "stderr": proc.stderr[-800:]}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    print(repo, record["cost_usd"], record["wall_s"], record["graph_built"], flush=True)
