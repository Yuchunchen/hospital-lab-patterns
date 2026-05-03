'use strict';

/**
 * index.js — Entry point for the hospital-lab-patterns library.
 *
 * Works in three environments without a build step:
 *   - Node (CommonJS)        require('hospital-lab-patterns')
 *   - Chrome MV3 extension   include each patterns/*.js as a separate
 *                            <script> in popup.html (NOT this file)
 *   - Standalone browser     <script src="patterns/index.js"></script>
 *                            then read window.HospitalLabPatterns
 */

let viewer, reporterPkg, computed;

if (typeof require === 'function') {
  viewer       = require('./viewer');
  reporterPkg  = require('./reporter');
  computed     = require('./computed');
} else if (typeof window !== 'undefined') {
  viewer       = window.HOSPITAL_LAB_PATTERNS_VIEWER       || [];
  reporterPkg  = window.HOSPITAL_LAB_PATTERNS_REPORTER     || { CATEGORIES:[], REPORTER_CATALOG:[], REPORTER_COMPUTED:[] };
  computed     = window.HOSPITAL_LAB_PATTERNS_COMPUTED     || { COMPUTATIONS:[], HELPERS:{} };
}

const reporter = reporterPkg.REPORTER_CATALOG;

// ─── Helpers ─────────────────────────────────────────────────────────────
function byId(id, scope) {
  const cat = scope === 'reporter' ? reporter : viewer;
  return cat.find(t => t.id === id) || null;
}

// Merged view: viewer wins on id conflict (it has richer display fields)
const merged = (() => {
  const m = new Map();
  reporter.forEach(t => m.set(t.id, t));
  viewer.forEach(t => m.set(t.id, t));
  return Array.from(m.values());
})();

function filterByHospital(catalog, hospital /* 'tt' | 'yl' */) {
  return catalog.filter(t => !t.hospitalScope || t.hospitalScope === hospital);
}

const exported = {
  // Catalogs
  viewer,
  reporter,
  reporterCategories: reporterPkg.CATEGORIES,
  reporterComputed:   reporterPkg.REPORTER_COMPUTED,
  computed:           computed.COMPUTATIONS,
  computedHelpers:    computed.HELPERS,

  // Merged
  merged,

  // Helpers
  byId,
  filterByHospital,

  // Version (bump on every change)
  version: '0.1.0',
};

// ─── Exports ─────────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = exported;
}
if (typeof window !== 'undefined') {
  window.HospitalLabPatterns = exported;
}
