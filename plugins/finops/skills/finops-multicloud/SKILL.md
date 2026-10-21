---
name: finops-multicloud
description: >
  FinOps multi-cloud vendor-neutral : FOCUS, unit economics, showback et chargeback, cout Kubernetes
  (OpenCost, Kubecost), anomalies. A utiliser quand l'utilisateur parle de FinOps, couts multi-cloud,
  FOCUS, unit economics, showback, chargeback, cout Kubernetes, OpenCost, Kubecost, allocation de couts,
  ou optimisation de la facture cloud multi-fournisseurs.
---

# FinOps multi-cloud

Complete les skills par fournisseur du pack `finops` (AWS, Google Cloud, Azure, Infracost) par une vue
normalisee et inter-cloud. Cadre : FinOps Framework (inform, optimize, operate). Verifier les chiffres
contre les exports de facturation reels, pas contre une estimation.

## Normaliser les couts (FOCUS)

- Les exports de facturation des fournisseurs ont des schemas differents. **FOCUS** (FinOps Open Cost and
  Usage Specification) est un format normalise : s'y aligner permet d'agreger AWS, Google Cloud et Azure
  dans un meme modele (colonnes communes : cout facture, cout amorti, service, region, compte,
  etiquettes...).
- Ingerer les exports FOCUS (ou les Cost and Usage Reports convertis) dans un entrepot (voir le pack
  `data-engineering`) et construire des modeles de cout par equipe, produit et environnement.
- Distinguer cout facture, cout amorti (engagements etales) et cout effectif apres remises.

## Unit economics

- Rapporter le cout a une unite metier : cout par requete, par utilisateur actif, par commande, par
  locataire, par 1000 inferences. C'est la metrique qui rend une hausse de cout interpretable.
- Suivre la tendance du cout unitaire : une facture qui monte avec l'usage est saine, un cout unitaire qui
  monte ne l'est pas.
- Relier au pack `monitoring` : exposer le cout unitaire comme une metrique suivie dans le temps.

## Showback et chargeback

- **Showback** : montrer a chaque equipe le cout qu'elle genere, sans refacturer. Premiere etape de
  responsabilisation.
- **Chargeback** : refacturer reellement aux equipes ou entites.
- Les deux reposent sur une **allocation** fiable : une politique d'etiquetage (tags) appliquee et
  verifiee (compte, equipe, produit, environnement), et une regle de repartition des couts partages
  (reseau, cluster, support) documentee.
- Mesurer le taux de couverture des etiquettes : un cout non etiquete n'est pas allouable.

## Cout Kubernetes

- Un cluster partage masque qui consomme quoi. **OpenCost** (open source, standard CNCF) ou **Kubecost**
  allouent le cout aux namespaces, charges de travail et labels, a partir des demandes et de l'usage reel
  (CPU, memoire, stockage, reseau).
- Reperer les ressources sur-demandees (requests tres au-dessus de l'usage), les charges sans limites, les
  volumes orphelins, et dimensionner (rightsizing, VPA). Voir aussi la skill `gke-cost-optimization` du
  pack finops pour GKE.
- Allouer le cout du cluster aux equipes via les labels, pour alimenter le showback.

## Optimisation transverse

- Engagements (reserved instances, savings plans, committed use) pilotes par la couverture et le taux
  d'utilisation, pas au doigt mouille.
- Ressources inactives ou orphelines (volumes, IP, instances arretees mais facturees, snapshots anciens).
- Rightsizing guide par les metriques d'usage reelles, pas par les valeurs par defaut.
- Stockage par palier selon la frequence d'acces ; sortie de donnees (egress) inter-region et inter-cloud
  surveillee, c'est un cout souvent sous-estime.

## Detection d'anomalies et culture

- Alerter sur une derive de cout (quotidienne et par service) via les detecteurs d'anomalie des
  fournisseurs ou un suivi maison sur les donnees FOCUS.
- Budgets par equipe et par environnement, avec alertes a l'approche du seuil.
- Boucle FinOps : visibilite (inform), optimisation (optimize), puis gouvernance continue (operate), avec
  une revue reguliere partagee entre ingenierie, produit et finance.

## Definition of done

- Les couts des fournisseurs sont normalises (FOCUS) et agreges dans un modele commun.
- Au moins un cout unitaire metier est suivi dans le temps.
- L'allocation par etiquettes couvre l'essentiel du cout ; showback en place par equipe.
- Le cout Kubernetes est alloue par namespace et equipe.
- Des alertes d'anomalie et des budgets sont actifs.
