# Application mobile

Le monitoring mobile est contraint par la distribution (on ne deploie pas un correctif a chaud, les
utilisateurs restent sur d'anciennes versions) et par le terrain (reseaux variables, appareils varies).

## Stabilite

- **Crash-free rate** (sessions et utilisateurs sans crash), par version et par OS. C'est la metrique de
  sante numero un. Alerter sur une chute apres une sortie.
- **ANR** (Android) et freezes/hangs (iOS) : l'application ne repond plus sans crasher.
- Symbolication des stacks (dSYM iOS, mapping Android) pour exploiter les rapports.

## Performance percue

- Demarrage a froid et a chaud (cold/warm start), temps de rendu du premier ecran, images par seconde et
  frames gelees sur les ecrans critiques.
- Consommation : batterie, memoire, donnees reseau.

## Reseau

- Latence et taux d'erreur des appels API vus du mobile (souvent pires que cote serveur : radio, perte,
  timeouts). Comportement hors ligne et reprise.

## Adoption et diffusion

- Repartition des versions installees et vitesse d'adoption d'une nouvelle version. Indispensable pour
  interpreter une regression (elle ne touche qu'une version) et pour savoir quand une version buggee a
  disparu du parc.

## Mise en place

- SDK mobile (Firebase Crashlytics, Sentry, Datadog, Embrace) ou OpenTelemetry mobile selon la stack.
  Garder le crash reporting meme si on reste minimaliste.
- Pas de donnee personnelle dans les evenements. Respecter le consentement (voir la skill `compliance`).

## Dashboards

- Vue stabilite (crash-free par version et OS, ANR, tendance post-release).
- Vue performance (demarrage, rendu, consommation).
- Vue adoption (repartition des versions).
