---
name: guardrails
description: >
  Garde-fous imposes par hooks : pas d'em dash, pas d'emoji non demande, pas de push sur main, pas de
  contournement des hooks git, pas de secret ni de .env dans git, Conventional Commits, marqueur IA,
  regle d'or des identifiants de prod. A utiliser pour installer, configurer, assouplir ou expliquer un
  blocage des garde-fous, ou "guardrails".
---

# Garde-fous (guardrails)

Les regles sont appliquees par des hooks : Claude ne peut pas les oublier. Un blocage arrive avec la
regle (`[id]`) et la marche a suivre. Ne jamais chercher a contourner une regle (autre outil, autre
formulation, script) : corriger le travail, ou dire a l'utilisateur ce qui bloque.

## Regles et niveaux

| id | Ce qui est controle | Defaut |
|---|---|---|
| `em-dash` | Em dash ajoute dans un fichier, un commit, une PR, une issue, un texte ecrit par commande ; lignes indexees au commit | block |
| `emoji` | Emoji ajoute dans un fichier, un commit, une PR ou une issue ; `allow` (par defaut le marqueur IA et la ligne d'attribution) et `allow_paths` | block |
| `protected-push` | Push vers `branches` (main, master) : refspec, branche courante, `HEAD`, checkout dans la meme commande, suppression, `--all`, `--mirror` | block |
| `no-verify` | `--no-verify`, `commit -n`, `core.hooksPath`, `HUSKY=0`, `LEFTHOOK=0`, `SKIP=` | block |
| `secrets` | Cles et tokens (AWS, GitHub, Anthropic, OpenAI, Stripe, Google, Slack, cle privee, mot de passe en URL ou en clair) dans un fichier, une commande ou les lignes indexees ; les `.env` sont exemptes | block |
| `env-file` | `git add` ou commit d'un fichier `.env` (`patterns`) | block |
| `conventional-commit` | `type(scope): description`, `types`, `max_subject` (72), minuscule, pas de point final | block |
| `ai-marker` | Titre de PR ou d'issue (gh ou API REST) termine par `marker` | block |
| `prod-credentials` | Secrets Kubernetes, coffres (Bitwarden, 1Password, Vault, AWS, GCP, Azure), historique du shell, `.env` d'un autre projet, tunnel vers la prod (`prod_patterns`) ; `allowed_files` | block |
| `lint-config` | Configuration de lint, format ou typage modifiee, suppression d'avertissement ajoutee | warn |
| `config-tamper` | Modification de la configuration ou du retrait des garde-fous | ask |

Niveaux : `block` (refuse l'appel), `ask` (demande a l'utilisateur ; refuse quand personne ne peut
repondre, en cloud), `warn` (laisse passer avec un avertissement), `off`.

## Configuration

Fusionnee dans cet ordre : valeurs par defaut, `~/.claude/guardrails.json` (toute la machine),
`.claude/guardrails.json` du projet (partage, commite), `.claude/guardrails.local.json` (personnel).

```json
{
  "rules": {
    "emoji": {"allow_paths": ["docs/marketing/**"]},
    "protected-push": {"branches": ["main", "master", "develop"]},
    "ai-marker": "off",
    "secrets": {"exclude_paths": ["tests/fixtures/**"]}
  },
  "exclude_paths": ["vendor/**"]
}
```

- Une regle peut s'ecrire `"id": "off"`. `"enabled": false` coupe tout.
- Pour une session : variables `GUARDRAILS_DISABLED=1` ou `GUARDRAILS_DISABLED_RULES=emoji,ai-marker`
  dans l'environnement de Claude Code (pas dans une commande).
- **Changer la configuration demande l'accord de l'utilisateur** (regle `config-tamper`). Quand
  l'utilisateur demande un emoji ou une exception, proposer la ligne exacte a ajouter, puis l'ecrire
  apres son accord.

## Installation

- **Sur la machine** (tous les projets) : le plugin `guardrails`, installe par defaut par les scripts
  `install.sh` et `install.ps1` d'ultime-skill (`--no-guardrails` pour s'en passer). Desactiver :
  `claude plugin disable guardrails@ultime-skill`.
- **Dans un projet** (equipe sans le plugin, sessions cloud, autopilot) :
  `node <plugin guardrails>/runtime/setup.cjs install-project`, puis commiter `.claude/`. La copie du
  projet repond seule dans ce projet, celle du plugin se tait. `status` et `uninstall-project` existent.
  `export_to_repo.py` d'autopilot le fait quand le pack `guardrails` fait partie de l'export.
- Necessite `node` (18 ou plus). Une erreur interne laisse passer l'appel et s'affiche, elle ne bloque
  jamais le travail.

## Expliquer un blocage

Donner la regle, la raison et la correction. Si c'est un faux positif reel, proposer l'exception la plus
etroite (un chemin dans `exclude_paths` ou `allow_paths`), jamais la desactivation de la regle entiere.
