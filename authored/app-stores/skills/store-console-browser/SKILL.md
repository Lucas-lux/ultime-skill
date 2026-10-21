---
name: store-console-browser
description: >
  Pilote la Play Console et App Store Connect dans le navigateur de l'utilisateur pour ce que les API et
  CLI ne couvrent pas (creation de l'app, questionnaires, Data safety, confidentialite, declarations), a
  partir d'un dossier prepare, avec relecture avant chaque envoi. A utiliser pour remplir la Play Console
  ou App Store Connect via le navigateur, ou creer une fiche store dans la console.
---

# Consoles des stores dans le navigateur

Ordre de preference : API et CLI d'abord (`asc-*`, `gplay-*`, fastlane), navigateur seulement pour ce
qu'elles ne couvrent pas. Ce qui releve souvent de l'interface (a reverifier, les API evoluent) :
creation de l'app dans la Play Console, questionnaire de classification, formulaire Data safety, public
cible et contenu, declarations (publicite, applications gouvernementales, fonctionnalites financieres ou
de sante), et chez Apple certaines sections comme la confidentialite de l'app.

L'outil `asc web` du CLI asc automatise aussi une partie de ces ecrans via une session web non officielle
d'Apple : le proposer comme alternative, a la discretion de l'utilisateur.

## Avant de commencer

- Charger la skill du navigateur utilise (`chrome-browser` pour Claude in Chrome) et suivre ses regles.
- Avoir le dossier pret : `store/listing.md`, `store/data-safety.md`, visuels, reponses aux
  questionnaires (skills `store-listing`, `play-data-safety`).
- Travailler dans un nouvel onglet, sur le compte developpeur de l'utilisateur.

## Ce que l'utilisateur fait lui-meme

- Se connecter, la double authentification, les CAPTCHA, la verification d'identite.
- Creer le compte developpeur, payer les frais, accepter les contrats et accords (y compris les accords
  de paiement et fiscaux pour vendre).
- Cliquer sur les boutons qui engagent : envoyer en revue, publier, lancer un deploiement en production.

## Deroulement

1. Ouvrir la section a remplir, lire l'etat actuel avant toute modification.
2. Remplir champ par champ depuis le dossier, sans improviser une reponse absente du dossier : demander.
3. Avant chaque enregistrement : resumer ce qui va etre enregistre et attendre l'accord.
4. Apres chaque section : verifier que la console n'affiche ni erreur ni avertissement, et noter l'etat
   dans `store/console-log.md` (section, date, valeur saisie, statut).
5. Ne jamais saisir un secret visible a l'ecran dans un fichier ou un log ; le compte de demonstration
   pour les reviewers est tape par l'utilisateur ou colle depuis son gestionnaire de mots de passe.

## En cas de blocage

Interface changee, element introuvable, message inattendu : s'arreter, decrire l'ecran, et demander a
l'utilisateur plutot que de cliquer au hasard.
