# TASK_BRIEF: Phase 2 — Dialysis KiDiTi Export (檢驗記錄)

**Parent:** `TASK_BRIEF_multi_disease_export.md`
**Execution mode:** Claude Code (multi-file, git, sync-patterns)

## Goal

Add a "匯出KiDiTi資料" button to the existing dialysis reporter
(`hospital-lab-data.html`) that exports a CSV file matching the KiDiTi
平台 **檢驗記錄** sheet (58 fields). Also update button bar layout.

## 1. UI Changes — Button Bar

### Current state (lines 241–249)

```
[新增清單(small,green)]          [更新資料(small,blue)] [匯出 CSV(large,orange)]
```

### Target state

```
[新增清單(small,green)]   [全部更新(large,blue)] ──gap── [匯出KiDiTi資料(large,orange)] [匯出csv(large,orange)]
```

Specific changes:

1. **Rename** "更新資料" → "全部更新"
2. **Resize** 全部更新 to match CSV export style:
   `padding:12px 32px; font-size:1.15em; font-weight:600;`
   Remove `btn-sm`, keep `btn-primary`. Add subtle box-shadow.
3. **Add** "匯出KiDiTi資料" button — same size/style as 匯出CSV
   (orange `btn-warning`, same padding/font/shadow). `onclick` calls
   `exportKiDiTiCSV()`.
4. **Button order** (left → right in right-side group):
   `全部更新` — larger gap (`margin-right:16px` or flex gap) —
   `匯出KiDiTi資料` `匯出csv`
5. "新增清單" stays in the left group, unchanged.

### Target HTML (reference)

```html
<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap">
  <div style="display:flex; gap:8px">
    <button class="btn btn-success btn-sm" id="btnAddToList"
      onclick="addAndUpdateFromInput()">新增清單</button>
  </div>
  <div style="display:flex; gap:8px; align-items:center">
    <button class="btn btn-primary" id="btnRefreshList"
      onclick="refreshExistingPatients()"
      style="padding:12px 32px; font-size:1.15em; font-weight:600;
             box-shadow:0 2px 6px rgba(52,152,219,0.35); margin-right:16px;">全部更新</button>
    <button class="btn btn-warning" id="btnExportKiDiTi"
      onclick="exportKiDiTiCSV()"
      style="padding:12px 32px; font-size:1.15em; font-weight:600;
             box-shadow:0 2px 6px rgba(230,126,34,0.35);">匯出KiDiTi資料</button>
    <button class="btn btn-warning" id="btnExportCSV"
      onclick="exportCombinedCSV()"
      style="padding:12px 32px; font-size:1.15em; font-weight:600;
             box-shadow:0 2px 6px rgba(230,126,34,0.35);">匯出csv</button>
  </div>
</div>
```

## 2. Reporter Manifest Changes (hospital-lab-patterns)

Add **3 entries** to `reporter.js` REPORTER_MANIFEST before the export
implementation:

| id | cat | label | Notes |
|---|---|---|---|
| `FreeCa` | `LYTE` | `離子鈣 Free Ca` | Already in catalog. Insert after `Ca`. |
| `Mg` | `LYTE` | `鎂 Mg` | Already in catalog. Insert after `P`. |
| `UIBC` | `IRON` | `UIBC` | Computed entry already in catalog + computed.js. Insert after `TIBC`. |

After adding → `npm run release` → sync-patterns in reporter.

## 3. KiDiTi 檢驗記錄 CSV Export

### 3.1 Function signature

```javascript
function exportKiDiTiCSV(selectedOnly = false)
```

- If `selectedOnly` is false → export all patients in localStorage list
- One row per patient per **month-check date** (reuse existing monthly
  grouping logic from `exportCombinedCSV`)
- Output: CSV file download, filename `KiDiTi_檢驗記錄_YYYYMMDD.csv`

### 3.2 Format rules (from KiDiTi 說明)

KiDiTi 檔案為**純文字 CSV**（逗號分隔），副檔名 `.csv`。
各欄位以 `,` 分隔，**不限碼數、去空白**（即不做固定寬度填充）。

欄位格式定義：
- 第 1 碼 = 型態：`S`（字串）、`N`（數值）
- 第 2 碼 = 長度：字串 → 最大字元數；數值如 `7.2` → 總長 7 位、
  小數 2 位 → 最大值 `9999.99`；`7.3` → 最大 `9999.999`

| Rule | Spec |
|---|---|
| Encoding | UTF-8 with BOM (platform expects BOM) |
| Delimiter | Comma `,` |
| Header row | **None** (raw data rows only, per KiDiTi import spec) |
| Field padding | **None** — 各欄位不限碼數去空白 |
| String fields (S) | 不加引號（除非值含逗號則需引號包覆） |
| Numeric fields (N) | 直接輸出數值，不做前導零填充。`N 7.2` = toFixed(2)，`N 7.3` = toFixed(3)。Empty = blank (NOT zero) |
| Date format | 民國年 7-digit `RRRMMDD` — e.g. `1140507` = 2025-05-07 |
| ID format | `S 10` — 身份證號 as-is (10 chars) |
| Empty fields | **必須留空白**，不可填 0（"填入 0 則會列入統計"） |

### 3.3 Date conversion helper

```javascript
function toMinguoDate(isoDate) {
  // isoDate: "2025-05-07" or Date object
  const d = new Date(isoDate);
  const y = d.getFullYear() - 1911;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
```

### 3.4 HBsAg / Anti-HCV conversion

Map qualitative results to single-char codes:

| Source value | KiDiTi code |
|---|---|
| `Reactive` | `Y` |
| `Non-Reactive` | `N` |
| No data / missing | `O` (未做) |

### 3.5 Complete field mapping (58 fields)

| # | KiDiTi Field | Format | Source | Pattern ID | Notes |
|---|---|---|---|---|---|
| 01 | 身份證號 | S 10 | patient.idno | — | From patient record |
| 02 | 病歷號 | S 10 | patient.chartno | — | Zero-padded 10 chars |
| 03 | 日期 | S 7 | check date | — | `toMinguoDate()` |
| 04 | W.B.C. | N 7.2 | lab | `WBC` | |
| 05 | R.B.C. | N 7.2 | lab | `RBC` | |
| 06 | Hbc (Hb) | N 7.2 | lab | `Hb` | |
| 07 | Hct | N 7.2 | lab | `HCT` | |
| 08 | MCV | N 7.2 | lab | `MCV` | |
| 09 | Platelet | N 7.2 | lab | `Platelet` | |
| 10 | Total protein | N 7.2 | lab | `TP` | |
| 11 | Albumin | N 7.2 | lab | `Albumin` | |
| 12 | AST/GOT | N 7.2 | lab | `GOT` | |
| 13 | ALT/GPT | N 7.2 | lab | `GPT` | |
| 14 | Alkaline-P | N 7.2 | lab | `ALP` | |
| 15 | Total Bilirubin | N 7.2 | lab | `TBIL` | |
| 16 | Cholesterol | N 7.2 | lab | `CHOL` | |
| 17 | Triglyceride | N 7.2 | lab | `TG` | |
| 18 | Glucose AC | N 7.2 | lab | `GluAC` | |
| 19 | 透析前收縮壓 | N 7.2 | — | — | **Blank** (non-lab) |
| 20 | 透析前舒張壓 | N 7.2 | — | — | **Blank** (non-lab) |
| 21 | 透析前體重 | N 7.2 | — | — | **Blank** (non-lab) |
| 22 | 透析後體重 | N 7.2 | — | — | **Blank** (non-lab) |
| 23 | 本次透析時間 | N 7.2 | — | — | **Blank** (non-lab) |
| 24 | 透析前BUN | N 7.2 | lab | `BUN_pre` | Monthly BUN pre |
| 25 | 透析後BUN | N 7.2 | lab | `BUN_post` | Monthly BUN post |
| 26 | 下次透析前BUN | N 7.2 | — | — | **Blank** (non-lab) |
| 27 | 兩次透析間隔 | N 7.2 | — | — | **Blank** (non-lab) |
| 28 | Creatinine | N 7.2 | lab | `CREAT` | |
| 29 | Uric acid | N 7.2 | lab | `UA` | |
| 30 | Na | N 7.2 | lab | `Na` | |
| 31 | K | N 7.2 | lab | `K` | |
| 32 | Cl | N 7.2 | lab | `Cl` | |
| 33 | 全鈣 Ca | N 7.2 | lab | `Ca` | |
| 34 | 離子鈣 | N 7.2 | lab | `FreeCa` | **Add to manifest** |
| 35 | P | N 7.2 | lab | `P` | |
| 36 | Fe | N 7.2 | lab | `Fe` | |
| 37 | UIBC | N 7.2 | computed | `UIBC` | Computed: TIBC − Fe |
| 38 | TIBC | N 7.2 | lab | `TIBC` | |
| 39 | Ferritin | N 7.2 | lab | `Ferritin` | |
| 40 | Al | N 7.2 | lab | `Aluminum` | |
| 41 | Mg | N 7.2 | lab | `Mg` | **Add to manifest** |
| 42 | intact-PTH | N 7.2 | lab | `iPTH` | |
| 43 | CTR | N 7.3 | — | — | **Blank** (non-lab) |
| 44 | HBsAg | S 1 | lab | `HBsAg` | Map → Y/N/O |
| 45 | Anti-HCV | S 1 | lab | `AntiHCV` | Map → Y/N/O |
| 46 | EKG | S 40 | — | — | **Blank** (non-lab) |
| 47 | 身高 | N 7.3 | — | — | **Blank** (non-lab) |
| 48 | 自訂一 | N 7.2 | — | — | **Blank** |
| 49 | 自訂二 | N 7.2 | — | — | **Blank** |
| 50 | 自訂三 | N 7.2 | — | — | **Blank** |
| 51 | 自訂四 | N 7.2 | — | — | **Blank** |
| 52 | 自訂五 | N 7.2 | — | — | **Blank** |
| 53 | 自訂六 | N 7.2 | — | — | **Blank** |
| 54 | 自訂七 | S 30 | — | — | **Blank** |
| 55 | 自訂八 | S 30 | — | — | **Blank** |
| 56 | 鈣磷乘積 | N 7.2 | computed | `CaxP` | Existing computed |
| 57 | HCV-RNA (IU/ML) | N 7.2 | — | — | **Blank** (no ernode) |
| 58 | HCV-RNA (qual) | S 1 | — | — | **Blank** (no ernode) |

### Summary counts

- **From lab patterns:** 30 fields (already in manifest)
- **Add to manifest:** 3 (FreeCa, Mg, UIBC)
- **Computed values:** 2 (UIBC → field 37, CaxP → field 56)
- **Non-lab (blank):** 17 (BP, weight, dialysis time, interval, CTR, EKG, height, next-session BUN)
- **Custom (blank):** 6 (自訂一~八, two are string)
- **HCV-RNA (blank):** 2 (no ernode source)

## 4. Export Logic Pseudocode

```
function exportKiDiTiCSV():
  patients = loadAllPatients()  // from localStorage
  rows = []

  for each patient:
    monthlyChecks = getMonthlyCheckDates(patient)
    for each checkDate:
      labData = getLabValuesForDate(patient, checkDate)
      computed = computeValues(labData)  // UIBC, CaxP

      row = [
        patient.idno,                          // 01
        patient.chartno.padStart(10, '0'),     // 02 (pad? check current logic)
        toMinguoDate(checkDate),               // 03
        fmt(labData.WBC),                      // 04
        fmt(labData.RBC),                      // 05
        ...                                    // 06–18: direct lab
        '', '', '', '', '',                    // 19–23: non-lab blank
        fmt(labData.BUN_pre),                  // 24
        fmt(labData.BUN_post),                 // 25
        '', '',                                // 26–27: blank
        fmt(labData.CREAT),                    // 28
        ...                                    // 29–36: direct lab
        fmt(computed.UIBC),                    // 37
        fmt(labData.TIBC),                     // 38
        ...                                    // 39–42: direct lab
        '',                                    // 43: CTR blank
        mapHepYNO(labData.HBsAg),             // 44
        mapHepYNO(labData.AntiHCV),            // 45
        '', '',                                // 46–47: EKG, height blank
        '', '', '', '', '', '', '', '',        // 48–55: custom blank
        fmt(computed.CaxP),                    // 56
        '', ''                                 // 57–58: HCV-RNA blank
      ]
      rows.push(row)

  csv = rows.map(r => r.join(',')).join('\n')
  download(BOM + csv, filename)
```

### Key helper: `fmt(value)`

```javascript
function fmtNum(v, decimals = 2) {
  if (v == null || v === '') return '';
  const n = parseFloat(v);
  return isNaN(n) ? '' : n.toFixed(decimals);
}
```

## 5. Patient ID / Chartno

- **身份證號 (idno):** currently stored in patient record. If missing,
  leave blank. The existing reporter stores idno from ernode response
  `patient_info.id_no`.
- **病歷號:** zero-pad to match spec `S 10`. Current chartno is already
  10 chars (9 digits + 1 letter). Confirm: no further padding needed for
  most cases. If shorter, left-pad with zeros.

## 6. Dependencies (must complete before implementation)

1. ✅ UIBC computed entry added to `catalog.js` + `computed.js`
2. ⬜ Add FreeCa, Mg, UIBC to `reporter.js` REPORTER_MANIFEST
3. ⬜ `npm run release` in hospital-lab-patterns
4. ⬜ `node sync-patterns.js` in hospital-lab-reporter
5. ⬜ Commit patterns changes

## 7. Testing Checklist

- [ ] Button bar matches target layout (3 buttons, correct sizes)
- [ ] "全部更新" triggers refresh (same as old "更新資料")
- [ ] "匯出KiDiTi資料" downloads CSV file
- [ ] CSV has exactly 58 comma-separated fields per row
- [ ] No header row in CSV
- [ ] Date field is 民國年 7-digit format
- [ ] Numeric fields: correct decimal places, empty = blank not zero
- [ ] HBsAg/Anti-HCV: Y/N/O mapping correct
- [ ] UIBC computed correctly (TIBC − Fe)
- [ ] CaxP computed correctly (Ca × P)
- [ ] Blank fields are truly empty (not "0" or "null")
- [ ] UTF-8 BOM present
- [ ] Existing "匯出csv" still works identically
- [ ] Upload test CSV to KiDiTi platform → passes validation

## 8. File Changes Summary

| File | Action |
|---|---|
| `hospital-lab-patterns/patterns/reporter.js` | Add FreeCa, Mg, UIBC to manifest |
| `hospital-lab-reporter/hospital-lab-data.html` | Button bar rewrite (§1), `exportKiDiTiCSV()` function (§3–4) |
| `hospital-lab-reporter/WORKLOG.md` | Update with Phase 2 changes |

## 9. Notes

- **No header row:** KiDiTi import spec does not use column headers.
  The platform reads fields by position (column index).
- **Zero = data:** The spec warns "沒有資料請保留空白，如果填入 0 則會列入統計".
  All blank fields MUST be empty string, never `0`.
- **Phase 1 bypass:** This phase can be implemented directly on the
  current monolithic `hospital-lab-data.html` without waiting for
  Phase 1 repo restructure. The export function is additive.
