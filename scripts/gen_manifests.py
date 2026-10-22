"""Generate every plugin.json, the bundle meta-plugins, the marketplaces and the pack catalog.

Run after scripts/vendor.py. The plugin list below is the source of truth for the catalog:
descriptions, hook wiring, and which plugins each bundle pulls in.

Two marketplaces are written from the same packs:
- .claude-plugin/ (marketplace.json, and plugin.json per pack): Claude Code, and the harnesses that read
  Claude plugins (Codex, GitHub Copilot, Junie, Factory Droid, Qwen Code, npx skills).
- .cursor-plugin/ (same layout): Cursor. Its hooks point at a Cursor-format file, never at the Claude
  hooks/hooks.json that Cursor would otherwise load by default.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# name: (description, extra plugin.json fields)
PLUGINS = {
    "ponytail": ("Lazy senior developer mode: the smallest complete change, reuse before writing, YAGNI. Activation hooks (/ponytail lite|full|ultra) and review and audit commands.",
                 {"hooks": "./hooks/claude-codex-hooks.json"}),
    "superpowers": ("obra's working method: brainstorming, writing plans, TDD, systematic debugging, subagents, verification before concluding. Loads its method at session start.",
                    {"hooks": "./hooks/hooks.json"}),
    "agent-skills": ("Full software lifecycle (Addy Osmani): spec, plan, build, test, review, security, performance, CI/CD, observability, release. Cross-cutting base for full stack and devops.", {}),
    "skill-factory": ("Create, test and improve skills and MCP servers (Anthropic's skill-creator and mcp-builder).", {}),
    "rea": ("Reverse Engineer Anything: binaries, Electron/JS apps, Android, firmware, browser. Drives the rea-agents MCP server (installed separately).", {}),
    "security": ("Application audit and security review: in-house method (evidence, severity, design pitfalls), OWASP Top 10 and ASVS, code audit and diff review, Semgrep and CodeQL, variant analysis, supply chain, threat model, risky APIs, skill scanning.", {}),
    "sec-audit": ("Code audit and vulnerability research (trilwu secskills-core): taint analysis of source, reversing binaries and apps, crypto, supply chain, security of AI systems and MCP servers. Authorized use only.", {}),
    "sec-defense": ("Defense and incident response (trilwu secskills-defense): disk/memory/network DFIR, malware and phishing analysis, Sigma and Yara detections, cloud hardening and investigation (AWS, Azure, GCP, M365), threat hunting.", {}),
    "sec-offense": ("Pentest for authorized testing only (trilwu secskills-offense): web/API/JWT/SSRF/XXE exploitation, Active Directory and Entra, cloud and containers, privilege escalation, reconnaissance. Reserved for authorized engagements, CTFs and research.", {}),
    "team-conventions": ("Cross-cutting team working conventions: verify rather than trust, ask before a large batch, multiple-choice questions, languages, no em dash, AI marker, technical terms in full, main/replica, secrets out of the code.", {}),
    "monitoring": ("The most complete monitoring for the project type (web app, API, RAG/LLM, data pipeline, cron, ML training and serving, mobile): metrics, logs, traces, SLOs, alerts, dashboards, cost, and domain signals (LLMOps, MLOps, data). Vendor-neutral (OpenTelemetry, Prometheus, Grafana).", {}),
    "prod-testing": ("End-to-end test strategy and production validation, vendor-neutral: CI/CD pyramid and stages (unit, contract, integration, end to end, smoke, canary), post-deploy smoke tests, progressive delivery with automatic rollback, feature flags (OpenFeature), synthetic monitoring, flaky tests.", {}),
    "devops": ("DevOps and SRE: Terraform/OpenTofu, Docker, Kubernetes, GitOps, CI/CD pipelines and GitHub Actions, SLOs and error budgets, PromQL, k6, synthetic monitoring, incident response and postmortems.", {}),
    "finops": ("Multi-cloud FinOps: AWS cost analysis and optimization (Cost Explorer, SP/RI), GKE/Google Cloud, Azure, and shift-left cost scanning of infrastructure as code (Infracost).", {}),
    "data-engineering": ("Data engineering: dbt models and tests, Airflow DAGs (writing, testing, debugging, 2 to 3 migration), multi-dialect SQL, data exploration, PySpark, Postgres, data quality.", {}),
    "dataviz": ("Data visualization: choosing the chart type, matplotlib/seaborn/plotly, self-contained HTML dashboards, accessible scientific figures, Grafana dashboards.", {}),
    "ml-engineering": ("ML engineering: choosing a fine-tuning method, LoRA/QLoRA recipes, evaluation harnesses and LLM judge calibration, TRL, RAG, vLLM serving, lm-eval benchmarks, scikit-learn, MLflow tracing, Hugging Face Hub.", {}),
    "fullstack": ("Production full stack web: 70 React and Next.js performance rules, React 19 composition patterns. Combines with the agent-skills pack (APIs, security, performance, delivery).", {}),
    "ui-design": ("Design that does not look vibe-coded: anti AI-slop system (impeccable), art direction and the list of AI tells (frontend-design), Vercel's Web Interface Guidelines, deslop constraints, UI stress tests, redesign of generic sites.", {}),
    "compliance": ("Regulation and compliance: RGAA audit (French accessibility standard), GDPR rules for engineering, WCAG advice and legal mapping (EAA), feature compliance check, secure development (ANSSI), code-level accessibility fixes. French law: CNIL, cookies, legal notices and terms.", {}),
    "motion-design": ("Motion design: GSAP (core, timeline, ScrollTrigger, plugins, performance, frameworks), framework-agnostic motion principles (LottieFiles), Manim mathematical animations (ManimCE and scene planning).", {}),
    "video-editing": ("Complete video editing: conversational editing with EDL and subtitles (video-use), building FFmpeg commands (cut, concat, transitions, loudness, social media presets), local faster-whisper transcription, Manim rendering.", {}),
    "app-factory": ("End-to-end project orchestrator: from an idea, an app to clone and personalize, or an existing app to finish, to the finished product in production. 18 subagents (product, project management, architecture, data, design, security, compliance, finops, dev, review, QA, release, SRE, growth, verifier), phases and validation gates, state on disk and resume, autopilot mode (scheduled wakeups, only vision decisions raised as GitHub issues).", {}),
    "product-management": ("Product management: discovery (assumptions, opportunity solution tree, interviews), strategy (vision, positioning, business model, pricing), market (competition, personas, segments), execution (PRD, user stories, roadmap, pre-mortem, sprint, retro, release notes), reverse specification of existing code (code-to-prd, schematic, intended-vs-implemented).", {}),
    "mobile": ("Cross-platform mobile, written in-house: iOS and Android release (signing, versions, TestFlight, Play tracks, fastlane, EAS), OWASP MASVS security, push notifications, deep links, end-to-end tests (Maestro, Detox), mobile accessibility, in-app purchases without a third-party service.", {}),
    "mobile-expo": ("Expo and React Native: official Expo skills (router, native UI, design system, modules, upgrade, EAS Build/Submit/Update/Workflows, web to native migration), React Native performance and upgrade and React Navigation (Callstack), React Native Testing Library tests.", {}),
    "mobile-ios": ("Native iOS: SwiftUI, Swift concurrency, Swift Testing, SwiftData (Paul Hudson), iOS accessibility (VoiceOver, Dynamic Type).", {}),
    "mobile-android": ("Native Android: official Google skills (Compose performance and adaptive layouts, XML to Compose migration, Navigation 3, edge-to-edge, AGP 9, R8, ANR, testing, intent and permission security, Play policies) and Google Play Billing (RevenueCat, independent of their service).", {}),
    "mobile-flutter": ("Flutter and Dart: official skills (architecture, responsive layout, declarative routing, localization, JSON serialization, HTTP, widget and integration tests, static analysis, runtime errors).", {}),
    "app-stores": ("Stores, written in-house: App Store and Google Play listing kit within each store's limits, Data safety form from the code and SDKs, driving the consoles in the browser for what the APIs do not cover.", {}),
    "store-apple": ("App Store Connect through the asc CLI (signing, build, TestFlight, release, metadata, screenshots, pricing, crashes), App Review rejection prevention (preflight per app type), privacy policy and Apple privacy labels.", {}),
    "store-google": ("Google Play through the gplay CLI (Gradle build, release, staged rollout, testers, metadata, screenshots, pre-submission checks, purchases, pricing, vitals) and Google Play policy audit from the code.", {}),
    "store-aso": ("App Store Optimization for both stores: audit, keywords, metadata, screenshots (Next.js generator included), preview video, icon, custom product pages, events, listing A/B tests, localization, reviews and ratings, handling rejections.", {}),
    "growth": ("Growth base: product context shared by every marketing skill, marketing plan, launch, press relations; written in-house: app install campaigns, creative and video production, social media publishing, marketing compliance for France and the EU.", {}),
    "growth-seo": ("Site SEO: technical and on-page audit, AI search (GEO), structured data, programmatic SEO, site architecture, content strategy, link building.", {}),
    "growth-ads": ("Paid advertising: Google, Meta, TikTok, LinkedIn strategy, ad creatives, copywriting and editing, psychology, marketing images and videos, Apple Ads, app acquisition campaigns.", {}),
    "growth-social": ("Social media: strategy and content per platform, influencer and creator marketing, community management.", {}),
    "growth-analytics": ("Marketing measurement: tracking plan and GA4, UTMs, attribution, conversion tracking (GTM, conversion APIs), A/B tests, mobile attribution (MMP, SKAdNetwork).", {}),
    "growth-cro": ("Conversion and retention: page CRO, signup, onboarding, paywalls, popups, lifecycle emails and SMS, churn, referral, lead magnets, web to app funnel.", {}),
    "ci-forge": ("CI/CD generated for the stack and target architecture: lint, format, typing, tests and coverage, Playwright end to end, build, containers (hadolint, Trivy), Kubernetes (kubeconform, kind), IaC, security (gitleaks, osv-scanner, CodeQL or Semgrep), SBOM and provenance, staging and prod, actions pinned by SHA, required check ci-ok.", {}),
    "guardrails": ("Guardrails enforced by hooks, configurable rule by rule: no em dash or unrequested emoji, no push to main or git hook bypass, no secret or .env in git, Conventional Commits, AI marker, production credentials golden rule. Also installable in a project for the cloud, the team and other coding agents.",
                   {"hooks": "./hooks/hooks.json"}),
    "ultime-profile": ("Entry point: installs and manages, for each project, only the useful ultime-skill packs (project detection, project-level install, disabling the rest, adjusting when the task changes). Catalog of packs with their context cost.", {}),
    "greenfield": ("Clean-room reverse engineering: extracts behavioral specs, test vectors and acceptance criteria from existing code without inheriting its implementation (/greenfield:analyze command). Heavy agent pipeline, for code you own the rights to.", {}),
}

# sec-offense (authorized pentest) is never pulled in by a bundle: it is installed explicitly only.
GATED = {"sec-offense"}
BUNDLES = {
    "ultime-starter": ("One-command start: the ultime-profile entry point (which then installs only the useful packs per project), the guardrails and the ponytail method.",
                       ["guardrails", "ponytail"]),
    "ultime-all": ("All of ultime-skill in one command: installs every pack except offensive pentest.",
                   [name for name in PLUGINS if name not in GATED]),
    "ultime-dev": ("Developer pack: ponytail, superpowers, software lifecycle, skill factory, devops, full stack, security, team conventions, testing in production.",
                   ["ponytail", "superpowers", "agent-skills", "skill-factory", "devops", "fullstack", "security", "team-conventions", "prod-testing", "guardrails", "ci-forge"]),
    "ultime-data": ("Data pack: data engineering, data visualization, ML engineering.",
                    ["data-engineering", "dataviz", "ml-engineering"]),
    "ultime-media": ("Creative pack: anti AI-slop design, motion design, video editing.",
                     ["ui-design", "motion-design", "video-editing"]),
    "ultime-security": ("Defensive security pack: security audit and review, code audit, defense and incident response, reverse engineering.",
                        ["security", "sec-audit", "sec-defense", "rea"]),
    "ultime-web": ("Web pack: full stack, design, compliance (GDPR, accessibility, legal).",
                   ["fullstack", "ui-design", "compliance"]),
    "ultime-ops": ("Operations pack: devops/SRE, finops, complete monitoring and testing in production.", ["devops", "finops", "monitoring", "prod-testing", "ci-forge"]),
    "ultime-mobile": ("Mobile pack: cross-platform, Expo and React Native, iOS, Android, Flutter, stores (listing, Data safety, App Store Connect, Google Play, ASO), design, compliance and security.",
                      ["mobile", "mobile-expo", "mobile-ios", "mobile-android", "mobile-flutter", "app-stores",
                       "store-apple", "store-google", "store-aso", "ui-design", "compliance", "security"]),
    "ultime-growth": ("Growth pack: marketing base, SEO, advertising and creatives, social media, measurement and attribution, conversion and retention, ASO, video production.",
                      ["growth", "growth-seo", "growth-ads", "growth-social", "growth-analytics", "growth-cro",
                       "store-aso", "video-editing", "motion-design"]),
    "ultime-factory": ("Product factory: the app-factory orchestrator and everything it drives (product management, reverse specification, software lifecycle, full stack, mobile and stores, growth, design, compliance, security, devops, data, monitoring, testing in production, finops). Combine with ultime-profile to enable only what each project needs.",
                       ["app-factory", "guardrails", "ci-forge", "product-management", "greenfield", "agent-skills", "fullstack", "ui-design",
                        "compliance", "security", "devops", "data-engineering", "monitoring", "prod-testing", "finops",
                        "mobile", "mobile-expo", "mobile-ios", "mobile-android", "mobile-flutter", "app-stores",
                        "store-apple", "store-google", "store-aso", "growth", "growth-seo", "growth-ads",
                        "growth-social", "growth-analytics", "growth-cro", "video-editing", "motion-design"]),
}


# Every bundle also pulls in ultime-profile, the skill that trims a project down to the packs it needs.
for _, members in BUNDLES.values():
    if "ultime-profile" not in members:
        members.append("ultime-profile")

AUTHOR = {"name": "Lucas-lux", "url": "https://github.com/Lucas-lux"}
MARKETPLACE_DESCRIPTION = "Production-ready skills, subagents and guardrails for AI coding agents: end-to-end project orchestration, product management, mobile and stores, growth and marketing, security, devops, finops, data, ML, full stack, design, compliance, motion and video."
CATALOG = ROOT / "plugins" / "ultime-profile" / "skills" / "ultime-profile" / "references" / "catalog.md"
# Cursor hook file of the guardrails; Cursor expands ${CLAUDE_PLUGIN_ROOT} for plugins.
CURSOR_GUARDRAILS_HOOKS = {"version": 1, "hooks": {"preToolUse": [{"command": 'node "${CLAUDE_PLUGIN_ROOT}/runtime/guard.cjs" --harness cursor'}]}}


def description(path: Path) -> str:
    """Return the frontmatter description of a SKILL.md or agent file, folded blocks included."""
    match = re.match(r"^---\r?\n(.*?)\r?\n---", path.read_text(encoding="utf-8"), re.DOTALL)
    found = re.search(r"(?m)^description:[ \t]*(.*)$((?:\n[ \t]+.*)*)", match.group(1)) if match else None
    if not found:
        return ""
    head = found.group(1).strip()
    head = "" if head in (">", "|", ">-", "|-") else head.strip("\"'")
    return " ".join([head, *(line.strip() for line in found.group(2).splitlines())]).strip()


def listing_cost(name: str) -> tuple[int, int, int]:
    """Skills, agents and description characters a pack adds to the context listing of every session."""
    directory = ROOT / "plugins" / name
    skills = list(directory.glob("skills/*/SKILL.md"))
    agents = list(directory.glob("agents/*.md"))
    return len(skills), len(agents), sum(len(description(path)) for path in skills + agents)


def write_catalog() -> None:
    costs = {name: listing_cost(name) for name in PLUGINS}
    lines = [
        "# ultime-skill pack catalog",
        "",
        "Generated by `scripts/gen_manifests.py`. The cost is the length of the skill and agent descriptions",
        "an enabled pack adds to the context of every session (about 4 characters per token).",
        "",
        "| Pack | Skills | Agents | Cost (characters) | Role |",
        "|---|---|---|---|---|",
    ]
    for name, (text, _) in PLUGINS.items():
        skills, agents, chars = costs[name]
        lines.append(f"| `{name}` | {skills} | {agents} | {chars} | {text.replace('|', '/')} |")
    lines += ["", "## Bundles", "", "| Bundle | Cost (characters) | Packs |", "|---|---|---|"]
    for name, (_, members) in BUNDLES.items():
        lines.append(f"| `{name}` | {sum(costs[m][2] for m in members)} | {', '.join(members)} |")
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    for name, (_, members) in BUNDLES.items():
        print(f"{name:>16}  {sum(costs[m][2] for m in members):>7} description characters per session")


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_plugin(name: str, text: str, extra: dict) -> None:
    directory = ROOT / "plugins" / name
    write_json(directory / ".claude-plugin" / "plugin.json", {"name": name, "description": text, "author": AUTHOR, **extra})
    if "dependencies" in extra:
        return  # Bundles are a Claude Code feature: Cursor's marketplace lists the packs only.
    # Cursor: explicit component paths, and a hooks file in Cursor's format (an empty one when the pack
    # has none for Cursor), so it never loads a Claude-format hooks/hooks.json.
    cursor = {"name": name, "description": text, "author": AUTHOR}
    for component in ("skills", "agents", "commands"):
        if (directory / component).is_dir():
            cursor[component] = f"./{component}/"
    write_json(directory / ".cursor-plugin" / "hooks.json", CURSOR_GUARDRAILS_HOOKS if name == "guardrails" else {"version": 1, "hooks": {}})
    cursor["hooks"] = "./.cursor-plugin/hooks.json"
    write_json(directory / ".cursor-plugin" / "plugin.json", cursor)


def main() -> None:
    entries = []
    for name, (text, extra) in PLUGINS.items():
        write_plugin(name, text, extra)
        entries.append({"name": name, "source": f"./plugins/{name}", "description": text})
    for name, (text, members) in BUNDLES.items():
        write_plugin(name, text, {"dependencies": members})
        entries.append({"name": name, "source": f"./plugins/{name}", "description": text})

    write_json(ROOT / ".claude-plugin" / "marketplace.json", {
        "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
        "name": "ultime-skill",
        "description": MARKETPLACE_DESCRIPTION,
        "owner": AUTHOR,
        "plugins": entries,
    })
    write_json(ROOT / ".cursor-plugin" / "marketplace.json", {
        "name": "ultime-skill",
        "description": MARKETPLACE_DESCRIPTION,
        "owner": AUTHOR,
        "plugins": entries[:len(PLUGINS)],
    })
    print(f"{len(PLUGINS)} plugins, {len(BUNDLES)} bundles, marketplaces written (Claude Code and Cursor)")
    write_catalog()


if __name__ == "__main__":
    main()
