# Entrainement et serving de modele ML (MLOps)

Deux phases distinctes. L'entrainement produit un modele versionne ; le serving l'expose. Monitorer les
deux, et le lien entre les deux (quel modele, entraine sur quelles donnees, sert en production).

## Entrainement

- **Suivi d'experiences** : parametres, metriques (loss, accuracy, F1, AUC selon la tache), artefacts,
  version du jeu de donnees et du code. MLflow ou Weights & Biases. Chaque run reproductible.
- **Courbes** : loss entrainement et validation, pour voir sur/sous-apprentissage. Alerter sur une
  divergence (NaN, loss qui remonte).
- **Donnees d'entrainement** : taille, distribution des classes, taux de nuls, fuite de donnee (leakage)
  verifiee. Versionner le jeu (DVC, Delta, snapshot) et lier au run.
- **Ressources** : utilisation GPU/CPU, memoire, duree, cout du run. Un GPU a 20 % signale un goulet
  d'etranglement cote donnees.
- **Registre de modeles** : versions, alias (par exemple `champion`, `challenger`) plutot que des stages
  deprecies, et la trace de promotion (qui, quand, sur quelles metriques).

## Serving

- **Signaux service** (couche de base + `api-service.md`) : latence p95/p99 de l'inference, debit, taux
  d'erreur, saturation GPU. Pour un LLM servi (vLLM, TGI) : TTFT, tokens/s, taille des batchs, requetes en
  file. Voir `ml-engineering` (`serving-llms-vllm`).
- **Derive des donnees d'entree (data drift)** : comparer la distribution des features en production a
  celle de l'entrainement (PSI, KS, distance de population). Alerter au-dela d'un seuil.
- **Derive des predictions (prediction drift)** : la distribution des sorties change meme si l'entree
  semble stable.
- **Decroissance de performance** : quand le vrai label arrive (parfois avec delai), recalculer la
  metrique metier (accuracy, precision) sur la fenetre recente et alerter sur une baisse.
- **Fraicheur des features** : age de chaque feature servie (surtout avec un feature store). Une feature
  perimee donne des predictions silencieusement fausses.
- **Boucle de retour** : taux de prediction corrigee ou rejetee par l'utilisateur, pour declencher un
  reentrainement.

## Dashboards MLOps

- Vue serving (latence, debit, erreurs, saturation).
- Vue qualite modele (derive entree, derive sortie, performance quand le label est disponible).
- Vue donnees (fraicheur des features, volume, nuls).
- Vue lineage : version du modele en production, jeu d'entrainement, date de promotion.
