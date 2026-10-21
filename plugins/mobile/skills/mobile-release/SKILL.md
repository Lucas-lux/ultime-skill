---
name: mobile-release
description: >
  Publier une app iOS et Android de bout en bout : signature, versions, builds, TestFlight, pistes Google
  Play, deploiement progressif, fastlane, EAS, CI. A utiliser pour signer, builder, publier, soumettre ou
  mettre a jour une app mobile, configurer fastlane (match, pilot, deliver, supply), une piste de test ou
  un rollout.
---

# Publier une app mobile

Les CLI officielles ou dediees passent en premier (skills `asc-*` du pack store-apple, `gplay-*` du pack
store-google, `eas-app-stores` pour Expo) ; fastlane reste le standard multiplateforme. Chaque soumission,
publication ou acceptation de contrat est confirmee par l'utilisateur au moment de la faire.

## Prealables (a faire par l'utilisateur)

- Comptes developpeur Apple et Google Play a son nom ou a celui de l'organisation (verification
  d'identite, numero D-U-N-S pour une organisation chez Apple, frais d'inscription) : l'agent ne cree pas
  de compte et ne paie pas.
- Cles d'API : cle App Store Connect (.p8) et compte de service Google Play avec les droits minimaux,
  stockees hors du depot (gestionnaire de secrets de la CI, `.env` ignore par git).

## Identite et versions

- Identifiants stables des le depart : bundle ID iOS, `applicationId` Android ; ils ne changent plus
  apres la premiere publication.
- iOS : `CFBundleShortVersionString` (version visible) et `CFBundleVersion` (build, croissant). Android :
  `versionName` et `versionCode` (entier strictement croissant). Les incrementer en CI, pas a la main.

## Signature

- **iOS** : certificats et profils geres par `fastlane match` (stockage chiffre partage) ou par la
  signature automatique du compte via l'API ; jamais de certificat dans le depot en clair.
- **Android** : Android App Bundle (AAB) et Play App Signing, obligatoires pour les nouvelles apps ;
  Google detient la cle de signature de l'app, l'equipe garde la cle d'upload (sauvegardee, avec
  procedure de reinitialisation documentee). L'empreinte SHA-256 de la cle de signature Play sert aussi
  aux App Links (skill `deep-links`).

## Pistes de test et diffusion

- **iOS** : TestFlight, testeurs internes (membres de l'equipe App Store Connect) puis externes (soumis a
  une revue beta). Mise en production avec diffusion progressive sur 7 jours (phased release), pausable.
- **Android** : pistes interne, fermee, ouverte, production ; deploiement progressif par pourcentage,
  pausable et arretable. Un compte developpeur personnel recent doit faire tourner un test ferme avec un
  minimum de testeurs pendant une duree donnee avant d'acceder a la production : verifier les seuils en
  vigueur dans l'aide Play Console.
- Exigences qui changent chaque annee : niveau d'API Android cible, taille de page memoire, SDK et
  version de Xcode minimum pour soumettre. Les verifier dans la documentation officielle avant chaque
  release, ne pas les supposer.

## Automatisation

- **fastlane** : `match` (signature), `gym` (build iOS), `pilot` (TestFlight), `deliver` (metadonnees et
  soumission App Store), `supply` (upload Play et metadonnees), `snapshot` et `screengrab` (captures).
- **Expo** : EAS Build et EAS Submit (skill `eas-app-stores`), mises a jour OTA avec EAS Update
  (`eas-update`) pour le JavaScript et les assets seulement ; une OTA ne change pas la finalite de l'app ni
  ne contourne la revue.
- **CI** : build signe a chaque tag, upload automatique vers la piste de test, promotion manuelle vers la
  production. Secrets injectes par la CI ; journaux sans secret.

## Checklist avant soumission

- Version et build incrementes ; notes de version dans chaque langue (`release-notes`).
- Fiche, captures, confidentialite et classification a jour (pack app-stores).
- iOS : manifeste de confidentialite (`PrivacyInfo.xcprivacy`) pour les API a raison declaree et les SDK
  concernes ; suppression de compte depuis l'app si l'app permet d'en creer un.
- Android : formulaire Data safety coherent avec le code (skill `play-data-safety`) ; suppression de
  compte depuis l'app et via un lien web si l'app permet d'en creer un.
- Compte de demonstration fourni aux reviewers si l'app exige une connexion, transmis par la console,
  jamais committe.
- Crash reporting et monitoring actifs (skill `setting-up-monitoring`, couche mobile) ; plan de retour
  arriere (pause du rollout, build precedent pret).
