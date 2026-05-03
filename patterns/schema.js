'use strict';

/**
 * schema.js — Field documentation + runtime validators.
 */

const ALLOWED_FIELDS = new Set([
  'id',
  'pattern', 'orderNameFilter', 'orderNameMatch', 'hospitalScope',
  'displayName', 'shortLabel', 'unit', 'ref',
  'refLo', 'refHi', 'hi', 'lo',
  'category', 'categoryId', 'section', 'page', 'col',
  'gender', 'hivOnly', 'dialysisFilter', 'qualitative', 'singleValue',
  'normalize',
  'computed', 'needs',
  'meaning',
  'kind', 'rows',
  'tags', 'notes',
  // Reporter legacy aliases
  'cat', 'label', 'filter',
]);

const REQUIRED_FIELDS = ['id'];
const VALID_HOSPITAL_SCOPES = new Set([undefined, 'tt', 'yl']);
const VALID_GENDERS         = new Set([undefined, 'M', 'F']);
const VALID_DIALYSIS        = new Set([undefined, 'composite', 'standalone_bun']);

function validateEntry(entry, ctx) {
  ctx = ctx || {};
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

  // normalize: function OR string-name (must exist in normalizers if ctx provided)
  if (entry.normalize !== undefined) {
    if (typeof entry.normalize === 'function') {
      // function literal — fine
    } else if (typeof entry.normalize === 'string') {
      if (ctx.normalizers && !(entry.normalize in ctx.normalizers)) {
        errs.push(`${id}: normalize references unknown normalizer "${entry.normalize}"`);
      }
    } else {
      errs.push(`${id}: normalize must be a function or a string name`);
    }
  }

  return errs;
}

function validateCatalog(entries, label, ctx) {
  label = label || 'catalog';
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

    const entryErrs = validateEntry(e, ctx);
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
