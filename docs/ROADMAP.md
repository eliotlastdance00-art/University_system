# 🗺️ University System — ROADMAP (ädimme-ädim iş meýilnamasy)

> Çeşme: [`docs/AUDIT.md`](./AUDIT.md) (158 tapyndy, ID-ler şol ýerden)
> Soňky täzelenme: **Faza F0 tamamlandy, Faza F1 dowam edýär**

---

## BÖLÜM A — Iş tertibi (Working agreement)

Bular **berk kadalar**. Her fazada şular ýerine ýetirilýär:

| # | Kaida | Manysy |
|---|---|---|
| **A1** | **Bir wagtda diňe BIR faza** | Ähli zady bir gezekde etmeýäris. Faza gutarmanka indiki başlanmaýar. |
| **A2** | **Her fazanyň ahyrynda TEST GATE** | `npm run ci` (lint → verify → build → bundle budget) **ýaşyl** bolmasa, faza tamamlanan hasaplanmaýar. |
| **A3** | **BACKEND DOŇDURYLAN** ❄️ | `app/`, `database/`, `Docker/`, `docker-compose.yml`, `requirements.txt`, `.env.example` — **hiç hili üýtgeşme ýok**. |
| **A4** | **Backend üýtgetmeli bolsa → SORAMAK** | Her bir backend düzedişi üçin öňünden sorag berilýär, jogap gelmänçe degilmeýär. Bölüm C-de garaşylýan sanaw bar. |
| **A5** | **Ölü/boş kod ýazma** | Placeholder, `<div>TODO</div>`, ulanylmaýan faýl, "hollow" komponent ýok. Her setir bir maksada hyzmat edýär. |
| **A6** | **Pikir → hereket** | Ilki faýl/endpoint/shema okalýar, soňra kod ýazylýar. Çaklama bilen kod ýazylmaýar. |
| **A7** | **Subutnama** | Her fazanyň netijesi [`docs/TEST_LOG.md`](./TEST_LOG.md)-e ýazylýar (buýruk + çykyş). |
| **A8** | **Web ilki, app soňra** | Web doly tamamlanman (F0–F6) mobil app fazasyna (F7) geçilmeýär. |
| **A9** | **Bir branch** | Ähli iş `arena/2103c8cd-university-system` branch-inde. |

### Test gate buýruklary

```bash
cd frontend
npm run lint          # oxlint — 0 error bolmaly
npm run verify        # scripts/verify.mjs — i18n / nav↔route / dublikat / lazy import
npm run build         # vite build — üstünlikli
npm run check:bundle  # scripts/check-bundle.mjs — ölçeg büjetleri
npm run ci            # ýokardakylaryň hemmesi yzly-yzyna
```

---

## BÖLÜM B — Frontend web fazalary

### Status tagtasy

| Faza | At | Ýagdaý | Test gate |
|---|---|---|---|
| **F0** | Binýat, dizaýn ulgamy, goraglar, CI/CD | ✅ **TAMAM** | 🟢 0 error |
| **F1** | Admin CRUD maglumat bitewiligi | 🔵 **DOWAM EDÝÄR** | ⏳ |
| **F2** | Auth akymy (Login + OTP) we sessiýa | ⚪ garaşýar | — |
| **F3** | Teacher akymy | ⚪ garaşýar (B1/B5/B9–B11 sebäpli **backend rugsady gerek**) | — |
| **F4** | Student akymy | ⚪ garaşýar | — |
| **F5** | Bildirişler + PWA (offline, install) | ⚪ garaşýar | — |
| **F6** | Testler (unit + e2e) we a11y audit | ⚪ garaşýar | — |
| **F7** | Mobil app köprüsi (Capacitor) | 🔒 **A8 boýunça blokirlenen** | — |

---

### ✅ F0 — Binýat, dizaýn ulgamy, goraglar, CI/CD · **TAMAMLANDY**

**Maksat:** berk binýat + awtomatik goraglar, şondan soň her faza howpsuz gurulýar.

| Ýerine ýetirilen iş | Audit ID |
|---|---|
| Doly audit: 158 tapyndy (B1–B16, S1–S16, H1–H22, M1–M25, F1–F35, O1–O10, D1–D31) | — |
| Design system v2: `styles/{tokens,base,components,layout}.css` — light/dark/system, AA kontrast, `--chart-1..8` | F21, F25 |
| UI kit (17 modul): Button · Primitives (Card/Stat/Badge/Avatar/Ring/BarChart/Timeline/KVList…) · Field (10 kontrol) · Overlay (Modal/Drawer/Confirm/Dropdown) · Tabs · DataTable · ErrorBoundary | F22–F25 |
| Layout v2: AppLayout · Sidebar · Header (breadcrumbs, ⌘K, tema, dil, bildiriş, profil) · MobileNav · CommandPalette | F4, F6, F20, F21, F30 |
| Maglumat gatlagy: `lib/{hooks,format,breakpoints}.js`, `lib/useApi.js` (abort/dedupe/retry/mutate), `lib/useMutation` | F16 |
| Kontekstler: Theme · Toast · Ui · Notifications · Auth (v2: `/profile/me` merge) | F4, F6, F21, F22 |
| Router: `config/routes.jsx` (lazy + `APP_ROUTES` + `LEGACY_REDIRECTS`), `config/navigation.jsx` (ýeke nav çeşme) | F1, F2, F3, F28 |
| Täze sahypalar: `NotFoundPage`, `admin/AdminAttendancePage`, `admin/AdminGradesPage`, `dean/DeanDashboard`, `shared/ProfilePage` | F2, F10, F13, F32, F35 |
| `index.html`: dogry title/meta/OG, **pre-paint tema skripti** (FOUC ýok), **async** şrift, boot splash | F11, F17, F25 |
| `vite.config.js`: `manualChunks` (react/router/http/icons/firebase/qr) → entry **996 kB → 79 kB** | F1, F28 |
| PWA binýady: `public/manifest.webmanifest` (icons, shortcuts, theme) | F29 |
| **Gorag skriptleri**: `scripts/verify.mjs` (6 barlag), `scripts/check-bundle.mjs` (4 büjet) | F31 |
| **CI/CD**: `.github/workflows/frontend-ci.yml` | O1 |
| Öli faýllar pozuldy: `src/index.css`, `src/App.css`, dublikat profil sahypalary; `Subjectspage.jsx` → `SubjectsPage.jsx` | F12, F35 |

**Test gate F0 (netije `docs/TEST_LOG.md`-de):**
```
vite build  ✓  1966 modul, 63 chunk, entry 78.98 kB, CSS 74.18 kB
oxlint      ✓  0 error / 61 warning
verify.mjs  ✗  1 error  → F33 (SectionsPage dublikat)  ← F1-de düzelýär
```

> ⚠️ `verify.mjs` bilgeşleýin **gyzyl** galdyryldy: F33 hakyky bug we F1-iň birinji işi.

---

### 🔵 F1 — Admin CRUD maglumat bitewiligi · **HÄZIRKI FAZA**

**Maksat:** her admin sahypasy **hakykatdanam öz entity-sini** dolandyrýar.

| # | İş | Audit ID |
|---|---|---|
| 1.1 | `pages/admin/SectionsPage.jsx` — `CohortPage` nusgasyny aýyryp, **hakyky Sections CRUD** ýazmak (cohort select, number, capacity + students drawer) | **F33** |
| 1.2 | Ähli `CrudPage` ulanýan sahypalary barlamak: import edilýän API moduly faýlyň entity-sine gabat gelýärmi (Cohort/Subjects/Programs/AcademicYears/Faculties/Departments/Users/Assignments/Lessons/Timetables) | F33 görnüşi |
| 1.3 | `verify.mjs`-e **6-njy barlag**: page faýlyň ady ↔ `export default` komponent ady gabatlygy (copy-paste-i awtomatik tutýar) | F33 |
| 1.4 | Öli assetleri aýyrmak: `src/assets/react.svg`, `vite.svg` (ulanylmaýan bolsa) | F12 |
| 1.5 | `sections` API-yň 3 nested endpoint-ini UI-a baglamak: `/students`, `/timetable`, `/attendance/stats` | §6 |

**TEST GATE F1:**
```bash
npm run ci           # 0 error — verify.mjs F33-i tutmaly däl
node scripts/verify.mjs   # "dublikat: ✓" we "component name: ✓"
```
**Definition of Done:** `/admin/sections` açylanda **Section** sanawy (id · number · cohort · capacity) görünýär; döretmek/üýtgetmek/pozmak modal-lary `SectionCreate`/`UpdateSection` shemasyna gabat; students drawer işleýär.

**Bellik (backend degilmeýäris):** `sections` router-de **auth guard ýok** (S3) — bu backend işi, Bölüm C-de garaşýar. Frontend tarapyndan diňe UI taýýarlanýar.

---

### ⚪ F2 — Auth akymy we sessiýa

| # | İş | Audit ID |
|---|---|---|
| 2.1 | `LoginPage` → dizaýn ulgamyna geçirmek (auth-shell, split layout, ýalňyşlyk kartasy) | F24 |
| 2.2 | Login-den soň **`state.from`-a gaýtmak** (häzir hemişe dashboard-a düşýär) | F7 |
| 2.3 | `OtpPage`: 6 sany aýratyn input, awtomatiki focus geçiş, paste goldawy, resend timer, öli importlary arassalamak | F24, lint |
| 2.4 | Parol meýdany: görkez/gizle, CapsLock duýduryşy, güýç indikatory | F25 |
| 2.5 | 401/403 → `client.js` interceptor: ýeke logout, toast, `/login?next=…` | F7 |
| 2.6 | Offline ýagdaý: `errors.offline` banneri (`navigator.onLine` + `online/offline` event) | F29 |

**TEST GATE F2:** `npm run ci` + elde barlag checklisti (`docs/TEST_LOG.md`): ýalňyş parol → düşnükli hata; OTP 6 san → awto-submit; deep link (`/admin/users`) → login → yza gaýdyp gelýär.

---

### ⚪ F3 — Teacher akymy  🔴 **BACKEND RUGSADY GEREK**

| # | İş | Bagly backend bugy |
|---|---|---|
| 3.1 | `TeacherDashboard` → dizaýn ulgamy + hakyky statistika | — |
| 3.2 | `TeacherLessonsPage` → sapak sanawy, ýatyrmak (note) | **B13, B14** (`lessons.note` sütüni ýok; `scheduled` status enum-da ýok → hemme lessons endpoint 500) |
| 3.3 | `TeacherAttendancePage` → okuwçy sanawy + bellik | **B9, B10** (`AttendanceResponse` `student_id` garaşýar, repo `user_id` gaýtarýar → 500) |
| 3.4 | QR sessiýa: awto-rotasiýa timeri, live scan akymy, `html5-qrcode` lazy | **B11** (`late`/`excused` enum-da ýok → 422) |
| 3.5 | `TeacherGradesPage` → baha girizmek | **B1, B2** (`get_user_id` import ýok → NameError 500) |

> **A3/A4 boýunça:** bu fazada backend düzedişleri **talap edilýär**. Rugsat berilmese, diňe **goragly UI** (defensive) ýazylýar we her endpoint üçin "backend kemçiligi" belligi goýulýar — ýagny faza **doly tamamlanan** hasaplanmaýar.

---

### ⚪ F4 — Student akymy

Dashboard · Timetable (hepde grid) · Grades (GPA + transkript) · Attendance (Ring + senenama) · Assignments.
Bagly: **B9** (`GET /attendance/student/{id}` 500), **B12** (hardcoded `role_id = 3`).

### ⚪ F5 — Bildirişler + PWA

`NotificationsPage` (bulk read/delete UI) · Service worker (offline shell, asset cache) · Install prompt · `beforeinstallprompt` · Update flow.
Bagly: **F6 backend** (bulk endpoint ýok) — frontend `Promise.allSettled` bilen eýýäm çözýär.

### ⚪ F6 — Testler we a11y

Vitest + React Testing Library (UI kit, `lib/format`, `lib/useApi`, `config/navigation`) · Playwright smoke (login → dashboard → bir CRUD) · axe-core a11y scan · oxlint 61 warning → 0.

### 🔒 F7 — Mobil app (A8: web gutarandan soň)

Capacitor bilen PWA-ny iOS/Android gaplamak **ýa-da** React Native/Expo. Karar F5-iň netijesine bagly.

---

## BÖLÜM C — Backend ❄️ **DOŇDURYLAN** (rugsat garaşylýar)

> **A3/A4:** aşakdaky işleriň **hiç biri** ýerine ýetirilmedi we rugsatsyz ýerine ýetirilmez.
> Sanaw diňe "näme soralmaly" görkezmek üçin.

### C1 — Frontend-i **göni bloklaýan** backend buglary (iň möhüm sorag)

| ID | Faýl | Nämä täsir edýär | Haýsy frontend fazasy blokirlenýär |
|---|---|---|---|
| **B1, B2** | `grades/service.py`, `assignments/router.py` | `NameError: get_user_id` → **500** | F3.5, F4 (grades) |
| **B5** | `lessons/router.py:20` | `Depends()` ýok → **unauthenticated + 422** | F3.2 |
| **B9, B10** | `attendance/schemas.py`, `repository.py` | `student_id` vs `user_id` → **500** (teacher attendance tutuşlygyna işlemeýär) | F3.3, F4 |
| **B11** | `attendance/schemas.py` | `late`/`excused` enum-da ýok → **422** | F3.4 |
| **B12** | `attendance/repository.py:24` | hardcoded `role_id = 3` → student sanawy boş/ýalňyş | F3.3, F4 |
| **B13, B14** | `lessons/repository.py`, `schemas.py` | `note` sütüni ýok + `scheduled` enum-da ýok → **ähli lessons 500** | F3.2, F4 (timetable) |
| **B15** | `profile/services.py:48-57` | `KeyError: faculty_id` → `PUT /profile/me` **hemişe 500** | F1 (ProfilePage edit tab) |
| **B16, S1** | `profile/repository.py:62-70` | Parol **hash edilmän** ýazylýar → üýtgedenden soň login bolmaýar | F2 (parol üýtgetme) |

### C2 — Howpsuzlyk (S1–S16) — frontend işine päsgel bermeýär, ýöne production üçin hökmany
CORS `.*` + credentials (S5) · açyk `sections/cohorts/programs/subjects/academic_years` router-leri (S3, S4) · IDOR grades/attendance (S6, S7) · açyk `POST /users/` (H17) · OTP `print()` (S8) · tokens localStorage-da (S10) · rate limiting ýok (S13).

### C3 — Database (D1–D31)
`schema.sql` kodyň talaplaryna gabat gelmeýär (D1–D7, D10b) · migration-ler bozuk (D11–D13) · migration runner ýok (D14) · indeksler ýok (D16–D24).

### C4 — Funksional bitewilik (H1–H22)
38× `conn.commit()` (H5) · `assign_profile` UPDATE-only (H1/H2) · OTP replayable (H7) · Redis pool her request-de (H12/H13) · pagination `has_more` off-by-one (H18d) · `subjects` DELETE ýok (H18).

### C5 — DevOps (O1–O10)
`requirements.txt`-de **mümkin bolmadyk pin-ler** (`argon==0.2.0`, `fastar==0.11.0`, `PyMySQL==1.2.0`, `starlette==1.3.1`) → Docker build **ýykylýar** · `.env.example` **boş** → `Settings()` ValidationError · `docker-compose.yml`-de `Database` (uly harp) · healthcheck paroly syzdyrýar.

> **Sorag:** C1-iň haýsy bölegine rugsat berýärsiň? Rugsat bolmasa, F3/F4 fazalary "goragly UI + bellik" derejesinde galar we **doly işleýän** ulgam bolmaz.

---

## ⏱️ Çaklama

| Faza | Iş | Wagt | Baglylyk |
|---|---|---|---|
| F0 | Binýat + CI | ✅ gutardy | — |
| F1 | Admin CRUD bitewiligi | 0.5 gün | — |
| F2 | Auth akymy | 0.5 gün | — |
| F3 | Teacher | 1 gün | **C1 rugsady** |
| F4 | Student | 1 gün | **C1 rugsady** |
| F5 | Bildirişler + PWA | 0.5 gün | — |
| F6 | Testler + a11y | 1 gün | F1–F5 |
| **Jemi web** | | **~4.5 gün** | |
| F7 | Mobil app | aýratyn | web gutarandan soň |

---

## 📎 Goşmaça resminamalar

- [`docs/AUDIT.md`](./AUDIT.md) — 158 tapyndynyň doly sanawy
- [`docs/TEST_LOG.md`](./TEST_LOG.md) — her fazanyň test gate netijeleri (subutnama)
- `.github/workflows/frontend-ci.yml` — CI/CD pipeline
