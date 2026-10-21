# Licences

Ce document est une lecture technique des licences, pas un avis juridique.

## Ce que tu as le droit de faire

Tout le contenu de la bibliothèque est sous licence permissive :

| Licence | Où | Obligations |
|---|---|---|
| MIT | le travail propre au dépôt (scripts, packs écrits maison, documentation) et 46 sources importées | conserver la notice de copyright et le texte de la licence |
| Apache-2.0 | 20 sources importées (Google, Android, AWS, Docker, Grafana, Hugging Face, Sentry, Anthropic...) | conserver la licence et le `NOTICE` d'origine, signaler les fichiers modifiés |
| BSD-3-Clause | les skills Flutter | conserver la notice ; ne pas utiliser le nom des auteurs pour promouvoir un produit dérivé |

Utilisation interne ou commerciale, modification, redistribution, intégration dans un produit vendu : tout
est permis, en gardant les notices, qui sont déjà en place dans chaque dossier importé. Aucune obligation
de publier ses propres modifications.

## Politique d'import

- **Acceptées** : MIT, Apache-2.0, BSD, ISC, et équivalents permissifs.
- **Refusées** : licences non commerciales (CC-BY-NC, CC-BY-NC-SA), PolyForm, licences copyleft (GPL,
  AGPL, LGPL, MPL, CC-BY-SA) et dépôts sans licence.
- Une skill dont le dépôt est permissif mais dont la skill elle-même porte une autre licence (fichier
  `LICENSE` dans son dossier, champ `license:` dans son frontmatter, contenu dérivé d'une œuvre sous une
  autre licence) suit la licence la plus restrictive. Exemple : une revue de sécurité dérivée des fiches
  OWASP, sous CC-BY-SA, a été retirée.
- Une skill retirée pour sa licence est réécrite maison **de zéro**, sans reprendre son texte : une
  paraphrase resterait une œuvre dérivée, sous la licence d'origine. Seuls son nom et son périmètre
  servent à savoir quoi couvrir.

## Traces de conformité

- Chaque dossier importé contient la licence (et le `NOTICE`) de sa source, copiée au commit épinglé.
- `MODIFICATIONS.md` liste, dossier par dossier, les fichiers modifiés à l'import et la nature du
  changement (em dash remplacés, caractères invisibles retirés, autopromotion retirée, passage adapté),
  comme le demande Apache-2.0 (section 4.b).
- `LICENSE-NOTE.md` explique les cas particuliers : licence seulement déclarée par l'auteur sans fichier
  dans son dépôt (deux skills Vercel, MIT), licence de la skill différente de celle du dépôt
  (`scikit-learn`, BSD-3-Clause dans un dépôt MIT).
- [THIRD_PARTY.md](../THIRD_PARTY.md) recense chaque import : chemin, dépôt, chemin d'origine, commit,
  licence.

## Ce que les licences ne couvrent pas

- **Les marques** (Expo, Vercel, Flutter, Apple, Google...) : on peut utiliser les skills, pas les noms
  pour sa propre promotion.
- **Les cadres d'appareils Apple** fournis en images par `app-store-screenshots` : la licence MIT du dépôt
  ne garantit pas les droits sur des images de produits Apple ; pour une fiche App Store, préférer les
  cadres officiels d'Apple (Apple Design Resources).
- **Les conditions d'utilisation des services** que pilotent certaines skills (stores, API cloud, régies).

## Refaire l'audit

Les licences déclarées sont dans `scripts/gen_vendor.py`. Pour vérifier les fichiers réellement
embarqués : classer chaque `LICENSE*`, `NOTICE*` et `COPYING*` sous `plugins/`, lire le champ `license:`
de chaque `SKILL.md`, et comparer avec la licence déclarée de la source et avec celle que GitHub détecte
au commit épinglé (`gh api repos/<dépôt>/contents?ref=<commit>`). Toute nouvelle source passe ce contrôle
avant son import.
