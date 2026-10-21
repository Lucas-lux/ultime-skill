---
name: ui-review
description: >
  Revue d'une interface web dans le code et a l'ecran : accessibilite, interactions, formulaires, etats,
  performance percue, contenu, coherence avec le design system, avec preuves et corrections. A utiliser
  pour "revue UI", "review my UI", "audit design", "check accessibility", "UX review".
---

# Revue d'interface

Regle d'or : regarder l'interface rendue, pas seulement le code. Chaque constat a une preuve : capture,
`fichier:ligne`, ou mesure (contraste, taille de cible, temps).

## 1. Preparer

- Pages et parcours a revoir (sans precision : les parcours critiques du PRD, sinon la page d'accueil, la
  connexion et le parcours principal).
- Lancer l'app en local (skill `run`) et ouvrir chaque page en largeur bureau (1440 px) et mobile
  (375 px), en theme clair et sombre si le site en a deux.
- Charger le design system du projet (tokens, composants) : il est la reference avant tout gout.

## 2. Passer la grille

Grille detaillee : [references/web-interface-guidelines.md](references/web-interface-guidelines.md)
(Web Interface Guidelines de Vercel, licence MIT jointe). Ordre de passage, du plus grave au plus fin :

1. **Accessibilite** : navigation complete au clavier, focus visible, ordre logique, roles et noms
   accessibles, contraste (4.5:1 pour le texte, 3:1 pour les grands textes et composants), textes
   alternatifs, `prefers-reduced-motion` respecte. Mesurer avec `@axe-core/playwright` ou Lighthouse.
2. **Formulaires** : labels associes, types et `autocomplete` corrects, erreurs pres du champ et
   annoncees, valeur conservee apres erreur, soumission desactivee seulement pendant l'envoi.
3. **Etats** : chargement, vide, erreur, succes, hors ligne ; aucun ecran blanc ni saut de mise en page.
4. **Interactions** : cibles d'au moins 44 px en tactile, survol non requis, retour immediat a chaque
   action, actions destructives confirmees ou annulables.
5. **Mise en page** : pas de debordement horizontal en 375 px, zones sures sur mobile, longueur de ligne
   lisible, alignements et espacements sur la grille des tokens.
6. **Performance percue** : images dimensionnees et paresseuses hors ecran, polices sans saut de texte,
   pas de blocage au clic (mesures LCP, CLS, INP).
7. **Contenu** : textes clairs et coherents, nombres et dates au format de la langue, aucun texte de
   remplissage, ton conforme a la marque.
8. **Coherence** : composants du design system plutot que des variantes locales, aucun motif generique
   d'interface generee (voir les skills `impeccable` et `frontend-design` du pack ui-design).

## 3. Corriger et rendre

- Corriger directement ce qui releve du code (accessibilite, etats, formulaires) avec la plus petite
  modification, et un test end to end ou un controle axe qui empeche le retour.
- Ce qui change le design (couleur de marque, mise en page d'un ecran, ton) est propose avec une capture
  avant et apres, pas impose.
- Rapport en francais (`docs/design/ui-review-<date>.md`) : tableau gravite (bloquant, majeur, mineur) /
  page / constat / preuve / correction / etat, puis ce qui n'a pas ete revu.
