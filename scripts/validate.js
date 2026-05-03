#!/usr/bin/env node
'use strict';

/**
 * validate.js — Sanity check for the pattern catalogs.
 *
 *   - Every pattern entry has a unique id within its catalog.
 *   - Every regex compiles (this happens at require-time).
 *   - Every entry conforms to the schema in patterns/schema.js.
 *   - Reports overlapping ids between viewer + reporter (informational).
 *
 * Exits non-zero on any error. Run via: npm run validate
 */

const path   = require('path');
const schema = require('../patterns/schema');
const viewer       = require('../patterns/viewer');
const reporterPkg  = require('../patterns/reporter');
const computed     = require('../patterns/computed');

let problems = 0;

function header(msg) {
  console.log('\n── ' + msg + ' ' + '─'.repeat(Math.max(0, 60 - msg.length)));
}

function fail(msg) {
  console.error('  ✖ ' + msg);
  problems++;
}

function ok(msg) {
  console.log('  ✓ ' + msg);
}

// ─── Catalog: viewer ─────────────────────────────────────────────────────
header('viewer catalog (' + viewer.length + ' entries)');
{
  const { errors, duplicates } = schema.validateCatalog(viewer, 'viewer');
  errors.forEach(fail);
  if (duplicates.length) fail('duplicate ids: ' + duplicates.join(', '));
  if (!errors.length && !duplicates.length) ok('no errors, no duplicate ids');
}

// ─── Catalog: reporter ───────────────────────────────────────────────────
header('reporter catalog (' + reporterPkg.REPORTER_CATALOG.length + ' entries)');
{
  const { errors, duplicates } = schema.validateCatalog(reporterPkg.REPORTER_CATALOG, 'reporter');
  errors.forEach(fail);
  if (duplicates.length) fail('duplicate ids: ' + duplicates.join(', '));
  if (!errors.length && !duplicates.length) ok('no errors, no duplicate ids');
}

// ─── Computed: every entry has a callable compute function ───────────────
header('computed catalog (' + computed.COMPUTATIONS.length + ' entries)');
{
  let bad = 0;
  computed.COMPUTATIONS.forEach(c => {
    if (typeof c.compute !== 'function') { fail(c.id + ': compute is not a function'); bad++; }
    if (!Array.isArray(c.needs))         { fail(c.id + ': needs is not an array');     bad++; }
  });
  if (!bad) ok('all computations have function + needs');
}

// ─── Cross-catalog: id overlap (informational) ───────────────────────────
header('id overlap viewer ↔ reporter');
{
  const viewerIds   = new Set(viewer.map(t => t.id));
  const reporterIds = new Set(reporterPkg.REPORTER_CATALOG.map(t => t.id));
  const overlap = [...viewerIds].filter(id => reporterIds.has(id));
  console.log('  ' + overlap.length + ' shared ids (same id, may differ in fields):');
  overlap.forEach(id => console.log('    · ' + id));

  // Find ids that look related (case-insensitive) but written differently
  const lower = new Map();
  viewerIds.forEach(id => lower.set(id.toLowerCase(), { v: id }));
  reporterIds.forEach(id => {
    const k = id.toLowerCase();
    const cur = lower.get(k) || {};
    cur.r = id;
    lower.set(k, cur);
  });
  const caseOnly = [...lower.values()].filter(x => x.v && x.r && x.v !== x.r);
  if (caseOnly.length) {
    console.log('  case-only id mismatches (suggest unifying):');
    caseOnly.forEach(x => console.log('    · ' + x.v + '  ↔  ' + x.r));
  }
}

// ─── Smoke test: the merged view loads ───────────────────────────────────
header('smoke test: index.js merged view');
try {
  const idx = require('../patterns/index.js');
  ok('merged catalog has ' + idx.merged.length + ' entries');
  ok('byId(WBC) → ' + (idx.byId('WBC') ? idx.byId('WBC').displayName || idx.byId('WBC').label : 'NOT FOUND'));
} catch (e) {
  fail('index.js failed to load: ' + e.message);
}

// ─── Summary ─────────────────────────────────────────────────────────────
console.log('');
if (problems === 0) {
  console.log('✅  validate: all checks passed');
  process.exit(0);
} else {
  console.error('❌  validate: ' + problems + ' problem(s) found');
  process.exit(1);
}
