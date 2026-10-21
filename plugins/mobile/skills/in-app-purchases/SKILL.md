---
name: in-app-purchases
description: >
  Achats integres et abonnements iOS et Android sans dependre d'un service tiers : StoreKit 2, Google Play
  Billing, react-native-iap, expo-iap, in_app_purchase Flutter, verification serveur, droits d'acces,
  restauration, tests, regles des stores. A utiliser pour ajouter des achats in-app, abonnements, paywall,
  StoreKit, Play Billing ou verification de recus.
---

# Achats integres et abonnements

Option geree : RevenueCat (service tiers, payant au-dela d'un seuil). Cette skill decrit la voie directe ;
details Android dans les skills `play-billing-*` (pack mobile-android).

## Architecture

- **Le serveur est la source de verite des droits** (entitlements) : l'app affiche, le serveur decide.
- iOS : StoreKit 2 ; ecouter `Transaction.updates` des le lancement ; transactions signees (JWS) a
  verifier ; cote serveur, App Store Server API et App Store Server Notifications V2.
- Android : Google Play Billing Library ; **acquitter chaque achat** (sinon il est rembourse
  automatiquement apres quelques jours) ; verification via la Google Play Developer API ; notifications
  temps reel (RTDN) via Pub/Sub.
- Multiplateforme : `react-native-iap` ou `expo-iap` (React Native, Expo avec build de developpement),
  `in_app_purchase` (Flutter). La verification reste cote serveur.

## Parcours a couvrir

- Achat, achat en attente (moyen de paiement differe), annulation, echec.
- Abonnement : essai, renouvellement, changement de formule, periode de grace, suspension,
  resiliation, remboursement, reabonnement (skill `play-billing-subscription-states` pour Android).
- **Restaurer les achats** : bouton visible, obligatoire sur iOS.
- Connexion de compte : rattacher les achats a l'utilisateur (identifiant de compte transmis au store)
  pour les retrouver sur un autre appareil.

## Regles des stores

- Les biens et contenus numeriques consommes dans l'app passent par l'achat integre du store, sauf
  exceptions par region et par type d'app (liens de paiement externes, alternatives liees au DMA dans
  l'UE...). Ces regles et les commissions evoluent : les verifier dans les App Review Guidelines et la
  Payments policy de Google Play au moment de concevoir.
- Paywall : prix, periode, renouvellement automatique et conditions affiches clairement avant l'achat ;
  lien de gestion ou de resiliation de l'abonnement.

## Tests

- iOS : fichier de configuration StoreKit dans Xcode (tests locaux), comptes sandbox, puis TestFlight.
- Android : testeurs de licence et pistes de test ; produits actifs dans la Play Console.
- Tester renouvellements acceleres, echecs de paiement, remboursements, restauration et changement
  d'appareil. Verifier que le serveur traite les notifications de facon idempotente.

## Donnees et conformite

- Ne stocker que l'identifiant de transaction et l'etat des droits, pas de donnee de carte (le store
  s'en charge).
- Declarer les achats dans les labels Apple et le Data safety Google.
- CGV et information precontractuelle (skill `mentions-legales-cgu-cgv`).
