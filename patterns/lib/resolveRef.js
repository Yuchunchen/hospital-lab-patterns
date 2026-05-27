'use strict';

/**
 * resolveRef.js — shared machine × time × gender reference-range resolver.
 *
 * Given a test id + the current machine + the value's report date + patient
 * gender + the LIVE catalog, returns the reference range to use for the
 * normal/abnormal (黃紅綠) decision:
 *
 *   resolveRef(testId, machineSource, reportDate, patientGender, catalogList)
 *     → { refLo: number|null, refHi: number|null }
 *
 * Algorithm (TASK_BRIEF_ref_range_machine_time_dim §2.2):
 *   1. Find entry by testId in catalogList.
 *   2. No refHistory → fallback chain:
 *        a. BUN_pre / BUN_post → use BUN's refHistory (inherits, §1.1 special).
 *        b. else → outer refLo/refHi (+ outer loM/hiM/loF/hiF for gender).
 *   3. Has refHistory:
 *        a. candidates = machine ∈ [machineSource, '*'] AND validFrom <= date
 *        b. sort: machine-specific beats '*'; same machine → latest validFrom
 *        c. take first = base
 *        d. gender override (3 layers): inline refLoM/.. → outer loM/.. → base
 *   4. candidates empty → fallback chain (step 2).
 *   reportDate missing/unparseable → use today + console.warn once per testId.
 *
 * Date handling: reportDate may arrive as ROC "115/04/14", Gregorian
 * "20260414203800", ISO "2026-04-14", or a Date — all normalised to Western
 * "YYYY-MM-DD" before comparing against validFrom (which is always ISO). This
 * is the §11.3 risk guard: comparing a raw ROC string against an ISO validFrom
 * would sort wrong every time.
 *
 * Packaging: this is CODE, not data — it cannot ride dist/patterns.json
 * (build-json drops functions). sync-patterns.js bundles it into viewer
 * mapping.js and reporter's patterns block. It is wrapped in an IIFE so its
 * helpers never collide with names in the concatenated classic-script scope
 * (CATALOG / TEST_MAP / _resolveManifest / NORMALIZERS …); `var resolveRef`
 * is redeclaration-safe even if a bundle ever includes it twice.
 *
 * It takes the catalog as an argument (not a global) so the viewer can pass
 * its LIVE window.TEST_MAP (post dist-swap) and so the BUN_pre→BUN fallback
 * can look up a sibling entry.
 */

var resolveRef = (function () {
  var warned = {}; // testId → true; throttles the missing-date warning

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  // Normalise any supported report-date form to Western "YYYY-MM-DD".
  // Returns null when the input is empty / unrecognised (caller falls to today).
  function normalizeRefDate(d) {
    if (d == null || d === '') return null;

    if (d instanceof Date && !isNaN(d.getTime())) {
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    var s = String(d).trim();
    if (!s) return null;

    // ISO "YYYY-MM-DD..." → take the date head.
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];

    // Slash form: ROC "115/04/14" (3-digit yr) or Western "2026/04/14".
    var slash = s.match(/^(\d{1,4})\/(\d{1,2})\/(\d{1,2})/);
    if (slash) {
      var y = parseInt(slash[1], 10);
      if (y < 1911) y += 1911; // ROC → Western (4-digit Western years pass through)
      return y + '-' + pad2(parseInt(slash[2], 10)) + '-' + pad2(parseInt(slash[3], 10));
    }

    // Gregorian compact "YYYYMMDD" (+ optional HHMMSS), e.g. RESDTTM.
    var compact = s.match(/^(\d{4})(\d{2})(\d{2})/);
    if (compact) return compact[1] + '-' + compact[2] + '-' + compact[3];

    return null;
  }

  function findById(cat, id) {
    if (!cat) return null;
    for (var i = 0; i < cat.length; i++) {
      if (cat[i] && cat[i].id === id) return cat[i];
    }
    return null;
  }

  function pick(primary, fallback) {
    return primary != null ? primary : (fallback != null ? fallback : null);
  }

  // No-refHistory / no-candidate fallback: outer refLo/refHi + outer gender.
  function outerFallback(entry, gender) {
    var rLo = entry.refLo != null ? entry.refLo : null;
    var rHi = entry.refHi != null ? entry.refHi : null;
    if (gender === 'M' && (entry.loM != null || entry.hiM != null)) {
      return { refLo: pick(entry.loM, rLo), refHi: pick(entry.hiM, rHi) };
    }
    if (gender === 'F' && (entry.loF != null || entry.hiF != null)) {
      return { refLo: pick(entry.loF, rLo), refHi: pick(entry.hiF, rHi) };
    }
    return { refLo: rLo, refHi: rHi };
  }

  // Resolve gender against a chosen refHistory base item (3-layer chain).
  function resolveGender(base, entry, gender) {
    var rLo = base.refLo != null ? base.refLo : null;
    var rHi = base.refHi != null ? base.refHi : null;
    if (gender === 'M') {
      if (base.refLoM != null || base.refHiM != null) {
        return { refLo: pick(base.refLoM, rLo), refHi: pick(base.refHiM, rHi) };
      }
      if (entry.loM != null || entry.hiM != null) {
        return { refLo: pick(entry.loM, rLo), refHi: pick(entry.hiM, rHi) };
      }
    } else if (gender === 'F') {
      if (base.refLoF != null || base.refHiF != null) {
        return { refLo: pick(base.refLoF, rLo), refHi: pick(base.refHiF, rHi) };
      }
      if (entry.loF != null || entry.hiF != null) {
        return { refLo: pick(entry.loF, rLo), refHi: pick(entry.hiF, rHi) };
      }
    }
    return { refLo: rLo, refHi: rHi };
  }

  // ownerEntry supplies the outer gender fallback; rh is the refHistory list
  // to resolve against (BUN's list when resolving BUN_pre / BUN_post).
  function resolveFromHistory(ownerEntry, rh, machineSource, date, gender) {
    var cands = [];
    for (var i = 0; i < rh.length; i++) {
      var h = rh[i];
      if ((h.machine === machineSource || h.machine === '*') && h.validFrom <= date) {
        cands.push(h);
      }
    }
    if (!cands.length) return outerFallback(ownerEntry, gender);

    cands.sort(function (a, b) {
      var aSpec = a.machine === '*' ? 0 : 1;
      var bSpec = b.machine === '*' ? 0 : 1;
      if (aSpec !== bSpec) return bSpec - aSpec;            // machine-specific first
      if (a.validFrom !== b.validFrom) return a.validFrom < b.validFrom ? 1 : -1; // latest first
      return 0;
    });

    return resolveGender(cands[0], ownerEntry, gender);
  }

  function warnOnce(testId) {
    if (warned[testId]) return;
    warned[testId] = true;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[resolveRef] missing/unparseable reportDate for "' + testId +
        '" — falling back to today (newest ref).');
    }
  }

  return function resolveRef(testId, machineSource, reportDate, patientGender, catalogList) {
    var entry = findById(catalogList, testId);
    if (!entry) return { refLo: null, refHi: null };

    var date = normalizeRefDate(reportDate);
    if (date === null) { warnOnce(testId); date = todayIso(); }

    var rh = entry.refHistory;
    if (!rh || !rh.length) {
      // BUN_pre / BUN_post inherit BUN's refHistory (§1.1 special-case).
      if (testId === 'BUN_pre' || testId === 'BUN_post') {
        var bun = findById(catalogList, 'BUN');
        if (bun && bun.refHistory && bun.refHistory.length) {
          return resolveFromHistory(bun, bun.refHistory, machineSource, date, patientGender);
        }
      }
      return outerFallback(entry, patientGender);
    }

    return resolveFromHistory(entry, rh, machineSource, date, patientGender);
  };
})();

// ─── Exports (CommonJS for tests + browser global for the bundled snapshot) ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = resolveRef;
}
if (typeof window !== 'undefined') {
  window.resolveRef = resolveRef;
}
