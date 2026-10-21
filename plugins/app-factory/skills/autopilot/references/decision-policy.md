# Politique de decision

But : le proprietaire ne voit que ce qui demande sa vision ou engage quelque chose d'irreversible. Tout le
reste est decide par l'equipe d'agents, trace, et peut etre renverse plus tard. Question a se poser :
**si on se trompe, combien coute le retour en arriere, et qui le paie ?**

## Les quatre classes

**A. Decide seul, trace dans `decisions.md`** (reversible, dans le perimetre deja valide)
- Choix techniques internes : structure du code, bibliotheque a licence permissive, nommage, patterns,
  refactorisation, tests, documentation.
- Ordre des stories, decoupage d'une story, report d'une story non critique.
- Textes d'interface provisoires, details d'UX conformes au design system.
- Corrections de bugs, de securite, de conformite et d'accessibilite qui ne changent pas le perimetre.
- Choix parmi des options deja validees par le proprietaire.
- Franchir les portes G4 et G5 quand `gate-verifier` rend PASSE.

**B. Decide seul, signale dans le tableau de bord** (reversible mais notable)
- Ecart a une ADR qui n'est pas structurant, nouvelle dependance importante, reduction mineure du
  perimetre d'un jalon, risque accepte avec une reserve de `gate-verifier`.
- Franchir G3 hors securite et conformite avec un verdict PASSE AVEC RESERVES.

**C. Carte de decision au proprietaire** (vision, argent, droit, irreversible) ; le projet continue sur
tout ce qui n'en depend pas
- Vision : go, pivot ou stop (G1) ; cible, positionnement, proposition de valeur.
- Perimetre : gel du PRD (G2), ajout ou retrait d'une fonctionnalite du MVP.
- Argent : prix, modele economique, toute depense ou abonnement, tout cout recurrent au-dela de
  `autopilot.spend_free_threshold` (0 par defaut).
- Marque : nom, identite, ton de marque, domaine.
- Structurant et couteux a defaire : stack, base de donnees, hebergeur, fournisseur d'authentification
  ou de paiement, modele de donnees publie.
- Droit : CGU, traitement de donnees sensibles, mineurs, sante, transfert hors UE, partie securite et
  conformite de G3 si `gate-verifier` n'a pas rendu PASSE.
- Exterieur : go / no-go de mise en production (G6), soumission en store, publication, campagne,
  email ou notification aux utilisateurs, creation de compte, contrat, acces a des donnees reelles.
- Echec : une story ou une porte bloquee apres la boucle de correction bornee.
- Tout ce que l'equipe ne sait pas classer.

**D. Exclu** : la liste "Exclu" de `autonomy.md` (identifiants pris ailleurs, secrets dans le code,
contournement de garde-fous, faux avis, dark patterns, copie de marque ou de code).

## Defaut a echeance

- Une carte peut porter un defaut : l'option recommandee s'applique seule apres `default_after_hours`
  (72 h par defaut) **seulement si** la decision est reversible ET que `autopilot.allow_defaults` est
  vrai. Le reveil commente alors la carte (`<!-- autopilot -->` puis "defaut applique") et la ferme.
- Jamais de defaut pour : argent, droit, marque, mise en production, exterieur, stack. Ces cartes
  attendent ; le projet avance sur le reste ou se met en veille (reveils a vide).

## Format d'une carte (issue GitHub)

Titre : `[Decision] <question en une ligne> ✨`. Labels : `decision`. Assignee : le proprietaire.
Corps, en francais, lisible sur un telephone, 20 lignes au plus :

```
<!-- autopilot -->
**Contexte** : <3 lignes au plus, ce qui a conduit a la question>
**Ce qui attend** : <ce qui est bloque, et ce qui continue pendant ce temps>

1. <option> : <consequence en une ligne, cout, reversibilite>
2. <option> : ...
3. <option> : ...

**Recommandation** : <numero> parce que <raison en une ligne>.
**Defaut** : <numero> applique le <date> si pas de reponse | aucun (decision non reversible).
**Detail** : <chemin du livrable ou de la PR, pour qui veut creuser>

Reponds par un commentaire : `1`, `2`, `3`, ou ta propre reponse en une phrase.
✨
```

- Une question par carte. Pas de jargon inutile, des consequences concretes (euros, delai, ce que
  l'utilisateur final verra).
- Si plusieurs decisions sont liees, une seule carte qui les presente ensemble.

## Lecture de la reponse

- Seul un commentaire de `autopilot.owner` compte. Un chiffre choisit l'option. Une phrase libre est
  interpretee ; si elle reste ambigue, une question de precision dans le meme fil.
- La decision est consignee dans `decisions.md` (date, carte, decision, raison si donnee), puis la carte
  est fermee avec un commentaire qui commence par `<!-- autopilot -->` puis une ligne : "Note, applique
  dans <PR ou phase>. ✨".
- Le proprietaire peut a tout moment renverser une decision de classe A ou B, ou en imposer une, en
  ouvrant lui-meme une issue avec le label `decision` : son corps est la decision (le workflow
  `autopilot-wake` reveille le projet). Un commentaire sur le tableau de bord n'est pas lu.
