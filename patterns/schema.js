'use strict';

/**
 * schema.js — Shared field documentation + runtime validators for the
 * pattern catalog. See ../docs/pattern-spec.md for the full spec.
 */

const ALLOWED_FIELDS = new Set([
  // Identity
  'id',
  // Detection
  'pattern', 'orderNameFilter', 'orderNameMatch', 'hospitalScope',
  // Display
  'displayName', 'shortLabel', 'unit', 'ref',
  'refLo', 'refHi', 'hi', 'lo',
  // Categorisation / layout
  'category', 'categoryId', 'section', 'page', 'col',
  // Filters / scope
  'gender', 'hivOnly', 'dialysisFilter', 'qualitative', 'singleValue',
  // Value transform
  'normalize',
  // Computed entries
  'computed', 'needs',
  // Patient-facing explanation
  'meaning',
  // Text-block entries
  'kind', 'rows',
  // Hint flags
  'tags', 'notes',
  // Reporter legacy aliases
  'cat', 'label', 'filter',
]);

const REQUIRED_FIELDS = ['id'];

const VALID_HOSPITAL_SCOPES = new Set([undefined, 'tt', 'yl']);
const VALID_GENDERS         = new Set([undefined, 'M', 'F']);
const VALID_DIALYSIS        = new Set([undefined, 'composite', 'standalone_bun']);

function validateEntry(entry) {
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
  const dfilter = entry.dialysisFilter !== undefined ? entry.dialysisFilter : entry.filter;
  if (dfilter !== undefined && !VALID_DIALYSIS.has(dfilter)) {
    errs.push(`${id}: invalid dialysisFilter "${dfilter}"`);
  }
  if (entry.normalize !== undefined && typeof entry.normalize !== 'function') {
    errs.push(`${id}: normalize must be a function`);
  }

  return errs;
}

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
