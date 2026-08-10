# Contributing

## Adding a new domain module

Every domain under `app/` (and `app/academic/`) follows the same five-file shape. Copy an existing simple domain (`app/department/` is a good template) rather than starting blank.

```
app/<domain>/
├── __init__.py
├── router.py       # HTTP only — path operations, request/response models, Depends()
├── service.py       # business rules — one class, one method per use case
├── repository.py    # raw SQL only — no business logic, no HTTP concerns
├── schemas.py         # Pydantic models for request/response
└── exceptions.py       # subclasses of app/core/exceptions.py's AppError family
```

### Rules that keep this maintainable

1. **Router never runs SQL.** If a router imports `aiomysql` cursor methods directly, it's wrong — call the service.
2. **Repository never raises `HTTPException` or any `AppError`.** It returns `None` / `[]` / a dict. The service decides what a missing row *means* (404? default value?).
3. **Service owns the transaction.** One request = one connection = one implicit transaction (`get_db()` commits/rolls back for you). Never call `conn.commit()` yourself inside a service — that breaks the audit-log-in-same-transaction guarantee.
4. **Every mutation gets an audit log entry**, inside the same service method, using the existing `old_value`/`new_value` fetch pattern (see `app/department/service.py` for the canonical example):
   ```python
   before = await self.repo.get_x_by_id(id)
   await self.repo.mutate_x(...)
   after = await self.repo.get_x_by_id(id)
   await self.audit.log(actor_id, AuditAction.UPDATE, "x", id, before, after)
   ```
5. **New error types subclass the closest `core/exceptions.py` base**, not `Exception` directly, so the global handler in `main.py` picks them up automatically.
6. **New tables go in a new `database/migrations/00N_description.sql` file** — never hand-edit `schema.sql` after it's been applied anywhere.
7. **Role guards live in `core/dependencies.py`**, not duplicated per-router. If a route needs a new role combination, add it there.

### Frontend

- One file per backend domain in `frontend/src/api/` (matches `frontend/src/api/department.js` ↔ `app/department/`).
- Route access control goes through `<ProtectedRoute allowedRoles={[...]} />`, not ad-hoc checks inside page components.

### Before opening a PR

- [ ] `oxlint` passes (frontend changes)
- [ ] New/changed SQL is reflected in `database/schema.sql` or a new migration
- [ ] No secrets, `.env`, or credential files in the diff
- [ ] Mutating endpoints have an audit log entry