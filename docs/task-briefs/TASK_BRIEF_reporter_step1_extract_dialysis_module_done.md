# TASK_BRIEF — Step 1: Extract dialysis into a group module

> **Audience:** Claude Code, running in `hospital-lab-reporter/` repo root.
> Read `CLAUDE.md` first if you haven't. This file is the task-specific brief
> that complements the standing rules in CLAUDE.md.
>
> **This file is gitignored.** It's a hand-off note from Cowork to Code.

---

## Why we're doing this

`hospital-lab-reporter` is being extended from "dialysis-only" into a
multi-disease-group framework (dialysis / CKD / DM / COPD), where each
disease group is a self-contained module under `groups/<id>.js` and the
shell HTML is generic.

**Step 1 is a pure refactor**: carve current dialysis logic into
`groups/dialysis.js` without changing user-visible behavior. Adding the
disease-tab UI, new disease groups, and new features all come in later
steps.

The extracted module will become the template that CKD / DM / COPD
modules follow.

---

## Goal

Move all dialysis-specific logic from `hospital-lab-data.html` into
`groups/dialysis.js`. Behavior must be **identical** to current — same
patient list, same lab table, same CSV export, byte-for-byte (or only
differs in column order if cleanly justified in WORKLOG).

---

## Files to touch

| File | Action |
|---|---|
| `groups/dialysis.js` | **NEW** — the extracted module (see spec below) |
| `hospital-lab-data.html` | Refactor: replace inline dialysis logic with calls to the module. Add a second marker pair `__HOSPITAL_LAB_GROUPS_BEGIN__ / __HOSPITAL_LAB_GROUPS_END__` for the inlined group source. |
| `sync-patterns.js` | Extend to also bundle `groups/*.js` into the HTML between the new markers (alongside the existing pattern-block bundling). |
| `WORKLOG.md` | Add new top entry, **繁體中文**, format per CLAUDE.md. |
| `.gitignore` | Add `TASK_BRIEF.md` if not already present. |

Do NOT touch:
- The pattern block inside `__HOSPITAL_LAB_PATTERNS_BEGIN/END__` markers
- `../hospital-lab-patterns/` — patterns repo is unchanged this step
- The existing `manifest.json` / popup behaviour (this repo doesn't have those — that's the viewer)

---

## The `groups/dialysis.js` spec

Implementation reference (you can refine variable names and helper placement,
but keep the public surface and behaviour as below):

```js
// groups/dialysis.js
//
// 透析個案管理：每月血液檢查資料的擷取、整理與輸出
//
// 與其他疾病不同處：
//   - 期間：每月一次
//   - 關鍵欄位：BUN（前/後）、URR、Ca×P
//   - 月檢識別：同日（或差 1–2 天）大量項目同時開單，且必有 BUN

const DIALYSIS_GROUP = {
  id: 'dialysis',
  label: '透析',

  storageKey: {
    patients: 'patients_dialysis',
    labs:     'labs_dialysis',
  },

  // 病人欄位（除了 shell 提供的 chartNo / name / age / sex 之外的）
  patientFields: [
    { key:'startDate',  label:'開始透析日',  type:'date' },
    { key:'frequency',  label:'頻率',
      type:'select', options:['週三次','週二次','其他'] },
    { key:'access',     label:'通路',
      type:'select', options:['AVF','AVG','長期導管','短期導管'] },
    { key:'primaryDx',  label:'原發病因',    type:'text' },
    { key:'note',       label:'備註',        type:'textarea' },
  ],

  // Lab manifest — IDs 來自 hospital-lab-patterns 的 catalog
  // 與目前 reporter manifest 中屬於透析的項目保持一致
  labManifest: [
    'BUN_pre','BUN_post',
    'CREAT','UA',
    'GluAC','HbA1c',
    'TP','Albumin',
    'Na','K','Ca','P','Mg','iPTH',
    'Hb','HCT','MCV','Platelet','WBC',
    'TIBC','TSAT','Ferritin',
    'ALT','ALP','TBili',
    'TCho','TG','HDL','LDL',
  ],

  // 衍生值 — 由 patterns repo 的 REPORTER_COMPUTED 提供
  computed: ['URR','CaxP'],

  // 月檢識別參數
  monthlyDetection: {
    clusterDayWindow: 2,       // 同次抽血容忍天數
    minTestsForMonthly: 8,     // 至少 8 項落在 labManifest 才算月檢
    requireBUN: true,          // 必有 BUN 才算月檢
  },

  // BUN 前/後判定
  // ≥2 筆 → 依 reportDateTime 排序，最早 = 洗腎前，最晚 = 洗腎後
  // 1 筆  → 預設為洗腎前
  // 0 筆  → 兩者皆 null
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

  // 月檢偵測主函式
  // 輸入：該病人所有 lab rows（已經過 pattern 解析的扁平陣列）
  // 輸出：[{ drawDate: 'YYYY-MM-DD', labs: { TESTID: {value, unit, ...} } }]
  detectMonthlyDraws(allLabs) {
    if (!allLabs || allLabs.length === 0) return [];

    // 1. 依 orderDate 排序
    const rows = [...allLabs].sort((a, b) => {
      const da = new Date(a.orderDate || a.reportDate);
      const db = new Date(b.orderDate || b.reportDate);
      return da - db;
    });

    // 2. 切叢集（gap > clusterDayWindow 開新叢集）
    const W = this.monthlyDetection.clusterDayWindow;
    const clusters = [];
    let cur = null;
    for (const row of rows) {
      const d = new Date(row.orderDate || row.reportDate);
      if (!cur || daysBetween(cur.endDate, d) > W) {
        cur = { startDate: d, endDate: d, rows: [] };
        clusters.push(cur);
      } else {
        cur.endDate = d;
      }
      cur.rows.push(row);
    }

    // 3. 對每個叢集判斷是否為月檢
    const manifestSet = new Set(this.labManifest);
    const out = [];
    for (const c of clusters) {
      const ids = new Set(c.rows.map(r => r.testId));
      const hits = [...ids].filter(id => manifestSet.has(id));
      const hasBUN = c.rows.some(r =>
        r.testId === 'BUN_pre' ||
        r.testId === 'BUN_post' ||
        r.testId === 'BUN'
      );
      if (hits.length < this.monthlyDetection.minTestsForMonthly) continue;
      if (this.monthlyDetection.requireBUN && !hasBUN) continue;

      // 4. 解析 BUN 前/後
      const bunEntries = c.rows.filter(r =>
        r.testId === 'BUN_pre' ||
        r.testId === 'BUN_post' ||
        r.testId === 'BUN'
      );
      const { pre, post } = this.resolveBUN(bunEntries);

      // 5. 組成單筆月檢紀錄
      const labs = {};
      for (const r of c.rows) {
        if (manifestSet.has(r.testId)) labs[r.testId] = r;
      }
      if (pre)  labs['BUN_pre']  = pre;
      if (post) labs['BUN_post'] = post;

      out.push({
        drawDate: isoDate(c.startDate),
        labs,
      });
    }
    return out;
  },

  // CSV 輸出
  exporter: {
    interval: 'monthly',
    filename: (patient, draw) =>
      `dialysis_${patient.chartNo}_${draw.drawDate}.csv`,
    format(patient, draws) {
      const cols = [
        'chartNo','name','drawDate',
        ...DIALYSIS_GROUP.labManifest,
        'URR','CaxP',
      ];
      const lines = [cols.join(',')];
      for (const draw of draws) {
        const row = [
          patient.chartNo,
          patient.name,
          draw.drawDate,
          ...DIALYSIS_GROUP.labManifest.map(id => draw.labs[id]?.value ?? ''),
          draw.computed?.URR  ?? '',
          draw.computed?.CaxP ?? '',
        ];
        lines.push(row.join(','));
      }
      return lines.join('\n');
    },
  },
};

// helpers
function daysBetween(d1, d2) {
  return Math.abs((new Date(d2) - new Date(d1)) / 86400000);
}
function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// 給 shell 取用（sync 後成為 window.GROUP_DIALYSIS）
if (typeof window !== 'undefined') window.GROUP_DIALYSIS = DIALYSIS_GROUP;
if (typeof module !== 'undefined') module.exports = DIALYSIS_GROUP;
```

> **Note on existing reporter conventions:** the current
> `hospital-lab-data.html` uses `BUN_pre` / `BUN_post` IDs with the
> `composite` / `standalone_bun` filter scheme (see CLAUDE.md "BUN 洗前/洗後
> 邏輯" section). Step 1 keeps that filter scheme working at the
> shell/pattern layer; the module's `resolveBUN()` is the new
> reportTime-based path that we'll switch to in a later step. **For Step 1,
> keep current behaviour.** Move the existing logic verbatim — wire
> `resolveBUN()` in but don't make it the active path yet. A `// TODO:
> activate in Step 2` comment is fine.

---

## Shell-side call sites that change

In `hospital-lab-data.html`, replace these spots with dispatched calls.
For Step 1, hardcode `activeGroup = 'dialysis'`; the tab UI comes in
Step 3.

| Current code (hardcoded) | After Step 1 |
|---|---|
| Reads `dialysis_patients` from localStorage | Reads `GROUP_DIALYSIS.storageKey.patients` |
| Reads `dialysis_lab_data` | Reads `GROUP_DIALYSIS.storageKey.labs` |
| Patient form fields hardcoded | Renders from `GROUP_DIALYSIS.patientFields` (plus shell-universal chartNo/name/age/sex) |
| Lab table filters labs by hardcoded list | Filters by `GROUP_DIALYSIS.labManifest` |
| CSV export inline | `GROUP_DIALYSIS.exporter.format(patient, draws)` |
| Monthly logic inline | `GROUP_DIALYSIS.detectMonthlyDraws(labs)` (kept as a TODO path; existing composite/standalone_bun filter still drives current rendering this step) |

Identifier renames in localStorage: `dialysis_patients` → `patients_dialysis`,
`dialysis_lab_data` → `labs_dialysis`. **Add a one-time migration** on load:
if the new keys are empty and the old keys exist, copy across, then leave
the old keys in place as a fallback for one release.

---

## sync-patterns.js extension

Current `sync-patterns.js` reads the patterns repo and writes between
`__HOSPITAL_LAB_PATTERNS_BEGIN__/END__`. Extend it to also:

1. Read every `groups/*.js` in this repo
2. Concatenate them (in stable alphabetical order)
3. Write between **new markers** in `hospital-lab-data.html`:

   ```
   // __HOSPITAL_LAB_GROUPS_BEGIN__
   ...concatenated group source...
   // __HOSPITAL_LAB_GROUPS_END__
   ```

The new marker pair must be inserted into `hospital-lab-data.html` as part
of this task (initially empty, then populated by the first sync run).
Place it right after the existing patterns block.

---

## Acceptance criteria

Run through these in order. Don't say "done" until all pass.

1. ✅ `node sync-patterns.js` runs cleanly. The HTML now contains both
   marker blocks, and the groups block contains `dialysis.js` source.
2. ✅ Open `hospital-lab-data.html` in a browser. The patient list page
   loads with the existing dialysis patient still present (storage
   migration worked).
3. ✅ Click a patient, view the lab table. Renders identically to before
   the refactor (visual diff or screenshot comparison).
4. ✅ Export CSV for that patient. Diff against a CSV exported pre-refactor
   — must be byte-identical, OR the only difference is column order with a
   one-line justification in WORKLOG.
5. ✅ DevTools console is clean — no errors, no warnings.
6. ✅ `WORKLOG.md` has a new top entry in 繁體中文, format per CLAUDE.md,
   範圍 = `dialysis | shell | sync-script`.
7. ✅ `.gitignore` contains `TASK_BRIEF.md`.
8. ✅ Show me the planned commit message and ask me to push. Do not push
   until I say so.

---

## What NOT to do in this slice

- ❌ Do not add CKD / DM / COPD modules (Steps 4–6).
- ❌ Do not add the disease-tab UI (Step 3).
- ❌ Do not change pattern-repo content.
- ❌ Do not switch BUN pre/post detection from filter-based to
  reportTime-based (`resolveBUN()` is wired up but inactive). That switch
  is its own step with its own validation.
- ❌ Do not refactor unrelated code "while we're in there."
- ❌ Do not auto-push.

---

## Suggested commit message

```
dialysis: extract group module (Step 1 of disease-group refactor)

- new: groups/dialysis.js — patient fields, lab manifest, monthly draw
  detection, BUN pre/post resolver, CSV exporter
- new: __HOSPITAL_LAB_GROUPS_BEGIN/END__ marker pair in
  hospital-lab-data.html
- sync-patterns.js: now also bundles groups/*.js into the HTML
- shell call sites dispatch through GROUP_DIALYSIS instead of hardcoded
  literals; activeGroup hardcoded to 'dialysis' for now (tab UI in Step 3)
- localStorage keys: patients_dialysis / labs_dialysis (with one-release
  migration from dialysis_patients / dialysis_lab_data)
- behavior unchanged; CSV byte-identical for verified test patient

Refs: hospital-lab-patterns/WORKLOG.md (disease-group framework decision)
```

---

## Questions to ask before starting (if uncertain)

If anything below is unclear, **stop and ask me** before writing code:

1. The current code path for monthly detection (composite / standalone_bun
   filter) — confirm where it lives in `hospital-lab-data.html`.
2. The shape of a "lab row" (`row.testId`, `row.orderDate`, `row.reportDateTime`,
   `row.value`, `row.unit`) — verify against actual extracted data, not
   guessed.
3. Whether the existing CSV export already exists or whether one needs to
   be implemented now (CLAUDE.md mentions JSON export in `exportAllLabData`
   at ~line 1229; confirm CSV path).
4. Whether `GROUP_DIALYSIS` should be exposed at `window.GROUP_DIALYSIS` or
   collected into a registry like `window.GROUPS = { dialysis: ... }`.
   (Slight preference for the registry — sets up Step 3 nicely — but
   either works.)
