# Etat sur disque et reprise

L'etat permet de reprendre un projet dans une nouvelle session, sur une autre machine ou apres une
compaction de contexte. Il est versionne avec le projet (sauf `reports/`, voir plus bas).

## Arborescence

```
.app-factory/
  state.json        # etat courant, source de verite de l'orchestration
  decisions.md      # journal des decisions de l'utilisateur (date, porte, decision, raison)
  gates/G0.md ...   # rapports de gate-verifier
  reports/          # comptes rendus bruts des agents (a ignorer dans git s'ils contiennent des donnees sensibles)
  reference/        # mode clone : captures et notes d'observation, usage interne uniquement, jamais livre
```

## Schema de state.json

```json
{
  "version": 1,
  "project": "nom-du-projet",
  "mode": "creation",
  "platforms": ["web", "ios", "android"],
  "market": {"countries": ["FR"], "languages": ["fr"]},
  "autonomy": "standard",
  "phase": "P5",
  "status": "in_progress",
  "gates": {
    "G0": {"status": "approved", "date": "2026-10-21", "report": ".app-factory/gates/G0.md"}
  },
  "artifacts": {
    "brief": "docs/product/brief.md",
    "prd": "docs/product/prd.md",
    "backlog": "docs/product/backlog.md"
  },
  "milestones": [
    {"id": "M0", "title": "Squelette", "status": "done", "stories": ["S-001", "S-002"]}
  ],
  "stories": {
    "S-003": {"status": "review", "branch": "feat/s-003-signup", "attempts": 1, "reqs": ["REQ-004"]}
  },
  "open_questions": [],
  "risks": [],
  "next_action": "Lancer code-reviewer sur S-003"
}
```

Valeurs : `status` du projet parmi `in_progress`, `awaiting_gate`, `blocked`, `done` ; `status` d'une
story parmi `todo`, `in_progress`, `review`, `qa`, `done`, `blocked`.

## Ecriture

- Mettre a jour `state.json` apres chaque etape significative (agent termine, porte passee, story
  changee de statut), pas seulement en fin de session.
- Reecrire le fichier entier, JSON valide, sans secret ni donnee personnelle.
- Toute decision de l'utilisateur va aussi dans `decisions.md`, avec la date.

## Protocole de reprise

1. Lire `state.json`, `decisions.md` et le dernier rapport de porte.
2. **Confronter a la realite** : les livrables references existent-ils ? Les branches des stories
   existent-elles, sont-elles fusionnees ? Les tests passent-ils ? Le dernier commit correspond-il a ce
   que l'etat decrit ? L'etat est une affirmation, le depot est la reference.
3. Signaler a l'utilisateur chaque ecart et proposer la correction de l'etat avant de continuer.
4. Resumer en quelques lignes ou en est le projet et reprendre a `next_action`.
