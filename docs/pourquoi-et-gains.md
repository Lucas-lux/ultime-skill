# Pourquoi ultime-skill, et ce que ça apporte

## Le problème

Un assistant de code comme Claude Code est très capable, mais laissé à lui-même sur un vrai projet, il
bute toujours sur les mêmes obstacles :

- **Il ne sait que ce qu'on lui dit.** Les bonnes pratiques d'une stack (Next.js, FastAPI, Expo,
  Kubernetes), d'un métier (conformité RGPD, fiche App Store, SEO) ou d'une méthode (revue de sécurité,
  tests de bout en bout) ne sont pas appliquées de façon constante d'une session à l'autre.
- **Il attend qu'on le pilote.** Sans orchestration, chaque étape demande une consigne, une relecture et
  une décision humaine. L'humain devient le goulot d'étranglement.
- **Les règles ne tiennent pas.** Une consigne écrite dans un fichier d'instructions s'oublie au bout
  d'une longue session ; rien n'empêche un push direct sur la branche principale ou un secret commité.
- **La qualité dépend du jour.** Une CI absente ou incomplète, des tests sautés, des revues superficielles :
  le code « marche » jusqu'à la production.
- **Le contexte sature.** Installer des centaines de skills charge leurs descriptions dans chaque
  session ; au-delà d'un certain volume, Claude Code n'en garde qu'une partie et choisit moins bien.
- **Les licences sont floues.** Beaucoup de skills publiques sont copiées sans vérifier leurs droits.

## La réponse

| Obstacle | Ce que fait ultime-skill |
|---|---|
| Savoir-faire inconstant | 474 skills et 24 agents, sélectionnés, nettoyés et épinglés à une version, couvrant le cycle complet : produit, code, design, mobile, stores, sécurité, conformité, ops, données, growth |
| Pilotage permanent | `app-factory` orchestre un projet de l'idée à la production avec des agents spécialisés ; le mode `autopilot` le fait avancer seul et ne remonte que les décisions de vision |
| Règles oubliées | des hooks (`guardrails`) refusent à la source ce qui est interdit : em dash, emoji non demandé, push sur la branche principale, secrets, contournement des hooks git, recherche d'identifiants de production |
| Qualité variable | `ci-forge` génère la CI/CD la plus complète pour la stack détectée ; les revues (`security-review`, `sast`, `ui-review`, `ponytail-review`) exigent une preuve par constat ; `ponytail` impose le plus petit changement complet |
| Contexte saturé | 44 packs indépendants ; `ultime-profile` n'installe dans chaque projet que les packs utiles et des règles par langage chargées seulement quand Claude touche ces fichiers |
| Licences floues | uniquement des licences permissives (MIT, Apache-2.0, BSD-3-Clause), audit outillé, notices de modification |

## Le gain concret sur un projet

Exemple : une application Next.js avec une base Postgres.

**Sans la bibliothèque**, la session part de zéro à chaque fois. Le développeur rappelle ses conventions,
écrit lui-même la CI (souvent un lint et des tests unitaires), relit chaque changement, pense (ou non) à
l'accessibilité, aux en-têtes de sécurité, aux migrations réversibles, et vérifie à la main que rien n'est
poussé sur la branche principale.

**Avec la bibliothèque** :

1. `ultime-profile` lit le dépôt et propose 11 packs (environ 24 000 caractères de descriptions, soit 13 %
   du catalogue complet) avec la raison de chacun, écrit les règles TypeScript, React et tests du projet,
   et autorise les commandes de vérification tout en exigeant une confirmation pour publier ou déployer.
2. Les garde-fous sont actifs dès la première commande : ce qui est interdit est refusé avec la raison et
   la correction attendue, sans dépendre de la mémoire de l'agent.
3. `ci-forge` génère une CI complète : lint, typage, tests avec couverture en cliquet, Playwright avec
   contrôle d'accessibilité, build, Lighthouse, recherche de secrets, analyse statique, audit des
   dépendances, conteneur si présent, déploiement staging et production, actions épinglées par SHA, et
   un check requis unique `ci-ok`. Lors d'un essai réel sur une API FastAPI, la génération a aussi corrigé
   trois défauts du projet (migrations Alembic sans `env.py`, Postgres sans mot de passe, image Docker
   lancée en root).
4. `app-factory` découpe le travail en jalons et stories, fait implémenter, relire, tester et vérifier
   chaque story par des agents dédiés, et fait valider les portes (spécification, conception,
   pré-production) par un vérificateur indépendant.
5. En `autopilot`, le projet avance par réveils planifiés : les PR se fusionnent quand la CI est verte, le
   staging se déploie, et seules les décisions qui engagent la vision, l'argent, le droit ou
   l'irréversible arrivent au propriétaire, sous forme d'issue GitHub à laquelle il répond depuis son
   téléphone.

Ce qui change concrètement :

- **Moins d'interventions humaines** : l'humain tranche des décisions, il ne distribue plus les tâches.
- **Une qualité plancher garantie** : ce que la CI et les garde-fous refusent ne peut plus passer, quelle
  que soit la session ou l'agent.
- **Des revues vérifiables** : chaque constat porte un fichier, une ligne et un chemin ; un contrôle non
  lancé n'est jamais compté comme réussi.
- **Un coût en contexte maîtrisé** : un projet ne paie que les packs qu'il utilise.
- **Une bibliothèque réutilisable sans risque juridique** : tout peut être utilisé, modifié et exploité
  commercialement en gardant les notices.

## Ce que la bibliothèque ne fait pas

- Elle ne remplace pas les décisions humaines : prix, périmètre, marque, mise en production, dépenses,
  contrats et soumissions en store restent confirmés par le propriétaire.
- Elle ne garantit pas un produit sans défaut : elle élève le plancher de qualité et rend les écarts
  visibles, elle ne dispense pas de regarder ce qui est livré.
- Le mode autopilot repose sur les tâches planifiées de Claude Code dans le cloud, encore en aperçu : leur
  comportement est à vérifier au premier réveil (voir [App factory et autopilot](app-factory-et-autopilot.md)).
- Une session cloud ne connaît pas son coût en dollars : le budget y est tenu en nombre d'agents par
  réveil et par jour, et par la fréquence des réveils.
