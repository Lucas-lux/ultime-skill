# Budget et sobriete

Une session cloud ne peut pas lire son cout en dollars (pas de `--max-budget-usd` hors mode `-p`, pas de
`/cost` documente en cloud). Le budget se tient donc en unites que le reveil compte lui-meme, et en
frequence de reveil, reglee dans la tache planifiee. Les reveils consomment le forfait Claude du
proprietaire : un reveil refuse pour limite d'usage n'est pas une erreur, le suivant reprendra.

## Plafonds (dans `state.json`, bloc `autopilot.budget`)

```json
"budget": {
  "per_run": {"agents": 8, "stories": 3, "upgraded": 1},
  "per_day": {"agents": 30},
  "idle_stop_after": 6,
  "usage": {"day": "2026-10-21", "agents": 0, "idle_streak": 0}
}
```

- `per_run.agents` : appels a l'outil Agent par reveil (un workflow compte pour ses agents).
- `per_run.stories` : stories menees jusqu'a la PR par reveil.
- `per_run.upgraded` : appels avec un modele superieur a celui de l'agent (voir plus bas).
- `per_day.agents` : quand il est atteint, le reveil ne fait plus que lire les decisions et reparer une
  PR rouge, jusqu'au lendemain.
- `idle_stop_after` : apres ce nombre de reveils a vide consecutifs, le tableau de bord le signale (la
  frequence de la tache planifiee est trop haute pour l'activite du projet ; le proprietaire l'ajuste).
- Remettre `usage` a zero quand la date change. Incrementer `usage.agents` au fil du reveil.

## Le bon moteur pour chaque tache

| Tache | Comment |
|---|---|
| Lecture, une commande, un petit correctif | Directement, sans agent |
| Inventaire, recherche simple, reformatage | Agent au modele `haiku` |
| Story standard, revue, QA, livrable de phase | L'agent avec son modele par defaut (`sonnet`) |
| Architecture, donnees, securite, conformite, verification de porte | Agent en `inherit` (modele de la session) |
| Echec repete (2 essais) ou decision structurante | `model: "opus"`, compte dans `per_run.upgraded` |

- Effort : laisser celui de l'agent ; ne monter l'effort que pour un echec repete.
- Pas de fan-out "au cas ou" : paralleliser seulement des taches decidees et independantes.
- Prompts d'agents minces (chemins, decisions), comptes rendus de 15 lignes au plus.
- Un reveil a vide (rien a faire, tout attend une decision) s'arrete apres les lectures de l'etape 2 et 3,
  sans charger de reference ni lancer d'agent.

## Frequence conseillee de la tache planifiee

- Construction active (P5) : toutes les 1 a 2 h en journee.
- Specification, conception, attente de decisions : 2 a 3 fois par jour.
- Projet en veille ou apres lancement : une fois par jour.
- Le declencheur "reponse a une carte" (workflow `autopilot-wake`) reveille le projet sans attendre ;
  c'est lui qui permet une frequence basse sans perdre de reactivite.
