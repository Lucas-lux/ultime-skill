---
name: mobile-security-masvs
description: >
  Audit et durcissement de securite d'une app mobile iOS, Android, React Native ou Flutter selon OWASP
  MASVS et MASTG : stockage, crypto, authentification, reseau, plateforme, code, resilience, vie privee. A
  utiliser pour securiser ou auditer une app mobile, OWASP MASVS, MASTG, stockage securise, pinning, ou
  donnees sensibles sur mobile.
---

# Securite mobile (OWASP MASVS)

Reference : OWASP MASVS (exigences) et MASTG (methodes de test), en version 2 : les categories ci-dessous
remplacent l'ancien decoupage. Viser le profil L1 pour toute app, L2 pour les donnees sensibles (sante,
finance, identite), et ajouter la resilience (R) quand l'app protege un actif contre la retro-ingenierie.

Tester uniquement l'app du projet, sur ses environnements de developpement ou de recette.

## Par categorie

| Categorie | A verifier dans le code et a l'execution |
|---|---|
| MASVS-STORAGE | Secrets et jetons dans le Keychain (iOS) ou le Keystore / EncryptedSharedPreferences equivalents (Android), jamais en clair (UserDefaults, SharedPreferences, AsyncStorage, fichiers). Rien de sensible dans les logs, captures d'ecran du selecteur d'apps, presse-papiers, sauvegardes. |
| MASVS-CRYPTO | Algorithmes et API de la plateforme (CryptoKit, Keystore), pas de crypto maison, pas de cle en dur dans le binaire. |
| MASVS-AUTH | Authentification et autorisation verifiees cote serveur ; biometrie liee a une cle du Keystore ou du Keychain, pas a un simple booleen ; sessions revocables. |
| MASVS-NETWORK | TLS partout (App Transport Security, Network Security Config sans trafic en clair) ; pinning seulement si le risque le justifie et avec un plan de rotation. |
| MASVS-PLATFORM | Deep links et intents valides et filtres (skill `deep-links`, `android-intent-security`) ; WebView sans JavaScript ni pont natif inutiles ; permissions minimales (`android-permissions-security`). |
| MASVS-CODE | Dependances a jour et auditees ; entrees validees ; versions minimales d'OS raisonnables ; mise a jour forcee possible pour retirer une version vulnerable. |
| MASVS-RESILIENCE | Detection de root ou jailbreak, d'instrumentation et d'alteration, obfuscation (R8 cote Android) : en defense en profondeur, jamais comme seule protection. |
| MASVS-PRIVACY | Minimisation des donnees, transparence (labels Apple, Data safety Google), consentement, identifiants publicitaires seulement avec accord (App Tracking Transparency sur iOS). |

## Methode

1. Lire le modele de menace du projet ; sinon le faire (`security-threat-model`).
2. Revue de code par categorie (tableau ci-dessus) ; specifiquement en React Native et Flutter : pas de
   secret dans le bundle JavaScript ou Dart (il est lisible), stockage securise via une bibliotheque qui
   utilise Keychain et Keystore.
3. Analyse statique du binaire (MobSF ou equivalent) sur un build de recette.
4. Tests dynamiques MASTG sur appareil ou emulateur de test : stockage apres usage, trafic reseau,
   comportement des deep links.
5. Rapport : exigence MASVS, preuve, gravite, correction ; reprise des points bloquants avant release.

## Pieges frequents

- Cle d'API d'un service tiers embarquee dans l'app : la considerer comme publique ; passer par un
  backend ou restreindre la cle (domaine, bundle, quotas).
- Jeton de session dans AsyncStorage ou SharedPreferences en clair.
- Logs de debug actifs en production.
- Deep link qui declenche une action sensible sans confirmation.
