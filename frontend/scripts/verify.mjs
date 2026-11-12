#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   verify.mjs — statiki öz-özüni barlaýyş (CI gate)
   ───────────────────────────────────────────────────────────────
   Bu skript **hakyky** kemçilikleri awtomatik tutmak üçin ýazyldy.
   Barlaglaryň her biri audit-de tapylyp, soňra elde düzedilen
   konkretny bug-dan gelip çykýar:

     1. i18n açar pokrytiýasy
        → ProfilePage ýazylanda 59 açar ýokdy; diňe göz bilen
          barlap bolmaýar.  (AUDIT F30)

     2. NAV_ITEMS ↔ APP_ROUTES gabatlygy
        → Sidebar-da `/admin/attendance`, `/admin/grades`,
          `/admin/sections` linkleri bardy, route ýokdy → 404.
          (AUDIT F2, F3)

     3. NAV roles ⊆ ROUTE roles
        → Sidebar linki görýän ulanyjy basanda öz dashboard-yna
          zyňylsa, "işlemeýän menýu" bolýar.

     4. Dublikat sahypa faýllary
        → `pages/admin/SectionsPage.jsx` `CohortPage.jsx`-iň
          BIRE-BIR nusgasydy (md5 meňzeş) → "Sections" menýusy
          Cohorts CRUD-y görkezýärdi.  (AUDIT F33)

     5. Lazy import edilýän faýllaryň barlygy
        → `config/routes.jsx`-däki `import('…')` ýoly ýalňyş bolsa
          build geçýär, ýöne sahypa açylanda runtime ýykylýar.

     6. Sahypa faýlyň ady ↔ `export default` komponent ady
        → `SectionsPage.jsx` içinden `export default CohortsPage`
          çykýardy.  (AUDIT F33)

   Ulanylyşy:  node scripts/verify.mjs   (0 = üstünlik, 1 = ýalňyşlyk)
   Baglylyk:   ýok — diňe Node builtins.
   ═══════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const errors = [];
const warnings = [];
const notes = [];

/* ─── Kömekçiler ──────────────────────────────────────────── */

/** `src` astyndaky ähli .js/.jsx faýllar (rekursiw) */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * `{` ... `}` blogyny deňagramlylyk boýunça kesip alýar.
   Setir/block kommentariýalaryny we setirleri sypdyrýar.
 */
function extractBalanced(source, fromIndex) {
  const start = source.indexOf('{', fromIndex);
  if (start < 0) return null;

  let depth = 0;
  let str = null;
  let line = false;
  let block = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];

    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
    if (str) {
      if (c === '\\') { i++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === '/' && n === '/') { line = true; i++; continue; }
    if (c === '/' && n === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { start, end: i, text: source.slice(start, i + 1) }; }
  }
  return null;
}

/** Nested obýekt → `a.b.c` açar ýollary */
function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/* ═══════════════════════════════════════════════════════════
   1. i18n açar pokrytiýasy
   ═══════════════════════════════════════════════════════════ */
function checkI18n() {
  const file = path.join(SRC, 'i18n', 'index.jsx');
  if (!fs.existsSync(file)) { errors.push('i18n: src/i18n/index.jsx tapylmady'); return; }

  const source = fs.readFileSync(file, 'utf8');
  const declIndex = source.indexOf('const dictionary = ');
  if (declIndex < 0) { errors.push('i18n: `const dictionary` tapylmady'); return; }

  const block = extractBalanced(source, declIndex);
  if (!block) { errors.push('i18n: dictionary blogy okalmady'); return; }

  let dictionary;
  try {
    // Skript diňe öz repo-myzyň faýlyny okaýar (JSON-a meňzeş literal)
    dictionary = eval(`(${block.text})`); // eslint-disable-line no-eval
  } catch (err) {
    errors.push(`i18n: dictionary parse edilmedi — ${err.message}`);
    return;
  }

  const locales = Object.keys(dictionary);
  const keys = Object.fromEntries(locales.map((l) => [l, flatten(dictionary[l])]));
  notes.push(`i18n: ${locales.join(', ')} — ${locales.map((l) => `${l} ${keys[l].size} açar`).join(' / ')}`);

  // Diller arasynda deňlik: bir dilde bar, beýlekisinde ýok
  for (const a of locales) {
    for (const b of locales) {
      if (a >= b) continue;
      const onlyA = [...keys[a]].filter((k) => !keys[b].has(k));
      const onlyB = [...keys[b]].filter((k) => !keys[a].has(k));
      if (onlyA.length) errors.push(`i18n: \`${b}\` dilinde ýok (${onlyA.length}): ${onlyA.slice(0, 6).join(', ')}${onlyA.length > 6 ? ' …' : ''}`);
      if (onlyB.length) errors.push(`i18n: \`${a}\` dilinde ýok (${onlyB.length}): ${onlyB.slice(0, 6).join(', ')}${onlyB.length > 6 ? ' …' : ''}`);
    }
  }

  // Kodda ulanylýan açarlar
  const used = new Map();          // key -> Set(file)
  const templates = new Set();     // `nav.${...}` ýaly dinamiki
  const staticRe = /\bt\(\s*(['"])([^'"]+)\1/g;
  const dynRe = /\bt\(\s*`([^`$]*)\$\{/g;

  for (const file2 of walk(SRC)) {
    if (file2 === file) continue;
    const text = fs.readFileSync(file2, 'utf8');
    let m;
    while ((m = staticRe.exec(text))) {
      if (!used.has(m[2])) used.set(m[2], new Set());
      used.get(m[2]).add(rel(file2));
    }
    while ((m = dynRe.exec(text))) templates.add(m[1]);
  }

  let missing = 0;
  for (const [key, where] of used) {
    for (const locale of locales) {
      if (!keys[locale].has(key)) {
        missing++;
        errors.push(`i18n: \`${key}\` açary \`${locale}\` sözlüginde ÝOK  ← ${[...where].slice(0, 3).join(', ')}`);
        break; // bir açar üçin bir ýazgy ýeterlik
      }
    }
  }

  // Dinamik açarlar: iň bolmanda ene topary bar bolmaly
  for (const prefix of templates) {
    const group = prefix.replace(/\.$/, '');
    if (!group) continue;
    for (const locale of locales) {
      const ok = [...keys[locale]].some((k) => k.startsWith(`${group}.`));
      if (!ok) errors.push(`i18n: dinamiki açar \`${prefix}\${…}\` üçin \`${locale}\` dilinde \`(${group}.*)\` topary ýok`);
    }
  }

  const unused = [...keys[locales[0]]].filter((k) => !used.has(k) && !templates.has(`${k}.`) && ![...templates].some((p) => k.startsWith(p.replace(/\.$/, ''))));
  notes.push(`i18n: ulanylýan ${used.size} açar, dinamiki şablon ${templates.size}, ulanylmaýan ~${unused.length}`);
  if (missing === 0) notes.push('i18n: ✓ ähli ulanylýan açarlar iki dilde hem bar');
}

/* ═══════════════════════════════════════════════════════════
   2 + 3. NAV ↔ ROUTE gabatlygy we rol gabatlygy
   ═══════════════════════════════════════════════════════════ */
function parseRoles(raw) {
  if (raw.trim() === 'ROLES') return ['admin', 'dean', 'teacher', 'student'];
  return [...raw.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function checkNavRoutes() {
  const navFile = path.join(SRC, 'config', 'navigation.jsx');
  const routeFile = path.join(SRC, 'config', 'routes.jsx');
  if (!fs.existsSync(navFile) || !fs.existsSync(routeFile)) {
    errors.push('nav/routes: config/navigation.jsx ýa-da config/routes.jsx tapylmady');
    return;
  }

  const nav = fs.readFileSync(navFile, 'utf8');
  const routes = fs.readFileSync(routeFile, 'utf8');

  // NAV_ITEMS — her `{ path: '…' … roles: […] }` bloky
  const navRe = /\{\s*path:\s*'([^']+)',[\s\S]{0,200}?roles:\s*(\[[^\]]*\]|ROLES)/g;
  const navItems = [];
  let m;
  while ((m = navRe.exec(nav))) navItems.push({ path: m[1], roles: parseRoles(m[2]) });

  // APP_ROUTES — `{ path: '…', Component: X, roles: […] }`
  const routesBlockStart = routes.indexOf('export const APP_ROUTES');
  if (routesBlockStart < 0) { errors.push('routes: APP_ROUTES tapylmady'); return; }
  const routeRe = /\{\s*path:\s*'([^']+)',\s*Component:\s*([A-Za-z0-9_$]+),\s*roles:\s*(\[[^\]]*\])\s*\}/g;
  const routeMap = new Map();
  while ((m = routeRe.exec(routes.slice(routesBlockStart)))) {
    routeMap.set(m[1], { component: m[2], roles: parseRoles(m[3]) });
  }

  notes.push(`nav/routes: ${navItems.length} nav elementi, ${routeMap.size} route`);

  if (navItems.length === 0) errors.push('nav: NAV_ITEMS içinden hiç bir path okalmady (format üýtgäpdirmi?)');
  if (routeMap.size === 0) errors.push('routes: APP_ROUTES içinden hiç bir path okalmady (format üýtgäpdirmi?)');

  // (2) Sidebar linki → route barmy?
  for (const item of navItems) {
    if (!routeMap.has(item.path)) {
      errors.push(`nav→route: \`${item.path}\` sidebar-da bar, ýöne APP_ROUTES-de ÝOK → ulanyjy 404 alar`);
      continue;
    }
    // (3) Rol gabatlygy: sidebar-y görýän her rol route-a hem girmeli
    const routeRoles = routeMap.get(item.path).roles;
    const blocked = item.roles.filter((r) => !routeRoles.includes(r));
    if (blocked.length) {
      errors.push(`roles: \`${item.path}\` nav-da [${item.roles.join(',')}] üçin görkezilýär, ýöne route diňe [${routeRoles.join(',')}] rugsat berýär → ${blocked.join(',')} üçin link işlemeýär`);
    }
  }

  // (5) Route bar, ýöne nav-da ýok — diňe duýduryş (ýörite sahypalar bolup biler)
  const navPaths = new Set(navItems.map((i) => i.path));
  const orphan = [...routeMap.keys()].filter((p) => !navPaths.has(p));
  if (orphan.length) warnings.push(`route→nav: ${orphan.length} route nav-da ýok (⌘K palette-de hem görünmez): ${orphan.join(', ')}`);

  // Legacy redirect-ler bar bolsa, olaryň hedefi hakyky route bolmaly
  const legacyStart = routes.indexOf('export const LEGACY_REDIRECTS');
  if (legacyStart >= 0) {
    const legacyRe = /\{\s*from:\s*'([^']+)',\s*to:\s*'([^']+)'\s*\}/g;
    while ((m = legacyRe.exec(routes.slice(legacyStart)))) {
      if (!routeMap.has(m[2]) && !m[2].startsWith('/login')) {
        errors.push(`redirect: \`${m[1]}\` → \`${m[2]}\` hedefi APP_ROUTES-de ýok`);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   4. Dublikat sahypa faýllary
   ═══════════════════════════════════════════════════════════ */
function checkDuplicatePages() {
  const pagesDir = path.join(SRC, 'pages');
  if (!fs.existsSync(pagesDir)) return;

  const byHash = new Map();
  for (const file of walk(pagesDir)) {
    const hash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(rel(file));
  }

  let dupes = 0;
  for (const [, files] of byHash) {
    if (files.length > 1) {
      dupes++;
      errors.push(`dublikat: ${files.join('  ==  ')} — mazmuny BIRE-BIR (copy-paste ýalňyşlygy?)`);
    }
  }
  if (dupes === 0) notes.push('dublikat: ✓ hiç bir sahypa faýly beýlekisiniň nusgasy däl');
}

/* ═══════════════════════════════════════════════════════════
   5. Lazy import edilen faýllar hakykatdan barmy?
      (ýok bolsa build däl, RUNTIME-da "Failed to fetch
       dynamically imported module" bolýar)
   ═══════════════════════════════════════════════════════════ */
function checkDynamicImportsExist() {
  const routeFile = path.join(SRC, 'config', 'routes.jsx');
  if (!fs.existsSync(routeFile)) return;
  const text = fs.readFileSync(routeFile, 'utf8');
  const re = /import\(\s*'([^']+)'\s*\)/g;
  let m;
  let count = 0;
  while ((m = re.exec(text))) {
    count++;
    const target = path.resolve(path.dirname(routeFile), m[1]);
    const candidates = [`${target}.jsx`, `${target}.js`, target, path.join(target, 'index.jsx'), path.join(target, 'index.js')];
    if (!candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile())) {
      errors.push(`lazy import: \`${m[1]}\` faýly tapylmady → sahypa açylanda runtime ýalňyşlygy`);
    }
  }
  notes.push(`lazy import: ${count} dinamiki import barlanyldy`);
}

/* ═══════════════════════════════════════════════════════════
   6. Sahypa faýlyň ady ↔ `export default` komponent ady
      → copy-paste ýalňyşlygyny takyk tutýar.
        Mysal (AUDIT F33): `SectionsPage.jsx` içinden
        `export default CohortsPage` çykýardy — faýl düýbünden
        başga entity-niň nusgasydy.
      Köplük/ýeke-täk tapawudy (`CohortPage` → `CohortsPage`)
      kadalaşdyrylýar, şonuň üçin ýalňyş duýduryş bolmaýar.
   ═══════════════════════════════════════════════════════════ */
function normalizeComponentName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/s(?=page$)/, '');      // sectionspage → sectionpage
}

function checkPageComponentNames() {
  const pagesDir = path.join(SRC, 'pages');
  if (!fs.existsSync(pagesDir)) return;

  let checked = 0;
  for (const file of walk(pagesDir)) {
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/^export default (?:function |const )?([A-Za-z0-9_$]+)/m);
    if (!m) {
      errors.push(`component ady: ${rel(file)} — \`export default\` tapylmady (lazy import üçin hökmany)`);
      continue;
    }
    checked++;

    const fileName = path.basename(file, path.extname(file));
    if (normalizeComponentName(fileName) !== normalizeComponentName(m[1])) {
      errors.push(
        `component ady: ${rel(file)} → \`export default ${m[1]}\` — faýlyň ady bilen gabat gelmeýär (copy-paste ýalňyşlygy?)`,
      );
    }
  }
  notes.push(`component ady: ${checked} sahypa barlanyldy`);
}

/* ─── Ýerine ýetir ────────────────────────────────────────── */
checkI18n();
checkNavRoutes();
checkDuplicatePages();
checkDynamicImportsExist();
checkPageComponentNames();

/* ─── Hasabat ─────────────────────────────────────────────── */
const line = '─'.repeat(66);
console.log(`\n${line}\n  UniSystem frontend — statiki barlag\n${line}`);
notes.forEach((n) => console.log(`  · ${n}`));

if (warnings.length) {
  console.log(`\n  DUÝDURYŞ (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
}

if (errors.length) {
  console.log(`\n  ÝALŇYŞLYK (${errors.length}):`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log(`\n${line}\n  NETIJE: ŞOWSUZ — ${errors.length} ýalňyşlyk\n${line}\n`);
  process.exit(1);
}

console.log(`\n${line}\n  NETIJE: ÜSTÜNLIKLI — 0 ýalňyşlyk, ${warnings.length} duýduryş\n${line}\n`);
process.exit(0);
