---
name: ultime-profile
description: >
  N'active pour un projet que les packs ultime-skill utiles, pour alleger le contexte charge a chaque
  session et garder des skills qui se declenchent bien. A utiliser pour configurer ou alleger les skills
  d'un projet, adapter les packs a une tache, quand trop de skills sont installees, ou "ultime-profile".
---

# Profil de packs par projet

Chaque skill d'un plugin active ajoute sa description au contexte **a chaque tour**. La liste a un budget
(environ 1 % de la fenetre de contexte) : au-dela, Claude Code retire des descriptions et les skills
concernees ne se declenchent plus. Le reglage `skillOverrides` ne s'applique pas aux skills de plugin ; le
levier est l'activation des plugins par scope (`enabledPlugins`), qu'on pilote avec la CLI.

Catalogue des packs, de leur role et de leur cout en contexte : [references/catalog.md](references/catalog.md).

## Methode

1. **Detecter le projet** a partir des fichiers (dependances, manifestes, infra) et de la tache en cours.
2. **Proposer un profil** par question a choix multiples (plusieurs reponses) : les packs recommandes
   d'apres le tableau ci-dessous, avec leur cout lu dans le catalogue. Rien n'est active par defaut sans
   accord.
3. **Choisir le scope** : `local` par defaut (personnel, hors git, `.claude/settings.local.json`) ;
   `project` pour partager le profil avec l'equipe (`.claude/settings.json`, a committer).
4. **Appliquer**, en ne touchant qu'aux plugins `@ultime-skill` (jamais a ceux d'autres marketplaces) :
   - `claude plugin list --json` pour connaitre les packs installes ;
   - `claude plugin enable <pack>@ultime-skill --scope <scope>` pour chaque pack retenu ;
   - `claude plugin disable <pack>@ultime-skill --scope <scope>` pour chaque autre pack installe **et pour
     chaque bundle `ultime-*`** : un bundle dont une dependance est desactivee echoue au chargement.
5. **Faire recharger** : l'utilisateur lance `/reload-plugins` (ou redemarre la session).
6. **Ajuster en cours de route** : quand la tache change de domaine (passer du code a la fiche store, par
   exemple), activer le pack necessaire au scope `local`, recharger, et le desactiver apres si l'usage est
   ponctuel.

## Mode sobre global (optionnel)

Pour que rien ne se charge par defaut : desactiver les packs au scope `user`
(`claude plugin disable <pack>@ultime-skill --scope user`), sauf `ultime-profile` et ce que l'utilisateur
veut partout ; chaque projet active ensuite son profil. Modifie la configuration personnelle : confirmer
avant.

## Profils types

| Projet ou tache | Packs |
|---|---|
| App web (React, Next.js) | agent-skills, fullstack, design, compliance, security, monitoring, prod-testing |
| API ou backend | agent-skills, security, devops, monitoring, prod-testing ; data-engineering si base de donnees |
| Mobile Expo ou React Native | mobile, mobile-expo, design, compliance, security |
| Mobile iOS natif | mobile, mobile-ios, design, compliance, security |
| Mobile Android natif | mobile, mobile-android, design, compliance, security |
| Mobile Flutter | mobile, mobile-flutter, design, compliance, security |
| Publication et fiche store (au lancement) | app-stores, puis store-apple et/ou store-google selon les stores vises, store-aso |
| Marketing et acquisition | growth (toujours : contexte produit partage), puis selon la tache growth-seo, growth-ads, growth-social, growth-analytics, growth-cro ; video-editing et motion-design pour produire des videos |
| Data | data-engineering, dataviz, monitoring |
| ML ou LLM | ml-engineering, data-engineering, monitoring |
| Infrastructure et exploitation | devops, finops, monitoring, security, prod-testing |
| Projet pilote par app-factory | app-factory, product-management, puis les packs de la stack ; greenfield seulement en clone ou reprise d'un code dont on a les droits |
| Audit de securite | security, sec-audit, sec-defense |
| Contenu, motion, video | design, motion-design, video-editing |

`ponytail` et `superpowers` ajoutent un hook au demarrage de session (contexte injecte a chaque session) :
les activer la ou leur methode est voulue, pas partout par reflexe.
