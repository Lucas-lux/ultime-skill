---
name: mobile-accessibility
description: >
  Accessibilite des apps mobiles Android (Compose, vues), React Native et Flutter : lecteurs d'ecran
  TalkBack et VoiceOver, libelles, roles, tailles de cible, texte agrandi, contrastes, mouvement reduit,
  tests. A utiliser pour rendre accessible ou auditer une app mobile, TalkBack, VoiceOver, accessibilite
  mobile ou EN 301 549.
---

# Accessibilite mobile

Pour iOS natif en profondeur : skill `ios-accessibility` (pack mobile-ios). Le referentiel europeen EN
301 549 couvre aussi les applications mobiles ; il sert de base au European Accessibility Act.

## Exigences communes

- Chaque element interactif a un libelle comprehensible, un role et un etat annonces par le lecteur
  d'ecran ; les images decoratives sont ignorees.
- Tailles de cible : au moins 44 x 44 points (iOS) et 48 x 48 dp (Android).
- Texte qui suit le reglage de taille du systeme sans etre tronque ni chevauche ; mises en page qui
  s'adaptent.
- Contrastes suffisants (4,5:1 pour le texte courant) ; l'information ne passe jamais par la couleur
  seule.
- Ordre de focus logique ; regroupement des elements lies ; annonces des changements dynamiques.
- Respect du mouvement reduit ; pas de contenu qui clignote.

## Par technologie

- **React Native** : `accessible`, `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`,
  `accessibilityState` ; ne pas desactiver `allowFontScaling` ; `AccessibilityInfo` pour le lecteur d'ecran
  et le mouvement reduit.
- **Jetpack Compose** : `contentDescription`, `Modifier.semantics` (role, etat),
  `semantics(mergeDescendants = true)` pour regrouper, `clearAndSetSemantics` pour remplacer.
- **Vues Android** : `contentDescription`, `importantForAccessibility`, `labelFor`.
- **Flutter** : widget `Semantics`, `semanticsLabel`, `ExcludeSemantics`, `MergeSemantics` ; tester avec
  `MediaQuery.textScaler` agrandi.

## Tester

- A la main : parcours critiques avec TalkBack et VoiceOver actives, texte au maximum, mode sombre,
  contraste eleve.
- Outils : Accessibility Scanner (Android), Accessibility Inspector (Xcode), verifications automatiques
  dans les tests UI quand le framework le permet.
- Consigner les ecarts et le niveau atteint (declaration d'accessibilite si l'app y est soumise).
