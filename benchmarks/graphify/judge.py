"""Blind judge: for each repo/question/rep, score the three answers (A, B, C shuffled) against the code."""

import json
import random
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bench  # noqa: E402

JUDGE_MODEL = "opus"
PROMPT = """You are a strict reviewer of answers about this repository. Question asked to three assistants:

<question>{question}</question>

{answers}

Verify the key claims of each answer against the actual code (use Grep, Glob, Read). Score each answer:
- correctness (0-10): are the files, symbols and flows it states real and accurately described? Penalize every false or invented claim.
- completeness (0-10): does it cover what a developer needs to act on the question?
Then output ONLY a JSON object, no prose, exactly:
{{"scores": {{"X": {{"correctness": n, "completeness": n, "errors": ["..."]}}, "Y": {{...}}, "Z": {{...}}}}}}"""


def judge(repo: str, qid: str, rep: int, conds: str = "ABC", tag: str = "judge") -> dict:
    out = bench.RESULTS / repo / qid / f"{tag}-{rep}.json"
    if out.exists():
        return json.loads(out.read_text(encoding="utf-8"))
    answers = {c: json.loads((bench.RESULTS / repo / qid / f"{c}-{rep}.json").read_text(encoding="utf-8"))["answer"]
               for c in conds}
    labels = ["X", "Y", "Z"]
    order = list(conds)
    random.Random(f"{repo}{qid}{rep}").shuffle(order)
    mapping = dict(zip(labels, order))
    block = "\n\n".join(f"<answer id=\"{label}\">\n{answers[cond]}\n</answer>" for label, cond in mapping.items())
    cmd = [str(bench.CLAUDE), "-p", PROMPT.format(question=bench.QUESTIONS[repo][qid], answers=block),
           "--output-format", "json", "--model", JUDGE_MODEL, "--max-turns", "60",
           "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
           "--disallowedTools", "Edit", "Write", "NotebookEdit", "Agent", "WebFetch", "WebSearch", "Skill",
           "--allowedTools", "Read", "Grep", "Glob", "Bash"]
    proc = subprocess.run(cmd, cwd=bench.repo_dir(repo, "A"), capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=2400)
    result = json.loads(proc.stdout)
    match = re.search(r"\{[\s\S]*\}", result.get("result", ""))
    scores = json.loads(match.group(0))["scores"] if match else {}
    record = {"repo": repo, "question": qid, "rep": rep, "mapping": mapping, "judge_cost_usd": result.get("total_cost_usd"),
              "scores": {mapping[label]: value for label, value in scores.items()}}
    out.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"judged {repo} {qid} rep{rep}: " + ", ".join(
        f"{c}={v['correctness']}/{v['completeness']}" for c, v in sorted(record["scores"].items())), flush=True)
    return record


if __name__ == "__main__":
    tasks = [(repo, qid, rep) for repo, qs in bench.QUESTIONS.items() for qid in qs for rep in (1, 2)]
    conds, tag = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ("ABC", "judge")
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda task: judge(*task, conds=conds, tag=tag), tasks))
    print("JUDGED", len(tasks))
