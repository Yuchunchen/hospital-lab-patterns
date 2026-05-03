'use strict';

/**
 * viewer.js — Outpatient lab catalog used by hospital-lab-viewer
 * (Chrome extension that produces A4 patient-education handouts).
 *
 * Source of truth: this file. Replaces the inline TEST_MAP that previously
 * lived in hospital-lab-viewer/mapping.js.
 *
 * See ../README.md for the schema, ../docs/learning-workflow.md for how
 * to add new entries with Claude's help.
 */

const VIEWER_CATALOG = [

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════════════════════════════════

  // ── Col 1 │ 血糖 ──────────────────────────────────────────────────────
  { id:'Glucose',
    pattern: /(?:Glucose(?:\([^)]*\))?|GLU[\s-]*(?:AC)?|Sugar(?:\([^)]*\))?|AC[\s-]*Sugar|飯前血糖):\s*([\d.]+)/i,
    page:1, col:1, section:'血糖',
    displayName:'空腹血糖 (AC Sugar)', ref:'74–100 mg/dL',
    meaning:'', hi:100, lo:74 },

  { id:'HbA1C',
    pattern: /HBA[I1]C%?:\s*([\d.]+)/i,
    page:1, col:1, section:'血糖',
    displayName:'糖化血色素 (HbA1c)', ref:'4–6 %',
    meaning:'', hi:6, lo:null },

  // ── Col 1 │ 血脂肪 ────────────────────────────────────────────────────
  { id:'CHOL',
    pattern: /CHOL:\s*([\d.]+)/,
    page:1, col:1, section:'血脂肪',
    displayName:'總膽固醇 (Cholesterol)', ref:'< 200 mg/dL',
    meaning:'', hi:200, lo:null },

  { id:'HDLC',
    pattern: /HDLC:\s*([\d.]+)/,
    page:1, col:1, section:'血脂肪',
    displayName:'高密度膽固醇 (HDL)', ref:'男 >40 mg/dL',
    meaning:'俗稱「好膽固醇」', hi:null, lo:40 },

  { id:'LDL',
    pattern: /LDL-C:\s*([\d.]+)/,
    page:1, col:1, section:'血脂肪',
    displayName:'低密度膽固醇 (LDL)', ref:'< 130 mg/dL',
    meaning:'俗稱「壞膽固醇」', hi:130, lo:null },

  { id:'TG',
    pattern: /Triglyceride:\s*([\d.]+)/,
    page:1, col:1, section:'血脂肪',
    displayName:'三酸甘油脂 (TG)', ref:'< 150 mg/dL',
    meaning:'', hi:150, lo:null },

  // ── Col 1 │ 肝功能 ────────────────────────────────────────────────────
  { id:'GOT',
    pattern: /GOT:\s*([\d.]+)/,
    page:1, col:1, section:'肝功能',
    displayName:'天門冬胺酸轉氨酶 (GOT / AST)', ref:'5–34 U/L',
    meaning:'', hi:34, lo:null },

  { id:'GPT',
    pattern: /GPT:\s*([\d.]+)/,
    page:1, col:1, section:'肝功能',
    displayName:'丙胺酸轉氨酶 (GPT / ALT)', ref:'男<45，女<34 U/L',
    meaning:'', hi:45, lo:null },

  { id:'RGT',
    pattern: /(?:r-?GT|R-?GT|γ-?GT|GGT|RGT):\s*([\d.]+)/i,
    page:1, col:1, section:'肝功能',
    displayName:'γ-麩胺醯轉移酶 (r-GT / GGT)', ref:'男 < 55，女 < 38 U/L',
    meaning:'', hi:55, lo:null },

  { id:'ALKP',
    pattern: /(?:Alk[\s.\-]*P|ALP|Alkaline\s*Phosphatase):\s*([\d.]+)/i,
    page:1, col:1, section:'肝功能',
    displayName:'鹼性磷酸酶 (Alk-P / ALP)', ref:'40–130 U/L',
    meaning:'', hi:130, lo:40 },

  // ── Col 2 │ 腎功能 ────────────────────────────────────────────────────
  { id:'BUN',
    pattern: /BUN:\s*([\d.]+)/,
    page:1, col:2, section:'腎功能',
    displayName:'血尿素氮 (BUN)', ref:'男 8.9–20.6，女 7.0–18.7 mg/dL',
    meaning:'', hi:25.7, lo:null },

  // 2026-05-03: BUNPre / BUNPost (section 腎功能（透析）) removed from viewer
  // catalog. Pre/post-dialysis BUN tracking + URR computation are
  // dialysis-specific and live in patterns/reporter.js for the dialysis app.

  { id:'CREAT',
    pattern: /(?:Creatinine\(serum\)|CREAT):\s*([\d.]+)/i,
    page:1, col:2, section:'腎功能',
    displayName:'肌酸酐 (Creatinine, Cr)', ref:'男 0.6–1.2，女 0.5–1.0 mg/dL',
    meaning:'', hi:1.2, lo:null },

  { id:'UA',
    pattern: /(?:UA|Uric\s*acid):\s*([\d.]+)/i,
    page:1, col:2, section:'腎功能',
    displayName:'尿酸 (Uric acid, UA)', ref:'男 3.3–7.7，女 2.5–6.2 mg/dL',
    meaning:'', hi:7.7, lo:null },

  { id:'eGFR',
    computed:'eGFR',
    pattern: /(?:Creatinine\(serum\)|CREAT):\s*([\d.]+)/i,
    page:1, col:2, section:'腎功能',
    displayName:'腎絲球過濾率 (eGFR)', ref:'> 60 mL/min/1.73m²',
    meaning:'腎功能指標', hi:null, lo:60 },

  { id:'UACR',
    pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr):\s*([\d.]+)/i,
    page:1, col:2, section:'腎功能',
    displayName:'尿白蛋白／肌酸酐比 (UACR)', ref:'< 30 mg/g',
    meaning:'腎臟早期傷害指標', hi:30, lo:null },

  { id:'UPCR',
    pattern: /(?:U-?PCR|UPCR|RATTC|TP\/Cr|Pr(?:otein)?\/Cr(?:eatinine)?|Urine\s*TP\/Cr):\s*([\d.]+)/i,
    page:1, col:2, section:'腎功能',
    displayName:'尿蛋白／肌酸酐比 (UPCR)', ref:'< 150 mg/g',
    meaning:'', hi:150, lo:null },

  // ── Col 2 │ 腎臟病分期 (computed) ────────────────────────────────────
  { id:'GFRStage',  computed:'GFRStage',  pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'GFR 分級 (正常, CKD2-5)', ref:'', meaning:'', hi:null, lo:null },

  { id:'UACRStage', computed:'UACRStage', pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'微蛋白尿(UACR)分級 (正常, A2-3)', ref:'', meaning:'', hi:null, lo:null },

  { id:'UPCRStage', computed:'UPCRStage', pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'蛋白尿(UPCR)分級 (正常/輕度/顯著/腎病)', ref:'', meaning:'', hi:null, lo:null },

  { id:'KDIGORisk', computed:'KDIGORisk', pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'腎臟病風險 (KDIGO, 低/中/高/極高)', ref:'', meaning:'', hi:null, lo:null },

  { id:'TaiwanCKD', computed:'TaiwanCKD', pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'慢性腎臟病分期 (正常, 第1~5期)', ref:'', meaning:'', hi:null, lo:null },

  { id:'EarlyCKD',  computed:'EarlyCKD',  pattern:null, page:1, col:2, section:'腎臟病分期',
    displayName:'健保 CKD 分群 (P1早期/P2中晚期)', ref:'', meaning:'', hi:null, lo:null },

  // ── Col 3 │ 血液 ──────────────────────────────────────────────────────
  { id:'RBC',
    pattern: /\bRBC:\s*([\d.]+)/,
    page:1, col:3, section:'血液',
    displayName:'紅血球 (RBC)', ref:'男 4.2–6.2，女 3.7–5.5 ×10⁶/µL',
    meaning:'', hi:6.2, lo:4.2 },

  { id:'WBC',
    // Negative lookahead rejects urine-routine ranges like "WBC: 0-5"
    pattern: /WBC:\s*([\d.]+)(?!\s*[-–]\s*\d)/,
    page:1, col:3, section:'血液',
    displayName:'白血球 (WBC)', ref:'5.0–10.0 ×10³/µL',
    meaning:'',
    normalize: v => v > 100 ? +(v / 1000).toFixed(1) : v,
    hi:10, lo:5.0 },

  { id:'Hb',
    pattern: /(?:Hb|HGB):\s*([\d.]+)/,
    page:1, col:3, section:'血液',
    displayName:'血色素 (Hemoglobin)', ref:'男 14–18，女 12–16 g/dL',
    meaning:'', hi:18, lo:14 },

  { id:'HCT',
    pattern: /HCT:\s*([\d.]+)/,
    page:1, col:3, section:'血液',
    displayName:'血比容 (HCT)', ref:'男 39–53，女 33–47 %',
    meaning:'', hi:53, lo:39 },

  { id:'MCV',
    pattern: /MCV:\s*([\d.]+)/,
    page:1, col:3, section:'血液',
    displayName:'平均紅血球容積 (MCV)', ref:'79–99 fL',
    meaning:'', hi:99, lo:79 },

  { id:'Platelet',
    pattern: /Platelet:\s*([\d.]+)/,
    page:1, col:3, section:'血液',
    displayName:'血小板 (Platelet)', ref:'150–400 ×10³/µL',
    meaning:'',
    normalize: v => v > 1000 ? +(v / 1000).toFixed(0) : v,
    hi:400, lo:150 },

  // ── Col 3 │ 營養／電解質 ──────────────────────────────────────────────
  // 2026-05-03: pruned to outpatient-relevant nutrition markers per user
  // request. Removed entries (TP, Cl, Ca, P, TIBC, TSAT, Ferritin, iPTH)
  // remain available in patterns/reporter.js for the dialysis project.
  { id:'Albumin',
    // Boundary requirement so we don't match "U-Albumin:" / "Microalbumin:"
    pattern: /(?:^|[\s;])Albumin(?:\([^)]*\))?:\s*([\d.]+)/i,
    page:1, col:3, section:'營養／電解質',
    displayName:'白蛋白 (Albumin)', ref:'3.5–5.0 g/dL',
    meaning:'營養狀態指標', hi:5.0, lo:3.5 },

  { id:'NA',
    pattern: /NA\(Serum\):\s*([\d.]+)/,
    page:1, col:3, section:'營養／電解質',
    displayName:'鈉 (Na)', ref:'136–145 mmol/L',
    meaning:'', hi:145, lo:136 },

  { id:'K',
    pattern: /K \(Serum\):\s*([\d.]+)/,
    page:1, col:3, section:'營養／電解質',
    displayName:'鉀 (K)', ref:'3.5–5.1 mmol/L',
    meaning:'', hi:5.1, lo:3.5 },

  { id:'FreeCa',
    pattern: /Free Ca\+\+:\s*([\d.]+)/,
    page:1, col:3, section:'營養／電解質',
    displayName:'游離鈣 (Free Ca)', ref:'1.15–1.32 mmol/L',
    meaning:'', hi:1.32, lo:1.15 },

  { id:'FE',
    pattern: /FE:\s*([\d.]+)/,
    page:1, col:3, section:'營養／電解質',
    displayName:'血清鐵 (Fe)', ref:'男 65–175，女 50–170 µg/dL',
    meaning:'', hi:175, lo:65 },

  { id:'VitB12',
    pattern: /(?:Vit(?:amin)?\.?\s*B12|VIT\.?\s*B12|B12):\s*([\d.]+)/i,
    page:1, col:3, section:'營養／電解質',
    displayName:'維生素 B12 (Vit. B12)', ref:'187–883 pg/mL',
    meaning:'', hi:883, lo:187 },

  { id:'FolicAcid',
    pattern: /(?:Folic\s+acid|Folate):\s*([\d.]+)/i,
    page:1, col:3, section:'營養／電解質',
    displayName:'葉酸 (Folic Acid)', ref:'3.1–20.5 ng/mL',
    meaning:'', hi:20.5, lo:3.1 },

  // ── Col 4 │ 癌症指數 ─────────────────────────────────────────────────
  { id:'AFP',
    pattern: /AFP:\s*([<>]?[\d.]+)/,
    page:1, col:4, section:'癌症指數',
    displayName:'甲胎蛋白 (AFP)', ref:'< 20 ng/mL（肝臟）',
    meaning:'', hi:20, lo:null },

  { id:'CEA',
    pattern: /CEA:\s*([<>]?[\d.]+)/,
    page:1, col:4, section:'癌症指數',
    displayName:'癌胚抗原 (CEA)', ref:'< 5 ng/mL（大腸直腸）',
    meaning:'', hi:5, lo:null },

  { id:'CA199',
    pattern: /CA.?19.?9:\s*([<>]?[\d.]+)/i,
    page:1, col:4, section:'癌症指數',
    displayName:'CA-199', ref:'< 37 U/mL（胰臟、膽道）',
    meaning:'', hi:37, lo:null },

  { id:'PSA',
    pattern: /\bPSA:\s*([\d.]+)/,
    page:1, col:4, section:'癌症指數',
    displayName:'攝護腺特異抗原 (PSA)', ref:'< 4 ng/mL（男性／攝護腺）',
    meaning:'', gender:'M', hi:4, lo:null },

  { id:'FreePSA',
    pattern: /(?:Free PSA|RATIO):\s*([\d.]+)/,
    page:1, col:4, section:'癌症指數',
    displayName:'游離 PSA (Free PSA)', ref:'',
    meaning:'', gender:'M', hi:null, lo:null },

  { id:'PSARatio',
    computed:'PSARatio', pattern:null,
    page:1, col:4, section:'癌症指數',
    displayName:'Free/Total PSA 比值', ref:'>25% 正常，10-25% 注意，<10% 警示',
    meaning:'PSA>4 時參考此比值', gender:'M', hi:null, lo:null },

  { id:'CA125',
    pattern: /CA[-\s.]?125:\s*([<>]?[\d.]+)/i,
    page:1, col:4, section:'癌症指數',
    displayName:'CA-125', ref:'< 35 U/mL（女性／卵巢）',
    meaning:'', gender:'F', hi:35, lo:null },

  // ── Col 4 │ 甲狀腺 ───────────────────────────────────────────────────
  { id:'TSH',
    pattern: /TSH:\s*([\d.]+)/,
    page:1, col:4, section:'甲狀腺',
    displayName:'促甲狀腺刺激素 (TSH)', ref:'0.35–4.94 µIU/mL',
    meaning:'', hi:4.94, lo:0.35 },

  { id:'FreeT4',
    pattern: /Free T4:\s*([\d.]+)/,
    page:1, col:4, section:'甲狀腺',
    displayName:'游離甲狀腺素 (Free T4)', ref:'0.7–1.48 ng/dL',
    meaning:'', hi:1.48, lo:0.7 },

  // ── Col 4 │ 肝炎 ─────────────────────────────────────────────────────
  { id:'DBIL',
    pattern: /D-BIL:\s*([\d.]+)/,
    page:1, col:4, section:'肝炎',
    displayName:'膽紅素 (D-BIL)', ref:'0.03–0.18 mg/dL',
    meaning:'', hi:0.18, lo:null },

  { id:'TBIL',
    pattern: /T-BIL:\s*([\d.]+)/,
    page:1, col:4, section:'肝炎',
    displayName:'總膽紅素 (T-BIL)', ref:'0.3–1.0 mg/dL',
    meaning:'', hi:1.0, lo:null },

  { id:'HCV',
    computed:'HCV', pattern:null, singleValue:true,
    page:1, col:4, section:'肝炎',
    displayName:'C型肝炎', ref:'', meaning:'', hi:null, lo:null },

  { id:'HBsAg',
    computed:'HBsAg', pattern:null, singleValue:true,
    page:1, col:4, section:'肝炎',
    displayName:'B型肝炎', ref:'', meaning:'', hi:null, lo:null },

  { id:'AntiHBs',
    computed:'AntiHBs', pattern:null, singleValue:true,
    page:1, col:4, section:'肝炎',
    displayName:'B型肝炎抗體 (Anti-HBs)', ref:'', meaning:'', hi:null, lo:null },

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 2 — text-block entries (DEXA / endoscopy / sono / HIV section)
  // ══════════════════════════════════════════════════════════════════════
  { id:'BoneDensity',
    kind:'text',
    orderNameMatch: /骨(?:質|密|鬆)|DEXA|BMD|Bone\s*Density|T[-\s]?score/i,
    rows: [
      { label:'AI分析',
        fields:[{ name:'T分數', pattern:/AI[^0-9\-]{0,15}(-?\d+\.?\d*)/i }],
        options:['疏鬆','缺損','正常'] },
      { label:'腰椎',
        fields:[{ name:'T分數', pattern:/(?:腰椎|Lumbar|L[\s-]?spine|L1-?L4)[^0-9\-]{0,15}(-?\d+\.?\d*)/i }],
        options:['疏鬆','缺損','正常'] },
      { label:'髖關節',
        fields:[{ name:'T分數', pattern:/(?:髖(?:關節)?|Hip|Femoral|Femur)[^0-9\-]{0,15}(-?\d+\.?\d*)/i }],
        options:['疏鬆','缺損','正常'] },
    ],
    page:2, col:1, section:'骨質疏鬆 (Bone Density)',
    displayName:'骨密度' },

  { id:'Endoscopy',
    kind:'text',
    orderNameMatch: /胃鏡|內視鏡|UGI|Endoscop|Gastroscop|EGD|Panendoscop/i,
    rows: [
      { label:'上消化道', options:['胃食道逆流','胃潰瘍','十二指腸潰瘍'], trailing:'胃藥治療' },
      { label:'細菌',     options:['胃幽門桿菌'],                            trailing:'三合一治療' },
    ],
    page:2, col:2, section:'胃鏡 (Endoscopy)',
    displayName:'上消化道內視鏡' },

  { id:'AbdSono',
    kind:'text',
    orderNameMatch: /超音波|Sonograph|Ultrasound|Abd.*Echo|Abdominal\s*US|腹部.*US/i,
    rows: [
      { label:'肝臟', options:['正常','脂肪肝','水泡','血管瘤'] },
      { label:'膽',   options:['正常','膽結石','膽息肉'] },
      { label:'右腎', options:['正常','水泡','萎縮','結石'] },
      { label:'左腎', options:['正常','水泡','萎縮','結石'] },
    ],
    page:2, col:3, section:'超音波 (Ultrasound)',
    displayName:'腹部超音波' },

  // ── Page 2 │ HIV section (only when checkbox is on) ───────────────
  { id:'HIVLoad',
    pattern: /HIV virus load:\s*([\d,.]+)/,
    page:2, col:3, section:'HIV',
    displayName:'HIV 病毒量 (Viral Load)', ref:'',
    meaning:'', hivOnly:true, hi:null, lo:null },

  { id:'CD4',
    pattern: /LEU3AN:\s*([\d.]+)/,
    page:2, col:3, section:'HIV',
    displayName:'CD4 淋巴球 (LEU3AN)', ref:'',
    meaning:'', hivOnly:true, hi:null, lo:null },

  { id:'RPR',
    computed:'RPR', pattern:null, singleValue:true,
    page:2, col:3, section:'HIV',
    displayName:'RPR 梅毒篩檢', ref:'',
    meaning:'', hivOnly:true, hi:null, lo:null },

  { id:'TPHA',
    computed:'TPHA', pattern:null, singleValue:true,
    page:2, col:3, section:'HIV',
    displayName:'TPHA梅毒血球凝集試驗', ref:'',
    meaning:'', hivOnly:true, hi:null, lo:null },

];

// ─── Exports (CommonJS + browser global) ─────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VIEWER_CATALOG;
}
if (typeof window !== 'undefined') {
  window.HOSPITAL_LAB_PATTERNS_VIEWER = VIEWER_CATALOG;
}
