---
name: security-review
description: >
  Revue de securite d'un projet, d'une branche ou d'une PR avec la methode maison : perimetre, choix de la
  bonne revue, preuves, gravite, correction minimale testee, rapport. A utiliser pour "revue de securite",
  "security review", "audit de securite", "trouve les failles", avant une fusion ou une mise en prod.
---

# Revue de securite

Point d'entree unique : cette skill fixe la methode et le livrable, et delegue l'analyse de fond a la
skill specialisee qui convient. Une revue sans preuve n'est pas une revue : chaque constat se demontre.

## 1. Cadrer

- **Perimetre** : un diff (PR, branche, commit), un module, ou tout le depot. Sans precision : le diff de
  la branche courante par rapport a la branche principale s'il existe, sinon tout le depot.
- **Contexte** : modele de menace existant (`docs/security/`), donnees manipulees (personnelles, paiement,
  sante), surfaces exposees (API publique, upload, webhooks, auth), environnement cible.
- **Charge** : un diff de moins de 400 lignes se lit en entier ; au-dela, trier d'abord (fichiers qui
  touchent auth, autorisation, entrees externes, requetes, crypto, configuration, CI).

## 2. Choisir la revue

| Besoin | Skill | Pack |
|---|---|---|
| Diff, PR, branche | `reviewing-code-changes` | security |
| Depot ou module complet | `auditing-code-for-vulnerabilities` (passes, variantes, elimination des faux positifs) | security |
| Pas de modele de menace | `security-threat-model` d'abord | security |
| Categories OWASP et ASVS | `owasp-security` | security |
| Analyse statique outillee | `sast` (Semgrep, CodeQL) | security |
| Dependances et chaine d'approvisionnement | `auditing-supply-chain` | security |
| Workflows GitHub Actions | `gha-security-review` | security |
| Cryptographie | `reviewing-cryptography` | sec-audit |
| LLM, agents, MCP | `securing-ai-systems`, `auditing-mcp-servers` | sec-audit |
| Mobile | `mobile-security-masvs` | mobile |

Toujours, en plus : la liste des pieges de conception de [references/footguns.md](references/footguns.md)
sur le code et la configuration touches.

## 3. Prouver chaque constat

- Un constat = un chemin concret : source controlee par un attaquant, transformations, puits dangereux,
  avec `fichier:ligne` a chaque etape. Pas de chemin, pas de constat.
- **Confiance** : `certain` (chemin complet verifie, idealement reproduit par un test ou une requete en
  local), `probable` (chemin verifie, une condition non prouvee, dite explicitement), `a verifier` (piste).
  Seuls `certain` et `probable` sont des constats ; les pistes vont dans une section a part.
- Avant de garder un constat : chercher la protection qui l'annulerait (validation en amont, middleware,
  ORM qui parametre, configuration du framework). La trouver = faux positif, le noter en une ligne.
- Un constat confirme : chercher ses **variantes** (meme motif ailleurs dans le depot) avant de le
  rapporter ; une correction qui laisse une variante ne ferme rien.
- Secret trouve : type, fichier, ligne, depuis quand (historique git), jamais la valeur, ni dans le
  rapport ni dans une commande.

## 4. Graduer

- **Bloquant** : exploitable sans authentification ou par tout utilisateur, impact sur des donnees
  d'autrui, de l'argent, l'execution de code ou un secret expose. Rien ne fusionne ni ne part en prod.
- **Majeur** : exploitable sous condition realiste (role, configuration, interaction), ou affaiblissement
  net d'un controle existant.
- **Mineur** : defense en profondeur, durcissement, hygiene.

## 5. Corriger

- Correction la plus petite qui ferme la cause et ses variantes (methode ponytail), avec un test qui
  echoue avant et passe apres. Jamais affaiblir un autre controle pour faire passer la correction.
- Ce que la revue corrige seule : le code et la configuration du depot, sur une branche, avec PR.
- Ce qui revient a l'utilisateur (carte de decision en autopilot) : rotation d'un secret expose, purge de
  l'historique git, notification de violation de donnees (pack `compliance`), correctif en production,
  acceptation d'un risque.

## 6. Rendre

Rapport en francais dans `docs/security/review-<date>-<perimetre>.md` :

```
# Revue de securite : <perimetre> (<date>)
Perimetre et methode : <diff ou depot, skills utilisees, outils lances avec leur version>
| # | Gravite | Confiance | Constat | Preuve (fichier:ligne, chemin) | Correction | Etat |
Faux positifs ecartes : <une ligne chacun, avec la protection trouvee>
Pistes a verifier : <...>
Non couvert : <ce qui n'a pas ete regarde et pourquoi>
```

Dans la PR ou la porte app-factory : le tableau et le verdict (bloquants restants ou non), le detail
reste dans le fichier.
