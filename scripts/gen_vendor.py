"""Generate vendor.json: the single source of truth for scripts/vendor.py.

Run once (python scripts/gen_vendor.py) to rewrite vendor.json. Editing this file and rerunning it
is the supported way to change which upstream skills the library imports.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SOURCES = {
    # name: (repo, commit, license, [license_files])
    "ponytail": ("DietrichGebert/ponytail", "2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5", "MIT", ["LICENSE"]),
    "rea": ("morluto/rea", "0f55f247cdd2ae9bd7903d5e45962b19dfc233dc", "MIT", ["LICENSE"]),
    "agent-skills": ("addyosmani/agent-skills", "aeac41d4d005999432bb7312f7ff06383a91d59d", "MIT", ["LICENSE"]),
    "superpowers": ("obra/superpowers", "bb92a77741419a4ab5f06e711a283343f1ada0c3", "MIT", ["LICENSE"]),
    "anthropic-skills": ("anthropics/skills", "dbd4588f9e1033efb41dad4bef2f7947c8993d44", "Apache-2.0", []),
    "agamm-owasp": ("agamm/claude-code-owasp", "8ac7965caa212b4a850aff8d3df0081ab3fa9eed", "MIT", ["LICENSE"]),
    "getsentry": ("getsentry/skills", "d18b7aa8ba878354e5c348310230e652f7690f9c", "Apache-2.0", ["LICENSE"]),
    "openai": ("openai/skills", "49f948faa9258a0c61caceaf225e179651397431", "Apache-2.0", []),
    "trilwu": ("trilwu/secskills", "ca53957bcd8e3b83b5d4d190bb3ad008a4f15c84", "MIT", ["LICENSE"]),
    "terraform-skill": ("antonbabenko/terraform-skill", "0a3a4a66e99001347d36a41e10260a825be3ab62", "Apache-2.0", ["LICENSE"]),
    "docker": ("docker/skills", "f79172733725e2fd236343ee7b963c446ed85d09", "Apache-2.0", ["LICENSE"]),
    "jeffallan": ("jeffallan/claude-skills", "1be15d8064f88fc25216442406d40add8fd23b53", "MIT", ["LICENSE"]),
    "akin-ozer": ("akin-ozer/cc-devops-skills", "276af751e659315aaf56d3ad13d7c26f4e72e28a", "Apache-2.0", ["LICENSE"]),
    "grafana": ("grafana/skills", "1ccacf29049fde66637fe01ab93a83a772da323b", "Apache-2.0", ["LICENSE"]),
    "tartinerlabs": ("tartinerlabs/skills", "a7812b928cd37d688879fed1e94b6e424bf21da7", "MIT", ["LICENSE"]),
    "wshobson": ("wshobson/agents", "46891e7e60da0e52baf1050b7b6391b64e84c6d9", "MIT", ["LICENSE"]),
    "aws": ("aws/agent-toolkit-for-aws", "fea6667159ecf09a75310e5f70c1d76908d8abab", "Apache-2.0", ["LICENSE"]),
    "google": ("google/skills", "e569129c25c9f660db4902431b59d2aeefafe55e", "Apache-2.0", ["LICENSE"]),
    "azure": ("microsoft/azure-skills", "5aa6e04819634ca4945ef57d6aa059eb4f5944e7", "MIT", ["LICENSE"]),
    "infracost": ("infracost/agent-skills", "b4104c3a605e0999fc11fd566ab5452dc528b8a5", "Apache-2.0", ["LICENSE"]),
    "kwp": ("anthropics/knowledge-work-plugins", "02ffa99ff00ce4d3046ccebabb8357cb39f3ab06", "Apache-2.0", ["LICENSE"]),
    "dbt": ("dbt-labs/dbt-agent-skills", "7c7b5fa39e61694f1ae2b8ea1b8065e195c814ce", "Apache-2.0", ["LICENSE"]),
    "astronomer": ("astronomer/agents", "486ee63d01f8126c52fbc92c36cd36ec31708dcd", "Apache-2.0", ["LICENSE"]),
    "supabase": ("supabase/agent-skills", "c9be0e931b7930f7d02126d04774d904c381e7d7", "MIT", ["LICENSE"]),
    "huggingface": ("huggingface/skills", "c3ff942be3e07116b475253f0a8fc4f54682c1a8", "Apache-2.0", ["LICENSE"]),
    "kdense": ("K-Dense-AI/claude-scientific-skills", "a1043ef544e3a100c28e70a736b6cf32554d0677", "MIT", ["LICENSE"]),
    "orchestra": ("Orchestra-Research/AI-Research-SKILLs", "773a52944ba4747a18bd4ae9ade53fff041adcbc", "MIT", ["LICENSE"]),
    "mlflow": ("mlflow/skills", "51a42ea2b07fadb45fb34c7cecf0c87edbe05686", "Apache-2.0", ["LICENSE"]),
    "vercel-labs": ("vercel-labs/agent-skills", "063bee94c3f4df8453406c830b0a7df0f2860278", "MIT (declared in frontmatter, no LICENSE file)", []),
    "wig": ("vercel-labs/web-interface-guidelines", "434b7f91364665f2f733b310ec54809bf8f37937", "MIT", ["LICENSE"]),
    "ibelick": ("ibelick/ui-skills", "c628a5917754ec2396d9cbb47988f280ba1d5cb0", "MIT", ["LICENSE"]),
    "emilkowalski": ("emilkowalski/skills", "2d228630ba1446365f614a108cb8252f1feda202", "MIT", ["LICENSE"]),
    "taste": ("Leonxlnx/taste-skill", "a60a36dc2bb3bb77ccf17f2f62041f5ca8a458b9", "MIT", ["LICENSE"]),
    "impeccable": ("pbakaus/impeccable", "2f98774f86bc05563876643db37e6c37c322850f", "Apache-2.0", ["LICENSE"]),
    "etalab": ("etalab-ia/skills", "c791677af5f9f50cda131bd60220b717220d5c02", "MIT", ["LICENSE"]),
    "awesome-copilot": ("github/awesome-copilot", "f25421d3f1b8b3bb217f78a7c0567cf7ec117cd8", "MIT", ["LICENSE"]),
    "sushegaad": ("Sushegaad/Claude-Skills-Governance-Risk-and-Compliance", "aab13e1eb1dbf3b537b66f98d9b5eb52db0a7c25", "MIT", ["LICENSE"]),
    "gsap": ("greensock/gsap-skills", "aed9cfd3277740755f6bfc1155c7aa645403b760", "MIT", ["LICENSE"]),
    "lottiefiles": ("LottieFiles/motion-design-skill", "f9a8a041b85185ee4881b3471d3415e939aac772", "MIT", ["LICENSE"]),
    "manim": ("adithya-s-k/manim_skill", "cef045011722d285692e3381d12d4d637da56e18", "MIT", ["LICENSE"]),
    "video-use": ("browser-use/video-use", "43cfc566833548093455c9d4a46bd69913b7e552", "MIT", ["LICENSE"]),
    "ffmpeg": ("bryanwhl/ffmpeg-video-editor", "d5c3ee6e9896fdabccd4e8b5d68149252bbb682c", "MIT", ["LICENSE"]),
    "faster-whisper": ("ThePlasmak/faster-whisper", "1c8d6a682c56813a540640babe49d9b270ea708c", "MIT", ["LICENSE"]),
    "phuryn": ("phuryn/pm-skills", "07b34f64ee828df08953f505b7f747aef85ae7c6", "MIT", ["LICENSE"]),
    "schematic": ("blader/schematic", "297fb73e99aa4bccdb228b61252034182fdb4252", "MIT", ["LICENSE"]),
    "alirezarezvani": ("alirezarezvani/claude-skills", "19392f7a08264ed00486a251f5b2098321771f94", "MIT", ["LICENSE"]),
    "greenfield": ("prime-radiant-inc/greenfield", "6e6d4b425fe9082d469493d64a5b8e12b15dc9da", "Apache-2.0", ["LICENSE"]),
    "expo": ("expo/skills", "55ec65cd16499f20f14fb10fe99a2e62901b00a1", "MIT", ["LICENSE"]),
    "callstack": ("callstackincubator/agent-skills", "59e9d17446a248b21d86f078fcd0bd2d36db1ca4", "MIT", ["LICENSE"]),
    "rntl": ("callstack/react-native-testing-library", "0ecb9c9c0cef163e01abdeae1b4b7c82af40d0b1", "MIT", ["LICENSE"]),
    "swiftui-pro": ("twostraws/SwiftUI-Agent-Skill", "ce32af1693b9e78a7d22ff48001c97a304d32063", "MIT", ["LICENSE"]),
    "swift-concurrency-pro": ("twostraws/Swift-Concurrency-Agent-Skill", "bee3f69ba17142da148d3c5406f148ed62592b69", "MIT", ["LICENSE"]),
    "swift-testing-pro": ("twostraws/Swift-Testing-Agent-Skill", "2d6bba14a3c8bf3694f218b92fffe617c41ae43e", "MIT", ["LICENSE"]),
    "swiftdata-pro": ("twostraws/SwiftData-Agent-Skill", "8051f177a0076e7fd45bdf4ee687b070ba58fdc6", "MIT", ["LICENSE"]),
    "dadederk": ("dadederk/iOS-Accessibility-Agent-Skill", "dcc3a36ce1d0099341d545c1af4eb5a8c989bf66", "MIT", ["LICENSE"]),
    "android": ("android/skills", "95ea931a1ad8f9b2be132ae0cfb2aad964d71118", "Apache-2.0", ["LICENSE.txt"]),
    "play-billing": ("RevenueCat/play-billing-skills", "8fa2e4c25d4171be5950888b3ce89d500f6e5cfa", "Apache-2.0", ["LICENSE"]),
    "flutter": ("flutter/agent-plugins", "6e590650bb4bab87f33187423dc10113d04d4836", "BSD-3-Clause", ["LICENSE"]),
    "asc": ("rorkai/app-store-connect-cli-skills", "4b496c57b262985df88f2382a65029d3fec3ab95", "MIT", ["LICENSE"]),
    "gplay": ("tamtom/gplay-cli-skills", "10301b24639e4f768d009b2edda9315cb2149712", "MIT", ["LICENSE"]),
    "devsemih": ("devsemih/appstore-review-skill", "ab77bb701fe9bee863b89db4634efcf6e128798e", "MIT", ["LICENSE"]),
    "preflight": ("truongduy2611/app-store-preflight-skills", "cfd9c73577300f9310ca892fefd38fbe1abd73cb", "MIT", ["LICENSE"]),
    "rshankras": ("rshankras/claude-code-apple-skills", "9ffb83138209057875698dd11c1720c657c47a92", "MIT", ["LICENSE"]),
    "screenshots": ("ParthJadhav/app-store-screenshots", "5386f227360bddb06c8beaff920a1a34c9f01932", "MIT", ["LICENSE"]),
    "appeeky": ("appeeky/aso-skills", "3919d7c27402d92c7ef698f2016174b874ea189e", "MIT", ["LICENSE"]),
    "marketingskills": ("coreyhaines31/marketingskills", "e85f3cbc2e4a79bf33b2a12e9bdd9087d414735b", "MIT", ["LICENSE"]),
}

imports: list[dict] = []


def add(source, frm, to, **kw):
    imports.append({"source": source, "from": frm, "to": to, **kw})


def pack_skill(source, frm, pack, folder=None, **kw):
    """Import one upstream skill folder as plugins/<pack>/skills/<folder>."""
    name = folder or frm.rstrip("/").split("/")[-1]
    add(source, frm, f"plugins/{pack}/skills/{name}", **kw)


# ---- Core and named packs (imported as whole collections) ----
add("ponytail", "skills", "plugins/ponytail/skills", license_to="plugins/ponytail", exclude=["plugin.json"])
add("ponytail", "hooks", "plugins/ponytail/hooks", license=False,
    exclude=["copilot-hooks.json", "cursor-hooks.json", "qoder-hooks.json"])
add("rea", ".agents/skills/reverse-engineer-anything", "plugins/rea/skills/reverse-engineer-anything")
add("agent-skills", "skills", "plugins/agent-skills/skills", license_to="plugins/agent-skills")
add("agent-skills", "agents", "plugins/agent-skills/agents", license=False)
add("agent-skills", "references", "plugins/agent-skills/references", license=False)
add("agent-skills", ".claude/commands", "plugins/agent-skills/commands", license=False)
add("superpowers", "skills", "plugins/superpowers/skills", license_to="plugins/superpowers")
add("superpowers", "hooks", "plugins/superpowers/hooks", license=False, exclude=["hooks-cursor.json"])
add("anthropic-skills", "skills/skill-creator", "plugins/skill-factory/skills/skill-creator")
add("anthropic-skills", "skills/mcp-builder", "plugins/skill-factory/skills/mcp-builder")

# ---- Security (curated) ----
pack_skill("agamm-owasp", ".claude/skills/owasp-security", "security")
pack_skill("getsentry", "skills/gha-security-review", "security")
pack_skill("getsentry", "skills/skill-scanner", "security")
pack_skill("openai", "skills/.curated/security-threat-model", "security")
# Copyleft sources are not imported (trailofbits/skills CC-BY-SA-4.0, hashicorp/agent-skills MPL-2.0, getsentry's
# security-review derived from the OWASP Cheat Sheets under CC-BY-SA-4.0): the security review, static analysis
# and supply-chain skills are written in-house in authored/security; Terraform tests and style are covered by
# terraform-skill (Apache-2.0).

# ---- Security audit, defense and offense (trilwu, whole collections) ----
# sec-offense is for authorized security testing only (pentest engagements, CTF, research).
# The three general-purpose reviews live in the security pack (used by app-factory), not in sec-audit.
TRILWU_IN_SECURITY = ["auditing-code-for-vulnerabilities", "reviewing-code-changes", "auditing-supply-chain"]
add("trilwu", "secskills-core/skills", "plugins/sec-audit/skills", license_to="plugins/sec-audit",
    exclude=TRILWU_IN_SECURITY)
for skill in TRILWU_IN_SECURITY:
    pack_skill("trilwu", f"secskills-core/skills/{skill}", "security")
add("trilwu", "secskills-defense/skills", "plugins/sec-defense/skills", license_to="plugins/sec-defense")
add("trilwu", "secskills-offense/skills", "plugins/sec-offense/skills", license_to="plugins/sec-offense")

# ---- DevOps / SRE / CI-CD / observability / prod testing ----
pack_skill("terraform-skill", "skills/terraform-skill", "devops")
pack_skill("docker", "skills/docker-build-strategies", "devops")
pack_skill("docker", "skills/docker-destructive-guardrails", "devops")
pack_skill("jeffallan", "skills/kubernetes-specialist", "devops")
pack_skill("akin-ozer", "devops-skills-plugin/skills/k8s-debug", "devops")
pack_skill("wshobson", "plugins/kubernetes-operations/skills/gitops-workflow", "devops")
pack_skill("wshobson", "plugins/observability-monitoring/skills/slo-implementation", "devops")
pack_skill("wshobson", "plugins/incident-response/skills/postmortem-writing", "devops")
pack_skill("wshobson", "plugins/cicd-automation/skills/deployment-pipeline-design", "devops")
pack_skill("grafana", "skills/grafana-core/promql", "devops")
pack_skill("grafana", "skills/grafana-cloud/prometheus-cardinality-troubleshooter", "devops")
pack_skill("grafana", "skills/grafana-k6/k6", "devops")
pack_skill("grafana", "skills/grafana-cloud/synthetic-monitoring-checks", "devops")
pack_skill("tartinerlabs", "plugins/workflow/skills/github-actions", "devops")
pack_skill("kwp", "engineering/skills/incident-response", "devops")

# ---- FinOps ----
pack_skill("aws", "skills/core-skills/aws-billing-and-cost-management", "finops")
pack_skill("google", "skills/cloud/gke-cost-optimization", "finops")
pack_skill("google", "skills/cloud/gke-cost-analysis", "finops")
pack_skill("azure", ".github/plugins/azure-cost/skills/cost-optimization", "finops", folder="azure-cost-optimization")
pack_skill("infracost", "plugins/infracost/skills/scan", "finops", folder="infracost-scan")

# ---- Data engineering ----
pack_skill("dbt", "skills/dbt/skills/using-dbt-for-analytics-engineering", "data-engineering")
pack_skill("dbt", "skills/dbt/skills/adding-dbt-unit-test", "data-engineering")
pack_skill("dbt", "skills/dbt/skills/running-dbt-commands", "data-engineering")
pack_skill("astronomer", "skills/authoring-dags", "data-engineering")
pack_skill("astronomer", "skills/testing-dags", "data-engineering")
pack_skill("astronomer", "skills/debugging-dags", "data-engineering")
pack_skill("astronomer", "skills/migrating-airflow-2-to-3", "data-engineering")
pack_skill("kwp", "data/skills/sql-queries", "data-engineering")
pack_skill("kwp", "data/skills/explore-data", "data-engineering")
pack_skill("jeffallan", "skills/spark-engineer", "data-engineering")
pack_skill("supabase", "skills/supabase-postgres-best-practices", "data-engineering")
pack_skill("wshobson", "plugins/data-engineering/skills/data-quality-frameworks", "data-engineering")

# ---- Data visualization ----
pack_skill("kwp", "data/skills/data-visualization", "dataviz")
pack_skill("kwp", "data/skills/build-dashboard", "dataviz")
pack_skill("kwp", "data/skills/create-viz", "dataviz")
pack_skill("kdense", "skills/scientific-visualization", "dataviz", strip_tail="## Citing Scientific Agent Skills")
pack_skill("grafana", "skills/grafana-core/dashboarding", "dataviz")

# ---- ML engineering ----
pack_skill("wshobson", "plugins/llm-finetuning/skills/finetuning-method-selection", "ml-engineering")
pack_skill("wshobson", "plugins/llm-finetuning/skills/eval-harness-first", "ml-engineering")
pack_skill("wshobson", "plugins/llm-finetuning/skills/lora-qlora-recipes", "ml-engineering")
pack_skill("wshobson", "plugins/llm-application-dev/skills/rag-implementation", "ml-engineering")
pack_skill("huggingface", "skills/trl-training", "ml-engineering")
pack_skill("huggingface", "skills/hf-cli", "ml-engineering")
pack_skill("orchestra", "12-inference-serving/vllm", "ml-engineering", folder="serving-llms-vllm")
pack_skill("orchestra", "11-evaluation/lm-evaluation-harness", "ml-engineering", folder="evaluating-llms-harness")
BSD3_TEXT = """Redistribution and use in source and binary forms, with or without modification, are permitted provided
that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the
   following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
   following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or
   promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE."""
pack_skill("kdense", "skills/scikit-learn", "ml-engineering", strip_tail="## Citing Scientific Agent Skills",
           license_note="Le depot K-Dense-AI/claude-scientific-skills est sous licence MIT (LICENSE ci-joint). Cette "
                        "skill declare dans son frontmatter la licence BSD-3-Clause, celle de scikit-learn dont elle "
                        "decrit la documentation (Copyright (c) The scikit-learn developers). Les deux licences sont "
                        "permissives ; conserver les deux notices en cas de redistribution. Texte de la licence "
                        "BSD-3-Clause :\n\n" + BSD3_TEXT)
pack_skill("mlflow", "instrumenting-with-mlflow-tracing", "ml-engineering")

# ---- Full stack ----
VERCEL_NOTE = ("Licence MIT declaree par l'auteur (Vercel) dans le frontmatter de la skill ; le depot "
               "vercel-labs/agent-skills ne contient pas de fichier de licence au commit importe.")
pack_skill("vercel-labs", "skills/react-best-practices", "fullstack", folder="vercel-react-best-practices",
           license_note=VERCEL_NOTE)
pack_skill("vercel-labs", "skills/composition-patterns", "fullstack", folder="vercel-composition-patterns",
           license_note=VERCEL_NOTE)

# ---- Design (anti AI-slop) ----
pack_skill("impeccable", ".claude/skills/impeccable", "ui-design", exclude=["scripts"])
pack_skill("anthropic-skills", "skills/frontend-design", "ui-design")
# vercel-labs' web-design-guidelines skill has no license: not imported. The guidelines themselves (MIT) serve
# the in-house ui-review skill, with their license next to them.
add("wig", "command.md", "plugins/ui-design/skills/ui-review/references/web-interface-guidelines.md")
pack_skill("ibelick", "skills/baseline-ui", "ui-design")
pack_skill("emilkowalski", "skills/break-ui", "ui-design")
pack_skill("emilkowalski", "skills/emil-design-eng", "ui-design")
pack_skill("taste", "skills/redesign-skill", "ui-design", folder="redesign-existing-projects")

# ---- Regulatory / compliance (GDPR, accessibility, legal) ----
pack_skill("etalab", "skills/rgaa", "compliance")
pack_skill("etalab", "skills/securite-developpement", "compliance")
pack_skill("awesome-copilot", "skills/gdpr-compliant", "compliance")
pack_skill("sushegaad", "plugins/gdpr-compliance/skills/gdpr-compliance", "compliance")
pack_skill("sushegaad", "plugins/wcag/skills/wcag", "compliance")
pack_skill("kwp", "legal/skills/compliance-check", "compliance")
pack_skill("ibelick", "skills/fixing-accessibility", "compliance")

# ---- Motion design ----
add("gsap", "skills", "plugins/motion-design/skills", license_to="plugins/motion-design")
pack_skill("lottiefiles", "skills/motion-design", "motion-design", folder="lottie-motion-design")
pack_skill("manim", "skills/manimce-best-practices", "motion-design")
pack_skill("manim", "skills/manim-composer", "motion-design")

# ---- Video editing ----
add("video-use", "SKILL.md", "plugins/video-editing/skills/video-use/SKILL.md")
add("video-use", "helpers", "plugins/video-editing/skills/video-use/helpers", license=False)
pack_skill("video-use", "skills/manim-video", "video-editing")
add("ffmpeg", ".", "plugins/video-editing/skills/ffmpeg-video-editor", exclude=["README.md", ".github"])
add("faster-whisper", ".", "plugins/video-editing/skills/faster-whisper",
    exclude=["setup.ps1", "setup.sh", "README.md", "CHANGELOG.md", ".github"])

# ---- Product management (discovery, strategy, PRD, backlog, reverse spec) ----
# phuryn skills end with a "Further Reading" block and a few inline links to the author's newsletter.
PHURYN = {
    "pm-execution": ["create-prd", "user-stories", "job-stories", "outcome-roadmap", "pre-mortem",
                     "prioritization-frameworks", "sprint-plan", "release-notes", "test-scenarios", "retro",
                     "strategy-red-team", "stakeholder-map", "brainstorm-okrs"],
    "pm-product-discovery": ["opportunity-solution-tree", "identify-assumptions-new", "identify-assumptions-existing",
                             "prioritize-assumptions", "prioritize-features", "interview-script",
                             "summarize-interview", "analyze-feature-requests", "brainstorm-ideas-new",
                             "brainstorm-ideas-existing", "brainstorm-experiments-new",
                             "brainstorm-experiments-existing", "metrics-dashboard"],
    "pm-product-strategy": ["product-vision", "product-strategy", "lean-canvas", "business-model",
                            "monetization-strategy", "pricing-strategy", "value-proposition", "swot-analysis"],
    "pm-market-research": ["competitor-analysis", "market-sizing", "market-segments", "user-personas",
                           "customer-journey-map"],
    # value-prop-statements is left out: the copywriting skill of growth-ads covers marketing copy.
    "pm-marketing-growth": ["north-star-metric", "product-name", "positioning-ideas"],
    "pm-ai-shipping": ["shipping-artifacts", "intended-vs-implemented"],
}
for plugin, skills in PHURYN.items():
    for skill in skills:
        pack_skill("phuryn", f"{plugin}/skills/{skill}", "product-management",
                   strip_tail="### Further Reading", drop_lines=r"productcompass\.pm")
add("schematic", "SKILL.md", "plugins/product-management/skills/schematic/SKILL.md")
pack_skill("alirezarezvani", "product-team/code-to-prd/skills/code-to-prd", "product-management")

# ---- Greenfield: clean-room behavioral specs from an existing codebase (whole plugin, namespaced) ----
add("greenfield", "skills", "plugins/greenfield/skills", license_to="plugins/greenfield", exclude=[".gitkeep"])
# The upstream analyzer preloads all 21 skills (about 500 kB) on every dispatch although each dispatch prompt
# names the one skill to follow: load that skill on demand instead.
add("greenfield", "agents", "plugins/greenfield/agents", license=False, exclude=[".gitkeep"], replace=[
    ["analyzer.md", r"^skills: greenfield:.*\n", ""],
    ["analyzer.md", r" Loads all analysis skills\.$", " Loads the one skill its prompt names."],
    ["analyzer.md", r"^(tools: .*)$", r"\1, Skill"],
    ["analyzer.md", r"^Follow the specified skill\.",
     "Load the specified skill with the Skill tool before starting (`greenfield:<skill-name>`, for example "
     "`greenfield:source-analysis`), plus `greenfield:provenance-methodology` when you write behavioral claims. "
     "Load no other skill unless that methodology points to it. Follow the specified skill."],
])

# ---- Mobile, split per stack so a project only enables what it builds with ----
# Every expo skill ends with a "Submitting Feedback" footer that runs an unpinned npx package (telemetry).
for skill in ["expo-overview", "expo-project-structure", "expo-router", "expo-native-ui", "expo-ui",
              "expo-design-system", "expo-animation", "expo-data-fetching", "expo-dev-client", "expo-module",
              "expo-upgrade", "expo-brownfield", "expo-web-to-native", "expo-dom", "expo-examples",
              "eas-app-stores", "eas-update", "eas-workflows"]:
    pack_skill("expo", f"plugins/expo/skills/{skill}", "mobile-expo", strip_tail="## Submitting Feedback")
pack_skill("callstack", "skills/react-native-best-practices", "mobile-expo", exclude=["*.png"])
pack_skill("callstack", "skills/upgrading-react-native", "mobile-expo")
pack_skill("callstack", "skills/react-navigation", "mobile-expo")
pack_skill("rntl", "skills/react-native-testing", "mobile-expo")

# twostraws: the outer folder holds real reference files (the inner skills/ copy uses a symlink).
for source, skill in [("swiftui-pro", "swiftui-pro"), ("swift-concurrency-pro", "swift-concurrency-pro"),
                      ("swift-testing-pro", "swift-testing-pro"), ("swiftdata-pro", "swiftdata-pro")]:
    pack_skill(source, skill, "mobile-ios", exclude=[".claude-plugin", "agents", "assets", "skills"])
pack_skill("dadederk", "ios-accessibility", "mobile-ios", exclude=["agents"])

for path in ["build-system/agp/agp-9-upgrade", "jetpack-compose/jetpack-compose-performance",
             "jetpack-compose/adaptive", "jetpack-compose/migration/migrate-xml-views-to-jetpack-compose",
             "jetpack-compose/theming/styles", "navigation/navigation-3", "system/edge-to-edge",
             "performance/r8-analyzer", "performance/anr-audit-and-fix", "testing/testing-setup",
             "play/play-billing-library-version-upgrade", "play/play-policy-insights",
             "security/android-intent-security", "security/android-permissions-security"]:
    pack_skill("android", path, "mobile-android")
# Generic upstream names (security, testing, setup) get a play-billing- prefix.
for skill, folder in [("integrating-pbl", "play-billing-integration"), ("purchase-flow", "play-billing-purchase-flow"),
                      ("one-time-products", "play-billing-one-time-products"),
                      ("subscriptions", "play-billing-subscriptions"),
                      ("subscription-states", "play-billing-subscription-states"), ("rtdn", "play-billing-rtdn"),
                      ("backend-architecture", "play-billing-backend"), ("security", "play-billing-security"),
                      ("error-handling", "play-billing-errors"), ("testing", "play-billing-testing")]:
    pack_skill("play-billing", f"google-play/{skill}", "mobile-android", folder=folder)

for skill in ["flutter-apply-architecture-best-practices", "flutter-build-responsive-layout",
              "flutter-fix-layout-issues", "flutter-setup-declarative-routing", "flutter-setup-localization",
              "flutter-implement-json-serialization", "flutter-use-http-package", "flutter-add-widget-test",
              "flutter-add-widget-preview", "flutter-add-integration-test", "dart-add-unit-test",
              "dart-fix-runtime-errors", "dart-run-static-analysis", "dart-resolve-package-conflicts"]:
    pack_skill("flutter", f"skills/{skill}", "mobile-flutter")

# ---- Stores, split per store; App Store Connect and Play Console through their CLIs first ----
for skill in ["asc-cli-usage", "asc-id-resolver", "asc-release-flow", "asc-submission-health",
              "asc-testflight-orchestration", "asc-signing-setup", "asc-xcode-build", "asc-build-lifecycle",
              "asc-metadata-sync", "asc-localize-metadata", "asc-whats-new-writer", "asc-screenshot-resize",
              "asc-shots-pipeline", "asc-app-create-ui", "asc-crash-triage", "asc-ppp-pricing"]:
    pack_skill("asc", f"skills/{skill}", "store-apple")
add("preflight", ".", "plugins/store-apple/skills/app-store-preflight", exclude=["README.md", ".github"])
pack_skill("rshankras", "skills/legal/privacy-policy", "store-apple")
pack_skill("rshankras", "skills/legal/privacy-publish", "store-apple")

for skill in ["gplay-cli-usage", "gplay-gradle-build", "gplay-release-flow", "gplay-rollout-management",
              "gplay-testers-orchestration", "gplay-metadata-sync", "gplay-screenshot-automation",
              "gplay-submission-checks", "gplay-preflight", "gplay-iap-setup", "gplay-ppp-pricing",
              "gplay-vitals-monitoring"]:
    pack_skill("gplay", f"skills/{skill}", "store-google")
# playstore-review reads ../../references/play-policy-summary.md relative to its own folder.
pack_skill("devsemih", "skills/playstore-review", "store-google")
add("devsemih", "references/play-policy-summary.md", "plugins/store-google/references/play-policy-summary.md",
    license=False)

pack_skill("screenshots", "skills/app-store-screenshots", "store-aso")
for skill in ["app-marketing-context", "aso-audit", "keyword-research", "metadata-optimization",
              "screenshot-optimization", "app-preview-video", "app-icon-optimization", "custom-product-pages",
              "in-app-events", "ab-test-store-listing", "app-rejection-recovery", "review-management",
              "rating-prompt-strategy"]:
    pack_skill("appeeky", f"skills/{skill}", "store-aso")
pack_skill("appeeky", "skills/localization", "store-aso", folder="store-localization")
# The upstream vendor sells a keyword API; keep the method, drop the product pointer and its API calls.
APPEEKY_API_BLOCK = r"\n?```bash\nGET /v1/keywords/[\s\S]*?```\n"
pack_skill("appeeky", "skills/android-aso", "store-aso", replace=[
    ["SKILL.md", r"^Use Appeeky keyword tools, then adapt for Play:\n" + APPEEKY_API_BLOCK,
     "Research keywords with the keyword-research skill, then adapt for Play:\n"],
])
add("greenfield", "commands", "plugins/greenfield/commands", license=False, exclude=[".gitkeep"])

# ---- Growth, split per channel; every marketingskills skill reads the context written by product-marketing ----
# Left out: duplicates of other packs (aso, pricing, competitors, customer-research) and B2B sales
# skills (cold-email, prospecting, sales-enablement, revops). Partner-marked tools keep their disclosure.
GROWTH = {
    "growth": ["product-marketing", "launch", "marketing-plan", "public-relations"],
    "growth-seo": ["seo-audit", "ai-seo", "schema", "programmatic-seo", "site-architecture", "content-strategy",
                   "link-building"],
    "growth-ads": ["ads", "copywriting", "copy-editing", "marketing-psychology", "image", "video"],
    "growth-social": ["social", "influencer-marketing", "community-marketing"],
    "growth-analytics": ["analytics", "attribution", "conversion-tracking", "ab-testing"],
    "growth-cro": ["cro", "signup", "onboarding", "paywalls", "popups", "emails", "sms", "churn-prevention",
                   "referrals", "lead-magnets"],
}
for pack, skills in GROWTH.items():
    for skill in skills:
        pack_skill("marketingskills", f"skills/{skill}", pack)
# The maintainer's sales pitch for his own paid agent; the self-serve alternative it ends with is kept.
pack_skill("marketingskills", "skills/ad-creative", "growth-ads", replace=[
    ["SKILL.md", r"^> \*\*Skip the plumbing\.\*\*[\s\S]*?^> To run the pull yourself instead, use",
     "> To run the pull yourself, use"],
])
pack_skill("appeeky", "skills/apple-search-ads", "growth-ads", replace=[
    ["SKILL.md", r"^Use Appeeky to validate volume and difficulty:\n" + APPEEKY_API_BLOCK,
     "Validate volume and difficulty with Apple Ads search popularity and the keyword-research skill.\n"],
])
pack_skill("appeeky", "skills/ua-campaign", "growth-ads")
pack_skill("appeeky", "skills/attribution-setup", "growth-analytics")
pack_skill("appeeky", "skills/web-to-app-funnel", "growth-cro")


def main() -> None:
    manifest = {
        "sources": {name: {"repo": repo, "commit": commit, "license": lic, "license_files": files}
                    for name, (repo, commit, lic, files) in SOURCES.items()},
        "imports": imports,
    }
    (ROOT / "vendor.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(SOURCES)} sources, {len(imports)} imports written to vendor.json")


if __name__ == "__main__":
    main()
