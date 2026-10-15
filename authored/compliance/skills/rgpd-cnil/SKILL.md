---
name: rgpd-cnil
description: >
  Conformite RGPD a la francaise (CNIL) pour une application : bases legales, minimisation, durees de
  conservation, droits des personnes et delais, registre des traitements (Art. 30), analyse d'impact
  (DPIA), notification de violation sous 72h, sous-traitance (Art. 28). A utiliser quand l'utilisateur
  parle de RGPD, GDPR, CNIL, donnees personnelles, registre des traitements, DPIA, AIPD, droits des
  personnes, violation de donnees, DPO, ou conformite d'un traitement. Donne les exigences et les
  references d'articles, pas des statistiques d'amendes a verifier.
---

# RGPD a la francaise (CNIL)

Cadre : RGPD (reglement UE 2016/679) et loi Informatique et Libertes. L'autorite est la CNIL. Ce skill
couvre l'ingenierie de conformite et les artefacts documentaires. Il ne remplace pas un avis juridique :
signaler quand une question releve du juriste ou du DPO.

Verifier le traitement reel (le code, les flux, la base) plutot que ce que la doc affirme. Ne jamais
exposer de donnee personnelle dans un log, une metrique ou une trace.

## Avant tout traitement : les fondamentaux

- **Base legale** (Art. 6) : chaque traitement en a exactement une, documentee. Consentement, contrat,
  obligation legale, interet legitime, mission d'interet public, sauvegarde des interets vitaux. Pour une
  donnee sensible (Art. 9 : sante, opinions, biometrie...), une condition de levee d'interdiction en plus.
- **Minimisation** (Art. 5) : ne collecter que ce qui est necessaire a la finalite. Pas de champ "au cas
  ou". Chaque donnee se rattache a une finalite explicite.
- **Finalite** : determinee, explicite, legitime. Pas de reutilisation incompatible sans nouvelle base.
- **Duree de conservation limitee** : une duree par finalite, puis suppression ou anonymisation. Distinguer
  base active, archivage intermediaire et suppression. Pas de conservation indefinie.
- **Securite** (Art. 32) : chiffrement en transit et au repos quand c'est pertinent, controle d'acces,
  journalisation des acces aux donnees sensibles, pseudonymisation. Voir la skill `securite-developpement`
  et le pack `security`.
- **Privacy by design et by default** (Art. 25) : la configuration par defaut est la plus protectrice.

## Droits des personnes (Art. 15 a 22)

Implementer les parcours pour : acces, rectification, effacement, limitation, opposition, portabilite, et
decision automatisee (Art. 22). Delais a respecter :

- Reponse dans **un mois** a compter de la demande, **prolongeable de deux mois** si la demande est
  complexe ou nombreuse (en informant la personne du delai supplementaire et du motif dans le premier
  mois).
- Verifier l'identite du demandeur sans collecter plus que necessaire.
- Gratuite par principe ; une demande manifestement infondee ou excessive peut etre refusee (motivee) ou
  facturee.

## Registre des traitements (Art. 30)

Tenir un registre par traitement avec : finalite, base legale, categories de personnes et de donnees,
destinataires, transferts hors UE et garanties, durees de conservation, mesures de securite. S'appuyer sur
le modele de registre de la CNIL. Le registre decrit l'existant reel, pas l'intention.

## Analyse d'impact (DPIA / AIPD, Art. 35)

- Obligatoire quand le traitement est susceptible d'engendrer un risque eleve, en particulier pour les cas
  de la liste de la CNIL (profilage a effet significatif, surveillance systematique a grande echelle,
  donnees sensibles a grande echelle, croisement de donnees, personnes vulnerables...).
- Methode : description du traitement, evaluation de la necessite et de la proportionnalite, appreciation
  des risques (acces illegitime, modification, disparition des donnees) et mesures. Suivre la methode PIA
  de la CNIL et son logiciel PIA si utile.

## Violation de donnees (Art. 33 et 34)

- Notifier la CNIL **dans les 72 heures** apres en avoir pris connaissance, sauf si la violation est peu
  susceptible d'engendrer un risque pour les personnes.
- Informer les personnes concernees sans delai si le risque est eleve.
- Tenir un registre interne des violations, quelle que soit l'issue.

## Sous-traitance (Art. 28)

Tout prestataire qui traite des donnees pour le compte du responsable est encadre par un contrat (DPA)
precisant l'objet, la duree, les instructions, la confidentialite, la securite, le sort des donnees en fin
de contrat, les sous-traitants ulterieurs et l'assistance aux droits. Voir la skill vendue `gdpr-compliance`
pour un modele de clauses, a adapter au droit francais.

## Transferts hors UE

Documenter tout transfert hors Union europeenne et sa garantie (decision d'adequation, clauses
contractuelles types, regles d'entreprise contraignantes). Cartographier les sous-traitants et leurs
regions d'hebergement.

## Points connexes

- Cookies et traceurs : voir la skill `cookies-consentement-cnil`.
- Mentions legales, CGU, CGV : voir la skill `mentions-legales-cgu-cgv`.
- Accessibilite (RGAA, EAA) : voir les skills `rgaa` et `wcag`.
- Pour toute affirmation chiffree sur une sanction recente, verifier a la source (site de la CNIL) avant de
  l'ecrire : ne pas reprendre de chiffre de memoire.
