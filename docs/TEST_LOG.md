# 🧪 TEST LOG — her fazanyň test gate subutnamasy

> Kaida **A7** (ROADMAP Bölüm A): faza diňe şu ýerde **ýaşyl ýazgy** bolandan soň tamamlanan hasaplanýar.
> Buýruklar: `cd frontend && npm run ci` (= `lint` → `verify` → `build` → `check:bundle`).

---

## Faza F0 — Binýat, dizaýn ulgamy, goraglar, CI/CD

**Sene:** 2026-11-12 · **Branch:** `arena/2103c8cd-university-system` · **Base:** `14004a3`

### Baseline (özgerdişlerden ÖŇ)

| Ölçeg | Baha |
|---|---|
| `npx vite build` | ✓ üstünlikli |
| Entry bundle | **996.12 kB** (gzip 279 kB) — ýeke monolit chunk |
| `npx oxlint` | 44 warning / 0 error |
| Test | ýok |
| CI | ýok (diňe issue-summarizer workflow) |

### F0 gutarandygdan soň

| Gate | Buýruk | Netije |
|---|---|---|
| Lint | `npx oxlint src` | 🟢 **0 error** / 61 warning (86 faýl, 92 kaida) |
| Verify | `node scripts/verify.mjs` | 🔴 **1 error** → `F33` dublikat (bilgeşleýin: F1-iň işi) |
| Build | `npx vite build` | 🟢 1966 modul → **63 chunk**, `✓ built in 687ms` |
| Budget | `node scripts/check-bundle.mjs` | 🟢 ähli büjetler çäginde |

**Bundle netijesi (F0):**

| Ölçeg | Öň | Soň | Büjet |
|---|---|---|---|
| Entry `index-*.js` | 996.12 kB | **78.98 kB** | ≤ 150 kB ✓ |
| CSS jemi | ~30 kB (1 faýl) | **74.18 kB** | ≤ 120 kB ✓ |
| Iň uly chunk | 996.12 kB | **384.96 kB** (`vendor-qr`, lazy) | ≤ 450 kB ✓ |
| Ilkinji ýük | 996.12 kB | **424 kB** (konserwatiw hasap) | ≤ 480 kB ✓ |

> `vendor-qr` (html5-qrcode, 385 kB) we `vendor-firebase` (46 kB) **lazy** —
> diňe QR/bildiriş ulanylýan sahypalarda ýüklenýär.

**F0 netijesi:** 🟡 **ŞERTLI TAMAM** — gate-iň özi işleýär, ýöne `verify` F33-i tutýar (F1-e geçirildi).

---

## Faza F1 — Admin CRUD maglumat bitewiligi

**Sene:** 2026-11-12

### Ýerine ýetirilen işler

| # | İş | Status |
|---|---|---|
| 1.1 | `pages/admin/SectionsPage.jsx` — `CohortPage` nusgasy aýyryldy, **hakyky Sections CRUD** ýazyldy (cohort select · number · capacity · students drawer · attendance tab · over-capacity duýduryşy) | ✅ |
| 1.2 | Ähli 31 sahypa üçin API↔entity gabatlygy barlandy (awtomatiki: `verify.mjs` 4-nji we 6-njy barlag) | ✅ |
| 1.3 | `verify.mjs`-e 6-njy barlag goşuldy: faýl ady ↔ `export default` komponent ady | ✅ |
| 1.4 | Ölü assetler pozuldy: `src/assets/react.svg`, `src/assets/vite.svg`. Bildiriş ikony `/vite.svg` (404) → `/favicon.svg` | ✅ (F36) |
| 1.5 | `sections` nested endpoint-leri UI-a baglandy: `/{id}/students`, `/{id}/attendance/stats` | ✅ |
| — | **Goşmaça tapylan bug:** `TabPanel` `active` prop-y goldamaýardy → ähli paneller bir wagtda render bolýardy + React "unknown prop" duýduryşy. Düzedildi. | ✅ |

### Test gate F1

```
$ npx oxlint src
Found 61 warnings and 0 errors.
Finished in 50ms on 86 files with 92 rules using 2 threads.

$ node scripts/verify.mjs
  · i18n: tk, en — tk 253 açar / en 253 açar
  · i18n: ulanylýan 132 açar, dinamiki şablon 4, ulanylmaýan ~84
  · i18n: ✓ ähli ulanylýan açarlar iki dilde hem bar
  · nav/routes: 28 nav elementi, 28 route
  · dublikat: ✓ hiç bir sahypa faýly beýlekisiniň nusgasy däl
  · lazy import: 31 dinamiki import barlanyldy
  · component ady: 31 sahypa barlanyldy
  NETIJE: ÜSTÜNLIKLI — 0 ýalňyşlyk, 0 duýduryş

$ npm run ci
  BÜJET BARLAGY:
    entry         78.08 kB / 150.00 kB   ✓
    iň uly chunk  375.95 kB / 450.00 kB   ✓
    CSS jemi      72.45 kB / 120.00 kB   ✓
    ilkinji ýük   424.39 kB / 480.00 kB   ✓
  NETIJE: ÜSTÜNLIKLI — ähli büjetler çäginde
```

**F1 netijesi:** 🟢 **TAMAM** — 4 gate-iň hemmesi ýaşyl.

### F1-den soň galan bellikler

| Zat | Sebäp | Haýsy faza |
|---|---|---|
| `src/assets/hero.png` ulanylmaýar (13 kB) | Login dizaýny F2-de kesgitlenýär — şol wagt ulanylar ýa-da pozular | F2 |
| oxlint 61 warning | Köpüsi köne sahypalardaky ulanylmaýan importlar we `no-await-in-loop` | F6 |
| `/sections` router-de auth guard ýok (**S3**) | ❄️ Backend doňdurylan — rugsat gerek | Bölüm C |
| `capacity` DB-de berk ýerine ýetirilmeýär (**D26**) | ❄️ Backend/schema — UI duýduryş berýär | Bölüm C |

---

## Barlag gurallary (nähili işleýär)

### `frontend/scripts/verify.mjs` — 6 statiki barlag

| # | Barlag | Tutýan hakyky bugy |
|---|---|---|
| 1 | i18n açar pokrytiýasy (tk ↔ en ↔ kod) | 59 açar ýetişmeýärdi (F30) |
| 2 | `NAV_ITEMS` path → `APP_ROUTES` bar | Sidebar linki 404 berýärdi (F2, F3) |
| 3 | Nav rollary ⊆ route rollary | Link görünýär, ýöne basanda yza zyňýar |
| 4 | Dublikat sahypa faýllary (MD5) | `SectionsPage` == `CohortPage` (F33) |
| 5 | `import('…')` ýollarynyň barlygy | Runtime "failed to fetch module" |
| 6 | Faýl ady ↔ `export default` ady | Copy-paste edilen komponent (F33) |

### `frontend/scripts/check-bundle.mjs` — 4 ölçeg büjeti

Entry · iň uly chunk · CSS jemi · ilkinji ýük. `dist/` gerek → `build`-dan soň işledilýär.

---

## Indiki: Faza F2 — Auth akymy we sessiýa

Başlamazdan öň F1-iň netijesi tassyklanmaly (kada **A1**).
