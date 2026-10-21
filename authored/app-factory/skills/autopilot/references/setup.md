# Mise en place (par le proprietaire, une fois par projet)

Claude prepare les fichiers et peut lancer les scripts **sur la machine du proprietaire, a sa demande**.
Il ne cree jamais lui-meme la tache planifiee, l'environnement cloud, ni rien sur le compte Claude : ces
etapes sont faites par le proprietaire dans claude.ai. Duree : 20 a 30 minutes la premiere fois.

## 0. Prerequis

- Le projet a passe G0 en session interactive (`app-factory` : mode, brief, plateformes, marche), et
  `.app-factory/state.json` existe.
- Le depot est sur GitHub, l'app Claude GitHub y est installee (claude.ai/code, ou `/install-github-app`).
- En local : `gh` authentifie (`gh auth status`), Python 3.10 ou plus, le marketplace ultime-skill a
  jour (`claude plugin marketplace update ultime-skill`).

## 1. Copier les skills dans le depot

Les sessions cloud n'installent pas les plugins : seul le `.claude/` du depot est charge.

```bash
python <autopilot>/scripts/export_to_repo.py --dry-run      # packs actives du projet + app-factory
python <autopilot>/scripts/export_to_repo.py --packs app-factory,mobile,mobile-expo,sc-conventions
```

`<autopilot>` est le dossier de cette skill (dans le cache des plugins, ou `plugins/app-factory/skills/
autopilot` du depot ultime-skill). Ajouter `sc-conventions` si le projet suit les regles d'equipe : en
cloud, le `~/.claude/CLAUDE.md` personnel n'est pas lu, seules les regles du depot (`CLAUDE.md`,
`.claude/rules/`, skills exportees) s'appliquent. Relancer l'export apres chaque mise a jour du
marketplace. Puis desactiver les packs exportes au niveau du projet pour ne pas les charger deux fois.

## 2. Preparer GitHub

```bash
python <autopilot>/scripts/init_autopilot.py            # affiche le plan, ne change rien
python <autopilot>/scripts/init_autopilot.py --apply    # labels, tableau de bord, branche d'etat, workflows
```

Puis dans les reglages du depot (navigateur ou `gh`) :
1. **Protection de la branche principale** (ruleset ou branch protection) : PR obligatoire, checks de CI
   **requis**, pas de push direct, pas de force push. Sans check requis, la fusion automatique fusionnerait
   sans attendre la CI : c'est le garde-fou central.
2. **Secret `AUTOPILOT_MERGE_TOKEN`** : token fine-grained limite a ce depot, permissions Contents et Pull
   requests en lecture et ecriture, expiration courte (90 jours, a renouveler). Il sert seulement a activer
   la fusion automatique de GitHub.
3. **Environnements** : `staging` sans relecteur ; `production` avec toi comme relecteur obligatoire.
   Tout deploiement de production attend ainsi ton approbation (notification sur l'app GitHub).
   Les secrets de deploiement vont dans ces environnements, jamais dans le depot ni dans l'environnement
   cloud. Les workflows de deploiement sont ecrits par `release-engineer` en P6.
4. Commiter sur une branche et fusionner : `.gitignore`, `.github/workflows/`, `.claude/`, et le retrait
   de `.app-factory/` de la branche principale (`git rm -r --cached .app-factory`).

## 3. Creer la tache planifiee (claude.ai/code, rubrique des taches planifiees)

1. **Environnement cloud** : acces reseau "Trusted" (par defaut) ; aucune variable secrete ; script
   d'installation seulement si la stack l'exige (le cloud fournit deja Python, Node, Docker, git, gh, jq).
2. **Nouvelle tache** : un seul depot (le projet ; avec plusieurs depots, les reglages `.claude/` ne
   s'appliquent pas), cet environnement, le prompt de `templates/routine-prompt.md`.
3. **Frequence** : voir `budget.md` (toutes les 2 h en construction, 2 a 3 fois par jour sinon ; 1 h
   minimum).
4. **Declencheur API** : l'activer, copier l'URL et le token (affiche une seule fois) dans les secrets du
   depot `AUTOPILOT_FIRE_URL` et `AUTOPILOT_FIRE_TOKEN`. Comparer les en-tetes de l'exemple curl affiche
   avec ceux de `.github/workflows/autopilot-wake.yml` et corriger si besoin.

## 4. Premier reveil, sous surveillance

- "Lancer maintenant" depuis la tache, puis suivre la session dans l'app Claude (onglet Code).
- Verifier : le verrou est pris puis rendu sur `claude/autopilot-state`, les appels `gh api` passent (pas
  de 403), une PR `autopilot` declenche le workflow `autopilot-merge`, le tableau de bord est reecrit.
- Tester le reveil sur reponse : ouvrir une issue `decision` de test, commenter `1`, verifier que le
  workflow `autopilot-wake` part et qu'une session demarre.

## 5. Piloter depuis le telephone

- **App GitHub** : notifications des cartes `decision` (elles te sont assignees), reponse par commentaire,
  approbation des deploiements de production, fusion des PR `needs-human`. Le tableau de bord est
  l'issue epinglee de chaque depot.
- **Portefeuille** : un projet GitHub (Projects) "Portefeuille" au niveau de ton compte, avec ses workflows
  integres "Auto-add to project" (un par depot : `label:decision`, `label:autopilot`) et "Item closed ->
  Done". C'est la vue de tous tes projets.
- **App Claude** (onglet Code) : suivre ou reorienter une session en cours, lancer un reveil a la main.
- **Pause** : `"paused": true` dans `state.json` (branche d'etat) ou desactiver la tache planifiee.

## Limites connues

- Pas de plafond en dollars par reveil en cloud : le budget se tient en nombre d'agents et en frequence.
- La duree maximale d'une session cloud n'est pas documentee : le reveil garde ses unites de travail
  courtes (`per_run.stories`) et ecrit l'etat apres chaque story.
- La fonction de taches planifiees est en apercu (research preview) : verifier son comportement au
  premier reveil et a chaque changement annonce.
