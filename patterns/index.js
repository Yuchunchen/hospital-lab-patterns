'use strict';

/**
 * index.js — Entry point for the hospital-lab-patterns library.
 *
 * Architecture (v0.2):
 *   - catalog.js      — master list of every test (universal fields only)
 *   - viewer.js       — viewer manifest (ids + page/col/section overrides)
 *   - reporter.js     — reporter manifest (ids + cat/label overrides)
 *   - normalizers.js  — named value-transform functions referenced by id
 *   - computed.js     — derived-value formulas
 */

let catalog, viewerManifest, reporterPkg, normalizers, computed;

if (typeof require === 'function') {
  catalog        = require('./catalog');
  viewerManifest = require('./viewer');
  reporterPkg    = require('./reporter');
  normalizers    = require('./normalizers');
  computed       = require('./computed');
} else if (typeof window !== 'undefined') {
  catalog        = window.HOSPITAL_LAB_PATTERNS_CATALOG          || [];
  viewerManifest = window.HOSPITAL_LAB_PATTERNS_VIEWER_MANIFEST  || [];
  reporterPkg    = window.HOSPITAL_LAB_PATTERNS_REPORTER_PKG     ||
                   { CATEGORIES:[], REPORTER_MANIFEST:[], REPORTER_COMPUTED:[] };
  normalizers    = window.HOSPITAL_LAB_PATTERNS_NORMALIZERS      || {};
  computed       = window.HOSPITAL_LAB_PATTERNS_COMPUTED         ||
                   { COMPUTATIONS:[], HELPERS:{} };
}

// If `normalize` is a string name, replace it with the actual function.
function rehydrateNormalize(entry) {
  if (typeof entry.normalize === 'string') {
    var fn = normalizers[entry.normalize];
    if (typeof fn === 'function') {
      entry.normalize = fn;
    } else {
      if (typeof console !== 'undefined') {
        console.warn('[hospital-lab-patterns] unknown normalizer "' + entry.normalize + '" referenced by ' + entry.id);
      }
      delete entry.normalize;
    }
  }
  return entry;
}

// Resolve a manifest entry against the catalog by id; manifest fields
// override catalog fields. Returns merged entries with rehydrated normalizers.
function resolveManifest(manifest, cat) {
  var byId = new Map(cat.map(function (e) { return [e.id, e]; }));
  var out = [];
  manifest.forEach(function (m) {
    var id = typeof m === 'string' ? m : m.id;
    var base = byId.get(id);
    if (!base) {
      if (typeof console !== 'undefined') {
        console.warn('[hospital-lab-patterns] manifest references unknown id: "' + id + '"');
      }
      return;
    }
    var merged = typeof m === 'string'
      ? Object.assign({}, base)
      : Object.assign({}, base, m);
    rehydrateNormalize(merged);
    out.push(merged);
  });
  return out;
}

var viewer   = resolveManifest(viewerManifest, catalog);
var reporter = resolveManifest(reporterPkg.REPORTER_MANIFEST, catalog);

function byId(id, scope) {
  if (scope === 'catalog')  return catalog.find(function (t) { return t.id === id; }) || null;
  if (scope === 'reporter') return reporter.find(function (t) { return t.id === id; }) || null;
  return viewer.find(function (t) { return t.id === id; }) || null;
}

function filterByHospital(cat, hospital) {
  return cat.filter(function (t) { return !t.hospitalScope || t.hospitalScope === hospital; });
}

function trackOnlyIds() {
  var inUse = new Set();
  viewerManifest.forEach(function (m) { inUse.add(typeof m === 'string' ? m : m.id); });
  reporterPkg.REPORTER_MANIFEST.forEach(function (m) { inUse.add(typeof m === 'string' ? m : m.id); });
  return catalog.filter(function (e) { return !inUse.has(e.id); }).map(function (e) { return e.id; });
}

var exported = {
  catalog: catalog,
  viewer: viewer,
  reporter: reporter,
  reporterCategories: reporterPkg.CATEGORIES,
  reporterComputed:   reporterPkg.REPORTER_COMPUTED,
  normalizers:        normalizers,
  computed:           computed.COMPUTATIONS,
  computedHelpers:    computed.HELPERS,
  byId: byId,
  filterByHospital: filterByHospital,
  resolveManifest: resolveManifest,
  rehydrateNormalize: rehydrateNormalize,
  trackOnlyIds: trackOnlyIds,
  version: '0.3.0',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exported;
}
if (typeof window !== 'undefined') {
  window.HospitalLabPatterns = exported;
}
