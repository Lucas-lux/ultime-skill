# Cron ou batch

Un job periodique echoue souvent en silence : personne ne regarde tant qu'une donnee attendue ne manque
pas. Le monitoring doit rendre l'absence d'execution aussi visible qu'une erreur.

## Signaux

- **Dead man's switch** : le job signale sa reussite (ping vers Healthchecks.io, Cronitor, une Pushgateway
  Prometheus avec un timestamp de derniere reussite, ou un heartbeat maison). On alerte sur l'**absence**
  de signal dans la fenetre attendue, pas seulement sur une erreur emise.
- Duree de chaque execution vs baseline, et derive (un batch qui gonfle finit par depasser sa fenetre).
- Chevauchement : detecter qu'une execution deborde sur la suivante (verrou, concurrence).
- Code de sortie et nombre d'items traites (0 item traite est souvent une anomalie, pas un succes).

## Robustesse

- Idempotence : le job peut etre rejoue sans effet de bord ni doublon. Suivre les reprises.
- Pour un job qui ecrit en base de production : tracer le volume ecrit et poser une garde (refus si le
  volume sort d'une plage attendue) pour eviter une operation destructrice massive.

## Mise en place

- Jobs courts : Prometheus Pushgateway (le job pousse ses metriques avant de finir) ou un service de
  cron monitoring externe.
- Jobs orchestres : voir `data-pipeline.md` (Airflow, Dagster exposent deja ces signaux).
- Logs structures avec un identifiant d'execution, retention suffisante pour le post-mortem.

## Alertes

- Non-execution dans la fenetre (priorite haute, c'est le cas qu'on rate le plus).
- Echec, duree anormale, chevauchement, volume hors plage.
