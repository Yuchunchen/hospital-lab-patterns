'use strict';

/**
 * reporter.js — Manifest for the dialysis-room app (hospital-lab-reporter).
 *
 * Each manifest entry references a catalog id (see catalog.js) and adds
 * reporter-specific fields (cat, label, filter) plus any per-app overrides.
 *
 * To add a test to the dialysis table:
 *   1. Make sure it exists in catalog.js (add it there if not).
 *   2. Append a manifest entry below in the appropriate category.
 *   3. Run `node sync-patterns.js` from hospital-lab-reporter/.
 *
 * Two equivalent forms accepted:
 *   - String: just the id        e.g. 'WBC'
 *   - Object: id + overrides     e.g. { id:'WBC', cat:'CBC', label:'白血球 WBC' }
 *
 * Resolution: index.js merges each manifest entry on top of its catalog
 * entry. Manifest fields override catalog defaults.
 */

// ─── Categories (groups in the table view) ───────────────────────────────
const CATEGORIES = [
  { id:'CBC',      label:'血液' },
  { id:'PROTEIN',  label:'蛋白質' },
  { id:'LIVER',    label:'肝功能' },
  { id:'LIPID',    label:'血脂' },
  { id:'SUGAR',    label:'血糖' },
  { id:'RENAL',    label:'腎功能' },
  { id:'LYTE',     label:'電解質' },
  { id:'IRON',     label:'鐵代謝' },
  { id:'TRACE',    label:'微量元素' },
  { id:'PTH',      label:'副甲狀腺' },
  { id:'HEPAT',    label:'肝炎 / 感染' },
  { id:'STAGING',  label:'腎臟病分期' },
  { id:'COMPUTED', label:'計算值' },
];

// ─── Manifest (41 entries — dialysis-room outpatient list) ──────────────
const REPORTER_MANIFEST = [
  // ── 血液常規 ──
  { id:'WBC',      cat:'CBC',     label:'白血球 WBC' },
  { id:'RBC',      cat:'CBC',     label:'紅血球 RBC',
    hi:null, lo:null },                                   // catalog has alarms; reporter shows raw values
  { id:'Hb',       cat:'CBC',     label:'血色素 Hb',
    hi:null, lo:null },
  { id:'HCT',      cat:'CBC',     label:'血比容 HCT',
    hi:null, lo:null },
  { id:'MCV',      cat:'CBC',     label:'MCV' },
  { id:'Platelet', cat:'CBC',     label:'血小板 PLT',
    ref:'120-320', hi:320, lo:120 },                      // dialysis-specific tighter range

  // ── 蛋白質 ──
  { id:'TP',       cat:'PROTEIN', label:'總蛋白 TP' },
  { id:'Albumin',  cat:'PROTEIN', label:'白蛋白 Alb' },

  // ── 肝功能 ──
  { id:'GOT',      cat:'LIVER',   label:'GOT/AST',
    ref:'13-39', hi:39 },                                 // reporter uses 13-39 range
  { id:'GPT',      cat:'LIVER',   label:'GPT/ALT',
    ref:'7-52', hi:52 },                                  // reporter uses 7-52 range
  { id:'ALP',      cat:'LIVER',   label:'Alk-P',
    ref:'34-104', hi:104, lo:34 },                        // reporter uses 34-104
  { id:'TBIL',     cat:'LIVER',   label:'總膽紅素 T-BIL',
    lo:0.3 },                                             // reporter flags low T-BIL

  // ── 血脂 ──
  { id:'CHOL',     cat:'LIPID',   label:'總膽固醇' },
  { id:'LDL',      cat:'LIPID',   label:'LDL-C',
    ref:'<140', hi:140 },                                 // reporter uses 140 cutoff (catalog: 130)
  { id:'TG',       cat:'LIPID',   label:'三酸甘油脂' },

  // ── 血糖 ──
  { id:'GluAC',    cat:'SUGAR',   label:'飯前血糖',
    ref:'74-106', hi:106 },                               // reporter uses 106 upper (catalog: 100)
  { id:'HbA1c',    cat:'SUGAR',   label:'HbA1c' },

  // ── 腎功能 ──
  { id:'BUN_pre',  cat:'RENAL',   label:'BUN(洗前)' },
  { id:'BUN_post', cat:'RENAL',   label:'BUN(洗後)' },
  { id:'CREAT',    cat:'RENAL',   label:'肌酸酐 Cr',
    ref:'M:0.7-1.3 F:0.6-1.2', hi:null, lo:null },        // reporter shows raw, no alarms
  { id:'UA',       cat:'RENAL',   label:'尿酸 UA',
    ref:'M:4.4-7.6 F:2.3-6.6', hi:null, lo:null },

  // ── 電解質 ──
  { id:'Na',       cat:'LYTE',    label:'鈉 Na' },
  { id:'K',        cat:'LYTE',    label:'鉀 K' },
  { id:'Cl',       cat:'LYTE',    label:'氯 Cl' },
  { id:'Ca',       cat:'LYTE',    label:'鈣 Ca' },
  { id:'FreeCa',   cat:'LYTE',    label:'離子鈣 Free Ca' },   // KiDiTi field 34
  { id:'P',        cat:'LYTE',    label:'磷 P' },
  { id:'Mg',       cat:'LYTE',    label:'鎂 Mg' },             // KiDiTi field 41

  // ── 鐵代謝 ──
  { id:'Fe',       cat:'IRON',    label:'血清鐵 Fe',
    ref:'M:65-175 F:50-170', hi:null, lo:null },
  { id:'TIBC',     cat:'IRON',    label:'TIBC',
    ref:'M:134-415 F:120-480', hi:null, lo:null },
  { id:'UIBC',     cat:'IRON',    label:'UIBC' },              // computed: TIBC − Fe; KiDiTi field 37
  { id:'TSAT',     cat:'IRON',    label:'TSAT' },
  { id:'Ferritin', cat:'IRON',    label:'鐵蛋白',
    ref:'M:21.8-274.7 F:4.6-204.0', hi:null, lo:null },

  // ── 微量元素 (annual; sub-page enrichment) ──
  { id:'Aluminum', cat:'TRACE',   label:'鋁 Al' },

  // ── 副甲狀腺 ──
  { id:'iPTH',     cat:'PTH',     label:'i-PTH' },

  // ── 肝炎 / 感染 (qualitative) ──
  { id:'HBsAg',    cat:'HEPAT',   label:'HBsAg' },
  { id:'AntiHBs',  cat:'HEPAT',   label:'Anti-HBs' },
  { id:'AntiHCV',  cat:'HEPAT',   label:'Anti-HCV' },
  { id:'AFP',      cat:'HEPAT',   label:'AFP' },
  { id:'HIV',      cat:'HEPAT',   label:'HIV' },
  { id:'RPR',      cat:'HEPAT',   label:'RPR' },
];

// ─── Computed tests — render manifest for derived values ────────────────
//
// Each entry is a "what to render" row in the reporter's lab table; the
// actual compute logic lives in patterns/computed.js (COMPUTATIONS), which
// the reporter inlines at sync/build time and dispatches via core/compute.js.
//
// `kind:'staging'` flags string-valued entries (GFR/UACR/etc.) so the
// lab-view skips numeric hi/lo alarming and uses the staging colour map.
//
// URR / CaxP retain their original render metadata (cat:'COMPUTED'); the new
// CKD-staging entries go under cat:'STAGING'. eGFR is numeric (so plain
// hi/lo applies) but kept here because it is also derived from CREAT.
const REPORTER_COMPUTED = [
  // Dialysis-era derivations
  { id:'URR',  cat:'COMPUTED', label:'URR',  unit:'%', ref:'>65%', hi:null, lo:65 },
  { id:'CaxP', cat:'COMPUTED', label:'Ca×P', unit:'',  ref:'<55',  hi:55,   lo:null },

  // CKD staging (eGFR numeric; rest are qualitative staging strings)
  { id:'eGFR',      cat:'STAGING', label:'eGFR',         unit:'mL/min/1.73m²', ref:'>60', hi:null, lo:60 },
  { id:'GFRStage',  cat:'STAGING', label:'GFR 分期',      kind:'staging' },
  { id:'UACRStage', cat:'STAGING', label:'UACR 分期',     kind:'staging' },
  { id:'UPCRStage', cat:'STAGING', label:'UPCR 分期',     kind:'staging' },
  { id:'KDIGORisk', cat:'STAGING', label:'KDIGO 風險',    kind:'staging' },
  { id:'TaiwanCKD', cat:'STAGING', label:'台灣 CKD 分期', kind:'staging' },
  { id:'EarlyCKD',  cat:'STAGING', label:'健保 CKD 分群', kind:'staging' },
];

// ─── Exports (CommonJS + browser global) ─────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIES,
    REPORTER_MANIFEST,
    REPORTER_COMPUTED,
  };
}
if (typeof window !== 'undefined') {
  window.HOSPITAL_LAB_PATTERNS_REPORTER_PKG = {
    CATEGORIES,
    REPORTER_MANIFEST,
    REPORTER_COMPUTED,
  };
}
