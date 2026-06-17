'use strict';

/**
 * viewer.js — Manifest for the outpatient handout (hospital-lab-viewer).
 *
 * Each entry references a catalog id (see catalog.js for the master
 * definitions) and adds viewer-specific layout (page/col/section) plus any
 * per-app overrides (e.g. tighter hi/lo thresholds, qualitative computed
 * wrappers).
 *
 * To add a test to the printout:
 *   1. Make sure it exists in catalog.js (add it there if it doesn't).
 *   2. Append a manifest entry below in the appropriate section/column.
 *   3. Run `node sync-patterns.js` from hospital-lab-viewer/.
 *
 * Two equivalent forms accepted:
 *   - String: just the id        e.g.  'WBC'
 *   - Object: id + overrides     e.g.  { id:'WBC', page:1, col:3, section:'血液' }
 *
 * Resolution: index.js merges each manifest entry on top of its catalog
 * entry. Manifest fields override catalog defaults.
 */

const VIEWER_MANIFEST = [

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ═══════════════════════════════════════════════════════════════════════

  // ── Col 1 │ 血糖 ──────────────────────────────────────────────────────
  { id:'GluAC', page:1, col:1, section:'血糖' },
  { id:'HbA1c', page:1, col:1, section:'血糖' },

  // ── Col 1 │ 血脂肪 ────────────────────────────────────────────────────
  { id:'CHOL', page:1, col:1, section:'血脂肪' },
  { id:'HDLC', page:1, col:1, section:'血脂肪' },
  { id:'LDL',  page:1, col:1, section:'血脂肪' },
  { id:'TG',   page:1, col:1, section:'血脂肪' },

  // ── Col 1 │ 肝功能 ────────────────────────────────────────────────────
  { id:'GOT', page:1, col:1, section:'肝功能' },
  { id:'GPT', page:1, col:1, section:'肝功能' },
  { id:'RGT', page:1, col:1, section:'肝功能' },
  { id:'ALP', page:1, col:1, section:'肝功能' },

  // ── Col 2 │ 腎功能 ────────────────────────────────────────────────────
  { id:'BUN',   page:1, col:2, section:'腎功能' },
  { id:'CREAT', page:1, col:2, section:'腎功能' },
  { id:'UA',    page:1, col:2, section:'腎功能' },
  { id:'eGFR',  page:1, col:2, section:'腎功能' },
  { id:'UACR',  page:1, col:2, section:'腎功能' },
  { id:'UPCR',  page:1, col:2, section:'腎功能' },

  // ── Col 2 │ 腎臟病分期 (computed) ────────────────────────────────────
  { id:'GFRStage',  page:1, col:2, section:'腎臟病分期' },
  { id:'UACRStage', page:1, col:2, section:'腎臟病分期' },
  { id:'UPCRStage', page:1, col:2, section:'腎臟病分期' },
  { id:'KDIGORisk', page:1, col:2, section:'腎臟病分期' },
  { id:'TaiwanCKD', page:1, col:2, section:'腎臟病分期' },
  { id:'EarlyCKD',  page:1, col:2, section:'腎臟病分期' },

  // ── Col 3 │ 血液 ──────────────────────────────────────────────────────
  // Viewer uses tighter clinical-action thresholds for outpatient education
  // than the catalog's broader reference range.
  { id:'RBC',      page:1, col:3, section:'血液' },
  { id:'WBC',      page:1, col:3, section:'血液',
    hi:10, lo:5.0, ref:'5.0–10.0 ×10³/µL' },
  { id:'Hb',       page:1, col:3, section:'血液' },
  { id:'Platelet', page:1, col:3, section:'血液' },

  // ── Col 3 │ 營養／電解質 ─────────────────────────────────────────────
  // Trimmed nutrition column per user request (2026-05-03).
  // Removed: TP, Cl, Ca, P, TIBC, TSAT, Ferritin, iPTH, Mg.
  // Removed dialysis-specific BUN_pre / BUN_post (section 腎功能（透析）).
  { id:'Albumin',   page:1, col:3, section:'營養／電解質' },
  { id:'Na',        page:1, col:3, section:'營養／電解質' },
  { id:'K',         page:1, col:3, section:'營養／電解質' },
  { id:'FreeCa',    page:1, col:3, section:'營養／電解質' },
  { id:'Fe',        page:1, col:3, section:'營養／電解質' },
  { id:'VitB12',    page:1, col:3, section:'營養／電解質' },
  { id:'FolicAcid', page:1, col:3, section:'營養／電解質' },

  // ── Col 4 │ 癌症指數 ─────────────────────────────────────────────────
  { id:'AFP',      page:1, col:4, section:'癌症指數' },
  { id:'CEA',      page:1, col:4, section:'癌症指數' },
  { id:'CA199',    page:1, col:4, section:'癌症指數' },
  { id:'PSA',      page:1, col:4, section:'癌症指數' },
  { id:'FreePSA',  page:1, col:4, section:'癌症指數' },
  { id:'PSARatio', page:1, col:4, section:'癌症指數' },
  { id:'CA125',    page:1, col:4, section:'癌症指數' },

  // ── Col 4 │ 甲狀腺 ───────────────────────────────────────────────────
  { id:'TSH',    page:1, col:4, section:'甲狀腺' },
  { id:'FreeT4', page:1, col:4, section:'甲狀腺' },

  // ── Col 4 │ 肝炎 ─────────────────────────────────────────────────────
  // Bilirubin numerics rendered alongside the qualitative hepatitis tests.
  // HCV / HBsAgDisplay / AntiHBsDisplay are computed wrappers from
  // catalog (singleValue:true) — they consume raw qualitative + raw titer
  // entries (extract-only entries below) and produce 帶原/正常/有抗體 +
  // (label titer) verdict tuples. Phase 2 (viewer): report.js will gain
  // a small dispatcher that runs PATTERNS_COMPUTED.{HCV,HBsAgDisplay,
  // AntiHBsDisplay} against `map` and writes back the verdict entries.
  { id:'DBIL',           page:1, col:4, section:'肝炎' },
  { id:'TBIL',           page:1, col:4, section:'肝炎' },
  { id:'HCV',            page:1, col:4, section:'肝炎' },
  { id:'HBsAgDisplay',   page:1, col:4, section:'肝炎' },
  { id:'AntiHBsDisplay', page:1, col:4, section:'肝炎' },

  // Extract-only entries — no page/col so render skips them, but the
  // parse loop in viewer report.js (which iterates the resolved manifest)
  // populates map[id] with regex matches. Required so HCV /
  // HBsAgDisplay / AntiHBsDisplay computed wrappers have inputs.
  { id:'HBsAg' },
  { id:'HBsAgTiter' },
  { id:'AntiHBs' },
  { id:'AntiHBsTiter' },
  { id:'AntiHCV' },
  { id:'AntiHCVTiter' },

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 2 — text-block entries (DEXA / endoscopy / sono)
  // ═══════════════════════════════════════════════════════════════════════

  // Page 2 layout — 2026-06-17 收斂為 col 1 文字報告 lump + col 2 數值
  // (DC + HIV stacked);col 3 / 4 留空。Reminder box 已移除(不顯示)。
  { id:'BoneDensity', page:2, col:1, section:'骨質疏鬆 (Bone Density)' },
  { id:'Endoscopy',   page:2, col:1, section:'胃鏡 (Endoscopy)' },
  { id:'AbdSono',     page:2, col:1, section:'超音波 (Ultrasound)' },

  // ── Page 2 │ Col 2 │ 白血球分類 (DC) ─────────────────────────────────
  // DC 五分類% display-only(catalog 無 hi/lo)。
  { id:'Neut',  page:2, col:2, section:'白血球分類 (DC)' },
  { id:'Lymph', page:2, col:2, section:'白血球分類 (DC)' },
  { id:'Mono',  page:2, col:2, section:'白血球分類 (DC)' },
  { id:'Eos',   page:2, col:2, section:'白血球分類 (DC)' },
  { id:'Baso',  page:2, col:2, section:'白血球分類 (DC)' },

  // ── Page 2 │ Col 2 │ HIV section (only rendered when HIV checkbox is on)
  { id:'HIVLoad', page:2, col:2, section:'HIV', hivOnly:true },
  { id:'CD4',     page:2, col:2, section:'HIV', hivOnly:true },
  { id:'RPR',     page:2, col:2, section:'HIV', hivOnly:true,
    computed:'RPR',  pattern:null, singleValue:true },
  { id:'TPHA',    page:2, col:2, section:'HIV', hivOnly:true,
    computed:'TPHA', pattern:null, singleValue:true },

];

// ═══════════════════════════════════════════════════════════════════════════
// VIEWER_A5_MANIFEST — A5 landscape single-table printout (v1.4.0)
//
// Used by viewer report.js `buildA5Page()` when the popup "📄 A5單頁"
// checkbox is on. The A5 layout is a flat 4-column rounded table showing
// only the latest value of each test; `section` is metadata for future use
// (e.g. grouping headers) — the current renderer does not honour it.
//
// Order fixed by YC 2026-05-20 cowork session (TASK_BRIEF_viewer_a5_layout).
// All ids must already exist in VIEWER_MANIFEST above (because their
// catalog entry + regex come from there); A5 just re-orders a subset.
// ═══════════════════════════════════════════════════════════════════════════

const VIEWER_A5_MANIFEST = [
  { id:'GluAC',    order:1,  section:'血糖' },
  { id:'HbA1c',    order:2,  section:'血糖' },
  { id:'CHOL',     order:3,  section:'血脂' },
  { id:'TG',       order:4,  section:'血脂' },
  { id:'HDLC',     order:5,  section:'血脂' },
  { id:'LDL',      order:6,  section:'血脂' },
  { id:'BUN',      order:7,  section:'腎' },
  { id:'CREAT',    order:8,  section:'腎' },
  { id:'eGFR',     order:9,  section:'腎' },
  { id:'GOT',      order:10, section:'肝' },
  { id:'GPT',      order:11, section:'肝' },
  { id:'UA',       order:12, section:'其他' },
  { id:'UACR',     order:13, section:'腎' },
  { id:'GFRStage', order:14, section:'腎臟病分期' },
  { id:'EarlyCKD', order:15, section:'腎臟病分期' },
];

// ─── Exports (CommonJS + browser global) ─────────────────────────────────
// VIEWER_MANIFEST stays as the default array export so existing consumers
// (build-json.js, validate.js, index.js) keep working unchanged.
// VIEWER_A5_MANIFEST is attached as a property on the array — opt-in for
// the few consumers that need it.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VIEWER_MANIFEST;
  module.exports.VIEWER_A5_MANIFEST = VIEWER_A5_MANIFEST;
}
if (typeof window !== 'undefined') {
  window.HOSPITAL_LAB_PATTERNS_VIEWER_MANIFEST    = VIEWER_MANIFEST;
  window.HOSPITAL_LAB_PATTERNS_VIEWER_A5_MANIFEST = VIEWER_A5_MANIFEST;
}
