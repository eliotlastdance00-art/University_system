# Architecture — University System

> Layered FastAPI backend + React admin frontend for a university management platform (users/roles, academic structure, attendance, grades, notifications, audit trail).

**Repo:** `eliotlastdance00-art/University_system`
**Backend:** FastAPI 0.140 · Python (async) · aiomysql (raw SQL, no ORM) · MySQL
**Frontend:** React 19 · Vite 8 · React Router v7 · Axios
**Auth:** JWT (access + refresh) + email OTP as a second factor
**API base path:** `/University_system/v1`

---

## 1. High-Level Shape

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│   role-based routes (admin / dean / teacher / student)       │
│   axios client → Authorization: <access_token>                │
└───────────────────────────┬───────────────────────────────────┘
                             │ HTTPS / JSON
┌───────────────────────────▼───────────────────────────────────┐
│                          FastAPI app                           │
│  RequestContextMiddleware → CORS → Router → AppError handler   │
│                                                                 │
│   Router  →  Service  →  Repository  →  aiomysql Connection    │
│  (HTTP,      (business    (raw SQL,       (pooled, per-request │
│  validation)  rules,      no ORM)          transaction)        │
│               audit log)                                       │
└───────────────────────────┬───────────────────────────────────┘
                             │
                     ┌───────▼────────┐
                     │     MySQL       │
                     └────────────────┘
```

Every domain folder under `app/` repeats the same four-file pattern:

```
app/<domain>/
├── router.py       # HTTP layer — path ops, dependency injection, thin
├── service.py       # business logic, orchestrates 1..N repo calls + audit log
├── repository.py    # raw SQL against aiomysql connection, no business logic
├── schemas.py        # Pydantic request/response models
└── exceptions.py     # domain-specific AppError subclasses
```

This is a deliberate constraint, not an accident: **routers never touch SQL**, **repositories never raise HTTP errors**, and **services own the transaction boundary**. Reading any one file tells you unambiguously what layer you're in.

---

## 2. Directory Structure

```
app/
├── main.py                  # FastAPI app factory, lifespan, router mounting
├── core/
│   ├── config.py             # pydantic-settings, env-driven
│   ├── database.py           # aiomysql pool lifecycle + get_db() dependency
│   ├── security.py           # Argon2 hashing, JWT encode/decode, OTP
│   ├── dependencies.py       # CurrentUser + role guards (admin_required, etc.)
│   ├── middleware.py         # RequestContextMiddleware (request_id, timing, logging)
│   ├── exceptions.py         # AppError hierarchy (base classes only)
│   ├── audit_log.py          # AuditLogger + AuditAction enum
│   ├── base_repository.py    # tiny shared repo base (get_by_id_or_raise)
│   └── logger.py             # structured logger
│
├── auth/                     # login → OTP → JWT issuance, refresh, logout
├── users/                    # user CRUD, role assignment, profile linkage
├── profile/                  # self-service profile endpoints
├── faculty/                  # faculties
├── department/                # departments (belongs to a faculty)
├── dashboard/                 # aggregated stats for admin/teacher/student views
├── notifications/             # FCM push + in-app notification log
│   └── infrastructure/
│       └── fcm_client.py      # Firebase Admin SDK wrapper
│
└── academic/                  # academic domain group
    ├── programs/               # degree programs (belongs to a department)
    ├── cohorts/                 # student intake batches
    ├── sections/                 # class sections (capacity-bound)
    ├── subjects/                 # course catalog
    ├── assignments/               # teacher ↔ subject ↔ section mapping (subject_assignments)
    ├── academic_years/             # year_start/year_end, is_active flag
    ├── timetable/                   # scheduled slots
    ├── lessons/                      # concrete lesson instances derived from timetable
    ├── attendance/                    # per-lesson, per-student attendance
    └── grades/                        # scores per student/subject/assignment

frontend/
├── src/
│   ├── api/                 # one axios wrapper file per backend domain
│   ├── contexts/AuthContext.jsx   # token storage, current user, role
│   ├── components/
│   │   ├── ProtectedRoute.jsx     # route guard by role
│   │   └── Layout/                 # AppLayout, Header, Sidebar
│   └── pages/
│       ├── auth/            # LoginPage, OtpPage
│       ├── admin/            # Dashboard, Users, Faculties, Departments, Assignments
│       ├── teacher/           # Dashboard, Assignments
│       └── student/            # Dashboard

database/
└── migrations/
    └── 001_grades_and_audit.sql   # ⚠ only migration present — see §7 Gaps
```

---

## 3. Request Lifecycle

1. **`RequestContextMiddleware`** assigns a `request_id` (UUID), logs start/finish with latency, and is the last line of defense — it catches any unhandled exception and returns a safe generic 500 instead of leaking a stack trace.
2. **CORS** — origins are read from `ALLOWED_ORIGINS` (comma-separated env var), methods/headers wide open.
3. **Router** validates the request body against a Pydantic schema, resolves `Depends(get_db)` (one pooled connection per request), instantiates the `*Service`, and delegates.
4. **Service** applies business rules (existence checks, uniqueness checks, ownership checks), calls one or more repository methods **on the same connection**, and — for anything that mutates state — writes an `AuditLogger.log(...)` call **inside the same transaction**.
5. **`get_db()`** commits on clean return, rolls back on any exception — so a service method and its audit-log entry either both land or both disappear. This is the core transactional guarantee of the codebase.
6. Any raised `AppError` subclass is caught globally in `main.py` and serialized to `{error_code, detail, request_id}`.

---

## 4. Auth & Authorization

**Flow:** `POST /auth/login` (email + password) → password checked via Argon2 → OTP generated, emailed via SMTP, and an `otp_token` (JWT, `type=otp_verification`) set as an **HttpOnly cookie** → `POST /auth/verify-otp` (reads the cookie + OTP code) → issues `access_token` + `refresh_token` (both JWT, HS-signed via `SECRET_KEY`).

- **Access token**: short-lived (`ACCESS_TOKEN_EXPIRE_MINUTES`), sent as a bearer-style value in the `Authorization` header (note: implemented via `APIKeyHeader`, not `OAuth2PasswordBearer` — so Swagger's "Authorize" padlock expects the raw token, no `Bearer ` prefix).
- **Refresh token**: longer-lived (`REFRESH_TOKEN_EXPIRE_DAYS`), persisted server-side (`refresh_tokens` table) so it can be revoked on logout.
- **Password hashing**: Argon2 (`argon2-cffi`), not bcrypt/PBKDF2 — correct modern choice, salt is embedded in the hash automatically.

**Authorization** is role-based, enforced via FastAPI dependencies in `core/dependencies.py`:

```python
admin_required, dean_required, teacher_required,
admin_or_dean, admin_or_student, admin_or_teacher
```

Each decodes the JWT payload's `role` claim and 403s on mismatch. There is no scope/permission table — roles are a fixed enum-like set (`admin`, `dean`, `teacher`, `student`) baked into the `roles` table and checked by string comparison. Fine for the current size; will not scale to per-permission ACLs without rework (see §7).

---

## 5. Data Model (as inferred from repository SQL)

No single schema file exists (see §7), so this is reconstructed from every `FROM` / `JOIN` / `INSERT INTO` across the codebase:

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | core identity (full_name, email, password, is_active) | referenced by nearly everything as `actor_id` / `student_id` / `created_by` |
| `roles` | fixed role catalog | — |
| `user_roles` | many-to-many user↔role | `user_id → users`, `role_id → roles` |
| `user_profiles` | 1:1 extension — faculty/department/section linkage | `user_id → users`, `faculty_id`, `department_id`, `section_id` |
| `faculties` | top-level academic unit | — |
| `departments` | belongs to a faculty | `faculty_id → faculties` |
| `programs` | degree program, belongs to a department | `department_id → departments` |
| `cohorts` | student intake batch | — |
| `sections` | class section with capacity | — |
| `subjects` | course catalog | — |
| `subject_assignments` | teacher↔subject↔section↔semester mapping | `user_id`, `subject_id`, `section_id` |
| `academic_years` | year_start/year_end + `is_active` | — |
| `timetable` | scheduled slots | derives `lessons` |
| `lessons` | concrete lesson occurrences | `timetable_id`, `date`, `status` |
| `attendance` | per-student, per-lesson status | `lesson_id`, `user_id` |
| `grades` | score per student/subject/assignment | `student_id`, `subject_id`, `assignment_id`, `created_by` — all FK to `users`/`subjects`/`subject_assignments` |
| `audit_logs` | who changed what, before/after JSON | `actor_id → users` |
| `notification_log` | in-app notification inbox | `receiver_id` |
| `device_tokens` | FCM push tokens per user | `user_id` |
| `refresh_tokens` | server-side refresh token registry (for revocation) | `user_id` |

**Audit pattern**: every mutating service method does `old_value = await repo.get(...)` → `await repo.mutate(...)` → `await repo.get(...)` again for `new_value` → `audit.log(actor_id, action, entity_name, entity_id, old_value, new_value)`, all inside the request's single transaction. This gives a full before/after diff per change at zero extra infra cost, but it does mean two extra `SELECT`s per write — acceptable at current scale, worth revisiting if write volume grows (see §7).

---

## 6. Error Handling

```
AppError (500, INTERNAL_ERROR)
├── ValidationError   (400)
├── UnauthorizedError (401)
├── ForbiddenError    (403)
├── NotFoundError     (404)
├── ConflictError     (409)
└── RateLimitError    (429)
```

Each domain subclasses these into specific errors (`UserNotFoundError(NotFoundError)`, `InvalidCredentialsError(UnauthorizedError)`, etc.) — so the client always gets a stable `{error_code, detail, request_id}` shape regardless of which domain threw. This is the single best architectural decision in the codebase: it means `main.py`'s exception handler never needs to know about individual domains, and adding a new domain never requires touching global error handling.

---

## 7. Known Gaps / Recommended Next Steps

These are not style nitpicks — they're the things that will actually bite in production or in onboarding a second developer:

1. **No canonical schema file.** Only `001_grades_and_audit.sql` exists, and it assumes `users`, `subjects`, `subject_assignments` already exist. There is no migration that creates `users`, `roles`, `faculties`, `departments`, `sections`, `programs`, `cohorts`, `subject_assignments`, `timetable`, `lessons`, `notification_log`, `device_tokens`, or `refresh_tokens`. Anyone cloning this repo today cannot stand up the database from the repo alone. **→ `database/schema.sql` (provided alongside this doc) fixes this.**
2. **No `.env.example`.** `config.py` requires 13+ env vars with no defaults for secrets. A new dev has to reverse-engineer `Settings` to know what to set. **→ `.env.example` provided.**
3. **No automated tests.** `pytest` and `pytest-cov` are in `requirements.txt` but there is no `tests/` directory anywhere in the repo. The layered architecture (repo/service split) is specifically what makes services easy to unit-test with a mocked repo — that leverage is currently unused.
4. **Dashboard returns hardcoded mock data** (per `admin_dashboard.md`'s own admission) — `app/dashboard/repository.py` needs real aggregate queries against the tables in §5.
5. **CORS is permissive** (`allow_methods=["*"], allow_headers=["*"]`) — fine for local dev, tighten before any public deployment.
6. **Committed `.idea/` and `.vscode/` config** — editor-specific, should be gitignored, not version-controlled.
7. **`OTP_COOKIE_SECURE = False`** hardcoded in `auth/service.py` — must become environment-driven (`True` in production, over HTTPS) or the OTP cookie is sendable over plain HTTP.
8. **Firebase service account JSON was committed to git history** (already being remediated per your earlier push-protection issue) — once cleaned, `FIREBASE_CREDENTIALS_PATH` should point to a path injected via deployment secret, never a repo file.
9. **No CI beyond an AI issue-summarizer** (`.github/workflows/summary.yml`). No lint/test workflow runs on PRs despite `oxlint` (frontend) and `pytest` (backend) both being present as dependencies.
10. **Audit log write pattern does two extra SELECTs per mutation** — acceptable now, but if `old_value`/`new_value` fetching becomes a bottleneck, consider having repositories return the affected row directly from `UPDATE ... RETURNING`-style patterns (MySQL 8+ workaround: re-`SELECT` in the same statement batch) instead of a second round-trip.

---

## 8. Suggested Additional Files (also provided)

| File | Why |
|---|---|
| `database/schema.sql` | The actual missing base schema — without it the migrations folder is misleading (looks complete, isn't) |
| `.env.example` | Onboarding — lets a new dev `cp .env.example .env` and know exactly what to fill in |
| `CONTRIBUTING.md` | Documents the router/service/repository/schemas/exceptions convention explicitly, so it survives you adding new contributors |
| `CHANGELOG.md` | You already have disciplined conventional-ish commit messages (`feat:`, `refactor:`, `fix:`) — a changelog is nearly free to maintain from that history |