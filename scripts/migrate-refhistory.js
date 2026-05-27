#!/usr/bin/env node
'use strict';

/**
 * migrate-refhistory.js — ONE-SHOT codemod for TASK_BRIEF_ref_range_machine_time_dim.
 *
 * Adds a `refHistory` migration-start entry to each in-scope catalog entry:
 *   refHistory: [{ machine:'*', refLo:<既有 lo>, refHi:<既有 hi>,
 *                  validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }]
 *
 * SEED SOURCE = the entry's `lo` / `hi` (the CURRENT alarm thresholds the
 * viewer/reporter colouring already uses), NOT refLo/refHi (textbook ref).
 * YC 2026-05-28 拍板:zero-regression — refHistory '*' base must reproduce
 * today's exact 黃紅綠 thresholds; 9 entries diverge (GOT/GPT/RGT/TBIL/DBIL/
 * HbA1c/BUN/CREAT/UA) and lo/hi are the deliberate alarm values there.
 * refLo/refHi stay as the export/display ref, untouched.
 *
 * In-scope = 51 ids (§1.1 minus BUN_pre / BUN_post, which inherit BUN per §1.1
 * special-case / §6.11 / §10 T5 — they get NO own refHistory).
 *
 * Strategy (surgical, preserves all comments/formatting — coding rule A):
 *   - Isolate each entry by brace depth (handles Aluminum's nested `subpage`).
 *   - Insert refHistory uniformly as the entry's LAST field, just before the
 *     closing ` },`.
 *   - lo/hi read verbatim from the entry text (`\blo:` / `\bhi:`, which never
 *     match refLo/refHi/loM/hiM/…); entries with none get null/null.
 *
 * Idempotent: skips any entry that already has a `refHistory:` line.
 * Reads refLo/refHi as VERBATIM source literals (preserves 4.0 vs 4).
 *
 * Run once:  node scripts/migrate-refhistory.js
 */

const fs   = require('fs');
const path = require('path');

const CATALOG_PATH = path.resolve(__dirname, '..', 'patterns', 'catalog.js');

const IN_SCOPE = new Set([
  // CBC
  'WBC', 'RBC', 'Hb', 'HCT', 'MCV', 'Platelet',
  // proteins
  'TP', 'Albumin',
  // liver
  'GOT', 'GPT', 'RGT', 'ALP', 'TBIL', 'DBIL',
  // lipids
  'CHOL', 'HDLC', 'LDL', 'TG',
  // glucose
  'GluAC', 'HbA1c',
  // renal (non-computed; BUN_pre/BUN_post inherit BUN → excluded)
  'BUN', 'CREAT', 'UA',
  // electrolytes
  'Na', 'K', 'Cl', 'Ca', 'FreeCa', 'P', 'Mg',
  // iron
  'Fe', 'TIBC', 'TSAT', 'Ferritin',
  // parathyroid + vitamins
  'iPTH', 'VitB12', 'FolicAcid',
  // trace metals
  'Aluminum',
  // tumor markers
  'AFP', 'CEA', 'CA199', 'PSA', 'FreePSA', 'CA125',
  // thyroid
  'TSH', 'FreeT4',
  // hepatitis titers
  'HBsAgTiter', 'AntiHBsTiter', 'AntiHCVTiter',
  // HIV quantitative
  'HIVLoad', 'CD4',
]);

const SOURCE = "migration 起點 — universal ref 既有值";

function countBraces(line) {
  // crude brace counter — good enough here because catalog string literals
  // and regexes in in-scope entries do not contain unbalanced { } chars.
  let net = 0;
  for (const ch of line) {
    if (ch === '{') net++;
    else if (ch === '}') net--;
  }
  return net;
}

function refHistoryField(refLo, refHi) {
  // No trailing punctuation — the caller appends `,` / ` },` as needed.
  return "    refHistory: [{ machine:'*', refLo:" + refLo + ", refHi:" + refHi +
         ", validFrom:'1900-01-01', source:'" + SOURCE + "' }]";
}

const src = fs.readFileSync(CATALOG_PATH, 'utf8');
const lines = src.split('\n');
const out = [];

let i = 0;
let migrated = 0;
let skipped = 0;
const touched = [];

while (i < lines.length) {
  const line = lines[i];
  const m = line.match(/^\s*\{\s*id:'([^']+)'/);

  if (!m || !IN_SCOPE.has(m[1])) {
    out.push(line);
    i++;
    continue;
  }

  // ── Collect the full entry by brace depth ──────────────────────────────
  const id = m[1];
  const entry = [];
  let depth = 0;
  let j = i;
  do {
    depth += countBraces(lines[j]);
    entry.push(lines[j]);
    j++;
  } while (depth > 0 && j < lines.length);

  // Idempotency guard.
  if (entry.some(l => /^\s*refHistory\s*:/.test(l))) {
    out.push(...entry);
    skipped++;
    i = j;
    continue;
  }

  // Read lo/hi verbatim from the entry text (the current alarm thresholds).
  // `\blo:` / `\bhi:` never match refLo/refHi (capital Hi) or loM/hiM/loF/hiF
  // (no `:` right after). Entries with no lo/hi field → null/null.
  const body = entry.join('\n');
  const loM = body.match(/\blo:\s*([^,}\s]+)/);
  const hiM = body.match(/\bhi:\s*([^,}\s]+)/);
  const refLo = loM ? loM[1] : 'null';
  const refHi = hiM ? hiM[1] : 'null';

  // Insert as the LAST field, before the entry's closing ` },`. Turn
  // `<lastfield> },` into `<lastfield>,\n    refHistory: [...] },`.
  const last = entry.length - 1;
  const closeMatch = entry[last].match(/^(.*\S)\s*\},\s*$/);
  if (!closeMatch) throw new Error('[migrate] ' + id + ': unexpected closing line: ' + entry[last]);
  entry[last] = closeMatch[1] + ',\n' + refHistoryField(refLo, refHi) + ' },';

  out.push(...entry);
  migrated++;
  touched.push(id);
  i = j;
}

fs.writeFileSync(CATALOG_PATH, out.join('\n'), 'utf8');

console.log('✓ refHistory migration complete');
console.log('  migrated: ' + migrated + ' entries');
console.log('  skipped (already had refHistory): ' + skipped);
console.log('  ids: ' + touched.join(', '));

const expected = IN_SCOPE.size;
if (migrated + skipped !== expected) {
  console.error('✖ expected ' + expected + ' in-scope entries, but only saw ' +
    (migrated + skipped) + '. Check for missing ids:');
  const seen = new Set(touched);
  for (const id of IN_SCOPE) if (!seen.has(id)) console.error('    missing: ' + id);
  process.exitCode = 1;
}
