# AI Coding Conventions & Rules (CLAUDE.md)

## Folder Structure Rules
- Follow Domain-Driven Design: features are encapsulated in `app/<domain>/`.
- Each domain should contain: `router.py`, `service.py`, `repository.py`, `schemas.py`.

## Naming Rules
- **Variables/Functions**: `snake_case`.
- **Classes**: `PascalCase`.
- **Constants**: `UPPER_SNAKE_CASE`.

## Error Handling Pattern
- Raise custom exceptions defined in the domain or core.
- A centralized exception handler in `app/main.py` should catch these and return standard JSON error responses.

## Adding New Features
1. Create models in `schemas.py`.
2. Write raw parameterized SQL queries in `repository.py`. Do NOT use string interpolation for variables; use `%s` (aiomysql).
3. Implement business logic in `service.py`. Wrap operations that modify multiple tables in explicit DB transactions.
4. Expose endpoints in `router.py` using FastAPI decorators.

## Migration Workflow
- Currently, the project lacks an ORM like SQLAlchemy and a migration tool like Alembic.
- Manual SQL scripts should be carefully reviewed. Ask the user before running any destructive DB operations (e.g., `DROP`, `ALTER`, `DELETE` without `WHERE`).
