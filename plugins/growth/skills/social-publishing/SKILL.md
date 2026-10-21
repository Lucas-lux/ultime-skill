---
name: social-publishing
description: >
  Passe de la strategie sociale a la publication : calendrier editorial, preparation des posts par
  plateforme, programmation via les outils officiels, validation avant publication, gestion de
  communaute, mesure. A utiliser pour planifier, preparer, programmer ou publier des posts, gerer un
  calendrier editorial ou animer une communaute sur les reseaux sociaux.
---

# Publication sur les reseaux sociaux

La strategie, les piliers de contenu et les formats sont dans la skill `social` ; cette skill couvre
l'execution. **Rien n'est publie sans l'accord de l'utilisateur** (post par post, ou lot valide
explicitement).

## Calendrier editorial

Un fichier `content/calendar.csv` (ou `.md`), une ligne par post : date et heure, plateforme, format,
pilier, texte, visuels, texte alternatif, lien avec UTM (skill `analytics`), mention de partenariat le cas
echeant, statut (idee, redige, valide, programme, publie), resultats.

## Preparer un post

- Adapter a chaque plateforme (longueur, format d'image ou de video, ton) au lieu de dupliquer.
- Accessibilite : texte alternatif pour les images, sous-titres pour les videos.
- Liens traces (UTM) ; visuels issus de `marketing-creatives`.
- Relire : promesse exacte, mentions obligatoires (`marketing-compliance-fr`), pas de donnee personnelle
  d'un tiers.

## Programmer et publier

Par ordre de preference :
1. Les outils natifs des plateformes (Meta Business Suite pour Facebook et Instagram, outils de
   programmation de TikTok, YouTube Studio, LinkedIn) depuis les comptes de l'utilisateur.
2. Un outil de programmation que l'utilisateur utilise deja, via son API officielle (jetons configures par
   l'utilisateur, jamais dans le depot).
3. Le navigateur (skill du navigateur utilise), en remplissant puis en laissant l'utilisateur valider.

Interdit : automatisations contraires aux conditions des plateformes (messages prives en masse,
follow/unfollow automatique, faux engagement, achat d'abonnes ou d'avis), et toute publication non
validee.

## Communaute

- Charte de reponse : ton, delais, ce a quoi on repond, ce qu'on escalade (support, juridique, crise).
- Moderation selon une regle publiee ; ne pas supprimer une critique legitime ; repondre aux questions
  produit avec des liens vers l'aide.
- Remonter les retours utiles au backlog produit.

## Mesure

Rapport hebdomadaire : portee, engagement, clics, abonnements, conversions attribuees (UTM), meilleurs et
pires posts, apprentissages et ajustements du calendrier.
