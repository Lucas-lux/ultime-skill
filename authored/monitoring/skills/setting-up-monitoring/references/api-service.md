# Service API ou backend

Couche de base (RED, USE, logs, traces, SLO) plus les points suivants.

## Par endpoint

- RED par route logique (`GET /users/:id`, pas l'URL avec l'id) et par classe de statut. Latence en
  histogramme pour p95/p99 par route.
- Taille des requetes et des reponses si elle varie fortement (upload, export).

## Dependances sortantes

- Pour chaque dependance (base de donnees, cache, file, service tiers, http externe) : latence, taux
  d'erreur, timeouts, et etat du circuit breaker s'il y en a un. Une trace relie l'appel sortant a la
  requete entrante.
- SLO par dependance critique, et un budget de latence reparti entre les dependances.

## Ressources d'infrastructure

- **Pool de connexions** base de donnees : connexions actives, en attente, saturation, temps d'acquisition.
  C'est une cause frequente de latence invisible cote CPU.
- **Files de messages** : profondeur, age du plus vieux message, taux de consommation vs production,
  messages en dead letter.
- **Cache** : hit ratio, evictions, latence.

## Resilience

- Taux de retry, de rate limiting (429), de rejet par le circuit breaker. Suivre les erreurs client (4xx)
  separement des erreurs serveur (5xx) : seules les 5xx consomment le budget d'erreur en general.

## Securite applicative

- Taux d'authentification en echec, d'autorisation refusee, de rate limit atteint. Un pic est un signal
  d'abus. Voir la skill `security` pour la revue.

## Dashboards

- Vue endpoints (RED par route, top des routes lentes et en erreur).
- Vue dependances (latence et erreurs par dependance, pools, files, cache).
- Vue SLO et budget d'erreur.
