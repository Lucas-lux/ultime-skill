# Python

## Installation (composite action)

- uv (project with `uv.lock`, or new project): `astral-sh/setup-uv@v10.3.0` (no moving major tag
  `v10`: exact version, then `pin_actions.py`) with `enable-cache: true`, then
  `uv sync --locked --all-extras --dev`. Python version: `.python-version`, otherwise the highest
  supported by `requires-python`.
- Poetry: `pipx install poetry` then `poetry install --sync --no-interaction`. pip:
  `actions/setup-python@v7` with `cache: pip` and `pip install -r requirements-dev.txt`.
- Matrix (nightly, and PR for a library): lowest and highest version of `requires-python`.

## Jobs

| Job | Command (through the task runner) | Notes |
|---|---|---|
| format | `ruff format --check .` | |
| lint | `ruff check --output-format=github .` | Minimum rules: `E`, `F`, `W`, `I`, `B`, `UP`, `S` (bandit), `SIM`, `RUF`, `PT`, `C4`, `DTZ`, `ASYNC`; add `D` if the project documents its public functions |
| typecheck | `mypy --strict` on the package, or `pyright` / `basedpyright` if already configured | strict for a new project; existing project: strict per module, an exception list that only shrinks |
| test | `pytest -n auto --cov --cov-branch --cov-report=xml --cov-report=term --cov-fail-under=<ratchet> --junitxml=junit.xml` | `pytest-xdist`, `pytest-cov`; `-p no:randomly` forbidden |
| deps | `uv run pip-audit` or `uvx pip-audit -r requirements.txt`; `deptry .` (unused or missing dependencies) | |
| build | `uv build` then `twine check dist/*` for a library | |

- Services (database, cache): the job's `services:` with a healthcheck, or `testcontainers` if the
  project uses it. Never a remote database.
- Coverage: XML report published as an artifact; Codecov only if `CODECOV_TOKEN` exists.

## Per framework

- Django: `python manage.py check --deploy --fail-level WARNING` (with fake prod variables),
  `python manage.py makemigrations --check --dry-run`, `python manage.py migrate` on the service
  database, tests with `pytest-django`.
- Alembic: `alembic upgrade head`, then `alembic check` (no missing migration), then a round trip
  `alembic downgrade base && alembic upgrade head` (reversible migrations).
- FastAPI, Starlette, Litestar: contract test `schemathesis run --checks all <url>/openapi.json`
  against the app started in the job (main level), export of the OpenAPI schema compared to the
  repository's to detect an API break.
- Celery: tests in `task_always_eager` mode; on main, a real worker against a service Redis.
- Airflow: `python -c "from airflow.models import DagBag; d = DagBag(include_examples=False); assert not d.import_errors, d.import_errors"`.
- dbt: `dbt deps && dbt build --target ci` on a service database, `sqlfluff lint` if configured.
- Data and ML: tests on a fixed sample; full training only nightly, with a metric threshold.

## Nightly level

- `mutmut run` (or `cosmic-ray`) on critical modules, score tracked in `docs/ops/ci.md`.
- `hypothesis` property tests with more examples (`--hypothesis-profile=ci-long`).
- Full matrix of Python versions and `pip-audit` on the resolved environment.
