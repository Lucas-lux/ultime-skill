---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/app/**"
  - "**/pages/**"
  - "**/components/**"
---

# React et Next.js

- Composants serveur par defaut (App Router) ; `'use client'` seulement pour l'etat, les effets ou les
  evenements, au plus bas de l'arbre.
- Pas de `useEffect` pour deriver une valeur ou charger des donnees cote serveur ; pas de fetch en
  cascade : charger en parallele, `Suspense` pour le streaming.
- Accessibilite : elements natifs (`button`, `a`, `label`), textes alternatifs, focus visible, contraste.
- Formulaires : validation cote serveur obligatoire (actions serveur ou route), le client ne fait foi
  de rien.
- Secrets jamais dans un composant client ni dans une variable `NEXT_PUBLIC_`.
- Images par `next/image`, polices par `next/font`, metadonnees par l'API `metadata`.
