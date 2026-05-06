# PROJECT_CONTEXT.md

> Reference document for Claude (Cowork & Code modes). The strict rules live
> in Cowork's Custom Instructions field. This file holds the **facts** —
> architecture, paths, commands, marker names — that any thread might need
> to look up but doesn't need crammed into every prompt.
>
> When in doubt about anything in this file, the per-repo `CLAUDE.md` is
> authoritative for that repo, and `hospital-lab-patterns/WORKLOG.md` is
> authoritative for project-wide decisions.

---

## 0. Milestones

| Date | Milestone |
|---|---|
| 2026-05-03 | Patterns repo v0.3 (catalog + manifest + dist/patterns.json runtime artifact); hospital-lab-viewer wired to fetch dist/ at runtime with 24h cache + bundled fallback |
| 2026-05-04 | **hospital-lab-reporter form-aware export milestone**: dialysis revision 1 (ID-list input + demographics auto-fill + long-format CSV + 生效時間 cluster + 簽收時間 BUN sort) + hotfix v1 (BUN A+B classification fix) + hotfix v2 (sort/filter + per-row actions). Verified on vhyl patient 000105069H — BUN (BD)/(AD) display correctly, CSV export aligned to vhtt 病人定期檢查記錄 form |
| 2026-05-05 | **vhyl 五批修正**:(1) catalog 5 條 regex 放寬支援 vhyl `(YL)` suffix + 黏連格式(HBsAg / AntiHCV / AFP / TSAT / Fe);(2) viewer 肝炎硬編 regex 對齊 vhyl(HCV / HBsAg / AntiHBs);(3) **schema 加性別感知 threshold (`loM` / `hiM` / `loF` / `hiF`)**,viewer + reporter alarm 邏輯改為依 patient gender 挑 threshold,fallback 到 wide envelope。第一輪遷移 6 條(RBC / Hb / HCT / Fe / TIBC / Ferritin,誤判 case);(4) 第二輪再遷移 5 條(GPT / RGT / BUN / CREAT / UA,只加 hiM/hiF,維持原 lo:null);(5) **肝炎 regex 集中化**:catalog 加 3 條 raw titer + 2 條 computed display(HBsAgDisplay / AntiHBsDisplay,HCV 既有);patterns-computed.js 加 `_hepatitisDisplay` helper + 3 函式;viewer report.js 移除 `findHepatitis` / `findAntiHBs` 改走 dispatcher;reporter 維持 raw 定性顯示。觸發 case:vhyl 000151649A(女)Fe 58 µg/dL 誤判過低 + viewer 肝炎硬編 regex 沒同步 vhyl |

---

## 1. Project at a glance

A 3-repo system for parsing hospital lab/imaging reports and producing
clinical handouts and case-management exports.

| Repo | Role | Distribution |
|---|---|---|
| `hospital-lab-patterns` | Master catalog of test patterns + thin per-app manifests + named normalizers + computed-value helpers | npm-style (pure JS modules), runtime JSON snapshot at `dist/patterns.json` |
| `hospital-lab-viewer` | Chrome MV3 extension → outpatient handout printout | Side-loaded `.zip` distributed to OPD machines |
| `hospital-lab-reporter` | Single self-contained HTML → dialysis-room (and future CKD/DM/COPD) case management | Open the HTML directly in a browser |

**Workspace root:** machine-dependent (see below). Syncs via git, not Dropbox.

| Machine | Path |
|---|---|
| Dropbox 主機 | `D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\` |
| 台東 vhtt | `D:\self\hospital-lab\` (recommended — no Dropbox dependency) |

**GitHub:** `github.com/Yuchunchen` — all three repos public.

**Hospitals served:**

- `vhtt` = 臺東分院 (Taitung)
- `vhyl` = 玉里分院 (Yuli)

**API host:** `ernode.vghb12.<hospital>.gov.tw:8000`
**Endpoint:** `/order/get_lab_orders?chartno={chartno}&opsid={opsid}`
Intranet-only — Cowork can't fetch this directly, but Claude in Chrome
running on a hospital machine can.

---

## 2. hospital-lab-patterns (architecture v0.3)

### File layout

```
patterns/
├── catalog.js        ← master human-readable list (single source of truth)
├── viewer.js         ← thin manifest: ids + page/col/section + overrides
├── reporter.js       ← thin manifest: ids + cat/label + overrides
├── normalizers.js    ← named functions (wbcCount, plateletCount)
├── computed.js       ← URR, Ca×P, eGFR (CKD-EPI 2021), CKD/KDIGO staging,
│                       qualitative HCV/HBsAg/RPR/TPHA, PSA ratio
├── index.js          ← resolveManifest + byId + version
└── schema.js         ← validation
scripts/
├── validate.js       ← `npm run validate`
└── build-json.js     ← `npm run build-json` → dist/patterns.json
dist/
└── patterns.json     ← runtime artifact (COMMITTED — OPD fetches this)
```

### Resolution model

```
catalog (universal definitions)
    ↓ + viewer manifest  → resolved viewer entries (54)
    ↓ + reporter manifest → resolved reporter entries (37)
```

`Object.assign({}, catalogEntry, manifestEntry)` — manifest overrides catalog.

### Runtime JSON snapshot

`dist/patterns.json` is a JSON-serialised dump of the resolved arrays.

- RegExp → `{__regex: [source, flags]}` (rehydrated on read via JSON reviver)
- Functions are dropped during serialisation
- `normalize` references are stored as **string names** (e.g. `"wbcCount"`)
  and rehydrated to functions by the consumer

URL: `https://raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/dist/patterns.json`

### Current counts (validated 2026-05-07)

- 74 catalog entries
- 60 viewer-resolved
- 37 reporter-resolved
- 13 computed entries
- 1 track-only (Mg)
- 2 normalizers (wbcCount, plateletCount)

---

## 3. hospital-lab-viewer

### What it does

OPD doctor opens any patient's lab order page on the intranet → clicks the
extension icon → gets a printable handout (color or B&W, A4 landscape).

### Generated files (do NOT hand-edit)

- `mapping.js` — bundled catalog + viewer manifest + normalizers + resolver
- `normalizers.js` — synced from patterns repo
- `patterns-computed.js` — synced from patterns repo

All three are output by `node sync-patterns.js`.

### Runtime fetch behaviour (`pattern-loader.js`)

Order of precedence on popup open:

1. `chrome.storage.local['patterns_v0_3_raw']` if < 24h old → use it
2. Else fetch `dist/patterns.json` from GitHub raw → cache + use
3. Else (offline / GitHub down) → fall back to bundled `mapping.js`

The cache stores **raw JSON text**, not rehydrated objects, because
`chrome.storage.local` JSON-stringifies internally (which strips RegExp).

Freshness badge in popup header: ✓ fresh · 📦 cached · ⚠ stale.
Click to force refresh.

### Distribution

After every code change → repackage as `hospital-lab-viewer.zip` in the
parent folder. Side-load to OPD Chrome instances.

---

## 4. hospital-lab-reporter

### What it does

Single HTML file. Maintains patient list with CRUD, fetches labs from
intranet by chartNo, renders a longitudinal table, exports CSV.

### Currently dialysis-only

Currently set up for the dialysis room. The architecture is being extended
into a multi-disease-group framework — see `groups/` directory (planned).

### Pattern block

Inside `hospital-lab-data.html`, the catalog + manifest + resolver block
sits between markers:

```
// __HOSPITAL_LAB_PATTERNS_BEGIN__
... auto-generated ...
// __HOSPITAL_LAB_PATTERNS_END__
```

`node sync-patterns.js` overwrites everything between those markers.
Do NOT hand-edit content inside the markers.

### Disease-group framework (in flight)

Each disease group (dialysis / CKD / DM / COPD) will be its own module in
`groups/<id>.js`, inlined into HTML between **a second marker pair**:

```
// __HOSPITAL_LAB_GROUPS_BEGIN__
... auto-generated ...
// __HOSPITAL_LAB_GROUPS_END__
```

**Storage is fully separate per group** (explicit user requirement):

```
localStorage:
  patients_dialysis: { chartNo → patient }
  patients_ckd:      { chartNo → patient }
  patients_dm:       { ... }
  patients_copd:     { ... }
  labs_dialysis:     { chartNo → [labRows] }
  labs_ckd:          { ... }
```

A patient with both DM + CKD is entered in both lists — that's the cost
of separation, accepted by design.

### Dialysis monthly-draw detection

Reporter exports work on monthly intervals:

1. Sort all labs by `orderDate`
2. Cluster: gap > 2 days starts a new cluster
3. A cluster is a "monthly draw" if:
   - It contains ≥ 8 of the dialysis manifest's expected tests
     (tolerates missing items)
   - It contains BUN (any form)
4. BUN pre/post resolution within a cluster:
   - 2+ BUN entries → sort by `reportDateTime`; earliest = 洗腎前,
     latest = 洗腎後
   - 1 entry → defaults to 洗腎前 (post = null)

Other diseases will have their own intervals and detection logic in
their respective `groups/<id>.js`.

---

## 5. Workflow

### Mode split

| Cowork (desktop app, default) | Claude Code (從 workspace root 跑) |
|---|---|
| 思考、設計、code review | 多檔重構、批次修改（跨 repo 一次做完） |
| Pattern learning via Claude in Chrome | git commit / push |
| 規劃下一步、寫 TASK_BRIEF.md | 跑 sync-patterns / npm run release |
| 比較方案、畫架構圖 | 跑 validate、瀏覽器手動測試 |

### Claude Code 執行方式

**永遠從 workspace root 啟動**，讓 Claude Code 自行切換三個 repo：

```powershell
cd D:\self\hospital-lab    # workspace root（有 CLAUDE.md）
claude                     # 自動讀 workspace root 的 CLAUDE.md
```

Workspace root 的 `CLAUDE.md` 告訴 Claude Code 三個 repo 的位置、跨 repo
工作順序（patterns → viewer → reporter）、以及所有強制規則。Claude Code 會
自己 cd 到各 repo、讀各自的 `CLAUDE.md`、執行修改。

**不要** `cd` 進單一 repo 跑 `claude` — 那樣只看到一個 repo，無法跨 repo 操作。

Workspace root `CLAUDE.md` 不屬於任何 repo（不 git track）。新機器 clone 後
需建立一次，見 `docs/bootstrap.md` Phase 2。Template 在
`hospital-lab-patterns/docs/workspace-claude-md-template.md`。

### Hand-off pattern

```
COWORK
  └─ 討論 → 決定要做什麼 → 寫 TASK_BRIEF_<topic>.md
     （或直接把修改指引貼給 Claude Code）
                                            │
                                            ▼
CLAUDE CODE  (PowerShell, 從 workspace root)
  └─ claude → 讀 workspace CLAUDE.md → 自行切換到各 repo
              → 讀各 repo 的 CLAUDE.md → 實作
              → 各 repo 分別更新 WORKLOG.md → 各自 commit
              → 等你說 push → 一起 push
                                            │
                                            ▼
COWORK
  └─ 驗收 → 跨 repo 所有 phase 都 push 完之後:
            1. 改名加 _done 後綴，搬到 hospital-lab-patterns/docs/task-briefs/
            2. 更新 CLAUDE.md（若架構/行為變了）+ PROJECT_CONTEXT.md（加 milestone）
            3. 與當輪最後一個 commit 同一輪做掉
            → 計畫下一步
```

**_done 改名約定**(對應 project instructions 強制規則 #6):

- **時機**：跨 repo 所有 phase 都 done 並 push 完之後，不要每個 phase 後就改。
- **地點**：統一集中到 `hospital-lab-patterns/docs/task-briefs/`（三個 repo 共用）。
- **方法**：若 brief 原在 patterns repo，用 `git mv` 保留 rename history；
  若原在 viewer/reporter（gitignored），直接搬檔案到 patterns 再 `git add`。
- **分層更新**：每次完成 brief 時更新 CLAUDE.md + PROJECT_CONTEXT.md；
  `docs/` 其餘文件（pattern-spec、learning-workflow 等）留到 major revision 再整批校正。

### Pattern-learning shortcut

當我丟出 `chartno + test name`，預設啟動 live-fetch 流程：

1. Claude in Chrome 開該病人 lab 頁 (`ernode.vghb12.<host>.gov.tw:8000`)
2. 抓出該 test 的 label 樣式
3. 提議 regex（含負向前瞻、單位處理）
4. 我確認 → 寫進 `patterns/catalog.js`，加進對應 manifest
5. 跑 `npm run release`，更新 WORKLOG (繁體中文)
6. 提示我推 patterns repo + 兩個 sibling repo re-sync

---

## 6. Common commands (PowerShell from workspace root)

```powershell
# Patterns: validate + rebuild runtime artifact
cd hospital-lab-patterns ; npm run release

# Viewer: refresh bundled mapping.js after pattern change
cd hospital-lab-viewer ; node sync-patterns.js

# Reporter: refresh inline pattern block after pattern change
cd hospital-lab-reporter ; node sync-patterns.js

# Today's date for WORKLOG entries
Get-Date -Format yyyy-MM-dd
```

---

## 7. Where to look for what

| Need | Look here |
|---|---|
| Operating rules (must-obey) | Cowork Custom Instructions |
| Project facts (this file) | `PROJECT_CONTEXT.md` (workspace root) |
| Per-repo architecture & don'ts | `<repo>/CLAUDE.md` |
| Project decision history | `hospital-lab-patterns/WORKLOG.md` |
| Per-repo change history | `<repo>/WORKLOG.md` |
| What changed last commit | `git log -1` |
| Why a pattern is the way it is | catalog.js comments + grep WORKLOG |

---

## 8. Form reference (dialysis)

The dialysis reporter exports must align to the official paper form:

> **臺北榮民總醫院臺東分院血液透析中心 病人定期檢查記錄** (制定 2019.11.07)

It's a 12-month grid (1/ through 12/). One column per monthly draw, one
row per tracked item. The reporter's CSV export mirrors this — one row
per monthly draw, columns per item (4 sub-columns: value, unit, hi, lo).

### Form row → catalog ID mapping

Lab values (in scope for the reporter):

| Form label | Catalog ID | Periodicity | Notes |
|---|---|---|---|
| W.B.C | `WBC` | monthly | |
| R.B.C | `RBC` | monthly | |
| Hbc (g/dl) | `Hb` | monthly | "Hbc" is a form typo |
| Hct (%) | `HCT` | monthly | |
| MCV (fl) | `MCV` | monthly | |
| Platelet | `Platelet` | monthly | |
| Total Protein | `TP` | monthly | |
| Albumin | `Albumin` | monthly | |
| A.S.T. (GOT) | `AST` | monthly | |
| A.L.T. (GPT) | `ALT` | monthly | |
| Alkaline-P | `ALP` | monthly | |
| T. Bilirubin | `TBili` | monthly | |
| Cholesterol | `TCho` | monthly | (form shows quarterly stripes; user spec'd monthly) |
| LDL | `LDL` | monthly | |
| Triglyceride | `TG` | monthly | |
| Glucose (AC) | `GluAC` | monthly | |
| BUN (BD) | `BUN_pre` | monthly | BD = Before Dialysis = 洗腎前 |
| BUN (AD) | `BUN_post` | monthly | AD = After Dialysis = 洗腎後 |
| Creatinine | `CREAT` | monthly | |
| Uric acid | `UA` | monthly | |
| Na (meq/l) | `Na` | monthly | |
| K (meq/l) | `K` | monthly | |
| Cl (meq/l) | `Cl` | monthly | |
| Ca (mg/dl) | `Ca` | monthly | **Total Ca**, not free/ionized |
| P (mg/cl) | `P` | monthly | "mg/cl" is a form typo for mg/dL |
| URR | computed `URR` | monthly | |
| Kt/V | — | **DEFERRED** | Form column stays empty in CSV. User decision 2026-05-04: defer until needed. Future: simplified Daugirdas (t=4hr, UF/W=0.03) or operational-data ingestion for exact formula. |
| IRON | `Fe` | monthly | |
| TIBC (ug/dl) | `TIBC` | monthly | |
| TSAT (%) | `TSAT` | monthly | |
| Ferritin | `Ferritin` | monthly | |
| I-PTH (pg/ml) | `iPTH` | monthly | |
| HbA1c (DM) | `HbA1c` | monthly | **For everyone, not DM-only** despite form label |
| HBsAg | `HBsAg` | annual | Lifelong marker |
| Anti-HBS | `AntiHBs` | annual | |
| Anti-HCV | `HCV` | annual | |
| α-FP (肝炎) | `AFP` | annual | |
| Aluminin | — | **DEFERRED** | Form column stays empty in CSV. User decision 2026-05-04: defer until ground-truth sample data is available. vhyl probe on patient 000105069H found 0 aluminum records; vhyl may not routinely test Al. Re-activate when a long-term dialysis patient with Al history is found, or after lab confirms whether the panel includes Al. |
| HIV (新收時抽) | `HIV` | on-admission | Drawn once at start of dialysis |
| VDRL/RPR (新收時抽) | `RPR` | on-admission | Drawn once at start of dialysis |

### Form rows NOT in scope (operational)

These come from the dialysis machine + medication record, not the lab
system. **Out of scope for the reporter** per user decision:

- 體重(透析前) / 體重(透析後)
- Blood Flow
- 透析時間
- A-K (透析器型號)
- EPO

If/when the reporter expands to ingest these (e.g., from a dialysis
machine CSV export), Kt/V can switch from the simplified formula to the
exact Daugirdas calculation using actual t and UF/W.

### Periodicity rules in the CSV

- **Monthly tests**: empty cell = test not drawn that month (potential
  data-quality concern)
- **Annual tests**: empty cell = test not yet drawn this year (normal —
  matches form's diagonal-stripe convention)
- **On-admission tests**: empty cell = drawn at start of dialysis only
  (most monthly rows correctly empty)

The CSV does **not** carry forward values across rows, does **not** use
"N/A" — empty stays empty, matching the paper form's behaviour.

### CSV format (revision 1, 2026-05-04 — current active spec)

**Long format** (replaces the wide format from Step 1 v3 spec):

- One row per `(chartNo × YYYYMM)`.
- Columns: `id, YYYYMM, <test>.value, <test>.unit, <test>.lower, <test>.higher, ...`
- Each test contributes a 4-tuple in the order
  **value / unit / lower / higher**.
- `lower` / `higher` come from the catalog entry's `lo` / `hi`.
- Sort rows ascending by `(chartNo, YYYYMM)`.
- Single combined file across all tracked patients (no per-patient files).

### Monthly-draw detection logic (revision 1, 2026-05-04)

1. **Cluster key = exact `生效時間`** (down to the minute, as the API
   provides). All labs ordered together share this anchor.
2. A cluster qualifies as a **regular monthly check** if BOTH:
   - Test-id overlap with `monthlyRequiredIds` ≥ `minMonthlyOverlapRatio`
     (default 0.5). `monthlyRequiredIds` = `labManifest` items whose
     `periodicity` is `'monthly'` or absent.
   - At least one BUN entry present in the cluster.
3. **BUN pre/post via `簽收時間`** within the cluster: earliest =
   `BUN_pre` (洗腎前), latest = `BUN_post` (洗腎後). Single entry →
   `BUN_pre`, post = null.
4. **Same-month multiple monthly checks → take the earliest** (smallest
   生效時間 within that calendar month). Per user 2026-05-04: month-start
   is closer to "regular monthly check" timing.

### Three timestamps on each lab row — don't confuse them

| Field | Chinese | Meaning |
|---|---|---|
| `effectiveTime` | 生效時間 | When the order was placed. **Cluster anchor** — all labs in one draw event share this exactly. |
| `signOffTime` | 簽收時間 | When the lab finished and signed off the result. **BUN pre/post anchor** — pre is signed off mid-morning, post in afternoon/evening. |
| `reportDateTime` | 報告時間 | When results were posted. May or may not differ from 簽收時間 depending on the system. **Not used** in revision 1 logic. |

---

## 9. Maintenance SOPs — pattern updates & parsing fixes (the post-milestone playbook)

This section covers the **operational** workflow after the milestone.
Use this whenever you notice something needs adjusting.

### Decision tree: what's the symptom?

```
症狀
├── 某 lab value 應該要出現但沒有
│       ↓
│   先確認該 test ID 在 catalog 裡存在嗎？
│   (grep hospital-lab-patterns/patterns/catalog.js)
│       ├── 不存在 → 走 SOP A（新增 pattern）
│       ├── 存在但 regex 沒命中 → 走 SOP B（修 regex）
│       └── 存在且 regex 對，但 viewer/reporter 沒顯示 → 走 SOP D（manifest）
│
├── 某 reference range（hi/lo）變了
│       ↓ → 走 SOP C
│
├── 某 test 不要再顯示了（但 catalog 留著）
│       ↓ → 走 SOP E（manifest 移除）
│
└── 我有新的 chartno + test name 想學 regex
        ↓ → 走 SOP A（pattern-learning 流程）
```

### Cowork trigger conventions（自動啟動 SOP A 的快捷語法）

當使用者用以下格式發訊息，Cowork 端 Claude 應該**直接啟動 Pattern-learning
flow**，不要再問是 SOP A、B、F——自己選對。

| 訊息格式 | 啟動的 SOP | 自動行為 |
|---|---|---|
| `<vhyl\|vhtt>/<chartno> <test_name>` | A（新增）| 用 searchItem 抓 label → 提議 regex → 等確認 |
| `<vhyl\|vhtt>/<chartno> <test_name> 沒抓到/missing/沒出現` | F→B/D | F12 偵錯 + Chrome 看頁面 → 落到 SOP B 修 regex 或 SOP D 加進 manifest |
| `<test_id> ref range 改成 lo/hi` | C | 直接改 catalog.js |
| `把 <test_id> 從 viewer/reporter 拿掉` | E | 改 manifest，catalog 留著 |

**前置條件**（不滿足就先讓使用者處理）：

- Claude in Chrome 已連線（用 `tabs_context_mcp` 檢查）
- opsid = `A123456789`（YC 的；其他人需要替換）

**Chrome 自動化技巧**：

- ernode URL 支援 `&searchItem=<keyword>` 過濾，比翻頁快很多
- 若 `searchItem=<英文名>` 0 筆，試中文（例 `searchItem=鋁`、`searchItem=磷`）
- 仍 0 筆 → 該病人沒做過該 test，請使用者換病人或考慮跨醫院測試
- 翻頁參數：`&limit=20&offset=N`，N 從 0 起

**輸出格式**（讓使用者好貼進 Claude Code）：

確認 regex 後印給使用者：

```
✅ 已找到 label 樣式：「<actual label>」
建議 regex：<regex>
（vhtt 也適用 / 需要 alternation：<details>）

要做的修改：

1. patterns/catalog.js 新增條目：
<完整 entry block>

2. patterns/<viewer.js | reporter.js> manifest 加上：
<entry>

3. 如果是透析 group 用：groups/dialysis.js 的 labManifest 加 '<id>'

接下來在 Claude Code 跑：
  cd hospital-lab-patterns
  npm run release
  git status / commit / push
  
  cd ../hospital-lab-viewer  ; node sync-patterns.js  ; git status...
  cd ../hospital-lab-reporter ; node sync-patterns.js ; git status...

分發：
- viewer：OPD 端 24h 內自動拿到 dist/patterns.json，不用重灌
- reporter：把更新後的 hospital-lab-data.html 放 Dropbox 共用
```

### SOP A — 新增 pattern（learn-from-data flow）

最常見的 case：使用者丟一個 chartno + test name。

**Cowork 階段**：

1. 你跟我說：「在 vhyl/000XXXXXXX 加 [test name]」
2. 我用 Claude in Chrome 開該病人的 ernode lab page
3. 找到該 test 的真實 label 樣式（含中英文混雜、單位、可能的 negative
   lookahead 需求）
4. 提議 regex：包含 displayName / shortLabel / unit / hi / lo /
   category / 適用的 normalizer（如有）
5. 我確認 vhyl 跟 vhtt 兩家命名是否相同；若不同需用 alternation
6. 你確認 → 我把建議寫成 patterns/catalog.js 的新 entry + 加進
   patterns/viewer.js 或 patterns/reporter.js 的 manifest

**Code 階段**：

```powershell
cd D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\hospital-lab-patterns
npm run release   # validate + build-json
git add patterns/ dist/patterns.json WORKLOG.md
git commit -m "patterns: add <TestId> for vhyl/vhtt lab tracking"
# 顯示 commit msg 給使用者 → 等使用者說 push
```

push 到 GitHub 之後：

- **viewer**：runtime fetch 自動拿到（最多 24h；OPD 使用者可點 freshness
  badge 強制刷新）。**不需要 redeploy zip**。
- **reporter**：跑 `node sync-patterns.js`（在 reporter 資料夾）→
  `hospital-lab-data.html` 的標記區塊更新 → push reporter repo →
  使用者下載新 HTML

如果只是 viewer 用（門診衛教），reporter 那一輪可以省掉。

### SOP B — 修現有 pattern 的 regex

通常是「原本能抓但出現新 label 變體就漏」。

1. 拿到漏抓的具體文本（一行）— 透過使用者 paste 或 Claude in Chrome 抓
2. 比對現有 regex；多半要加 alternation（例 `Hb|HGB`）或寬鬆 separator
3. 在 catalog.js 修改該 entry 的 `pattern`
4. 寫 unit-test 風格的 console.log 驗證新 regex 對舊文本還命中 + 對新文本
   也命中
5. `npm run release` → push patterns repo
6. 兩個 sibling repo `node sync-patterns.js` → push

### SOP C — 修 reference range（hi / lo）

最簡單的 case，純資料變更。

1. 在 catalog.js 該 entry 修改 `hi` / `lo` / `refLo` / `refHi` /
   `ref`（顯示字串）
2. `npm run release` → push patterns
3. sibling 重 sync 跟 SOP A 一樣

### SOP D — 把已存在的 catalog test 加進某個 manifest

Test 在 catalog 但 viewer / reporter 沒顯示。

1. 開 `patterns/viewer.js` 或 `patterns/reporter.js`
2. 用該 test 的 id（搭配需要的 layout overrides — viewer 要 page/col/
   section、reporter 要 cat/label）加進 array
3. `npm run release` → push patterns
4. sibling 重 sync

對 reporter 而言，dialysis group 的 manifest 在 `groups/dialysis.js`
裡，不在 patterns repo。要加進透析顯示就改 `groups/dialysis.js` 的
`labManifest`、跑 reporter 的 sync。

### SOP E — 從 manifest 移除（catalog 留著）

例：某個 test 改成「track-only」（pattern 仍在抓資料，但不顯示）。

1. 從 viewer.js / reporter.js / groups/dialysis.js 的對應 manifest
   array **移除**該 id（**不要動 catalog.js**）
2. `npm run release` → 確認 validate 顯示該 id 出現在「track-only」清單
3. sibling 重 sync

如果未來想恢復顯示，只要把 id 加回 manifest 即可（catalog 沒丟）。

### SOP G — 加性別感知 threshold(gender-aware lo/hi)

某 test 在 catalog 的 `lo`/`hi` 寫死成男性那組,女性病人會誤判(2026-05-05
建立)。Schema 已支援 `loM`/`hiM`/`loF`/`hiF` 四個 optional 欄位。

**遷移單一 entry 的步驟:**

1. 在 `patterns/catalog.js` 該 entry 加四個性別欄位,把舊 `lo`/`hi` 改成
   wide envelope(= `min(loM,loF), max(hiM,hiF)`)作 fallback。例:

   ```js
   { id:'Fe',
     ...
     refLo:50, refHi:175,
     loM:65, hiM:175, loF:50, hiF:170,
     lo:50, hi:175 },                   // fallback for unknown gender
   ```

2. 跑 `npm run release`(validate 會檢查:有 loM/hiM/loF/hiF 的 entry 必須
   也有 lo/hi 作 fallback)。
3. push patterns repo。
4. viewer:不需改 code(`valueStyle()` 已是 gender-aware),只需 `node
   sync-patterns.js` 把 mapping.js 同步即可。
5. reporter:同上,只需 sync-patterns 把 inline pattern block 同步。

**alarm 邏輯位置(以後遇到要 debug):**

- viewer:`report.js` 的 `valueStyle(val, test, bw, isLatest, gender)` —
  gender 格式 `'男'`/`'女'`,unknown 走 fallback。
- reporter:`hospital-lab-data.html` line ~2835 的 alarm class 計算 —
  從 `currentPatient.sex` 拿 `'M'`/`'F'`。

**已遷移清單(2026-05-05):**

- 第一輪(誤判 case,加 loM/hiM/loF/hiF):RBC / Hb / HCT / Fe / TIBC / Ferritin
- 第二輪(漏 alarm case,只加 hiM/hiF):GPT / RGT / BUN / CREAT / UA
- 不需動:GOT(catalog ref `5–34 U/L` 沒分性別)

**Backlog:** 目前無已知性別感知缺口。新樣本若再揪出可參本 SOP 添加。

### SOP F — 「值沒出來」的偵錯流程

console F12 用以下步驟分層判斷（同 BUN bug 的偵錯邏輯）：

```javascript
// 1. 確認 testId 是不是 catalog 那邊已經有
//    若 catalog 沒有 → 走 SOP A
//    若 catalog 有 → 繼續

// 2. 確認 storage 有沒有資料
const data = JSON.parse(localStorage.getItem('labs_dialysis') || '{}');
const labs = data['<chartno>'];
labs?.['<TestId>']?.length

// 3. 若 labs[TestId] 是空陣列 → regex 沒命中 → 走 SOP B
//    若 labs[TestId] 有資料但 UI 沒顯示 → manifest 沒列 → 走 SOP D
```

---

## 10. Common pitfalls (learned the hard way)

### Don't confuse 生效時間 / 簽收時間 / 報告時間

- `生效時間` is the **order placement time** — all labs in one composite
  order share it exactly. Use this as the **cluster key** for monthly
  draw detection.
- `簽收時間` is the **sign-off time** — when each individual test was
  signed off. Use this for **BUN pre/post discrimination** (earliest
  signed-off BUN within a cluster = pre).
- `報告時間` is a generic "report posted" timestamp; not used in
  revision-1 logic.
- Mixing them up gives bizarre results: clustering on 簽收時間 shatters
  composite orders into per-test events; sorting BUN by 生效時間 always
  ties (because pre and post share the same order time).

### Other pitfalls


- **Dropbox mount NULL bytes** — Edit/Write occasionally adds trailing NULL
  bytes when writing through the FUSE mount. If JSON parse fails after a
  write, trim trailing nulls before retrying.
- **chrome.storage strips RegExp** — never cache rehydrated pattern objects
  to chrome.storage; cache the raw JSON text.
- **`dist/` belongs in git** — not in `.gitignore`. OPD users fetch it.
  `build/` is the directory to gitignore.
- **Hand-edits to generated files are silently overwritten** — always edit
  the source in the patterns repo, then sync.
- **Two BUN on same day** — earlier reportTime is 洗腎前, not the other way.
