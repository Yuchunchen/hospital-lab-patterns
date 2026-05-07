# TASK_BRIEF: Detection-Limit Regex Fix (`<N` / `>N` capture)

## Problem

Most catalog patterns use `([\d.]+)` as their capture group, which fails to
match detection-limit values like `<0.01`, `<2`, `>2000`. The value never
enters the pipeline at all — it's a regex-level miss, not a downstream issue.

The viewer's `valueStyle()` already strips `<>` before `parseFloat` for
threshold comparison, and `h()` HTML-escapes `<` to `&lt;` for display.
So the **only fix needed is in the regex capture groups**.

## What to change

### catalog.js — bulk regex update

Change **every** `([\d.]+)` capture group to `([<>]?\s*[\d.]+)` in
`hospital-lab-patterns/patterns/catalog.js`.

**Patterns to update** (all currently using `([\d.]+)` without `[<>]?`):

- CBC: WBC, RBC, Hb, HCT, MCV, Platelet
- Proteins: TP, Albumin
- Liver: GOT, GPT, RGT, ALP, TBIL, DBIL
- Lipids: CHOL, HDLC, LDL, TG
- Glucose: GluAC, HbA1c
- Renal: BUN, BUN_pre, BUN_post, CREAT, UA, eGFR, UACR, UPCR
- Electrolytes: Na, K, Cl, Ca, FreeCa, P, Mg
- Iron: Fe, TIBC, TSAT
- Parathyroid/Vitamins: iPTH, VitB12, FolicAcid
- Tumor: PSA, FreePSA
- Thyroid: TSH, FreeT4
- Hepatitis titers: HBsAgTiter, AntiHBsTiter, AntiHCVTiter
- HIV: CD4
- Bone density field patterns (inside rows[].fields[].pattern) — these use
  `(-?\d+\.?\d*)` for T-scores, leave them as-is (T-scores don't have `<>`).

**Patterns already correct** (already have `[<>]?` — do NOT touch):
Ferritin, Aluminum, AFP, CEA, CA199, CA125, Aluminum's subpage.resultPattern

### Why this is safe

1. `[<>]?` is a zero-width optional match — existing numeric-only values
   still match identically.
2. `\s*` allows optional space between `<` and digits (e.g. `< 2.00`).
3. WBC's negative lookahead `(?!\s*[-–]\s*\d)` is unaffected.
4. Normalize functions (WBC, Platelet): `parseFloat("<5")` → NaN →
   normalize skipped → raw string preserved. This is correct behavior.

### reporter — same extraction logic

Check `hospital-lab-reporter/hospital-lab-data.html` `extractLabValues()`
function. It uses the same catalog patterns. After `sync-patterns.js`, the
updated catalog flows into the reporter automatically. BUT: verify that the
reporter's own `parseFloat()` handling doesn't silently drop `<N` strings.
If it does, add the same `<>` strip logic as the viewer's `valueStyle()`.

## Release steps

```bash
cd hospital-lab-patterns
# Edit catalog.js
npm run release
git add -A && git commit -m "fix: add [<>]? to all numeric capture groups for detection-limit values"

cd ../hospital-lab-viewer
node sync-patterns.js
git add -A && git commit -m "sync: catalog detection-limit regex update"

cd ../hospital-lab-reporter
node sync-patterns.js
git add -A && git commit -m "sync: catalog detection-limit regex update"
```

## Verification

1. After editing, run: `node -e "const C = require('./patterns/catalog.js'); C.forEach(t => { if (t.pattern) { const s = t.pattern.source; if (/\(\\[\\d\.\]\+\)/.test(s)) console.log('MISS:', t.id, s); } });"` — should print nothing (all converted).
2. Spot-check a few patterns manually: `TSH:\s*([<>]?\s*[\d.]+)` should match both `TSH: 2.5` and `TSH: <0.01`.

## Post-task

- Rename this file to `TASK_BRIEF_detection_limit_regex_done.md`
- Move to `hospital-lab-patterns/docs/task-briefs/`
- Update WORKLOG.md (繁體中文)
- Update CLAUDE.md if needed
- Update PROJECT_CONTEXT.md — add milestone
- Do NOT git push — ask first
