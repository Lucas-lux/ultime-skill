# Application web (front)

Le front se monitore cote navigateur (RUM, real user monitoring) et pas seulement cote serveur. Un rendu
serveur rapide ne garantit pas une bonne experience.

## Core Web Vitals (RUM)

- LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift). Suivre
  le p75 par page et par type d'appareil (mobile vs desktop) et par pays si pertinent.
- TTFB, First Contentful Paint en complement. Relier aux deploiements pour voir une regression.

## Erreurs cote client

- Erreurs JavaScript non capturees, rejets de promesse, erreurs de ressources, avec source map pour
  retrouver la ligne. Taux d'erreur par version front et par navigateur.
- Erreurs d'appel API vues du client (statut, latence percue), qui different souvent des erreurs vues du
  serveur (reseau, CORS, timeouts cote utilisateur).

## Parcours et usage

- Taux de sessions sans erreur, parcours critiques (inscription, recherche, lecture, achat) avec taux de
  completion et points d'abandon.
- Adoption des versions front (surtout si service worker ou cache agressif : des utilisateurs restent sur
  une ancienne version).

## Mise en place

- RUM via OpenTelemetry web, ou l'outil en place (Grafana Faro, Sentry, Datadog RUM). Echantillonner pour
  le cout.
- Ne pas envoyer de donnee personnelle dans les evenements RUM (anonymiser les URL a parametres sensibles).

## Dashboards

- Vue Web Vitals (p75 par page et appareil, tendance par deploiement).
- Vue erreurs client (par version, navigateur, page).
- Vue parcours (completion et abandon des parcours critiques).
