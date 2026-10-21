# Autonomie et garde-fous

Le niveau d'autonomie se choisit en P0 et se note dans `state.json`. Quel que soit le niveau, certaines
actions demandent toujours une confirmation au moment de les faire, et d'autres sont exclues.

## Niveaux

- **Prudent** : validation a chaque porte et avant chaque story.
- **Standard** (par defaut) : validation a chaque porte ; entre deux portes, l'orchestrateur enchaine
  les stories seul.
- **Etendu** : validation aux portes G2, G3, G6 et G7 seulement ; les autres portes produisent leur
  rapport et continuent si `gate-verifier` ne trouve aucun bloquant.
- **Autopilot** : le projet avance par reveils planifies, sans session ouverte (skill `autopilot`).
  L'utilisateur ne tranche que les decisions de vision, d'argent, de droit et d'irreversible, par issue
  GitHub ; le reste suit la politique de decision de `autopilot`. Choisi apres G0, qui reste interactive.
  Ce niveau autorise en plus, sans confirmation au moment de le faire : pousser des branches `claude/*`,
  ouvrir des PR et des issues, laisser GitHub fusionner une PR `autopilot` quand les checks requis sont
  verts, deployer en staging par la CI. La production reste approuvee par l'utilisateur via
  l'environnement GitHub `production`.

## Fait seul, a tout niveau

Lire et ecrire le code et la documentation du projet, creer des branches et des commits locaux, lancer
les tests, la base locale et l'app en local, installer des dependances de developpement, lancer des
audits en lecture seule.

## Toujours confirme au moment de le faire

Au niveau autopilot, le push de branches `claude/*`, les PR, les issues et le deploiement en staging par
la CI ne sont plus confirmes un par un (limites decrites plus haut) ; tout le reste de cette liste,
production comprise, l'est toujours.

- Pousser vers un depot distant, ouvrir une PR ou des issues.
- Deployer, en staging la premiere fois, en production a chaque fois.
- Executer une migration ou un script sur des donnees reelles ; acceder a des donnees de production.
- Creer un compte (cloud, store, regie publicitaire, reseau social), accepter des conditions ou un
  contrat, saisir ou utiliser un moyen de paiement, souscrire un abonnement.
- Soumettre une app en revue sur un store, publier une fiche, lancer une campagne qui depense de
  l'argent, publier sur un reseau social, envoyer un email ou une notification a des utilisateurs.
- Modifier un DNS, supprimer une ressource, un environnement, une base ou un bucket.

Pour ces actions, l'agent prepare tout (configuration, contenus, commande exacte, cout estime) et
l'utilisateur declenche ou confirme.

## Pilotage du navigateur

- API et CLI officielles d'abord ; le navigateur (Claude in Chrome, avec les sessions de l'utilisateur)
  seulement pour ce que les API ne couvrent pas.
- S'arreter et rendre la main pour toute connexion, double authentification, CAPTCHA, verification
  d'identite ou saisie de paiement : c'est a l'utilisateur de le faire.
- Remplir les formulaires, puis faire relire avant tout bouton qui soumet, publie ou paie.

## Exclu

- Aller chercher des identifiants ailleurs que dans la configuration prevue pour le projet (autre depot,
  coffre-fort, historique du shell, fichiers d'un autre projet), meme si on le demande.
- Mettre un secret dans le code, un commit, un log ou un prompt d'agent.
- Contourner un hook, une verification de securite ou une protection de branche.
- Faux avis, fausses notes, faux comptes, usurpation d'une marque ou d'une personne, dark patterns,
  collecte de donnees personnelles sans base legale.
- Copier la marque, les assets, les textes ou le code d'une app tierce (mode clone).
