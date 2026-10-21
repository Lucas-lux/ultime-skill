---
name: deep-links
description: >
  Liens profonds mobiles : Universal Links iOS, Android App Links, schemas personnalises, liens differes,
  routage Expo Router, React Navigation et go_router, tests et securite. A utiliser pour ajouter ou
  deboguer des deep links, universal links, app links, apple-app-site-association, assetlinks.json, ou des
  liens qui ouvrent l'app.
---

# Liens profonds

## iOS : Universal Links

- Fichier `apple-app-site-association` (JSON, sans extension) servi en HTTPS a
  `https://<domaine>/.well-known/apple-app-site-association`, sans redirection, avec un type JSON.
- Entitlement Associated Domains : `applinks:<domaine>`.
- Apple met ce fichier en cache via son CDN : une modification n'est pas visible immediatement ; le mode
  developpeur des Associated Domains aide en test.

## Android : App Links

- Fichier `https://<domaine>/.well-known/assetlinks.json` avec le nom de package et l'empreinte SHA-256
  du certificat de signature. Avec Play App Signing, c'est l'empreinte de la cle de signature de Google
  (affichee dans la Play Console), pas celle de la cle d'upload.
- Intent filter avec `android:autoVerify="true"` sur les hotes concernes.
- Verifier l'etat : `adb shell pm get-app-links <package>`.

## Schemas personnalises

- `monapp://...` : utiles pour un retour d'authentification ou en secours, mais n'importe quelle app peut
  declarer le meme schema. Ne jamais y faire transiter de secret ; preferer les liens HTTPS verifies.

## Liens differes (avant installation)

- Firebase Dynamic Links a ete arrete : ne plus l'utiliser. Alternatives : un fournisseur d'attribution
  ou de liens (Branch, AppsFlyer, Adjust...) ou une solution maison.
- Android : le Play Install Referrer transmet un parametre a l'installation. iOS n'offre pas de mecanisme
  deterministe equivalent ; eviter le fingerprinting, contraire aux regles de confidentialite.

## Routage dans l'app

- Expo Router : les routes de fichiers sont des liens par defaut ; declarer le schema dans la config de
  l'app (skill `expo-router`).
- React Native sans Expo : configuration `linking` de React Navigation (skill `react-navigation`).
- Flutter : `go_router` (skill `flutter-setup-declarative-routing`).
- Natif : `onOpenURL` / scene delegate (iOS), intent de l'activite (Android), avec Navigation 3 ou la
  navigation du projet.

## Securite

- Valider et normaliser chaque parametre ; un lien ne declenche jamais seul une action sensible
  (paiement, suppression, changement d'email) : il ouvre un ecran qui demande confirmation.
- Pas de jeton d'authentification dans un lien ; attention aux redirections ouvertes.

## Tests

- iOS : `xcrun simctl openurl booted "<url>"` ; Android :
  `adb shell am start -W -a android.intent.action.VIEW -d "<url>" <package>`.
- Cas : app installee et fermee, en arriere-plan, non installee (page web de repli), lien invalide.
