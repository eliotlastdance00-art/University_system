# 🔍 University System — Doly Audit (Arhitektura · Database · Logika · Buglar · Kemçilikler)

> **Sena:** 2026-11-12 · **Şaha:** `arena/2103c8cd-university-system` · **Baza commit:** `14004a3`
> **Barlanan:** 238 faýl, ~11 100 setir Python (backend), ~12 150 setir JS/JSX/CSS (frontend), 4 SQL faýl, Docker + CI.
>
> Bu resminama **diagnostika**. Düzeltmeleriň tertibi we wagty [`docs/ROADMAP.md`](./ROADMAP.md)-de.

---

## 0. Gysgaça netije (Executive summary)

| Ugur | Baha | Düşündiriş |
|---|---|---|
| **Arhitektura düşünjesi** | 🟢 8/10 | `router → service → repository → schema → exceptions` gatlakly bölekleme **dogry we yzygiderli**. Domen boýunça papkalar arassa. |
| **Kodyň ýerine ýetirilişi** | 🔴 3/10 | Gatlak düzgüni köp ýerde bozulýar (repo içinde `commit()`, service içinde HTTP düşünjesi). |
| **Database shemasy** | 🔴 2/10 | `database/schema.sql` kodyň **hakykatdan soraýan** 20+ sütünyny öz içine almaýar → täze gurulan DB-de login hem işlemänok. |
| **Howpsuzlyk** | 🔴 2/10 | 6 sany router **doly açyk** (auth ýok), parol **açyk tekstde** ýazylýar, CORS `.*` + credentials, IDOR. |
| **Frontend** | 🟡 6/10 | Görsel dizaýn gowy başlangyç, ýöne responsive däl, tema ýok, broken nav linkler, 1 MB monolit bundle. |
| **Test / CI** | 🔴 1/10 | **Birje-de test ýok.** CI diňe issue summary. |
| **Dokumentasiýa** | 🟡 6/10 | `Arhitecture.md` mazmuny boýunça gowy, ýöne ady ýalňyş (README `ARCHITECTURE.md`-e link berýär → 404). |

**Iň kritiki 5 zat (şu gün düzedilmeli):**

1. 🔴 `schema.sql` ↔ kod arasynda sütün gabat gelmezligi → **ulgam hiç hili işe başlap bilmeýär** (`roles.level`, `refresh_tokens.is_revoked`, `notification_log.sender_id/status`, `device_tokens.device_type/is_active`).
2. 🔴 `app/profile/services.py:82` — täze parol **hash-lenmän** bazada açyk tekstde saklanýar.
3. 🔴 `sections / cohorts / programs / subjects / academic_years / (we bölekleýin timetable)` router-lerinde **hiç hili auth ýok** → internete çykarylsa, her kim fakultet/bölüm/toary döredip, öçürip bilýär.
4. 🔴 `NameError: get_user_id` — `grades/service.py` we `assignments/router.py` import etmän ulanýar → bu endpoint-ler **100% 500** berýär.
5. 🔴 `lessons/router.py:20` — `Teacher = Annotated[dict, (teacher_required)]` (`Depends()` ýatdyrylan) → mugallym endpoint-leri **auth-syz** we JSON body talap edýär.

---

## 1. Arhitektura — nähili gurlan

### 1.1 Umumy şekil

```
React 19 + Vite 8 SPA
   │  axios (Authorization: <raw JWT>)   Vite proxy: /University_system/v1 → :8000
   ▼
FastAPI 0.140  ── RequestContextMiddleware ── CORSMiddleware ── AppError handler
   │
   ▼  her domen üçin birmeňzeş 5 faýl
router.py    → HTTP, path ops, Depends(guard)
service.py   → biznes düzgünleri, audit ýazgysy
repository.py→ çig SQL (aiomysql, ORM ýok)
schemas.py   → Pydantic request/response
exceptions.py→ AppError şahalary
   │
   ├──► MySQL 8  (aiomysql pool, minsize=1 maxsize=10, autocommit=False)
   ├──► Redis    (arq queue — diňe timetable generasiýasy üçin)
   ├──► SMTP     (aiosmtplib — OTP)
   └──► Firebase Admin SDK (FCM push)
```

### 1.2 Domenler (18 router)

`auth`, `users`, `profile`, `faculty`, `department`, `dashboard`, `notifications` we `academic/` astynda:
`academic_years`, `assignments`, `attendance` (+ `attendance/qr`), `cohorts`, `grades`, `lessons`, `programs`, `sections`, `subjects`, `timetable`.

### 1.3 Arhitekturanyň **güýçli** taraplary (gorap galmaly)

- ✅ Gatlakly bölekleme **yzygiderli** — täze domen goşmak aňsat.
- ✅ ORM ýok, çig SQL → ýerine ýetirişe doly gözegçilik, N+1 ähtimallygy az.
- ✅ `AppError` ierarhiýasy + global handler → birmeňzeş JSON error formaty (`error_code`, `detail`, `request_id`).
- ✅ `RequestContextMiddleware` → her soraga UUID `request_id`, `X-Request-ID` header, latency logy.
- ✅ Strukturaly JSON log (`core/logger.py`) → Loki/Promtail taýýar.
- ✅ Audit trail düşünjesi (`actor_id`, `old_value`, `new_value`) dogry dizaýn edilen.
- ✅ QR attendance anti-cheat düşünjesi (30s token rotasiýa, `device_hash`, `ip_address`, enrollment barlagy, duplikat barlagy) gowy oýlanylan.
- ✅ Dockerfile-lar **hakykatdan professional**: multi-stage, non-root `appuser`, `tini`, `HEALTHCHECK`, nginx SPA + cache + security headers.
- ✅ Frontend `client.js`-däki **single-flight refresh queue** — köp 401 bolanda bir gezek refresh, beýlekiler nobata durýar. Bu köp proýektde ýalňyş edilýän zat, bu ýerde dogry.

### 1.4 Arhitekturanyň **gowşak** taraplary

| # | Mesele | Nirede | Näme üçin howply |
|---|---|---|---|
| A1 | **Transaction serhedi bozulan.** `get_db()` her sorag üçin `commit/rollback` edýär, ýöne 13 repository faýlynda **38 gezek** `await self.conn.commit()` bar. | `app/auth/repository.py:59,84,96,105`, `app/profile/repository.py:69,77`, `app/academic/*/repository.py` | Audit ýazgysy şowsuz bolsa, esasy üýtgeşme **eýýäm commit edilen** → "audit içinde bir transaction" prinsipi işlemeýär. Rollback mümkin däl. |
| A2 | **`BaseRepository` ulanylmaýar.** `core/base_repository.py` bar, ýöne hiç bir repo ondan miras almaýar. | `app/core/base_repository.py` | Öli kod. |
| A3 | **Unit-of-Work / service layer ýok.** Käbir service (`grades`) audit üçin ikinji bir `AuditLogRepository` döredýär, beýlekiler `core.audit_log.AuditLogger` ulanýar. | `app/academic/grades/repository.py:65` vs `app/core/audit_log.py` | Iki sany audit implementasiýa, iki dürli `action` formaty (`"CREATE"` vs `AuditAction.CREATE.value = "create"`). |
| A4 | **Guard-lar JWT-de ýeke `role` talyp edýär**, ýöne DB köp rol berýär (`user_roles` M:N). Login `ORDER BY r.level ASC LIMIT 1` bilen **diňe birini** saýlaýar. | `app/core/dependencies.py:60-95`, `app/auth/repository.py:19-27` | Admin+mugallym roly bolan ulanyjy diňe bir rol bilen işleýär. `dean` üçin hiç hili real ygtyýar çägi ýok (faculty scoping ýok). |
| A5 | **`role` claim-i JWT-de, DB-de däl.** Token çykarylandan soň rol üýtgedilse, köne token möhleti gutarýança **köne rol bilen işleýär**. | `app/auth/service.py` (`create_token({"sub","role"})`) | Roly aýyrmak (revoke) derrew täsir etmeýär. |
| A6 | **Redis pool her request-de açylyp ýapylýar.** | `app/academic/timetable/service.py:188-201` | Connection churn; ýalňyşlyk bolsa `redis.close()` ýerine ýetmeýär (try/finally ýok). |
| A7 | **Sinhron FCM çagyryşy async event loop-y bloklaýar.** | `app/notifications/service.py:135` → `send_fcm` → `messaging.send()` | 1000 alyja broadcast = loop 1000 gezek blokirlenýär; şol wagtda beýleki request-ler garaşýar. |
| A8 | **`init_firebase(None)` crash.** `FIREBASE_CREDENTIALS_PATH` default `None`, ýöne `main.py:44` ony hiç barlag-syz çagyrýar. | `app/main.py:44`, `app/notifications/infrastructure/fcm_client.py:13-21` | `.env`-de Firebase ýok bolsa **app启动 bolmaýar**. Docstring "gracefully skipped if absent" diýýär — kod tersini edýär. |
| A9 | **Rate limiting ýok.** `RateLimitError` klassy bar, ýöne hiç ýerde ulanylmaýar. | `app/core/exceptions.py:100` | `/auth/login`, `/auth/verify-otp`, `/attendance/qr/verify` brute-force üçin açyk. |
| A10 | **Healthcheck DB-ni barlamaýar.** `GET /` diňe statik JSON gaýtarýar. | `app/main.py:145-153` | Docker `HEALTHCHECK` "healthy" görkezýär, ýöne DB düşen bolsa ulgam işlemeýär. |

---

## 2. Database — shema derňewi

### 2.1 Iň uly mesele: **shema.sql kodyň talaplaryna gabat gelmeýär**

`database/schema.sql`-iň başyndaky bellik muny açyk aýdýar: *"Reconstructed from every FROM/JOIN/INSERT reference"* — ýöne rekonstruksiýa **ýarým-ýamalak** edilen. Netije: täze DB gurup, `schema.sql → 001 → 002 → 003` yzygiderliligini işletseň, **login hem işlemänok**.

| # | Kod näme soraýar | `schema.sql` näme berýär | Netije |
|---|---|---|---|
| **D1** | `roles.level` — `ORDER BY r.level ASC` (`auth/repository.py:25,45`), `SELECT level FROM roles` (`notifications/repository.py:55,147,153`) | `roles(id, name)` — **`level` ýok** | 🔴 `Unknown column 'r.level'` → **login 500**, broadcast 500 |
| **D2** | `refresh_tokens.is_revoked` (`auth/repository.py:53,67,81,93`, `auth/schemas.py:21`) | `refresh_tokens.revoked` (`schema.sql:209`) | 🔴 `Unknown column 'is_revoked'` → OTP tassyklamadan soň token ýatdyrylyp bilinmeýär → **login 500** |
| **D3** | `notification_log.sender_id`, `.status` (`notifications/repository.py:167,177`; `dashboard/repository.py:12`) | `notification_log(receiver_id,title,body,is_read,created_at)` | 🔴 Dashboard we bildiriş sahypasy 500 |
| **D4** | `device_tokens.device_type`, `.is_active`, `.updated_at` (`notifications/repository.py:12,18,21,34`) | `device_tokens(user_id, token, created_at)` | 🔴 FCM token registrasiýa 500 → push hiç wagt işlemeýär |
| **D5** | `user_profiles.cohort_id` (`notifications/repository.py:107`) | ýok | 🔴 `academic_year_id` boýunça audience filtrleme 500 |
| **D6** | `cohorts.academic_year_id` (şol bir sorag: `JOIN cohorts c ... c.academic_year_id`) | `cohorts(name, program_id, year_start)` | 🔴 şol bir |
| **D7** | `audit_logs.actor_id` / `entity_id` — `AuditLogger.log()` ikisini hem `None` goýberýär (`core/audit_log.py:31,34`) we broadcast-de `entity_id=None` (`notifications/service.py:112`) | `actor_id INT NOT NULL`, `entity_id INT NOT NULL` (`migrations/001:21,24`) | 🔴 Broadcast audit ýazgysy → **IntegrityError** |
| **D8** | `lessons.status` — `VARCHAR(20)` | kod `ENUM`-a meňzeş (`scheduled/held/cancelled`) | 🟡 maglumat bitewiligi DB derejesinde kepillendirilmeýär |
| **D9** | `attendance.status` — `VARCHAR(20)` | şol bir | 🟡 şol bir |
| **D10** | `subjects.code`, `faculties.code` — `VARCHAR(20)`, `UNIQUE` **däl** | — | 🟡 duplikat kod mümkin |
| **D10b** | `subjects.credits` — `repository.py:10,20,29`, `schemas.py:6,12,18`, frontend `Subjectspage.jsx` | `subjects(id, name, code, department_id)` — **`credits` ýok** | 🔴 Subject CRUD **doly 500** (`Unknown column 'credits'`). Şol bir wagtda `code` sütünini **hiç kim ulanmaýar** (ölü meýdan). |

### 2.2 Migration-leriň özi bozuk

| # | Mesele | Faýl | Düşündiriş |
|---|---|---|---|
| **D11** | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` | `migrations/002:82,84,97,106` | 🔴 **MySQL 8 muny goldamaýar** (bu MariaDB sintaksisy). Migration 100% syntax error berýär. |
| **D12** | 003 köne sütün atlaryny çaklaýar | `migrations/003:22,30` | 🔴 `CHANGE COLUMN subject_assignment_id ...` — ýöne `schema.sql:145` eýýäm `assignment_id` döredýär. 002 üstünlikli bolsa-da, 003 "Unknown column" berýär. |
| **D13** | `DROP FOREIGN KEY timetable_drafts_ibfk_2` | `migrations/003:18` | 🔴 awtomatik döreýän FK adyna bil baglaýar — MySQL wersiýasyna/prioritetine görä üýtgeýär. |
| **D14** | Migration runner **ýok** | — | 🟡 Alembic/Flyway/sqitch ýok. Tertip README-de el bilen ýazylan. `app/academic/attendance/migration.sql` bolsa `database/migrations/`-de däl, **modulyň içinde** — hiç kim ony tapyp işledenok. |
| **D15** | `schema.sql`-de `roles` seed edilýär, ýöne `level` sütünleri **belli däl** | `schema.sql:219` | 🔴 seed `INSERT IGNORE INTO roles (name)` — `level` goşulsa hem baha ýok. |

### 2.3 Indeks / öndürijilik kemçilikleri

| # | Tablisa | Ýetmeýän indeks | Sorag nirede |
|---|---|---|---|
| D16 | `attendance` | `(user_id)`, `(user_id, status)` | `dashboard/repository.py:170` (full scan), student stats |
| D17 | `lessons` | `(date)`, `(timetable_id, date)` | `dashboard/repository.py:158`, `get_by_date` |
| D18 | `notification_log` | `(receiver_id, created_at)`, `(receiver_id, is_read)` | her dashboard açylyşynda 2 sorag |
| D19 | `subject_assignments` | `(user_id)`, `(section_id)`, `(subject_id, section_id, semester)` UNIQUE | teacher schedule, duplikat assignment barlagy ýok |
| D20 | `grades` | `(student_id, subject_id)` UNIQUE ýok | 🟡 bir student-e bir assignment üçin **näçe gezek** baha goşup bolýar |
| D21 | `refresh_tokens` | `(user_id, is_revoked)`, `(expires_at)` | token arassalaýyş joby ýok → tablisa çäksiz ösýär |
| D22 | `timetable` | UNIQUE `(assignment_id, day, start_time)` ýok | 🟡 bir wagtda bir section-a 2 ders goýup bolýar |
| D23 | `rooms` | `(is_active, room_type)` | generator-da otag saýlama |
| D24 | Ähli `ENUM` sütünleri | charset `utf8mb4` diňe `SET NAMES` bilen, tablisa derejesinde `CHARACTER SET`/`COLLATE` **belli däl** (diňe QR migration-de bar) | 🟡 serwer default-yna bagly |

### 2.4 Data-model logiki kemçilikleri

- **D25** `sections.number VARCHAR(20)` — "topar belgisi" string, ýöne `capacity` bilen bile **UNIQUE däl**; iki sany "101" section bolup bilýär.
- **D26** `user_profiles.section_id` **capacity barlagy DB derejesinde ýok** — diňe application-level (`users/service.py:245`). `FOR UPDATE` bar, ýöne **transaction açyk däl** (`get_db` commit-edýär, `begin()` çagyrylmaýar) → gulplama derrew boşap gidýär. Koduň özi muny comment-de boýun alýar (`users/repository.py:162-168`).
- **D27** `grades.assignment_id` → `subject_assignments.id`-e FK, ýöne semantikasy "haýsy assignment-yň bahasy" — `subject_id` hem aýratyn saklanýar → **denormalizasiýa gapma-garşylygy** (assignment üýtgese `subject_id` könelýär).
- **D28** `lessons.date` bar, ýöne `lessons` üçin UNIQUE `(timetable_id, date)` ýok → bir günde bir timetable üçin 2 sapak döredip bolýar.
- **D29** Soft-delete **ýok** — `users` öçürilende `ON DELETE CASCADE` bilen audit_logs, attendance, grades **hemmesi** gidýär (`audit_logs.actor_id REFERENCES users(id)` — CASCADE bellenenok, şonuň üçin **RESTRICT** bolup, öçürme **şowsuz** bolýar). Bu real bug: ulanyjyny öçürip bolmaýar.
- **D30** `audit_logs.timestamp` — `DEFAULT CURRENT_TIMESTAMP` bar, ýöne `core/audit_log.py:57` el bilen `datetime.now(UTC)` geçirýär. Ikisi hem işleýär, ýöne timezone yzygiderliligi ýok (MySQL `TIMESTAMP` UTC-e öwürýär, `DATETIME` öwürmeýär; QR tablisa `DATETIME` ulanýar).

---

## 3. Backend logikasy — buglar (severity boýunça)

### 🔴 BLOCKER — ulgam işlemeginiň öňüni alýar

| ID | Faýl:setir | Bug | Täsiri |
|---|---|---|---|
| **B1** | `app/academic/grades/service.py:20,24,37,66,79,100,113` | `get_user_id` **ulanylýar ýöne import edilenok** | Baha döretme/üýtgetme/öçürme → `NameError` → 500. **Pyflakes tassyklady.** |
| **B2** | `app/academic/assignments/router.py:137,153,165` | şol bir — `get_user_id` import ýok | `/assignments/my`, `/my/semester/{s}`, `/my/schedule` → 500. Mugallym dashboard-y **işlemeýär**. |
| **B3** | `app/academic/programs/service.py:1,3` | `ProgramRepository` **iki gezek import** (absolute + relative) | Pyflakes: "redefinition of unused". Zyýansyz ýöne kod hiliniň görkezijisi. |
| **B4** | `app/core/database.py:5` | `pool: aiomysql.Pool \| None` — diňe **annotation**, başlangyç baha **berilmeýär** (`= None` ýok) | 🟠 `pool_create()` çagyrylman `get_db()` işledilse (test, ýa-da lifespan şowsuz), `if pool is None` → `NameError: name 'pool' is not defined` — niýetlenen `RuntimeError` deregine. Pyflakes hem `undefined name 'pool'` diýýär (setir 31, 34). |
| **B5** | `app/academic/lessons/router.py:20` | `Teacher = Annotated[dict, (teacher_required)]` — `Depends()` **ýatdyrylan** | FastAPI muny metadata hasaplap **ýok sayýar** → `current_user: Teacher` = "body-de `dict` iber" diýmek. Netije: **auth ýok** + 422 body talaby. `/lessons/{id}/start`, `/cancel`, `/my/history`, `/my/stats` hemmesi bozuk. |
| **B6** | `app/academic/subjects/__init.py` | Faýl ady `__init.py` (astynda çyzyk ýok) → `__init__.py` **ýok** | Python 3-de namespace package hökmünde işleýär (şonuň üçin häzir crash däl), ýöne **ýalňyş**; tooling (pytest, mypy, package build) muny tanamaýar. |
| **B7** | `app/auth/repository.py:125` | `cur.execute(sql, (department))` — **vergül ýok** | String → aiomysql ony char yzygiderliligi hökmünde görýär → "not all arguments converted". (`find_id` häzir hiç ýerden çagyrylmaýar = öli kod, ýöne partlaýjy.) |
| **B8** | `app/main.py:44` | `init_firebase(settings.FIREBASE_CREDENTIALS_PATH)` — `None` bolsa `credentials.Certificate(None)` | `.env`-de Firebase ýok bolsa **app başlanmaýar**. |
| **B9** | `app/academic/attendance/schemas.py:35-42` vs `app/academic/attendance/repository.py:73-85,113-143,200-227` | `AttendanceResponse` meýdanlary: `id, lesson_id, student_id, student_name, status`. Repository bolsa **`a.user_id`** gaýtarýar (`student_id` ýok) → `response_model` walidasiýa **şowsuz** | 🔴 `GET /attendance/lesson/{id}`, `PUT /attendance/{id}`, `GET /attendance/student/{id}` — **hemmesi 500** (`ResponseValidationError`). Attendance moduly okap bolmaýar. |
| **B10** | `app/academic/attendance/repository.py:12-38` vs şol bir schema | `get_students_by_lesson` → `{student_id, student_name, status, attendance_id}` — `id` we `lesson_id` **ýok** | 🔴 `GET /attendance/lesson/{id}/students` → **500**. Mugallym sapak başlanda student sanawyny alyp bilenok → **bütin attendance flow döwük**. |
| **B11** | `app/academic/attendance/schemas.py:10-12` | `AttendanceStatusEnum` diňe `present \| absent` — `schema.sql:174` comment-i `present \| absent \| late \| excused` diýýär | 🟠 `late`/`excused` **goşup bolmaýar**; frontend `TeacherAttendancePage` bu statuslary iberse **422**. |
| **B12** | `app/academic/attendance/repository.py:24` | `JOIN user_roles ur ON ur.role_id = 3` — **hardcoded rol ID** | 🔴 `roles` seed tertibi üýtgese (ýa-da `INSERT IGNORE` başga DB-de başga ID berse) student sanawy **boş** ýa-da **ýalňyş** bolýar. `JOIN roles r ON r.name='student'` bolmaly. |
| **B13** | `app/academic/lessons/repository.py:44,72,99,129,159,207` | `lessons.note` sütüni **her soragda** ulanylýar, ýöne `schema.sql:160-166` `lessons(id, timetable_id, date, status)` döredýär — `note` **ýok** | 🔴 `Unknown column 'l.note'` → **ähli lessons endpoint-leri 500**. Lesson ýatyrmak hem işlemeýär. (D32-ä seret) |
| **B14** | `app/academic/lessons/schemas.py:10-12` vs `schema.sql:166` | `LessonStatusEnum = completed \| cancelled`, ýöne DB default **`'scheduled'`** | 🔴 `scheduled` statusly islendik setir `response_model` walidasiýadan geçmeýär → `GET /lessons/`, `/date/{d}`, `/timetable/{id}` **hemmesi 500**. Täze döredilen sapak default bilen gelýär, şonuň üçin bu **hemişe** bolýar. |
| **B15** | `app/profile/services.py:48-57` vs `app/profile/repository.py:9-30` | `update_profile_me` ýazgysy `result["faculty_id"]`, `result["department_id"]`, `result["section_id"]` okaýar, ýöne `get_profile_me` SQL-i diňe `faculty` (at), `department` (at), `section_number` gaýtarýar — **ID-ler ýok** | 🔴 `PUT /profile/me`-de `faculty_id`/`department_id`/`section_id` iberilmedik islendik ýagdaýda (ýagny diňe at/e-poçta üýtgedilende — iň adaty ýagdaý) **`KeyError` → 500**. Profil redaktirlemek asla işlemeýär. |
| **B16** | `app/profile/repository.py:62-70` + `services.py:83` | `update_password_me` `SET password = %s` — **Argon2 hash edilmeýär**, `services`-de hem hash ýok | 🔴 Parol üýtgedilenden soň ulanyjy **login bolup bilmeýär** (`verify_password` hash bilen deňeşdirýär) + parol DB-de açyk tekstde galýar (S1 bilen birleşýär). |

### 🔴 CRITICAL — howpsuzlyk

| ID | Faýl:setir | Bug | Täsiri |
|---|---|---|---|
| **S1** | `app/profile/services.py:81-82` → `app/profile/repository.py:71-77` | `update_password_me(id, new_password)` — **`hash_password()` çagyrylmaýar** | 🔴 Täze parol bazada **açyk tekstde**. Soňra `verify_password(hash, plain)` şowsuz → ulanyjy **hasabyna girip bilmeýär**. Iki taraplaýyn betbagtçylyk. |
| **S2** | `app/profile/router.py:17-25` + `app/profile/schemas.py:6` | `UpdateProfile.id` **request body-den** alynýar; JWT-de `sub` bar bolsa-da ulanylmaýar (`actor_id` hem `None` geçirilýär) | 🔴 **IDOR**: islendik tassyklanan ulanyjy `{"id": 1, "email": "..."}` iberip **admin-iň profilini** üýtgedýär (email üýtgetme = parol dikeltme hüjümi). |
| **S3** | `app/academic/sections/router.py` (8 endpoint) | **Hiç hili `Depends(guard)` ýok** | 🔴 Section CRUD (döretmek/öçürmek) **anonim** elýeterli. |
| **S4** | `app/academic/cohorts/router.py` (6), `programs/router.py` (6), `subjects/router.py` (6), `academic_years/router.py` (3) | şol bir — auth ýok | 🔴 Akademiki gurluş doly açyk. |
| **S5** | `app/main.py:66-71` | `allow_origin_regex=".*"` + `allow_credentials=True` | 🔴 Islendik saýt cookie bilen cross-origin sorag iberip bilýär. `settings.ALLOWED_ORIGINS` **hiç ýerde ulanylmaýar**. |
| **S6** | `app/academic/grades/router.py:26-33,57-64` | `GET /grades/{id}` we `GET /grades/student/{id}` → diňe `get_current_user` | 🔴 **IDOR**: student başga student-iň bahalaryny okaýar. |
| **S7** | `app/academic/attendance/router.py:114-121,145-152` | `admin_or_student` — ýöne `student_id` path-den, "öz-özüňimi" barlagy ýok | 🔴 **IDOR**: student başga student-iň attendance-ny görýär. |
| **S8** | `app/auth/service.py:113-127` | SMTP şowsuz bolsa OTP **konsola `print()` edilýär** we cookie **henizem** goýulýar | 🔴 Production log-ynda (Docker `stdout`) OTP açyk görünýär → log okaýan her kim hasaba girýär. `DEBUG` flag-y bilen çäklendirilmedik. |
| **S9** | `app/auth/service.py:40-44` | `OTP_COOKIE_SECURE = False` hardcoded | 🔴 HTTPS-de cookie açyk kanalda gidýär. |
| **S10** | `frontend/src/utils/token.js` + backend | Access **we refresh token localStorage-de** | 🔴 Islendik XSS → doly hasap ogurlygy. Refresh token httpOnly cookie-de bolmaly. |
| **S11** | `app/core/dependencies.py:16-31` | `decode_token` diňe `JWTError`-y tutýar; **`iss`/`aud`/`jti` ýok**; access we refresh token bir `SECRET_KEY` bilen, `type` claim-i access-de **barlanylmaýar** | 🟠 Refresh token-i `Authorization` header-e goýup **access token hökmünde** ulanyp bolýar (`{"sub":"1","type":"refresh"}` → `decode_token` üstünlikli, `role` ýok → `admin_required` 403, ýöne `get_current_user` geçen). |
| **S12** | `app/academic/attendance/qr/service.py:189` | `submitted_token != session["current_token"]` — **constant-time däl** | 🟠 256-bit random token üçin timing hüjümi amaly däl, ýöne `hmac.compare_digest` ulanylmaly. |
| **S13** | QR `/verify` — rate limit ýok | — | 🟠 30s içinde 64-hex token-i brute force mümkin däl, ýöne **replay/enrollment** tarapy: bir student başga biriniň telefonyny alyp skan edip bilýär (`device_hash` diňe ýazylýar, **barlanylmaýar**). |
| **S14** | `app/core/config.py` | `SECRET_KEY: str` — **uzynlyk/entropiýa barlagy ýok**, default ýok (gowy), ýöne `.env.example` **boş** (0 baýt) | 🟠 Gysga `SECRET_KEY` bilen JWT galplaşdyryp bolýar. Dokumentasiýa ýok. |
| **S15** | `app/notifications/router.py:53-70` | `/broadcast` — `get_current_user` only (rol guard-y ýok) | 🟡 Service derejesinde `get_sender_scope` barlaýar, ýöne gorag **iki gatly däl**. |
| **S16** | `app/dashboard/router.py:20-27` | `limit: int = 10` — çäk ýok (`limit=999999`) | 🟡 DoS/ýadawlyk. |

### 🟠 HIGH — funksional buglar

| ID | Faýl:setir | Bug | Täsiri |
|---|---|---|---|
| **H1** | `app/profile/repository.py:52-69` | `UPDATE user_profiles SET ... WHERE user_id=%s` — setir **ýok bolsa 0 row affected**, INSERT fallback ýok | Rol berlende `assign_profile` diňe `faculty_id/department_id/section_id` **hemmesi None bolsa** yzyna gaýdýar (`users/repository.py:87-89`) → student-de profil setiri **döremeýär** → profil üýtgetme **sessiz** ýitýär. |
| **H2** | `app/users/repository.py:87-89` | `if not faculty_id and not department_id and not section_id: return` | `0` ýa-da `None` üçin birmeňzeş; esasy mesele: profil **upsert däl** → ikinji rol berlende `Duplicate entry` (UNIQUE `user_id`) → 500. |
| **H3** | `app/academic/grades/service.py:47-52,88-93,118-123` | `except Exception: logger.error(...); raise` — `AppError` hem tutulýar | GradeNotFoundError (404) → log "Failed to create grade" diýip ýalňyş habar berýär. Şeýle hem `try` blogy `InvalidGradeValueError`-y **tutmaýar** (create-de validation try-nyň daşynda, update-de içinde) → yzygidersiz. |
| **H4** | `app/academic/grades/service.py:14-15` | `data.score > data.max_score` — `Decimal` vs `float` deňeşdirmesi, `weight` **barlanylmaýar** | `weight` otrisatel ýa-da 1000 bolup bilýär → GPA hasaplamasy bozulýar. |
| **H5** | `app/auth/repository.py:53-59` | `save_refresh_token` içinde `await self.conn.commit()` | Login transaction-y **bölekleýin** commit edilýär; OTP tassyklama şowsuz bolsa refresh token **eýýäm bazada**. |
| **H6** | `app/auth/repository.py:100-110` | `old_token_change_new_token` — köne token-i **öçürmeýär**, diňe `UPDATE token=` | Rotasiýa dogry, ýöne **reuse detection ýok**: ogurlanan köne token eýýäm bazada ýok bolany üçin "reuse" anyklap bolmaýar (standart refresh-token-rotation howpsuzlygy ýitýär). |
| **H7** | `app/auth/service.py` `verify_otp` | OTP **bir gezek ulanyldy** diýen bellik ýok; `otp_token` cookie 5 minut (meselem) ýaşaýar | Şol bir OTP-ni möhlet içinde **köp gezek** ulanyp bolýar (replay). |
| **H8** | `app/academic/attendance/service.py:100-104` | `update(id, data, current_user)` — `current_user` **hiç ulanylmaýar**, `marked_by` ýazylmaýar, lesson-owner barlagy ýok | Islendik mugallym **islendik** attendance ýazgysyny üýtgedip bilýär; audit yzy ýok. |
| **H9** | `app/academic/attendance/repository.py` `bulk_create` | `marked_by` ýok, `ON DUPLICATE KEY` barmy — barlanmaly; `get_by_lesson` boş bolsa `AttendanceRecordsNotFoundError` | Sapak **başlananda** (heniz attendance ýok) `GET /lesson/{id}` → **404**, ýagny mugallym "boş list" görüp bilenok — frontend flow bozulýar. |
| **H10** | `app/notifications/service.py:120-140` | `sent_count = len(sent_user_ids)` — diňe FCM token-i bar bolanlar sanalýar; `notification_log`-a **hemmesi** ýazylýar (`sent`/`failed`) | Web ulanyjysy token registrasiýa etmedik bolsa hemmesi "failed" → `sent_count=0`, ýöne bildirişler bazada bar. Frontend `sent_count`-a "0 adama ýetdi" diýip görkezýär. |
| **H11** | `app/notifications/repository.py:167-173` | `bulk_create` — `executemany` bilen, `status` ENUM/VARCHAR şemada **ýok** (D3) | 🔴 şol bir |
| **H12** | `app/academic/timetable/service.py:188-201` | `redis = await self._get_redis_pool()` … `await redis.close()` — `try/finally` ýok | Exception bolsa Redis connection **syzylyp gidýär** (leak). |
| **H13** | `app/dashboard/repository.py:170-181` | `SUM(CASE WHEN status='present' ...)` — `late` we `excused` **hasaba alynmaýar** | Attendance rate pes görünýär; `late` hakykatda gatnaşyk. |
| **H14** | `app/dashboard/repository.py:12` | `SELECT ... sender_id ... FROM notification_log` | 🔴 D3 bilen şol bir |
| **H15** | `app/users/service.py:245-250` | `count["total"] >= section["capacity"]` — `FOR UPDATE` **transaction açyk däl** | Race condition: 30 ýerlik topara 2 student **bir wagtda** ýazylsa 31 bolýar. |
| **H16** | `app/users/service.py:59` | `actor_id=actor_id or created_user["id"]` | Admin ýok bolsa audit-de **öz-özüni döreden** ýaly görünýär → audit manyny ýitirýär. |
| **H17** | `app/users/router.py:32-35` | `POST /users/` — **açyk registrasiýa** (kod comment-i: "açyk registrasiýa endpoint"), `current_user` ýok, `actor_id=None` | 🔴 Internetde her kim hasap döredip bilýär. Rol soňra admin tarapyndan berilýär (`give_role` goragly), şonuň üçin privilege escalation ýok — ýöne **çäksiz hasap döretme** = spam/DoS we audit-de `actor_id` ýitýär. Ýapmaly ýa-da invite-token bilen çäklendirmeli. |
| **H18** | `app/academic/subjects/router.py` | `DELETE /subjects/{id}` **ýok**, ýöne frontend `deleteSubject` çagyrýar (`src/api/subjects.js:6`, `Subjectspage.jsx:41`) | 🟠 Subject öçürme düwmesi → **405 Method Not Allowed**. |
| **H18b** | `app/academic/subjects/repository.py:10,20,29` + `schemas.py:6` | `subjects.credits` ulanylýar, ýöne `schema.sql:88` diňe `(name, code, department_id)` döredýär | 🔴 `Unknown column 'credits'` → subject CRUD **doly 500**. (D10b-ä seret) |
| **H18c** | `app/auth/email/service.py:43-45` | `context.check_hostname = False` + `context.verify_mode = ssl.CERT_NONE` | 🔴 SMTP TLS **sertifikat barlagy öçürilen** → MITM bilen OTP/parol ele salynýar. |
| **H18d** | `app/department/service.py:110` | `has_more = len(existing) == limit` | 🟡 Soňky sahypa takyk `limit` setir bolsa, `has_more=True` → frontend ýene bir boş sorag edýär (DepartmentsPage "Load more" aýlanýar). |
| **H19** | `app/academic/timetable/generator.py` (587 setir) | Constraint-solver; `teacher_availabilities` **boş bolsa hoca elýeterli däl** diýen düzgün | 🟡 Maglumat girizilmedik bolsa generator **hiç zat** döretmeýär; admin "FAILED" görýär, sebäbini bilmeýär. Error message düşünjesi barlanmaly. |
| **H20** | `app/core/dependencies.py:96-118` | `PaginationParams.__init__(page, page_size)` — FastAPI buny **Query** hökmünde awtomatik çözmek üçin `Query(...)` annotation talap edýär; `page: int = 1` işleýär, ýöne **negatiw/uly baha** üçin çäk `page_size>100` diňe 100-e çenli, `page` çäksiz | 🟡 `page=999999999` → `offset` uly → MySQL ýadaw. |
| **H21** | `app/auth/service.py` `login()` | **User enumeration**: `InvalidCredentialsError` vs `AccountInactiveError` dürli habar | 🟡 Email bar/ýok belli bolýar. |
| **H22** | `.env.example` | **0 baýt — boş** | 🔴 Täze developer hiç hili üýtgeýäni bilmeýär; `Settings` **hemme** meýdany mandatory edýär (default ýok) → import wagty `ValidationError` → app başlanmaýar. |

### 🟡 MEDIUM — hil / durnuklylyk

| ID | Mesele |
|---|---|
| **M1** | **Test ýok.** `requirements.txt`-de `pytest`, `pytest-cov`, `coverage` bar; repo-da `test_pydantic.py` (5 setirlik scratch faýl, kök derejede) bar. `tests/` papkasy **ýok**. |
| **M2** | **Linter/formatter konfigurasiýasy ýok** (ruff/black/mypy). Python üçin CI **ýok**. |
| **M3** | `requirements.txt` — **pip freeze** görnüşinde (`annotated-doc==0.0.4`, `detect-installer==0.1.0`, `fastar==0.11.0` ýaly **şübheli/typosquat meňzeş** paketler bar). ⚠️ `argon==0.2.0` we `passlib==1.7.4` ulanylmaýar (`argon2-cffi` ulanylýar) → öli we howply baglylyklar. |
| **M4** | `PyMySQL==1.2.0` — PyMySQL-iň soňky hakyky wersiýasy 1.1.x; **1.2.0 ýok**. Şeýle hem `starlette==1.3.1`, `rich==15.0.0`, `pytest==9.1.1`, `coverage==7.15.2` — bularyň hemmesi **hakykatda ýok** wersiýalar (bu freeze galp ýa-da bozuk). `pip install -r requirements.txt` **şowsuz bolar**. |
| **M5** | `docker-compose.yml`: `web.depends_on.app.condition: service_healthy` — ýöne `app` service-de **healthcheck ýok** (diňe Dockerfile-de bar; compose override etmeýär, şonuň üçin işleýär, ýöne `Database` üçin `${DB_PASSWORD}` bilen healthcheck paroly **command-line-da görünýär** → process list-de leak). |
| **M6** | `docker-compose.yml`: `web` volume `./frontend:/app` + `/app/node_modules` — **build edilen `dist`** nginx-e göçürilýär, ýöne volume mount `/app`-i override edýär (nginx `/usr/share/nginx/html`-e seredýär, şonuň üçin zyýansyz, ýöne koder üçin düşnüksiz). |
| **M7** | `.gitignore`-da `.gitignore`-yň özi bar → özüni yzarlamagy bes edýär (git eýýäm track edilen üçin täsir etmeýär, ýöne **ýalňyş**). |
| **M8** | `.idea/` we `.vscode/` repo-da commit edilen. |
| **M9** | `README.md` → `ARCHITECTURE.md`, `CONTRIBUTING.md` linkleri; hakyky faýllar `Arhitecture.md`, `Contributing.md` → **GitHub-da 404** (case-sensitive). |
| **M10** | `Arhitecture.md` ady ýalňyş (iňlisçe "Architecture"). |
| **M11** | `app/academic/attendance/QR_ATTENDANCE_PLAN.md`, `timetable/plan.md`, `worker_setup_plan.md`, `advanced_timetable_progress.md`, `timetable_advanced_architecture.md` — **5 sany plan/progress .md** modulyň içinde. `docs/`-a göçürilmeli. |
| **M12** | Kod içindäki düşündirişler **3 dilde garyşyk** (türkmen, türk, iňlis): `app/auth/service.py:110-112` türkçe, `app/users/service.py:35` türkçe ("Kullanıcı varlığını kontrol eden ortak helper metot"). Yzygiderli dil saýlanmaly. |
| **M13** | `print()` bilen debug — `app/auth/service.py:118-121`, `app/worker.py:16,26,34,43,52,57`. Strukturaly logger bar, ýöne ulanylmaýar. |
| **M14** | `logger.exception(..., extra={"error_detail": ...})` — `StructuredJsonFormatter` diňe `request_id, user_id, method, path, ip_address` we `context`-i okaýar. `error_detail`, `email`, `new_user_id` ýaly extra meýdanlar **log-a düşmeýär** (ýitýär). |
| **M15** | `RequestContextMiddleware` `request.state.request_id` goýýar, ýöne **service/repository derejesine geçirilmeýär** (contextvars ýok) → log-da `request_id` diňe middleware we error handler-de bar, domen loglarynda ýok. |
| **M16** | `get_current_user` JWT-den **diňe** `sub`/`role`/`id` okaýar; `full_name`/`email` ýok. QR service `current_user.get("full_name", f"Student {id}")` → hemişe fallback ("Student 42") görkezilýär (`qr/service.py:181`). |
| **M17** | `AppError` üçin `HTTPException` garyşyk ulanylýar — `core/dependencies.py` we `core/security.py` `HTTPException` atýar, domenler `AppError`. Netije: 401/403 jogaplary **iki dürli formatda** (`{"detail": ...}` vs `{"error_code","detail","request_id"}`). Frontend her ikisini handle etmeli. |
| **M18** | `RateLimitError`, `ForbiddenError` (core) — köp ýerde **ulanylmaýar**; domenler öz exception-yny döredýär (gowy), ýöne core-ky öli. |
| **M19** | `app/auth/email/template/*.html` — Jinja2 `requirements.txt`-de bar, ýöne template render mehanizmi barlanmaly (`app/auth/email/service.py`). |
| **M20** | Sentry SDK `requirements.txt`-de bar, ýöne **hiç ýerde init edilmeýär** (`app/main.py`-de sentry import ýok). |
| **M21** | `arq==0.26.0` + `redis` — `requirements.txt`-de `redis` paketi **ýok** (arq özi getirýär, OK), ýöne `worker` service-i `Database`-e `service_healthy` bagly, healthcheck bolsa parol bilen. |
| **M22** | API prefix `/University_system/v1` — **uly harp + aşaky çyzyk** URL-de. REST konwensiýasy `/api/v1`. Üýtgetmek frontend + Docker ARG + nginx-e täsir edýär. |
| **M23** | `GET /` healthcheck root-da; `/healthz` ýa-da `/api/v1/health` bolmaly (nginx `/health` ulanýar, backend `/` — **üýtgeşik**). |
| **M24** | OpenAPI `response_model` köp ýerde `dict` ýa-da `list[dict]` (`sections`, `cohorts`, `programs`, `dashboard/audit-logs`) → Swagger **peýdasyz**. |
| **M25** | `attendance` status-lary (`present/absent/late/excused`) we `lessons.status` (`scheduled/held/cancelled`) — Pydantic `Enum` bar, ýöne DB `VARCHAR` (D8/D9). |

---

## 4. Frontend — derňew

### 4.1 Bar bolan ýagdaý

- **Stack:** React 19 · Vite 8 (rolldown) · React Router 7 · Axios · lucide-react · firebase · html5-qrcode · qrcode.react
- **Ölçeg:** 64 faýl, ~12 150 setir. Build **üstünlikli** (`vite build` → 996 kB, gzip 279 kB).
- **Lint:** `oxlint` → **44 duýduryş, 0 ýalňyşlyk** (ulanylmaýan importlar, ulanylmaýan catch param).
- **Dizaýn:** `src/styles/index.css` (868 setir) — dark + glassmorphism, CSS custom properties bilen gowy gurlan token ulgamy.

### 4.2 🔴 Buglar

| ID | Faýl:setir | Mesele |
|---|---|---|
| **F1** | `src/App.jsx` (tutuş) | **Ähli sahypa sinhron import** edilýär → 996 kB monolit bundle, code-splitting ýok. Vite özi duýduryş berýär. |
| **F2** | `src/components/Layout/Sidebar.jsx:41-42` | `/admin/attendance` we `/admin/grades` linkleri bar, ýöne `App.jsx`-de **route ýok** → basylanda `*` fallback → `/` → öz dashboard-yna gaýdýar. **Broken nav.** |
| **F3** | `src/pages/admin/SectionsPage.jsx` | Sahypa **bar (ýazylyp goýlan)**, ýöne `App.jsx`-de **routed däl** → elýetersiz. |
| **F4** | `src/components/Layout/Header.jsx:143,146` | `user?.email` — JWT payload-de `email` **ýok** (diňe `sub`, `role`, `exp`). Netije: avatar hemişe **"U"**, email **boş**. (`utils/token.js:34` comment hem muny boýun alýar.) |
| **F5** | `src/utils/token.js:29-38` | JWT **elde decode** edilýär, `jwt-decode` paketi `dependencies`-de bar bolsa-da **ulanylmaýar**. |
| **F6** | `src/components/Layout/Header.jsx:53-58` | "Mark all as read" → **N sany aýratyn PATCH** (sequential `for` loop). 50 bildiriş = 50 request. Backend-de bulk endpoint ýok. |
| **F7** | `src/api/client.js:88` | Refresh → `window.location.href = '/login'` (doly reload). React Router ulanylýar → **state ýitýär**, SPA manysy galmaýar. |
| **F8** | `src/api/client.js:57` | `requestUrl.includes('/auth/')` — `/auth/login` URL-de `/auth/` bar, OK; ýöne `baseURL` aýratyn bolanda (production `VITE_API_URL`) `originalRequest.url` **relative** → işleýär, ýöne şert gowşak. |
| **F9** | `src/contexts/AuthContext.jsx:12-19` | `loading` diňe **sinhron** token barlagy üçin; `/profile/me` bilen token **dogrulanmaýar** → gutaran/möhleti geçen token bilen UI "logged in" görkezýär, soňra 401 loop. |
| **F10** | `src/App.jsx:60` | `<Route path="*" element={<Navigate to="/" />} />` — **404 sahypasy ýok**. |
| **F11** | `src/styles/index.css:9` | `@import url('https://fonts.googleapis.com/...')` — **daşarky** sorag; sandbox/offline gurşawda font ýüklenmeýär, render block bolýar. Self-host ýa-da `font-display: swap` gerek. |
| **F12** | `src/index.css` (111 setir) + `src/App.css` (184 setir) | **Vite starter-iň galyndylary** — `--accent: #aa3bff`, `.counter`, `.hero` — hiç ýerde import edilmeýär (`main.jsx` diňe `styles/index.css` import edýär). Öli faýllar. |
| **F13** | `src/firebase.js:14` | `initializeApp(firebaseConfig)` — env variable **ýok bolsa** `undefined` config bilen init → console error. `messagingReady` guard-y bar, ýöne `initializeApp` özi **throw edip bilýär** (modul ýüklenende) → tutuş app ak ekrana düşýär. |
| **F14** | `public/firebase-messaging-sw.js` | Bar, ýöne `src/firebase.js`-de `VITE_FIREBASE_*` bilen SW config sinhronizasiýasy **el bilen**. |
| **F15** | `src/components/NotificationHandler.jsx:38-66` | `while (listenerActive.current)` + `onMessageListener()` — her mesaj üçin **täze Promise** döredilýär; `onMessage` callback **her iterasiýada täzeden registrasiýa** edilýär → Firebase listener leak. |
| **F16** | `src/utils/useFetch.js:19-24` | `deps.some(d => d === null || undefined)` bolsa `setLoading(false)` — ýöne **`data` köne** galýar; `apiFn` her render-de täze funksiýa bolsa **infinite loop** (deps array-i spread edilýär, `useCallback` deps = `deps` array). |
| **F17** | `index.html:7` | `<title>frontend_temp</title>` — **proýekt ady däl**. Meta description, theme-color, OG tags ýok. |
| **F18** | `.env.frontend.eaxample` | Ady **ýalňyş** ("eaxample"), mazmuny **boş**. |
| **F19** | `package.json:2` | `"name": "frontend_temp"`, `"version": "0.0.0"`. |
| **F20** | Tutuş frontend | **Responsive däl**: `layout.css`-de `@media` sorag **ýok**; sidebar hemişe 260px; tablisa overflow edýär. Mobilde ulanyp bolmaýar. |
| **F21** | Tutuş frontend | **Tema çalyşma ýok** (diňe dark). `prefers-color-scheme` goldawy ýok. |
| **F22** | Tutuş frontend | **Toast ulgamy ýok** — `PageShell` ýalňyşlygy diňe banner görkezýär; käbir sahypalar öz `showToast`-uny ýazýar (`DepartmentsPage.jsx:175`) → yzygidersiz. |
| **F23** | Tutuş frontend | **ErrorBoundary ýok** — bir komponent crash bolsa **ak ekran**. |
| **F24** | `Header.jsx`, `AdminDashboard.jsx`, `StatCard` | **100+ setir inline `style={{...}}`** → dizaýn ulgamyndan çykýar, tema çalyşma mümkin däl, okalýanlyk pes. |
| **F25** | Accessibility | `aria-*` attributlary **ýok**; modal-da focus trap ýok; `Esc` bilen ýapylmaýar; keyboard navigation çäkli; kontrast (dark tema `--text-muted: #6b6b80` on `#0a0a0f` ≈ 4.2:1) **AA derejesinden pes**. |
| **F26** | `src/api/*.js` | **Endpoint yzygiderliligi ýok**: käbirleri `/subjects/` (trailing slash), käbirleri `/cohorts` (ýok). FastAPI `redirect_slashes` → 307 → **goşmaça request** + `Authorization` header käbir proxy-de gaýtadan iberilmeýär. |
| **F27** | `src/api/department.js:4` | `getDepartmentsPaginated` — `DepartmentsPage.jsx:173` `res.data.has_more` okaýar; backend `DepartmentPaginationResponse` barlanmaly (gabat gelmese `undefined`). |
| **F28** | Build | `manualChunks` ýok → React, Firebase, lucide hemmesi **bir chunk-da**. lucide-react doly import edilýär (tree-shaking bar, ýöne 200+ icon modul). |
| **F29** | **PWA ýok** | `manifest.json` ýok, service worker diňe FCM üçin. Installable däl, offline däl → **mobil app fazasyna köpri ýok**. |
| **F30** | **i18n ýok** | UI doly iňlisçe, kod kommentariýalary türkmen/türk. Ulanyjy bazasy (Türkmenistan) üçin `tk` gerek. |
| **F31** | **Test ýok** | Vitest/Playwright ýok. |
| **F32** | `Dean` roly | `App.jsx:83` → `<div>Dean Dashboard</div>` — **placeholder**. Sidebar `dean`-e admin menýusyny görkezýär (`Sidebar.jsx:24`), ýöne route diňe `dashboard` → **broken**. |
| **F33** | `pages/admin/SectionsPage.jsx` | 🔴 **`CohortPage.jsx`-iň bire-bir nusgasy** (MD5 meňzeş: `197458a4…`). Faýlyň içi `CohortsPage` komponenti, `getCohorts/createCohort/…` importlary we `title="Cohorts"` bilen doldurylan. Netije: "Toparlar" (Sections) menýusy **Cohorts CRUD-y görkezýär** — section döredip/üýtgedip/pozup **bolmaýar**. |
| **F34** | `app/academic/sections/repository.py:120` | `get_section_timetable()` — `get_section_students()`-iň **copy-paste nusgasy** (studentleri gaýtarýar, timetable däl). Häzir **ölü kod** (router `TimetableService.get_group`-y ulanýar), ýöne biri ony ulanmaga synanyşsa ýalňyş maglumat berer. |
| **F35** | `pages/admin/AdminProfilePage.jsx` + `pages/teacher/TeacherProfilePage.jsx` | Iki sany **dublikat** profil sahypasy (641 setir), student/dean üçin bolsa profil sahypasy **ýok**. `/profile` route-y `DynamicProfilePage` bilen rol boýunça saýlaýardy, ýöne `dean`/`student` admin nusgasyna düşýärdi. |
| **F36** | `components/NotificationHandler.jsx:55` | Browser bildirişiniň ikony `'/vite.svg'` — `public/`-de **beýle faýl ýok** (diňe `favicon.svg`, `icons.svg`, `firebase-messaging-sw.js` bar) → her push bildirişinde ikon **404**, bildiriş ikonsyz görünýär. Şeýle hem `src/assets/{react,vite}.svg` we `hero.png` **hiç ýerde ulanylmaýar** (ölü asset). |

### 4.3 Frontend-iň gowy taraplary (gorap galmaly)

- ✅ `client.js` single-flight refresh queue — **dogry we seýrek**.
- ✅ `CrudPage.jsx` (613 setir) — generic CRUD + `groupBy` + `subGroupBy` + deterministik `hashToHue` reňk. **Gowy abstraksiýa**, diňe daşky görnüşi könelen.
- ✅ `PageShell` skeleton loading düşünjesi bar.
- ✅ Rol boýunça route nesting (`/admin`, `/teacher`, `/student`) arassa.
- ✅ CSS token ulgamy (`--space-*`, `--radius-*`, `--shadow-*`, `--z-*`) **dizaýn sistemasy hökmünde esas bolup bilýär**.
- ✅ QR scanner + attendance panel komponentleri bar (`QrScanner.jsx`, `QrAttendancePanel.jsx`).
- ✅ `ProtectedRoute` `allowedRoles` + `state={{from: location}}` (redirect-back düşünjesi bar, ýöne `LoginPage` muny **ulananok** → F-bug).

---

## 5. DevOps / CI / Gurşaw

| ID | Mesele |
|---|---|
| **O1** | `.github/workflows/summary.yml` — **ýeke-täk** workflow, diňe issue summary (AI inference). **Lint / test / build / Docker CI ýok.** |
| **O2** | `requirements.txt` hakyky däl wersiýalar bilen (M4) → `pip install` **şowsuz**. Docker build **ýykylyar**. |
| **O3** | `.env.example` boş (H22) → onboarding mümkin däl. |
| **O4** | `docker-compose.yml`-de `Database` service ady **uly harp bilen** (Docker konwensiýasy: lowercase). `make shell-db` `${MYSQL_USER}` ulanýar, ýöne compose diňe `MYSQL_ROOT_PASSWORD` + `MYSQL_DATABASE` belleýär → **`MYSQL_USER` ýok** → shell-db boş ulanyjy bilen girýär. |
| **O5** | `Database` healthcheck `-p${DB_PASSWORD}` → parol **`docker inspect`-de we process list-de** görünýär. |
| **O6** | Migration **awtomatik işledilmeýär** — MySQL container-de `/docker-entrypoint-initdb.d` mount ýok. El bilen. |
| **O7** | `Docker/backend.Dockerfile` — `default-libmysqlclient-dev` **runtime image-de hem** bar (builder-de gerek, runtime-da diňe `libmariadb3`/`libmysqlclient21` runtime paketi ýeterlik) → image **artykmaç 200+ MB**. Şeýle hem `aiomysql` **arassa Python** (PyMySQL) — MySQL C driver **asla gerek däl**. |
| **O8** | Backend `HEALTHCHECK curl -f http://localhost:8000/` — `/` DB barlamaýar (A10). |
| **O9** | `frontend/.env.frontend.eaxample` boş + ady ýalňyş; `docker-compose` 8 sany `VITE_FIREBASE_*` ARG geçirýär, ýöne nusga ýok. |
| **O10** | `.gitignore`-da `.gitignore` (M7), `frontend/public/firebase-messaging-sw 2.js` we `frontend/src/firebase 2.js` (**boşlukly** atlary, macOS "duplicate" galyndylary). |

---

## 6. Funksional boşluklar (näme **ýok**)

Plan.md-yň 1-nji maddasy "Attendance + QR-y gutarmaly" diýýär. Hakyky ýagdaý:

| Funksiýa | Ýagdaýy |
|---|---|
| QR attendance — backend | ✅ Ýazylypdyr (session/refresh/close/live/verify) |
| QR attendance — DB migration | ⚠️ `app/academic/attendance/migration.sql` **modulyň içinde**, `database/migrations/`-de ýok, README-de agzalmaýar |
| QR attendance — token awto-rotasiýa | ❌ 30s lifetime, ýöne **awtomatik refresh joby ýok**; diňe frontend poll edýär. Sahypa ýapyk bolsa token gutarýar → student skan edip bilenok |
| Admin üçin **Grades** sahypasy | ❌ Sidebar-da link bar, sahypa ýok (F2) |
| Admin üçin **Attendance** sahypasy | ❌ şol bir |
| Admin üçin **Sections** sahypasy | ⚠️ Ýazylypdyr, routed däl (F3) |
| **Dean** dashboard | ❌ Placeholder `<div>` (F32) |
| **Dean** üçin real ygtyýar (faculty scoping) | ❌ `admin_or_dean` bar, ýöne hiç bir sorag faculty_id bilen çäklendirilmeýär |
| **Student** profil sahypasy | ❌ `DynamicProfilePage` diňe teacher/admin; student → `AdminProfilePage` |
| Parol dikeltme (forgot password) | ❌ `auth/email/template/reset.html` **bar**, ýöne router/service/endpoint **ýok** — öli template |
| Email tassyklama | ❌ `verify.html` bar, `activate_user_by_email` repo-da bar, ýöne **çagyrylmaýar** |
| Bildiriş **bulk** okalan belleme | ❌ (F6) |
| Bildiriş **öçürme** | ❌ endpoint ýok |
| Eksport (CSV/Excel/PDF) | ❌ hiç zat |
| Gözleg (global) | ⚠️ diňe `users/search` |
| Paginasiýa | ⚠️ diňe `departments/next`; beýlekiler `limit=100` bilen "hemmesini" alýar |
| GPA / ortaça baha hasaplamasy | ❌ backend-de ýok, frontend el bilen |
| Ders materiallary / faýl ýüklemek | ❌ |
| Habarlaşma (chat) | ❌ (Plan.md 2-nji madda) |
| Gamification / leaderboard | ❌ (Plan.md 3-nji madda) |
| Multi-tenant | ❌ (Plan.md 6-njy madda — entek ir) |
| API dokumentasiýa (OpenAPI export) | ⚠️ Swagger bar, ýöne `response_model=dict` köp (M24) |
| Monitoring / metrics | ❌ Sentry import edilmeýär (M20), Prometheus ýok |
| Backup / DB dump | ❌ |

---

## 7. Öňüni alyş: nämä **degmeli däl**

Bular **gowy**, üýtgetme:

1. Domen boýunça 5-faýl konwensiýasy (`router/service/repository/schemas/exceptions`).
2. `AppError` ierarhiýasy + global handler + `request_id`.
3. Strukturaly JSON log formaty (`StructuredJsonFormatter`).
4. `client.js` single-flight refresh queue.
5. `CrudPage` abstraksiýasy (diňe stilini täzelemeli).
6. CSS custom property token ulgamy (üsti **doldurylmaly**, çalşyrylmaly däl).
7. Dockerfile-laryň multi-stage + non-root + tini gurluşy.
8. QR anti-cheat dizaýny (device_hash, ip, enrollment, duplicate barlaglary).
9. Timetable generator-yň constraint-based dizaýny (rooms/time_slots/teacher_availabilities/lecture_groups).

---

## 8. San taýdan jemleme

| Kategoriýa | Sany |
|---|---|
| 🔴 Blocker | 16 (B1–B16) |
| 🔴 Critical (howpsuzlyk) | 16 (S1–S16) |
| 🟠 High (funksional) | 25 (H1–H22, H18b–H18d) |
| 🟡 Medium (hil) | 25 (M1–M25) |
| 🔵 Frontend | 36 (F1–F36) |
| ⚙️ DevOps | 10 (O1–O10) |
| 🗄️ Database | 31 (D1–D30, D10b) |
| **Jemi** | **159** |

---

## 9. Indiki ädim

Düzeltme tertibi, wagt çaklamasy we frontend "advanced web" meýilnamasy:
👉 **[`docs/ROADMAP.md`](./ROADMAP.md)**
