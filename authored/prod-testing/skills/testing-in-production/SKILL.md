---
name: testing-in-production
description: >
  Tests de bout en bout et validation en production : pyramide CI/CD, smoke tests, canary et blue-green
  avec rollback automatique, feature flags, monitoring synthetique. A utiliser pour tests en production,
  smoke tests, canary, blue-green, rollback, feature flags, OpenFeature, monitoring synthetique, strategie
  CI/CD, test de contrat (Pact), ou tests instables (flaky).
---

# Tester en production (strategie de bout en bout)

Objectif : savoir qu'un deploiement est sain avant et apres sa mise en ligne, et pouvoir revenir en arriere
automatiquement sur un signal objectif. Vendor-neutral. Se combine avec le pack `devops` (pipelines,
k6, github-actions) et le pack `monitoring` (SLO, signaux).

## Quel test a quelle etape

Une pyramide, du moins cher au plus cher, chaque etage bloquant le suivant :

1. **Unitaire** : logique isolee, rapide, majoritaire.
2. **Contrat** (consumer-driven, par exemple Pact) : verifie qu'un service et ses consommateurs partagent
   le meme contrat d'API, sans deployer toute la chaine. Indispensable des qu'il y a plusieurs services.
3. **Integration** : composants reels (base, file, cache) via des conteneurs ephemeres.
4. **End to end** : parcours critiques sur un environnement proche de la production (voir la skill
   `playwright-cli` du pack devops).
5. **Smoke post-deploy** : apres chaque mise en ligne, un petit jeu de verifications sur l'environnement
   reel (sante, routes critiques, dependances joignables).
6. **Canary** : exposition progressive a une fraction du trafic reel, sous surveillance.

Definir pour chaque etape ce qui bloque le pipeline et ce qui n'est qu'informatif.

## Smoke tests post-deploy

- Un jeu court et deterministe qui tourne juste apres le deploiement, contre l'environnement reel : page de
  sante, une ou deux routes critiques, connexion aux dependances, une transaction metier non destructrice.
- En echec, le deploiement est considere comme rate et declenche le rollback.
- Ne jamais faire tourner un smoke test destructeur contre la production ; utiliser un compte et des donnees
  de test dedies.

## Deploiement progressif et rollback automatique

- **Canary** : router un petit pourcentage du trafic vers la nouvelle version, comparer ses signaux a la
  version stable (taux d'erreur, latence p95/p99, signaux metier), augmenter par paliers si tout va bien.
- **Analyse automatique** : definir les criteres de promotion et de rollback a l'avance (par exemple taux
  d'erreur du canary significativement superieur a la baseline, ou latence p99 au-dela d'un seuil sur une
  fenetre donnee). Outils : analyse de Argo Rollouts, Flagger, ou equivalent. Sinon, une comparaison
  manuelle documentee.
- **Rollback** : revenir a la version stable automatiquement quand un critere est franchi. Le rollback doit
  etre teste, pas seulement configure.
- **Blue-green** : deux environnements, bascule du trafic quand le nouveau passe les smoke tests, retour
  immediat possible.

## Feature flags (OpenFeature)

- Decoupler le deploiement (mettre le code en production) de la sortie (l'activer). Un flag protege une
  fonctionnalite risquee et sert de kill switch.
- Utiliser une API standard (OpenFeature) pour ne pas se lier a un fournisseur. Un backend open source
  (flagd) ou un service, au choix de l'equipe.
- **Cycle de vie** : nommer le flag, definir le proprietaire et la date de retrait des la creation ;
  deployer off ; activer progressivement (pourcentage, cohorte) ; mesurer ; nettoyer le flag une fois la
  fonctionnalite stabilisee. Un flag oublie est de la dette et un risque.
- Eviter les dependances entre flags et les combinaisons non testees.

## Monitoring synthetique auto-heberge

- Des verifications scenarisees qui s'executent en continu depuis l'exterieur (parcours de connexion,
  recherche, achat) et alertent avant les utilisateurs. k6 (pack devops) programme, ou blackbox_exporter
  pour les sondes simples.
- Separer les comptes et donnees de test, baliser le trafic synthetique pour l'exclure des metriques
  metier.

## Tests instables (flaky)

- Detecter : taux d'echec non deterministe par test, suivi dans le temps.
- Mettre en quarantaine un test instable (ne bloque plus le pipeline mais reste visible et suivi), creer un
  ticket, corriger la cause (attentes implicites, dependances d'ordre, horloges, reseau), puis reintegrer.
- Ne jamais masquer l'instabilite par une reexecution systematique sans suivi : cela cache des vrais bugs.

## Definition of done

- La pyramide est en place avec des portes claires par etape, contrat inclus des qu'il y a plusieurs
  services.
- Chaque deploiement passe un smoke test ; l'echec declenche le rollback.
- Le deploiement progressif a des criteres de promotion et de rollback automatiques, testes.
- Les fonctionnalites risquees sont derriere un flag avec un proprietaire et une date de retrait.
- Des checks synthetiques couvrent les parcours critiques.
- Les tests instables sont suivis et traites, pas ignores.
