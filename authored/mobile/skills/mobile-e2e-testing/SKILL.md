---
name: mobile-e2e-testing
description: >
  Tests de bout en bout mobiles : choisir et mettre en place Maestro, Detox, XCUITest, Espresso, tests UI
  Compose ou integration_test Flutter, en local et en CI, avec appareils reels ou fermes de test. A
  utiliser pour tester des parcours d'app mobile, Maestro, Detox, XCUITest, Espresso, tests E2E mobiles ou
  tests instables sur mobile.
---

# Tests de bout en bout mobiles

## Choisir l'outil

| Situation | Outil |
|---|---|
| Parcours utilisateur, toute stack (natif, React Native, Flutter), ecriture rapide | Maestro (flux YAML, boite noire) |
| React Native avec synchronisation fine sur l'etat de l'app | Detox (boite grise) |
| iOS natif | XCUITest (skill `swift-testing-pro` pour les tests unitaires) |
| Android natif | Espresso, tests UI Compose (skill `testing-setup`) |
| Flutter | `integration_test` (skill `flutter-add-integration-test`) ; Patrol pour les interactions natives (permissions, notifications) |

Un seul outil E2E par projet de preference ; la majorite des tests reste unitaire et d'integration
(pyramide, skill `testing-in-production`).

## Bonnes pratiques

- Cibler les elements par identifiant stable (`testID`, identifiant d'accessibilite, `Key`), pas par
  texte affiche ni position.
- Un flux par parcours critique : inscription, connexion, achat, action principale, deep link,
  notification. Donnees et comptes de test dedies, remis a zero entre les executions.
- Attendre un etat, jamais un delai fixe. Desactiver les animations sur les emulateurs de CI.
- Bouchonner les services tiers instables ; garder un parcours "reel" en recette.

## CI

- Android : emulateur en CI (avec acceleration materielle) ; iOS : runners macOS avec simulateur.
- Fermes d'appareils pour la couverture (Firebase Test Lab, BrowserStack, AWS Device Farm, Maestro
  Cloud) : lancer la suite complete avant release, un sous-ensemble a chaque PR.
- Conserver captures, videos et logs des echecs comme artefacts.

## Tests instables

- Mesurer le taux d'echec par test ; mettre en quarantaine avec un ticket ; corriger la cause (attente,
  donnees partagees, animation, reseau). Ne pas relancer en boucle jusqu'au vert.

## Installation

Suivre la documentation officielle de chaque outil, avec une version epinglee dans la CI ; ne pas
executer de script d'installation distant sans l'avoir relu.
