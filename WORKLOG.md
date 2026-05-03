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
