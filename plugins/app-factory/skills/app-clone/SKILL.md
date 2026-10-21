---
name: app-clone
description: >
  Mode clone de l'orchestrateur app-factory : reproduit la valeur d'une app de reference (fonctionnalites,
  parcours, niveau de qualite) et en fait un produit distinct et personnalise, sans copier la marque, les
  assets, les textes ni le code d'autrui. Observe l'app de l'exterieur, ecrit une spec comportementale avec
  ses propres mots, construit une matrice de parite et un brief de personnalisation, puis passe la main a
  app-factory. A utiliser quand l'utilisateur veut cloner, copier, reproduire, s'inspirer de ou faire
  "la meme app que" une app existante, ou dit "app-clone".
---

# Cloner une app en la personnalisant

"Cloner" veut dire ici : livrer un produit qui rend le meme service, aussi bien ou mieux, sous une
identite propre. C'est ce qui est legal et ce qui passe la revue des stores. Une copie servile expose a la
contrefacon (marque, droit d'auteur sur les textes, visuels et code), a la concurrence deloyale et au
parasitisme, et au rejet : Apple refuse les apps imitatrices (regle 4.1 des App Review Guidelines) et
Google Play sanctionne l'usurpation d'identite.

Cette skill couvre la phase P0 du mode clone. Ensuite, `app-factory` reprend a P1.

## Ce qu'on reprend, ce qu'on ne reprend pas

| Reprendre (idees, fonctions) | Ne jamais reprendre |
|---|---|
| Fonctionnalites, parcours, regles metier visibles | Nom, logo, marque, icone, charte graphique reconnaissable |
| Niveau de qualite, bonnes idees d'ergonomie | Textes, illustrations, photos, sons, videos |
| Modele economique en general | Code source, assets ou API privees de l'app |
| Conventions d'interface standard de la plateforme | Contenus de sa base (catalogue, avis, profils) |

## Sources d'observation

- **Autorisees** : utiliser l'app comme un utilisateur (navigateur ou appareil, compte de l'utilisateur),
  fiche store, site marketing, documentation et API publiques, notes de version, avis publics (pour les
  irritants a corriger, sans republier leur contenu).
- **Respecter les CGU de l'app** : pas de scraping massif, pas de contournement d'authentification ou de
  paywall, pas de faux compte.
- **Code source ou binaire** : seulement si l'utilisateur en detient les droits (son ancienne app, un
  projet open source dont on respecte la licence). Dans ce cas, `greenfield` (`/greenfield:analyze`)
  produit des specs comportementales "salle blanche" sans heritage de code. La decompilation d'une app
  tierce pour la reproduire est exclue.

## Etapes

1. **Cadrer** (questions a choix multiples) : app de reference (liens web et stores), ce que
   l'utilisateur veut garder, marche et langues cibles, differenciation souhaitee, plateformes.
2. **Observer** : agent `reverse-spec-analyst`. Inventaire des ecrans, parcours, roles, regles metier
   visibles, notifications, onboarding, reglages, monetisation, integrations. Captures et notes dans
   `.app-factory/reference/` (usage interne, jamais livrees ni versionnees si elles contiennent des
   donnees de tiers).
3. **Ecrire la spec comportementale** `docs/product/reference-spec.md` : capacites utilisateur et
   criteres d'acceptation, rediges avec ses propres mots. Aucun texte de l'app recopie.
4. **Matrice de parite** `docs/product/parity-matrix.md` : chaque fonctionnalite classee indispensable,
   utile, a ignorer ou a ameliorer, plus les irritants releves dans les avis, qui deviennent des
   differenciateurs.
5. **Brief de personnalisation** (agent `product-strategist`) : nom (`product-name`), positionnement
   (`positioning-ideas`, `value-proposition`), identite visuelle propre (pack design), ton, langues,
   monetisation adaptee au marche, obligations locales. Disponibilite du nom a faire verifier par
   l'utilisateur (bases INPI et EUIPO, stores, nom de domaine) : l'agent liste les recherches, il ne
   conclut pas a la place d'un juriste.
6. **Controle de distinction** (agent `gate-verifier`) : nom, icone, couleurs, captures, textes et
   parcours signature ne doivent pas preter a confusion avec l'app de reference. Tout point douteux est
   corrige avant G0.
7. **Passer la main** : `docs/product/brief.md` complete, puis `app-factory` en P1 (decouverte allegee :
   l'app de reference est le premier concurrent analyse).

## Livrables

`docs/product/reference-spec.md`, `docs/product/parity-matrix.md`, `docs/product/brief.md`, rapport de
distinction dans `.app-factory/gates/G0.md`.
