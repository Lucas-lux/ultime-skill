---
name: push-notifications
description: >
  Notifications push iOS et Android (APNs, FCM) en natif, React Native, Expo et Flutter : permissions,
  jetons, envoi serveur, canaux, ouverture vers un ecran, consentement. A utiliser pour ajouter, deboguer
  ou concevoir des notifications push, APNs, FCM, expo-notifications, firebase_messaging, ou
  notifications marketing.
---

# Notifications push

## Architecture

- **iOS** : APNs. Authentification par cle (.p8, recommandee, ne expire pas) plutot que par certificat.
  Environnements sandbox et production distincts.
- **Android** : Firebase Cloud Messaging, API HTTP v1 avec un compte de service (les anciennes API FCM
  ont ete retirees). FCM peut aussi relayer vers APNs pour une app iOS.
- **Expo** : `expo-notifications`, envoi via le service de push d'Expo ou directement APNs/FCM.
- **Flutter** : `firebase_messaging` (et `flutter_local_notifications` pour l'affichage local).
- **Serveur** : stocker un jeton par appareil et par utilisateur ; les jetons changent (reinstallation,
  restauration, rotation) : mettre a jour a chaque lancement et supprimer ceux que le service declare
  invalides. Envoi asynchrone par file, avec reessais et limitation de debit.

## Permissions

- iOS : demander l'autorisation au bon moment (apres avoir explique la valeur), pas au premier
  lancement ; l'autorisation provisoire permet d'envoyer silencieusement dans le centre de
  notifications.
- Android 13 et plus : permission d'execution `POST_NOTIFICATIONS`. Canaux de notification par type
  (l'utilisateur les regle un par un), crees au demarrage.
- Gerer le refus : l'app fonctionne sans, et propose de reactiver depuis les reglages.

## Contenu et comportement

- Charge utile : titre, texte, et des donnees pour ouvrir le bon ecran (lien interne, voir `deep-links`).
- Gerer les trois cas : app au premier plan, en arriere-plan, fermee (ouverture depuis la notification).
- Notifications silencieuses (mise a jour en arriere-plan) : limitees et non garanties par les OS, ne pas
  en dependre pour une logique critique.
- Pas de donnee sensible dans le texte d'une notification (visible sur l'ecran verrouille).

## Consentement et vie privee

- Distinguer notifications de service (liees a l'usage) et notifications marketing ; pour la
  prospection, recueillir un consentement explicite et permettre la desactivation par categorie dans
  l'app (skill `rgpd-cnil`).
- Le jeton de push est une donnee liee a l'appareil : la declarer dans les labels Apple et le formulaire
  Data safety.

## Tests

- iOS : simulateur (envoi de charge utile locale) et appareil reel pour APNs ; Android : emulateur avec
  services Google.
- Tester les trois etats de l'app, le refus de permission, le jeton invalide, et l'ouverture vers l'ecran
  cible.
- Mesurer : taux d'opt-in, de livraison, d'ouverture ; desabonnements par categorie.
