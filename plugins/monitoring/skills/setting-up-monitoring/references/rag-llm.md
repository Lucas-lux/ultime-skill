# Application RAG ou LLM (LLMOps)

Un RAG ou une application LLM se monitore sur deux plans : la couche application (c'est aussi une API ou
une app web : appliquer `api-service.md` ou `web-app.md` et la base) et la couche LLMOps ci-dessous. Tout
doit etre monitore : une reponse qui part vite mais qui est fausse est une panne que les signaux
classiques ne voient pas.

## Tracer la chaine de bout en bout

Instrumenter chaque etape comme un span (OpenTelemetry ; conventions GenAI d'OTel, ou un outil de tracing
LLM comme MLflow Tracing, Langfuse, Phoenix, LangSmith selon la stack) :

- requete utilisateur -> reformulation -> embedding -> recuperation -> re-ranking -> construction du
  prompt -> appel au modele -> post-traitement et garde-fous -> reponse.
- Pour chaque span : duree, et pour l'appel modele le nom du modele, le nombre de tokens entree/sortie, le
  cout. Garder le trace id pour relier la reponse a toute la chaine.

## Cout et tokens

- Tokens entree et sortie par requete, par modele, par fonctionnalite. Cout derive (prix par token du
  modele). Suivre le cout par requete et le cout agrege par jour et par fonctionnalite.
- Alerter sur une derive du cout par requete (changement de prompt qui gonfle le contexte, boucle d'agent
  qui part en vrille) et sur un budget quotidien.
- Suivre le taux de hit du cache (prompt caching, cache semantique) : c'est le principal levier de cout et
  de latence.

## Latence par etape

- Latence de bout en bout et par etape (recuperation, appel modele, re-ranking). Le temps au premier token
  (TTFT) et le debit de tokens (tokens/s) pour une reponse en streaming.
- Separer la latence du fournisseur de modele de la latence propre a l'application.

## Qualite de la recuperation (le R de RAG)

- Recall@k et precision@k sur un jeu de questions de reference avec leurs passages attendus.
- Pertinence du contexte recupere (context relevance) et taux de passages reellement utilises dans la
  reponse.
- Taux de "rien trouve" et distribution des scores de similarite : un decrochage signale un probleme
  d'index, d'embedding ou de donnee.

## Qualite des reponses (eval en ligne et hors ligne)

- **Hors ligne** : un jeu doré (golden set) rejoue a chaque changement de prompt, de modele ou d'index.
  Metriques : groundedness ou faithfulness (la reponse s'appuie-t-elle sur le contexte), pertinence,
  exactitude, completude. Juges automatiques (LLM-as-judge) calibres contre des annotations humaines, plus
  des metriques deterministes quand elles existent.
- **En ligne** : echantillonner les echanges de production et les scorer en continu avec les memes juges.
  Suivre le taux d'hallucination estime, le taux de refus, la part de reponses hors sujet.
- Tracer la derive : la distribution des questions reelles s'eloigne du golden set -> l'eval n'est plus
  representative, il faut enrichir le jeu.

## Garde-fous et securite

- Taux de declenchement des garde-fous : injection de prompt detectee, contenu toxique, fuite de donnee
  personnelle ou de secret, sortie hors schema.
- Surface de securite specifique LLM : voir la skill `sec-audit` (`securing-ai-systems`) pour ce qu'il faut
  tester. Monitorer les tentatives d'injection et les depassements d'outils (excessive agency) cote agent.

## Feedback et signaux produit

- Feedback explicite (pouce haut/bas, note) et implicite (reformulation, abandon, copie de la reponse,
  clic sur une source). Les relier au trace id pour remonter a la chaine complete d'un mauvais retour.
- Boucle : les mauvais retours alimentent le golden set et la detection de regressions.

## Dashboards LLMOps

- Vue cout (tokens, cout par requete et par fonctionnalite, hit de cache).
- Vue latence (bout en bout, TTFT, par etape, part fournisseur).
- Vue qualite (groundedness, recall de recuperation, taux d'hallucination, feedback).
- Vue garde-fous (declenchements par type).
