#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   check-bundle.mjs — build ölçeg büjeti (CI gate)
   ───────────────────────────────────────────────────────────────
   Sebäp (AUDIT F1/F28): proýektde bir gezek **996 kB** ýeke
   `index.js` bardy — ilkinji açylyşda hemmesi ýüklenýärdi.
   Code splitting girizilenden soň entry 79 kB boldy. Bu skript
   şol gazanylan ýagdaýyň yza gaýtmazlygyny kepillendirýär.

   `npm run build`-dan SOŇ işledilýär (`dist/` gerek).

   Büjetler gzip-siz, diskdäki ölçeg boýunça:
     • entry (index-*.js)         ≤ 150 kB
     • islendik bir chunk         ≤ 450 kB   (vendor-qr = html5-qrcode)
     • ähli CSS                   ≤ 120 kB
     • ILKINJI ÝÜK (entry+css+react+router+http)  ≤ 480 kB
   ═══════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'dist', 'assets');

if (!fs.existsSync(ASSETS)) {
  console.error('\n  ✗ dist/assets tapylmady — ilki `npm run build` işlediň.\n');
  process.exit(1);
}

const BUDGET = {
  entry: 150 * 1024,
  chunk: 450 * 1024,
  cssTotal: 120 * 1024,
  initialLoad: 480 * 1024,
};

const files = fs.readdirSync(ASSETS).map((name) => ({
  name,
  size: fs.statSync(path.join(ASSETS, name)).size,
}));

const js = files.filter((f) => f.name.endsWith('.js'));
const css = files.filter((f) => f.name.endsWith('.css'));

const entry = js.find((f) => /^index-.*\.js$/.test(f.name));
const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
const failures = [];

/* Ilkinji ýük: entry + CSS + sinhron ýüklenýän vendor chunk-lar.
   `vendor-qr`, `vendor-firebase` we sahypa chunk-lary LAZY —
   olar diňe degişli sahypa açylanda ýüklenýär. */
const isLazy = (name) =>
  /^vendor-(qr|firebase|icons)-/.test(name) || /^[A-Z][A-Za-z0-9]*-/.test(name);

const initial = [entry, ...css, ...js.filter((f) => f !== entry && !isLazy(f.name))]
  .filter(Boolean)
  .reduce((a, f) => a + f.size, 0);

const line = '─'.repeat(72);
console.log(`\n${line}\n  Bundle ölçeg büjeti\n${line}`);
console.log(`  ${'CHUNK'.padEnd(42)}${'ÖLÇEG'.padStart(11)}   ÝÜK`);
console.log(`  ${'─'.repeat(42)}${'─'.repeat(11)}   ${'─'.repeat(6)}`);

for (const f of [...js, ...css].sort((a, b) => b.size - a.size)) {
  const lazy = f.name.endsWith('.css') ? false : isLazy(f.name);
  console.log(`  ${f.name.padEnd(42)}${kb(f.size).padStart(11)}   ${lazy ? 'lazy' : 'initial'}`);
}

console.log(`\n  ${'Jemi chunk sany'.padEnd(42)}${String(js.length + css.length).padStart(11)}`);
console.log(`  ${'Jemi ölçeg'.padEnd(42)}${kb(js.reduce((a, f) => a + f.size, 0) + css.reduce((a, f) => a + f.size, 0)).padStart(11)}`);

/* ── Barlaglar ─────────────────────────────────────────────── */
if (!entry) failures.push('entry chunk (index-*.js) tapylmady');
else if (entry.size > BUDGET.entry) {
  failures.push(`entry ${kb(entry.size)} > büjet ${kb(BUDGET.entry)}`);
}

for (const f of js) {
  if (f.size > BUDGET.chunk) failures.push(`chunk \`${f.name}\` ${kb(f.size)} > büjet ${kb(BUDGET.chunk)}`);
}

const cssTotal = css.reduce((a, f) => a + f.size, 0);
if (cssTotal > BUDGET.cssTotal) failures.push(`CSS jemi ${kb(cssTotal)} > büjet ${kb(BUDGET.cssTotal)}`);

if (initial > BUDGET.initialLoad) {
  failures.push(`ILKINJI ÝÜK ${kb(initial)} > büjet ${kb(BUDGET.initialLoad)}`);
}

console.log(`\n  BÜJET BARLAGY:`);
console.log(`    entry         ${entry ? kb(entry.size) : '—'} / ${kb(BUDGET.entry)}   ${entry && entry.size <= BUDGET.entry ? '✓' : '✗'}`);
console.log(`    iň uly chunk  ${js.length ? kb(Math.max(...js.map((f) => f.size))) : '—'} / ${kb(BUDGET.chunk)}   ${js.every((f) => f.size <= BUDGET.chunk) ? '✓' : '✗'}`);
console.log(`    CSS jemi      ${kb(cssTotal)} / ${kb(BUDGET.cssTotal)}   ${cssTotal <= BUDGET.cssTotal ? '✓' : '✗'}`);
console.log(`    ilkinji ýük   ${kb(initial)} / ${kb(BUDGET.initialLoad)}   ${initial <= BUDGET.initialLoad ? '✓' : '✗'}`);

if (failures.length) {
  console.log(`\n${line}\n  NETIJE: ŞOWSUZ`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  console.log(`${line}\n`);
  process.exit(1);
}

console.log(`\n${line}\n  NETIJE: ÜSTÜNLIKLI — ähli büjetler çäginde\n${line}\n`);
process.exit(0);
