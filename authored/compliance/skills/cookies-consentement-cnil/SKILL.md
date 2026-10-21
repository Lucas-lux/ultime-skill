---
name: cookies-consentement-cnil
description: >
  Cookies et traceurs selon la CNIL : consentement libre, refus aussi simple que l'acceptation, durees,
  preuve, exemptions, cookie walls, CMP. A utiliser quand l'utilisateur parle de cookies, traceurs,
  bandeau ou banniere de consentement, consentement, CMP, tracking, mesure d'audience, ou conformite CNIL
  des cookies.
---

# Cookies et traceurs (CNIL)

Cadre : article 82 de la loi Informatique et Libertes (transposition de la directive ePrivacy), precise
par les lignes directrices et la recommandation "cookies et autres traceurs" de la CNIL de 2020. Verifier
le comportement reel du site (ce qui est depose avant consentement), pas seulement la configuration de la
CMP.

## Principe

Tout traceur qui n'est pas strictement necessaire au service requiert le **consentement prealable** de
l'utilisateur. Rien qui requiert consentement n'est depose ni lu **avant** une action positive et
eclairee. Le simple fait de continuer a naviguer ne vaut pas consentement.

## Regles concretes a verifier

- **Refus aussi simple qu'accepter.** S'il y a un bouton "Tout accepter", il y a un bouton "Tout refuser"
  de meme niveau, visible au meme ecran. Pas de refus cache derriere plusieurs clics.
- **Pas de consentement par defaut.** Aucune case pre-cochee, aucun traceur non essentiel actif tant que
  l'utilisateur n'a pas consenti. Le choix par defaut est le refus.
- **Consentement granulaire.** Possibilite de consentir par finalite (mesure d'audience, publicite,
  reseaux sociaux...), pas seulement un tout ou rien.
- **Information claire** avant le choix : finalites, responsables et possibilite de retirer son
  consentement aussi facilement qu'il a ete donne.
- **Retrait** : un moyen simple et permanent de revenir sur son choix (lien ou icone accessible a tout
  moment).

## Durees

- **Duree de vie d'un traceur** : 13 mois maximum apres sa depose, non prorogeable au seul retour de
  l'utilisateur (recommandation CNIL).
- **Informations collectees via les traceurs** : conservation 25 mois maximum.
- **Duree de validite du choix** : la CNIL recommande de conserver le choix (consentement comme refus) pour
  une duree de l'ordre de 6 mois, afin de ne pas resolliciter trop souvent.
- Revoir ces durees a la source avant de les ecrire dans une politique : ce sont des recommandations qui
  peuvent evoluer.

## Preuve du consentement

Conserver la preuve que le consentement a ete valablement recueilli (horodatage, version de la banniere,
finalites acceptees), de maniere a pouvoir la produire. Journaliser sans donnee personnelle superflue.

## Exemptions de consentement

Certains traceurs sont exemptes car strictement necessaires : panier d'achat, authentification de session,
preferences de langue, equilibrage de charge, et **mesure d'audience** sous conditions strictes (finalite
limitee a la mesure anonyme, pas de recoupement avec d'autres traitements, pas de suivi sur d'autres sites,
duree limitee). La CNIL publie la liste des solutions de mesure d'audience exemptees : la verifier plutot
que de supposer.

## Cookie walls

Le "cookie wall" (acces conditionne a l'acceptation des traceurs) n'est pas interdit par principe mais
s'apprecie **au cas par cas** selon l'existence d'une alternative reelle d'acces au service. Ne pas le
presenter comme toujours autorise ni toujours interdit.

## Integration d'une CMP (checklist)

- Blocage effectif des traceurs **avant** consentement (tags, SDK tiers, pixels) : verifier dans le
  navigateur qu'aucun traceur non essentiel ne part avant le choix.
- Boutons accepter et refuser au meme niveau, choix granulaire par finalite.
- Etat du consentement propage aux tags (mode consentement) et respecte cote serveur si besoin.
- Point de retrait accessible en permanence, qui remet reellement a zero les traceurs concernes.
- Journal de preuve du consentement.
- Tester le parcours complet : premiere visite, refus, acceptation partielle, retrait, revisite apres
  expiration du choix.
