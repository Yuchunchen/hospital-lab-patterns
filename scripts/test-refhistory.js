#!/usr/bin/env node
'use strict';

/**
 * test-refhistory.js — node harness for TASK_BRIEF_ref_range_machine_time_dim
 * §10.1 (schema layer) + §10.2 (resolveRef helper layer), tests T1–T13.
 *
 * Run: npm run test:refhistory
 */

const schema     = require('../patterns/schema');
const catalog     = require('../patterns/catalog');
const resolveRef  = require('../patterns/lib/resolveRef');

let pass = 0, fail = 0;
function ok(name)        { console.log('  ✓ ' + name); pass++; }
function bad(name, info) { console.error('  ✖ ' + name + (info ? ' — ' + info : '')); fail++; }
function assert(cond, name, info) { cond ? ok(name) : bad(name, info); }
function eq(a, b, name)  { assert(JSON.stringify(a) === JSON.stringify(b), name, 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

const TODAY = (() => { const d = new Date(); const p = n => (n < 10 ? '0' : '') + n; return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()); })();

// ── §10.1 schema layer ──────────────────────────────────────────────────────
console.log('\n── §10.1 schema layer ' + '─'.repeat(40));

// T1: all 51 migrated in-scope entries validate clean.
{
  const withRH = catalog.filter(e => e.refHistory);
  let errCount = 0;
  withRH.forEach(e => { errCount += schema.validateEntry(e, {}).length; });
  assert(withRH.length === 51 && errCount === 0, 'T1: 51 in-scope entries have refHistory and validate clean',
    withRH.length + ' entries, ' + errCount + ' errors');
}

// T2: machine 'vhtt' under hospitalScope 'yl' → error.
{
  const e = { id:'X', hospitalScope:'yl',
    refHistory:[{ machine:'vhtt', refLo:1, refHi:2, validFrom:'1900-01-01', source:'t' }] };
  const errs = schema.validateEntry(e, {});
  assert(errs.some(m => /vhtt.*not allowed.*yl/.test(m)), 'T2: vhtt machine under hospitalScope=yl rejected', errs.join('; '));
}

// T3: inline refLoM without refLo → error.
{
  const e = { id:'X',
    refHistory:[{ machine:'*', refHi:6, refLoM:4, validFrom:'1900-01-01', source:'t' }] };
  const errs = schema.validateEntry(e, {});
  assert(errs.some(m => /refLo/.test(m)), 'T3: inline refLoM without refLo rejected', errs.join('; '));
}

// T4: excluded entries carry no refHistory and still validate.
{
  const ids = ['eGFR', 'UACR', 'ABI'];
  let clean = true, info = [];
  ids.forEach(id => {
    const e = catalog.find(x => x.id === id);
    if (!e) { clean = false; info.push(id + ' missing'); return; }
    if (e.refHistory) { clean = false; info.push(id + ' unexpectedly has refHistory'); }
    const errs = schema.validateEntry(e, {});
    if (errs.length) { clean = false; info.push(id + ': ' + errs.join(',')); }
  });
  assert(clean, 'T4: excluded entries (eGFR/UACR/ABI) have no refHistory, validate clean', info.join('; '));
}

// T5: BUN_pre/BUN_post have no refHistory; BUN does; all validate clean.
{
  const bun = catalog.find(e => e.id === 'BUN');
  const pre = catalog.find(e => e.id === 'BUN_pre');
  const post = catalog.find(e => e.id === 'BUN_post');
  const okShape = bun && bun.refHistory && pre && !pre.refHistory && post && !post.refHistory;
  const errs = [bun, pre, post].reduce((n, e) => n + schema.validateEntry(e, {}).length, 0);
  assert(okShape && errs === 0, 'T5: BUN has refHistory, BUN_pre/post do not, all validate clean',
    'shape=' + okShape + ' errs=' + errs);
}

// ── §10.2 resolveRef helper layer ───────────────────────────────────────────
console.log('\n── §10.2 resolveRef helper layer ' + '─'.repeat(28));

// Synthetic catalog (don't depend on live values).
const WBC = { id:'WBC', refLo:4, refHi:11, lo:4, hi:11,
  refHistory:[
    { machine:'*',    refLo:4.0, refHi:11.0, validFrom:'1900-01-01', source:'mig' },
    { machine:'vhyl', refLo:3.8, refHi:10.5, validFrom:'2026-02-01', source:'yl' },
  ] };
const RBC_inline = { id:'RBC', refLo:3.7, refHi:6.2, loM:9, hiM:9, loF:9, hiF:9, // outer set to 9 to prove inline wins
  refHistory:[{ machine:'*', refLo:3.7, refHi:6.2, refLoM:4.0, refHiM:6.0, refLoF:3.5, refHiF:5.5, validFrom:'1900-01-01', source:'mig' }] };
const RBC_outer = { id:'RBC', refLo:3.7, refHi:6.2, loM:4.2, hiM:6.2, loF:3.5, hiF:5.5,
  refHistory:[{ machine:'*', refLo:3.7, refHi:6.2, validFrom:'1900-01-01', source:'mig' }] };
const eGFR = { id:'eGFR', refLo:60, refHi:null, lo:60, hi:null }; // no refHistory
const BUN = { id:'BUN', refLo:7, refHi:25,
  refHistory:[
    { machine:'*',    refLo:7, refHi:25, validFrom:'1900-01-01', source:'mig' },
    { machine:'vhyl', refLo:6, refHi:23, validFrom:'2026-01-01', source:'yl' },
  ] };
const BUN_pre = { id:'BUN_pre', refLo:7, refHi:25 }; // no refHistory → inherits BUN

const CAT = [WBC, RBC_inline, eGFR, BUN, BUN_pre];
const CAT_OUTER = [RBC_outer, BUN, BUN_pre];

// T6: vhyl machine picks the vhyl override.
eq(resolveRef('WBC', 'vhyl', TODAY, null, CAT), { refLo:3.8, refHi:10.5 }, 'T6: WBC vhyl → vhyl override');

// T7: vhtt machine (no vhtt override) picks the '*' default.
eq(resolveRef('WBC', 'vhtt', TODAY, null, CAT), { refLo:4.0, refHi:11.0 }, 'T7: WBC vhtt → * default');

// T8: report date before the vhyl override validFrom → '*' default.
eq(resolveRef('WBC', 'vhyl', '2025-08-01', null, CAT), { refLo:4.0, refHi:11.0 }, 'T8: WBC vhyl @2025-08 → * default (date < validFrom)');

// T9: excluded entry (no refHistory) → outer refLo/refHi fallback.
eq(resolveRef('eGFR', 'vhyl', TODAY, null, CAT), { refLo:60, refHi:null }, 'T9: eGFR → outer refLo/refHi fallback');

// T10: BUN_pre (no own refHistory) inherits BUN's vhyl refHistory.
eq(resolveRef('BUN_pre', 'vhyl', TODAY, null, CAT), { refLo:6, refHi:23 }, 'T10a: BUN_pre vhyl → BUN vhyl refHistory');
eq(resolveRef('BUN_pre', 'vhtt', TODAY, null, CAT), { refLo:7, refHi:25 }, 'T10b: BUN_pre vhtt → BUN * refHistory');

// T11: inline gender override wins.
eq(resolveRef('RBC', 'vhyl', TODAY, 'M', CAT), { refLo:4.0, refHi:6.0 }, 'T11: RBC M → inline refLoM/refHiM');

// T12: no inline gender → outer loM/hiM second-layer fallback.
eq(resolveRef('RBC', 'vhyl', TODAY, 'M', CAT_OUTER), { refLo:4.2, refHi:6.2 }, 'T12: RBC M → outer loM/hiM fallback');

// T13: missing reportDate → today + console.warn once.
{
  const orig = console.warn; let warns = 0;
  console.warn = () => { warns++; };
  const r1 = resolveRef('WBC', 'vhyl', null, null, CAT);
  const r2 = resolveRef('WBC', 'vhyl', null, null, CAT); // second call must NOT warn again
  console.warn = orig;
  // null date → today → vhyl override active (validFrom 2026-02-01 <= today)
  assert(JSON.stringify(r1) === JSON.stringify({ refLo:3.8, refHi:10.5 }) && warns === 1,
    'T13: missing reportDate → today + warn once', 'result=' + JSON.stringify(r1) + ' warns=' + warns);
}

// ── age dimension: schema layer (TASK_BRIEF_ref_range_age_dim §7 A1–A4) ──────
console.log('\n── age_dim §7 schema layer ' + '─'.repeat(34));

// A1: ageMin:18 (no ageMax) validates clean.
{
  const e = { id:'X', refHistory:[{ machine:'*', refLo:40, refHi:130, ageMin:18, validFrom:'1900-01-01', source:'t' }] };
  const errs = schema.validateEntry(e, {});
  assert(errs.length === 0, 'A1: ageMin:18 (no ageMax) validates clean', errs.join('; '));
}

// A2: same (machine,validFrom) overlapping age bands (0-17 & 10-20) → error.
{
  const e = { id:'X', refHistory:[
    { machine:'*', refLo:1, refHi:2, ageMin:0,  ageMax:17, validFrom:'1900-01-01', source:'t' },
    { machine:'*', refLo:3, refHi:4, ageMin:10, ageMax:20, validFrom:'1900-01-01', source:'t' } ] };
  const errs = schema.validateEntry(e, {});
  assert(errs.some(m => /overlap/i.test(m)), 'A2: overlapping age bands (0-17 & 10-20) rejected', errs.join('; '));
}

// A3: negative / non-integer ageMin → error.
{
  const neg  = schema.validateEntry({ id:'X', refHistory:[{ machine:'*', refLo:1, refHi:2, ageMin:-5,  validFrom:'1900-01-01', source:'t' }] }, {});
  const frac = schema.validateEntry({ id:'X', refHistory:[{ machine:'*', refLo:1, refHi:2, ageMin:1.5, validFrom:'1900-01-01', source:'t' }] }, {});
  assert(neg.some(m => /ageMin/.test(m)) && frac.some(m => /ageMin/.test(m)),
    'A3: negative / non-integer ageMin rejected', neg.concat(frac).join('; '));
}

// A4: age-agnostic + age-specific in the same group is NOT an overlap error.
{
  const e = { id:'X', refHistory:[
    { machine:'*', refLo:5, refHi:6, validFrom:'1900-01-01', source:'agn' },
    { machine:'*', refLo:1, refHi:2, ageMin:0, ageMax:17, validFrom:'1900-01-01', source:'peds' } ] };
  const errs = schema.validateEntry(e, {});
  assert(errs.length === 0, 'A4: age-agnostic + age-specific same group → not an overlap', errs.join('; '));
}

// ── age dimension: resolveRef layer (§7 B1–B5, C1) ───────────────────────────
console.log('\n── age_dim §7 resolveRef layer ' + '─'.repeat(30));

// Two age-specific bands, no age-agnostic: peds 0-17 vs adult 18+.
const ALP = { id:'ALP', refLo:40, refHi:130, lo:40, hi:130,
  refHistory:[
    { machine:'*', refLo:100, refHi:300, ageMin:0,  ageMax:17, validFrom:'1900-01-01', source:'peds' },
    { machine:'*', refLo:40,  refHi:130, ageMin:18,            validFrom:'1900-01-01', source:'adult' },
  ] };
// Age-agnostic coexisting with an age-specific band.
const AGN = { id:'AGN', refLo:1, refHi:2, lo:1, hi:2,
  refHistory:[
    { machine:'*', refLo:5,   refHi:6,   validFrom:'1900-01-01', source:'agn' },
    { machine:'*', refLo:100, refHi:300, ageMin:0, ageMax:17, validFrom:'1900-01-01', source:'peds' },
  ] };
// Machine-specific (age-agnostic) vs '*' (age-specific) — precedence machine>age.
const MA = { id:'MA', refLo:1, refHi:2, lo:1, hi:2,
  refHistory:[
    { machine:'*',    refLo:100, refHi:300, ageMin:0, ageMax:17, validFrom:'1900-01-01', source:'star-peds' },
    { machine:'vhyl', refLo:50,  refHi:60,                       validFrom:'1900-01-01', source:'yl-agnostic' },
  ] };
// Age band base + inline gender override (mirrors harvested BUN <50 / >50years).
const GA = { id:'GA', refLo:1, refHi:2, lo:1, hi:2,
  refHistory:[
    { machine:'*', refLo:7.0, refHi:18.7, refLoM:8.9, refHiM:20.6, refLoF:7.0, refHiF:18.7, ageMin:0,  ageMax:49, validFrom:'1900-01-01', source:'young' },
    { machine:'*', refLo:9.8, refHi:25.7, refLoM:8.4, refHiM:25.7, refLoF:9.8, refHiF:20.1, ageMin:50,            validFrom:'1900-01-01', source:'old' },
  ] };
const ACAT = [ALP, AGN, MA, GA];

// B1: age picks the right band.
eq(resolveRef('ALP', 'vhyl', TODAY, null, ACAT, 10), { refLo:100, refHi:300 }, 'B1a: age 10 → peds band');
eq(resolveRef('ALP', 'vhyl', TODAY, null, ACAT, 40), { refLo:40,  refHi:130 }, 'B1b: age 40 → adult band');

// B2: unknown age → age-agnostic; no agnostic → outer fallback (no random band).
eq(resolveRef('AGN', 'vhyl', TODAY, null, ACAT, null), { refLo:5,  refHi:6   }, 'B2a: age null → age-agnostic entry');
eq(resolveRef('ALP', 'vhyl', TODAY, null, ACAT, null), { refLo:40, refHi:130 }, 'B2b: age null + no agnostic → outer fallback (not a band)');

// B3: machine > age precedence (vhyl agnostic beats '*' peds even at age 10).
eq(resolveRef('MA', 'vhyl', TODAY, null, ACAT, 10), { refLo:50,  refHi:60  }, 'B3a: vhyl agnostic beats * age-band (machine>age)');
eq(resolveRef('MA', 'vhtt', TODAY, null, ACAT, 10), { refLo:100, refHi:300 }, 'B3b: vhtt (no vhtt entry) → * peds band');
// age-specific beats age-agnostic within same machine.
eq(resolveRef('AGN', 'vhyl', TODAY, null, ACAT, 10), { refLo:100, refHi:300 }, 'B3c: age-specific beats age-agnostic (same machine)');

// B4: entry with no age bands → age arg ignored, identical to legacy result.
eq(resolveRef('WBC', 'vhyl', TODAY, null, CAT, 40), { refLo:3.8, refHi:10.5 }, 'B4: no age bands → age arg ignored (== legacy T6)');

// B5: age band base then gender override.
eq(resolveRef('GA', 'vhyl', TODAY, 'M', ACAT, 60), { refLo:8.4, refHi:25.7 }, 'B5a: age>=50 band + gender M override');
eq(resolveRef('GA', 'vhyl', TODAY, 'F', ACAT, 60), { refLo:9.8, refHi:20.1 }, 'B5b: age>=50 band + gender F override');
eq(resolveRef('GA', 'vhyl', TODAY, 'M', ACAT, 30), { refLo:8.9, refHi:20.6 }, 'B5c: age<50 band + gender M override');

// C1: caller-computed ageAtReport (birth-year approx) picks the band that was
// valid AT THE REPORT, not the band for the patient's current age.
{
  const todayYear       = new Date().getFullYear();
  const currentAge      = 19;
  const birthYearApprox = todayYear - currentAge;
  const reportYearWhen17 = birthYearApprox + 17;       // patient was 17 then
  const ageAtReport      = reportYearWhen17 - birthYearApprox; // = 17
  const reportDateThen   = reportYearWhen17 + '-03-01';
  eq(resolveRef('ALP', 'vhyl', reportDateThen, null, ACAT, ageAtReport), { refLo:100, refHi:300 },
    'C1a: ageAtReport=17 → peds band (old report, boundary)');
  eq(resolveRef('ALP', 'vhyl', TODAY, null, ACAT, currentAge), { refLo:40, refHi:130 },
    'C1b: current age 19 → adult band (today)');
}

// pickEntry: viewer ref-display companion returns the chosen base item.
{
  const picked = resolveRef.pickEntry('ALP', 'vhyl', TODAY, null, ACAT, 10);
  assert(picked && picked.source === 'peds', 'D1: pickEntry returns the chosen age-band item', JSON.stringify(picked));
  const none = resolveRef.pickEntry('eGFR', 'vhyl', TODAY, null, CAT, 10);
  assert(none === null, 'D2: pickEntry → null when no refHistory (outer fallback path)', JSON.stringify(none));
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) { console.log('✅  refHistory harness: all ' + pass + ' tests passed'); process.exit(0); }
else { console.error('❌  refHistory harness: ' + fail + ' failed, ' + pass + ' passed'); process.exit(1); }
