# Barre de qualite d'un produit fini

Base de la definition of done du projet (P4) et des checklists de `gate-verifier`. Adapter au contexte
(un outil interne n'a pas les obligations d'une app grand public), mais toute exclusion est ecrite et
justifiee dans `decisions.md`, jamais implicite.

## Produit

- Chaque exigence du PRD est livree et acceptee, ou explicitement reportee.
- Onboarding, etats vides, chargement, erreurs et hors ligne (mobile) sont traites.
- Les textes sont relus (`ux-copy` si disponible), dans les langues du marche cible.
- Un canal de support ou de contact existe.

## Code

- Tests unitaires sur la logique metier, tests d'integration sur les frontieres (base, API tierces),
  tests de bout en bout sur les parcours critiques. Pas d'objectif de couverture chiffre arbitraire : les
  parcours critiques sont couverts.
- Lint, formatage et typage stricts en CI ; aucun test desactive sans ticket.
- README d'installation qui fonctionne sur une machine neuve ; ADR pour chaque choix structurant.

## Securite

- OWASP ASVS niveau 1 au minimum, niveau 2 des qu'il y a des donnees sensibles, du paiement ou des
  comptes a privileges. Mobile : OWASP MASVS-L1, L2 pour les donnees sensibles.
- Autorisation verifiee cote serveur sur chaque route ; authentification eprouvee (bibliotheque ou
  service reconnu, jamais de crypto maison) ; MFA proposee pour les comptes a privileges.
- Secrets hors du code et de git ; rotation possible. Dependances auditees ; en-tetes de securite ;
  limitation de debit sur les points sensibles ; logs sans donnee personnelle ni secret.
- Le modele de menace est a jour avec le code livre.

## Donnees et base de donnees

- Schema versionne par migrations, appliquees par la CI, reversibles ou en mode expand / contract pour
  les changements a chaud.
- Contraintes d'integrite en base, index justifies par les requetes reelles (verifies avec EXPLAIN).
- Comptes de base au moindre privilege, separes par environnement ; pas de donnees reelles en dev.
- Sauvegardes automatiques et **restauration testee** ; restauration a un instant donne si la perte de
  donnees recentes est inacceptable. Chiffrement en transit et au repos.
- Duree de conservation definie et purge effective des donnees personnelles.

## Conformite (France et UE par defaut)

- RGPD : registre, bases legales, information des personnes, exercice des droits, sous-traitants sous
  contrat, transferts hors UE encadres, AIPD si le traitement l'exige (skill `rgpd-cnil`).
- Cookies et traceurs conformes aux recommandations CNIL (skill `cookies-consentement-cnil`).
- Mentions legales, CGU, CGV si vente (skill `mentions-legales-cgu-cgv`).
- Accessibilite : RGAA ou WCAG 2.1 AA vise ; le European Accessibility Act s'applique a certains
  services depuis le 28 juin 2025 (skills `rgaa`, `wcag`).
- Fonctionnalites d'IA : obligations de transparence de l'AI Act a verifier ; contenus publies par les
  utilisateurs : moderation et signalement a prevoir.

## Design et UX

- Design system avec tokens ; responsive ; contraste et tailles de cible conformes ; navigation clavier
  et lecteur d'ecran sur les parcours critiques.
- Pas d'interface generique "IA" (pack design : `impeccable`, `baseline-ui`). Mobile : conventions de la
  plateforme (Human Interface Guidelines, Material).

## Performance

- Web : Core Web Vitals dans le seuil "bon" de Google (LCP 2,5 s, INP 200 ms, CLS 0,1) au 75e
  percentile. API : objectifs p95 et p99 fixes dans le PRD et mesures (`k6`).
- Mobile : demarrage a froid, taille de l'app et consommation surveillees.

## Exploitation

- CI/CD complete ; staging proche de la prod ; infrastructure as code quand elle existe.
- Deploiement reversible, smoke tests apres deploiement, rollback teste.
- Monitoring, SLO et alertes sur les symptomes ; runbooks pour chaque alerte ; plan d'incident.

## FinOps

- Budget et alertes de cout en place ; ressources etiquetees ; cout par unite metier suivi ; pas de
  ressource inactive ; l'enveloppe validee en P2 est respectee ou reestimee avec l'utilisateur.

## Gestion de projet

- Backlog clos ou reporte explicitement ; decisions tracees ; notes de version ; retro faite ; la
  documentation decrit l'existant avec les versions reelles.

## Lancement

- Analytics conformes au consentement ; SEO de base (titres, meta, sitemap, robots, donnees
  structurees) ; fiches stores si mobile ; pages legales en ligne ; metrique nord mesuree.
