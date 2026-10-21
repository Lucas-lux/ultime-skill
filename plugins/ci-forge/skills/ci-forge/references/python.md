# Python

## Installation (action composite)

- uv (projet avec `uv.lock`, ou nouveau projet) : `astral-sh/setup-uv@v10` avec `enable-cache: true`, puis
  `uv sync --locked --all-extras --dev`. Version de Python : `.python-version`, sinon la plus haute
  supportee par `requires-python`.
- Poetry : `pipx install poetry` puis `poetry install --sync --no-interaction`. pip :
  `actions/setup-python@v7` avec `cache: pip` et `pip install -r requirements-dev.txt`.
- Matrice (nuit, et PR pour une bibliotheque) : plus basse et plus haute version de `requires-python`.

## Jobs

| Job | Commande (via le task runner) | Notes |
|---|---|---|
| format | `ruff format --check .` | |
| lint | `ruff check --output-format=github .` | Regles minimales : `E`, `F`, `W`, `I`, `B`, `UP`, `S` (bandit), `SIM`, `RUF`, `PT`, `C4`, `DTZ`, `ASYNC` ; ajouter `D` si le projet documente ses fonctions publiques |
| typecheck | `mypy --strict` sur le paquet, ou `pyright` / `basedpyright` si deja configure | strict pour un projet neuf ; projet existant : strict par module, liste d'exceptions qui ne fait que diminuer |
| test | `pytest -n auto --cov --cov-branch --cov-report=xml --cov-report=term --cov-fail-under=<cliquet> --junitxml=junit.xml` | `pytest-xdist`, `pytest-cov` ; `-p no:randomly` interdit |
| deps | `uv run pip-audit` ou `uvx pip-audit -r requirements.txt` ; `deptry .` (dependances inutiles ou manquantes) | |
| build | `uv build` puis `twine check dist/*` pour une bibliotheque | |

- Services (base de donnees, cache) : `services:` du job avec healthcheck, ou `testcontainers` si le
  projet l'utilise. Jamais une base distante.
- Couverture : rapport XML publie en artefact ; Codecov seulement si `CODECOV_TOKEN` existe.

## Selon le framework

- Django : `python manage.py check --deploy --fail-level WARNING` (avec les variables de prod factices),
  `python manage.py makemigrations --check --dry-run`, `python manage.py migrate` sur la base de service,
  tests avec `pytest-django`.
- Alembic : `alembic upgrade head`, puis `alembic check` (pas de migration manquante), puis aller-retour
  `alembic downgrade base && alembic upgrade head` (migrations reversibles).
- FastAPI, Starlette, Litestar : test de contrat `schemathesis run --checks all <url>/openapi.json`
  contre l'app demarree dans le job (niveau principale), export du schema OpenAPI compare a celui du
  depot pour detecter une rupture d'API.
- Celery : tests en mode `task_always_eager` ; en principale, un worker reel contre Redis de service.
- Airflow : `python -c "from airflow.models import DagBag; d = DagBag(include_examples=False); assert not d.import_errors, d.import_errors"`.
- dbt : `dbt deps && dbt build --target ci` sur une base de service, `sqlfluff lint` si configure.
- Data et ML : tests sur un echantillon fixe ; entrainement complet seulement la nuit, avec seuil de metrique.

## Niveau nuit

- `mutmut run` (ou `cosmic-ray`) sur les modules critiques, score suivi dans `docs/ops/ci.md`.
- Tests de proprietes `hypothesis` avec plus d'exemples (`--hypothesis-profile=ci-long`).
- Matrice complete de versions de Python et `pip-audit` sur l'environnement resolu.
