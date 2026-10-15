# Pipeline de donnees

Un pipeline (ingestion, transformation, chargement, orchestration Airflow/Dagster/dbt) se monitore sur
deux axes : l'execution (est-ce que le job tourne) et la donnee produite (est-elle correcte). Les deux
sont necessaires : un job vert qui produit des donnees fausses est le pire cas.

## Execution des jobs

- Succes, echec, duree et retards par job et par tache. Comparer la duree a sa baseline : un job deux fois
  plus long est un signal avant l'echec.
- Alerter sur l'echec, mais aussi sur le **non-demarrage** (dead man's switch) : un job qui aurait du
  tourner et ne s'est pas lance.
- Chevauchement : une execution qui deborde sur la suivante. Fraicheur de la derniere execution reussie.
- Retries et idempotence : suivre le nombre de reprises ; un job doit pouvoir etre rejoue sans doublon.

## Qualite de la donnee

- **Fraicheur** : age de la donnee la plus recente par table. Alerter si une table n'a pas ete mise a
  jour dans sa fenetre attendue.
- **Volume** : nombre de lignes par execution, compare a la baseline. Une chute ou un pic signale une
  source cassee ou un doublon.
- **Schema** : detecter un changement de colonnes, de types, de nullabilite (contrat de donnee). Alerter
  sur une rupture de contrat avant qu'elle ne se propage.
- **Valeurs** : taux de nuls, de doublons, bornes et plages attendues, distribution des categories,
  integrite referentielle. Outils : tests dbt, Great Expectations (API 1.x), Soda. Voir `data-engineering`
  (`data-quality-frameworks`).
- **Contrats et SLA de donnee** : formaliser fraicheur, completude et schema attendus par table, et
  mesurer contre.

## Lineage

- Suivre les dependances entre jeux de donnees (OpenLineage, lineage dbt) pour tracer l'impact d'une
  source cassee et retrouver la cause d'une anomalie en aval.

## Instrumentation

- Emettre les metriques d'execution depuis l'orchestrateur (Airflow, Dagster exposent des metriques ;
  sinon push vers Prometheus Pushgateway pour les jobs courts).
- Logs structures par tache avec un identifiant d'execution, correles aux metriques de qualite.

## Dashboards

- Vue execution (succes, duree, retards, fraicheur par pipeline).
- Vue qualite (fraicheur, volume, nuls, ruptures de schema par table).
- Vue lineage pour l'analyse d'impact.
