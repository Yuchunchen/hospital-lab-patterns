# TASK_BRIEF: Phase 3 — Early CKD (腎臟病平台 檢驗數據匯出)

**Parent:** `TASK_BRIEF_multi_disease_export.md`
**Execution mode:** Claude Code
**Depends on:** Phase 1 ✅ (build pipeline ready)

## Goal

建立第二個 disease group module（`groups/early-ckd.js`），產出獨立的
`hospital-lab-ckd.html`。新增腎臟病平台「檢驗數據」xlsx 匯出功能
（23 欄）。這是 Phase 1 build pipeline 投入使用的第一個新 disease。

## 1. New Disease Group: `groups/early-ckd.js`

### 1.1 Group 定義

```javascript
const EARLY_CKD_GROUP = {
  id: 'early-ckd',
  label: '初期慢性腎臟病',

  storageKey: {
    patients: 'patients_ckd',
    labs:     'labs_ckd',
  },

  patientFields: [
    // CKD 不需要洗腎日期/班別，可能需要 CKD stage 或 P1/P2 分期
    // 先用最簡：無額外欄位，demographics 自動填入
  ],

  labManifest: [ /* see §1.2 */ ],
};

window.GROUPS = window.GROUPS || {};
window.GROUPS['early-ckd'] = EARLY_CKD_GROUP;
```

### 1.2 Lab Manifest (CKD 檢驗項目)

CKD 需要的 lab 項目（對應匯出 23 欄中的 lab 欄位）：

| # | Export Column | Pattern ID | In Catalog? | In Reporter? | Notes |
|---|---|---|---|---|---|
| 3 | Creatinine | `CREAT` | ✅ | ✅ (dialysis) | |
| 4 | Urea Nitrogen | `BUN` | ✅ | ❌ (dialysis 用 BUN_pre/post) | CKD 用通用 BUN |
| 5 | Hct | `HCT` | ✅ | ✅ | |
| 6 | HbA1c | `HbA1c` | ✅ | ✅ | |
| 7 | Uric Acid | `UA` | ✅ | ✅ | |
| 8 | Cholesterol | `CHOL` | ✅ | ✅ | |
| 9 | Triglyceride | `TG` | ✅ | ✅ | |
| 10 | Albumin | `Albumin` | ✅ | ✅ | |
| 11 | Urine Protein | `UrineProtein` | ❌ **NEW** | — | 尿蛋白定量 mg/dl |
| 12 | OB | `UrineOB` | ❌ **NEW** | — | 尿潛血 定性 [-/+/++/+++] |
| 13 | Sugar AC | `GluAC` | ✅ | ✅ | |
| 14 | LDL-cholesterol | `LDL` | ✅ | ✅ | |
| 15 | Urine Total Protein | — | — | — | **留空** (24hr 尿蛋白，CKD 門診不做) |
| 16 | Urine Creatinine | `UrineCr` | ❌ **NEW** | — | 尿肌酸酐 mg/dl |
| 17 | UPCR | `UPCR` | ✅ | ❌ | |
| 18 | UACR | `UACR` | ✅ | ❌ | |
| 19 | Urine Glucose | `UrineGlucose` | ❌ **NEW** | — | 尿糖 定性 [-/+/++/+++] |

Non-lab (leave blank): Urine Total Protein (15), Height (20), Weight (21),
BP1 (22), BP2 (23)

### 1.3 New Catalog Patterns Needed ✅ verified 2026-05-08

已用 ernode 驗證 42 位 CKD 病患 + 2 位先前查詢的病患（000115014H,
000050187B），確認以下 4 個新 pattern。

需要新增到 `hospital-lab-patterns/patterns/catalog.js`：

| id | Regex | Unit | Category | Notes |
|---|---|---|---|---|
| `UrineOB` | `/(?:\bOB\|\bOCCL):\s*([+-]+(?:\/[+-])?\|\d+\+)/` | 定性 | 尿液常規 | 兩種格式：長 `OB: -` (vhyl/舊版) 短 `OCCL: 1+ (-)` (vhtt/新版) |
| `UrineGlucose` | `/(?:\bGlucose\|\bGLU):\s*([+-]+(?:\/[+-])?\|\d+\+)/` | 定性 | 尿液常規 | 長 `Glucose: -` 短 `GLU: 4+ (-)`。需 orderNameFilter 與 GluAC 區分 |
| `UrineCr` | `/Creatinine\s*\((?:24hrs?\s*)?Urine\):\s*([<>]?\s*[\d.]+)/i` | mg/dL | 尿液 | 來源：Urine Microalbumin(TT)+Creatinine(TT)。與 CREAT `(serum)` 不衝突 |
| `UrineProtein` | `/尿蛋白\s+([\d.]+)\s*mg\/dL/i` | mg/dL | 尿液 | 來源：Urine total protein(TT) **子頁面**。inline 只有 RATTC/T.PROT ratio |

**orderNameFilter（UrineOB + UrineGlucose 共用）：**
```javascript
orderNameFilter: /CHEM\s*EXAM|尿液|Urine protein/i
```

**Col 15 (Urine_Total_Protein) 結論：匯出時留空**
經驗證 42 位病患 + 000050187B 的 Urine total protein(TT) 子頁面，
`Total volume 總容積` 和 `24h urine Protein` 欄位在所有報告中均為空值。
Col 15 對應的 24hr 尿蛋白在 CKD 門診幾乎不做。匯出時留空處理。

**UPCR pattern 修正（bonus）：**
Urine total protein(TT) 的 inline reportText 有兩種格式：
- `RATTC: 200.89` — 已被現有 UPCR pattern 匹配 ✅
- `T.PROT/CREAT: 5037` — 現有 UPCR pattern **不匹配** ❌
  需在 UPCR pattern 加入 `T\.?PROT\/CREAT` alternation

#### ernode 實測資料摘要

**CHEM EXAM(TT) — 兩種 reportText 格式：**
```
格式 A（長名）：Bilirubin: -  CLEAR: clear  COLOR: colorless  Glucose: -
  Ketone: -  LEU: -  Nitrite: -  OB: -  PH: 7.5  SG: 1.003  UROBI: -
格式 B（短名+ref）：BILI: - (-)  CLEAR: clear  COLOR: yellow
  GLU: - (-)  KETO: - (-)  LEU: 3+ (-)  NITRI: - (-)
  OCCL: 1+ (-)  PH: 5.5  SG: 1.019  UROBI: - (-)
```
第一批 42 病患中 64 筆 CHEM EXAM 全部使用格式 B（短名）。格式 A 見於個別舊報告。
第二批 42 病患中 22 人有 CHEM EXAM，全部也是格式 B。

**OCCL（尿潛血）值分佈（合併兩批 84 病患）：**
| 值 | 第一批 | 第二批 | 合計 |
|---|---|---|---|
| `-` | 33 | 76 | 109 |
| `+/-` | 7 | 26 | 33 |
| `1+` | 15 | 10 | 25 |
| `2+` | 7 | 12 | 19 |
| `3+` | 2 | 2 | 4 |

**GLU（尿糖）值分佈（合併兩批 84 病患）：**
| 值 | 第一批 | 第二批 | 合計 |
|---|---|---|---|
| `-` | 46 | 98 | 144 |
| `+/-` | 8 | 6 | 14 |
| `1+` | 1 | 0 | 1 |
| `4+` | 9 | 22 | 31 |

**Urine Microalbumin(TT) — 第二批 42 人中 34 人有此檢驗。**
inline 格式與第一批一致：`Creatinine(24hrs Urine): <值>  mALB: <值>  ALB/CR: <值>`
範例（000055062J）：`Creatinine(24hrs Urine): 111  mALB: 0.31  ALB/CR: 2.79`

**Urine total protein(TT) — 第二批 42 人中 0 人有此檢驗。**
結合第一批（少數人有），此項在 CKD 門診並非常規檢驗。

**Urine total protein(TT) — inline reportText（ernode）：**

vhtt 統一使用 `T.PROT/CREAT:` 格式（非 `RATTC:`）。
42+3 位 vhtt 病患中無任何 `RATTC:` 出現，`RATTC:` 可能為 vhyl 專用或已棄用。

實測範例：
| 病歷號 | inline reportText | 備註 |
|---|---|---|
| 000026353G | `T.PROT/CREAT: 1250.00` | 有值 |
| 000026353G | `T.PROT/CREAT: 1051.28` | 有值 |
| 000072074B | `T.PROT/CREAT: 98.04` | 有值 |
| 000050187B | `T.PROT/CREAT: 5671` | 有值（無小數） |
| 000050187B | `T.PROT/CREAT: 5037` | 有值 |
| 000050187B | （空，顯示「Click 正式報告」） | 舊報告無 inline 值 |

**現有 UPCR regex 不匹配 `T.PROT/CREAT:`** → 必須加入 `T\.?PROT\/CREAT` alternation。

**Urine total protein(TT) — 子頁面（opdweb）實測範例：**

| 病歷號 | OrdApNo | 尿蛋白 (mg/dL) | UPCR (mg/gm) | Total volume | 24h urine Protein |
|---|---|---|---|---|---|
| 000026353G | 10434399 | 87 | 906.25 | （空） | （空） |
| 000026353G | 11436575 | 45 | 1250.00 | （空） | （空） |
| 000072074B | 11212224 | 10 | 98.04 | （空） | （空） |
| 000050187B | 10092733 | 198.5 | 5671 | （空） | （空） |
| 000050187B | 10202824 | 182.9 | （空） | （空） | （空） |

子頁面固定格式：
```
Urine total protein   <值>   random urine:1-14mg/dL
尿蛋白                       mg/dL
UPCR:                 <值>   尿蛋白與尿肌酸酐比值
                              mg/gm   <150 mg/gm
Total volume  總容積                              ← 永遠空白
24h urine Protein     *10^3  mg/24hrs             ← 永遠空白
```

**關鍵發現：**
- **UrineProtein**（尿蛋白 mg/dL）只在子頁面有，inline 沒有 → 需 subpage enrichment
- **UPCR**：inline 用 `T.PROT/CREAT: <值>`，子頁面用 `UPCR: <值>`，數值一致
- 部分舊報告子頁面 UPCR 值為空，但尿蛋白定量有值
- **Total volume / 24h urine Protein**：全部空白 → Col 15 留空確認

**Urine Microalbumin(TT) + Creatinine(TT) — inline 格式：**
```
Creatinine(24hrs Urine): 25  mALB: 1.43  ALB/CR: 57.20
```

**UrineProtein 需 subpage enrichment config：**
```javascript
subpage: {
  orderNameMatch: /Urine total protein|尿蛋白定量/i,
  // sub-page 中 "尿蛋白 XXX mg/dL" 會被 pattern 抓到
}
```

**定性值正規化規則（UrineOB + UrineGlucose 共用）：**

Catalog regex capture 原始值後，export 層統一正規化為方括號格式。
`+/-` 視同陰性（`[-]`）。

| ernode 原始值 | 正規化輸出 | 實測筆數（OCCL / GLU） |
|---|---|---|
| `-` | `[-]` | 148 / 208 |
| `+/-` | `[-]` | 48 / 24 |
| `+`, `1+` | `[+]` | 50 / 6 |
| `++`, `2+` | `[++]` | 26 / 0 |
| `+++`, `3+` | `[+++]` | 6 / 0 |
| `++++`, `4+` | `[++++]` | 0 / 40 |

vhtt 實測 86 位病患、278 筆 CHEM EXAM，只出現 `-`/`+/-`/`1+`/`2+`/`3+`/`4+` 六種值。
`+`/`++`/`+++`/`++++`（多加號格式）未出現但保留相容。

**實作位置：** `export-formats/renal-platform-xlsx.js` 的 cell formatter。
Catalog pattern 只負責 capture 原始字串（如 `1+`、`-`、`++`），
正規化映射在 export 時才進行。

**正規化函式邏輯（pseudo）：**
```javascript
function normalizeQualitative(raw) {
  if (!raw || raw === '-' || raw === '+/-') return '[-]';
  const m = raw.match(/^(\d+)\+$/);  // "1+" → [+], "2+" → [++], ...
  if (m) return '[' + '+'.repeat(Number(m[1])) + ']';
  // "+", "++", "+++", "++++" 多加號格式
  const plusCount = (raw.match(/\+/g) || []).length;
  if (plusCount > 0) return '[' + '+'.repeat(plusCount) + ']';
  return '[-]'; // unknown → 陰性
}
```

### 1.4 Monthly Detection Logic

CKD 門診通常 1–3 個月抽血一次（不像透析每月固定）。
月檢識別邏輯比透析簡單：

- **不需要** BUN pre/post 分類
- **不需要** dialysis-specific 的叢集判斷
- 每次 lab order 有 Cr + BUN → 視為一次檢查
- 同月多次取最早（同 dialysis 邏輯）
- 匯出粒度：one row per patient per check date

### 1.5 Patient Fields

CKD 不需洗腎日期/班別。可能需要：
- CKD 分期（P1 早期 / P2 中晚期）— 可從 eGFR computed
- 收案日期 — 非 lab，手動輸入或留空

**建議先不加額外欄位**，demographics（name/sex/age）自動填入即可。
CKD stage 用 computed value 顯示在 lab 表格裡。

## 2. Build Pipeline Changes

### 2.1 `build.js` — 新增 CKD disease config

```javascript
const DISEASES = {
  dialysis: { /* existing */ },
  ckd: {
    title: '初期慢性腎臟病檢驗資料管理',
    groupId: 'early-ckd',
    exportFormats: ['renal-platform-xlsx'],
    init: "window.ACTIVE_GROUP_ID = 'early-ckd';",
  },
};
```

### 2.2 `core/storage.js` — Disease ID parameterization

Phase 1 留了 `ACTIVE_GROUP_ID = 'dialysis'` 硬碼。現在需要改成由
build 注入：

```javascript
// build.js 在 init placeholder 注入:
// window.ACTIVE_GROUP_ID = 'early-ckd';
// storage.js 讀取:
const ACTIVE_GROUP_ID = window.ACTIVE_GROUP_ID || 'dialysis';
const GROUP = window.GROUPS[ACTIVE_GROUP_ID];
```

### 2.3 Output

```
node build.js ckd → hospital-lab-ckd.html
```

## 3. Export: 腎臟病平台 檢驗數據 xlsx

### 3.1 Format

- **Output:** `.xlsx` file (single sheet)
- **Library:** SheetJS (xlsx) — CDN or inline
- **Sheet name:** `檢驗數據` (or `工作表1` to match template)
- **Header row:** Yes (Row 1 = English keys, Row 2 = Chinese labels,
  Row 3 = units)
- **Data rows:** Row 4+ = one row per patient per check date

### 3.2 Complete Field Mapping (23 columns)

| Col | Key | Label | Unit | Source | Pattern ID | Notes |
|---|---|---|---|---|---|---|
| A | CID | 病歷號 | | patient.chartno | — | |
| B | Chk_Date | 檢查日期 | yyyy/mm/dd | check date | — | 西元年 |
| C | Creatinine | Creatinine | mg/dl | lab | `CREAT` | |
| D | Urea_Nitrogen | Urea Nitrogen | mg/dl | lab | `BUN` | 通用 BUN |
| E | Hct | Hct | % | lab | `HCT` | |
| F | HbA1C | HbA1c | % | lab | `HbA1c` | |
| G | Uric_Acid | Uric Acid | mg/dl | lab | `UA` | |
| H | Cholesterol | Cholesterol | mg/dl | lab | `CHOL` | |
| I | Triglyceride | Triglyceride | mg/dl | lab | `TG` | |
| J | Albumin | Albumin | g/dl | lab | `Albumin` | |
| K | Urine_Proteine | Urine Protein | mg/dl | lab | `UrineProtein` | **NEW pattern** |
| L | OB | OB | | lab | `UrineOB` | **NEW** 定性 `[-]` `[+]` `[++]` `[+++]` |
| M | Sugar_AC | Sugar[AC] | mg/dl | lab | `GluAC` | |
| N | LDL_Cholesterol | LDL-cholesterol | mg/dl | lab | `LDL` | |
| O | Urine_Total_Protein | Urine Total Protein | mg/dl | — | — | **留空** (24hr尿蛋白，門診不做) |
| P | Urine_creatinial | Urine creatinial | mg/dl | lab | `UrineCr` | **NEW pattern** |
| Q | Urine_PCR | UPCR | mg/gm | lab | `UPCR` | Catalog ✅ |
| R | ACRatio | UACR | μg/mg | lab | `UACR` | Catalog ✅ |
| S | Urine_Glucose | 尿糖 | | lab | `UrineGlucose` | **NEW** 定性 |
| T | Height | Height | cm | — | — | **Blank** |
| U | Weight | Weight | kg | — | — | **Blank** |
| V | BP1 | 收縮壓 | mmHg | — | — | **Blank** |
| W | BP2 | 舒張壓 | mmHg | — | — | **Blank** |

### 3.3 Date Format

西元年 `yyyy/mm/dd`（例：`2025/05/07`）。不需民國年轉換。

### 3.4 Qualitative Fields (OB, Urine Glucose) ✅ verified

格式要求：`以中括號包起來`

ernode 實測值分佈（42 病患 64 筆 CHEM EXAM）：
- OCCL: `-` 33 | `+/-` 7 | `1+` 15 | `2+` 7 | `3+` 2
- GLU:  `-` 46 | `+/-` 8 | `1+` 1  | `4+` 9

| ernode 原始值 | 匯出值 |
|---|---|
| `-` | `[-]` |
| `+/-` | `[+]` |
| `1+` | `[+]` |
| `2+` | `[++]` |
| `3+` | `[+++]` |
| `4+` | `[+++]` |
| missing | blank |

### 3.5 Export Function

```javascript
// export-formats/renal-platform-xlsx.js
function exportRenalPlatformXlsx(patients, labData, groupConfig) {
  const selected = getSelectedChartNos();
  // ... build worksheet data
  // ... use SheetJS to create xlsx
  // ... download
}
```

### 3.6 SheetJS Integration

SheetJS (xlsx) library 需要 inline 到 build output。選項：

**Option A: CDN at runtime** — 在 HTML 加 `<script src>` 從 CDN 載入。
缺點：需要網路，`file://` 可能 CORS 問題。

**Option B: Inline minified** — 把 SheetJS minified 版本放到
`lib/xlsx.mini.min.js`，build 時 concat 進去。
優點：離線可用，與現有架構一致。
缺點：增加 HTML 大小 (~200KB)。

**Option C: 純手工 xlsx** — 不用 SheetJS，直接產生 xlsx（實際是 zip
of xml）。
缺點：實作複雜，不值得。

**建議 Option B**（inline minified），與 KiDiTi export 的純 JS 方式
一致，離線環境友善。

## 4. UI Differences from Dialysis

### 4.1 Title
`初期慢性腎臟病檢驗資料管理`

### 4.2 Button Bar
```
[新增清單(small,green)]   [全部更新(large,blue)] ──gap── [匯出腎平台資料(large,orange)] [匯出csv(large,orange)]
```

- 「匯出KiDiTi資料」→ 改成「匯出腎平台資料」
- 「匯出csv」保留（通用 CSV 匯出，long format）

### 4.3 Lab Table
- 顯示 CKD manifest 的檢驗項目（不同於 dialysis）
- 加入 computed values：eGFR, GFRStage, UACRStage, UPCRStage,
  TaiwanCKD, EarlyCKD, KDIGORisk（已在 computed.js 裡）
- 不顯示 URR、CaxP（透析專用）
- 不顯示 BUN_pre/BUN_post（CKD 只有通用 BUN）

### 4.4 Patient List
- 不顯示「洗腎日期」「班別」欄位
- Checkbox 勾選機制沿用（Phase 1.5, core 功能）

## 5. Execution Steps

### Step 0: Pattern Learning ✅ done 2026-05-08
已用 Cowork + Chrome 自動化查詢 **兩批共 84 位** CKD 病患的 ernode 報告。
- 第一批 42 人：CHEM EXAM 64 筆、Urine Microalbumin 多筆、Urine total protein 少數
- 第二批 42 人：CHEM EXAM 22 人（全格式 B）、Urine Microalbumin 34 人、Urine total protein 0 人
確認 UrineOB, UrineGlucose, UrineCr, UrineProtein 的 reportText
格式及 regex。Col 15 (UTP24) 確認門診不做，留空。
詳見 §1.3。

### Step 1: Add new catalog patterns + fix UPCR
`hospital-lab-patterns/patterns/catalog.js`：
- 新增 4 個尿液項目（UrineOB, UrineGlucose, UrineCr, UrineProtein）
- 修正 UPCR pattern 加入 `T\.?PROT\/CREAT` alternation

### Step 2: Create CKD manifest
可以放在 `hospital-lab-patterns/patterns/reporter.js` 新增
`CKD_MANIFEST`，或在 `groups/early-ckd.js` 內定義 labManifest。

**建議：** CKD manifest 定義在 `groups/early-ckd.js`（group 自包含），
引用 catalog pattern IDs。

### Step 3: Create `groups/early-ckd.js`
Group module: storageKey, patientFields, labManifest,
detectMonthlyDraws (simplified), no BUN pre/post logic.

### Step 4: Create `export-formats/renal-platform-xlsx.js`
xlsx exporter using SheetJS. 23 columns mapping.

### Step 5: Add SheetJS library
下載 `xlsx.mini.min.js` 放到 `lib/`，build.js 串接。

### Step 6: Update `build.js`
新增 `ckd` disease config，build 時包含 SheetJS + renal-platform-xlsx。

### Step 7: Update `core/storage.js`
`ACTIVE_GROUP_ID` 改為從 `window.ACTIVE_GROUP_ID` 讀取。

### Step 8: Build and verify
```
node build.js ckd → hospital-lab-ckd.html
node build.js dialysis → hospital-lab-dialysis.html (不能壞)
```

### Step 9: Update docs
WORKLOG.md, CLAUDE.md (新增 CKD group 說明)

## 6. Dependencies

1. ✅ 新 catalog patterns regex 已設計完成（4 個：UrineOB, UrineGlucose, UrineCr, UrineProtein）
2. ✅ UPCR pattern 需加 `T\.?PROT\/CREAT` alternation (bonus fix)
3. ⬜ `npm run release` in patterns
4. ⬜ SheetJS library 取得
5. ⬜ `core/storage.js` parameterization (ACTIVE_GROUP_ID)

## 7. Cross-repo Impact

- **hospital-lab-patterns**: 新增 5 個 catalog entries（尿液相關）
- **hospital-lab-viewer**: 無影響（viewer 不用這些 CKD patterns）
- **hospital-lab-reporter**: 新增 group + exporter + build config

## 8. Testing Checklist

- [ ] `node build.js ckd` 產出 `hospital-lab-ckd.html`
- [ ] `node build.js dialysis` 產出不變的 `hospital-lab-dialysis.html`
- [ ] CKD HTML 開啟正常，title 顯示「初期慢性腎臟病」
- [ ] 新增 CKD 病患 → fetch → 顯示 lab 表格
- [ ] Lab 表格顯示 CKD manifest 項目（不含 URR/CaxP）
- [ ] Computed values: eGFR, GFRStage, TaiwanCKD, EarlyCKD 正常顯示
- [ ] UPCR / UACR 正確 parse
- [ ] UrineOB / UrineGlucose 定性正確 parse
- [ ] 匯出腎平台資料 → 下載 .xlsx
- [ ] xlsx 有 3 行 header (key / label / unit)
- [ ] Data rows: 23 欄正確對應
- [ ] Date format: yyyy/mm/dd 西元年
- [ ] OB/尿糖: 中括號格式 `[-]` `[+]` etc.
- [ ] Non-lab 欄位 (Height/Weight/BP) 為空
- [ ] Checkbox 勾選 → 匯出只含勾選病患
- [ ] 匯出csv (long format) 正常運作
- [ ] CKD 和 Dialysis 的 localStorage 完全分離
- [ ] Dialysis HTML 行為不受影響

## 9. Scope Boundary

**不在此 phase：**
- 個案匯入格式（168 欄 — deferred）
- 護理衛教匯入格式（103 欄 — deferred）
- 健保署 CKD 定長 txt（nhi-ckd/ — deferred）
- Pre-ESRD 檢驗數據（Phase 5）
- CKD stage UI 編輯（computed 自動算就好）

## 10. Open Questions — 全部已解決 ✅

1. ✅ **Col 11 vs Col 15**: 不同。Col 11 = 隨機尿蛋白定量 (Urine total
   protein, mg/dL)。Col 15 = 24hr 尿蛋白（門診不做，留空）。
2. ✅ **UACR unit**: μg/mg = mg/g，等價確認。
3. ✅ **SheetJS 方案**: Option B (inline minified) confirmed。
4. ✅ **Pattern learning**: 已用 42+ 位 CKD 病患驗證完成。
   所有 regex pattern 已從 ernode 實測資料設計確認（見 §1.3）。
