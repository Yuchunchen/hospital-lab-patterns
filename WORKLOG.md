# WORKLOG

Chronological log of pattern catalog changes. Newest entries on top.

Each entry should include:

- **Date** (YYYY-MM-DD)
- **Author** (your initials, or `claude` for Claude-driven sessions)
- **Hospital scope** (tt / yl / both)
- **Test ID(s)** affected
- **Change** (added / updated / removed)
- **Rationale** (one or two sentences)
- **Validation** (sample value the regex captured, e.g. `WBC: 6.87` → `6.87`)

---

## 2026-05-03 — Viewer further trimmed: drop 腎功能（透析） section + Mg

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `BUNPre`, `BUNPost` (section `腎功能（透析）`) and `MG`
  (section `營養／電解質`) from `patterns/viewer.js`.
- Change: removed (viewer only — these entries remain in
  `patterns/reporter.js` for the dialysis project where pre/post-dialysis
  BUN drives URR).
- Rationale: outpatient handout is for general ambulatory patients, not
  dialysis; the 腎功能（透析） column is irrelevant. Magnesium pruned per
  user preference for a leaner nutrition column.
- Validation: viewer catalog 59 → 56 entries. Section `腎功能（透析）` no
  longer exists. `營養／電解質` now 7 entries: Albumin, NA, K, FreeCa, FE,
  VitB12, FolicAcid. Renal section unchanged: BUN, CREAT, UA, eGFR, UACR,
  UPCR.

## 2026-05-03 — Viewer nutrition section pruned

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `TP`, `Cl`, `Ca`, `P`, `TIBC`, `TSAT`, `Ferritin`, `iPTH`
  from `patterns/viewer.js` (section `營養／電解質`)
- Change: removed (viewer only — these entries remain in `patterns/reporter.js`
  for the dialysis project)
- Rationale: outpatient handout's nutrition column should focus on Albumin,
  electrolytes (Na/K/Mg), free Ca, iron, B12, folate. Bone-mineral metabolism
  markers (Ca/P/iPTH) and protein/iron-status panels (TP/TIBC/TSAT/Ferritin)
  belong in the dialysis catalog where they're clinically actionable.
- Validation: viewer catalog entries 67 → 59; nutrition section now contains
  exactly 8 entries: Albumin, NA, K, MG, FreeCa, FE, VitB12, FolicAcid.

## 2026-05-03 — Lifelong hepatitis markers fix (consumer-side)

- Author: claude (with YC)
- Scope: hospital-lab-viewer/popup.js (NOT this repo — fix lives in the
  consumer because it's a fetch/filter behaviour, not a pattern definition)
- Change: added `Anti-HBs` to the all-time pass-through regex in popup.js
  (previously only `HBsAg|HCV Ab|REACT:|TPHA|HIV virus load|LEU3AN`).
- Rationale: HBsAg, Anti-HBs, Anti-HCV are lifelong markers — once positive
  (or once vaccinated for Anti-HBs), they tend to remain positive. The
  outpatient handout should surface the most recent value regardless of
  the 1-year lab-window cutoff.
- Validation: lab orders containing "Anti-HBs:" in reportText now bypass the
  12-month cutoff. The corresponding viewer catalog entries (`HBsAg`, `HCV`,
  `AntiHBs`) already carry `singleValue: true`, so report.js renders only
  the most recent value.

## 2026-05-03 — Phase 1 bootstrap

- Author: claude (with YC)
- Hospital scope: both
- Initial commit. Catalogs migrated unchanged from the two consuming projects:
  - `patterns/viewer.js` — 56 entries from `hospital-lab-viewer/mapping.js`
  - `patterns/reporter.js` — 50 entries from `hospital-lab-reporter/hospital-lab-data.html`
  - `patterns/computed.js` — URR, Ca×P, eGFR (CKD-EPI 2021), GFR/UACR/UPCR
    staging, KDIGO risk, Taiwan CKD stage, Early CKD class, PSA ratio,
    HCV / HBsAg / RPR / TPHA qualitative
- Schema documented in `docs/pattern-spec.md`.
- `scripts/validate.js` confirms: no duplicate IDs within either catalog;
  every pattern compiles.
- **Known overlaps** to reconcile in phase 2 (different IDs / different
  thresholds for the same underlying test):
  - `Glucose` (viewer) ↔ `GluAC` (reporter)
  - `BUNPre` / `BUNPost` (viewer) ↔ `BUN_pre` / `BUN_post` (reporter, uses `filter`)
  - `HbA1C` (viewer) ↔ `HbA1c` (reporter)  *only case difference*
  - `HCV` computed (viewer) ↔ `AntiHCV` raw (reporter)
  - `RPR` computed (viewer) ↔ `RPR` raw (reporter)
- Reporter's `qualitative: true` flag and viewer's `singleValue: true` /
  `computed: '...'` flags express overlapping concepts — to be unified in
  phase 2.
- Both consumer projects refactored to import from this repo; their inline
  catalogs removed.

---

## Template for future entries

```markdown
## YYYY-MM-DD — Short summary

- Author: <initials>
- Hospital scope: <tt | yl | both>
- Tests: <ID(s)>
- Change: <added | updated | removed>
- Rationale: <why>
- Validation: <example raw text → captured value>
- Related commit: <git short-hash>
```
