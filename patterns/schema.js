'use strict';

/**
 * schema.js — Shared field documentation for pattern catalog entries.
 *
 * This module exports nothing executable. It exists to keep the
 * authoritative description of pattern entry fields in one place, and to
 * provide a runtime helper (validateEntry) used by scripts/validate.js.
 *
 * ─── ENTRY SHAPE (superset of viewer + reporter fields) ─────────────────
 *
 *  // Identity
 *  id                  string   unique within its catalog
 *
 *  // Detection
 *  pattern             RegExp   capture-group 1 = numeric value (or null
 *                               for purely-computed entries)
 *  orderNameFilter     RegExp?  if set, only orders whose orderName matches
 *                               this regex are considered (e.g. /,/ for
 *                               composite dialysis panels, or /^BUN$/i for
 *                               standalone post-dialysis BUN)
 *  orderNameMatch      RegExp?  for `kind:'text'` entries — selects which
 *                               imaging / endoscopy order to render
 *  hospitalScope       string?  'tt' | 'yl' | undefined (both)
 *
 *  // Display
 *  displayName         string   long bilingual form (e.g. "白血球 (WBC)")
 *  shortLabel          string?  short form (e.g. "WBC") — reporter prefers
 *                               this; viewer uses displayName
 *  unit                string?  display unit (e.g. "mg/dL")
 *  ref                 string?  human-readable reference range
 *
 *  // Numeric thresholds (used for high/low colouring)
 *  refLo               number?  numeric lower bound of normal range
 *  refHi               number?  numeric upper bound of normal range
 *  hi                  number?  alarm threshold (value > hi → red)
 *  lo                  number?  alarm threshold (value < lo → blue)
 *
 *  // Categorisation / layout
 *  category            string?  e.g. "血液", "腎功能"
 *  categoryId          string?  short id for code use, e.g. "CBC", "RENAL"
 *  section             string?  viewer section title (often = category)
 *  page                number?  1 or 2  — viewer printout layout
 *  col                 number?  1–4    — viewer printout layout
 *
 *  // Filters / scope
 *  gender              string?  'M' | 'F' | undefined (both)
 *  hivOnly             bool?    viewer: only show when HIV checkbox is on
 *  dialysisFilter      string?  'composite' | 'standalone_bun' — used by
 *                               reporter to pair pre/post-dialysis BUN
 *  qualitative         bool?    value is text not number (e.g. Reactive)
 *  singleValue         bool?    show only single most-recent value
 *
 *  // Value transform
 *  normalize           function?  (n: number) => number, applied after
 *                                 regex capture (e.g. WBC 6700 → 6.7)
 *
 *  // Computed entries
 *  computed            string?  computation key — consumer maps to function
 *                               (e.g. 'eGFR' → CKD-EPI formula)
 *  needs               string[]?  ids of source entries this computation
 *                                  depends on (reporter style)
 *
 *  // Patient-facing explanation
 *  meaning             string?  plain-language note shown on handout
 *
 *  // Text-block entries (viewer page 2 — endoscopy / sono / DEXA)
 *  kind                string?  'text' marks special text-form entries
 *  rows                array?   row definitions for the text-block layout
 *
 *  // Hint flags
 *  tags                string[]?  arbitrary tags for filtering
 *
 * ─── CONVENTIONS ────────────────────────────────────────────────────────
 *
 *  - Capture group 1 of `pattern` is the numeric value. Use non-capturing
 *    groups `(?:...)` for everything else.
 *  - For label variants, prefer one regex with alternation over multiple
 *    catalog entries. Example:
 *        /(?:Glucose(?:\([^)]*\))?|GLU[\s-]*(?:AC)?|Sugar):\s*([\d.]+)/i
 *  - For values containing comparison operators ("< 0.1", ">= 50"), use
 *    `[<>=]?\s*` before `[\d.]+` in the capture.
 *  - Negative lookaheads `(?!...)` are useful to reject unwanted matches
 *    (e.g. WBC 0–5 from urine routine vs WBC: 6.87 from CBC).
 *  - Document every non-trivial regex with a short comment on intent.
 */

// ─── Allowed field names ────────────────────────────────────────────────
const ALLOWED_FIELDS = new Set([
  'id', 'pattern', 'orderNameFilter', 'orderNameMatch', 'hospitalScope',
  'displayName', 'shortLabel', 'unit', 'ref',
  'refLo', 'refHi', 'hi', 'lo',
  'category', 'categoryId', 'section', 'page', 'col',
  'gender', 'hivOnly', 'dialysisFilter', 'qualitative', 'singleValue',
  'normalize',
  'computed', 'needs',
  'meaning',
  'kind', 'rows',
  'tags',
  // Reporter legacy aliases (kept for backwards compat in this phase)
  'cat', 'label', 'filter',
]);

const REQUIRED_FIELDS = ['id'];

const VALID_HOSPITAL_SCOPES = new Set([undefined, 'tt', 'yl']);
const VALID_GENDERS        = new Set([undefined, 'M', 'F']);
const VALID_DIALYSIS       = new Set([undefined, 'composite', 'standalone_bun']);

/**
 * Validate a single entry. Returns array of error strings (empty = valid).
 */
function validateEntry(entry, opts = {}) {
  const errs = [];
  const id = entry.id || '<no-id>';

  for (const f of REQUIRED_FIELDS) {
    if (!(f in entry)) errs.push(`${id}: missing required field "${f}"`);
  }

  for (const k of Object.keys(entry)) {
    if (!ALLOWED_FIELDS.has(k)) errs.push(`${id}: unknown field "${k}"`);
  }

  if (entry.pattern !== null && entry.pattern !== undefined) {
    if (!(entry.pattern instanceof RegExp)) {
      errs.push(`${id}: pattern must be RegExp or null/undefined`);
    }
  }

  if ('hospitalScope' in entry && !VALID_HOSPITAL_SCOPES.has(entry.hospitalScope)) {
    errs.push(`${id}: invalid hospitalScope "${entry.hospitalScope}"`);
  }
  if ('gender' in entry && !VALID_GENDERS.has(entry.gender)) {
    errs.push(`${id}: invalid gender "${entry.gender}"`);
  }
  // dialysisFilter OR legacy `filter`
  const dfilter = entry.dialysisFilter !== undefined ? entry.dialysisFilter : entry.filter;
  if (dfilter !== undefined && !VALID_DIALYSIS.has(dfilter)) {
    errs.push(`${id}: invalid dialysisFilter "${dfilter}"`);
  }

  if (entry.normalize !== undefined && typeof entry.normalize !== 'function') {
    errs.push(`${id}: normalize must be a function`);
  }

  return errs;
}

/**
 * Validate a whole catalog (array of entries).
 * Returns { errors: string[], duplicates: string[] }.
 */
function validateCatalog(entries, label = 'catalog') {
  const errors = [];
  const seenIds = new Set();
  const duplicates = [];

  if (!Array.isArray(entries)) {
    return { errors: [`${label}: expected array`], duplicates: [] };
  }

  entries.forEach((e, i) => {
    if (!e || typeof e !== 'object') {
      errors.push(`${label}[${i}]: not an object`);
      return;
    }
    if (!e.id) {
      errors.push(`${label}[${i}]: missing id`);
      return;
    }
    if (seenIds.has(e.id)) duplicates.push(e.id);
    seenIds.add(e.id);

    const entryErrs = validateEntry(e);
    entryErrs.forEach(msg => errors.push(`${label}: ${msg}`));
  });

  return { errors, duplicates };
}

module.exports = {
  ALLOWED_FIELDS,
  REQUIRED_FIELDS,
  VALID_HOSPITAL_SCOPES,
  VALID_GENDERS,
  VALID_DIALYSIS,
  validateEntry,
  validateCatalog,
};
