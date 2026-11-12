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
| — | `Modal.initialFocus` yglan edilipdi ýöne **ulanylmaýardy** (hollow prop). Indi hakykatdan fokuslaýar (a11y). | ✅ |
| — | `DataTable.getRowKey` → `useCallback` (exhaustive-deps duýduryşy aýyryldy) | ✅ |
| — | **Warning ratchet**: `npm run lint` = `oxlint src --max-warnings=48`. Täze warning goşulsa CI gyzyl. F6-da 12-ä düşürilýär. | ✅ |

### Test gate F1

```
$ npx oxlint src --max-warnings=48
Found 48 warnings and 0 errors.        ← 61 → 48 (täze faýllar arassalandy)
Finished in 35ms on 86 files with 92 rules using 2 threads.
# 48 warning-iň 36-sy KÖNE sahypalarda (F6-da arassalanýar),
# 12-si bolsa `react/only-export-components` — context/hook faýllary
# üçin standart gurluş (ThemeProvider + useTheme bir faýlda), ŞEÝLE GALÝAR.

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
| oxlint 48 warning (ratchet bilen berkidilen) | 36-sy köne sahypalarda; 12-si kabul edilen `only-export-components` | F6 |
| `/sections` router-de auth guard ýok (**S3**) | ❄️ Backend doňdurylan — rugsat gerek | Bölüm C |
| `capacity` DB-de berk ýerine ýetirilmeýär (**D26**) | ❄️ Backend/schema — UI duýduryş berýär | Bölüm C |

---

## Faza F1 · dowamy — Meýilnama, CD pipeline we täze tapyndy (F37)

**Sene:** 2026-11-12 · **Branch:** `arena/2103c8cd-university-system` · **Base:** `7b8db5a`

Bu ädimde **täze programma kody ýazylmady** (eýäniň görkezmesi: "birbada ählisini
etme, pikirlen, roadmap döret"). Edilen iş: F1-iň netijesini gaýtadan subut etmek,
meýilnamany barlag gurşawynyň çäklendirmeleri bilen doldurmak, CD pipeline goşmak
we täze bir tapyndyny hasaba almak.

### Test gate (F1 kody gaýtadan barlandy)

| Gate | Buýruk | Netije |
|---|---|---|
| Lint | `npm run lint` (`oxlint src --max-warnings=48`) | 🟢 **0 error** / ≤48 warning (ratchet berkidilen) |
| Verify | `npm run verify` (`scripts/verify.mjs`, 6 barlag) | 🟢 **0 error** — F33 dublikat tutulanok (SectionsPage düzedildi) |
| Build | `npm run build` | 🟢 üstünlikli → **60 chunk** |
| Budget | `npm run check:bundle` | 🟢 entry **78.29 kB**/150 · iň uly chunk **375.95 kB**/450 · CSS **72.45 kB**/120 · ilkinji ýük **424.60 kB**/480 |
| **Jemi** | `npm run ci` | 🟢 **ÜSTÜNLIKLI — ähli büjetler çäginde** |

> Gurşaw bellikleri: `node_modules` sandbox-da her ädimde täzeden gurulmaly
> bolýar (`npm ci` → 154 paket, ~7 s). `package-lock.json` üýtgedilmedi.

### Goşulan / täzelenen resminamalar we pipeline

| Zat | Mazmun |
|---|---|
| `docs/AUDIT.md` → **F37** | Production nginx-de `/University_system/v1` üçin `proxy_pass` **ýok**; `VITE_API_URL` build wagtynda `http://localhost:8000/...` default-y bilen bişirilýär → **deploy edilen frontend API-ä ýetip bilmeýär**. Jemi: 159 → **160** tapyndy, Frontend 36 → **37**. |
| `docs/ROADMAP.md` → **Bölüm D** | D1 barlag gurşawynyň çäklendirmesi (MySQL/Redis ýok, `.env.example` boş → backend işledip bolmaýar; haýsy barlag mümkin/ mümkin däl tablisasy) · D2 karar garaşýan 4 teklip (**P1 mock mode**, P2 CD, P3 F37 düzedişi, P4 self-host font) · D3 **eýe üçin 12 maddalyk manual barlag checklisti** · D4 F6 üçin Lighthouse/axe derwezesi |
| `docs/ROADMAP.md` → C5 | F37 Bölüm C (DevOps, ❄️ doňdurylan) sanawyna goşuldy — `Docker/` we `docker-compose.yml` rugsatsyz üýtgedilmeýär (A3) |
| `.github/workflows/release.yml` | **CD pipeline** (P2): `v*.*.*` tag / manual → 1) `preflight` = şol bir A2 test gate (broken build release bolmaýar) · 2) `image` = GHCR-e push (`continue-on-error`, sebäbi Dockerfile doňdurylan) · 3) `release` = commit sanawyndan bellikler + `gh release create` |
| `frontend/package.json` | ✋ **degilmedi** (script-ler eýýäm F0-de goşulan) |
| `frontend/src/**` | ✋ **hiç hili üýtgetme ýok** — bu ädim diňe meýilnama + pipeline |

### CI/CD-yň häzirki gurluşy

```
push / PR (frontend/**)  →  frontend-ci.yml
                              ├ quality        : lint → verify → build → budget   [BLOKLAÝAR]
                              ├ backend-report : compileall + pyflakes            [diňe okaýar, ❄️]
                              └ image          : docker build (push ýok)          [main / manual]

tag v*.*.* / manual      →  release.yml
                              ├ preflight      : npm run ci                       [BLOKLAÝAR]
                              ├ image          : docker build + GHCR push         [continue-on-error ❄️]
                              └ release        : GitHub Release + bellikler
```

Ýerine ýetirilen barlaglar (bu ädimde):
```
python -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"   → OK
  jobs: preflight · image · release   (permissions job derejesinde çäklendirilen)
yaml.safe_load(frontend-ci.yml / summary.yml)                                    → OK (regressiýa ýok)
git status --porcelain app database requirements.txt docker-compose.yml Docker/backend.Dockerfile
                                                                                   → **boş** (A3 ✅)
```

### Galan bellikler

| Zat | Sebäp | Haýsy faza |
|---|---|---|
| `release.yml` sandbox-da **işledilip barlanmady** | Docker ýok; diňe YAML shema + logika barlandy. Hakyky barlag = ilkinji tag | ilkinji `v*` tag |
| **F37** düzedilmedi | ❄️ `Docker/frontend.Dockerfile` + `docker-compose.yml` doňdurylan (A3) → **rugsat gerek** | Bölüm C |
| **P1 mock mode** ýazylmady | Eýäniň kararyna garaşylýar (D2) | F2/F6 üçin peýdaly |
| Eýäniň brauzer barlagy (D3, 12 madda) | Sandbox-da backend işledip bolmaýar (D1) | eýede |

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

F1-iň netijesi **tassyklandy** (`npm run ci` 🟢, 2026-11-12) → kada **A1** boýunça F2-ä geçip bolýar.

F2 başlamazdan öň eýeden **iki karar** garaşylýar (ROADMAP Bölüm D2):
- **P1** mock mode girizilýärmi? (girizilse, F2-niň brauzer barlagy sandbox-da hem mümkin bolýar)
- **P3/F37** nginx proxy düzedişine rugsat barmy? (bolmasa, deploy edilen web API-ä ýetmeýär)
