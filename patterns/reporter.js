'use strict';

/**
 * reporter.js — Dialysis-room lab catalog used by hospital-lab-reporter
 * (洗腎室檢驗資料管理). Source of truth: this file.
 *
 * Replaces the inline LAB_TESTS array that lived in
 * hospital-lab-reporter/hospital-lab-data.html.
 *
 * Fields preserved from the original file (legacy `cat`, `label`, `filter`):
 *   cat       short category id (CBC / RENAL / LYTE / ...)
 *   label     short Chinese display name
 *   filter    'composite' | 'standalone_bun' (BUN pre/post-dialysis filter)
 *
 * These coexist with the unified schema (category, shortLabel,
 * dialysisFilter) so the reporter HTML can keep using its current code
 * paths during phase 1.
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
  { id:'PTH',      label:'副甲狀腺' },
  { id:'HEPAT',    label:'肝炎 / 感染' },
  { id:'COMPUTED', label:'計算值' },
];

// ─── Lab tests (50 entries, faithful to the original) ────────────────────
const REPORTER_CATALOG = [
  // ── 血液常規 ──
  { id:'WBC',      cat:'CBC',     label:'白血球 WBC',
    pattern: /WBC:\s*([\d.]+)(?!\s*[-–]\s*\d)/,
    unit:'×10³/µL', ref:'4.0-11.0',
    hi:11, lo:4,
    normalize: v => v > 100 ? +(v/1000).toFixed(1) : v },

  { id:'RBC',      cat:'CBC',     label:'紅血球 RBC',
    pattern: /RBC:\s*([\d.]+)/,
    unit:'×10⁶/µL', ref:'M:4.2-6.2 F:3.7-5.5',
    hi:null, lo:null },

  { id:'Hb',       cat:'CBC',     label:'血色素 Hb',
    pattern: /(?:Hb|HGB):\s*([\d.]+)/,
    unit:'g/dL', ref:'M:12.3-18.3 F:11.3-15.3',
    hi:null, lo:null },

  { id:'HCT',      cat:'CBC',     label:'血比容 HCT',
    pattern: /HCT:\s*([\d.]+)/,
    unit:'%', ref:'M:39-53 F:33-47',
    hi:null, lo:null },

  { id:'MCV',      cat:'CBC',     label:'MCV',
    pattern: /MCV:\s*([\d.]+)/,
    unit:'fL', ref:'79-99',
    hi:99, lo:79 },

  { id:'Platelet', cat:'CBC',     label:'血小板 PLT',
    pattern: /Platelet:\s*([\d.]+)/,
    unit:'×10³/µL', ref:'120-320',
    hi:320, lo:120,
    normalize: v => v > 1000 ? +(v/1000).toFixed(0) : v },

  // ── 蛋白質 ──
  { id:'TP',       cat:'PROTEIN', label:'總蛋白 TP',
    pattern: /Total protein\(serum\):\s*([\d.]+)/,
    unit:'g/dL', ref:'6.0-8.3',
    hi:8.3, lo:6.0 },

  { id:'Albumin',  cat:'PROTEIN', label:'白蛋白 Alb',
    pattern: /Albumin\(serum\):\s*([\d.]+)/,
    unit:'g/dL', ref:'3.5-5.0',
    hi:5.0, lo:3.5 },

  // ── 肝功能 ──
  { id:'GOT',      cat:'LIVER',   label:'GOT/AST',
    pattern: /GOT:\s*([\d.]+)/,
    unit:'U/L', ref:'13-39',
    hi:39, lo:null },

  { id:'GPT',      cat:'LIVER',   label:'GPT/ALT',
    pattern: /GPT:\s*([\d.]+)/,
    unit:'U/L', ref:'7-52',
    hi:52, lo:null },

  { id:'ALP',      cat:'LIVER',   label:'Alk-P',
    pattern: /ALP:\s*([\d.]+)/,
    unit:'U/L', ref:'34-104',
    hi:104, lo:34 },

  { id:'TBIL',     cat:'LIVER',   label:'總膽紅素 T-BIL',
    pattern: /T-BIL:\s*([\d.]+)/,
    unit:'mg/dL', ref:'0.3-1.0',
    hi:1.0, lo:0.3 },

  // ── 血脂 ──
  { id:'CHOL',     cat:'LIPID',   label:'總膽固醇',
    pattern: /CHOL:\s*([\d.]+)/,
    unit:'mg/dL', ref:'<200',
    hi:200, lo:null },

  { id:'LDL',      cat:'LIPID',   label:'LDL-C',
    pattern: /LDL-C:\s*([\d.]+)/,
    unit:'mg/dL', ref:'<140',
    hi:140, lo:null },

  { id:'TG',       cat:'LIPID',   label:'三酸甘油脂',
    pattern: /Triglyceride:\s*([\d.]+)/,
    unit:'mg/dL', ref:'<150',
    hi:150, lo:null },

  // ── 血糖 ──
  { id:'GluAC',    cat:'SUGAR',   label:'飯前血糖',
    pattern: /(?:Glucose\([^)]*\)|GLU[\s-]*(?:AC)?|Sugar(?:\([^)]*\))?|AC[\s-]*Sugar|飯前血糖):\s*([\d.]+)/i,
    unit:'mg/dL', ref:'74-106',
    hi:106, lo:74 },

  { id:'HbA1c',    cat:'SUGAR',   label:'HbA1c',
    pattern: /HBA[I1]C%?:\s*([\d.]+)/i,
    unit:'%', ref:'4-6',
    hi:6, lo:null },

  // ── 腎功能 ──
  { id:'BUN_pre',  cat:'RENAL',   label:'BUN(洗前)',
    pattern: /BUN:\s*([\d.]+)/,
    unit:'mg/dL', ref:'7-25',
    hi:25, lo:7,
    filter:'composite' },

  { id:'BUN_post', cat:'RENAL',   label:'BUN(洗後)',
    pattern: /BUN:\s*([\d.]+)/,
    unit:'mg/dL', ref:'',
    hi:null, lo:null,
    filter:'standalone_bun' },

  { id:'CREAT',    cat:'RENAL',   label:'肌酸酐 Cr',
    pattern: /(?:Creatinine\(serum\)|CREAT):\s*([\d.]+)/i,
    unit:'mg/dL', ref:'M:0.7-1.3 F:0.6-1.2',
    hi:null, lo:null },

  { id:'UA',       cat:'RENAL',   label:'尿酸 UA',
    pattern: /(?:Uric acid|UA):\s*([\d.]+)/i,
    unit:'mg/dL', ref:'M:4.4-7.6 F:2.3-6.6',
    hi:null, lo:null },

  // ── 電解質 ──
  { id:'Na',       cat:'LYTE',    label:'鈉 Na',
    pattern: /NA\(Serum\):\s*([\d.]+)/,
    unit:'mmol/L', ref:'136-145',
    hi:145, lo:136 },

  { id:'K',        cat:'LYTE',    label:'鉀 K',
    pattern: /K \(Serum\):\s*([\d.]+)/,
    unit:'mmol/L', ref:'3.5-5.1',
    hi:5.1, lo:3.5 },

  { id:'Cl',       cat:'LYTE',    label:'氯 Cl',
    pattern: /Cl\(Serum\):\s*([\d.]+)/,
    unit:'mmol/L', ref:'98-107',
    hi:107, lo:98 },

  { id:'Ca',       cat:'LYTE',    label:'鈣 Ca',
    pattern: /Calcium\(Serum\):\s*([\d.]+)/,
    unit:'mg/dL', ref:'8.6-10.3',
    hi:10.3, lo:8.6 },

  { id:'P',        cat:'LYTE',    label:'磷 P',
    pattern: /Phosphorus:\s*([\d.]+)/,
    unit:'mg/dL', ref:'2.5-5.0',
    hi:5.0, lo:2.5 },

  // ── 鐵代謝 ──
  { id:'Fe',       cat:'IRON',    label:'血清鐵 Fe',
    pattern: /FE:\s*([\d.]+)/,
    unit:'µg/dL', ref:'M:65-175 F:50-170',
    hi:null, lo:null },

  { id:'TIBC',     cat:'IRON',    label:'TIBC',
    pattern: /TIBC:\s*([\d.]+)/,
    unit:'µg/dL', ref:'M:134-415 F:120-480',
    hi:null, lo:null },

  { id:'TSAT',     cat:'IRON',    label:'TSAT',
    pattern: /SAT:\s*([\d.]+)/,
    unit:'%', ref:'20-45',
    hi:45, lo:20 },

  { id:'Ferritin', cat:'IRON',    label:'鐵蛋白',
    pattern: /(?:Ferritin|FERRITIN):\s*([\d.]+)/i,
    unit:'ng/mL', ref:'M:21.8-274.7 F:4.6-204.0',
    hi:null, lo:null },

  // ── 副甲狀腺 ──
  { id:'iPTH',     cat:'PTH',     label:'i-PTH',
    pattern: /i-PTH:\s*([\d.]+)/,
    unit:'pg/mL', ref:'15-68.3',
    hi:68.3, lo:15 },

  // ── 肝炎 / 感染 (qualitative) ──
  { id:'HBsAg',    cat:'HEPAT',   label:'HBsAg',
    pattern: /HBsAg(?:\(TT\))?:\s*(\S+)/,
    unit:'', ref:'',
    qualitative:true },

  { id:'AntiHBs',  cat:'HEPAT',   label:'Anti-HBs',
    pattern: /Anti-HBs(?:\(TT\))?:\s*(\S+)/,
    unit:'', ref:'',
    qualitative:true },

  { id:'AntiHCV',  cat:'HEPAT',   label:'Anti-HCV',
    pattern: /(?:HCV Ab\(TT\)|Anti-HCV):\s*(\S+)/,
    unit:'', ref:'',
    qualitative:true },

  { id:'AFP',      cat:'HEPAT',   label:'AFP',
    pattern: /AFP:\s*([\d.]+)/,
    unit:'ng/mL', ref:'<20',
    hi:20, lo:null },

  { id:'HIV',      cat:'HEPAT',   label:'HIV',
    pattern: /HIV[^:]*:\s*(\S+)/i,
    unit:'', ref:'',
    qualitative:true },

  { id:'RPR',      cat:'HEPAT',   label:'RPR',
    pattern: /REACT:\s*(\S+)/,
    unit:'', ref:'',
    qualitative:true },
];

// ─── Computed tests (URR, Ca×P) ──────────────────────────────────────────
// These appear here for backwards-compat with the reporter; they overlap
// with patterns/computed.js (which is the long-term home).
const REPORTER_COMPUTED = [
  { id:'URR',  cat:'COMPUTED', label:'URR',  unit:'%', ref:'>65%', hi:null, lo:65,
    needs:['BUN_pre', 'BUN_post'],
    compute: (pre, post) => {
      if (pre == null || post == null || pre === 0) return null;
      return +((1 - post / pre) * 100).toFixed(1);
    } },
  { id:'CaxP', cat:'COMPUTED', label:'Ca×P', unit:'',  ref:'<55',  hi:55,   lo:null,
    needs:['Ca', 'P'],
    compute: (ca, p) => {
      if (ca == null || p == null) return null;
      return +(ca * p).toFixed(1);
    } },
];

// ─── Exports (CommonJS + browser global) ─────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIES,
    REPORTER_CATALOG,
    REPORTER_COMPUTED,
  };
}
if (typeof window !== 'undefined') {
  window.HOSPITAL_LAB_PATTERNS_REPORTER = {
    CATEGORIES,
    REPORTER_CATALOG,
    REPORTER_COMPUTED,
  };
}
