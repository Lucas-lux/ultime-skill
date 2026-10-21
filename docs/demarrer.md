# Démarrer

## Installer en une commande

```bash
claude plugin marketplace add Lucas-lux/ultime-skill && claude plugin install ultime-starter@ultime-skill
```

Sous PowerShell 5, remplacer `&&` par `;`. Le bundle `ultime-starter` installe trois packs pour tous les
projets de la machine :

- `ultime-profile` : le point d'entrée qui installe ensuite, projet par projet, les seuls packs utiles ;
- `guardrails` : les garde-fous par hooks (voir [Qualité et sécurité](qualite-et-securite.md)) ;
- `ponytail` : la règle du plus petit changement complet, dans chaque session et chaque sous-agent.

Prérequis : Claude Code, `git`, `node` 18 ou plus (pour les hooks), Python 3.10 ou plus (pour les scripts
des skills). Le dépôt étant privé, il faut un accès git à GitHub : une clé SSH, ou
`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` avec des identifiants git configurés (`gh auth login` puis
`gh auth setup-git`).

Variante depuis un clone, avec les mêmes options : `./install.sh` (Windows : `./install.ps1`), qui accepte
`--no-guardrails`, `--no-ponytail` et `--with-tools` (installe aussi les CLI que certaines skills
pilotent : graphify, rea, asc, gplay, téléchargés à une version figée et vérifiés par somme SHA-256).

## Équiper un projet

Ouvrir Claude Code dans le projet et demander :

> Installe les skills ultime-factory dont ce projet a besoin.

`ultime-profile` lit le dépôt (`scripts/suggest_profile.py`), propose les packs avec la raison de chacun et
leur coût en contexte, puis, avec ton accord sur la portée (partagée avec l'équipe ou personnelle) :

- installe les packs au niveau du projet et désactive ceux qui ne servent pas ;
- écrit les règles par langage dans `.claude/rules/ultime/` ;
- ajoute les permissions : commandes de vérification autorisées, publication et déploiement soumis à
  confirmation.

Relancer la même demande quand le travail change de domaine (passage à la fiche store, au lancement,
aux campagnes) ; `app-factory` le fait seul à ses étapes clés.

## Mener un projet de A à Z

```
/app-factory:app-factory
```

L'orchestrateur demande le mode (création depuis une idée, clone personnalisé d'une app, reprise d'une app
existante), le brief et le niveau d'autonomie, puis avance phase par phase. Détail dans
[App factory et autopilot](app-factory-et-autopilot.md).

## Passer un projet existant dans toute la chaîne

Pour un projet déjà commencé : `app-factory` en mode reprise (`app-takeover`) fait l'inventaire, la
rétro-spécification et l'audit (sécurité, données, conformité, UX, exploitation, coûts, code avec
`ponytail-audit`), puis `ci-forge` met la CI au niveau, et le plan de reprise priorise les corrections.

## Rendre un projet autonome

Après le cadrage, choisir le niveau `autopilot` et suivre la mise en place décrite dans la skill
`autopilot` (référence `setup.md`) : export des skills dans le dépôt, préparation GitHub par script,
protection de branche, tâche planifiée. Rien n'est créé dans le cloud ni sur le compte Claude sans toi.

## Questions fréquentes

**Les garde-fous me bloquent pour une bonne raison, comment faire une exception ?**
Ajouter l'exception la plus étroite dans `.claude/guardrails.json` du projet (par exemple un chemin dans
`rules.emoji.allow_paths`). Claude te demande ton accord avant de modifier ce fichier. `"enabled": false`
coupe tout ; `claude plugin disable guardrails@ultime-skill` retire le plugin.

**Combien de contexte cela coûte-t-il ?**
Le catalogue complet représente environ 182 000 caractères de descriptions ; `ultime-starter` en ajoute
environ 2 300, et un profil typique d'application web ou d'API entre 24 000 et 27 000. Le catalogue
`plugins/ultime-profile/skills/ultime-profile/references/catalog.md` donne le coût de chaque pack.

**Puis-je tout installer partout ?**
`claude plugin install ultime-all@ultime-skill` le permet, mais c'est déconseillé : les descriptions de
474 skills dépassent ce que Claude Code garde en contexte, et le choix de la bonne skill se dégrade.

**Comment mettre à jour ?**
`claude plugin marketplace update ultime-skill`, puis `/reload-plugins` dans la session.

**Comment désinstaller ?**
`claude plugin uninstall <pack>@ultime-skill` pour chaque pack, puis
`claude plugin marketplace remove ultime-skill`.
