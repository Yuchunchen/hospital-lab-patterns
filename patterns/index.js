'use strict';

/**
 * index.js — Entry point for the hospital-lab-patterns library.
 *
 * Architecture (v0.2):
 *   - catalog.js  — master list of every test we know how to detect
 *   - viewer.js   — viewer manifest (ids + page/col/section overrides)
 *   - reporter.js — reporter manifest (ids + cat/label overrides)
 *   - computed.js — derived-value formulas
 */

let catalog, viewerManifest, reporterPkg, computed;

if (typeof require === 'function') {
  catalog        = require('./catalog');
  viewerManifest = require('./viewer');
  reporterPkg    = require('./reporter');
  computed       = require('./computed');
} else if (typeof window !== 'undefined') {
  catalog        = window.HOSPITAL_LAB_PATTERNS_CATALOG          || [];
  viewerManifest = window.HOSPITAL_LAB_PATTERNS_VIEWER_MANIFEST  || [];
  reporterPkg    = window.HOSPITAL_LAB_PATTERNS_REPORTER_PKG     ||
                   { CATEGORIES:[], REPORTER_MANIFEST:[], REPORTER_COMPUTED:[] };
  computed       = window.HOSPITAL_LAB_PATTERNS_COMPUTED         ||
                   { COMPUTATIONS:[], HELPERS:{} };
}

// Resolve a manifest entry against the catalog by id; manifest fields
// override catalog fields. Returns merged entries; warns on unknown ids.
function resolveManifest(manifest, cat) {
  var byId = new Map(cat.map(function (e) { return [e.id, e]; }));
  var out = [];
  manifest.forEach(function (m) {
    var id = typeof m === 'string' ? m : m.id;
    var base = byId.get(id);
    if (!base) {
      var msg = '[hospital-lab-patterns] manifest references unknown id: "' + id + '"';
      if (typeof console !== 'undefined') console.warn(msg);
      return;
    }
    out.push(typeof m === 'string'
      ? Object.assign({}, base)
      : Object.assign({}, base, m));
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
  computed:           computed.COMPUTATIONS,
  computedHelpers:    computed.HELPERS,
  byId: byId,
  filterByHospital: filterByHospital,
  resolveManifest: resolveManifest,
  trackOnlyIds: trackOnlyIds,
  version: '0.2.0',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exported;
}
if (typeof window !== 'undefined') {
  window.HospitalLabPatterns = exported;
}
