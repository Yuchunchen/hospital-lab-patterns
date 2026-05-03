#!/usr/bin/env node
'use strict';

/**
 * validate.js — Sanity check the catalog + manifests + computed registry.
 *
 *   - catalog.js: every entry has unique id; every regex compiles; any
 *     `normalize` that is a string references a known normalizer.
 *   - viewer.js / reporter.js: every manifest id exists in catalog
 *   - computed.js: every entry has callable function + needs[]
 *   - reports "track-only" catalog ids
 *
 * Run via: npm run validate
 */

const path   = require('path');
const schema = require('../patterns/schema');
const catalog = require('../patterns/catalog');
const viewerManifest = require('../patterns/viewer');
const reporterPkg    = require('../patterns/reporter');
const normalizers    = require('../patterns/normalizers');
const computed       = require('../patterns/computed');
const lib            = require('../patterns/index');

let problems = 0;
function header(msg) { console.log('\n── ' + msg + ' ' + '─'.repeat(Math.max(0, 60 - msg.length))); }
function fail(msg)   { console.error('  ✖ ' + msg); problems++; }
function ok(msg)     { console.log('  ✓ ' + msg); }

const ctx = { normalizers };

// Catalog
header('catalog (' + catalog.length + ' entries)');
{
  const { errors, duplicates } = schema.validateCatalog(catalog, 'catalog', ctx);
  errors.forEach(fail);
  if (duplicates.length) fail('duplicate ids: ' + duplicates.join(', '));
  if (!errors.length && !duplicates.length) ok('no errors, no duplicate ids, all normalizer refs resolve');
}

// Manifest sanity
function checkManifest(manifest, label) {
  header(label + ' manifest (' + manifest.length + ' entries)');
  const catIds = new Set(catalog.map(e => e.id));
  const seen = new Set();
  let bad = 0;
  manifest.forEach((m, i) => {
    const id = typeof m === 'string' ? m : m.id;
    if (!id) { fail(label + '[' + i + ']: missing id'); bad++; return; }
    if (!catIds.has(id)) { fail(label + '[' + i + ']: id "' + id + '" not in catalog'); bad++; }
    if (seen.has(id))   { fail(label + ': duplicate manifest entry "' + id + '"'); bad++; }
    seen.add(id);
  });
  if (!bad) ok('all ' + manifest.length + ' ids resolve to catalog entries; no duplicates');
}
checkManifest(viewerManifest, 'viewer');
checkManifest(reporterPkg.REPORTER_MANIFEST, 'reporter');

// Normalizers
header('normalizers (' + Object.keys(normalizers).length + ' defined)');
ok('names: ' + Object.keys(normalizers).join(', '));

// Computed
header('computed (' + computed.COMPUTATIONS.length + ' entries)');
{
  let bad = 0;
  computed.COMPUTATIONS.forEach(c => {
    if (typeof c.compute !== 'function') { fail(c.id + ': compute is not a function'); bad++; }
    if (!Array.isArray(c.needs))         { fail(c.id + ': needs is not an array');     bad++; }
  });
  if (!bad) ok('all computations have function + needs');
}

// Resolved arrays (with rehydrated normalizers)
header('resolved arrays');
ok('viewer.length = '   + lib.viewer.length);
ok('reporter.length = ' + lib.reporter.length);
const wbcViewer = lib.byId('WBC');
ok('viewer WBC.normalize is fn: ' + (typeof wbcViewer.normalize === 'function'));
ok('viewer WBC.normalize(6700): ' + (wbcViewer.normalize ? wbcViewer.normalize(6700) : 'n/a'));

// Track-only
header('track-only catalog ids');
const trackOnly = lib.trackOnlyIds();
if (trackOnly.length === 0) console.log('  (none)');
else { console.log('  ' + trackOnly.length + ' not referenced by any manifest:'); trackOnly.forEach(id => console.log('    · ' + id)); }

// Summary
console.log('');
if (problems === 0) {
  console.log('✅  validate: all checks passed');
  process.exit(0);
} else {
  console.error('❌  validate: ' + problems + ' problem(s) found');
  process.exit(1);
}
