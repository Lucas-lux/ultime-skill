"""Aggregate benchmark runs and judge scores into tables (stdout) and summary.json."""

import json
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bench  # noqa: E402

runs = [json.loads(p.read_text(encoding="utf-8")) for p in bench.RESULTS.glob("*/*/[ABCD]-[12].json")]
judges = [json.loads(p.read_text(encoding="utf-8")) for p in bench.RESULTS.glob("*/*/judge-*.json")]
judges2 = [json.loads(p.read_text(encoding="utf-8")) for p in bench.RESULTS.glob("*/*/judge2-*.json")]
score, score2 = {}, {}
for source, target in ((judges, score), (judges2, score2)):
    for j in source:
        for cond, s in j["scores"].items():
            target[(j["repo"], j["question"], cond, j["rep"])] = s

for r in runs:
    r["tokens"] = r["input_tokens"] + r["cache_creation"] + r["cache_read"] + r["output_tokens"]
    s = score.get((r["repo"], r["question"], r["condition"], r["rep"]))
    r["correctness"] = s["correctness"] if s else None
    r["completeness"] = s["completeness"] if s else None
    s2 = score2.get((r["repo"], r["question"], r["condition"], r["rep"]))
    r["correctness2"] = s2["correctness"] if s2 else None
    r["completeness2"] = s2["completeness"] if s2 else None

METRICS = ["cost_usd", "tokens", "cache_read", "output_tokens", "duration_s", "turns", "tool_calls",
           "correctness", "completeness", "correctness2", "completeness2"]


def mean(values):
    values = [v for v in values if v is not None]
    return round(st.mean(values), 3) if values else None


def table(group_key, title):
    groups = defaultdict(list)
    for r in runs:
        groups[group_key(r)].append(r)
    print(f"\n## {title}")
    print("| groupe | n | " + " | ".join(METRICS) + " | reads | greps | graphify |")
    print("|---" * (len(METRICS) + 5) + "|")
    out = {}
    for key in sorted(groups):
        rs = groups[key]
        row = {m: mean([r[m] for r in rs]) for m in METRICS}
        row["reads"] = mean([r["tools"].get("Read", 0) for r in rs])
        row["greps"] = mean([r["tools"].get("Grep", 0) + r["tools"].get("Glob", 0) for r in rs])
        row["graphify"] = mean([r["graphify_calls"] for r in rs])
        row["n"] = len(rs)
        out[" / ".join(key)] = row
        print(f"| {' / '.join(key)} | {len(rs)} | " + " | ".join(str(row[m]) for m in METRICS)
              + f" | {row['reads']} | {row['greps']} | {row['graphify']} |")
    return out


summary = {
    "by_condition": table(lambda r: (r["condition"],), "Par condition"),
    "by_repo_condition": table(lambda r: (r["repo"], r["condition"]), "Par depot et condition"),
    "by_question_type_condition": table(lambda r: (r["question"], r["condition"]), "Par type de question et condition"),
    "judge_cost_usd": round(sum(j.get("judge_cost_usd") or 0 for j in judges + judges2), 2),
    "runs_cost_usd": round(sum(r["cost_usd"] or 0 for r in runs), 2),
}
(bench.BENCH / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
print("\nruns cost", summary["runs_cost_usd"], "judge cost", summary["judge_cost_usd"])
