---
name: store-listing
description: >
  Construit le dossier complet de fiche App Store et Google Play d'une nouvelle app, dans les limites de
  chaque store : textes par langue, categories, classification, confidentialite, URLs, visuels, notes pour
  la revue. A utiliser pour creer ou refaire une fiche store, preparer une premiere soumission, ou "fiche
  App Store", "fiche Play Store", "store listing".
---

# Dossier de fiche store (App Store et Google Play)

Produit un dossier unique, versionne dans le depot, qui alimente ensuite les outils de publication
(`asc-metadata-sync`, `gplay-metadata-sync`, fastlane) ou la saisie dans les consoles
(`store-console-browser`). L'optimisation fine des mots-cles et visuels vient du pack store-aso.

## Champs et limites

Limites de caracteres les plus utilisees, a reverifier dans la documentation des stores avant
soumission :

| App Store | Limite | Google Play | Limite |
|---|---|---|---|
| Nom | 30 | Titre | 30 |
| Sous-titre | 30 | Description courte | 80 |
| Texte promotionnel (modifiable sans version) | 170 | Description complete | 4000 |
| Description | 4000 | | |
| Mots-cles (separes par des virgules) | 100 | | |
| Notes de version | 4000 | Notes de version | 500 par langue |

## Contenu du dossier

1. **Identite** : nom (distinct de toute app existante, voir `app-clone`), sous-titre, categorie
   principale et secondaire, developpeur affiche.
2. **Textes par langue** : ecrits pour le marche (pas une traduction mot a mot), sans superlatif non
   prouve, sans nom de concurrent ni mot-cle de marque d'autrui.
3. **Classification** : questionnaire d'age Apple et questionnaire IARC de Google Play, remplis d'apres
   le contenu reel (contenus generes par les utilisateurs, achats, communications entre utilisateurs).
4. **Confidentialite** : URL de politique de confidentialite (obligatoire sur les deux stores), labels
   Apple (`privacy-policy`, `privacy-publish`), formulaire Data safety (`play-data-safety`), suppression de
   compte (in-app et lien web).
5. **URLs** : support (obligatoire chez Apple), site marketing, conditions d'utilisation si abonnements.
6. **Visuels** : icone, captures par taille d'appareil exigee, image de presentation Google Play (1024 x
   500), video facultative. Specifications exactes a verifier (elles suivent les nouveaux appareils) ;
   production avec `app-store-screenshots`, strategie avec `screenshot-optimization`.
7. **Prix et disponibilite** : pays, prix, achats integres et abonnements declares.
8. **Revue** : notes pour les reviewers, compte de demonstration transmis par la console (jamais dans le
   depot), declarations specifiques (publicite, chiffrement, contenu sensible, public cible et enfants).

## Format de sortie

- `store/listing.md` : vue d'ensemble relue par l'utilisateur.
- Un fichier par champ et par langue dans le format de l'outil retenu (voir la skill de l'outil :
  `asc-metadata-sync`, `gplay-metadata-sync` ou la structure `fastlane/metadata`).
- Un controle de longueur automatique de chaque champ avant envoi.

## Coherence

La fiche decrit l'app reelle : chaque fonctionnalite citee existe, les captures montrent l'app, la
confidentialite declaree correspond au code et aux SDK. Une incoherence est un motif de rejet frequent.
