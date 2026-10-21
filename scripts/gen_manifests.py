"""Generate every plugin.json, the bundle meta-plugins, and the marketplace.json.

Run after scripts/vendor.py. The plugin list below is the source of truth for the catalog:
descriptions (loaded into context each session), hook wiring, and which plugins each bundle pulls in.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# name: (description, extra plugin.json fields)
PLUGINS = {
    "ponytail": ("Mode dev senior paresseux : le plus petit changement complet, reutilisation avant ecriture, YAGNI. Hooks d'activation (/ponytail lite|full|ultra) et commandes de revue et d'audit.",
                 {"hooks": "./hooks/claude-codex-hooks.json"}),
    "superpowers": ("Methode de travail d'obra : brainstorming, redaction de plans, TDD, debug systematique, sous-agents, verification avant de conclure. Charge sa methode au demarrage de session.",
                    {"hooks": "./hooks/hooks.json"}),
    "agent-skills": ("Cycle de vie logiciel complet (Addy Osmani) : spec, plan, build, test, revue, securite, performance, CI/CD, observabilite, mise en prod. Base transverse full stack et devops.", {}),
    "skill-factory": ("Creer, tester et ameliorer des skills et des serveurs MCP (skill-creator et mcp-builder d'Anthropic).", {}),
    "rea": ("Reverse Engineer Anything : binaires, apps Electron/JS, Android, firmware, navigateur. Pilote le serveur MCP rea-agents (a installer a part).", {}),
    "graphify": ("Transforme un depot ou un dossier en graphe de connaissances interrogeable. Pilote le paquet Python graphifyy (a installer a part).", {}),
    "security": ("Audit d'application et revue de securite : OWASP Top 10 et ASVS, revue de diff orientee risque, Semgrep et CodeQL, analyse de variantes, chaine d'approvisionnement, modele de menace, APIs a risque, scan de skills.", {}),
    "sec-audit": ("Audit de code et recherche de vulnerabilites (trilwu secskills-core) : analyse de source par taint, reverse de binaires et d'apps, crypto, supply chain, securite des systemes IA et des serveurs MCP. Pour usage autorise uniquement.", {}),
    "sec-defense": ("Defense et reponse a incident (trilwu secskills-defense) : DFIR disque/memoire/reseau, analyse de malware et de phishing, detections Sigma et Yara, durcissement et investigation cloud (AWS, Azure, GCP, M365), threat hunting.", {}),
    "sec-offense": ("Pentest pour tests autorises uniquement (trilwu secskills-offense) : exploitation web/API/JWT/SSRF/XXE, Active Directory et Entra, cloud et conteneurs, escalade de privileges, reconnaissance. Reserve aux engagements autorises, CTF et recherche.", {}),
    "sc-conventions": ("Conventions d'equipe SensCritique transverses : verifier plutot que croire, demander avant un gros lot, questions a choix multiples, langues, pas d'em dash, marquage IA, termes techniques en entier, main/replica, secrets hors du code. Regles generiques, rien de confidentiel.", {}),
    "monitoring": ("Mise en place du monitoring le plus complet selon le type de projet (app web, API, RAG/LLM, pipeline data, cron, training et serving ML, mobile) : metriques, logs, traces, SLO, alertes, dashboards, cout, et signaux specifiques au domaine (LLMOps, MLOps, data). Vendor-neutral (OpenTelemetry, Prometheus, Grafana).", {}),
    "prod-testing": ("Strategie de test de bout en bout et validation en production, vendor-neutral : pyramide et etapes CI/CD (unitaire, contrat, integration, end to end, smoke, canary), smoke tests post-deploy, deploiement progressif avec rollback automatique, feature flags (OpenFeature), monitoring synthetique, gestion des tests instables.", {}),
    "devops": ("DevOps et SRE : Terraform/OpenTofu, Docker, Kubernetes, GitOps, pipelines CI/CD et GitHub Actions, SLO et budgets d'erreur, PromQL, k6, monitoring synthetique, reponse a incident et postmortem.", {}),
    "finops": ("FinOps multi-cloud : analyse et optimisation des couts AWS (Cost Explorer, SP/RI), GKE/Google Cloud, Azure, et scan de cout shift-left de l'infra as code (Infracost).", {}),
    "data-engineering": ("Data engineering : modeles et tests dbt, DAGs Airflow (ecriture, test, debug, migration 2 vers 3), SQL multi-dialecte, exploration de donnees, PySpark, Postgres, qualite des donnees.", {}),
    "dataviz": ("Data visualisation : choix du type de graphique, matplotlib/seaborn/plotly, dashboards HTML autoportants, figures scientifiques accessibles, dashboards Grafana.", {}),
    "ml-engineering": ("ML engineering : choix de methode de fine-tuning, recettes LoRA/QLoRA, harnais d'evaluation et calibration de juge LLM, TRL, RAG, serving vLLM, benchmarks lm-eval, scikit-learn, tracing MLflow, Hugging Face Hub.", {}),
    "fullstack": ("Full stack web en production : 70 regles de performance React et Next.js, patterns de composition React 19. Se combine avec le pack agent-skills (APIs, securite, perf, livraison).", {}),
    "ui-design": ("Design qui ne fait pas vibe-code : systeme anti AI-slop (impeccable), direction artistique et liste des tells IA (frontend-design), Web Interface Guidelines de Vercel, contraintes deslop, stress-test d'UI, refonte de sites generiques.", {}),
    "compliance": ("Reglementaire et conformite : audit RGAA (accessibilite, en francais), regles RGPD a l'ingenierie, conseil WCAG et cartographie legale (EAA), verification de conformite d'une feature, securite du developpement (ANSSI), corrections d'accessibilite au niveau du code.", {}),
    "motion-design": ("Motion design : GSAP (core, timeline, ScrollTrigger, plugins, performance, frameworks), principes de motion agnostiques (LottieFiles), animations mathematiques Manim (ManimCE et planification de scenes).", {}),
    "video-editing": ("Montage video complet : edition par conversation avec EDL et sous-titres (video-use), construction de commandes FFmpeg (coupe, concat, transitions, loudness, presets reseaux sociaux), transcription locale faster-whisper, rendu Manim.", {}),
    "app-factory": ("Orchestrateur de projet de A a Z : de l'idee, d'une app a cloner en la personnalisant, ou d'une app existante a terminer, jusqu'au produit fini en production. 18 sous-agents (produit, gestion de projet, architecture, donnees, design, securite, conformite, finops, dev, revue, QA, release, SRE, growth, verificateur), phases et portes de validation, etat sur disque et reprise.", {}),
    "product-management": ("Gestion de produit : decouverte (hypotheses, opportunity solution tree, entretiens), strategie (vision, positionnement, modele economique, prix), marche (concurrence, personas, segments), execution (PRD, user stories, roadmap, pre-mortem, sprint, retro, notes de version), retro-specification d'un code existant (code-to-prd, schematic, intended-vs-implemented).", {}),
    "mobile": ("Mobile multiplateforme, ecrit maison : publication iOS et Android (signature, versions, TestFlight, pistes Play, fastlane, EAS), securite OWASP MASVS, notifications push, deep links, tests de bout en bout (Maestro, Detox), accessibilite mobile, achats integres sans service tiers.", {}),
    "mobile-expo": ("Expo et React Native : skills officielles Expo (router, UI native, design system, modules, upgrade, EAS Build/Submit/Update/Workflows, migration web vers natif), performance et upgrade React Native et React Navigation (Callstack), tests React Native Testing Library.", {}),
    "mobile-ios": ("iOS natif : SwiftUI, concurrence Swift, Swift Testing, SwiftData (Paul Hudson), accessibilite iOS (VoiceOver, Dynamic Type).", {}),
    "mobile-android": ("Android natif : skills officielles Google (Compose performance et adaptatif, migration XML vers Compose, Navigation 3, edge-to-edge, AGP 9, R8, ANR, tests, securite des intents et permissions, politiques Play) et Google Play Billing (RevenueCat, independant de leur service).", {}),
    "mobile-flutter": ("Flutter et Dart : skills officielles (architecture, mise en page responsive, routage declaratif, localisation, serialisation JSON, HTTP, tests de widgets et d'integration, analyse statique, erreurs d'execution).", {}),
    "app-stores": ("Stores, ecrit maison : dossier de fiche App Store et Google Play dans les limites de chaque store, formulaire Data safety depuis le code et les SDK, pilotage des consoles dans le navigateur pour ce que les API ne couvrent pas.", {}),
    "store-apple": ("App Store Connect par le CLI asc (signature, build, TestFlight, release, metadonnees, captures, prix, crashs), prevention des rejets App Review (preflight par type d'app), politique de confidentialite et labels de confidentialite Apple.", {}),
    "store-google": ("Google Play par le CLI gplay (build Gradle, release, rollout progressif, testeurs, metadonnees, captures, verifications avant soumission, achats, prix, vitals) et audit des politiques Google Play depuis le code.", {}),
    "store-aso": ("App Store Optimization pour les deux stores : audit, mots-cles, metadonnees, captures (generateur Next.js inclus), video de presentation, icone, pages produit personnalisees, evenements, tests A/B de fiche, localisation, avis et notes, gestion des rejets.", {}),
    "growth": ("Growth, socle : contexte produit partage par toutes les skills marketing, plan marketing, lancement, relations presse ; ecrit maison : campagnes d'installation d'app, production de creatives et videos, publication sur les reseaux sociaux, conformite marketing France et UE.", {}),
    "growth-seo": ("SEO du site : audit technique et on-page, recherche IA (GEO), donnees structurees, SEO programmatique, architecture du site, strategie de contenu, netlinking.", {}),
    "growth-ads": ("Publicite payante : strategie Google, Meta, TikTok, LinkedIn, creatives publicitaires, copywriting et relecture, psychologie, images et videos marketing, Apple Ads, campagnes d'acquisition d'app.", {}),
    "growth-social": ("Reseaux sociaux : strategie et contenus par plateforme, marketing d'influence et createurs, animation de communaute.", {}),
    "growth-analytics": ("Mesure marketing : plan de marquage et GA4, UTM, attribution, suivi des conversions (GTM, API de conversion), tests A/B, attribution mobile (MMP, SKAdNetwork).", {}),
    "growth-cro": ("Conversion et retention : CRO des pages, inscription, onboarding, paywalls, popups, emails et SMS de cycle de vie, churn, parrainage, lead magnets, tunnel web vers app.", {}),
    "ultime-profile": ("Point d'entree : installe et gere pour chaque projet les seuls packs ultime-skill utiles (detection du projet, installation au niveau du projet, desactivation du reste, ajustement quand la tache change). Catalogue des packs avec leur cout en contexte.", {}),
    "greenfield": ("Retro-ingenierie salle blanche : extrait d'un code existant des specs comportementales, vecteurs de test et criteres d'acceptation sans heritage d'implementation (commande /greenfield:analyze). Pipeline lourd en agents, a reserver au code dont on detient les droits.", {}),
}

# sec-offense (authorized pentest) is never pulled in by a bundle: it is installed explicitly only.
GATED = {"sec-offense"}
BUNDLES = {
    "ultime-all": ("Tout ultime-skill en une commande : installe l'ensemble des packs, sauf le pentest offensif.",
                   [name for name in PLUGINS if name not in GATED]),
    "ultime-dev": ("Pack developpeur : ponytail, superpowers, cycle de vie logiciel, usine a skills, devops, full stack, securite, conventions d'equipe, tests en production.",
                   ["ponytail", "superpowers", "agent-skills", "skill-factory", "devops", "fullstack", "security", "sc-conventions", "prod-testing"]),
    "ultime-data": ("Pack data : data engineering, data visualisation, ML engineering, graphe de connaissances.",
                    ["data-engineering", "dataviz", "ml-engineering", "graphify"]),
    "ultime-media": ("Pack creatif : design anti AI-slop, motion design, montage video.",
                     ["ui-design", "motion-design", "video-editing"]),
    "ultime-security": ("Pack securite defensive : audit et revue de securite, audit de code, defense et reponse a incident, reverse engineering.",
                        ["security", "sec-audit", "sec-defense", "rea"]),
    "ultime-web": ("Pack web : full stack, design, conformite (RGPD, accessibilite, legal).",
                   ["fullstack", "ui-design", "compliance"]),
    "ultime-ops": ("Pack operations : devops/SRE, finops, monitoring complet et tests en production.", ["devops", "finops", "monitoring", "prod-testing"]),
    "ultime-mobile": ("Pack mobile : multiplateforme, Expo et React Native, iOS, Android, Flutter, stores (fiche, Data safety, App Store Connect, Google Play, ASO), design, conformite et securite.",
                      ["mobile", "mobile-expo", "mobile-ios", "mobile-android", "mobile-flutter", "app-stores",
                       "store-apple", "store-google", "store-aso", "ui-design", "compliance", "security"]),
    "ultime-growth": ("Pack growth : socle marketing, SEO, publicite et creatives, reseaux sociaux, mesure et attribution, conversion et retention, ASO, production video.",
                      ["growth", "growth-seo", "growth-ads", "growth-social", "growth-analytics", "growth-cro",
                       "store-aso", "video-editing", "motion-design"]),
    "ultime-factory": ("Usine a produit : l'orchestrateur app-factory et tout ce qu'il pilote (gestion de produit, retro-specification, cycle de vie logiciel, full stack, mobile et stores, growth, design, conformite, securite, devops, donnees, monitoring, tests en production, finops). A combiner avec ultime-profile pour n'activer que l'utile par projet.",
                       ["app-factory", "product-management", "greenfield", "agent-skills", "fullstack", "ui-design",
                        "compliance", "security", "devops", "data-engineering", "monitoring", "prod-testing", "finops",
                        "mobile", "mobile-expo", "mobile-ios", "mobile-android", "mobile-flutter", "app-stores",
                        "store-apple", "store-google", "store-aso", "growth", "growth-seo", "growth-ads",
                        "growth-social", "growth-analytics", "growth-cro", "video-editing", "motion-design"]),
}


# Every bundle also pulls in ultime-profile, the skill that trims a project down to the packs it needs.
for _, members in BUNDLES.values():
    if "ultime-profile" not in members:
        members.append("ultime-profile")

AUTHOR = {"name": "SensCritique", "url": "https://github.com/senscritique"}
CATALOG = ROOT / "plugins" / "ultime-profile" / "skills" / "ultime-profile" / "references" / "catalog.md"


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
        "# Catalogue des packs ultime-skill",
        "",
        "Genere par `scripts/gen_manifests.py`. Le cout est la longueur des descriptions de skills et",
        "d'agents qu'un pack active ajoute au contexte de chaque session (environ 4 caracteres par token).",
        "",
        "| Pack | Skills | Agents | Cout (caracteres) | Role |",
        "|---|---|---|---|---|",
    ]
    for name, (text, _) in PLUGINS.items():
        skills, agents, chars = costs[name]
        lines.append(f"| `{name}` | {skills} | {agents} | {chars} | {text.replace('|', '/')} |")
    lines += ["", "## Bundles", "", "| Bundle | Cout (caracteres) | Packs |", "|---|---|---|"]
    for name, (_, members) in BUNDLES.items():
        lines.append(f"| `{name}` | {sum(costs[m][2] for m in members)} | {', '.join(members)} |")
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    for name, (_, members) in BUNDLES.items():
        print(f"{name:>16}  {sum(costs[m][2] for m in members):>7} description characters per session")


def write_plugin(name: str, description: str, extra: dict) -> None:
    directory = ROOT / "plugins" / name / ".claude-plugin"
    directory.mkdir(parents=True, exist_ok=True)
    manifest = {"name": name, "description": description, "author": AUTHOR, **extra}
    (directory / "plugin.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    plugins_entries = []
    for name, (description, extra) in PLUGINS.items():
        write_plugin(name, description, extra)
        plugins_entries.append({"name": name, "source": f"./plugins/{name}", "description": description})
    for name, (description, members) in BUNDLES.items():
        write_plugin(name, description, {"dependencies": members})
        plugins_entries.append({"name": name, "source": f"./plugins/{name}", "description": description})

    marketplace = {
        "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
        "name": "ultime-skill",
        "description": "Bibliotheque de skills Claude prete pour la production : orchestration de projet de A a Z, gestion de produit, mobile et stores, growth et marketing, securite, devops, finops, data, ML, full stack, design, conformite, motion et video.",
        "owner": {"name": "SensCritique", "url": "https://github.com/senscritique"},
        "plugins": plugins_entries,
    }
    directory = ROOT / ".claude-plugin"
    directory.mkdir(exist_ok=True)
    (directory / "marketplace.json").write_text(json.dumps(marketplace, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(PLUGINS)} plugins, {len(BUNDLES)} bundles, marketplace.json written")
    write_catalog()


if __name__ == "__main__":
    main()
