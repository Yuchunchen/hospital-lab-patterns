# TASK_BRIEF: Shrink findNearby window from 90→30 days

## Problem

`findNearby()` in `report.js` uses a 90-day window to pair UACR/UPCR with
eGFR dates for computed staging (KDIGO, TaiwanCKD, EarlyCKD). This is too
wide — a single UACR result gets paired with multiple eGFR dates, producing
misleading staging at dates where no UACR was actually available.

### Real-world example: 000115014H

- UACR = 57.20, resdttm = 115/02/13
- eGFR at 114/11/18 (87 days away) → findNearby matches → KDIGO="中" ← WRONG
- eGFR at 115/02/13 (exact match) → KDIGO="中" ← CORRECT

With a 30-day window, only the exact-match pairing survives.

## What to change

### report.js — `findNearby()` (line ~269)

```js
// BEFORE:
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

// AFTER:
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
```

Update the variable name and the comparison on line ~275:
```js
if (diff <= ONE_MONTH_MS && diff < bestDiff) {
```

Also update the comment on line ~266:
```js
// 2. Most recent within 1 month (30 days)
```

### Callers affected (all in report.js, all use the same function):

1. **KDIGORisk** (line ~290): `findNearby(map['UACR'], e.date)`
2. **TaiwanCKD** (line ~310-312): `findNearby(map['UPCR'], e.date)` and `findNearby(map['UACR'], e.date)`

All callers benefit from the tighter window. No caller-side changes needed.

### Reporter check

Check if `hospital-lab-reporter/hospital-lab-data.html` has a similar
`findNearby` or staging computation. If so, apply the same 90→30 change.

## Release steps

This can be combined with the detection-limit regex commit, or done separately.

```bash
cd hospital-lab-viewer
# Edit report.js
git add -A && git commit -m "fix: shrink findNearby window from 90→30 days to prevent cross-date UACR pairing"
```

## Verification

After the fix, test with chartno 000115014H:
- KDIGO at 114/11/18 should NOT show "中" (no UACR within 30 days)
- KDIGO at 115/02/13 should show "中" (exact match UACR=57.20)

## Post-task

- Rename this file to `TASK_BRIEF_findNearby_window_done.md`
- Move to `hospital-lab-patterns/docs/task-briefs/`
- Update WORKLOG.md (繁體中文)
- Do NOT git push — ask first
