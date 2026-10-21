# Benchmark graphify

Mesure, le 21 octobre 2026, de ce que graphify (graphe de connaissances d'un dépôt) apporte à Claude Code
pour comprendre un code existant : coût de construction du graphe, puis coût, temps et qualité des réponses
à des questions de reprise, avec et sans graphe.

## En bref

- **Construire le graphe d'un code ne coûte aucun token avec la CLI** (`graphify update .`) : 3 s pour 66
  fichiers, 14 s pour 712, 116 s pour 5 071. Via la skill, la même construction coûte **0,56 $ à 1,48 $**,
  car elle fait extraire la documentation et les images par des sous-agents et nommer les communautés par
  le modèle.
- **La skill graphify telle qu'elle est intégrée aujourd'hui n'apporte rien** : avec le graphe présent, elle
  ne s'est déclenchée seule dans aucune des 24 exécutions.
- **Interroger le graphe en premier (consigne courte, sans la skill) économise 16 % de tokens et 7 % de
  coût, mais dégrade les réponses** (exactitude 7,7 contre 8,3 sur 10) : le modèle fait confiance au graphe
  et ne vérifie plus le code.
- **La variante hybride (le graphe oriente, tout est vérifié dans le code) garde la qualité de la
  référence**, avec 7 % de tokens et 16 % de temps en moins, pour un coût quasi identique (-1 %).
- **Le gain grandit sur le gros dépôt** (cal.com, 5 071 fichiers) : -25 % de tokens et deux fois moins de
  tours avec la consigne courte, à exactitude moyenne équivalente mais complétude un peu plus faible.
- **Recommandation** : ne pas l'intégrer partout. Pour la reprise et les gros dépôts, une intégration
  légère (construction par la CLI, consigne hybride de deux lignes, sans charger la skill) est gratuite en
  tokens et légèrement plus rapide ; le gain en tokens reste modeste sur des questions isolées.

## Protocole

| Élément | Valeur |
|---|---|
| Outils | Claude Code 2.1.289, graphifyy 0.9.90 (environnement virtuel isolé), Windows 11 |
| Modèle des réponses | Sonnet, sessions `claude -p` neuves, sans MCP, outils Read, Grep, Glob, Bash, Skill ; écriture interdite |
| Dépôts | S : vercel/commerce `f7521d5` (66 fichiers de code, 4 000 lignes) ; M : excalidraw `1d4dc2c` (712 fichiers, 225 000 lignes) ; L : cal.com `0f19cc4` (5 071 fichiers, 551 000 lignes) |
| Questions | 4 par dépôt, typiques d'une reprise : vue d'architecture, localisation d'une fonctionnalité, traçage d'un flux, analyse d'impact d'un changement de signature (voir `bench.py`) ; réponse en 300 mots au plus avec chemins de fichiers |
| Répétitions | 2 par cellule, chaque condition sur sa propre copie du dépôt |
| Juge | Opus, à l'aveugle (réponses anonymisées et mélangées), vérifie les affirmations dans le code et note exactitude et complétude sur 10 |

Conditions :

| Code | Condition |
|---|---|
| A | Référence : pas de graphe, pas de skill |
| B | Graphe présent et skill graphify chargeable (intégration actuelle de la bibliothèque) |
| C | Graphe présent, sans skill, consigne courte : interroger le graphe (`graphify query`, `explain`, `path`) avant de lire le code |
| D | Comme C, en ajoutant : le graphe sert à s'orienter, chaque chemin, sens de dépendance, signature, ligne et comptage est vérifié dans le code avant d'être affirmé |

A, B et C ont été jugées ensemble ; A, C et D ont été jugées ensemble lors d'une seconde passe. La
référence A notée deux fois donne 8,29 puis 8,08 : **un écart de moins de 0,3 point est du bruit**.

## Construction et mise à jour du graphe

| Dépôt | CLI : durée | CLI : tokens | Graphe | Via la skill : coût | Via la skill : durée |
|---|---|---|---|---|---|
| S | 3 s | 0 | 323 nœuds, 744 arêtes | 0,56 $ | 98 s |
| M | 14 s | 0 | 8 069 nœuds, 31 122 arêtes, 12 Mo | 1,48 $ | 253 s |
| L | 116 s | 0 | 35 991 nœuds, 106 131 arêtes, 47 Mo | non mesuré | non mesuré |

- Sur le dépôt M, la skill s'est d'abord arrêtée pour demander quel sous-dossier analyser (68 documents et
  52 images détectés) ; en mode non interactif, il a fallu lui dire de continuer.
- Mise à jour après la modification d'un fichier : **la version testée réextrait 100 % des fichiers** sous
  Windows (cache inopérant), donc 20 s sur M et 115 s sur L à chaque mise à jour. Toujours sans token,
  mais un hook à chaque commit serait pénible sur un gros dépôt.
- Les communautés construites par la CLI restent anonymes ; les nommer demande le modèle (`graphify label`).
- La skill elle-même fait 742 lignes (environ 11 000 tokens chargés à chaque invocation).

## Résultats des requêtes

Moyennes par exécution. Tokens = entrée + cache (création et lecture) + sortie.

### Par condition (24 exécutions chacune)

| Condition | Coût | Tokens | Durée | Tours | Appels d'outils | Exactitude | Complétude |
|---|---|---|---|---|---|---|---|
| A référence | 0,121 $ | 173 900 | 21,0 s | 5,7 | 4,7 | 8,29 / 8,08 | 7,75 / 7,71 |
| B skill | 0,121 $ | 168 000 | 21,0 s | 6,0 | 5,0 | 8,25 | 7,79 |
| C graphe d'abord | 0,113 $ | 146 400 | 19,1 s | 4,3 | 3,3 | 7,71 / 7,75 | 7,08 / 7,00 |
| D hybride | 0,120 $ | 162 400 | 17,6 s | 5,5 | 4,5 | 8,17 | 7,54 |

Deux valeurs : première passe du juge / seconde passe.

### Par taille de dépôt

| Dépôt | Condition | Coût | Tokens | Tours | Exactitude (moyenne des passes) | Complétude |
|---|---|---|---|---|---|---|
| S commerce | A | 0,098 $ | 137 900 | 4,0 | 8,63 | 8,00 |
| | C | 0,096 $ | 119 000 | 4,1 | 8,56 | 7,50 |
| | D | 0,113 $ | 146 300 | 4,9 | 9,00 | 7,63 |
| M excalidraw | A | 0,127 $ | 159 000 | 5,4 | 7,88 | 7,88 |
| | C | 0,123 $ | 150 900 | 5,0 | 6,63 | 6,56 |
| | D | 0,113 $ | 130 400 | 4,9 | 7,50 | 7,13 |
| L cal.com | A | 0,138 $ | 224 800 | 7,6 | 8,06 | 7,31 |
| | C | 0,121 $ | 169 300 | 3,9 | 8,00 | 7,06 |
| | D | 0,134 $ | 210 700 | 6,6 | 8,00 | 7,88 |

### Par type de question

| Question | Meilleure condition | Remarque |
|---|---|---|
| Architecture | C et D (7,8 contre 7,5 à 7,7) | Seul type où le graphe améliore légèrement la qualité ; la skill B dégrade (6,5) |
| Localisation | A et D (8,7) | C perd en complétude (6,5 contre 8,3) |
| Traçage d'un flux | A et D (8,8 à 9,0) | C perd nettement (7,3 à 7,5) ; D lit environ 20 % de tokens de moins que A |
| Impact d'un changement | B (9,0, une seule passe) ; A, C et D entre 7,3 et 8,0 | C perd en complétude (6,7 à 6,8 contre 7,7 à 7,8) sur le décompte des appelants |

## Pourquoi la consigne « graphe d'abord » dégrade les réponses

Erreurs relevées par le juge sur les réponses C :
- chemins déduits des noms de nœuds sans ouvrir le fichier (une route API placée dans `app/` au lieu de
  `pages/`) ;
- sens de dépendance inversé entre deux paquets (le graphe d'AST ne distingue pas toujours qui importe
  qui) ;
- comptages d'appelants faux (environ 70 annoncés pour 200 occurrences réelles dans 56 fichiers) ;
- numéros de ligne approximatifs, fonctions privées présentées comme publiques.

La variante D corrige ces erreurs en imposant la vérification, au prix d'une partie de l'économie.

## Ce que ce benchmark ne mesure pas

- Des sessions longues ou des agents qui réexplorent le même dépôt à répétition (cas d'`app-factory`) : le
  graphe s'amortit sur plusieurs requêtes, mais l'économie par requête mesurée ici reste modeste.
- Des dépôts plus gros que cal.com, d'autres langages que TypeScript et JavaScript, d'autres modèles
  (notamment Haiku pour l'inventaire), des questions ouvertes sans limite de longueur.
- La valeur de la visualisation (`graph.html`) et du rapport `GRAPH_REPORT.md` pour un humain.
- Deux répétitions par cellule : les écarts de moins de 0,3 point de qualité ou de quelques pourcents de
  coût ne sont pas significatifs.

## Recommandation

| Option | Pour | Contre |
|---|---|---|
| Ne pas intégrer | Aucun risque, la référence répond déjà bien en 3 à 7 appels d'outils | On se prive d'un gain de temps sur les gros dépôts |
| **Intégration légère pour la reprise et les gros dépôts** (proposée) | Construction gratuite en tokens par la CLI ; consigne hybride D dans le `CLAUDE.md` du projet ; qualité préservée, -16 % de temps ; pas de skill de 11 000 tokens à charger | Gain en tokens modeste (-7 %) ; reconstruction lente sur un gros dépôt tant que le cache ne marche pas sous Windows ; dépendance Python en plus |
| Intégrer partout | Uniformité | Rien à gagner sur les petits dépôts ; coût de la skill si elle est utilisée pour construire |

Mise en œuvre proposée pour l'option légère : dans `ultime-profile`, profils « reprise » et « gros dépôt »
(au-delà de quelques milliers de fichiers de code) :
1. installer `graphifyy` (version épinglée) et construire avec `graphify update .`, sans nommer les
   communautés ;
2. ajouter `graphify-out/` au `.gitignore` ;
3. ajouter au `CLAUDE.md` du projet la consigne hybride D (deux phrases) ;
4. reconstruire avant une tâche d'exploration importante plutôt qu'à chaque commit ;
5. ne pas activer le pack `graphify` (la skill) dans ces profils.

## Coût du benchmark

Réponses 11,40 $, juges 10,95 $, constructions via la skill 2,29 $ : **24,64 $** au total.

## Reproduire

```bash
python -m venv ~/graphify-bench/gvenv && ~/graphify-bench/gvenv/bin/pip install graphifyy==0.9.90
# cloner les trois dépôts aux commits ci-dessus dans ~/graphify-bench/repos/<nom>-G, construire le graphe
# (graphify update .), puis copier chaque dossier en <nom>-A sans graphify-out/
python bench.py run                 # conditions A, B, C (ajouter D : voir run_one)
python judge.py                     # juge A, B, C ; puis : python judge.py ACD judge2
python analyze.py                   # tableaux et summary.json
python build_via_skill.py commerce excalidraw   # coût de construction via la skill (copies <nom>-S)
```

Données : `data/runs.csv` (métriques des 96 exécutions), `data/judgments.json` (notes et erreurs relevées
par le juge), `data/builds-via-skill.json`, `data/summary.json`. Le texte des réponses n'est pas versionné.
