---
paths:
  - "**/*.py"
  - "**/pyproject.toml"
---

# Python

- Full typing of public functions; `from __future__ import annotations` unnecessary in 3.13+.
- The project's tools first (ruff, mypy or pyright, pytest): run `ruff check --fix` and `ruff format`
  on the touched files before handing back.
- No `except Exception: pass`; catch the precise exception, log with context.
- Paths with `pathlib`, dates with a time zone (`datetime.now(tz=...)`), no mutable global state.
- Dependencies declared in `pyproject.toml` with the project's manager (`uv add`, `poetry add`),
  never `pip install` by hand in the project.
- SQL: parameterized queries only; migrations through the project's tool (Alembic, Django).
