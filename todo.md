# University System - To-Do List

## Critical Bugs to Fix
- [ ] **Password Double-Hashing**: In `app/users/service.py`, `update_user` attempts to hash an already-hashed password if a new password is not provided. A method `update_user_without_password` needs to be implemented.
- [ ] **Invalid Role Type Checking**: In `app/users/service.py` -> `assign_section`, `get_user_role` is called with the string `"student"`, but the database query expects an integer `role_id`. This causes failures in section assignments.

## Refactoring Tasks
- [ ] **Dependency Injection for Repositories**: Update `service.py` classes to accept a Repository instance in the constructor, rather than the raw database connection. This will allow for easier mocking during testing.
- [ ] **Constants and Enums**: Extract magic strings (like `"student"`, `"admin"`) into Python `Enum` classes.
- [ ] **Query Builder / ORM**: Migrate raw `aiomysql` string interpolations to a query builder (e.g., SQLAlchemy Core or PyPika) for safer, more dynamic querying, avoiding long strings of SQL.

## Features
- [ ] Finish CRUD operations for `attendance` and `lessons` modules.
- [ ] Add dynamic RBAC middleware to avoid repetitive `Depends(admin_required)` boilerplate across multiple routers.
- [ ] Integrate database migrations tool (e.g., Alembic or simple SQL versioning).

## Testing
- [ ] Add `pytest` configuration and setup a test database fixture.
- [ ] Write unit tests for all `service.py` files (mocking the repository).
- [ ] Write integration tests for API endpoints (`router.py`) using `TestClient`.
