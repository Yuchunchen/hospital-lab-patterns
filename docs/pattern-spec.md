# Pattern entry specification

Authoritative field reference for entries in `patterns/viewer.js` and
`patterns/reporter.js`. The runtime helper `validateCatalog()` in
`patterns/schema.js` enforces this spec.

> The schema is a **superset** of fields used by both consumers. An entry
> only needs the fields its consumer actually reads — extra fields are
> harmless and useful for migration.

## Identity

| Field | Type | Required | Description |
|-------|------|:-:|-------------|
| `id` | `string` | ✓ | Unique within its catalog. Stable forever (changing it is a breaking change). |

## Detection

| Field | Type | Description |
|-------|------|-------------|
| `pattern` | `RegExp \| null` | Capture group 1 = numeric value (or qualitative token). Use `null` for purely-computed entries. |
| `orderNameFilter` | `RegExp?` | Only orders whose `orderName` matches this regex are considered. Used by reporter to separate `BUN` standalone (post-dialysis) from comma-listed composite panels (pre-dialysis). |
| `orderNameMatch` | `RegExp?` | For `kind:'text'` entries — picks which imaging / endoscopy order to render. |
| `hospitalScope` | `'tt' \| 'yl' \| undefined` | Restricts the entry to one hospital's catalog. Omit for cross-hospital entries (the common case). |

## Display

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | `string` | Long bilingual form, e.g. `"白血球 (WBC)"`. Preferred by viewer. |
| `shortLabel`  | `string?` | Short form, e.g. `"WBC"`. Preferred by reporter. |
| `unit` | `string?` | e.g. `"mg/dL"`, `"×10³/µL"`. |
| `ref` | `string?` | Human-readable reference range. Free-form. |
| `meaning` | `string?` | Plain-language note shown on patient handout. |

## Numeric thresholds

| Field | Type | Description |
|-------|------|-------------|
| `refLo` / `refHi` | `number?` | Numeric bounds of normal range. |
| `lo` / `hi` | `number?` | Alarm thresholds (gender-neutral fallback). Often equal `refLo`/`refHi` but may diverge for clinical reasons. When gender-aware fields exist, `lo`/`hi` must be the wide envelope (`min(loM,loF)` / `max(hiM,hiF)`) for unknown-gender fallback. |
| `loM` / `hiM` | `number?` | Male-specific alarm thresholds. |
| `loF` / `hiF` | `number?` | Female-specific alarm thresholds. |

**Gender-aware alarm logic (added 2026-05-05, SOP G):** When `loM`/`hiM`/`loF`/`hiF`
are present, the viewer and reporter pick the threshold matching the patient's gender;
if gender is unknown, they fall back to `lo`/`hi`. Validate enforces: if any gender
field exists, `lo`/`hi` must also exist as fallback.

Currently migrated: RBC, Hb, HCT, Fe, TIBC, Ferritin (full 4-field), GPT, RGT, BUN, CREAT, UA (hiM/hiF only).

## refHistory — machine × time × gender reference ranges

Added 2026-05-28 (TASK_BRIEF_ref_range_machine_time_dim, Order 5.0). 53 試劑校正類
lab id（CBC / 蛋白 / 肝 / 血脂 / 血糖 / 腎非計算 / 電解質 / 鐵 / 副甲腺 / 重金屬 /
腫瘤 / 甲狀腺 / 肝炎 titer / HIV 量化）各帶 `refHistory[]`。Computed / 影像 / 定性 /
文獻 cut-off（eGFR, UACR, UPCR, …）**不**帶。`BUN_pre` / `BUN_post` 列 in-scope 但
**不獨立** refHistory — lookup 時 fallback 到 `BUN` 的。

| Field | Type | Description |
|-------|------|-------------|
| `refHistory` | `Array?` | 機器 × 時間（× inline 性別）的 ref 版本列。在場時是判定正常/異常的權威來源。 |

每個 item：

```js
{
  machine: 'vhtt' | 'vhyl' | '*',   // '*' = 通用（migration 起點）
  refLo: number | null,              // base 未知性別範圍（必填鍵）
  refHi: number | null,
  refLoM?, refHiM?, refLoF?, refHiF?: number,  // 可選 inline 性別 override
  validFrom: 'YYYY-MM-DD',           // 此 ref 生效起始日（ISO 西元，比對報告日期）
  source: string,                    // 來源說明
}
```

**Migration 起點**：每個 in-scope entry 第一筆 `{machine:'*', refLo:<既有 lo>,
refHi:<既有 hi>, validFrom:'1900-01-01', source:'migration 起點 …'}`。注意 base seed
自 **`lo`/`hi`（現行警示門檻）**，非 `refLo`/`refHi`（教科書值）——YC 2026-05-28 拍板
zero-regression（9 個 entry 兩者分歧時 `lo`/`hi` 是刻意的警示值）。`refLo`/`refHi`/`ref`
維持原樣供 export / 顯示。

**Lookup**（`patterns/lib/resolveRef.js`，bundle 進 viewer mapping.js + reporter
patterns block；是 CODE 不進 dist/patterns.json）：

```
resolveRef(testId, machineSource, reportDate, patientGender, catalogList)
  → { refLo, refHi }
```

候選 = `machine ∈ [machineSource,'*'] && validFrom <= reportDate`；排序 machine-specific
勝 `*`、同 machine validFrom 越晚勝；取第一筆為 base；性別三層 fallback（inline
`refLoM/..` → outer `loM/..` → base `refLo/refHi`）。無 refHistory 或無候選 → 退回 outer
`refLo/refHi`（+ outer 性別欄）；`BUN_pre/post` 退回 `BUN` 的 refHistory。reportDate
缺 → today + `console.warn` 一次。日期支援 ROC `115/04/14` / 西元 `20260414…` / ISO
`2026-04-14`，內部統一轉 ISO 西元再比 `validFrom`。

**Validate 強制**（`schema.js`）：machine ∈ valid set；`validFrom` ISO；base `refLo`/`refHi`
鍵存在；`source` 非空；inline 性別 override 需 base `refLo`/`refHi`；`hospitalScope='tt'`
→ machine 不得 `vhyl`，`='yl'` → 不得 `vhtt`。

SOP C（改 ref range）流程見 `../PROJECT_CONTEXT.md` § 9。

## Categorisation / layout

| Field | Type | Description |
|-------|------|-------------|
| `category` | `string?` | Human-readable group label. |
| `categoryId` | `string?` | Short id for code, e.g. `"CBC"`. Reporter uses `cat` (legacy alias). |
| `section` | `string?` | Viewer section title. |
| `page` | `1 \| 2` | Viewer A4 page. |
| `col` | `1..4` | Viewer column. |

## Filters / scope

| Field | Type | Description |
|-------|------|-------------|
| `gender` | `'M' \| 'F' \| undefined` | Show only for matching gender. Unknown gender → show all. |
| `hivOnly` | `boolean?` | Viewer: only render when the HIV checkbox is on. |
| `dialysisFilter` | `'composite' \| 'standalone_bun' \| undefined` | Reporter: classify a BUN order as pre- vs post-dialysis. (`filter` is the legacy alias.) |
| `qualitative` | `boolean?` | Value is text not number (e.g. `Reactive`). |
| `singleValue` | `boolean?` | Show only the single most-recent occurrence. |

## Value transform

| Field | Type | Description |
|-------|------|-------------|
| `normalize` | `(n:number) ⇒ number` | Applied after capture. Used to harmonise units, e.g. WBC 6700 → 6.7. |

## Computed entries

| Field | Type | Description |
|-------|------|-------------|
| `computed` | `string?` | Computation key. Consumer maps this to a function in `patterns/computed.js`. |
| `needs` | `string[]?` | Source ids this computation depends on. Reporter style. |

## Text-block entries

For viewer page 2 entries (DEXA, endoscopy, sono):

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `'text'` | Marks the entry as a text-form block instead of a numeric value. |
| `rows` | `Row[]` | Each row has `{label, fields[], options[], trailing}`. See viewer.js for examples. |

## Conventions

- Capture group 1 of `pattern` is the value. Use non-capturing `(?:...)`
  for everything else.
- Prefer one regex with alternation over multiple catalog entries:
  `/(?:Glucose(?:\([^)]*\))?|GLU[\s-]*(?:AC)?|Sugar):\s*([\d.]+)/i`.
- For values containing comparison operators (`< 0.1`, `>= 50`), use
  `[<>=]?\s*` before `[\d.]+` in the capture.
- Negative lookaheads `(?!...)` are useful to reject unwanted matches
  (the WBC pattern uses `(?!\s*[-–]\s*\d)` to skip urine-routine ranges
  like `WBC: 0-5`).
- Document non-trivial regex with a short comment on intent.
