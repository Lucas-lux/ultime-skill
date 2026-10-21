"""Benchmark graphify: codebase questions answered with and without a prebuilt code graph.

Conditions (same model, same prompt, same tools):
  A  baseline : no graph in the repo copy, no graphify skill
  B  skill    : graph present, graphify plugin loaded (the library's current integration)
  C  lean     : graph present, no skill, one appended instruction to use the graphify CLI first
  D  hybrid   : like C, but the graph only orients; every claim is verified in the source before stating it
  E  shipped  : graph plus an imperative version of D written into the repository's CLAUDE.md

Each run is a fresh `claude -p` session; usage, cost, duration and tool calls come from stream-json.
Usage: python bench.py run [--only REPO] [--jobs N]
"""

import argparse
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# Work directory (repo copies, graphify venv, raw results), kept outside the library checkout.
BENCH = Path(os.environ.get("GRAPHIFY_BENCH_DIR", Path.home() / "graphify-bench"))
REPOS = BENCH / "repos"
RESULTS = BENCH / "results"
CLAUDE = Path(os.environ.get("CLAUDE_BIN", Path.home() / ".local" / "bin" / ("claude.exe" if os.name == "nt" else "claude")))
GRAPHIFY_SCRIPTS = BENCH / "gvenv" / ("Scripts" if os.name == "nt" else "bin")
GRAPHIFY_PLUGIN = Path(__file__).resolve().parents[2] / "plugins" / "graphify"
MODEL = "sonnet"
REPS = 2

ANSWER_RULES = ("Answer in at most 300 words. Cite the file paths you rely on. "
                "Do not modify any file.")

QUESTIONS = {
    "commerce": {
        "q1-architecture": "Give an architecture overview of this codebase: the main modules or folders, what each does, and how they depend on each other.",
        "q2-locate": "Where is the shopping cart implemented? List the files involved and the role of each.",
        "q3-trace": "Trace what happens when a user clicks 'Add to cart' on a product page, step by step, down to the call to the commerce backend.",
        "q4-impact": "If I change the signature of the getProduct function, which files must be updated and why?",
    },
    "excalidraw": {
        "q1-architecture": "Give an architecture overview of this codebase: the main packages, what each does, and how they depend on each other.",
        "q2-locate": "Where is real-time collaboration implemented? List the files involved and the role of each.",
        "q3-trace": "Trace what happens when the user exports the scene to a PNG image, step by step, from the UI action to the generated image.",
        "q4-impact": "If I change the signature of mutateElement, which modules and files are affected and why? Give the main call sites.",
    },
    "cal.com": {
        "q1-architecture": "Give an architecture overview of this monorepo: the main apps and packages, what each does, and how they depend on each other.",
        "q2-locate": "Where is the booking creation logic implemented? List the main files involved and the role of each.",
        "q3-trace": "Trace what happens when an attendee books a slot on a public booking page, step by step, down to the database write and the confirmation email.",
        "q4-impact": "If I change the signature of getUserAvailability, which files and features are affected and why?",
    },
}

LEAN_HINT = ("A code knowledge graph of this repository is prebuilt in graphify-out/. Before reading source "
             "files, query it with the graphify CLI: `graphify query \"<question>\"` (broad context), "
             "`graphify explain \"<symbol>\"` (a node and its neighbours), `graphify path \"A\" \"B\"` (how A "
             "reaches B). Then read only the files the graph points to, to confirm details.")


VERIFY_HINT = (" Use the graph only to orient yourself: verify every file path, dependency direction, signature, "
               "line number and count in the source files (Read, Grep) before stating it.")


def repo_dir(repo: str, condition: str) -> Path:
    # E: graph plus data/claude-md-block.md appended to the repository's CLAUDE.md (copy named <repo>-E)
    return REPOS / {"A": f"{repo}-A", "E": f"{repo}-E"}.get(condition, f"{repo}-G")


def command(condition: str, prompt: str) -> list[str]:
    cmd = [str(CLAUDE), "-p", prompt, "--output-format", "stream-json", "--verbose", "--model", MODEL,
           "--max-turns", "60", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
           "--disallowedTools", "Edit", "Write", "NotebookEdit", "Agent", "WebFetch", "WebSearch",
           "--allowedTools", "Read", "Grep", "Glob", "Bash", "Skill"]
    if condition == "B":
        cmd += ["--plugin-dir", str(GRAPHIFY_PLUGIN)]
    if condition == "C":
        cmd += ["--append-system-prompt", LEAN_HINT]
    if condition == "D":
        cmd += ["--append-system-prompt", LEAN_HINT + VERIFY_HINT]
    return cmd


def run_one(repo: str, qid: str, condition: str, rep: int) -> dict:
    out = RESULTS / repo / qid / f"{condition}-{rep}.json"
    if out.exists():
        return json.loads(out.read_text(encoding="utf-8"))
    prompt = f"{QUESTIONS[repo][qid]} {ANSWER_RULES}"
    env = dict(os.environ)
    env["PATH"] = str(GRAPHIFY_SCRIPTS) + os.pathsep + env["PATH"]
    started = time.time()
    proc = subprocess.run(command(condition, prompt), cwd=repo_dir(repo, condition), env=env,
                          capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=1800)
    wall = time.time() - started
    tools: dict[str, int] = {}
    graphify_calls = 0
    final = {}
    for line in proc.stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "assistant":
            for block in event.get("message", {}).get("content", []):
                if block.get("type") == "tool_use":
                    tools[block["name"]] = tools.get(block["name"], 0) + 1
                    text = json.dumps(block.get("input", {}))
                    if "graphify" in text:
                        graphify_calls += 1
        elif event.get("type") == "result":
            final = event
    usage = final.get("usage", {})
    record = {
        "repo": repo, "question": qid, "condition": condition, "rep": rep,
        "ok": final.get("subtype") == "success", "cost_usd": final.get("total_cost_usd"),
        "duration_s": round((final.get("duration_ms") or wall * 1000) / 1000, 1), "turns": final.get("num_turns"),
        "input_tokens": usage.get("input_tokens", 0), "cache_creation": usage.get("cache_creation_input_tokens", 0),
        "cache_read": usage.get("cache_read_input_tokens", 0), "output_tokens": usage.get("output_tokens", 0),
        "tool_calls": sum(tools.values()), "tools": tools, "graphify_calls": graphify_calls,
        "skill_loaded": tools.get("Skill", 0) > 0, "answer": final.get("result", ""),
        "stderr_tail": proc.stderr[-500:],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{repo:11} {qid:16} {condition}{rep}  ${record['cost_usd']}  {record['duration_s']}s  "
          f"tools={record['tool_calls']} graphify={graphify_calls}", flush=True)
    return record


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["run"])
    parser.add_argument("--only", action="append")
    parser.add_argument("--jobs", type=int, default=6)
    args = parser.parse_args()
    tasks = [(repo, qid, cond, rep) for repo, qs in QUESTIONS.items() if not args.only or repo in args.only
             for qid in qs for cond in "ABC" for rep in range(1, REPS + 1)]
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        list(pool.map(lambda task: run_one(*task), tasks))


if __name__ == "__main__":
    sys.exit(main())
