---
name: setting-up-monitoring
description: >
  Monitoring complet adapte au type de projet (web, API, RAG/LLM, data, cron, ML, mobile) : metriques,
  logs, traces, SLO, alertes, dashboards, cout ; vendor-neutral (OpenTelemetry, Prometheus, Grafana). A
  utiliser pour monitorer, observer, instrumenter, suivre en production, mettre en place observabilite,
  SLO, alertes ou dashboards, ou "monitoring", "observability", "LLMOps", "MLOps".
---

# Mise en place du monitoring complet

Objectif : qu'un projet soit observable a fond, c'est-a-dire qu'on puisse repondre a "est-ce que ca
marche", "est-ce que c'est lent", "pourquoi ca casse" et "combien ca coute" sans ajouter d'instrumentation
dans l'urgence d'un incident. Un projet composite (exemple : un RAG = une partie application + une partie
LLM) recoit la couche de base **et** chaque couche de domaine qui le concerne.

## Methode

1. **Identifier le ou les types de projet.** Lire le code et l'infra, ne pas supposer. Un projet peut
   cumuler plusieurs types (une API qui sert un modele et lit une base, un RAG qui expose une API web).
2. **Poser la couche de base** (section suivante) : elle vaut pour tout projet qui tourne.
3. **Ajouter chaque couche de domaine** via les references ci-dessous, une par type identifie.
4. **Definir les SLO avant les alertes.** On alerte sur les symptomes vus par l'utilisateur (le budget
   d'erreur qui brule), pas sur chaque cause possible.
5. **Verifier l'instrumentation elle-meme.** Un dashboard vide ou une alerte qui ne se declenche jamais
   est une panne silencieuse : declencher chaque alerte une fois (en recette ou via un test), confirmer
   que la donnee arrive.
6. **Livrer un etat lisible** : ce qui est monitore, les SLO retenus, les alertes et leurs seuils, les
   dashboards, le cout de la stack d'observabilite elle-meme, et ce qui reste a faire.

Ne jamais mettre de donnee personnelle dans un log, une metrique (labels compris) ou une trace. Pas de
secret, pas de token, pas de contenu utilisateur en clair la ou ce n'est pas indispensable.

## Couche de base (tout projet)

Detail et exemples de configuration : [references/baseline.md](references/baseline.md).

- **Les quatre signaux.** Pour un service en ligne : latence, trafic, taux d'erreur, saturation (methode
  RED cote requetes, USE cote ressources). Les exposer en metriques.
- **Logs structures** en JSON, avec un niveau, un horodatage, un identifiant de correlation (trace id) et
  des cles stables (pas de chaines a parser). Jamais de donnee personnelle.
- **Traces distribuees** via OpenTelemetry : un trace id qui traverse les services, propage aussi dans les
  logs. C'est le standard a poser par defaut, quel que soit le backend.
- **SLI/SLO** : definir ce que "ca marche" veut dire (disponibilite, latence p95/p99), fixer un objectif
  et un budget d'erreur, alerter sur la vitesse de consommation du budget (multi-window multi-burn-rate).
- **Alertes** routees (Alertmanager, PagerDuty, incident.io ou equivalent) avec severite, runbook lie, et
  pas de bruit : chaque alerte doit etre actionnable.
- **Dashboards** : une vue sante (les SLO et les quatre signaux), une vue ressources, une vue metier.
- **Cout** : suivre le cout de l'infra et de la stack d'observabilite (volume de logs, cardinalite des
  metriques, echantillonnage des traces). Une cardinalite non maitrisee fait exploser la facture.

## Couches de domaine

Appliquer la ou les references correspondant au projet.

| Type de projet | Reference | Signaux clefs en plus de la base |
|---|---|---|
| Application web (front) | [references/web-app.md](references/web-app.md) | Core Web Vitals, erreurs JS, sessions, parcours |
| Service API ou backend | [references/api-service.md](references/api-service.md) | RED par endpoint, dependances, files, pool de connexions |
| Application RAG ou LLM | [references/rag-llm.md](references/rag-llm.md) | Cout et tokens, latence par etape, qualite de recuperation, groundedness, garde-fous, feedback |
| Entrainement et serving ML | [references/ml-training-serving.md](references/ml-training-serving.md) | Derive des donnees et des predictions, fraicheur des features, decroissance de performance |
| Pipeline de donnees | [references/data-pipeline.md](references/data-pipeline.md) | Fraicheur, volume, schema, taux de nuls, succes et duree des jobs, lineage |
| Cron ou batch | [references/cron-batch.md](references/cron-batch.md) | Dead man's switch, duree, chevauchement, idempotence |
| Application mobile | [references/mobile.md](references/mobile.md) | Crash-free rate, demarrage a froid, ANR, reseau, adoption des versions |

## Choix de la stack

Vendor-neutral par defaut, pour ne pas s'enfermer :

- **Collecte** : OpenTelemetry (SDK + Collector) pour metriques, logs et traces.
- **Stockage et visualisation open source** : Prometheus (metriques), Loki (logs), Tempo (traces),
  Grafana (dashboards et alertes), Alertmanager (routage).
- **Equivalents manages** si l'equipe les utilise deja : Datadog, Grafana Cloud, Honeycomb, New Relic,
  Elastic. Garder l'instrumentation en OpenTelemetry pour pouvoir changer de backend sans retoucher le
  code.

Choisir ce que le projet utilise deja plutot que d'introduire une stack de plus. Le signaler si le projet
n'a aucun backend d'observabilite et en proposer un.

## Definition of done du monitoring

- Les quatre signaux et les SLO sont visibles sur un dashboard sante.
- Chaque couche de domaine du projet a ses signaux specifiques instrumentes.
- Les alertes sont actionnables, routees, liees a un runbook, et testees au moins une fois.
- Les logs sont structures, correles aux traces, sans donnee personnelle.
- Le cout de la stack (cardinalite, volume de logs, echantillonnage) est sous controle et suivi.
- Un document liste ce qui est monitore, les SLO, les alertes et ce qui reste ouvert.
