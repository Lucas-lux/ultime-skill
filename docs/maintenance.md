# Maintenance

## Construire et vérifier

```bash
python scripts/build.py                          # régénère vendor.json, plugins/, manifestes, puis vérifie
python scripts/build.py --cache .cache/vendor    # réutilise les clones amont déjà téléchargés
python scripts/check.py                          # vérification seule (frontmatter, em dash, Unicode, tests)
node --test tests/guardrails/guard.test.cjs      # tests du moteur de garde-fous
python -m unittest discover -s tests -p "test_*.py"
```

`build.py` efface `plugins/` avant de le reconstruire : aucun shell ni éditeur ne doit avoir son dossier
courant à l'intérieur (sous Windows, un dossier occupé bloque la suppression ; le script réessaie
quelques secondes puis s'arrête avec un message).

## Ajouter une skill importée

1. Vérifier la licence de la source au commit visé (voir [Licences](licences.md)) : seules les licences
   permissives sont acceptées, et la licence propre de la skill compte.
2. Ajouter la source (dépôt, commit complet, licence) dans `SOURCES` de `scripts/gen_vendor.py`, puis
   l'import (`pack_skill` ou `add`) dans le pack voulu. Options : `exclude`, `strip_tail` (couper un pied
   de page promotionnel), `drop_lines` (retirer des lignes), `replace` (adapter un passage),
   `license_note` (expliquer un cas de licence particulier).
3. `python scripts/build.py`, puis relire le diff de `plugins/`, `THIRD_PARTY.md` et les
   `MODIFICATIONS.md` générés.
4. Vérifier qu'aucune skill existante ne fait déjà le même travail : un doublon coûte du contexte et
   brouille le choix de Claude.

## Écrire une skill maison

- Dans `authored/<pack>/skills/<nom>/SKILL.md`, superposé sur `plugins/<pack>/` à la construction.
- Français sans accents dans les skills (le texte est consommé par Claude), puces denses, description
  de 400 caractères au plus qui dit quoi et quand l'utiliser, `SKILL.md` de moins de 500 lignes, le
  détail dans `references/` lu à la demande.
- Une nouvelle skill qui pilote un comportement vérifiable s'accompagne d'un script et de tests dans
  `tests/`.
- Déclarer un nouveau pack dans `PLUGINS` de `scripts/gen_manifests.py`, et l'ajouter aux bundles
  concernés.

## Mettre à jour une source

Changer son commit dans `scripts/gen_vendor.py`, reconstruire, relire le diff. Si sa licence a changé,
refaire le contrôle de licence avant de garder la mise à jour.

## Versions citées dans les skills

Les skills écrites maison citent des versions concrètes (actions GitHub, outils de CI), vérifiées à une
date donnée. Les revoir à chaque trimestre : `git ls-remote --tags https://github.com/<dépôt>` donne la
dernière version publiée, et `pin_actions.py --latest` met à jour les workflows générés.
