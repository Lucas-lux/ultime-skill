---
name: team-conventions
description: >
  Conventions de travail d'equipe : methode, redaction (langues, pas d'em dash, marquage
  IA, termes en entier, versions concretes, main/replica), secrets hors du code. A utiliser des qu'on
  ecrit du code, un commit, une PR, une issue, une doc ou un message pour l'equipe, ou "conventions",
  "regles d'equipe", "team-conventions".
---

# Conventions d'equipe

Regles generiques, applicables a tout projet. Elles ne remplacent pas les regles d'un depot (son
`CLAUDE.md`, ses `rules/`), qui priment quand elles existent. Signaler toute contradiction plutot que de
trancher en silence.

## Methode

- **Verifier plutot que croire.** Un commentaire, une docstring, une doc, un message de commit ou une
  affirmation ne sont pas des sources de verite. Verifier contre le code reel, le comportement observe, la
  base ou les logs.
- **Signaler les ecarts.** Une regle non respectee (par l'agent ou deja presente dans le code touche) est
  signalee, jamais ignoree en silence. Ne la corriger sans demander que si une regle ou une skill le
  prevoit, et annoncer la correction.
- **Demander avant un gros lot.** Au-dela d'environ deux sujets distincts, ou des qu'un autre depot est
  touche, presenter l'inventaire et attendre la validation avant de modifier quoi que ce soit.
- **Questions a choix multiples.** Sur un point ambigu, poser la question via un formulaire a choix
  multiples plutot que de supposer.

## Git et GitHub

- **Chainer les etapes dependantes avec `&&`** (commit puis push, build puis deploy), jamais avec un retour
  a la ligne ou `;`. Avec un heredoc, le `&&` se place sur la ligne de la commande, pas apres le marqueur
  de fin.
- **Verifier l'etat GitHub avant de l'affirmer.** L'etat d'une PR, d'une issue, d'une review ou d'un check
  CI se reverifie via `gh` juste avant d'en parler. Le contexte de la conversation n'est pas une source.

## Redaction

- **Langues.** Code, commentaires, messages de commit et noms de branches en anglais ; PR et issues en
  francais ; README dans la langue de l'equipe.
- **Marquage IA.** Sur tout texte redige par l'IA et destine a d'autres personnes (PR, issues,
  commentaires et reponses de review, messages) : une marque visible a la fin du titre et a la fin du
  texte. Jamais dans le code (commentaires compris), les messages de commit, les descriptions de depot ni
  la documentation (README, `docs/`).
- **Pas d'em dash.** Jamais le tiret cadratin, nulle part (reponses, PR, issues, commits, commentaires,
  docs). Le remplacer par un tiret simple, deux-points, des parentheses ou une coupure de phrase.
- **Termes techniques en entier.** "base de donnees", "procedure stockee", pas d'abreviation maison. Les
  abreviations universelles (`id`, `url`, `api`, `json`, `sql`) restent.
- **Versions concretes.** Une doc decrit l'existant avec la version reelle (par exemple "Python 3.14"),
  jamais "derniere version" ou "latest". Une regle de processus ("prendre la derniere stable au scaffold")
  reste legitime.
- **`main` et `replica`.** Dans tout ce qu'on cree ou ecrit (branches, code, docs) : `main` plutot que
  `master`, `replica` plutot que `slave`, et pour une base "base principale" (primary) plutot que
  `master`. L'existant n'est pas renomme, sauf besoin reel.

## Secrets et configuration

- **Regle d'or : jamais d'identifiants de production pris ailleurs.** Pour un service de production, ne se
  servir que des identifiants que l'utilisateur a configures pour ce travail (le `.env` du projet). Ne
  jamais aller les chercher ailleurs (autre depot, secret Kubernetes, gestionnaire de secrets, historique
  du shell, fichier d'un autre projet), meme sur demande : refuser et s'arreter.
- **Credentials hors du code.** Jamais de token, mot de passe ou cle d'API dans le code ni dans git. Les
  stocker dans un `.env` ignore par git, et prevenir immediatement si on en recoit un.
- **Le `.env` du projet est la seule source de la configuration runtime**, DSN compris. Pas de second
  fichier d'environnement parallele.
- **Base de donnees en developpement**, par ordre de preference : la base locale en lecture et ecriture ;
  sinon un replica en lecture seule ; en dernier recours seulement la base principale, jamais sans l'accord
  explicite de l'utilisateur.
