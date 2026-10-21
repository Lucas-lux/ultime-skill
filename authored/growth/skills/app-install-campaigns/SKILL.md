---
name: app-install-campaigns
description: >
  Campagnes d'acquisition d'app mobile (installs et evenements in-app) sur Apple Ads, Google App
  campaigns, Meta et TikTok : structure, optimisation, mesure iOS (ATT, SKAdNetwork, AdAttributionKit),
  MMP, budget, pages store dediees, consentement. A utiliser pour lancer ou optimiser des campagnes
  d'installation, user acquisition, CPI, ROAS d'app ou attribution mobile.
---

# Campagnes d'installation d'app

Complete les skills `ads` (strategie publicitaire), `ua-campaign` et `apple-search-ads` (pack growth-ads),
`attribution-setup` (growth-analytics). Toute creation de campagne, tout budget engage et toute mise en
ligne se font apres confirmation de l'utilisateur, sur ses comptes publicitaires.

## Prerequis

- Mesure en place **avant** de depenser : evenements in-app definis (inscription, debut d'essai, achat,
  retention), SDK d'attribution ou SDK des regies, conversions remontees et verifiees en test.
- Fiche store prete et coherente avec les publicites (packs store-aso, app-stores) ; pages produit
  personnalisees (Apple) ou fiches personnalisees (Google Play) par audience ou message.
- Consentement : dans l'UE, les SDK publicitaires et de mesure qui traitent des identifiants requierent
  le consentement de l'utilisateur ; sur iOS, l'acces a l'identifiant publicitaire passe par App Tracking
  Transparency. Declarer ces SDK dans les labels Apple et le Data safety.

## Mesure iOS et Android

- iOS : sans consentement ATT, la mesure passe par SKAdNetwork et son successeur AdAttributionKit
  (donnees agregees, differees, avec valeurs de conversion a configurer) ; Apple Ads s'attribue via le
  framework AdServices.
- Android : Play Install Referrer et identifiant publicitaire selon le consentement.
- Un MMP (AppsFlyer, Adjust, Branch, Singular...) unifie la mesure multi-regies ; sans MMP, utiliser les
  SDK et integrations de chaque regie. Choix a faire selon le budget, pas par reflexe.

## Structure par regie

| Regie | Points cles |
|---|---|
| Apple Ads | Intention de recherche dans l'App Store ; campagnes par type (marque, generique, concurrents, decouverte) ; mots-cles negatifs ; pages produit personnalisees par groupe d'annonces. |
| Google App campaigns | Diffusion automatisee (Search, Play, YouTube, Display) a partir d'assets textes, images et videos ; enchere par cout par installation, par action ou par retour sur investissement. |
| Meta (app promotion) | Optimisation sur installs, evenements ou valeur ; volume de creatives renouvele ; campagnes iOS soumises aux contraintes de mesure ci-dessus. |
| TikTok (app promotion) | Formats video natifs verticaux, creatives au ton de la plateforme (UGC), renouvellement rapide. |

- Separer iOS et Android, et les marches.
- Optimiser sur un evenement qui a de la valeur (essai, achat) des que le volume le permet ; l'install
  seule attire des utilisateurs peu engages. Respecter les volumes minimaux recommandes par chaque regie
  pour sortir de l'apprentissage.

## Pilotage

- Budget de test plafonne, puis montee progressive sur ce qui marche ; pas de changement brutal pendant
  l'apprentissage.
- Indicateurs : cout par install, cout par action (essai, achat), retention J1 / J7 / J30, ROAS J7 / J30,
  delai de recuperation du cout d'acquisition (en lien avec `finops-analyst` et le modele economique).
- Creatives : tester par concept (skill `marketing-creatives`), garder les gagnantes, couper les
  perdantes, renouveler avant l'usure.
- Rapport hebdomadaire : depense, resultats par regie et par creative, apprentissages, decisions.

## Garde-fous

- Plafonds de budget journaliers et totaux definis avec l'utilisateur ; alertes de depense.
- Pas de promesse trompeuse, pas de fausse interface ni de faux avis dans les publicites ; regles
  francaises et europeennes dans `marketing-compliance-fr`.
