# TASK_BRIEF — Step 2: Switch BUN detection to reportTime-based

> **Audience:** Claude Code, running in `hospital-lab-reporter/` repo root.
> Read `CLAUDE.md` first if you haven't, then read `TASK_BRIEF.md`
> (currently Step 1 v3) for context. This is **only ready to start once
> Step 1 v3 has merged**.
>
> **Deferred items context (don't re-introduce):** per user decision
> 2026-05-04, **Kt/V** and **Aluminum** are deferred — neither in
> `dialysis.labManifest` nor in `dialysis.computed`. Step 2 must not
> re-add them. See `../hospital-lab-patterns/TASK_BRIEF.md` for
> re-activation criteria.
>
> **This file is gitignored.** Hand-off note from Cowork to Code.

---

## Why this step

Step 1 extracted dialysis logic into `groups/dialysis.js` and wired up
`resolveBUN()` — but kept it **inactive** behind a TODO comment. The shell
still uses the legacy filter-based scheme:

- `BUN_pre`: filter `composite` (orderName contains commas — implies the
  composite pre-dialysis panel)
- `BUN_post`: filter `standalone_bun` (orderName is "BUN" alone — implies
  the post-dialysis single draw)

Step 2 replaces that with the user's clinically motivated rule:

> 同一抽血叢集中若有 ≥ 2 筆 BUN：依**報告時間**排序，最早 = 洗腎前，
> 最晚 = 洗腎後。只有 1 筆 → 預設為洗腎前。

### Why the switch matters

The legacy filter scheme assumes a specific order-naming convention. It
breaks when:

- A composite order on a non-monthly day happens to contain a single BUN
  (would tag a non-pre BUN as `BUN_pre`)
- A standalone BUN is ordered before dialysis instead of after (would tag
  a pre-dialysis BUN as `BUN_post`)
- Different doctors / hospitals use slightly different order names

Report-time-based detection is robust to all of these because it relies
on when the lab was actually run, which mirrors clinical reality
(pre-dialysis blood draws are reported earlier than post-dialysis ones).

---

## Goal

Make `groups/dialysis.js`'s `resolveBUN()` the **active** source of truth
for `BUN_pre` / `BUN_post` in:

1. The lab table (rendering)
2. URR computation
3. CSV export

Retire the filter-based `composite` / `standalone_bun` selection in the
shell. Validate via side-by-side diff against pre-Step-2 output for
representative patients.

---

## Files to touch

| File | Action |
|---|---|
| `groups/dialysis.js` | Remove the `// TODO: activate in Step 2` marker. Add edge-case handling (missing reportTime, ties, >2 BUNs). |
| `hospital-lab-data.html` | Remove `extractLabValues()`'s filter-based BUN_pre/BUN_post selection. Make the shell's lab-table render path consume `dialysis.detectMonthlyDraws()` output for BUN cells. |
| `WORKLOG.md` | New top entry, **繁體中文**, including side-by-side validation results. |
| (Optional) `groups/dialysis.js` | Add a feature flag `useReportTimeBUN: true` so we can toggle back if a regression surfaces in production. |

Probably **no change** to `../hospital-lab-patterns/`. The parser will
continue to extract every BUN occurrence regardless of how it was
previously tagged; `resolveBUN()` re-derives pre/post from the raw set.
If validation forces a patterns-repo change, **stop and coordinate** —
that's a separate brief.

---

## What "active" means in code

After Step 1, `dialysis.detectMonthlyDraws(allLabs)` already produces:

```js
[
  {
    drawDate: '2026-04-15',
    labs: {
      BUN_pre:  { value: 78, reportDateTime: '2026-04-15 08:30', ... },
      BUN_post: { value: 24, reportDateTime: '2026-04-15 14:50', ... },
      CREAT:    { value: 9.1, ... },
      // ...
    }
  },
  // ...
]
```

But the lab table and CSV currently read `BUN_pre` / `BUN_post` straight
from the parser's per-row output (filter-based). Step 2 reroutes them to
read from `detectMonthlyDraws()`'s output instead.

### Concretely

1. In `extractLabValues()` (or wherever the parser-side filter lives),
   stop pre-classifying BUN. Either:
   - **(a)** Emit BUN with a single `BUN_raw` testId for any match, OR
   - **(b)** Keep `BUN_pre` / `BUN_post` testIds but drop the filter so
     both match all occurrences (resolveBUN already collects them as a
     union via `r.testId === 'BUN_pre' || 'BUN_post' || 'BUN'`).

   **Prefer (b)** — minimal blast radius, no patterns-repo change. The
   parser may produce duplicates per BUN occurrence (one tagged `_pre`,
   one tagged `_post` for the same row); dedupe in `resolveBUN()` by
   `reportDateTime + value` before sorting.

2. In the lab-table render path, the column that currently shows the
   parser-tagged `BUN_pre` / `BUN_post` instead reads from the
   `detectMonthlyDraws()` result for that draw date.

3. In `computeDerivedValues()` (URR), feed it the same resolved
   `BUN_pre` / `BUN_post`.

4. CSV export already pulls from `detectMonthlyDraws()` per Step 1 spec —
   no change needed there.

---

## Edge cases to handle in `resolveBUN`

| Case | Behaviour |
|---|---|
| 0 BUN entries | `{ pre: null, post: null }` (already handled) |
| 1 BUN entry | `{ pre: that_one, post: null }` (already handled) |
| 2 BUN entries, distinct reportDateTime | earliest = pre, latest = post |
| 2 BUN entries, **same reportDateTime** | Tie-break: prefer the one with composite-style orderName as pre (legacy hint); if still tied, take whichever comes first in the source array |
| 3+ BUN entries | Take min and max by reportDateTime; if a middle entry exists, log a warning to console (`console.warn('dialysis.resolveBUN: 3+ BUN entries on cluster', ...)`) — it's clinically unusual and worth flagging |
| Missing `reportDateTime` on one entry | If the other entry has time, the missing one defaults to **pre** (same fallback as the single-entry case for the row that has time); add `console.warn` |
| Missing `reportDateTime` on all entries | Fall back to the **legacy filter-based scheme for that cluster only**, behind the `useReportTimeBUN` flag check. Log a warning. |

Add brief comments in 繁體中文 explaining each edge case, especially the
tie-break rule.

---

## Validation: side-by-side diff (mandatory)

This step is not pure refactor. **Expect some patients' BUN values to
change.** Validate before claiming done.

### Procedure

1. **Before touching code**, with the current Step-1 codebase running:
   - Pick 5–10 representative dialysis patients spanning at least 6 months
     of monthly draws (so each has 6+ draws to compare).
   - For each, export CSV. Save in `tmp/step2-baseline/<chartno>.csv`.
   - Don't commit these files (covered by `.gitignore`'s `data/` rule, but
     also use `tmp/` to be explicit — add `tmp/` to gitignore if absent).

2. **After implementing Step 2**, with the same patients:
   - Re-export CSV. Save in `tmp/step2-after/<chartno>.csv`.

3. **Diff each pair**:
   ```powershell
   foreach ($f in Get-ChildItem tmp/step2-baseline) {
     Compare-Object (Get-Content tmp/step2-baseline/$f) (Get-Content tmp/step2-after/$f)
   }
   ```

4. **Categorize each difference**:
   - **Identical**: ✅ no concern
   - **BUN_pre / BUN_post / URR shifted between same-day draws**:
     ⚠ expected — the new method swapped which BUN counts as pre vs post.
     For each, identify which is clinically more plausible (the earlier
     report time should be pre). Document in WORKLOG.
   - **A draw appears or disappears**: ⚠ unexpected — investigate before
     proceeding. Likely a clustering bug.
   - **Non-BUN values change**: 🚨 should not happen — bug. Stop and fix.

5. **Document the diff outcome in WORKLOG**:

   ```markdown
   ## YYYY-MM-DD — BUN 偵測切換為報告時間制 (Step 2)

   - 作者：claude（與 YC 共同）
   - 範圍：dialysis | shell
   - 變更：修改
   - 檔案：groups/dialysis.js, hospital-lab-data.html
   - 原因：filter-based 方案依賴醫囑命名習慣，跨醫院或跨醫師會失準。
           改為依報告時間判定（早 = 洗腎前、晚 = 洗腎後），更貼近臨床。
   - 驗證：對 8 位病患 × 平均 12 次月檢做 baseline / after diff：
           - 92 筆完全相同
           - 4 筆 BUN_pre / BUN_post 互換（report time 顯示先抽的一筆原本被
             tag 為 _post，新方案修正為 _pre — 臨床上更合理）
           - 0 筆異常
   - 相依：patterns repo 無變更
   ```

---

## Acceptance criteria

1. ✅ `resolveBUN()` is the active source of truth — search the codebase
   for `composite` / `standalone_bun` and confirm those filter strings no
   longer drive BUN classification (they may remain as catalog metadata
   for reference, but must not gate runtime behavior).
2. ✅ Edge-case handling implemented per the table above, with `console.warn`
   on degenerate cases.
3. ✅ Side-by-side diff completed on 5+ patients with 6+ months of data;
   results documented in WORKLOG.
4. ✅ URR values in the lab table match what you'd compute by hand from the
   new BUN_pre / BUN_post pairs.
5. ✅ DevTools console clean except for documented `console.warn` cases.
6. ✅ Feature flag `useReportTimeBUN` defaults to `true` but works when
   flipped to `false` (legacy fallback path intact).
7. ✅ `tmp/` and any `step2-*` directories are gitignored.
8. ✅ `WORKLOG.md` entry in 繁體中文 with the diff summary.
9. ✅ Show me the planned commit message and ask me to push. Do not push
   until I say so.

---

## What NOT to do in this slice

- ❌ Do not change `hospital-lab-patterns/`. If validation reveals a
  patterns issue, **stop and ask** — that's a separate coordinated change.
- ❌ Do not re-introduce Kt/V or Aluminum (deferred per user 2026-05-04).
- ❌ Do not add CKD / DM / COPD modules (Steps 4–6).
- ❌ Do not add the disease-tab UI (Step 3).
- ❌ Do not "while we're here" rewrite `extractLabValues()` — only
  surgically remove the BUN-specific filter logic.
- ❌ Do not commit `tmp/step2-baseline/` or `tmp/step2-after/` — those
  contain real patient data.
- ❌ Do not auto-push.

---

## Suggested commit message

```
dialysis: switch BUN pre/post detection to reportTime-based (Step 2)

- groups/dialysis.js: resolveBUN is now the active source of truth
- groups/dialysis.js: edge-case handling — ties, missing time, 3+ entries
- hospital-lab-data.html: extractLabValues no longer applies composite /
  standalone_bun filter for BUN; BUN rows pass through to dialysis module
  which re-derives pre/post from report time
- groups/dialysis.js: useReportTimeBUN feature flag (default true) for
  rollback safety
- legacy filter-based path retained as fallback when reportDateTime is
  missing on all BUN entries in a cluster
- validated against 8 patients × ~12 months: 92 identical, 4 swaps
  (clinically more correct), 0 anomalies — see WORKLOG

Refs: TASK_BRIEF_step2.md
```

---

## Questions to ask before starting (if uncertain)

If anything below is unclear, **stop and ask me** before writing code:

1. The exact field name on extracted rows for report timestamp:
   `reportDateTime`? `reportDate`? Are time components included or
   date-only? (Step 1 spec assumed `reportDateTime || reportDate`.)
2. Whether the tie-break rule (same reportDateTime → prefer
   composite-style orderName for pre) is acceptable, or whether you want
   a different tie-break (e.g., orderId numeric ordering, or tie always
   resolved as "the one with smaller value is post" since post is
   typically lower).
3. Which 5–10 patients you want used for the side-by-side validation —
   or whether you'd rather pick them yourself by handing me chartNos.
4. Whether the `useReportTimeBUN` flag should be exposed in the UI
   settings tab (for emergency rollback by non-developers) or kept as a
   code-only constant.
5. Whether to do this on `main` directly or on a feature branch
   (`feat/step2-bun-reporttime`). Default suggestion: feature branch
   given the validation requirement.
