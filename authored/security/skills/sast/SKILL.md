---
name: sast
description: >
  Analyse statique de securite outillee en local avec Semgrep et CodeQL : choix des regles selon la stack,
  execution, tri des resultats en vrais et faux positifs, corrections et regles maison. A utiliser pour
  "semgrep", "codeql", "SAST", "analyse statique", ou pour completer une revue de securite.
---

# Analyse statique (Semgrep, CodeQL)

L'outil trouve des candidats ; la preuve vient du tri. Un resultat non trie n'est ni un constat ni un
faux positif. Pour l'integration en CI, voir la skill `ci-forge` (reference `security.md`) ; cette
skill sert aux analyses en local, plus profondes, et au tri.

## Choisir l'outil

- **Semgrep** (CE, `--metrics=off`) : rapide, toutes stacks, regles lisibles ; premier passage par defaut.
- **CodeQL** : flux de donnees inter-procedural, plus lent ; pour les langages compiles et quand
  Semgrep laisse des doutes sur un chemin source vers puits. Gratuit pour l'analyse locale et les depots
  publics ; dans la CI d'un depot prive, il faut GitHub Advanced Security.
- Outils natifs en complement quand la stack les a : bandit (deja couvert par les regles `S` de ruff),
  gosec, Brakeman, PHPStan avec extensions de securite.

## Semgrep

1. Installation isolee : `uvx semgrep` (ou l'image `semgrep/semgrep` dans Docker) ; version notee dans
   le rapport.
2. Regles selon la stack detectee : `p/default` plus `p/<langage>` (`p/python`, `p/javascript`,
   `p/typescript`, `p/golang`, `p/java`, `p/php`), et `p/secrets`, `p/dockerfile`, `p/terraform`,
   `p/kubernetes` si ces fichiers existent.
3. `semgrep scan --metrics=off --config <regles> --sarif --output semgrep.sarif --error .` en excluant
   les dossiers generes et les dependances (`.semgrepignore`).
4. Regle maison quand un motif propre au projet revient (fonction interne dangereuse, appel sans
   verification d'autorisation) : `.semgrep/<nom>.yml` avec un test (`semgrep --test`), puis ajout a la CI.

## CodeQL

1. CLI CodeQL (bundle officiel, version notee), base par langage :
   `codeql database create db-<lang> --language=<lang> --source-root . [--command "<build>"]` (langages
   compiles : la commande de build du projet).
2. `codeql database analyze db-<lang> codeql/<lang>-queries:codeql-suites/<lang>-security-extended.qls
   --format=sarif-latest --output codeql-<lang>.sarif`.
3. Bases et SARIF hors du depot (ou ignores par git) : ils sont gros et regenerables.

## Trier

Pour chaque resultat, dans l'ordre :
1. Le code est-il atteignable en production (pas un test, un exemple, du code mort) ?
2. La source est-elle controlee par un attaquant (requete, fichier, webhook, variable externe) ?
3. Une protection sur le chemin l'annule-t-elle (validation, echappement par le framework, requete
   parametree, type qui contraint) ? La citer avec `fichier:ligne`.
4. Verdict : **vrai positif** (passe dans la revue `security-review` avec sa gravite), **faux positif**
   (raison en une ligne, puis exception etroite : commentaire `nosemgrep: <regle>` avec la raison, ou
   `.semgrepignore` pour un dossier), **a verifier** (piste nommee).
- Grouper les resultats d'une meme regle : trier un representant a fond, puis verifier que les autres
  suivent le meme chemin avant de leur appliquer le verdict.
- Jamais desactiver une regle entiere pour faire taire un resultat.

## Rendre

Dans le rapport de `security-review` (ou `docs/security/sast-<date>.md` si lance seul) : outils et
versions, regles utilisees, nombre de resultats par verdict, tableau des vrais positifs, liste des
exceptions ajoutees avec leur raison. Les SARIF restent en artefact, pas dans le depot.
