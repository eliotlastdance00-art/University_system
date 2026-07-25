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

## Grade Feature Implementation
- [x] Phase 1: Documentation (Update ARCHITECTURE.md, create CLAUDE.md, update TODO.md).
- [x] Phase 2: Database Grade Table (Design `Grade` model, create migration).
- [x] Phase 3: Audit Log (Design `AuditLog` table, hook into Grade CRUD).
- [x] Phase 4: Logging (Implement structured JSON logging for Grafana).
- [x] Phase 5: Transactions & SQL Safety (Wrap Grade and AuditLog writes in a single transaction).
- [x] Phase 6: Notifications (Implement/Fix Firebase FCM notifications).
- [x] Phase 7: Exceptions, Handler, Middleware (Custom exceptions, centralized handler, middleware).
- [x] Phase 8: Review Pass.
