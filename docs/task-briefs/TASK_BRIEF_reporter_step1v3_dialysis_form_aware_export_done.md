# TASK_BRIEF — Step 1 (v3): Extract dialysis with form-aware export

> **Audience:** Claude Code, running in `hospital-lab-reporter/` repo root.
> Read `CLAUDE.md` first. **This brief supersedes `TASK_BRIEF_step1_done.md`**
> (form-blind, pre-paper-form review) and the v2 of this brief
> (which depended on a patterns-repo Step 0.5 — now deferred).
>
> **No patterns-repo prerequisite.** Step 1 can run as soon as you're
> ready.
>
> **This file is gitignored.** Hand-off note from Cowork to Code.

---

## Why this step

Reorganising `hospital-lab-reporter` from "dialysis-only single-app" into
a multi-disease-group framework. Step 1 carves dialysis logic into a
self-contained module under `groups/dialysis.js`, keyed to the official
paper form so the CSV export drops cleanly into the dialysis room's
existing workflow.

The form (vhtt 病人定期檢查記錄, 制定 2019.11.07) lists exactly which
items are tracked monthly, which are annual, which are only on admission.
The reference image and full row-by-row mapping are in
`PROJECT_CONTEXT.md` § "Form reference (dialysis)".

This step is not a pure refactor — the manifest, periodicity, and CSV
format all change in this slice. Step 2 (BUN reportTime switchover)
remains a separate slice.

### Two items intentionally **deferred** by user (2026-05-04)

- **Kt/V** — not computed in this slice. The form's Kt/V row stays as
  an empty column in CSV (nurses can fill by hand from dialysis machine
  if needed).
- **Aluminum (Al)** — not in the manifest in this slice. Form's Aluminum
  row stays empty. Defer until we have ground-truth sample data
  (vhyl probe on patient 000105069H found 0 aluminum records).

Future re-activation lives in the patterns repo's
`TASK_BRIEF.md` — read that for the "when to revisit" criteria.

---

## Goal

After this step:

1. `groups/dialysis.js` exists and contains:
   - Patient form-fields spec (no operational fields — out of scope)
   - `labManifest` matching the form's lab rows in form order, with
     periodicity metadata (no Kt/V, no Al — both deferred)
   - Display labels matching the form (with typos corrected)
   - Monthly draw detection (cluster-based) and BUN resolver wired in
     (resolver kept inactive — Step 2 activates)
   - CSV exporter with form-aware wide format (see § "CSV format")
2. The shell HTML dispatches all dialysis-specific behaviour through
   this module.
3. localStorage keys migrated (`dialysis_patients` → `patients_dialysis`).
4. New `__HOSPITAL_LAB_GROUPS_BEGIN/END__` markers added;
   `sync-patterns.js` bundles `groups/*.js` into the HTML between them.
5. Behaviour for dialysis is functionally equivalent to today, but the
   CSV export is intentionally different (form-aware format).

---

## Files to touch

| File | Action |
|---|---|
| `groups/dialysis.js` | **NEW** — full module per spec below |
| `hospital-lab-data.html` | Refactor; add `__HOSPITAL_LAB_GROUPS_BEGIN/END__` markers; dispatch through `GROUP_DIALYSIS` |
| `sync-patterns.js` | Extend to bundle `groups/*.js` into HTML between new markers |
| `WORKLOG.md` | New top entry, **繁體中文** |
| `.gitignore` | Confirm `TASK_BRIEF*.md` and `tmp/` are present |

Do **not** touch `../hospital-lab-patterns/` — see deferred-items note
above.

---

## The `groups/dialysis.js` module

### Top-level shape

```js
const DIALYSIS_GROUP = {
  id: 'dialysis',
  label: '透析',

  storageKey: {
    patients: 'patients_dialysis',
    labs:     'labs_dialysis',
  },

  // 病人欄位（除 chartNo / name / age / sex 之外）
  // 操作性欄位（體重、血流量、透析時間、A-K、EPO）依使用者指示，本步驟略過
  patientFields: [
    { key:'startDate',  label:'開始透析日',  type:'date' },
    { key:'frequency',  label:'頻率',
      type:'select', options:['週三次','週二次','其他'] },
    { key:'access',     label:'通路',
      type:'select', options:['AVF','AVG','長期導管','短期導管'] },
    { key:'primaryDx',  label:'原發病因',    type:'text' },
    { key:'note',       label:'備註',        type:'textarea' },
  ],

  // 對應 vhtt 病人定期檢查記錄 (2019.11.07 制定)
  // 順序依紙本表格由上而下
  // Kt/V 和 Aluminum 暫緩處理（user decision 2026-05-04）
  labManifest: [
    // Hematology — monthly
    'WBC','RBC','Hb','HCT','MCV','Platelet',
    // Protein — monthly
    'TP','Albumin',
    // Liver — monthly
    'AST','ALT','ALP','TBili',
    // Lipids — monthly (per user; form's quarterly stripes ignored)
    'TCho','LDL','TG',
    // Glucose — monthly
    'GluAC',
    // BUN + renal — monthly
    { id:'BUN_pre',  displayLabel:'BUN (BD)' },
    { id:'BUN_post', displayLabel:'BUN (AD)' },
    'CREAT','UA',
    // Electrolytes — monthly (Ca = total Ca per user)
    'Na','K','Cl','Ca','P',
    // Dialysis adequacy — monthly (computed)
    // Kt/V deferred (2026-05-04) — form column stays empty in CSV
    'URR',
    // Iron panel — monthly (per user)
    'Fe','TIBC','TSAT','Ferritin',
    // Bone metabolism — monthly
    'iPTH',
    // Glycemic — monthly for everyone (not DM-only)
    'HbA1c',
    // Annual lifelong markers / hepatitis screen
    // Aluminum deferred (2026-05-04)
    { id:'HBsAg',   periodicity:'annual' },
    { id:'AntiHBs', periodicity:'annual', displayLabel:'Anti-HBS' },
    { id:'HCV',     periodicity:'annual', displayLabel:'Anti-HCV' },
    { id:'AFP',     periodicity:'annual', displayLabel:'α-FP' },
    // On-admission only
    { id:'HIV', periodicity:'on-admission' },
    { id:'RPR', periodicity:'on-admission', displayLabel:'VDRL/RPR' },
  ],

  // 衍生值 — Kt/V 暫緩
  computed: ['URR'],

  monthlyDetection: {
    clusterDayWindow: 2,
    minTestsForMonthly: 8,
    requireBUN: true,
  },

  // BUN 前/後判定 — 依報告時間（Step 2 會啟用）
  // Step 1 保留現行 composite / standalone_bun filter 行為
  resolveBUN(bunEntries) {
    if (!bunEntries || bunEntries.length === 0) return { pre: null, post: null };
    if (bunEntries.length === 1) return { pre: bunEntries[0], post: null };
    const sorted = [...bunEntries].sort((a, b) => {
      const ta = new Date(a.reportDateTime || a.reportDate).getTime();
      const tb = new Date(b.reportDateTime || b.reportDate).getTime();
      return ta - tb;
    });
    return { pre: sorted[0], post: sorted[sorted.length - 1] };
  },

  // 月檢偵測 — 與 v1 相同，不變
  detectMonthlyDraws(allLabs) { /* see v1 spec — clustering + BUN union */ },

  // CSV 輸出 — form-aware wide format
  exporter: { /* see § "CSV format" below */ },
};
```

### Helper: resolve a manifest entry

The `labManifest` mixes strings and objects. Add a helper that always
returns the normalized object:

```js
function resolveManifestEntry(entry) {
  if (typeof entry === 'string') return { id: entry, periodicity: 'monthly' };
  return Object.assign({ periodicity: 'monthly' }, entry);
}
```

Use this everywhere the module needs to enumerate items by id, label, or
periodicity.

---

## CSV format (form-aware wide)

### Per row

One row per **monthly draw** (an entry from `detectMonthlyDraws()`).

### Columns

```
chartNo,
name,
drawDate,
<TestId>.value, <TestId>.unit, <TestId>.hi, <TestId>.lo,   ← 4 cols per test
<repeated for each test in labManifest order>,
URR.value, URR.unit, URR.hi, URR.lo
```

(No KtV column this slice.)

### Header row

Use **display labels** (matching the form, typos corrected). Example for
the first few groups:

```
chartNo,name,drawDate,
WBC value,WBC unit,WBC hi,WBC lo,
RBC value,RBC unit,RBC hi,RBC lo,
Hb value,Hb unit,Hb hi,Hb lo,
...
BUN (BD) value,BUN (BD) unit,BUN (BD) hi,BUN (BD) lo,
BUN (AD) value,BUN (AD) unit,BUN (AD) hi,BUN (AD) lo,
...
HbA1c value,HbA1c unit,HbA1c hi,HbA1c lo,
Anti-HBS value,Anti-HBS unit,Anti-HBS hi,Anti-HBS lo,
...
HIV value,HIV unit,HIV hi,HIV lo,
VDRL/RPR value,VDRL/RPR unit,VDRL/RPR hi,VDRL/RPR lo,
URR value,URR unit,URR hi,URR lo
```

### Cell sourcing

For each draw row, for each manifest entry:

- **value**: from `draw.labs[id].value`. If absent (test not done in this
  cluster), empty string.
- **unit**: from `draw.labs[id].unit`. If absent, fall back to the
  catalog entry's `unit` (so Excel columns line up even when some draws
  are missing the test). If still absent, empty string.
- **hi**: from the catalog entry's `hi` (or `refHi`). Reference ranges
  are catalog-defined, not per-row. Empty string if not defined.
- **lo**: from the catalog entry's `lo` (or `refLo`). Same rule.

### Periodicity behaviour

**Empty cells when not drawn — match the paper form's diagonal-stripe
behaviour.** Do NOT carry forward previous values, do NOT fill with `N/A`.

- Annual tests (HBsAg, AntiHBs, HCV, AFP): value present in the cluster
  where they were drawn that year; empty in other monthly rows.
- On-admission tests (HIV, RPR): value present only in the very first
  cluster after `patient.startDate`; empty elsewhere.
- Monthly tests: value present in every cluster where the test was drawn.

### Computed values (URR only)

After `detectMonthlyDraws()` produces the clusters, run a computed pass:

```js
for (const draw of draws) {
  draw.computed = draw.computed || {};
  const pre = draw.labs.BUN_pre?.value;
  const post = draw.labs.BUN_post?.value;
  if (Number.isFinite(pre) && Number.isFinite(post) && pre > 0) {
    draw.computed.URR = +((1 - post / pre) * 100).toFixed(1);
  }
}
```

### One file per patient, one row per draw

```
filename: dialysis_<chartNo>.csv
contents:
  <header row>
  <draw 1>
  <draw 2>
  ...
```

Default to per-patient files; combined export is a future option.

---

## Shell-side call sites

In `hospital-lab-data.html`, replace these spots with dispatched calls.
For Step 1, hardcode `activeGroup = 'dialysis'`; the tab UI is Step 3.

| Current code | After Step 1 |
|---|---|
| `localStorage.getItem('dialysis_patients')` | `localStorage.getItem(GROUP_DIALYSIS.storageKey.patients)` |
| `localStorage.getItem('dialysis_lab_data')` | `localStorage.getItem(GROUP_DIALYSIS.storageKey.labs)` |
| Hardcoded patient form fields | Render from `GROUP_DIALYSIS.patientFields` |
| Lab table filters by hardcoded list | Filter by `GROUP_DIALYSIS.labManifest` (resolved via helper) |
| Inline CSV export | `GROUP_DIALYSIS.exporter.format(patient, draws)` |
| Inline monthly logic | `GROUP_DIALYSIS.detectMonthlyDraws(labs)` (existing composite/standalone_bun filter still drives current rendering this step) |

### Storage key migration

On load, if `localStorage.patients_dialysis` is empty AND
`localStorage.dialysis_patients` exists, copy across. Same for labs.
Leave the old keys in place as a one-release fallback.

---

## sync-patterns.js extension

1. Read every `groups/*.js` in this repo.
2. Concatenate (alphabetical order).
3. Write between **new markers** in `hospital-lab-data.html`:

```
// __HOSPITAL_LAB_GROUPS_BEGIN__
...concatenated group source...
// __HOSPITAL_LAB_GROUPS_END__
```

Insert the new marker pair into `hospital-lab-data.html` initially empty;
first sync run populates it.

---

## Acceptance criteria

1. ✅ `node sync-patterns.js` runs cleanly, both marker blocks populated.
2. ✅ Open `hospital-lab-data.html` in a browser. Existing dialysis
   patient list loads (storage migration worked).
3. ✅ Click a patient, view lab table. Renders with the new manifest.
   New columns (HbA1c for non-DM patients, all annual + on-admission
   markers) are present. Pre-existing columns still show correct values.
4. ✅ Export CSV for that patient. Verify:
   - Header row uses display labels (e.g. `BUN (BD)`, `Anti-HBS`, `α-FP`)
   - 4 columns per test (value, unit, hi, lo)
   - Empty cells where the patient hasn't been drawn for an annual test
     this year
   - Reference ranges (hi/lo) populated from catalog
   - URR column populated for draws with both BUN_pre and BUN_post
   - **No Kt/V column, no Aluminum column** (both deferred)
5. ✅ DevTools console clean.
6. ✅ `WORKLOG.md` entry in 繁體中文, 範圍 = `dialysis | shell |
   sync-script`. Lists what changed (manifest format, CSV format,
   periodicity metadata) and notes the two deferred items.
7. ✅ Show me the planned commit message and ask before push.

---

## What NOT to do in this slice

- ❌ Do not change `hospital-lab-patterns/` (its TASK_BRIEF.md is in
  DEFERRED state).
- ❌ Do not add CKD / DM / COPD modules (Steps 4–6).
- ❌ Do not add disease-tab UI (Step 3).
- ❌ Do not switch BUN pre/post detection from filter-based to
  reportTime (Step 2 owns that). `resolveBUN()` is wired but inactive.
- ❌ Do not implement operational-field collection (體重 / Blood Flow
  / 透析時間 / A-K / EPO).
- ❌ Do not add Kt/V or Aluminum to the manifest (deferred per user).
- ❌ Do not auto-push.

---

## Suggested commit message

```
dialysis: extract group module + form-aware CSV export (Step 1 v3)

- new: groups/dialysis.js — patient fields, form-aligned labManifest,
  periodicity metadata (monthly / annual / on-admission), monthly draw
  detection, BUN pre/post resolver (wired but inactive — Step 2),
  form-aware CSV exporter
- new: __HOSPITAL_LAB_GROUPS_BEGIN/END__ marker pair in
  hospital-lab-data.html
- sync-patterns.js: bundles groups/*.js between new markers
- shell call sites dispatch through GROUP_DIALYSIS; activeGroup
  hardcoded to 'dialysis' (tab UI in Step 3)
- localStorage migration: dialysis_patients → patients_dialysis (with
  one-release fallback)
- CSV format: 4 columns per test (value/unit/hi/lo), header uses
  form-style display labels (BUN (BD), Anti-HBS, α-FP, etc.); empty
  cells for periodicity gaps to match paper form
- Kt/V and Aluminum deferred per user 2026-05-04 — see patterns repo
  TASK_BRIEF.md "When to revisit" for re-activation criteria

Refs: vhtt 病人定期檢查記錄 (制定 2019.11.07)
Refs: TASK_BRIEF.md (Step 1 v3)
```

---

## Questions to ask before starting (if uncertain)

1. **One file per patient vs combined**: default per-patient. Confirm.
2. **BUN value access**: the existing extracted lab rows — does `value`
   come as Number or String? CSV format assumes Number; coerce as needed.
3. **Annual test detection**: a value drawn 11 months ago is "this
   year's annual draw" or "last year's"? For Step 1, simplest rule:
   show whatever was drawn within the rolling 12-month window of the
   monthly draw being rendered. Confirm if you want a different cutoff.
4. **Empty manifest entries**: when a manifest entry's catalog ID isn't
   resolvable, the column still appears with empty value cells. OK?
5. **HbA1c gating**: when consuming the catalog entry, if there's a DM-only
   gate, override at manifest level so HbA1c shows for everyone. Already
   spec'd; just confirm the override mechanism exists.
