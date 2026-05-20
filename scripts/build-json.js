#!/usr/bin/env node
'use strict';

/**
 * build-json.js — Generate dist/patterns.json snapshot.
 *
 * Why: extension popups and other clients that need to fetch the latest
 * patterns at runtime can't execute remote JS (MV3 CSP forbids
 * `unsafe-eval`). They fetch JSON instead. This script serialises the
 * live JS catalog + manifests into a JSON-compatible representation:
 *
 *   - RegExp values become {__regex: [source, flags]} objects
 *   - Function values are dropped (only string-named normalize allowed)
 *
 * Run after every change to catalog / manifests:
 *   npm run build-json
 *
 * Output: dist/patterns.json — commit this; clients fetch it from
 * raw.githubusercontent.com.
 */

const fs   = require('fs');
const path = require('path');

const catalog        = require('../patterns/catalog');
const viewerManifest = require('../patterns/viewer');
const reporterPkg    = require('../patterns/reporter');
const computedPkg    = require('../patterns/computed');
const lib            = require('../patterns/index');

let droppedFunctions = 0;

// JSON.stringify replacer: RegExp → tagged tuple object; functions dropped.
function replacer(key, value) {
  if (value instanceof RegExp) {
    return { __regex: [value.source, value.flags] };
  }
  if (typeof value === 'function') {
    droppedFunctions++;
    return undefined; // omit the field
  }
  return value;
}

const snapshot = {
  version: lib.version,
  synced_at: new Date().toISOString(),
  catalog: catalog,
  viewer_manifest: viewerManifest,
  viewer_a5_manifest: viewerManifest.VIEWER_A5_MANIFEST || [],
  reporter_manifest: reporterPkg.REPORTER_MANIFEST,
  reporter_categories: reporterPkg.CATEGORIES,
  // REPORTER_COMPUTED is now pure render metadata (no compute fns — those
  // live in COMPUTATIONS / patterns/computed.js, which the reporter inlines
  // at build time). Safe to snapshot. computed_meta exposes the id + needs
  // + meta of every computation (the compute fn itself is dropped by
  // replacer; the reporter loads it via inlined patterns/computed.js, not
  // from dist).
  reporter_computed: reporterPkg.REPORTER_COMPUTED,
  computed_meta:     computedPkg.COMPUTATIONS,
};

const distDir = path.resolve(__dirname, '..', 'dist');
const outPath = path.join(distDir, 'patterns.json');
fs.mkdirSync(distDir, { recursive: true });

const json = JSON.stringify(snapshot, replacer, 2);
fs.writeFileSync(outPath, json, 'utf8');

console.log('✓ wrote ' + outPath);
console.log('  size:               ' + (json.length / 1024).toFixed(1) + ' KB');
console.log('  catalog entries:    ' + snapshot.catalog.length);
console.log('  viewer manifest:    ' + snapshot.viewer_manifest.length);
console.log('  viewer A5 manifest: ' + snapshot.viewer_a5_manifest.length);
console.log('  reporter manifest:  ' + snapshot.reporter_manifest.length);
console.log('  reporter computed:  ' + snapshot.reporter_computed.length);
console.log('  computed meta:      ' + snapshot.computed_meta.length);
console.log('  dropped functions:  ' + droppedFunctions + ' (compute fns from COMPUTATIONS — reporter inlines patterns/computed.js at build time)');
console.log('  synced_at:          ' + snapshot.synced_at);
