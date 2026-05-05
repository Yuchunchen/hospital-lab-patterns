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

## 2026-05-05 — schema 加性別感知 threshold（loM/hiM/loF/hiF, Phase 1 patterns repo）

- 作者：claude（與 YC 共同）
- 範圍：schema、catalog、runtime-snapshot
- 變更：新增 schema 欄位 + 6 條 catalog 遷移
- 測試 ID：RBC、Hb、HCT、Fe、TIBC、Ferritin

**觸發：** 使用者回報 vhyl 病人 000151649A（女）在 viewer 顯示血清鐵 58 µg/dL
被誤判過低 — Fe 的 `lo:65` 鎖在男性下限，女性正常下限是 50。盤點後共 6 個
test 有同樣男女不同 reference range 的問題（女性中段值被當成過低）：

| ID | 舊 lo/hi | 女性誤判區間 |
|---|---|---|
| Fe | 65–175 | 50 ≤ x < 65 µg/dL |
| TIBC | 134–415 | 120 ≤ x < 134 µg/dL |
| Ferritin | 21.81–274.66 | 4.63 ≤ x < 21.81 ng/mL |
| RBC | 4.2–6.2 | 3.7 ≤ x < 4.2 ×10⁶/µL |
| Hb | 14–18 | 12 ≤ x < 14 g/dL |
| HCT | 39–53 | 33 ≤ x < 39 % |

**設計（C 方案 — 混合）：**

catalog schema 新增 4 個 optional 欄位 `loM` / `hiM` / `loF` / `hiF`，只在
有男女差異的少數 test 上用。舊 `lo` / `hi` 保留，角色降為「fallback /
unknown gender」並設成最寬包絡（= `min(loM,loF), max(hiM,hiF)`），確保
unknown 性別不會被任何一邊誤判。

Resolution rule（viewer / reporter Phase 2/3 會實作）：
- entry 有 `loM/hiM/loF/hiF`（任一存在）：
  - patient.gender 已知 → 用對應性別組
  - unknown → fallback 到 `lo/hi`（wide envelope）
- entry 沒有性別欄位 → 維持現有 `lo/hi` 邏輯

**修改 patterns/schema.js：**

1. `ALLOWED_FIELDS` 加入 `loM/hiM/loF/hiF`。
2. 加 validate 規則：4 個欄位若存在必須是 number 或 null/undefined；若任一
   存在，該 entry 必須**也有** `lo/hi` 作 fallback（不然 unknown 性別會炸）。
   失敗訊息明確點出哪個 id 缺 fallback。
3. 匯出 `GENDER_THRESHOLD_FIELDS` 常數讓 sibling repo 之後若需 introspect 可用。

**修改 patterns/catalog.js（6 條 entry，欄位順序：refLo/refHi → loM/hiM/loF/hiF → lo/hi）：**

| ID | loM/hiM | loF/hiF | lo/hi (fallback wide envelope) |
|---|---|---|---|
| RBC | 4.2–6.2 | 3.7–5.5 | 3.7–6.2 |
| Hb | 14–18 | 12–16 | 12–18 |
| HCT | 39–53 | 33–47 | 33–53 |
| Fe | 65–175 | 50–170 | 50–175 |
| TIBC | 134–415 | 120–480 | 120–480 |
| Ferritin | 21.81–274.66 | 4.63–204.00 | 4.63–274.66 |

其他欄位（pattern / displayName / unit / ref / refLo / refHi / 註解）一字未動。

**驗證：**

- `npm run release` 全綠：catalog 69 · viewer manifest 54 · reporter
  manifest 37 · `dist/patterns.json` 37.0 KB 重 build 成功。新四欄位
  全部進 JSON snapshot（都是 number，不需動 reviver / serialiser）。
  `byId('Fe')` 結果含 `lo:50, hi:175, loM:65, hiM:175, loF:50, hiF:170`。
- 暫存的 `scripts/gender-threshold-spec.js` 把 TASK_BRIEF §8 全 11 條
  測試樣本灌進新 catalog（pickThresholds + classify 模擬 viewer/reporter
  端的 alarm 邏輯）：
  - Fe×5 case（含觸發 case：女性 58 → normal、男性 58 → low、unknown 58 → normal）
  - Hb×3 case（女 13 → normal、女 11 → low、男 13 → low）
  - Ferritin×3 case（男 25 → normal、女 25 → normal、女 250 → high）
  - 11 PASS · 0 FAIL；spec 檔已刪除。

**影響：**

- catalog + dist/patterns.json 異動 → sibling repo 必須重 sync：
  - viewer：`node sync-patterns.js` 重 sync mapping.js；接著 Phase 2 改
    `report.js valueStyle()` 加 gender 參數 + threshold pick 邏輯，並把
    patient gender 沿 render call chain 傳進去。viewer 對 RBC/Hb/HCT
    無 manifest override，會直接吃 catalog 新欄位。
  - reporter：`node sync-patterns.js` 重 sync inline pattern block；
    Phase 3 改 `hospital-lab-data.html` (~line 2835) alarm 計算 + 決定
    是否打開 6 條原本被 manifest `hi:null lo:null` 蓋掉的 alarm 顯示。
- OPD 端 viewer popup 透過 `dist/patterns.json` 在 24h 內自動拿到新欄位
  （pattern 已序列化），但 alarm 邏輯仍要等 viewer Phase 2 推送的
  zip 才能生效（valueStyle 還沒讀新欄位）。

**Backlog（本輪不處理，等使用者實際遇到再開新 brief）：**

- GOT、GPT、RGT、BUN、CREAT、UA 6 個 test 的 `hi` 都鎖男性、`lo:null`，
  女性中段值會漏 alarm（不是誤判）。優先級低，schema 機制相同，加
  `hiM/hiF` 即可。

---

## 2026-05-05 — vhyl 5 條 regex 放寬（HBsAg / AntiHCV / AFP / TSAT / Fe）

- 作者：claude（與 YC 共同）
- 範圍：catalog
- 變更：修改
- 測試 ID：HBsAg、AntiHCV、AFP、TSAT、Fe

**觸發：** 使用者回報 vhyl 病人 000151649A 的 HBsAg / Anti-HCV / AFP、000051055E 的 Fe
在 reporter 漏顯示。連帶發現 TSAT 舊 regex `/SAT:/` 對 vhyl 的 `TS:` label 不命中。

**根因：** vhyl lab text 把同一項目的「數值滴度行」與「定性結果行」黏在同一行
（例：`HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)`）；lab name 後固定加
`(YL)` suffix；TSAT vhyl 寫成 `TS:`。詳見 TASK_BRIEF.md。

**修改 patterns/catalog.js（只改 pattern 欄位）：**

| testId | 舊 → 新 |
|---|---|
| HBsAg | `/HBsAg(?:\(TT\))?:\s*(\S+)/` → `/HBsAg\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AntiHCV | `/(?:HCV Ab\(TT\)|Anti-HCV):\s*(\S+)/` → `/(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AFP | `/AFP:\s*([<>]?[\d.]+)/` → `/AFP\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/` |
| TSAT | `/SAT:\s*([\d.]+)/` → `/(?<![A-Za-z])(?:TSAT|TS|SAT):\s*([\d.]+)/` |
| Fe | `/FE:\s*([\d.]+)/` → `/(?:Fe|Iron)\s*(?:\((?:TT|YL)\))?:\s*([\d.]+)/i` |

設計關鍵：HBsAg / AntiHCV 的 capture 改成 `[^\s\d]\S*`，讓引擎在 `(YL):` 那行才命中，
自動跳過前面的 `0.21` / `0.12` 數值；統一支援 `(TT|YL)` 兩家醫院 + 無 suffix；
TSAT lookbehind 防 `DESAT:` 誤命中、但允許 `267.00TS:` 命中（前一字是數字）；
Fe 加 `i` flag 與 `Iron` alternation。

每個 entry 上方加註解標記 vhyl 原始樣本，便於日後追溯。

**驗證：**
- `npm run release` 全綠：catalog 69、viewer manifest 54、reporter manifest 37、
  `dist/patterns.json` 36.6 KB 重 build 成功。
- 暫存的 `scripts/regex-spot-check.js` 把 TASK_BRIEF §5 全部 18 條樣本灌進新 pattern：
  - HBsAg：4/4（含 vhyl 黏連字串 `HBsAg: 0.21HBsAg (YL): Non-Reactive ...` → `Non-Reactive`）
  - AntiHCV：3/3（含 vhyl 黏連字串）
  - AFP：3/3（`AFP(YL): < 2.00` → `< 2.00`）
  - TSAT：4/4（`267.00TS: 22` → `22`；`DESAT: 95` 正確不命中）
  - Fe：4/4（`FE: 58`、`Fe (YL): 58`、`Iron: 100` 命中；`FERRITIN: 234` 正確不命中）
  - 18 pass · 0 fail；spot-check 檔已刪除。

**影響：**
- catalog 異動 → sibling repo 必須重 sync：
  - `hospital-lab-viewer` 跑 `node sync-patterns.js` 並重新發布（OPD 端另外
    24h 內透過 `dist/patterns.json` 自動拿到最新版）。
  - `hospital-lab-reporter` 跑 `node sync-patterns.js` 並重新發布。
- 預期：reporter 重 fetch 000151649A 後，HBsAg / Anti-HCV / AFP / TSAT 都會出值。

---

## 2026-05-03 — Runtime auto-update via dist/patterns.json (v0.3)

- Author: claude (with YC)
- Goal: pattern updates propagate to OPD computers automatically — no
  per-machine action when patterns change.
- New: `dist/patterns.json` — JSON snapshot of catalog + manifests, with
  RegExp values serialised as `{__regex:[source,flags]}` and functions
  dropped. Generated by `npm run build-json` on each push.
- New: `patterns/normalizers.js` — named normaliser fns (wbcCount,
  plateletCount). Catalog entries now reference normalisers by string
  name instead of inlining functions, so the JSON snapshot can survive
  the round-trip.
- `patterns/index.js`: `resolveManifest()` now rehydrates string
  normaliser refs to functions on the way out.
- `patterns/schema.js`: validates that string normalise refs resolve.
- `scripts/validate.js`: confirms WBC/Platelet rehydration works
  (`wbc.normalize(6700) === 6.7`).
- Viewer-side companion (`hospital-lab-viewer/`):
  - `pattern-loader.js` — fetches `dist/patterns.json` from
    `raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/`,
    caches in `chrome.storage.local` with 24h TTL, rehydrates RegExp via
    JSON reviver, falls back to bundled `mapping.js` if offline.
  - `popup.html`/`popup.js`: freshness badge in header (✓/📦/⚠) shows
    cache state; click to force-refresh.
  - `sync-patterns.js`: `mapping.js` now inlines `normalizers.js` so the
    bundled fallback also rehydrates correctly.
  - `manifest.json` host_permissions already covered `https://*/*`.
- Verification: 69 catalog · 54 viewer resolved · 37 reporter resolved ·
  2 normalisers (wbcCount, plateletCount) · 1 track-only (Mg) · WBC
  normalize round-trips JSON correctly (6700 → 6.7).
- Effect for OPD deployment: maintainer pushes patterns + dist/patterns.json
  to GitHub; every Chrome popup picks up the change on next open (or
  within 24h). Re-distribution of the extension itself only required for
  code changes (rare) or when adding a new normaliser.

## 2026-05-03 — Centralised catalog + thin manifests (v0.2 architecture)

- Author: claude (with YC)
- Hospital scope: both
- Change: refactored repo from "two parallel catalogs" to "one master
  catalog + per-app manifests".
- New file: `patterns/catalog.js` — 69 unique entries, every test
  definition lives here. Universal fields only (pattern, displayName,
  unit, ref, refLo/refHi, hi/lo, qualitative, normalize, computed, etc.).
  No app-specific layout (page/col/section/cat).
- Rewritten as thin manifests:
  - `patterns/viewer.js` — 56 entries; each is `{id, page, col, section,
    ...overrides}`. Picks subset of catalog for the outpatient handout.
  - `patterns/reporter.js` — 37 entries; each is `{id, cat, label,
    ...overrides}`. Picks subset for the dialysis table view.
- `patterns/index.js` resolves each manifest against the catalog (manifest
  fields override catalog defaults). Exposes resolved `viewer` and
  `reporter` arrays so consumers see the same shape as before.
- `scripts/validate.js` updated: validates catalog + checks every manifest
  id resolves + lists "track-only" catalog ids (entries not referenced by
  any manifest — these get pattern detection but no UI rendering).
- Both apps' sync scripts rewritten to bundle catalog + manifest +
  resolver into one self-contained output:
  - `hospital-lab-viewer/mapping.js` — catalog + viewer manifest +
    resolver inlined; exposes `TEST_MAP` and `VIEWER_CATALOG`.
  - `hospital-lab-reporter/hospital-lab-data.html` — same content
    inlined between `__HOSPITAL_LAB_PATTERNS_BEGIN/END__` markers; the
    resolver produces `LAB_TESTS`, `LAB_CATEGORIES`, `COMPUTED_TESTS`.
- Verification (validate.js): 69 catalog ids, 56 viewer resolved,
  37 reporter resolved, 25 shared between manifests. WBC viewer-specific
  override (5.0–10.0) and reporter default (4.0–11.0) both verified
  via `node -e` smoke tests.
- ID renames in viewer manifest (case normalisation; safe — no code
  references): `Glucose` → `GluAC`, `HbA1C` → `HbA1c`, `NA` → `Na`,
  `FE` → `Fe`, `ALKP` → `ALP`. Reporter ids unchanged.
- "Track-only" patterns (catalog entries not in any manifest): currently
  just `Mg` (Magnesium — kept in catalog for future re-use, removed from
  viewer's nutrition column on user request earlier today). Add more by
  defining them in `catalog.js` without listing them in any manifest.
- patterns/index.js exposes `version: '0.2.0'`.

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
