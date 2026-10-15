# Couche de base : instrumentation de tout projet

A poser avant toute couche de domaine. Vendor-neutral : on instrumente en OpenTelemetry, on branche le
backend ensuite.

## Metriques : RED et USE

- **RED** (services qui traitent des requetes) : Rate (requetes/s), Errors (part en echec), Duration
  (distribution de latence). Une serie par endpoint et par code de statut de classe (`2xx`, `4xx`, `5xx`),
  jamais une serie par identifiant utilisateur ou par URL complete (cardinalite).
- **USE** (ressources : CPU, memoire, disque, reseau, pool, file) : Utilization, Saturation, Errors.
- Exposer en Prometheus (ou OTLP vers un collecteur). Histogrammes pour la latence, pour calculer les
  quantiles p50/p95/p99 cote backend.

Regle de cardinalite : un label ne prend qu'un petit ensemble borne de valeurs. Interdits comme labels :
identifiant utilisateur, email, URL complete, identifiant de requete. Ils vont dans les traces ou les
logs, pas dans les metriques.

## Logs structures

- Format JSON, une ligne par evenement. Cles stables : `timestamp`, `level`, `message` (ou un nom
  d'evenement en dotted, par exemple `payment.declined`), `service`, `trace_id`, `span_id`.
- Correler aux traces : injecter `trace_id` dans chaque log emis pendant une requete.
- Niveaux utilises avec discipline : `error` pour ce qui reveille quelqu'un, `warn` pour l'anormal non
  bloquant, `info` pour les evenements metier, `debug` hors production.
- Jamais de donnee personnelle, de secret ni de contenu utilisateur en clair. Masquer ou hacher si un
  identifiant est indispensable au debug.

## Traces distribuees

- OpenTelemetry SDK dans chaque service, Collector en sortie. Propagation du contexte (`traceparent`
  W3C) entre services, dans les messages de file et les jobs.
- Un span par operation significative : requete entrante, appel sortant (base, cache, http), traitement
  couteux. Attributs utiles (methode, route, statut, taille), sans donnee personnelle.
- Echantillonnage : garder 100 % des traces en erreur et lentes, echantillonner le reste (par exemple
  tail-based sampling au niveau du Collector) pour maitriser le cout.

## SLI, SLO et budget d'erreur

1. Definir les SLI vus par l'utilisateur : disponibilite (part de requetes reussies), latence (part de
   requetes sous un seuil, par exemple p95 < 300 ms).
2. Fixer un SLO (par exemple 99,9 % sur 30 jours glissants) et en deduire le budget d'erreur.
3. Alerter sur la vitesse de consommation du budget (multi-window multi-burn-rate : par exemple fenetres
   court terme 5 min et long terme 1 h, seuils de burn rate 14,4x et 6x). Voir la skill `devops`
   (`slo-implementation`) pour les expressions Prometheus exactes.

## Alertes

- Sur les symptomes (SLO qui brule, file qui diverge, saturation), pas sur chaque cause.
- Chaque alerte : une severite, un runbook, un routage (Alertmanager vers PagerDuty, incident.io,
  Opsgenie ou Slack selon l'equipe). Une alerte non actionnable est a supprimer.
- Tester chaque alerte au moins une fois (declenchement reel en recette ou regle de test) pour verifier
  qu'elle part et qu'elle arrive au bon endroit.

## Dashboards

- **Sante** : les SLO, les quatre signaux, l'etat des dependances.
- **Ressources** : CPU, memoire, disque, reseau, pools, files.
- **Metier** : les evenements qui comptent pour le produit (commandes, inscriptions, lectures selon le
  domaine).

## Cout de l'observabilite

- Suivre le volume de logs, la cardinalite des metriques et le taux d'echantillonnage des traces : ce sont
  les trois postes qui font deraper la facture.
- Mettre une retention adaptee par type de donnee (traces courtes, metriques agregees sur le long terme,
  logs selon le besoin legal et de debug).
