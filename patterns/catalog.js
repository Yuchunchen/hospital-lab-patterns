'use strict';

/**
 * catalog.js — Master human-readable catalog of every lab/imaging entry
 * we know how to detect from the ernode API.
 *
 * Goals:
 *   1. Single source of truth: every test pattern lives here ONCE.
 *   2. Human-readable: organised by clinical category with comments.
 *   3. Universal fields only — NO app-specific layout (page/col/section/cat).
 *      Each consuming app (viewer / reporter) has its own manifest that
 *      picks ids from this catalog and adds layout / overrides.
 *
 * "Track-only" patterns (detect but don't render anywhere) just live here
 * and aren't referenced by any manifest.
 *
 * See ../docs/pattern-spec.md for field definitions, ../docs/learning-workflow.md
 * for the Claude-driven recipe to add new entries.
 */

const CATALOG = [

  // ═══════════════════════════════════════════════════════════════════════
  // HEMATOLOGY (CBC)
  // ═══════════════════════════════════════════════════════════════════════

  { id:'WBC',
    pattern: /WBC:\s*([<>]?\s*[\d.]+)(?!\s*[-–]\s*\d)/,
    displayName:'白血球 (WBC)', shortLabel:'WBC',
    unit:'×10³/µL', category:'血液',
    ref:'4.0–11.0 ×10³/µL',
    refLo:4.0, refHi:11.0, hi:11, lo:4,
    normalize: 'wbcCount',
    notes:'Negative lookahead in pattern rejects urine routine "WBC: 0-5". Normalize handles /µL (e.g. 6700) → ×10³/µL (6.7).',
    refHistory: [
      { machine:'*', refLo:4, refHi:11, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:5, refHi:10, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:4, refHi:11, validFrom:'1900-01-01', source:'gap-fill single-report 000070213G @2026-06-12 (4.0-11.0 ×10³/µL,obs 1;= universal)' },
    ] },

  { id:'RBC',
    pattern: /\bRBC:\s*([<>]?\s*[\d.]+)(?!\s*[-–]\s*\d)/,
    displayName:'紅血球 (RBC)', shortLabel:'RBC',
    unit:'×10⁶/µL', category:'血液',
    ref:'男 4.2–6.2，女 3.7–5.5 ×10⁶/µL',
    refLo:3.7, refHi:6.2,
    loM:4.2, hiM:6.2, loF:3.7, hiF:5.5,
    lo:3.7, hi:6.2,
    notes:'Negative lookahead rejects urine routine "RBC: 0-2/HPF" ranges (2026-05-12, parallel to WBC). vhyl 000012148C surfaced URINE ROUTINE(YL) "RBC: 0-2" being captured as blood RBC=0.',
    refHistory: [
      { machine:'*', refLo:3.7, refHi:6.2, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:4.2, refHi:6, refLoM:4.5, refHiM:6, refLoF:4.2, refHiF:5.5, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
    ] },

  { id:'Hb',
    pattern: /(?:Hb|HGB):\s*([<>]?\s*[\d.]+)/,
    displayName:'血色素 (Hemoglobin)', shortLabel:'Hb',
    unit:'g/dL', category:'血液',
    ref:'男 14–18，女 12–16 g/dL',
    refLo:12, refHi:18,
    loM:14, hiM:18, loF:12, hiF:16,
    lo:12, hi:18,
    notes:'Pattern matches both "Hb:" and "HGB:" labels.',
    refHistory: [
      { machine:'*', refLo:12, refHi:18, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:12.3, refHi:18.3, refLoM:12.3, refHiM:18.3, refLoF:11.3, refHiF:15.3, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改;原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:12, refHi:18, refLoM:14, refHiM:18, refLoF:12, refHiF:16, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
    ] },

  { id:'HCT',
    pattern: /HCT:\s*([<>]?\s*[\d.]+)/,
    displayName:'血比容 (HCT)', shortLabel:'HCT',
    unit:'%', category:'血液',
    ref:'男 39–53，女 33–47 %',
    refLo:33, refHi:53,
    loM:39, hiM:53, loF:33, hiF:47,
    lo:33, hi:53,
    refHistory: [
      { machine:'*', refLo:33, refHi:53, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:38, refHi:54, refLoM:40, refHiM:54, refLoF:38, refHiF:47, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:33, refHi:53, refLoM:39, refHiM:53, refLoF:33, refHiF:47, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 男39-53 女33-47 穩定)' },
    ] },

  { id:'MCV',
    pattern: /MCV:\s*([<>]?\s*[\d.]+)/,
    displayName:'平均紅血球容積 (MCV)', shortLabel:'MCV',
    unit:'fL', category:'血液',
    ref:'79–99 fL',
    refLo:79, refHi:99, hi:99, lo:79,
    refHistory: [
      { machine:'*', refLo:79, refHi:99, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:80, refHi:96, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:79, refHi:99, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定單版 2020→2026)' },
    ] },

  { id:'Platelet',
    pattern: /(?:Platelet|PLATE):\s*([<>]?\s*[\d.]+)/,
    displayName:'血小板 (Platelet)', shortLabel:'PLT',
    unit:'×10³/µL', category:'血液',
    ref:'150–400 ×10³/µL',
    refLo:150, refHi:400, hi:400, lo:150,
    normalize: 'plateletCount',
    notes:'Normalize handles /µL (e.g. 250000) → ×10³/µL (250).',
    refHistory: [
      { machine:'*', refLo:150, refHi:400, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:120, refHi:320, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改;原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:150, refHi:400, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
    ] },

  // DC 五分類百分比 (differential count, %) — vhyl + vhtt 雙家
  // vhyl: order DC(YL),mnemonic NEUT/LYM/MONO/EOSINO/BASO,值各自一行。
  // vhtt: order Differential Count(D.C),mnemonic Neutrophil / Lymophocyte(EHR 拼字,
  //       非 Lymphocyte)/ Monocyte / Eosinophil / BASO|Basophil(兩變體都見過);reportText run-on 無分隔
  //       (值後直接接下個 label,如 ...Monocyte: 4.4Neutrophil: 73.9...)。
  // 故移除 `\b`:run-on 下「數字接字母」中間無 word boundary,留 `\b` 會抓不到。
  // 改走 CBC 同慣例(HCT/MCV/Platelet 皆無 `\b`,靠「Label:」當分隔)。
  // display-only,永久不放參考值(YC 2026-06-18 取消 Open #2;DC 不做 alarm 上色)。
  // 真機驗證 vhtt(2026-06-18):000032118G / 000019606F(含更正報告)/ 000115014H 皆 BASO;
  //   000105589G 為 Basophil 變體 → Baso pattern 用 (?:BASO|Basophil)。其餘四項跨病人一致。
  { id:'Neut',
    pattern: /(?:NEUT|Neutrophil):\s*([<>]?\s*[\d.]+)/,
    displayName:'嗜中性球 (Neutrophil %)', shortLabel:'Neut%',
    unit:'%', category:'血液' },

  { id:'Lymph',
    pattern: /(?:LYM|Lymophocyte):\s*([<>]?\s*[\d.]+)/,
    displayName:'淋巴球 (Lymphocyte %)', shortLabel:'Lym%',
    unit:'%', category:'血液' },

  { id:'Mono',
    pattern: /(?:MONO|Monocyte):\s*([<>]?\s*[\d.]+)/,
    displayName:'單核球 (Monocyte %)', shortLabel:'Mono%',
    unit:'%', category:'血液' },

  { id:'Eos',
    pattern: /(?:EOSINO|Eosinophil):\s*([<>]?\s*[\d.]+)/,
    displayName:'嗜酸性球 (Eosinophil %)', shortLabel:'Eos%',
    unit:'%', category:'血液' },

  { id:'Baso',
    pattern: /(?:BASO|Basophil):\s*([<>]?\s*[\d.]+)/,
    displayName:'嗜鹼性球 (Basophil %)', shortLabel:'Baso%',
    unit:'%', category:'血液' },

  // ═══════════════════════════════════════════════════════════════════════
  // PROTEINS
  // ═══════════════════════════════════════════════════════════════════════

  { id:'TP',
    pattern: /Total protein\(serum\):\s*([<>]?\s*[\d.]+)/i,
    displayName:'總蛋白 (Total Protein)', shortLabel:'TP',
    unit:'g/dL', category:'蛋白質',
    ref:'6.0–8.3 g/dL',
    refLo:6.0, refHi:8.3, hi:8.3, lo:6.0,
    refHistory: [
      { machine:'*', refLo:6.0, refHi:8.3, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:6.6, refHi:8.7, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:6.4, refHi:8.3, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:6.0, refHi:8.3, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定;PROTEIN x1 異版捨)' },
    ] },

  { id:'Albumin',
    pattern: /(?:^|[\s;])Albumin(?:\([^)]*\))?:\s*([<>]?\s*[\d.]+)/i,
    displayName:'白蛋白 (Albumin)', shortLabel:'Alb',
    unit:'g/dL', category:'蛋白質',
    ref:'3.5–5.0 g/dL',
    refLo:3.5, refHi:5.0, hi:5.0, lo:3.5,
    meaning:'營養狀態指標',
    notes:'Boundary requirement (^ or whitespace/semicolon) prevents matching "U-Albumin:" or "Microalbumin:".',
    refHistory: [
      { machine:'*', refLo:3.5, refHi:5.0, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:3.97, refHi:4.94, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:3.5, refHi:5.2, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:3.5, refHi:5.0, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定單版 2020→2026)' },
    ] },

  // ═══════════════════════════════════════════════════════════════════════
  // LIVER FUNCTION
  // ═══════════════════════════════════════════════════════════════════════

  { id:'GOT',
    pattern: /GOT:\s*([<>]?\s*[\d.]+)/,
    displayName:'天門冬胺酸轉氨酶 (GOT / AST)', shortLabel:'GOT/AST',
    unit:'U/L', category:'肝功能',
    ref:'5–34 U/L',
    refLo:5, refHi:34, hi:34, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:34, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:13, refHi:39, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改;原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:0, refHi:40, refLoM:0, refHiM:40, refLoF:0, refHiF:32, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里 GOT v1(末見 2025-04-21)' },
      { machine:'vhyl', refLo:11, refHi:34, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里 GOT v2(2025-06-24→2025-12-26)' },
      { machine:'vhyl', refLo:5, refHi:34, validFrom:'2026-02-02', source:'time-dim rescan 2026-06-24 玉里 GOT v3(2026-02-02→;30pt full cohort;原誤標 2026-03-31)' },
    ] },

  { id:'GPT',
    pattern: /GPT:\s*([<>]?\s*[\d.]+)/,
    displayName:'丙胺酸轉氨酶 (GPT / ALT)', shortLabel:'GPT/ALT',
    unit:'U/L', category:'肝功能',
    ref:'男<45，女<34 U/L',
    refLo:7, refHi:45,
    hiM:45, hiF:34,
    hi:45, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:45, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:7, refHi:52, refLoM:7, refHiM:52, refLoF:7, refHiF:52, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版;原 2026-05-28 觸發日修為 migration base (vhtt 印 universal 7-52,inline 性別 mirror 是為了 suppress outer hiM:45/hiF:34 fallback)' },
      { machine:'vhyl', refLo:0, refHi:41, refLoM:0, refHiM:41, refLoF:0, refHiF:33, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:null, refHi:45, refHiM:45, refHiF:34, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
    ] },

  { id:'RGT',
    pattern: /(?:r-?GT|R-?GT|γ-?GT|GGT|RGT):\s*([<>]?\s*[\d.]+)/i,
    displayName:'γ-麩胺醯轉移酶 (r-GT / GGT)', shortLabel:'r-GT',
    unit:'U/L', category:'肝功能',
    ref:'男 < 55，女 < 38 U/L',
    refLo:0, refHi:55,
    hiM:55, hiF:38,
    hi:55, lo:null,
    notes:'Pattern matches r-GT, R-GT, γ-GT, GGT, RGT — hospitals use various labels.',
    refHistory: [
      { machine:'*', refLo:null, refHi:55, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:9, refHi:64, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort 僅 1 筆觀測(2025-12-16),證據薄;validFrom 用 migration base 取代觸發日 2026-06-18 — chartno 000015165F r-GT(TT) 9-64 IU/L(無性別分項)' },
      { machine:'vhyl', refLo:5, refHi:61, refLoM:8, refHiM:61, refLoF:5, refHiF:36, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 r-GT(M8-61,F5-36;末見 2025-04-10;30pt)' },
      { machine:'vhyl', refLo:null, refHi:55, refHiM:55, refHiF:38, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 r-GT(M<55,F<38;earliest 2025-06-16;30pt full cohort)' },
    ] },

  { id:'ALP',
    pattern: /(?:Alk[\s.\-]*P|ALP|Alkaline\s*Phosphatase):\s*([<>]?\s*[\d.]+)/i,
    displayName:'鹼性磷酸酶 (Alk-P / ALP)', shortLabel:'Alk-P',
    unit:'U/L', category:'肝功能',
    ref:'40–130 U/L',
    refLo:34, refHi:130, hi:130, lo:34,
    refHistory: [
      { machine:'*', refLo:34, refHi:130, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:34, refHi:104, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改;原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:35, refHi:129, refLoM:40, refHiM:129, refLoF:35, refHiF:104, validFrom:'1900-01-01', source:'auto-crawl time-version 玉里舊 ref(012885I 實掃 2024-08~2025-04-15);真正起始未知,用 1900 作 migration base' },
      { machine:'vhyl', refLo:46, refHi:122, refLoM:50, refHiM:116, refLoF:46, refHiF:122, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;30pt（full cohort）;前單掃 012885I 誤為 2025-09-22)' },
    ] },

  { id:'TBIL',
    pattern: /T-BIL:\s*([<>]?\s*[\d.]+)/,
    displayName:'總膽紅素 (T-BIL)', shortLabel:'T-BIL',
    unit:'mg/dL', category:'肝功能',
    ref:'0.3–1.0 mg/dL',
    refLo:0.3, refHi:1.0, hi:1.0, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:1.0, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:0, refHi:1.2, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:0.2, refHi:1.2, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:0.3, refHi:1.0, validFrom:'1900-01-01', source:'gap-fill single-report 000070213G @2026-06-12 (0.3-1.0 mg/dL,obs 1;= universal)' },
    ] },

  { id:'DBIL',
    pattern: /D-BIL:\s*([<>]?\s*[\d.]+)/,
    displayName:'直接膽紅素 (D-BIL)', shortLabel:'D-BIL',
    unit:'mg/dL', category:'肝功能',
    ref:'0.03–0.18 mg/dL',
    refLo:0.03, refHi:0.18, hi:0.18, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:0.18, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:0, refHi:0.3, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:0, refHi:0.5, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:0.03, refHi:0.18, validFrom:'1900-01-01', source:'gap-fill single-report 000070213G @2026-06-12 (0.03-0.18 mg/dL,obs 1;= universal)' },
    ] },

  // ═══════════════════════════════════════════════════════════════════════
  // LIPIDS
  // ═══════════════════════════════════════════════════════════════════════

  { id:'CHOL',
    pattern: /CHOL:\s*([<>]?\s*[\d.]+)/,
    displayName:'總膽固醇 (Cholesterol)', shortLabel:'CHOL',
    unit:'mg/dL', category:'血脂',
    ref:'< 200 mg/dL',
    refLo:null, refHi:200, hi:200, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:200, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:0, refHi:200, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:0, refHi:200, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定;CHOL+T.CHOL 同值 0-200)' },
    ] },

  { id:'HDLC',
    pattern: /HDLC:\s*([<>]?\s*[\d.]+)/,
    displayName:'高密度膽固醇 (HDL)', shortLabel:'HDL',
    unit:'mg/dL', category:'血脂',
    ref:'男 >40 mg/dL',
    refLo:40, refHi:null, hi:null, lo:40,
    meaning:'俗稱「好膽固醇」',
    refHistory: [
      { machine:'*', refLo:40, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:35, refHi:100, refLoM:35, refHiM:100, refLoF:55, refHiF:100, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:40, refHi:null, refLoM:40, refLoF:50, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:40, refHi:null, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 單邊 >40 穩定)' },
    ] },

  { id:'LDL',
    pattern: /LDL-C:\s*([<>]?\s*[\d.]+)/,
    displayName:'低密度膽固醇 (LDL)', shortLabel:'LDL-C',
    unit:'mg/dL', category:'血脂',
    ref:'< 130 mg/dL',
    refLo:null, refHi:130, hi:130, lo:null,
    meaning:'俗稱「壞膽固醇」',
    refHistory: [
      { machine:'*', refLo:null, refHi:130, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:0, refHi:140, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改;原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:0, refHi:100, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
    ] },

  { id:'TG',
    pattern: /Triglyceride:\s*([<>]?\s*[\d.]+)/,
    displayName:'三酸甘油脂 (Triglyceride)', shortLabel:'TG',
    unit:'mg/dL', category:'血脂',
    ref:'< 150 mg/dL',
    refLo:null, refHi:150, hi:150, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:150, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:0, refHi:150, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:0, refHi:150, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定單版 2020→2026)' },
    ] },

  // ═══════════════════════════════════════════════════════════════════════
  // GLUCOSE
  // ═══════════════════════════════════════════════════════════════════════

  { id:'GluAC',
    // 2026-05-08: bare-Glucose alternation tightened to require the
    // parenthetical site qualifier (Glucose(AC-serum), Glucose(serum), ...).
    // The previous pattern's optional `\([^)]*\)?` was matching urine-routine
    // lines like "Glucose: 4+" inside CHEM EXAM(TT) reports — the [\d.]+
    // capture grabbed the leading 4 of "4+", storing GluAC = 4 mg/dL.
    // Verified bad case: vhtt 000026353G 115/02/26 (urine Glucose: 4+, but
    // serum AC sugar that day was 80). The new alternation only matches
    // Glucose when followed by `(...)`, so urine Glucose: 4+ is rejected.
    // Other label forms (GLU / GLU-AC / Sugar / 飯前血糖) are unaffected.
    pattern: /(?:Glucose\([^)]*\)|GLU[\s-]*(?:AC)?|Sugar(?:\([^)]*\))?|AC[\s-]*Sugar|飯前血糖):\s*([<>]?\s*[\d.]+)(?!\s*\+)/i,
    displayName:'空腹血糖 (AC Sugar)', shortLabel:'空腹血糖',
    unit:'mg/dL', category:'血糖',
    ref:'74–100 mg/dL',
    refLo:74, refHi:100, hi:100, lo:74,
    notes:'Matches Glucose(<site>), GLU, GLU-AC, Sugar(<site>), AC Sugar, 飯前血糖. Bare "Glucose:" intentionally NOT matched — urine routine Glucose: 4+ would otherwise capture "4" as a serum mg/dL value. 2026-05-12: also reject `+`-qualified gradient values (vhyl URINE ROUTINE(YL) GLU: 4+ was capturing 4).',
    refHistory: [
      { machine:'*', refLo:74, refHi:100, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:74, refHi:106, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改(AC:前綴/單位格式變體已收斂);原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:74, refHi:106, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:74, refHi:100, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
    ] },

  { id:'HbA1c',
    pattern: /HBA[I1]C%?:\s*([<>]?\s*[\d.]+)/i,
    displayName:'糖化血色素 (HbA1c)', shortLabel:'HbA1c',
    unit:'%', category:'血糖',
    ref:'4–6 %',
    refLo:4, refHi:6, hi:6, lo:null,
    notes:'Pattern allows HBA1C and HBAIC (some systems print I instead of 1).',
    refHistory: [
      { machine:'*', refLo:null, refHi:6, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:4.3, refHi:5.8, validFrom:'2026-05-28', source:'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:4, refHi:6, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
    ] },

  // ═══════════════════════════════════════════════════════════════════════
  // RENAL FUNCTION
  // ═══════════════════════════════════════════════════════════════════════

  { id:'BUN',
    pattern: /BUN:\s*([<>]?\s*[\d.]+)/,
    displayName:'血尿素氮 (BUN)', shortLabel:'BUN',
    unit:'mg/dL', category:'腎功能',
    ref:'男 8.9–20.6，女 7.0–18.7 mg/dL',
    refLo:7, refHi:25,
    hiM:20.6, hiF:18.7,
    hi:25.7, lo:null,
    notes:'Fallback hi:25.7 is the original soft buffer for unknown gender; known-gender uses hiM/hiF for precision.',
    refHistory: [
      { machine:'*', refLo:null, refHi:25.7, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:7, refHi:25, refLoM:7, refHiM:25, refLoF:7, refHiF:25, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版;原 2026-05-28 觸發日修為 migration base (vhtt 印 universal 7-25,inline 性別 mirror 是為了 suppress outer hiM:20.6/hiF:18.7 fallback)' },
      { machine:'vhyl', refLo:6, refHi:23, refLoM:6, refHiM:23, refLoF:6, refHiF:23, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 BUN(6-23,無年齡/性別;inline mirror suppress 外層 hiM:20.6/hiF:18.7;末見 2025-04-21)' },
      { machine:'vhyl', refLo:7, refHi:20.6, refLoM:8.9, refHiM:20.6, refLoF:7, refHiF:18.7, ageMax:49, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 BUN <50y(earliest 2025-06-04;原誤標 2026-03-31)' },
      { machine:'vhyl', refLo:8.4, refHi:25.7, refLoM:8.4, refHiM:25.7, refLoF:9.8, refHiF:20.1, ageMin:50, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 BUN >=50y(earliest 2025-06-04;原誤標 2026-03-31)' },
    ] },

  // BUN_pre / BUN_post — dialysis-specific. Only the reporter uses these.
  // The orderNameFilter discriminates pre-dialysis (composite panel
  // containing comma in orderName) from post-dialysis (standalone "BUN" order).
  { id:'BUN_pre',
    pattern: /BUN:\s*([<>]?\s*[\d.]+)/,
    orderNameFilter: /,/,
    displayName:'BUN（洗前）', shortLabel:'BUN(洗前)',
    unit:'mg/dL', category:'腎功能',
    ref:'7–25 mg/dL',
    refLo:7, refHi:25, hi:25, lo:7,
    meaning:'透析前 BUN — 與 BUN_post 配對計算 URR',
    notes:'Filter selects orders whose orderName contains a comma (composite dialysis panel).' },

  { id:'BUN_post',
    pattern: /BUN:\s*([<>]?\s*[\d.]+)/,
    orderNameFilter: /^BUN$/i,
    displayName:'BUN（洗後）', shortLabel:'BUN(洗後)',
    unit:'mg/dL', category:'腎功能',
    ref:'',
    refLo:null, refHi:null, hi:null, lo:null,
    meaning:'透析後 BUN — 通常 6–7，與 BUN_pre 配對計算 URR',
    notes:'Filter selects orders where orderName is exactly "BUN" (standalone post-dialysis draw).' },

  { id:'CREAT',
    pattern: /(?:Creatinine\(serum\)|CREAT):\s*([<>]?\s*[\d.]+)/i,
    displayName:'肌酸酐 (Creatinine, Cr)', shortLabel:'Cr',
    unit:'mg/dL', category:'腎功能',
    ref:'男 0.6–1.2，女 0.5–1.0 mg/dL',
    refLo:0.5, refHi:1.3,
    hiM:1.2, hiF:1.0,
    hi:1.2, lo:null,
    notes:'Pattern matches "Creatinine(serum):" and "CREAT:" but NOT "Creatinine(24hrs Urine):".',
    refHistory: [
      { machine:'*', refLo:null, refHi:1.2, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:0.6, refHi:1.3, refLoM:0.7, refHiM:1.3, refLoF:0.6, refHiF:1.2, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort(19pt)確認穩定單版 2020→2026 未改(血清;尿Cr排除);原 2026-05-28 觸發日修為 migration base — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:0.5, refHi:1.2, refLoM:0.7, refHiM:1.2, refLoF:0.5, refHiF:0.9, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:0.5, refHi:1.2, refLoM:0.6, refHiM:1.2, refLoF:0.5, refHiF:1, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
    ] },

  { id:'UA',
    pattern: /(?:UA|Uric\s*acid):\s*([<>]?\s*[\d.]+)/i,
    displayName:'尿酸 (Uric acid, UA)', shortLabel:'UA',
    unit:'mg/dL', category:'腎功能',
    ref:'男 3.3–7.7，女 2.5–6.2 mg/dL',
    refLo:2.5, refHi:7.7,
    hiM:7.7, hiF:6.2,
    hi:7.7, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:7.7, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:2.3, refHi:7.6, refLoM:4.4, refHiM:7.6, refLoF:2.3, refHiF:6.6, validFrom:'2026-05-28', source:'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:2.4, refHi:7, refLoM:3.4, refHiM:7, refLoF:2.4, refHiF:5.7, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:2.5, refHi:7.7, refLoM:3.3, refHiM:7.7, refLoF:2.5, refHiF:6.2, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
    ] },

  { id:'eGFR',
    pattern: /(?:Creatinine\(serum\)|CREAT):\s*([<>]?\s*[\d.]+)/i,
    computed:'eGFR',
    displayName:'腎絲球過濾率 (eGFR)', shortLabel:'eGFR',
    unit:'mL/min/1.73m²', category:'腎功能',
    ref:'> 60 mL/min/1.73m²',
    refLo:60, refHi:null, hi:null, lo:60,
    meaning:'腎功能指標',
    notes:'Computed from Creatinine via CKD-EPI 2021 (race-free). Pattern shares Creatinine capture so the same regex works.' },

  { id:'UACR',
    // `RATIO` alternation 補抓 vhtt 110 年中以前舊格式 Urine Microalbumin
    // 報告（label `RATIO: N` 而非新格式 `ALB/CR: N`）。`RATIO:` 也出現在
    // Free PSA 報告，故必須以 `orderNameFilter` 限制在 microalbumin order
    // 內才匹配（FreePSA 那邊也已有對稱的 orderNameFilter）。
    pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr|RATIO):\s*([<>]?\s*[\d.]+)/i,
    orderNameFilter: /microalbumin/i,
    displayName:'尿白蛋白／肌酸酐比 (UACR)', shortLabel:'UACR',
    unit:'mg/g', category:'腎功能',
    ref:'< 30 mg/g',
    refLo:null, refHi:30, hi:30, lo:null,
    meaning:'腎臟早期傷害指標',
    subpage: {
      // Opt-in to enrichMissingValues sub-page chase. orderName signals
      // that the order is a urine albumin/creatinine panel — broader than
      // strict matching to handle vhyl/vhtt naming variants.
      orderNameMatch: /U-?ACR|UACR|microalbumin|micro-?albumin|urine\s*alb|albumin\/cr|alb\/cr|尿.*白蛋白|微量白蛋白/i,
      // No resultPattern: UACR sub-page already carries the main "UACR:" label.
    },
    notes:'Viewer fetches sub-pages from opdweb (1-year window) when UACR not in main reportText. Sub-page chase opt-in via subpage.orderNameMatch (broad urine regex).' },

  { id:'UPCR',
    // T.PROT/CREAT alternation added 2026-05-08 (Phase 3 CKD): vhtt's
    // Urine total protein(TT) inline reportText uses "T.PROT/CREAT: <值>"
    // (verified across 45+ vhtt patients); RATTC was vhyl-only / legacy.
    // The optional period in T\.? handles both `T.PROT/CREAT` and `TPROT/CREAT`.
    pattern: /(?:U-?PCR|UPCR|RATTC|T\.?PROT\/CREAT|TP\/Cr|Pr(?:otein)?\/Cr(?:eatinine)?|Urine\s*TP\/Cr):\s*([<>]?\s*[\d.]+)/i,
    displayName:'尿蛋白／肌酸酐比 (UPCR)', shortLabel:'UPCR',
    unit:'mg/g', category:'腎功能',
    ref:'< 150 mg/g',
    refLo:null, refHi:150, hi:150, lo:null,
    notes:'RATTC = vhyl/legacy; T.PROT/CREAT = vhtt (Urine total protein inline). Both produce the same numeric ratio.' },

  // ═══════════════════════════════════════════════════════════════════════
  // KIDNEY DISEASE STAGING (computed)
  // ═══════════════════════════════════════════════════════════════════════

  { id:'GFRStage',  computed:'GFRStage',  pattern:null,
    displayName:'GFR 分級 (正常, CKD2-5)', category:'腎臟病分期' },

  { id:'UACRStage', computed:'UACRStage', pattern:null,
    displayName:'微蛋白尿(UACR)分級 (正常, A2-3)', category:'腎臟病分期' },

  { id:'UPCRStage', computed:'UPCRStage', pattern:null,
    displayName:'蛋白尿(UPCR)分級 (正常/輕度/顯著/腎病)', category:'腎臟病分期' },

  { id:'KDIGORisk', computed:'KDIGORisk', pattern:null,
    displayName:'腎臟病風險 (KDIGO, 低/中/高/極高)', category:'腎臟病分期' },

  { id:'TaiwanCKD', computed:'TaiwanCKD', pattern:null,
    displayName:'慢性腎臟病分期 (正常, 第1~5期)', category:'腎臟病分期' },

  { id:'EarlyCKD',  computed:'EarlyCKD',  pattern:null,
    displayName:'健保 CKD 分群 (P1早期/P2中晚期)', category:'腎臟病分期' },

  // ═══════════════════════════════════════════════════════════════════════
  // ELECTROLYTES
  // ═══════════════════════════════════════════════════════════════════════

  { id:'Na',
    pattern: /NA\(Serum\):\s*([<>]?\s*[\d.]+)/,
    displayName:'鈉 (Na)', shortLabel:'Na',
    unit:'mmol/L', category:'電解質',
    ref:'136–145 mmol/L',
    refLo:136, refHi:145, hi:145, lo:136,
    refHistory: [
      { machine:'*', refLo:136, refHi:145, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:136, refHi:145, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:136, refHi:145, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 血清 穩定;尿Na排除)' },
    ] },

  { id:'K',
    pattern: /K \(Serum\):\s*([<>]?\s*[\d.]+)/,
    displayName:'鉀 (K)', shortLabel:'K',
    unit:'mmol/L', category:'電解質',
    ref:'3.5–5.1 mmol/L',
    refLo:3.5, refHi:5.1, hi:5.1, lo:3.5,
    refHistory: [
      { machine:'*', refLo:3.5, refHi:5.1, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:3.5, refHi:5.1, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:3.5, refHi:5.1, validFrom:'1900-01-01', source:'gap-fill single-report 000070213G @2026-06-12 (3.5-5.1 mmol/L,obs 1;= universal)' },
    ] },

  { id:'Cl',
    pattern: /Cl\(Serum\):\s*([<>]?\s*[\d.]+)/,
    displayName:'氯 (Cl)', shortLabel:'Cl',
    unit:'mmol/L', category:'電解質',
    ref:'98–107 mmol/L',
    refLo:98, refHi:107, hi:107, lo:98,
    refHistory: [
      { machine:'*', refLo:98, refHi:107, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:98, refHi:107, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定單版,2021→2026 未改;原誤標 2026-03-31)' },
      { machine:'vhtt', refLo:98, refHi:107, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 血清 穩定;尿Cl排除)' },
    ] },

  { id:'Ca',
    pattern: /Calcium\(Serum\):\s*([<>]?\s*[\d.]+)/,
    displayName:'鈣 (Ca)', shortLabel:'Ca',
    unit:'mg/dL', category:'電解質',
    ref:'8.6–10.3 mg/dL',
    refLo:8.6, refHi:10.3, hi:10.3, lo:8.6,
    refHistory: [
      { machine:'*', refLo:8.6, refHi:10.3, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:8.6, refHi:10, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 ref(末見 2025-04-21;migration base 1900)' },
      { machine:'vhyl', refLo:8.4, refHi:10.2, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 ref(earliest 2025-06-04;原誤標 2026-03-31;30pt（full cohort）)' },
      { machine:'vhtt', refLo:8.6, refHi:10.3, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 穩定單版 2020→2026)' },
    ] },

  { id:'FreeCa',
    pattern: /Free Ca\+\+:\s*([<>]?\s*[\d.]+)/,
    displayName:'游離鈣 (Free Ca)', shortLabel:'Free Ca',
    unit:'mmol/L', category:'電解質',
    ref:'1.15–1.32 mmol/L',
    refLo:1.15, refHi:1.32, hi:1.32, lo:1.15,
    refHistory: [
      { machine:'*', refLo:1.15, refHi:1.32, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:1.15, refHi:1.32, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (僅見 2025-09-26→,值同 universal;設 1900 無害)' },
    ] },

  { id:'P',
    pattern: /Phosphorus:\s*([<>]?\s*[\d.]+)/,
    displayName:'磷 (P)', shortLabel:'P',
    unit:'mg/dL', category:'電解質',
    ref:'2.5–5.0 mg/dL',
    refLo:2.5, refHi:5.0, hi:5.0, lo:2.5,
    refHistory: [
      { machine:'*', refLo:2.5, refHi:5.0, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:2.5, refHi:4.5, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定 2.5-4.5,2022→2026 未改;原誤標 2025-12-30)' },
    ] },

  { id:'Mg',
    pattern: /MG:\s*([<>]?\s*[\d.]+)/,
    displayName:'鎂 (Magnesium, Mg)', shortLabel:'Mg',
    unit:'mg/dL', category:'電解質',
    ref:'1.6–2.6 mg/dL',
    refLo:1.6, refHi:2.6, hi:2.6, lo:1.6,
    refHistory: [{ machine:'*', refLo:1.6, refHi:2.6, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // IRON METABOLISM
  // ═══════════════════════════════════════════════════════════════════════

  // vhyl sample (2026-05-05): "更正報告 FE: 58TIBC: 267.00TS: 22"
  { id:'Fe',
    pattern: /(?:Fe|Iron)\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/i,
    displayName:'血清鐵 (Fe)', shortLabel:'Fe',
    unit:'µg/dL', category:'鐵代謝',
    ref:'男 65–175，女 50–170 µg/dL',
    refLo:50, refHi:175,
    loM:65, hiM:175, loF:50, hiF:170,
    lo:50, hi:175,
    refHistory: [
      { machine:'*', refLo:50, refHi:175, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:50, refHi:175, refLoM:50, refHiM:175, refLoF:50, refHiF:175, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 cohort 僅 2 筆觀測(2025-09-20),證據薄;validFrom 用 migration base 取代觸發日 2026-05-28 + 委外:新南海 (vhtt 印 universal 50-175,inline 性別 mirror 是為了 suppress outer loM:65/hiF:170 fallback)' },
      { machine:'vhyl', refLo:33, refHi:193, refLoM:33, refHiM:193, refLoF:33, refHiF:193, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 Fe(33-193 無性別,inline mirror suppress 外層;末見 2025-04-26)' },
      { machine:'vhyl', refLo:50, refHi:175, refLoM:65, refHiM:175, refLoF:50, refHiF:170, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 Fe(M65-175,F50-170;earliest 2025-07-17;30pt iron-panel 增強 parser)' },
    ] },

  { id:'TIBC',
    pattern: /TIBC:\s*([<>]?\s*[\d.]+)/,
    displayName:'總鐵結合力 (TIBC)', shortLabel:'TIBC',
    unit:'µg/dL', category:'鐵代謝',
    ref:'男 134–415，女 120–480 µg/dL',
    refLo:120, refHi:480,
    loM:134, hiM:415, loF:120, hiF:480,
    lo:120, hi:480,
    refHistory: [
      { machine:'*', refLo:120, refHi:480, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:250, refHi:400, refLoM:250, refHiM:400, refLoF:250, refHiF:400, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 TIBC(250-400 無性別,inline mirror;末見 2025-04-26)' },
      { machine:'vhyl', refLo:119, refHi:485, refLoM:135, refHiM:485, refLoF:119, refHiF:410, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 TIBC(M135-485,F119-410;earliest 2025-07-17;30pt;原誤標 2026-06-01)' },
      { machine:'vhtt', refLo:120, refHi:480, refLoM:134, refHiM:415, refLoF:120, refHiF:480, validFrom:'1900-01-01', source:'auto-crawl cohort 2026-06-24 (19pt 男134-415 女120-480;同 universal)' },
    ] },

  // vhyl sample (2026-05-05): "更正報告 FE: 58TIBC: 267.00TS: 22"
  { id:'TSAT',
    pattern: /(?<![A-Za-z])(?:TSAT|TS|SAT):\s*([<>]?\s*[\d.]+)/,
    displayName:'鐵飽和度 (TSAT)', shortLabel:'TSAT',
    unit:'%', category:'鐵代謝',
    ref:'20–45 %',
    refLo:20, refHi:45, hi:45, lo:20,
    refHistory: [
      { machine:'*', refLo:20, refHi:45, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:12, refHi:50, refLoM:15, refHiM:50, refLoF:12, refHiF:45, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定 M15-50,F12-45,2021→2026 未改;30pt full cohort;原誤標 2026-03-31)' },
    ] },

  { id:'UIBC', computed:'UIBC', pattern:null,
    displayName:'不飽和鐵結合力 (UIBC)', shortLabel:'UIBC',
    unit:'µg/dL', category:'鐵代謝',
    ref:'110–370 µg/dL',
    refLo:110, refHi:370, lo:110, hi:370,
    notes:'Computed: TIBC − Fe. ernode does not report UIBC directly.' },

  { id:'Ferritin',
    pattern: /(?:Ferritin|FERRITIN):\s*([<>]?\s*[\d.]+)/i,
    displayName:'鐵蛋白 (Ferritin)', shortLabel:'Ferritin',
    unit:'ng/mL', category:'鐵代謝',
    ref:'男 21.81–274.66，女 4.63–204.00 ng/mL',
    refLo:4.63, refHi:274.66,
    loM:21.81, hiM:274.66, loF:4.63, hiF:204.00,
    lo:4.63, hi:274.66,
    notes:'Capture allows leading <> operator (handles "<5.0", ">2000" results).',
    refHistory: [
      { machine:'*', refLo:4.63, refHi:274.66, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:4.63, refHi:274.66, refLoM:21.81, refHiM:274.66, refLoF:4.63, refHiF:204, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定 M21.81-274.66,F4.63-204,2021→2026 未改;30pt n9)' },
    ] },

  // ═══════════════════════════════════════════════════════════════════════
  // PARATHYROID + VITAMINS
  // ═══════════════════════════════════════════════════════════════════════

  { id:'iPTH',
    pattern: /i-PTH:\s*([<>]?\s*[\d.]+)/,
    displayName:'副甲狀腺素 (iPTH)', shortLabel:'i-PTH',
    unit:'pg/mL', category:'副甲狀腺',
    ref:'15–68.3 pg/mL',
    refLo:15, refHi:68.3, hi:68.3, lo:15,
    refHistory: [{ machine:'*', refLo:15, refHi:68.3, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'VitB12',
    pattern: /(?:Vit(?:amin)?\.?\s*B12|VIT\.?\s*B12|B12):\s*([<>]?\s*[\d.]+)/i,
    displayName:'維生素 B12 (Vit. B12)', shortLabel:'Vit B12',
    unit:'pg/mL', category:'維生素',
    ref:'187–883 pg/mL',
    refLo:187, refHi:883, hi:883, lo:187,
    notes:'Matches "Vit. B12:", "Vitamin B12:", "VIT.B12:", "B12:".',
    refHistory: [{ machine:'*', refLo:187, refHi:883, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'FolicAcid',
    pattern: /(?:Folic\s+acid|Folate):\s*([<>]?\s*[\d.]+)/i,
    displayName:'葉酸 (Folic Acid)', shortLabel:'Folate',
    unit:'ng/mL', category:'維生素',
    ref:'3.1–20.5 ng/mL',
    refLo:3.1, refHi:20.5, hi:20.5, lo:3.1,
    notes:'Allows variable internal whitespace (some hospitals print "Folic  acid:" with double space).',
    refHistory: [{ machine:'*', refLo:3.1, refHi:20.5, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // TRACE METALS
  // ═══════════════════════════════════════════════════════════════════════

  // vhtt 2026-05-07: 18-patient survey, 12 had Blood Aluminum results.
  // Main page: "Al鋁: 6" / "Al鋁: <2" (below detection limit).
  // Sub-page (OpdOrderReport.aspx): "Result: 4" — handled by enrichment via
  // the `subpage` config (synthesises "Al鋁: N" back into reportText so the
  // main pattern matches downstream).
  { id:'Aluminum',
    // vhtt 2026-05-07: in-house results use "Al鋁: N", but historical
    // out-sourced results (代檢單位：新南海醫事檢驗所) label the value with
    // the external lab code "BALR0101: N". Both formats live in the main
    // reportText — sub-page enrichment isn't actually needed for any of
    // the patients sampled so far. The `subpage` config below stays for
    // defensive future-proofing (in case a sub-page-only sample appears).
    pattern: /(?:Al鋁|BALR0101):\s*([<>]?\s*[\d.]+)/,
    displayName:'鋁 (Aluminum)', shortLabel:'Al',
    unit:'µg/L', category:'微量元素',
    ref:'<20 µg/L',
    refLo:null, refHi:20, hi:20, lo:null,
    meaning:'鋁中毒監測（長期透析）',
    subpage: {
      // orderName variants observed: "Blood Aluminum", "Blood Aluminum(TT)",
      // and (defensive) any Chinese-only name containing 鋁.
      orderNameMatch: /Aluminum|鋁/i,
      resultPattern:  /Result:\s*([<>]?\s*[\d.]+)/,
      synthLabel:     'Al鋁',
    },
    notes:'Annual test. vhtt confirmed 2026-05-07 (18-patient survey, 12 with data). Main pattern matches both "Al鋁: N" (in-house) and "BALR0101: N" (out-sourced lab code). Capture allows leading <> operator (handles "<2" below detection limit; reporter extractLabValues preserves "<N" as string since 2026-05-07). Ref <20 µg/L per KDOQI guidelines.',
    refHistory: [{ machine:'*', refLo:null, refHi:20, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // TUMOR MARKERS
  // ═══════════════════════════════════════════════════════════════════════

  // vhyl sample (2026-05-05): "正式報告 AFP(YL): < 2.00"
  { id:'AFP',
    pattern: /AFP\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/,
    displayName:'甲胎蛋白 (AFP)', shortLabel:'AFP',
    unit:'ng/mL', category:'癌症指數',
    ref:'< 20 ng/mL（肝臟）',
    refLo:null, refHi:20, hi:20, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:20, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhtt', refLo:0, refHi:9.0, validFrom:'2026-05-28', source:'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch — see docs/cross-reference-vhtt-2026-05-28.md' },
      { machine:'vhyl', refLo:null, refHi:8.8, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 玉里舊 AFP(<8.8;末見 2025-04-10)' },
      { machine:'vhyl', refLo:0.89, refHi:8.78, validFrom:'2025-06-04', source:'time-dim rescan 2026-06-24 玉里新 AFP(0.89-8.78;earliest 2025-06-17;30pt;原誤標 2026-06-10)' },
    ] },

  // vhyl sample (2026-05-25): "正式報告 CEA(YL): 7.37" — chartno 000023172B
  // 比照 AFP / Fe / TSAT 同期 fix 加 (TT|YL) 可選後綴。
  // 同 section 其他 test (PSA / FreePSA / CA199 / CA125) 在 vhyl 端 value
  // line 都不帶 (YL)，CEA 是異例 — 不擴張本 fix 範圍。
  { id:'CEA',
    pattern: /CEA\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/,
    displayName:'癌胚抗原 (CEA)', shortLabel:'CEA',
    unit:'ng/mL', category:'癌症指數',
    ref:'< 5 ng/mL（大腸直腸）',
    refLo:null, refHi:5, hi:5, lo:null,
    refHistory: [
      { machine:'*', refLo:null, refHi:5, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' },
      { machine:'vhyl', refLo:null, refHi:5.0, validFrom:'1900-01-01', source:'time-dim rescan 2026-06-24 (穩定 <=5.0,2021→2026 未改;30pt n25;修正:前 30-scan 把值 1.73 誤當 ref)' },
    ] },

  { id:'CA199',
    pattern: /CA.?19.?9:\s*([<>]?[\d.]+)/i,
    displayName:'CA-199', shortLabel:'CA-199',
    unit:'U/mL', category:'癌症指數',
    ref:'< 37 U/mL（胰臟、膽道）',
    refLo:null, refHi:37, hi:37, lo:null,
    refHistory: [{ machine:'*', refLo:null, refHi:37, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'PSA',
    pattern: /\bPSA:\s*([<>]?\s*[\d.]+)/,
    displayName:'攝護腺特異抗原 (PSA)', shortLabel:'PSA',
    unit:'ng/mL', category:'癌症指數',
    ref:'< 4 ng/mL（男性／攝護腺）',
    refLo:null, refHi:4, hi:4, lo:null,
    gender:'M',
    refHistory: [{ machine:'*', refLo:null, refHi:4, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'FreePSA',
    // 2026-05-08: 原本移除 `|RATIO` alternation，錯誤假設 vhtt `RATIO:` 值為
    // Free/Total 比值。2026-05-13 vhtt 端以 3 個病人取樣驗證（000017679E /
    // 000043524F / 000026353G），YC（clinician）確認：vhtt 與 vhyl 的 RATIO
    // 值都是 Free PSA 絕對濃度（ng/mL），報告後接的 boilerplate 是判讀指引，
    // 不是數值語意描述。故加回 `RATIO` alternation。
    // Label 樣式覆蓋：
    //   vhtt: `RATIO: 0.152`               ← Free PSA(TT) / FREE PSA
    //   vhyl: `FREE PSA/PSA RATIO: 0.097`  ← Free PSA(YL)
    //   通用: `Free PSA: N`                ← 其他院區（若有）
    pattern: /(?:Free PSA|FREE PSA\/PSA RATIO|RATIO):\s*([<>]?\s*[\d.]+)/,
    orderNameFilter: /Free\s*PSA/i,
    displayName:'游離 PSA (Free PSA)', shortLabel:'Free PSA',
    unit:'ng/mL', category:'癌症指數',
    gender:'M',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'PSARatio', computed:'PSARatio', pattern:null,
    displayName:'Free/Total PSA 比值', shortLabel:'F/T PSA',
    unit:'%', category:'癌症指數',
    ref:'>25% 正常，10-25% 注意，<10% 警示',
    meaning:'PSA>4 時參考此比值',
    gender:'M' },

  { id:'CA125',
    pattern: /CA[-\s.]?125:\s*([<>]?[\d.]+)/i,
    displayName:'CA-125', shortLabel:'CA-125',
    unit:'U/mL', category:'癌症指數',
    ref:'< 35 U/mL（女性／卵巢）',
    refLo:null, refHi:35, hi:35, lo:null,
    gender:'F',
    refHistory: [{ machine:'*', refLo:null, refHi:35, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // THYROID
  // ═══════════════════════════════════════════════════════════════════════

  { id:'TSH',
    pattern: /TSH:\s*([<>]?\s*[\d.]+)/,
    displayName:'促甲狀腺刺激素 (TSH)', shortLabel:'TSH',
    unit:'µIU/mL', category:'甲狀腺',
    ref:'0.35–4.94 µIU/mL',
    refLo:0.35, refHi:4.94, hi:4.94, lo:0.35,
    refHistory: [{ machine:'*', refLo:0.35, refHi:4.94, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'FreeT4',
    pattern: /Free T4:\s*([<>]?\s*[\d.]+)/,
    displayName:'游離甲狀腺素 (Free T4)', shortLabel:'fT4',
    unit:'ng/dL', category:'甲狀腺',
    ref:'0.7–1.48 ng/dL',
    refLo:0.7, refHi:1.48, hi:1.48, lo:0.7,
    refHistory: [{ machine:'*', refLo:0.7, refHi:1.48, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // HEPATITIS / INFECTION (qualitative — values are text, not numbers)
  // ═══════════════════════════════════════════════════════════════════════

  // Raw qualitative pattern — used by reporter for direct table display.
  // Viewer overrides these in its manifest with `computed: '<id>'` to render
  // a patient-friendly verdict (帶原 / 正常) via report.js helpers.

  // vhyl sample (2026-05-05): "正式報告 HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)"
  { id:'HBsAg',
    pattern: /HBsAg\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/i,
    displayName:'B型肝炎表面抗原 (HBsAg)', shortLabel:'HBsAg',
    category:'肝炎 / 感染',
    qualitative:true,
    notes:'(TT) suffix used at vhtt; alternation handles both hospitals.' },

  // vhyl sample (2026-05-06): aligned to HBsAg/AntiHCV style — accepts
  // optional (TT|YL) hospital tag and stops the value capture before any
  // digits so vhyl's concatenated numeric+qualitative line parses cleanly.
  { id:'AntiHBs',
    pattern: /Anti-HBs\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/i,
    displayName:'B型肝炎表面抗體 (Anti-HBs)', shortLabel:'Anti-HBs',
    category:'肝炎 / 感染',
    qualitative:true,
    meaning:'疫苗免疫指標' },

  // vhyl sample (2026-05-05): "正式報告 Anti-HCV: 0.12Anti-HCV (YL): Non-Reactive (Non-Reactive)"
  { id:'AntiHCV',
    pattern: /(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/i,
    displayName:'C型肝炎抗體 (Anti-HCV)', shortLabel:'Anti-HCV',
    category:'肝炎 / 感染',
    qualitative:true,
    notes:'vhtt uses "HCV Ab(TT):", vhyl uses "Anti-HCV:".' },

  // Raw numeric titer entries — viewer's computed display wrappers consume
  // these to produce 帶原/正常/有抗體 + (label titer) tuples. vhyl emits
  // "HBsAg: 0.21HBsAg (YL): Non-Reactive" — \[\d.\]+ stops at the next "H"
  // so we get the numeric without the qualitative text bleeding in.
  { id:'HBsAgTiter',
    pattern: /HBsAg:\s*([<>]?\s*[\d.]+)/i,
    displayName:'HBsAg 滴度', shortLabel:'HBsAg titer',
    unit:'', category:'肝炎 / 感染',
    notes:'Numeric titer for HBsAg. Consumed by HBsAgDisplay computed wrapper.',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'AntiHBsTiter',
    pattern: /Anti-HBs:\s*([<>]?\s*[\d.]+)/i,
    displayName:'Anti-HBs 滴度', shortLabel:'Anti-HBs titer',
    unit:'', category:'肝炎 / 感染',
    notes:'Numeric titer for Anti-HBs. Consumed by AntiHBsDisplay computed wrapper.',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'AntiHCVTiter',
    pattern: /(?:HCV Ab|Anti-HCV):\s*([<>]?\s*[\d.]+)/i,
    displayName:'Anti-HCV 滴度', shortLabel:'Anti-HCV titer',
    unit:'', category:'肝炎 / 感染',
    notes:'Numeric titer for Anti-HCV. Consumed by HCV computed wrapper.',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // Computed display wrappers — viewer points its manifest at these ids
  // (HCV / HBsAgDisplay / AntiHBsDisplay) to render the patient-friendly
  // verdict tuple. Reporter keeps using raw HBsAg / AntiHBs / AntiHCV.
  { id:'HBsAgDisplay', computed:'HBsAgDisplay', pattern:null,
    needs:['HBsAg','HBsAgTiter'],
    displayName:'B型肝炎(顯示)', shortLabel:'HBsAg',
    category:'肝炎 / 感染',
    qualitative:true, singleValue:true,
    notes:'Computed display wrapper. viewer 用此 id 顯示;reporter 用 raw HBsAg。' },

  { id:'AntiHBsDisplay', computed:'AntiHBsDisplay', pattern:null,
    needs:['AntiHBs','AntiHBsTiter'],
    displayName:'B肝抗體(顯示)', shortLabel:'Anti-HBs',
    category:'肝炎 / 感染',
    qualitative:true, singleValue:true,
    notes:'Anti-HBs polarity 與 HBsAg/HCV 相反:Reactive=有抗體=normal。' },

  // Viewer's computed wrapper — same concept as AntiHCV, but produces
  // 帶原/正常 + numeric titer for the patient handout. Kept as a separate
  // catalog entry so report.js's special-case code can reference id "HCV".
  { id:'HCV', computed:'HCV', pattern:null,
    needs:['AntiHCV','AntiHCVTiter'],
    displayName:'C型肝炎', shortLabel:'HCV',
    category:'肝炎 / 感染',
    qualitative:true, singleValue:true,
    notes:'Computed display wrapper around AntiHCV raw + AntiHCVTiter numeric.' },

  { id:'HIV',
    pattern: /HIV[^:]*:\s*(\S+)/i,
    displayName:'HIV', shortLabel:'HIV',
    category:'肝炎 / 感染',
    qualitative:true },

  { id:'RPR',
    pattern: /REACT:\s*(\S+)/,
    displayName:'RPR 梅毒篩檢', shortLabel:'RPR',
    category:'肝炎 / 感染',
    qualitative:true,
    notes:'Reporter uses raw REACT pattern; viewer overrides with computed wrapper for titer + verdict.' },

  { id:'TPHA',
    pattern: /TPHA(?:\(TT\))?:\s*(\S+)/,
    displayName:'TPHA 梅毒血球凝集試驗', shortLabel:'TPHA',
    category:'肝炎 / 感染',
    qualitative:true },

  // ═══════════════════════════════════════════════════════════════════════
  // HIV MONITORING (only rendered when HIV checkbox is on in viewer)
  // ═══════════════════════════════════════════════════════════════════════

  { id:'HIVLoad',
    pattern: /HIV virus load:\s*([\d,.]+)/,
    displayName:'HIV 病毒量 (Viral Load)', shortLabel:'HIV VL',
    category:'HIV',
    notes:'Capture allows commas (thousands separator).',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  { id:'CD4',
    pattern: /LEU3AN:\s*([<>]?\s*[\d.]+)/,
    displayName:'CD4 淋巴球 (LEU3AN)', shortLabel:'CD4',
    category:'HIV',
    refHistory: [{ machine:'*', refLo:null, refHi:null, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值' }] },

  // ═══════════════════════════════════════════════════════════════════════
  // URINE — qualitative + quantitative (Phase 3 Early CKD, 2026-05-08)
  // ═══════════════════════════════════════════════════════════════════════
  // CHEM EXAM(TT) reportText comes in two formats verified across 84 vhtt
  // CKD patients:
  //   Format A (long): "Bilirubin: -  Glucose: -  Ketone: -  OB: -  ..."
  //   Format B (short+ref): "BILI: - (-)  GLU: - (-)  KETO: - (-)  OCCL: 1+ (-) ..."
  // The patterns below accept both labels (long + short) and the reference
  // suffix in format B. Capture stops before whitespace so " (-)" is dropped.
  // Catalog only captures the raw qualitative string ('-', '+/-', '1+', '4+',
  // '++', etc.); export-formats/renal-platform-xlsx.js normalises it to
  // bracket notation ([-], [+], [++], ...).

  { id:'UrineOB',
    pattern: /(?:\bOB|\bOCCL):\s*([+\-]+(?:\/[+\-])?|\d+\+)/,
    displayName:'尿潛血 (Occult Blood)', shortLabel:'尿OB',
    category:'尿液', qualitative:true,
    orderNameFilter: /CHEM\s*EXAM|尿液|Urine\s*protein/i,
    notes:'Two label formats: long "OB: -" (vhyl/older) and short "OCCL: 1+ (-)" (vhtt/newer). Capture stops before whitespace so the reference range is dropped.' },

  { id:'UrineGlucose',
    pattern: /(?:\bGlucose|\bGLU):\s*([+\-]+(?:\/[+\-])?|\d+\+)/,
    displayName:'尿糖 (Urine Glucose)', shortLabel:'尿糖',
    category:'尿液', qualitative:true,
    orderNameFilter: /CHEM\s*EXAM|尿液|Urine\s*protein/i,
    notes:'orderNameFilter required to distinguish from serum GluAC; long "Glucose: -" / short "GLU: 4+ (-)". Same capture rule as UrineOB.' },

  { id:'UrineCr',
    pattern: /Creatinine\s*\((?:24hrs?\s*)?Urine\):\s*([<>]?\s*[\d.]+)/i,
    displayName:'尿肌酸酐 (Urine Creatinine)', shortLabel:'尿Cr',
    unit:'mg/dL', category:'尿液',
    notes:'From Urine Microalbumin(TT)+Creatinine(TT) inline. Distinct label from serum CREAT — does not match Creatinine(serum):.' },

  { id:'UrineProtein',
    pattern: /尿蛋白\s+([<>]?\s*[\d.]+)\s*mg\/dL/i,
    displayName:'尿蛋白定量 (Urine Total Protein)', shortLabel:'尿蛋白',
    unit:'mg/dL', category:'尿液',
    subpage: {
      // Inline reportText only carries UPCR (T.PROT/CREAT); the actual
      // protein concentration in mg/dL lives behind the opdweb sub-page.
      orderNameMatch: /Urine\s*total\s*protein|尿蛋白定量/i,
      // No resultPattern: sub-page already prints "尿蛋白 <值> mg/dL" so
      // the main pattern matches it directly after enrichment.
    },
    notes:'Random urine protein concentration. Inline reportText only has UPCR; mg/dL value requires sub-page enrichment via opdweb OpdOrderReport.aspx.' },

  // ═══════════════════════════════════════════════════════════════════════
  // IMAGING / TEXT-BLOCK ENTRIES (page 2 of viewer — fillable text forms)
  // ═══════════════════════════════════════════════════════════════════════

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
    displayName:'骨密度', category:'影像 / 文字報告' },

  { id:'Endoscopy',
    kind:'text',
    orderNameMatch: /胃鏡|內視鏡|UGI|Endoscop|Gastroscop|EGD|Panendoscop/i,
    rows: [
      { label:'上消化道', options:['胃食道逆流','胃潰瘍','十二指腸潰瘍'], trailing:'胃藥治療' },
      { label:'細菌',     options:['胃幽門桿菌'],                            trailing:'三合一治療' },
    ],
    displayName:'上消化道內視鏡', category:'影像 / 文字報告' },

  { id:'AbdSono',
    kind:'text',
    orderNameMatch: /超音波|Sonograph|Ultrasound|Abd.*Echo|Abdominal\s*US|腹部.*US/i,
    rows: [
      { label:'肝臟', options:['正常','脂肪肝','水泡','血管瘤'] },
      { label:'膽',   options:['正常','膽結石','膽息肉'] },
      { label:'右腎', options:['正常','水泡','萎縮','結石'] },
      { label:'左腎', options:['正常','水泡','萎縮','結石'] },
    ],
    displayName:'腹部超音波', category:'影像 / 文字報告' },

  // ═══════════════════════════════════════════════════════════════════════
  // EXAMINATIONS (track-only — used by CKD/DM screening Dashboard)
  // ═══════════════════════════════════════════════════════════════════════
  // 為 TASK_BRIEF_ckd_screening_dashboard S1 加入。Pattern 只 match orderName
  // (不 capture 數值) — Dashboard 端拿 orderDate / status，不需 lab value。
  // 此 category「檢查」目前不在任何 manifest 裡，所以是 track-only：viewer /
  // reporter 既有報表不會額外渲染。
  //
  // vhtt order name 實測（Phase 0, 2026-05-21）：
  //   EKG    : `E.K.G.(TT)`                       (unit: ER)
  //   ABI/PVR: `Doppling ex. and pressure recodring`  (unit: ER, 合併一筆)
  //   Fundus : `Fundoscopy(眼底鏡檢查)`             (unit: META)
  // vhyl 預期 ABI / PVR 分開兩筆 order — `\b` word boundary 由各自 id match。

  { id:'EKG',    displayName:'心電圖',
    pattern: /E\.K\.G\.|心電圖|EKG|ECG/i,
    category:'檢查',
    unit:'', ref:'', lo:null, hi:null },

  { id:'ABI',    displayName:'ABI',
    pattern: /\bABI\b|Doppling ex\.|四肢血流探測/i,
    category:'檢查',
    unit:'', ref:'', lo:null, hi:null },

  { id:'PVR',    displayName:'PVR',
    pattern: /\bPVR\b|Doppling ex\./i,
    category:'檢查',
    unit:'', ref:'', lo:null, hi:null },

  { id:'Fundus', displayName:'眼底鏡',
    pattern: /Fundoscopy|眼底鏡|Fundus\s+color/i,
    category:'檢查',
    unit:'', ref:'', lo:null, hi:null },

  // CXR — TASK_BRIEF_health_check_cxr S1（2026-05-21）。健檢 order name 為
  // `PE CXR`（unit: 放射線, IMPRESSION: Z00.00_體檢）；臨床 order 為
  // `CHEST PA or AP View (TT)`。alternation 同時涵蓋兩者，且不誤命中
  // `Chest Left oblique(TT)` 等其他胸部影像。
  { id:'CXR',    displayName:'CXR (胸部X光)', shortLabel:'CXR',
    pattern: /PE\s*CXR|CHEST\s+PA\s+or\s+AP/i,
    category:'檢查',
    unit:'', ref:'', lo:null, hi:null },

  // 健檢影像三項 — TASK_BRIEF_health_check_cxr S1 補充（2026-05-21）。與 CXR
  // 同為 track-only「檢查」,健檢報告視窗（cxr.html）批次抓取 + LLM 翻譯。
  // order name 範例：`PE Whole Body Bone density scan` / `PE85 Coronary
  // Calcium Score CT` / `PE Low Dose Chest CT`。pattern 抓 order name 不誤命中
  // `PE CXR`（CXR）或 `Chest Left oblique`（其他胸部影像）。
  { id:'BMD',  displayName:'骨質密度 (BMD)', shortLabel:'BMD',
    pattern: /Bone\s+density/i,
    category:'檢查',
    unit:null, ref:null, lo:null, hi:null },

  { id:'CAC',  displayName:'冠狀動脈鈣化 (CAC)', shortLabel:'CAC',
    pattern: /Coronary\s+Calcium/i,
    category:'檢查',
    unit:null, ref:null, lo:null, hi:null },

  { id:'LDCT', displayName:'低劑量肺部CT (LDCT)', shortLabel:'LDCT',
    pattern: /Low\s+Dose\s+Chest\s+CT/i,
    category:'檢查',
    unit:null, ref:null, lo:null, hi:null },

];

// ─── Exports (CommonJS + browser global) ─────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CATALOG;
}
if (typeof window !== 'undefined') {
  window.HOSPITAL_LAB_PATTERNS_CATALOG = CATALOG;
}
