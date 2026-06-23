'use strict';

/**
 * schema.js — Field documentation + runtime validators.
 */

const ALLOWED_FIELDS = new Set([
  'id',
  'pattern', 'orderNameFilter', 'orderNameMatch', 'hospitalScope',
  'displayName', 'shortLabel', 'unit', 'ref',
  'refLo', 'refHi', 'hi', 'lo',
  'loM', 'hiM', 'loF', 'hiF',
  'category', 'categoryId', 'section', 'page', 'col',
  'gender', 'hivOnly', 'dialysisFilter', 'qualitative', 'singleValue',
  'normalize',
  // Machine × time (× inline gender) reference-range history. See
  // ../docs/pattern-spec.md and TASK_BRIEF_ref_range_machine_time_dim §2.
  'refHistory',
  'computed', 'needs',
  'meaning',
  'kind', 'rows',
  'tags', 'notes',
  // Sub-page enrichment config: { orderNameMatch:RegExp, resultPattern:RegExp, synthLabel:string }
  'subpage',
  // Reporter legacy aliases
  'cat', 'label', 'filter',
]);

const GENDER_THRESHOLD_FIELDS = ['loM', 'hiM', 'loF', 'hiF'];

// refHistory[].machine valid values; inline gender-override field names; and
// the ISO date shape validFrom must follow (compared against report dates).
const VALID_MACHINES            = new Set(['vhtt', 'vhyl', '*']);
const REF_HISTORY_GENDER_FIELDS = ['refLoM', 'refHiM', 'refLoF', 'refHiF'];
const VALIDFROM_RE              = /^\d{4}-\d{2}-\d{2}$/;

function isNumberOrNullish(v) {
  return v === null || v === undefined || typeof v === 'number';
}

function isNonNegIntOrNullish(v) {
  return v === null || v === undefined ||
    (typeof v === 'number' && Number.isInteger(v) && v >= 0);
}

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

  // gender-aware thresholds: loM/hiM/loF/hiF must each be number or null/undefined.
  // If any one is present (non-undefined), the entry must also carry lo/hi as
  // an unknown-gender fallback (the wide envelope spanning both sex groups).
  let hasGenderField = false;
  for (const f of GENDER_THRESHOLD_FIELDS) {
    if (f in entry) {
      hasGenderField = true;
      if (!isNumberOrNullish(entry[f])) {
        errs.push(`${id}: ${f} must be a number or null/undefined`);
      }
    }
  }
  if (hasGenderField) {
    if (!('lo' in entry) || !('hi' in entry)) {
      errs.push(`${id}: gender-aware thresholds (loM/hiM/loF/hiF) require lo/hi as unknown-gender fallback`);
    }
  }

  // refHistory: machine × time (× inline gender) reference ranges. Each item is
  // a base {machine, refLo, refHi, validFrom, source} with optional inline
  // gender override (refLoM/refHiM/refLoF/refHiF). Validation mirrors §2.2-2.4
  // of TASK_BRIEF_ref_range_machine_time_dim.
  if ('refHistory' in entry) {
    const rh = entry.refHistory;
    if (!Array.isArray(rh)) {
      errs.push(`${id}: refHistory must be an array`);
    } else {
      rh.forEach((h, idx) => {
        const tag = `${id}: refHistory[${idx}]`;
        if (!h || typeof h !== 'object') { errs.push(`${tag}: not an object`); return; }

        // machine ∈ valid set, and consistent with entry-level hospitalScope (§2.4)
        if (!VALID_MACHINES.has(h.machine)) {
          errs.push(`${tag}: invalid machine "${h.machine}" (expected vhtt | vhyl | *)`);
        } else if (entry.hospitalScope === 'tt' && h.machine === 'vhyl') {
          errs.push(`${tag}: machine "vhyl" not allowed when entry hospitalScope='tt'`);
        } else if (entry.hospitalScope === 'yl' && h.machine === 'vhtt') {
          errs.push(`${tag}: machine "vhtt" not allowed when entry hospitalScope='yl'`);
        }

        // validFrom must be an ISO YYYY-MM-DD string (compared to report dates)
        if (typeof h.validFrom !== 'string' || !VALIDFROM_RE.test(h.validFrom)) {
          errs.push(`${tag}: validFrom must be "YYYY-MM-DD" (got ${JSON.stringify(h.validFrom)})`);
        }

        // base unknown-gender range — both keys required; values number|null
        if (!('refLo' in h) || !('refHi' in h)) {
          errs.push(`${tag}: must carry refLo and refHi (base unknown-gender range)`);
        }
        ['refLo', 'refHi'].forEach(f => {
          if (f in h && !isNumberOrNullish(h[f])) errs.push(`${tag}: ${f} must be a number or null`);
        });

        // source — human-readable provenance string
        if (typeof h.source !== 'string' || !h.source) {
          errs.push(`${tag}: source must be a non-empty string`);
        }

        // inline gender override (§2.3): if any present, the base refLo/refHi
        // must also exist as the unknown-gender wide envelope.
        let hasInlineGender = false;
        REF_HISTORY_GENDER_FIELDS.forEach(f => {
          if (f in h) {
            hasInlineGender = true;
            if (!isNumberOrNullish(h[f])) errs.push(`${tag}: ${f} must be a number or null`);
          }
        });
        if (hasInlineGender && (!('refLo' in h) || !('refHi' in h))) {
          errs.push(`${tag}: inline gender override (refLoM/refHiM/refLoF/refHiF) requires refLo/refHi as unknown-gender fallback`);
        }

        // age band (TASK_BRIEF_ref_range_age_dim §2): ageMin/ageMax optional,
        // each a non-negative integer when present; if both present min <= max.
        // Both absent = age-agnostic (applies to all ages, the default).
        ['ageMin', 'ageMax'].forEach(f => {
          if (f in h && !isNonNegIntOrNullish(h[f])) {
            errs.push(`${tag}: ${f} must be a non-negative integer or null`);
          }
        });
        if (h.ageMin != null && h.ageMax != null && h.ageMin > h.ageMax) {
          errs.push(`${tag}: ageMin (${h.ageMin}) must be <= ageMax (${h.ageMax})`);
        }
      });

      // Age-band overlap (§2): within the same (machine, validFrom), two
      // age-SPECIFIC bands must not overlap — overlapping bands would make
      // resolution ambiguous. Age-agnostic items (both bounds absent) are the
      // catch-all default and are exempt (precedence: age-specific beats it).
      const ageGroups = {};
      rh.forEach((h, idx) => {
        if (!h || typeof h !== 'object') return;
        if (h.ageMin == null && h.ageMax == null) return;     // age-agnostic
        const key = h.machine + '|' + h.validFrom;
        (ageGroups[key] = ageGroups[key] || []).push({
          idx,
          lo: h.ageMin == null ? 0 : h.ageMin,
          hi: h.ageMax == null ? Infinity : h.ageMax,
        });
      });
      Object.keys(ageGroups).forEach(key => {
        const bands = ageGroups[key];
        for (let i = 0; i < bands.length; i++) {
          for (let j = i + 1; j < bands.length; j++) {
            if (bands[i].lo <= bands[j].hi && bands[j].lo <= bands[i].hi) {
              errs.push(`${id}: refHistory age bands overlap for (machine,validFrom)=${key} ` +
                `— items [${bands[i].idx}] and [${bands[j].idx}]`);
            }
          }
        }
      });
    }
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
  VALID_MACHINES,
  GENDER_THRESHOLD_FIELDS,
  REF_HISTORY_GENDER_FIELDS,
  validateEntry,
  validateCatalog,
};
