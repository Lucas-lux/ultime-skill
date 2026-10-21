---
name: marketing-creatives
description: >
  Chaine de production des creatives marketing d'une app ou d'un produit : brief, concepts, images,
  videos (UGC, demo, motion), declinaisons par plateforme, droits et mentions, organisation et tests. A
  utiliser pour produire des creatives publicitaires, visuels, videos marketing, videos UGC, contenus de
  lancement ou un kit de campagne.
---

# Creatives marketing (images et videos)

Cette skill orchestre les outils de production ; la strategie creative detaillee est dans
`ad-creative`, les textes dans `copywriting`.

## Chaine

1. **Contexte** : lire `.agents/product-marketing.md` (skill `product-marketing`) ; sinon le creer.
2. **Brief** : objectif (notoriete, installs, conversion), audience, plateforme, message, preuve, appel a
   l'action, contraintes de marque et de budget.
3. **Concepts** : chaque concept est une hypothese testable (audience, motivation, angle, format)
   (`ad-creative`, `marketing-psychology`).
4. **Production** avec l'outil adapte (voir tableau), estimation du cout avant toute generation payante,
   et accord de l'utilisateur.
5. **Declinaisons** par format et plateforme ; sous-titres incrustes (beaucoup de videos sont vues sans
   le son) ; zones de securite des interfaces respectees.
6. **Controle** : fidelite au produit, lisibilite sur mobile, droits, mentions obligatoires.
7. **Livraison et tests** : manifeste de campagne, puis suivi des resultats par concept.

## Outils

| Besoin | Skills (si installees) |
|---|---|
| Images marketing, visuels sociaux | `image` ; `gen-ai-images` ; `google-flow-generate` (inclus dans un abonnement Google AI Pro) |
| Video generee ou programmatique | `video` ; `gen-ai-video` ; `google-flow-generate` |
| Video UGC avec un acteur recurrent qui presente l'app | `ugc-app-video` |
| Voix off, musique, sons | `gen-ai-audio` |
| Montage, sous-titres, formats | pack video-editing (`ffmpeg-video-editor`, `video-use`, `faster-whisper`) |
| Animation et motion design | pack motion-design (GSAP, Lottie, Manim) |
| Captures et video de fiche store | `app-store-screenshots`, `app-preview-video` (pack store-aso) |

Privilegier ce que l'utilisateur paie deja (abonnement) avant des credits a l'usage ; annoncer le cout
estime avant de generer.

## Formats courants

Vertical 9:16 (Reels, TikTok, Shorts, Stories), 4:5 et 1:1 (fils), 16:9 (YouTube, web). Les durees,
poids et zones de securite exacts changent : les verifier dans la documentation de chaque plateforme
avant export.

## Droits et mentions

- Musique sous licence adaptee a la publicite (les bibliotheques gratuites des plateformes ne couvrent pas
  toujours l'usage publicitaire).
- Personnes filmees ou createurs : autorisation ecrite (droit a l'image), contrat precisant usages,
  supports et duree ; mention de la collaboration commerciale.
- Pas de faux temoignage presente comme reel, pas de fonctionnalite absente de l'app, pas de fausse
  interface systeme (notification, bouton) qui trompe.
- Contenu genere par IA : appliquer les etiquettes exigees par les plateformes pour les contenus
  realistes ; dans l'UE, l'AI Act impose de signaler les hypertrucages ; en France, la loi sur
  l'influence commerciale impose des mentions pour les images retouchees ou virtuelles (detail dans
  `marketing-compliance-fr`).

## Organisation

`creatives/<campagne>/<concept>/<format>/` et un `manifest.md` par campagne : concept, hypothese, fichiers,
outil et cout, droits et mentions, statut (brouillon, valide, en ligne), resultats.
