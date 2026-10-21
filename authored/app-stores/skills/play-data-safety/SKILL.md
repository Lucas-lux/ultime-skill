---
name: play-data-safety
description: >
  Etablit les reponses du formulaire Data safety de Google Play a partir du code et des SDK reellement
  embarques : types de donnees, collecte, partage, finalites, chiffrement, suppression. A utiliser pour
  remplir ou verifier le formulaire Data safety, la section securite des donnees de la Play Console, ou
  un rejet Google Play lie aux donnees.
---

# Formulaire Data safety (Google Play)

Le formulaire engage le developpeur : il doit refleter ce que l'app et **tous ses SDK** font reellement,
pas ce que l'equipe pense qu'ils font. Equivalent Apple : labels de confidentialite (`privacy-policy`,
`privacy-publish` du pack store-apple) ; les deux doivent etre coherents entre eux et avec la politique de
confidentialite.

## Methode

1. **Inventorier les sources de donnees** : permissions du manifeste, appels reseau de l'app, formulaires,
   et chaque SDK (analytics, crash, publicite, attribution, authentification, paiement, cartes, chat). Pour
   chaque SDK, lire sa documentation de divulgation Data safety (la plupart des editeurs en publient une).
2. **Classer chaque donnee** selon les categories du formulaire : localisation, informations
   personnelles, informations financieres, sante et forme, messages, photos et videos, fichiers audio,
   fichiers et documents, agenda, contacts, activite dans l'app, navigation web, informations et
   performances de l'app, identifiants de l'appareil ou autres.
3. **Pour chaque donnee** :
   - collectee (quitte l'appareil) ou non ; traitement ephemere ou non ;
   - partagee avec un tiers ou non (les prestataires agissant pour le compte du developpeur ne comptent
     pas comme un partage, selon les definitions de Google a relire) ;
   - obligatoire ou facultative pour l'utilisateur ;
   - finalites : fonctionnement de l'app, analyse, communications du developpeur, publicite ou
     marketing, prevention de la fraude et securite, personnalisation, gestion du compte.
4. **Pratiques de securite** : chiffrement en transit, possibilite de demander la suppression des
   donnees, engagement eventuel envers une politique de familles ou une verification independante.
5. **Rediger le tableau des reponses** dans `store/data-safety.md` (donnee, collectee, partagee, finalites,
   facultative, source dans le code ou le SDK), a valider par l'utilisateur.
6. **Saisir** : via la Play Console (skill `store-console-browser`) ; la console propose aussi un import
   et un export du formulaire, a utiliser s'il est disponible.

## Points d'attention

- Identifiant publicitaire, identifiant d'installation des SDK d'analytics, jeton de push : ce sont des
  identifiants de l'appareil, a declarer.
- Une permission declaree mais inutile doit etre retiree du manifeste plutot que justifiee.
- Toute evolution (nouveau SDK, nouvelle donnee) impose de mettre le formulaire a jour avant la release.
- Coherence avec le registre RGPD et la politique de confidentialite (skill `rgpd-cnil`).
