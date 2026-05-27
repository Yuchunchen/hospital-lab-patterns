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

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) { console.log('✅  refHistory harness: all ' + pass + ' tests passed'); process.exit(0); }
else { console.error('❌  refHistory harness: ' + fail + ' failed, ' + pass + ' passed'); process.exit(1); }
