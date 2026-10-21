# Pieges de conception (APIs et configurations dangereuses)

A passer sur le code et la configuration touches. Un piege n'est pas forcement une faille : c'est un
endroit ou une erreur ordinaire en devient une. Signaler en `mineur` s'il n'est pas exploitable, en
`majeur` ou `bloquant` si un chemin d'attaque existe.

## Valeurs par defaut et configuration

- Mode debug, pages d'erreur detaillees ou console d'administration actives hors developpement.
- CORS avec origine reflechie ou `*` combine aux identifiants (cookies, `Authorization`).
- Cookies de session sans `Secure`, `HttpOnly`, `SameSite` ; duree de session sans limite.
- Comparaison de configuration permissive par defaut : une variable absente qui desactive une
  verification (`if not CHECK_ENABLED`), un `ALLOWED_HOSTS` vide qui accepte tout.
- Secrets par defaut dans le code (`SECRET_KEY = "change-me"`) utilises si la variable manque.
- Chemins de webhooks ou d'API internes exposes sans signature ni authentification.

## Entrees et interpretation

- Deserialisation de donnees externes avec un format qui execute du code (pickle, YAML non sur,
  `unserialize`, `ObjectInputStream`, `eval`, `Function`).
- Construction de requetes, commandes, chemins, URL ou expressions de template par concatenation.
- Parsers XML avec entites externes actives ; decompression sans limite de taille (bombe zip).
- Expressions regulieres a retour arriere exponentiel sur une entree utilisateur.
- Validation par liste noire, ou validation faite apres une normalisation qui change la valeur.
- Redirections vers une URL fournie par l'utilisateur ; requetes serveur vers une URL fournie (SSRF),
  y compris via un apercu de lien, un import par URL ou un webhook.

## Identite et autorisation

- Identifiant d'objet pris dans la requete sans verifier qu'il appartient a l'appelant (IDOR), surtout
  sur les routes de lecture, d'export et de suppression.
- Verification d'autorisation dans l'interface seulement, ou seulement sur certaines methodes HTTP.
- Assignation de masse : objet construit directement depuis le corps de la requete (`role`, `is_admin`,
  `tenant_id` modifiables).
- Jetons : algorithme accepte depuis l'en-tete (`alg: none`), signature non verifiee, audience ou
  expiration ignorees, secret partage entre environnements.
- Reinitialisation de mot de passe ou lien magique sans expiration, reutilisable, ou previsible.
- Comparaison de secrets par egalite simple au lieu d'une comparaison a temps constant.

## Concurrence et etat

- Verification puis action non atomiques (TOCTOU) : solde, stock, quota, usage unique d'un code.
- Absence d'idempotence sur paiements et webhooks rejoues.
- Limitation de debit absente sur connexion, inscription, envoi d'email ou de SMS, endpoints couteux.

## Cryptographie et aleatoire

- Aleatoire non cryptographique pour des jetons, identifiants de session ou codes.
- Chiffrement sans authentification (mode sans integrite), IV ou nonce reutilise, cle derivee d'un mot
  de passe sans fonction lente.
- Hachage de mot de passe rapide (MD5, SHA-x simple) au lieu d'Argon2id, scrypt ou bcrypt.
- Verification TLS desactivee (`verify=False`, `rejectUnauthorized: false`) laissee en place.

## Donnees et journaux

- Donnees personnelles, jetons ou secrets dans les logs, les messages d'erreur, les URL ou l'analytics.
- Fichiers televerses servis depuis le meme domaine que l'application, sans controle du type reel, ou
  stockes avec le nom fourni par l'utilisateur.
- Exports et sauvegardes accessibles par URL devinable.

## Agents et LLM

- Sortie d'un modele utilisee comme commande, requete, chemin ou HTML sans validation.
- Contenu externe (page, document, issue) traite comme instruction par un agent outille.
- Outils d'agent avec plus de droits que la tache (ecriture, reseau, secrets) sans confirmation.
