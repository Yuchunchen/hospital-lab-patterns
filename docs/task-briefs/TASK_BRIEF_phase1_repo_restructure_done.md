# TASK_BRIEF: Phase 1 — Repo Restructure (Core Extraction + Build Pipeline)

**Parent:** `TASK_BRIEF_multi_disease_export.md`
**Execution mode:** Claude Code (multi-file refactor, git, sync-patterns)

## Goal

Extract the shared "app shell" code from the monolithic
`hospital-lab-data.html` into reusable `core/` modules. Build a pipeline
(`build.js`) that assembles `core/ + groups/<disease>.js → standalone HTML`.
The existing dialysis page must work identically after restructure —
including Phase 2 (KiDiTi export) and Phase 1.5 (patient selection)
features already in the HTML.

## Pre-requisites completed

- **Phase 2 ✅** — KiDiTi export (`exportKiDiTiCSV()`, `toMinguoDate()`,
  `mapHepYNO()`, button bar with 3 buttons) already in HTML
- **Phase 1.5 ✅** — Patient selection (checkbox column,
  `toggleSelectAll()`, `getSelectedChartNos()`, modified export functions)
  already in HTML

These functions must also be extracted into appropriate core modules.

## Current Structure (pre-restructure)

> **Note:** Line numbers below are approximate — re-check with `grep -n`
> before extraction, as Phase 2 + 1.5 have added ~200+ lines.

```
hospital-lab-data.html          ~3700 lines (post Phase 2 + 1.5)
├── Lines 1–321:    HTML + CSS (UI shell, styles, modal markup)
├── Lines 322–1268: <script> → __PATTERNS__ block (auto-synced)
├── Lines 1270–1815: __GROUPS__ block (auto-synced, currently dialysis.js only)
└── Lines 1816–~3700: App JS code (~1900 lines of hand-written logic)
    ├── Storage helpers (load/save patients, labs, settings)
    ├── Date utilities (parseDateTaiwan, parseDateResdttm, toMinguoDate…)
    ├── Chart number formatting (formatChartNo)
    ├── API fetch pipeline (fetchAllOrders, fetchIncremental)
    ├── IndexedDB orders cache (openOrdersDB, ordersCacheGet/Put/Delete)
    ├── Sub-page enrichment (enrichMissingValues, fetchSubpageText…)
    ├── Lab value extraction (extractLabValues, classifyBUNPrePost)
    ├── Computed values (computeDerivedValues)
    ├── UI: tabs, toast, patient list (sort/filter/render)
    ├── Patient selection (checkbox, toggleSelectAll, getSelectedChartNos)  ← Phase 1.5
    ├── Patient CRUD (addAndUpdate, refreshExisting, refreshOne, remove)
    ├── Lab detail view (viewPatientLab)
    ├── CSV export (exportCombinedCSV)
    ├── KiDiTi export (exportKiDiTiCSV, toMinguoDate, mapHepYNO)           ← Phase 2
    └── Settings tab (loadSettingsUI, saveSettings)
```

## Target Structure (post-restructure)

```
hospital-lab-reporter/
├── core/
│   ├── styles.css              # extracted CSS (lines 8–217 of current HTML)
│   ├── shell.html              # HTML template with placeholders:
│   │                             {{TITLE}}, {{STYLES}}, {{PATTERNS}},
│   │                             {{GROUPS}}, {{CORE_JS}}, {{DISEASE_INIT}}
│   ├── storage.js              # load/savePatients, load/saveLabData,
│   │                             load/saveSettings — parameterized by
│   │                             group.storageKey
│   ├── fetch.js                # fetchAllOrders, fetchIncremental,
│   │                             parsePatientInfo, parseOrdersPage,
│   │                             formatChartNo
│   ├── indexeddb-cache.js      # openOrdersDB, ordersCacheGet/Put/Delete
│   ├── enrichment.js           # enrichMissingValues, fetchSubpageText,
│   │                             applySubpageText, enrichCache helpers
│   ├── lab-extract.js          # extractLabValues (generic, filter-aware)
│   ├── compute.js              # computeDerivedValues (delegates to
│   │                             COMPUTED_TESTS from patterns)
│   ├── date-utils.js           # parseDateTaiwan, parseDateResdttm,
│   │                             toTaiwanDate, toShortDate, toSortableDate,
│   │                             toMinguoDate, todayStr
│   ├── ui-tabs.js              # switchTab, showToast, escHtml, escAttr
│   ├── ui-patient-list.js      # buildPatientColumns, renderPatientList,
│   │                             renderPatientHead/Body, sort/filter state,
│   │                             cyclePatientSort, setPatientFilter,
│   │                             patientCellValue, compareForColumn,
│   │                             applyPatientFilters/Sort
│   ├── ui-patient-select.js    # toggleSelectAll, togglePatientSelect,
│   │                             updateSelectState, updateSelectUI,
│   │                             getSelectedChartNos, selectedPatients Set
│   ├── ui-patient-crud.js      # addAndUpdateFromInput,
│   │                             refreshExistingPatients, refreshOnePatient,
│   │                             confirmRemovePatient, closeConfirm,
│   │                             updatePatientField, fetchAndStore
│   ├── ui-lab-view.js          # viewPatientLab (the big lab history table)
│   ├── ui-settings.js          # loadSettingsUI, saveSettings
│   └── export-utils.js         # downloadBlob, setStatus, parseChartNoList
│
├── groups/
│   └── dialysis.js             # unchanged (already modular)
│
├── export-formats/
│   └── kiditi-csv.js           # KiDiTi 檢驗記錄 CSV (Phase 2, extract
│   │                             from HTML: exportKiDiTiCSV, mapHepYNO)
│
├── build.js                    # NEW: assembles core + group → HTML
├── sync-patterns.js            # MODIFIED: sync into built HTML(s)
├── hospital-lab-data.html      # kept as-is until migration verified
├── hospital-lab-dialysis.html  # NEW: built output (replaces data.html)
└── package.json                # add build script
```

## Key Design Decisions

### 1. Core modules are plain JS (no ES modules, no bundler)

The target environment is a standalone HTML file opened via `file://` or
localhost. No webpack/rollup/vite — just concatenation. Each `core/*.js`
file uses IIFE or attaches to a shared namespace (`window.LabCore = {}`).

```javascript
// Example: core/date-utils.js
(function(exports) {
  'use strict';
  exports.parseDateTaiwan = function(str) { ... };
  exports.parseDateResdttm = function(str) { ... };
  // ...
})(window.LabCore = window.LabCore || {});
```

### 2. Build pipeline (`build.js`)

`build.js` reads the template (`core/shell.html`), concatenates core
modules, and injects patterns + groups to produce a standalone HTML file.

```
node build.js dialysis   → hospital-lab-dialysis.html
node build.js ckd        → hospital-lab-ckd.html      (Phase 3)
node build.js dm         → hospital-lab-dm.html        (Phase 4)
node build.js esrd       → hospital-lab-esrd.html      (Phase 5)
```

Each disease config specifies:
- `title` — HTML `<title>`
- `group` — which `groups/<id>.js` to include
- `coreModules` — which `core/*.js` files (most diseases share all)
- `exportFormats` — which `export-formats/*.js` files to include

### 3. sync-patterns.js update

Current `sync-patterns.js` patches `hospital-lab-data.html` with markers.
After restructure, it should:

- Still patch `hospital-lab-data.html` (legacy, until removed)
- Also run `build.js` for each configured disease (or `build.js` itself
  reads patterns directly without needing markers in the output)

**Preferred approach:** `build.js` reads patterns files directly
(not via markers). The built HTML doesn't need markers at all — it's a
throwaway artifact. `sync-patterns.js` continues to maintain the legacy
`hospital-lab-data.html` for the transition period.

### 4. Storage namespace parameterization

Current code uses hardcoded keys like `dialysis_patients`, `dialysis_lab_data`.
Core storage module accepts the group's `storageKey` config:

```javascript
// core/storage.js
exports.loadPatients = function(group) {
  return JSON.parse(localStorage.getItem(group.storageKey.patients) || '{}');
};
```

The `groups/<id>.js` already defines `storageKey` — the core functions
just need to accept it as a parameter instead of hardcoding.

### 5. Disease-specific UI wiring

Each group module defines:
- `patientFields` — columns in patient list (dialysis: dialysisDays, shift)
- `labManifest` — test items to display / export
- `detectMonthlyDraws` — monthly check detection logic
- `resolveBUN` — BUN pre/post classification (dialysis-specific)
- `csvExporter` — existing CSV export logic

The core UI modules call group-specific functions via a global registry:

```javascript
// In built HTML, init block:
window.ACTIVE_GROUP = window.GROUPS.dialysis;
```

Core modules then reference `window.ACTIVE_GROUP` for group-specific
behavior.

## Step-by-Step Execution Plan

### Step 1: Extract CSS → `core/styles.css`

Copy lines 8–217 (inside `<style>`) to `core/styles.css`. No logic changes.

### Step 2: Create HTML template → `core/shell.html`

Create a template with placeholders. The structure mirrors the current HTML
but with insertion points:

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}}</title>
<style>
{{STYLES}}
</style>
</head>
<body>
  {{BODY_HTML}}
  <script>
  'use strict';
  {{PATTERNS}}
  {{GROUPS}}
  {{CORE_JS}}
  {{DISEASE_INIT}}
  </script>
</body>
</html>
```

### Step 3: Extract core JS modules

Split the ~1900 lines of app JS into the `core/*.js` files listed above.
This includes Phase 2 code (exportKiDiTiCSV, toMinguoDate, mapHepYNO)
and Phase 1.5 code (patient selection checkbox functions). Each
extraction is mechanical — move functions, wrap in namespace pattern.

**Critical:** Every function that references another must go through the
namespace (`LabCore.xxx`) or be in the same module. Identify dependencies
graph first:

```
fetch.js        → date-utils.js, export-utils.js (formatChartNo, setStatus)
indexeddb-cache.js → (standalone)
enrichment.js   → (standalone, uses DOM fetch)
lab-extract.js  → date-utils.js (parseDateResdttm)
compute.js      → (uses COMPUTED_TESTS from patterns)
ui-patient-crud.js → fetch.js, storage.js, lab-extract.js, compute.js,
                     enrichment.js, indexeddb-cache.js, ui-patient-list.js
ui-lab-view.js  → date-utils.js, ui-tabs.js
ui-settings.js  → storage.js
```

### Step 4: Create `build.js`

The build script:
1. Reads `core/shell.html` template
2. Reads `core/styles.css`
3. Reads and concatenates `core/*.js` in dependency order
4. Reads `patterns/catalog.js`, `patterns/reporter.js` (+ resolver)
5. Reads `groups/<disease>.js`
6. Reads `export-formats/<format>.js` (if any)
7. Fills placeholders and writes `hospital-lab-<disease>.html`

Disease configs:

```javascript
const DISEASES = {
  dialysis: {
    title: '洗腎室檢驗資料管理',
    group: 'dialysis',
    exportFormats: [],  // Phase 2 adds kiditi-csv
    init: 'window.ACTIVE_GROUP = window.GROUPS.dialysis;',
  },
  // ckd, dm, esrd added in later phases
};
```

### Step 5: Update `sync-patterns.js`

Add a post-sync step that runs `build.js` for all configured diseases.
Or keep them separate — user runs `node sync-patterns.js` then
`node build.js dialysis`.

### Step 6: Verify byte-identical behavior

1. Build `hospital-lab-dialysis.html`
2. Open in browser alongside `hospital-lab-data.html`
3. Both must:
   - Load existing patient list from localStorage
   - Display lab data table identically
   - Export CSV with identical content
4. Run automated diff if possible (save CSV from both, `diff`)

### Step 7: Update package.json

```json
{
  "scripts": {
    "build": "node build.js",
    "build:dialysis": "node build.js dialysis",
    "sync": "node sync-patterns.js",
    "sync-and-build": "node sync-patterns.js && node build.js"
  }
}
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Namespace collisions | Functions shadow each other | Strict `LabCore.` prefix; lint for undeclared globals |
| Closure scope changes | Variables no longer share scope after splitting | Audit each extracted module for cross-references; test |
| IndexedDB version mismatch | Users lose cached orders | Keep DB_VER=1; same schema |
| localStorage key changes | Users lose patient data | Keys unchanged; only parameterize access pattern |
| `file://` CORS | Sub-page enrichment already blocked | No change; document the limitation |
| Build output drift | Built HTML diverges from legacy | Keep legacy `hospital-lab-data.html` until Phase 2 complete; dual-test |

## Dependencies

- **None** on other phases. This is the foundation.
- Phase 2 (KiDiTi export) can proceed in parallel on the legacy HTML.

## Verification Checklist

- [ ] `node build.js dialysis` produces `hospital-lab-dialysis.html`
- [ ] Built HTML loads in browser (file:// and localhost)
- [ ] Patient list loads from existing localStorage data
- [ ] Add new patient → fetch → display works
- [ ] Lab detail table renders correctly (all 37 tests + 2 computed)
- [ ] Sort / filter patient list works, state persists
- [ ] "全部更新" refreshes all patients
- [ ] Incremental fetch (IndexedDB cache) works
- [ ] Sub-page enrichment fires for opt-in tests
- [ ] Detection-limit values (`<2` Al) display correctly
- [ ] "匯出csv" produces identical output to legacy HTML
- [ ] "匯出KiDiTi資料" produces identical output to legacy HTML (Phase 2)
- [ ] Patient checkbox selection works (Phase 1.5)
- [ ] Select 3 patients → export KiDiTi → only 3 rows
- [ ] Select 3 patients → export CSV → only 3 rows
- [ ] No selection → export all (unchanged behavior)
- [ ] Settings tab loads/saves correctly
- [ ] `sync-patterns.js` still works on legacy HTML
- [ ] `groups/dialysis.js` unchanged (no edits)

## File Changes Summary

| File | Action |
|---|---|
| `core/styles.css` | **New** — extracted from HTML `<style>` |
| `core/shell.html` | **New** — HTML template |
| `core/storage.js` | **New** — extracted storage helpers |
| `core/fetch.js` | **New** — extracted API fetch pipeline |
| `core/indexeddb-cache.js` | **New** — extracted IndexedDB cache |
| `core/enrichment.js` | **New** — extracted enrichment logic |
| `core/lab-extract.js` | **New** — extracted lab value extraction |
| `core/compute.js` | **New** — extracted computed values |
| `core/date-utils.js` | **New** — extracted date utilities |
| `core/ui-tabs.js` | **New** — extracted tab/toast/escape helpers |
| `core/ui-patient-list.js` | **New** — extracted patient list rendering |
| `core/ui-patient-select.js` | **New** — extracted patient selection (Phase 1.5) |
| `core/ui-patient-crud.js` | **New** — extracted patient CRUD operations |
| `core/ui-lab-view.js` | **New** — extracted lab detail view |
| `core/ui-settings.js` | **New** — extracted settings tab |
| `core/export-utils.js` | **New** — extracted download/status helpers |
| `export-formats/kiditi-csv.js` | **New** — extracted KiDiTi export (Phase 2) |
| `build.js` | **New** — build pipeline |
| `sync-patterns.js` | **Modified** — add post-sync build step |
| `package.json` | **Modified** — add build scripts |
| `hospital-lab-data.html` | **Unchanged** — kept as legacy |
| `hospital-lab-dialysis.html` | **New** — built output |
| `groups/dialysis.js` | **Unchanged** |
| `WORKLOG.md` | **Updated** |

## Notes

- **Phase 1 was deferred past Phase 2 + 1.5.** Both were implemented
  directly on the monolithic HTML. Phase 1 restructure now extracts the
  already-working code (including KiDiTi export and patient selection).
  Phase 1 becomes essential before Phase 3 (first new disease HTML).
- **Migration path:** Once Phase 1 is verified, users switch from
  `hospital-lab-data.html` to `hospital-lab-dialysis.html`. The old file
  stays until all users confirm the new one works.
- **`core/*.js` are NOT standalone scripts** — they're concatenation units
  designed to be inlined into a single `<script>` block. They cannot be
  loaded as separate `<script src>` files due to `file://` restrictions.
