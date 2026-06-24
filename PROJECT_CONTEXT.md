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
| 2026-05-07 | **Detection-limit regex 全面打通 (`<N` / `>N` 入口)**:catalog 49 條原本只允許 `([\d.]+)` 的 numeric capture group 全改成 `([<>]?\s*[\d.]+)`（含 CBC / 蛋白質 / 肝功能 / 血脂 / 血糖 / 腎功能 / 電解質 / 鐵代謝 / 副甲狀腺·維生素 / PSA·FreePSA / 甲狀腺 / 肝炎 titer / CD4)，覆蓋全 catalog 還沒加 `[<>]?` 的所有純數值 capture。Ferritin / Aluminum / AFP / CEA / CA199 / CA125 此前已各自加過,本輪一次補齊。viewer `valueStyle()` 的 `replace(/^[<>]\s*/,'')` 與 reporter `extractLabValues()` 的 `<>` 開頭保留 string 行為都早已就位 — 入口開放後下游零調整。viewer / reporter 已 sync。順手把 Aluminum entry 的過時備註（"extractLabValues currently parseFloats it"）改成現況描述。 |
| 2026-05-07 | **Aluminum + 通用 sub-page enrichment + `<>` 字串保留**:(1) catalog 加 Aluminum entry + 新 category 微量元素，pattern 同時匹配 in-house `Al鋁: N` 與外送單位 `BALR0101: N` 兩種 label;(2) catalog 新增 optional `subpage` 欄位（`{ orderNameMatch, resultPattern, synthLabel }`），驅動 viewer + reporter 共用的 manifest-driven enrichment 機制 — 取代 viewer 原本 UACR-only 的 `enrichUACRMulti`;(3) viewer popup.js DB_VER 3 → 4 加 `enrichCache` IndexedDB store;reporter HTML 加整套 enrichment + localStorage `enrichCache_dialysis`;(4) chase 候選邏輯為 strict opt-in（只 chase 帶 `subpage.orderNameMatch` 的 test），UACR opt-in 保留 viewer 既有行為;(5) `extractLabValues` 對帶 `<>` 開頭的 capture group 保留為 string（`<2` 等 detection-limit 值不再被 parseFloat drop，table/CSV 直接顯示 literal）;(6) dialysis groups 加 annual-attach（按 YYYYMM 把 annual test entries 對齊到同月 monthly cluster，CSV 才能撈到 annual 值）。觸發 case:vhtt 92066B 6 筆 Blood Aluminum 表格只 1 筆 → 6 筆。已知殘留:reporter `file://` origin 下 opdweb sub-page fetch 全 CORS blocked（當前 Aluminum 不需 sub-page，無感）|
| 2026-05-07 | **findNearby 窗口 90→30 天**:viewer report.js `findNearby()` 原用 90 天窗口配對 eGFR 與 UACR/UPCR，導致單筆 UACR 被重複配到多個 eGFR 日期、在沒有 UACR 的日期顯示誤導 staging（case: 000115014H UACR=57.20 at 115/02/13，87 天外的 eGFR at 114/11/18 也被配上 → KDIGO=「中」）。改成 30 天窗口後只剩同日或近期精準配對。|
| 2026-05-07 | **Incremental fetch（stable-frontier）— viewer + reporter 同時上線**:(1) 觀察 — ernode 回傳 newest-first，signed-off 報告 immutable，`更新資料` / 6h TTL 過期就 full re-fetch 浪費 95%+ API call;(2) 新演算法 — 用 cached orders 的 `Map(ordseq → status)`，逐頁掃，遇到第一頁 ALL ordseq 都 known + status 不變 → STOP（之後頁面也都不變）;(3) viewer popup.js cache key v3 → v4 加 raw `allOrders`，loadData 三條路徑（TTL 內 / 過 TTL 跑 incremental / forceRefresh 全頁），↻ 按鈕仍是 escape hatch;(4) reporter 先用 localStorage `ordersCache_dialysis`，後遷移至 IndexedDB `LabReporterOrdersCache`（見下條）;(5) status 變動（未執行 → 正式報告）in-place overwrite cached entry，新醫囑 prepend，sub-page enrichment 在 merge 之後跑。預期：viewer 1 patient 從 5–15 call → 1 call；reporter 30 patients 從 150–450 call → ~30 call。|
| 2026-05-08 | **Reporter ordersCache localStorage → IndexedDB**:incremental fetch 上線後 reporter 的 `ordersCache_dialysis` 在 localStorage 約 3MB / 30 患者，逼近 5MB 上限。改用 IndexedDB `LabReporterOrdersCache`（DB_VER=1，store `orders`，keyPath=chartno），quota 顧慮消失。`enrichCache_dialysis`（sub-page text by ordapno）體積小，保留 localStorage。One-time migration IIFE 啟動時清舊 localStorage key。|
| 2026-05-08 | **Reporter Phase 2: KiDiTi 檢驗記錄匯出**:洗腎室 KiDiTi 平台需 58 欄 positional CSV（無 header、UTF-8 BOM、CRLF、民國年 7 碼日期、HBsAg/Anti-HCV → Y/N/O、缺值留空不能填 0）。新增「匯出KiDiTi資料」按鈕（橘色 btn-warning，與既有「匯出csv」並列），一鍵產出 `KiDiTi_檢驗記錄_YYYYMMDD.csv`。Button bar 同步改版：「更新資料」改名「全部更新」並放大成 primary action。Reporter manifest 加 FreeCa（field 34）/ Mg（field 41）/ UIBC（field 37，computed=TIBC−Fe）三條，catalog UIBC computed entry 也補上。同月檢辨識重用 `detectMonthlyDrawsFromStored` + `pickEarliestPerMonth`，UIBC / CaxP 在 export 函式 inline 計算（不污染 viewer）。|
| 2026-05-08 | **Reporter Phase 1.5: 病患清單勾選匯出**:病患清單表最左加 `_select` checkbox 欄（width 36px、不參與 sort/filter），勾選列加淡藍底。In-memory `selectedPatients = new Set()`（**不**持久化 — 重整即清是預期行為）。5 個 helper：`toggleSelectAll`（只動可見列）/ `togglePatientSelect` / `updateSelectState`（同步 master checkbox 的 checked / indeterminate）/ `updateSelectUI`（按鈕文字加 `(N)` 提示）/ `getSelectedChartNos`（回 array 或 null）。`exportKiDiTiCSV` / `exportCombinedCSV` 都先呼叫 `getSelectedChartNos()`：null → 全部、array → 只匯這些。`confirmRemovePatient` 順手清 Set、`renderPatientList` 渲染後呼叫 `updateSelectState()`（filter/sort 後勾選狀態維持）。|
| 2026-05-08 | **Reporter Phase 1: repo restructure（core/ + build.js + 16 模組）**:`hospital-lab-data.html` ~3700 行 monolith 抽成 16 個 `core/*.js` + 1 個 `export-formats/kiditi-csv.js` + `core/{shell,body}.html` template + `core/styles.css`。`build.js` 讀 shell + 串 patterns（從 sibling repo）+ groups + core（固定 load order）+ export-formats，產出 `hospital-lab-dialysis.html`（152.8 KB）。**無 ES modules、無 bundler**：core/*.js 都是頂層 function 宣告，concat 進單一 `<script>` 透過 hoist 跨模組可見 — 與 monolith 行為 1:1 對齊。`groups/dialysis.js` 完全不動。`sync-patterns.js` sync 完順手呼叫 `buildOne()` 重產所有 disease HTML。Phase 3+ 加新 disease 只需在 `build.js` 的 `DISEASES` 加 entry + 寫 `groups/<id>.js`，core/* 不需動。**Phase 1 fix（同日）**：`ENRICH_CACHE_KEY` 從 `enrichCache_dialysis` → `enrichCache`（disease-neutral，sub-page text 跟 disease 無關），加 one-time migration IIFE。Legacy `hospital-lab-data.html` 過渡期保留，仍由 `sync-patterns.js` 維護 markers。|
| 2026-05-08 | **Reporter Phase 3: Early CKD（hospital-lab-ckd.html + 腎平台 xlsx）**:第二個 disease HTML 上線。新增 `groups/early-ckd.js`（16 條 manifest，無 BUN pre/post，`drawDetection.requiredAnyOf = ['CREAT','BUN']` 寬鬆判斷）+ `export-formats/renal-platform-xlsx.js`（23 欄 `.xlsx`，3 行 header [key/label/unit]，西元年 `yyyy/mm/dd`，OB / 尿糖 `normalizeQualitative` 轉中括號 `[-]`/`[+]`/`[++]`/...，缺值留空不填 `[-]`）+ `lib/xlsx.mini.min.js`（SheetJS 0.18.5，從 cdnjs 下載，inline 進 CKD HTML 約 250 KB，dialysis 不動）。Catalog 加 4 條尿液 `UrineOB`/`UrineGlucose`/`UrineCr`/`UrineProtein`（從 84 位 vhtt CKD 病患 ernode 報告驗證）+ UPCR pattern 加 `T\.?PROT\/CREAT` alternation（vhtt 主流，原 RATTC 是 vhyl）。Build 框架加強：每 disease config 帶 `headerTitle` + `actionButtons` HTML + `libs[]`，`shell.html` 重排 `{{DISEASE_INIT}}` 移到 `{{CORE_JS}}` 之前（storage.js 才看得到 `window.ACTIVE_GROUP_ID`）+ 新 `{{LIB}}` placeholder。**Phase 1 build pipeline 第一次實戰**：加新 disease 完全沒動 core/*。產出 `hospital-lab-ckd.html`（412.1 KB 含 SheetJS）+ `hospital-lab-dialysis.html`（167.3 KB）並存。|
| 2026-06-19 | **Viewer 健檢報告(cxr.html)預設排序改「輸入順序為主」**(單檔小改,viewer-only):`cxr.js` `cxrState.sortKey` 預設 `'abnormal'`(異常浮頂)→ `'inputOrder'`,`cxrCompare` 新增 `inputOrder` 分支(第一鍵 `inputIdx` = popup 貼上清單的病人順序、第二鍵 `cxrExamOrder` CXR→BMD→CAC→LDCT),`cxrRunFromText` flat 前對 `perPatient[i]` 每列 stamp `r.inputIdx = i`(error / noReport 佔位列一併)。效果:每個病人的各檢查列相鄰連續、依貼上順序呈現,異常不再被拉到表頭拆開該病人(🔴 紅標保留,只是不再驅動排序)。`abnormal` 分支與 `filter-abnormal` checkbox 保留未動(可逆)。不跨 repo、不動 catalog → 無 sync-patterns。viewer `b653e51` / patterns(brief 歸檔)`89946c6` 已 push main。實機 T5(header 點擊臨時排序)+ 真實 render 留 vhtt follow-up。brief:`docs/task-briefs/TASK_BRIEF_健檢報告輸入順序排序_done.md`。|

---

## 1. Project at a glance

A 3-repo system for parsing hospital lab/imaging reports and producing
clinical handouts and case-management exports.

| Repo | Role | Distribution |
|---|---|---|
| `hospital-lab-patterns` | Master catalog of test patterns + thin per-app manifests + named normalizers + computed-value helpers | npm-style (pure JS modules), runtime JSON snapshot at `dist/patterns.json` |
| `hospital-lab-viewer` | Chrome MV3 extension → outpatient handout printout | Pulled from GitHub, loaded as **unpacked** extension on each machine (no zip) |
| `hospital-lab-reporter` | Disease-room case management (dialysis today, CKD/DM/ESRD next). `core/` modules + `groups/<disease>.js` + `export-formats/*.js` → `build.js` → standalone `hospital-lab-<disease>.html` | Open the built HTML directly in a browser |

**Workspace root:** unified across machines. Syncs via git, **not** Dropbox.

| Machine | Path |
|---|---|
| vhtt（台東 desktop） | `D:\self\hospital-lab\` |
| vhyl（玉里 desktop） | `D:\self\hospital-lab\` |

> 2026-05-10 起 vhyl 也從 Dropbox 路徑搬到 `D:\self\hospital-lab\`，與 vhtt 對齊。
> Dropbox 不再參與 working tree 同步，只保留 `_INDEX.md` 與非程式碼工作雜物。

**GitHub:** `github.com/Yuchunchen` — all three repos public.

**Hospitals served:**

- `vhtt` = 臺東分院 (Taitung)
- `vhyl` = 玉里分院 (Yuli)

**API host:** `ernode.vghb12.<hospital>.gov.tw:8000`
**Endpoint:** `/order/get_lab_orders?chartno={chartno}&opsid={opsid}`
Intranet-only — Cowork can't fetch this directly, but Claude in Chrome
running on a hospital machine can.

---

## 1.5 環境分工原則（established 2026-05-10）

兩台 desktop 環境分工，避免雙頭開發造成的 churn：

- **vhtt（台東 desktop）= 主開發機**
  - 新功能 / 新 SOP / 新 pattern 類別 / 跨 repo 大動作
  - 新模組與新疾病群組（如 Phase 3 Early CKD、未來 DM / ESRD）
  - reporter `core/` 與 `export-formats/` 結構性改動
  - 新 hospital-lab-`<disease>`.html 上線

- **vhyl（玉里 desktop）= 測試 + minor revision**
  - 允許：單條 pattern add / regex tweak / ref range 微調 / viewer-reporter `sync-patterns` 重跑
  - 不允許：跨多條 pattern 重構、catalog schema 改、新功能模組
  - 例外處理：在 vhyl 抓到 case 揭示**非 minor** 的問題 → 不要在 vhyl 動手，寫 `TASK_BRIEF_<topic>.md` 帶回 vhtt 處理

### 「Minor」的明確邊界

| 動作 | 在 vhyl 動手？ |
|---|---|
| 改某條 pattern 的 regex（一個檔內） | ✓ |
| 改某條 pattern 的 `ref` 範圍 | ✓ |
| 增加一條 yl-only pattern | ✓ |
| `node sync-patterns.js` 重跑 viewer/reporter | ✓ |
| 補登 WORKLOG | ✓ |
| 新增 hospital scope 的 pattern 類別（跨多檔） | ✗ → vhtt |
| 改 `patterns/schema.js` / `resolution model` | ✗ → vhtt |
| 新增 `groups/<disease>.js` 或 `export-formats/*.js` | ✗ → vhtt |
| 改 `core/` 模組 | ✗ → vhtt |

### Hospital-scope tag

WORKLOG 條目的 hospital scope 隨此分工自然落定：
- vhtt 開發 → 多半 `both` 或 `tt`
- vhyl 修補 → 多半 `yl` 或 `both`

### 跨機器 handoff brief convention（established 2026-05-10）

當機器 A 累積了機器 B 需要知道的狀態（架構決策、半完成的重構、環境遷移、
新規範），離開前寫一份 handoff brief：

**檔名**：`docs/task-briefs/TASK_BRIEF_handoff_<src>_to_<dst>_<date>.md`
- `src` / `dst` = `vhtt` 或 `vhyl`
- `date` = `YYYY-MM-DD`

**內容**：背景 + step-by-step phases + 完成 checklist + 對方端待辦（即反向 brief 的種子）

**Lifecycle**：

1. 寫完 → src 端 `commit + push`
2. 對方 `git pull` → 讀 brief → 執行
3. 對方執行完 → 改名加 `_done` 後綴 + 同輪 `commit + push`（依 rule #6）

**何時寫**：只在有意義的狀態變化時寫——不是每次切機器都要。判準：
「對方不讀這份就會踩雷或重複勞動嗎？」是 → 寫。

**首例**：`TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-10_done.md`（Dropbox → 純 git 遷移）

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

### Current counts (validated 2026-05-08)

- 80 catalog entries
- 60 viewer-resolved
- 41 reporter-resolved (manifest), CKD-resolved via `groups/early-ckd.js` labManifest
- 14 computed entries (URR / CaxP / UIBC / eGFR / GFRStage / UACRStage /
  UPCRStage / KDIGORisk / TaiwanCKD / EarlyCKD / PSARatio / 3 hepatitis displays)
- 4 track-only (UrineOB, UrineGlucose, UrineCr, UrineProtein — referenced
  by reporter via `groups/early-ckd.js`, not the patterns/reporter.js manifest)
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

No zip packaging. Each machine pulls the latest from GitHub and loads/reloads
the **unpacked** extension at `chrome://extensions`. Pattern-only changes need
no reload — OPD picks up `dist/patterns.json` within 24h via runtime fetch.

### 健檢報告視窗（`cxr.html` / `cxr.js`）

OPD handout（popup → A4 報表）之外，viewer 另有一個**獨立視窗**處理健檢影像
批次翻譯，與門診 lab 報表流程完全分開（由 popup / dashboard 開啟）。

- **涵蓋四類**：CXR / BMD（骨密）/ CAC（冠脈鈣化）/ LDCT（低劑量肺 CT），各對應
  catalog 的 **track-only pattern**（match orderName，不抓數值）。
- **輸入**：病歷號清單從 popup 經 `chrome.storage.session['cxr_chartlist']` 帶入
  （`uniq = [...new Set(valid)]` **保留貼上順序**）。
- **第一階段 — batch fetch（concurrency 3）**：每人 reuse `lab-core` 的 `loadData`
  → 四類 pattern 各取最近一筆 order（每種一列、最多 4 列，沒有就不出該列）→ 子頁面
  `OpdOrderReport.aspx` 取「報告內容：」之後 free text（去表頭）。不自己 fetch / 開 DB，
  全走 lab-core 共用工具。
- **第二階段 — batch translate（concurrency 5）**：每列 reportText 經 `llm-translate`
  （provider：`mock` / `gemini` / `claude` / `openai`）翻成中文摘要 + 標異常 →
  IndexedDB `cxrTranslations` 快取（鍵 = `ordapno`，切 provider/model 以 overwrite
  自然 cap 在 1 筆/ordapno）。Mode A（provider≠mock 且有 API Key）自動翻譯；否則摘要
  留空並提示點右上 ⚙️ 設定 provider + API Key 後重跑。
- **Render**：6 欄表格（病歷號 / 檢查類型 / 開單日期 / 檢查日期 / 原始內容 / 摘要），
  檢查類型 badge、異常紅字（🔴）。篩選：檢查類型 radio（全部 / CXR / BMD / CAC /
  LDCT）+「只看異常」/「只看無報告」checkbox。Status：`abnormal` / `normal` /
  `pending` / `noReport` / `error`。
- **預設排序 `inputOrder`**（病人貼上順序，2026-06-19 起 — 見 §0 milestone）:每個病人的
  各檢查列相鄰連續、依貼上順序呈現，異常不再浮頂拆開該病人（🔴 紅標保留為視覺，不驅動
  排序）。點欄位 header 可臨時改排序（opt-in，重跑回到輸入順序）；`abnormal`（異常浮頂）
  分支保留為非預設選項。
- **列印**：A4 portrait，列印時隱藏 header / 輸入列 / 統計列，原文 + 摘要 full width、
  異常紅字。
- **LLM 設定 modal**：provider / model / apiKey 存 `chrome.storage.local`（本機，不同步雲端）。
- **classic-script 共用 global scope**：所有 top-level 宣告一律 `CXR_` / `cxr` 前綴，
  避開 `mapping.js` 的 `CATALOG`、`patterns-computed.js` 的 `HELPERS` 等既有 const
  （新檔不能 top-level `const` 撞名，否則整檔 SyntaxError；參見 viewer CLAUDE.md）。

---

## 4. hospital-lab-reporter

### What it does

Disease-room case management — maintains a patient list with CRUD,
fetches labs from intranet by chartNo, renders a longitudinal table,
exports CSV (long-format + KiDiTi 58-field positional). Phase 1 ships
dialysis; CKD / DM / ESRD follow in Phase 3+.

### Layout (post Phase 1, 2026-05-08)

```
hospital-lab-reporter/
├── core/                     ← shared shell across diseases
│   ├── shell.html            ← HTML template ({{TITLE}}, {{STYLES}}, ...,
│   │                            {{HEADER_TITLE}} via body, {{LIB}}, etc.)
│   ├── body.html             ← body markup with {{HEADER_TITLE}} +
│   │                            {{ACTION_BUTTONS}} placeholders
│   ├── styles.css            ← extracted CSS
│   └── *.js (16 files)       ← storage, fetch, indexeddb-cache, enrichment,
│                                lab-extract, compute, date-utils, ui-tabs,
│                                ui-patient-list / select / crud / remove,
│                                ui-lab-view, ui-settings, export-utils,
│                                chart-format, init
├── groups/
│   ├── dialysis.js           ← 透析 (UNCHANGED across all phases)
│   └── early-ckd.js          ← 初期慢性腎臟病 (Phase 3, 2026-05-08)
├── export-formats/
│   ├── kiditi-csv.js         ← KiDiTi 檢驗記錄 58-field positional CSV
│   └── renal-platform-xlsx.js ← 腎臟病平台 23-col xlsx (Phase 3)
├── lib/
│   └── xlsx.mini.min.js      ← SheetJS 0.18.5 (only inlined for ckd build)
├── build.js                  ← assembles → hospital-lab-<disease>.html
├── sync-patterns.js          ← sync legacy markers + chain build.js
├── hospital-lab-dialysis.html ← BUILT — 透析病房 (167 KB)
├── hospital-lab-ckd.html     ← BUILT — CKD 門診 (412 KB, ships SheetJS)
└── hospital-lab-data.html    ← LEGACY monolith, still updated by
                                 sync-patterns.js for transition period
```

`build.js` reads shell + styles + body markup + patterns (sibling repo
`patterns/{catalog,reporter,normalizers}.js` + resolver) + groups + core
(fixed load order, init last) + the disease's export-formats, fills
placeholders, writes the standalone HTML. Pure concatenation — no IIFE,
no bundler, no ES modules; top-level fn declarations hoist within the
single `<script>` block so cross-module calls Just Work like the legacy
monolith.

### Adding a new disease (post Phase 3)

Phase 3 (early-ckd, 2026-05-08) made this routine. Recipe:

1. Add `groups/<id>.js` with `labManifest`, `detectDrawsFromStored` (or
   the dialysis-style `detectMonthlyDrawsFromStored`), `pickEarliestPerMonth`,
   `exporter.formatAll`, `storageKey: { patients, labs }`, optional
   `patientFields`. Register via `window.GROUPS[id] = ...`.
2. (Optional) Add a disease-specific `export-formats/<format>.js` if the
   target platform wants something other than long-format CSV.
3. (Optional) Drop a vendor lib into `lib/<file>` if the export needs one
   (e.g., SheetJS for xlsx).
4. Add an entry to `DISEASES` in `build.js`:
   ```js
   <id>: {
     title:         '<HTML <title>>',
     headerTitle:   '<page <h1>>',
     groupId:       '<groups/<id>.js exposed id>',
     libs:          ['xlsx.mini.min.js'],     // optional
     exportFormats: ['<format-name>'],        // optional
     actionButtons: '...HTML for the right-side buttons...',
   }
   ```
5. `node build.js <id>` → `hospital-lab-<id>.html`.

`core/*.js` does not need to change. `core/storage.js` already reads
`window.ACTIVE_GROUP_ID` (set by `{{DISEASE_INIT}}`) with a `'dialysis'`
fallback for legacy compatibility.

### Pattern + groups blocks (legacy monolith)

`hospital-lab-data.html` keeps marker pairs that `sync-patterns.js`
overwrites:

```
// __HOSPITAL_LAB_PATTERNS_BEGIN__   ... // __HOSPITAL_LAB_PATTERNS_END__
// __HOSPITAL_LAB_GROUPS_BEGIN__     ... // __HOSPITAL_LAB_GROUPS_END__
```

The new built `hospital-lab-<disease>.html` does **not** use markers —
`build.js` re-reads patterns + groups directly each build (the output is
a throwaway artifact).

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

### Sub-page enrichment (manifest-driven, 2026-05-07)

Some lab orders show only `請 Click「正式報告」`-style placeholder in the
main reportText; the actual values live in opdweb's
`OpdOrderReport.aspx` sub-page. Both viewer and reporter share the same
generic `enrichMissingValues()` (差只在 cache backend：viewer 用
IndexedDB store `enrichCache`，reporter 用 localStorage `enrichCache`
（disease-neutral 共用，2026-05-08 從 `enrichCache_dialysis` 改名 +
migration IIFE — sub-page text 跟 disease 無關），key 都是 `ordapno`，
永不過期 — lab 報告簽收後不變動).

**Strict opt-in 候選邏輯:** 只 chase 帶 catalog `subpage.orderNameMatch`
的 test。Tests opt in 透過:

```js
subpage: {
  orderNameMatch: /Aluminum|鋁/i,            // 必填:本 order 可能含此 test 的 orderName 訊號
  resultPattern:  /Result:\s*([<>]?\s*[\d.]+)/,  // 選填:子頁面用不同 label 時的翻譯 regex
  synthLabel:     'Al鋁',                    // 選填:配 resultPattern 注入回主 reportText 的 label
}
```

兩階段 apply: Phase A 試主 regex,沒中再用 `resultPattern` + orderName
翻譯（如 Aluminum 子頁面只有 `Result: N` → 注入 `Al鋁: N` 進
reportText,下游 extractLabValues 即可命中）。Non-subpage missing 的
test **不**會 brute-fetch（避免一個 globally-missing test 拖累一車 order
被 fetch）。

**已 opt-in 的 test:** Aluminum、UACR。

**Reporter `file://` 限制:** 直接雙擊開啟 HTML 時瀏覽器以 `file://`
origin 載入,opdweb 沒設 `Access-Control-Allow-Origin` → fetch 全 CORS
blocked。目前 Aluminum 透過主-page regex 擴充（同時匹配 `Al鋁:` 與外送
單位 `BALR0101:`）解決,沒踩到此限制。未來若有真的 sub-page-only
test,需把 HTML 移到 localhost server 或 Chrome extension 化。Viewer 是
Chrome MV3 extension（`host_permissions: https://*/*`）不受影響。

### Detection-limit values (`<N` / `>N`, 2026-05-07)

`extractLabValues` 對 capture group 開頭是 `<` 或 `>` 時保留為 string
（如 `"<2"`）,不走 parseFloat。下游全自動相容:

- table 渲染:`parseFloat("<2")` → NaN → 跳 alarm color → 直接顯示原字串
- CSV:`csvCell` 字串化 → literal `<2`
- URR / Ca×P / classifyBUN:既有 `Number()` + `isFinite` 防衛跳過

Aluminum `<2`(低於偵測下限 = 抽了、安全)是這條的主要驅動 case。

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
| **Cross-machine "what's next" dashboard** | Notion「🛠 開機 SOP (vhyl ↔ vhtt 共用)」page(見 § 10) |
| **TASK_BRIEF 進度 / 順序 / 依賴** | Notion 同一 page 內嵌的 TASK_BRIEF Dashboard database |

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
| Aluminin | `Aluminum` | annual | **Active 2026-05-07.** vhtt 18 人探測 12 人有 Blood Aluminum 年檢資料（67%）;orderName `Blood Aluminum` / `Blood Aluminum(TT)`。主 regex 同時匹配 in-house `Al鋁: N` 與外送單位「新南海醫事檢驗所」`BALR0101: N` 兩種 label;不需 sub-page enrichment。`<2`（低於偵測下限）保留為 string 顯示。CSV 透過 dialysis groups 的 annual-attach（按 YYYYMM 對齊到同月 monthly cluster）出現此欄。Form 上的 typo「Aluminin」對應的正名是「Aluminum」(Al)。|
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
| `<test_id> ref range 改成 lo/hi` | C | universal — 改 refHistory `*` 那筆 |
| `<vhyl\|vhtt>/<test_id> ref range 改成 lo/hi` | C | machine-specific — refHistory 末加一筆 |
| `<vhyl\|vhtt>/<chartno> <test> ref` | C-crawl | Chrome 爬該病人報告 → 解讀 ref → 提議 refHistory entry → 等確認 |
| `<vhyl\|vhtt>/<chartno> ref-scan` | C-crawl | 整張報告掃所有可抓 ref → 逐筆提議 |
| `<chartno> <test> 完整報告` ／ `原始報告` | C-crawl（取閱）| ernode 列取 hidden `ORDAPNO`（濾 resulted）→ 開 opdweb `OpdOrderReport.aspx` → 回報告原文（檢查值＋ref）；**不**自動產 refHistory 提議（要落 ref 再用上面 `… ref` / `ref-scan`）。哪筆 order 不明 → 先問 |
| `把 <test_id> 從 viewer/reporter 拿掉` | E | 改 manifest，catalog 留著 |

**前置條件**（不滿足就先讓使用者處理）：

- Claude in Chrome 已連線（用 `tabs_context_mcp` 檢查）
- opsid = `A123456789`（YC 的；其他人需要替換）

**Chrome 自動化技巧**：

- ernode URL 支援 `&searchItem=<keyword>` 過濾，比翻頁快很多
- 若 `searchItem=<英文名>` 0 筆，試中文（例 `searchItem=鋁`、`searchItem=磷`）
- 仍 0 筆 → **不要直接判定病人沒做過**，改為逐頁瀏覽：
  - 翻頁參數：`&offset=N`（N 從 1 起，每頁 20 筆）
  - 從第 1 頁開始，逐頁 `get_page_text` 掃描所有 order name
  - 直到最後一頁（頁面顯示「X 之 Y」可判斷總頁數）或找到目標 order
  - 理由：searchItem 有時因 order name 格式不一致而漏（如含空格、縮寫、中英混雜）
- 確認掃完全部頁面仍找不到 order → **仍不可直接判「沒做」**（見下方「沒開立判定原則」）；要確認進過相關完整報告內文都沒有，才換病人
- 翻頁參數：`&offset=N`，N 從 1 起（offset=0 會回 400 error）

**沒開立 / 漏抓判定原則（established 2026-06-24，vhtt+vhyl 反覆踩坑）：**
判一個 test「做沒做 / 有沒有值」有**兩層失敗**都會造成假性「沒開立」，要分清楚：

- **Layer 1 — discovery（要不要開那張報告）**：ernode worklist 只給 *order 名* + *截斷 value 預覽*。一個 analyte 被 co-bundle 進別的 order（名稱沒列它）就會被漏。**鐵代謝 Fe/TIBC/Ferritin/TSAT/UIBC 常同一張完整報告；生化 panel 把 K/P/UA… 包一起。** 故 `searchItem=0`、order 名沒命中、預覽沒看到，**都不等於沒做**。
- **Layer 2 — parser（報告開了卻沒解析到）**：positional 報告版面怪癖會跳過 analyte — panel 前綴 `CBC: WBC`、單字母名 K/P、名與 ref off-by-row、子字串碰撞（`磷`碰`磷酸酶`）、免疫法 header 版面（Ferritin/CEA/AFP 名在 `檢驗項目:`、ref 在 `生物參考區間/NORMAL RANGE`）。
- **原則**：判定**一律以 opdweb 完整報告「內文」為準**，不可只憑 worklist order name / `searchItem` / 預覽判沒做。找不到先 fallback 逐張開相關完整報告解析（panel 一張含多項）；parser 漏抓時用中文名錨定 + 同/鄰列最近 range-ref（見 `vhtt_ref_gapfill_findings_2026-06-24.md` 的 targeted parser）。

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
cd D:\self\hospital-lab\hospital-lab-patterns
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

### SOP C — 修 reference range（machine × time × gender，refHistory）

純資料變更，但自 2026-05-28（TASK_BRIEF_ref_range_machine_time_dim，Order 5.0）
起 reference range 有 **機器 × 時間 × 性別** 三維。53 個試劑校正類 lab id 各帶
`refHistory[]`（schema 見 `docs/pattern-spec.md`）。判定正常/異常時 viewer /
reporter 經共享 `patterns/lib/resolveRef.js` 用「本機 chrome 設定（vhtt/vhyl）
× 該筆報告日期 × 病人性別」解出正確 ref。

**觸發語（§4.1）：**

| 觸發語 | 動作 |
|---|---|
| `<test_id> ref range 改成 <lo>/<hi>` | universal — 改該 entry refHistory 中 `machine:'*'` 那筆的 refLo/refHi（順手把外層 `lo`/`hi` + `ref` 顯示字串對齊，避免漂移） |
| `vhtt/<test_id> ref range 改成 <lo>/<hi>` | refHistory 末**加一筆** `{machine:'vhtt', refLo, refHi, validFrom:今天, source:'YC SOP C 觸發 '+日期}` |
| `vhyl/<test_id> ref range 改成 <lo>/<hi>` | 同上，`machine:'vhyl'` |
| `…改成 <lo>/<hi> 來源 <source>` | 同上，`source` 用指定字串 |

性別 inline override（`refLoM/refHiM/refLoF/refHiF`）**不寫成 trigger 語**，
由 YC 對話補述觸發。例：`vhyl/RBC ref range 改成 3.5/6.0` + 補述
「男 4.0-6.0，女 3.5-5.5」→ Claude 在剛加的那筆 refHistory 內補
`refLoM:4.0, refHiM:6.0, refLoF:3.5, refHiF:5.5`。

**Trigger parser（§4.2，與 `docs/cowork-project-instructions.md` 同步）：**

```
訊息含「ref range 改成」keyword → SOP C 分支：
  a. 第二 token 帶 vhyl/ 或 vhtt/ 前綴 → machine-specific 變體（末加一筆）
  b. 沒前綴 → universal 變體（改 '*' 那筆）
（其餘 keyword：沒抓到/missing → SOP F→B/D；從 viewer/reporter 拿掉 → SOP E；
  第二 token 是 chartno 格式 → SOP A）
```

**動作步驟（§4.3）：**

1. 在 patterns repo 找到 entry
2. 若 entry 無 `refHistory`（理論上 53 in-scope 都有；BUN_pre/post 繼承 BUN，
   排除清單不該走 SOP C）→ 先補 migration 起點筆
3. 依 trigger 前綴決定 `machine`；依對話補述決定是否加 inline 性別 override
4. `npm run release`（validate + build-json）；可順手 `npm run test:refhistory`
5. 兩個 sibling repo `node sync-patterns.js` → push（維持規則 #3 先問）

**Pattern-learning time-machine awareness（§4.4）：** YC 在 Cowork session 開頭明示
「im in vhtt / im in vhyl」→ carry context 整個 session（SOP A 用該 machine 對應
ernode URL 抓正式報告）。trigger 語含 `vhtt/`/`vhyl/` 前綴會覆蓋 session context。

### SOP C-crawl — reference range 自動爬取 / 手動指定（established 2026-06-23）

SOP C 的「來源」擴充：lo/hi 從「YC 口述」擴成「Claude 爬 ernode 報告解讀」。
**歸屬（YC 2026-06-23 修訂）:** ref 字串**解析 + 寫成 refHistory entry 進 `catalog.js` = Cowork**
（格式雜、需語意判斷，**不寫死 regex parser code**；視為 catalog 單檔資料維護，blast radius = 單檔，
屬 Cowork 小半徑）。**Claude Code 不寫 ref-range parser**，只負責 release + 三 repo sync + push +
`resolveRef`/viewer 的**程式**（含年齡維）。一句話：ref **資料**由 Cowork 落 catalog、**程式**由 Claude Code 落。

**模式 A — 自動爬取（auto-crawl）**

觸發語：
- `<vhyl|vhtt>/<chartno> <test_id|test_name> ref` — 單一 test
- `<vhyl|vhtt>/<chartno> ref-scan` — 整張掃所有可抓 ref（可一次多 chartno / 多行）

步驟：

1. 前置：Claude in Chrome 已連線（`tabs_context_mcp`）；opsid 預設 `A123456789`；
   機器維度取觸發語前綴或 session context（im in vhyl/vhtt）。
2. 開 ernode：
   `http://ernode.vghb12.<machine>.gov.tw:8000/order/get_lab_orders?chartno=<chartno>&opsid=A123456789&searchItem=<test>`
3. **找 ref 字串（已驗 2026-06-23 @ vhyl／000012885I）**：ref **不在** ernode lab_orders
   列（該層只有 `analyte: value`），而在 **opdweb 完整報告**。取得路徑：
   - ernode 每筆列帶 hidden `<input name="ORDAPNO">`（+ OPSID/PFCODE/ORDTYPE=LAB/COM_KEY）。
     ⚠️ 未執行列也有 ORDAPNO → 先用狀態（`正式報告`／`更正報告`，≠`未執行`）過濾再取；
     抽法 `document.querySelectorAll('input[name=ORDAPNO]')` 依列序對應。
   - 開報告：`http://opdweb.vghb12.<machine>.gov.tw/QueryReport/OpdOrderReport.aspx?OrdApNo=<ORDAPNO>&hisnum=<chartno>&opid=A123456789`
     （參數名是 `opid` 不是 opsid；PFCODE 是 hidden 欄但 URL 不需帶）。
   - 報告每列 `<analyte>: <value> <ref>`，ref 形態**不統一**，parser 不可假設單一格式：
     - 性別分：`M<lo>-<hi>,F<lo>-<hi><unit>`（生化常加括號 `(M0-40,F0-32U/L)`，血液常無 `M14-18,F12-16g/dl`）→ `refLoM/refHiM/refLoF/refHiF`
     - 通用：`<lo>-<hi><unit>`（如 `80-96fl`、`(0-200mg/dl)`）→ `refLo/refHi`
     - 單邊：`<15%`、`>x`
     - 單位黏數字且可含 `X10^3`/`X10^6`/`^` → 別把單位裡的數字當界值
   - 空殼報告（未執行／無值）→ 無 ref，跳過。
4. 對映四維：machine（前綴/session）；時間=opdweb 報告時間**已西元** → `validFrom` 直接 ISO（免 ROC 轉換）；
   性別=報告分性別印→ `refLoM/refHiM/refLoF/refHiF`；年齡=**多數項目不印，但部分項目會印年齡帶**
   （已驗:BUN `<50years F:7.0-18.7,M:8.9-20.6;>50years F:9.8-20.1,M:8.4-25.7 mg/dL`，且年齡帶內再分性別）
   → **有印年齡帶就抓 `ageMin/ageMax`，沒印才預設不分年齡**（YC 2026-06-23 拍板：報告無年齡說明即
   age-agnostic；對齊 `TASK_BRIEF_ref_range_age_dim` zero-regression）。（opdweb 另印 `出生日期`，需精確年齡時可回推。）
5. **輸出提議（不直接寫）**，附報告原文行，等 YC 確認：

   ```
   ✅ <test_id> @ <machine> 報告日 <ROC>／西元 <ISO>
   報告原文：「<抓到的 ref 字串>」
   建議寫入 refHistory：
     { machine:'<m>', refLo:<lo>, refHi:<hi>, validFrom:'<ISO>',
       [ageMin/ageMax / refLoM…], source:'auto-crawl <chartno> <date>' }
   ```
6. YC 確認 → 交 Claude Code 落地。

**模式 B — 手動指定**：即既有 SOP C 觸發語（`<test_id> ref range 改成 <lo>/<hi>` 等），
性別/年齡 override 由 YC 對話補述。

**✅ 已驗（2026-06-23 @ vhyl／000012885I，原 ⚠️「印出與否／印在哪層」已解）：**
ernode lab_orders 列只印 `analyte: value`（無 ref）；完整 ref 在 **opdweb `OpdOrderReport.aspx`**
（見步驟 3 串接）。PSA(000023800G) 先前「只見數值 0.691」是因只看 ernode 列、沒進 opdweb，
非真的無 ref。格式不統一（性別分／通用／單邊；生化有括號、血液多無；單位含 `X10^n`）。
殘留待辦：`ORDAPNO → opdweb` 的**全自動串接**（免 YC 手貼 URL）待 Claude Code 落地時收尾。
過渡期 auto-crawl 一律「提議 + YC 確認」，不做無人值守寫入。

**全患者 harvest 實測補強（2026-06-23，000012885I 跑完 55 panel／70 analyte）：**
- **格式變體比想像多**，parser 要全收：性別分隔符 `,` 或 `;`（`M:30-200;F:29-168`）、`M`/`F` 後可有
  `:`、單邊可帶性別（`M:<45,F:<34`）、年齡帶（`<50years…;>50years…` 且帶內再分性別）。
- **opdweb 併發會炸**：一次 10 個 request → log 檔鎖住，~1/3 回 `IOException` 錯誤頁。**必須序列 + 節流 + 失敗重試**（序列跑 55 張 = 0 error）。
- **label off-by-one**：少數舊報告版面少一行 → ref 會掛到前一個 label（如 Hct/Hgb 互染）。最新報告(current)準，歷史 variant 需人工複核；header 行（`NORMAL RANGE`/`Non-Reactive`/`Patient`=PT）會被誤抓成 analyte，落地前過濾。
- 一次 harvest 產物範例：`vhyl_ref_harvest_000012885I_2026-06-23.csv`（workspace root，僅 ref 不含病人值）。

**source 命名：** auto-crawl=`'auto-crawl <chartno> <抓取日 YYYY-MM-DD>'`；手動沿用 SOP C。

**「完整報告」/「原始報告」取閱捷徑（established 2026-06-23）：** YC 明講「完整報告」或
「原始報告」→ Claude 走步驟 3 的 `ORDAPNO → opdweb OpdOrderReport.aspx` 機制，回報告原文
（含檢查值與 ref 字串）。**純取閱**：YC 有時為看檢查值、有時為解讀 ref，故**不**自動產
refHistory 提議；要落 ref 再用 `<chartno> <test> ref` / `ref-scan`。chartno/order 取對話
context，不明確 → 規則 #12 先問。

**模式 C — 時間維重掃（time-dim rescan，established 2026-06-24）**

單筆 / 整張 auto-crawl 只看「最新報告」→ validFrom 會誤標成「抓取日」，且比抓取日早的
ref 變體被當外送雜訊丟掉 → 早期檢驗值配不到該機器筆、掉回 `*` universal 顯示錯 ref。
時間維重掃修正這個系統性瑕疵：**讓每筆 refHistory 的 validFrom 反映該 ref 版本真正生效日**。

觸發語：`<vhyl|vhtt> refHistory 時間維重做`，或 YC 指示「依（掃到的）報告更新 valid date」。

步驟：

1. 對每個 in-scope test，掃 **cohort 所有 id × 所有歷史報告**：ernode `get_lab_orders`
   翻頁（`&offset=N`，N 為**列**基準、每頁 20；濾 執行單位=`檢驗` + 狀態含「報告」取
   resulted lab ORDAPNO）→ opdweb `OpdOrderReport.aspx` 取每筆「**報告時間**（西元，免 ROC 轉換）」
   + analyte ref 字串（ref-anchored parser：抓 ref 行往回跳 value/unit 找 analyte）。
2. 聚合 `analyte → ref字串（正規化空白/大小寫）→ [報告日]`，取每個 ref 版本的**最早報告日**。
3. 建時間版本 refHistory：**最舊版 `validFrom='1900-01-01'`**（migration base，真正起始未知）；
   後續版本 `validFrom = 該版本最早觀測日`（保守；掃越多病人越早收斂到真改版日）。性別/年齡 inline 照舊。
4. **時間版本 vs 真外送他院**：時間版本 = 某日後全院換新 ref（乾淨日期邊界、跨病人一致）→ 落該機器；
   外送 = 散落單筆、ref 格式異（如新南海）→ **不落**。

關鍵事實（為何不必窮舉全 cohort 也能定版本邊界）：**玉里 ref 是 lab 全店改**（版本邊界全域，
非逐病人）→ 少數長歷史病人即可定出版本邊界；多掃病人主要是**收斂「新版最早日」**+ 補單一病人
未測到的 analyte。實證（2026-06-24，012885I+166569G+114403C）：全店改版 **舊末見 2025-04-21 /
新首見 2025-06-24**；GOT 另在 2026-03-13 再改一次。

parser 雜訊（落地前過濾 / 正規化）：off-by-one（如 MCV `80-96` 串到 Hct）、header 假 analyte
（`NORMAL RANGE` / `Patient`=PT / `Non-Reactive`）、單位大小寫（`mg/dL` vs `mg/dl` 非真改版）。
**inline 性別 mirror**：舊版若實際無性別、但該 entry 外層帶 `hiM/hiF`（如 BUN）→ 該筆要補
`refLoM/refHiM/refLoF/refHiF` 鏡像值 suppress 外層 fallback（同 vhtt BUN/GPT 既有作法）。

**報告版面有兩類，parser 要分流（2026-06-24 補強）：**
1. **生化/血液**（CBC、biochem panel）：`analyte / value / unit / (ref)` 相鄰 → ref-anchored walk-back 可解。
2. **單項免疫法 + 鐵代謝**（CEA/AFP/Ferritin/PSA/Fe/TIBC）：analyte 名在 **header**（`檢驗項目：<NAME>`），
   value 行常是 `RESULT:`，ref 在 `生物參考區間(REFERENCE RANGE):` / `NORMAL RANGE:` 後，或 inline
   `(<=5.0 ng/mL)`。walk-back 會抓到 `醫囑`/`NORMAL RANGE`/`RESULT` 假名 → **單項報告（`檢驗項目` 無逗號）
   改用 header 名 + 第一個括號/range ref**；多項鐵 panel（`Fe(YL),TIBC(YL)` 有逗號）才走 walk-back。
   isRef 要含 `<=`/`>=`；UNIT 表要含 `ug/dl`。**漏抓某 test 別急著判「沒做」→ 先確認是不是免疫法版面被跳過**
   （2026-06-24 教訓：首版誤判 TIBC/Fe/Ferritin/AFP/CEA「30 人全無」，實為版面未處理）。

Chrome 技法（已驗 2026-06-24）：opdweb 報告同源 `fetch` 一定包 `AbortController` timeout
（無 timeout 的 hung fetch 會凍 renderer / 撞 45s CDP）；ernode worklist 跨子網域用**親域 cookie**
（`domain=.vghb12.<machine>.gov.tw`）橋接到 opdweb tab；聚合存 opdweb `localStorage['REFAGG']`
可跨病人累積 + resumable（`cur_<chartno>` cursor）；序列 + 節流，一次 JS 約 15 份報告（時間預算 ~25-30s）。

歸屬：ref **資料**（refHistory 進 catalog.js）= **Cowork**（單檔；blast radius 小，即使動到 30+ 筆
仍是資料維護，不寫 parser code）。`npm run release` + 三 repo sync-patterns + push = **Claude Code**。

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
cons
ole.log('test ids in storage:', Object.keys(data[chartno] || {}));

// 3. 從 catalog 找該 entry 的 regex 並手動測一段 reportText
const cat = HOSPITAL_LAB_PATTERNS_CATALOG.find(e => e.id === '<testId>');
console.log('pattern:', cat?.pattern);
console.log('matches:', cat?.pattern.exec('<paste reportText line here>'));
```

依照命中與否,落到 SOP B(regex 修)或 SOP D(manifest 加)或 SOP A(catalog 沒這 testId,新增)。

---

## 10. Notion 同步機制(established 2026-05-12)

兩台機器(vhtt / vhyl)共用一份 Notion 儀表板當 cross-machine 入口。
**不取代** git 的 canonical 地位 — Notion 只記列表 + 狀態,不存 brief 內容。

### Page 結構

- **Parent**:`🏥 Hospital Lab (lab report system dev workspace)`
  - URL: https://www.notion.so/35e4b4642c998192ad28c7de47d1058f
- **主入口**:`🛠 開機 SOP (vhyl ↔ vhtt 共用)`(子頁)
  - URL: https://www.notion.so/35e4b4642c99817aa866c2925f3a1705
  - § 1.0 記錄「Cowork Project Instructions 每台手動 paste」約定 +
    兩台 paste 追蹤表(Cowork UI 不走 git,vhyl 改了 vhtt 要再貼一次)
  - § 1.3 內含「你在哪台機器 — 各自的 default」小表,標出 vhyl vs vhtt 的 mode + brief 類型差異
  - § 1 環境 sync PowerShell batch
  - § 2 內嵌 TASK_BRIEF Dashboard database
  - § 3 已 Done 歷史

### TASK_BRIEF Dashboard 欄位

| 欄位 | 型別 | 用途 |
|---|---|---|
| Brief | Title | 簡短描述 |
| Status | Select(Open / In-progress / Blocked / Done)| 進度 |
| Order | Number | 執行優先序,數字小先做 |
| Repo | Select(patterns / viewer / reporter / cross-repo)| 動哪個 |
| Effort | Select(15min / half-day / one-day / multi-day)| 預估工時 |
| Depends on | Text | 寫另一個 brief 的 Title,該 brief Done 前本條不能動 |
| Brief path | URL | 指到 GitHub 上的 .md |
| Done date | Date | Done 時填 |
| Notes | Text | 兩三句重點,不複製 brief 內文 |

### 同步時機

Claude 在以下時機**主動**寫 Notion(都在 git push 成功之後,push 失敗不動 Notion):

1. 新增 TASK_BRIEF 到 `docs/task-briefs/` → 加一列,Status=Open,設好 Order / Depends on
2. brief 改名為 `_done` → 該列 Status=Done,填 Done date
3. brief 順序改變(新 brief 應該插隊 / 既有 brief 有新依賴)→ 調整 Order 或 Depends on
4. brief 被退回(Done 後又發現要重做)→ Status 回 Open + Notes 加註

### 衝突偵測(Claude 加新 brief 前必做)

1. 列出新 brief 動的檔
2. 比對 Notion 內所有 Status=Open / In-progress 的 brief 動的檔(從 brief.md 讀)
3. 重疊 → flag 給使用者決定先後
4. 依賴關係(被依賴的必須先 Done)寫進 `Depends on` 欄

### 容錯

- Notion 寫入失敗 **不**擋 git push
- git push 已成功 + Notion 寫失敗 → Claude 必須在回應裡明示「Notion 沒更到」,讓使用者手動補
- Notion 寫成功 + git push 還沒做 → 不該發生(順序錯了),若意外發生 Claude 必須 rollback Notion 的 row 改回 Open 並通知使用者

### 容量考量

Dashboard 設計上只放未完成 + 近期 Done。半年以上的 Done brief 可從 dashboard 移到子頁「§ 3 已 Done 歷史」歸檔,維持表的可讀性。Claude 主動建議歸檔的時機:當 Open + Done 合計超過 30 列。

---

## 11. Behavior rules sources(established 2026-05-19)

Claude 行為規則分三塊,canonical source 都在 git,**不在 Notion**(避免多源 drift):

| 區塊 | 內容摘要 | Canonical 位置 |
|---|---|---|
| 強制規則 #1–#7 | workflow 守則(WORKLOG / push / brief 改名 / 跨 repo 副作用 / Notion 同步) | Cowork app UI + `docs/cowork-project-instructions.md`(canonical snapshot) |
| 思考規則 #8–#11 | Cowork mode 思考行為(暴露假設 + session 開始 git pull / brief 成功標準 + 測試清單 / 多步驟複述狀態 / 靜默失敗明示) | 同上(2026-05-19 加入) |
| Coding behavior contract A–C | 寫程式時的行為契約(外科修改 / 矛盾模式不混用 / 新增前讀 caller) | 三個 repo CLAUDE.md 各自一份(內容同步) |

### 篩選原則

來源:Forrest Chang 12-rule CLAUDE.md([blocktempo 2026-05-14](https://www.blocktempo.com/claude-code-12-rules-error-rate-3-percent-karpathy-agent/),Karpathy 4 + 補 8 共 12 條)。本專案**只挑出對應實際踩過坑的條目**,沒按原文 12 條全抄。

| 採用 | 原版條號 | 對應內容 | 落點 |
|---|---|---|---|
| ✓ | 1 | 編碼前先思考、暴露假設 | 思考規則 #8(擴成「先 git pull」) |
| ✓ | 3 | 外科手術式修改 | Coding contract A |
| ✓ | 4 | 先定義成功標準 | 思考規則 #9(套 TASK_BRIEF 結構) |
| ✓ | 7 | 矛盾模式不混用 | Coding contract B |
| ✓ | 8 | 新增程式碼前先讀 | Coding contract C |
| ✓ | 10 | 多步驟任務 checkpoint | 思考規則 #10 |
| ✓ | 12 | 靜默失敗明示 | 思考規則 #11(原強制規則 #7 已是子集,#11 是 generalize) |
| ✗ | 2 | 簡單優先 | 已被 TASK_BRIEF 結構隱含 |
| ✗ | 5 | AI vs deterministic code 分工 | 本專案無 runtime AI decision |
| ✗ | 6 | Token 預算上限 | 未踩坑,加了會多噪音 |
| ✗ | 9 | 測試編業務邏輯 | 目前測試多為 manual smoke,加之意義不大;待自動化測試成熟再評估 |
| ✗ | 11 | 一致性優先個人偏好 | 已被 Coding contract A 隱含 |

評估標準:**這條規則,在過去 8 週的 session log 內是否能對應到一次實際失敗 / 修正**。對應得到 → 採用;對應不到 → 不採。文章自己強調「6 條對症的規則 > 12 條其中 6 條用不上」(blocktempo 文末)。

### Notion 處理

Notion「🛠 開機 SOP」page **不放規則內文**,只在頁首 pointer 一行:「Behavior rules canonical: patterns/CLAUDE.md + cowork-project-instructions.md(git)」。理由:Notion 在本架構是狀態鏡像,把規則寫在 Notion 等於多一個 source,衝突時就 drift。

---

## 12. Session 切換 SOPs(established 2026-05-19)

> 解決 cross-session / cross-machine 切換時 Claude 沒有「最後狀態」可讀的問題。風格跟 § 9 / cowork-project-instructions Pattern-learning trigger 一致,用中文 trigger 觸發。

### Glossary(2026-05-19 addendum 3 加入)

| 詞 | 定義 |
|---|---|
| **session / thread / 對話** | 一個 Cowork 對話視窗。三詞**互通**(英文 session = Anthropic 慣例;thread = Slack 等慣例;對話 = 中文最直白) |
| **階段 / 段落 / phase** | 工作的一個 chunk。**一個 thread 可跑多個階段**(像今天 thread 跑了規則修訂 / brief 集中 / Session SOPs 三大階段);**一個階段也可橫跨多 thread**(reporter #4 可能 thread A 寫一半、thread B 接著寫) |
| **機器 / vhyl / vhtt** | 物理開發環境。跟 thread / 階段都無關,純硬體層 |

**判讀關鍵字**:
- 看到「**階段 / 段落 / 這段**」→ SOP G(thread 不關)
- 看到「**thread / session / 對話**」→ SOP J(thread 結束)
- 看到「**機器 / vhyl / vhtt / 換到**」→ SOP H
- 看到「**接續 / 繼續**」→ SOP I
- 都沒看到 → **含糊語**,Claude 必須問三選一(見下方)

### Trigger 對照表(明確語 — 直接觸發對應 SOP)

| Trigger | 對應 SOP | 何時用 |
|---|---|---|
| 「**告一段落**」/「**階段完成**」/「**這段先收**」/「先停一下」/「休息一下」 | SOP G — 段落收尾 | 工作 phase 結束,**thread 不關**,可同 thread 繼續、或之後接續 |
| 「離開 vhyl」/「離開 vhtt」/「換到 vhtt」/「換到 vhyl」/「換機器」 | SOP H — Leave machine | 要離開本台機器(關機 / 出門 / 換機器),可能跨機接續 |
| 「接續 vhtt」/「接續 vhyl」/「接續上次」/「繼續上次」 | SOP I — Resume | 新 thread 起點,接上次任意 thread 的狀態(同機或跨機)|
| 「**結束 thread**」/「**結束 session**」/「**結束對話**」/「**準備開新 thread**」/「準備開新 session」/「**這個對話收掉**」/「等等要重開對話」 | SOP J — End thread | **結束本對話 thread**,要開新 thread 接續(原因:thread 太長被汙染、或 Claude 已忘掉前期細節)|

### 含糊語 disambiguation(Claude 不直接動作,先問)

下列語意含糊的詞**不直接觸發任何 SOP**,Claude 必須先 disambiguate:

- 「結束」(光「結束」,沒接 thread / 階段 / 機器修飾)
- 「收工」
- 「下次再說」
- 「先這樣」/「就到這」

Claude 回應範本(必須三選一,不可自行揣測):

> 你的意思是哪一種?
> (a) 工作段落結束想休息,**本對話 thread 還會繼續** → SOP G
> (b) 要**結束本對話 thread**、之後開新 thread 接續 → SOP G + SOP J
> (c) 要**離開本台機器** → SOP H

理由:這類口語沒指明「階段 / thread / 機器」哪一層,猜錯成本大。寧可多問一次,不要 silent drift。對應思考規則 #12「混淆時詢問」catch-all。



### SOP G — Wrap(階段完成)

Claude 動作清單:
1. 三 repo `git status -s` 看本 session 改了哪些檔
2. 確認該改 `_done` 的 brief 都改了(rule #6)
3. 三 repo `WORKLOG.md` 各有新條目(rule #2;繁中)
4. 不需要的本機檔清理(`.tmp.*` / 半寫的 draft brief / sandbox 殘留)
5. 給 git add / commit / push 指令(由 YC 執行;rule #3 不自動 push)
6. push 完同步 Notion(Dashboard 列 Done 改 Done、新 brief 加列、Order 調整)— rule #7
   - **特別檢查**:若本 session 改動了 `docs/cowork-project-instructions.md`(canonical 變了)→ 把 § 1.0「兩台 paste 追蹤」表**兩格**都重置為 ⏳(本機自己貼 UI 動作沒做的話也算 ⏳)。本機若已在 session 內手動貼過,只把對方那一格改 ⏳。
7. **寫 session snapshot**:
   - 若 `docs/session-state-<本機>.md` 已存在,先 `cp` 到 `docs/session-state-archive/<YYYY-MM-DDTHHMM>-<本機>.md`
   - 把新 snapshot overwrite 寫到 `docs/session-state-<本機>.md`
   - 內容結構見下方「Session snapshot 檔結構」

### SOP H — Leave machine(離開 vhyl / 離開 vhtt)

1. 全部 SOP G 跑完
2. 盤點未完成工作:Notion Dashboard Open / In-progress 列 + 本 session 半寫的 draft
3. **若有未完成工作 → 產生 hand-off brief**:`TASK_BRIEF_handoff_<本機>_to_<對方>_<date>.md`(rule #6 / § 1.5)
4. session snapshot 第 2 區「本 session 未完」明列「對方接手時要先讀的 3 件事 + 我留在本機本地的待清項」

### SOP I — Resume(接續 vhtt / 接續 vhyl / 接續上次)

0. **Pre-flight check — Cowork Project Instructions paste 對齊**(2026-05-19 加入):
   - 讀 Notion「🛠 開機 SOP」§ 1.0「兩台 paste 追蹤」表,看本機(由 YC 訊息 / session-state 推斷的當前機器)那一格
   - 若狀態為 ⏳ → **停下來 block 後續步驟**,提示 YC:
     > 「本機 Cowork app UI 的 Project Instructions 跟 git canonical(`docs/cowork-project-instructions.md`)未對齊(§ 1.0 表顯示 ⏳)。請打開 Cowork → Project Instructions → 把舊內容清空、從 canonical 的 code block 複製貼上、覆蓋。貼完跟我說『貼好了』,我把 § 1.0 那格改成 ✅ + 填今天日期再繼續 SOP I。」
   - 若狀態為 ✅ → 直接進 Step 1
   - **理由**:cross-machine 切換時,上機若改動 cowork-project-instructions.md,本機 Cowork app UI 上跑的 Project Instructions 仍是舊版,Claude 會用舊規則做事 → silent drift。Pre-flight 強制對齊。
1. 給 § 1.1 環境 sync PowerShell batch(三 repo git pull)
2. 等 YC 跑完 → 讀對應 snapshot:
   - 「接續 vhtt」(在 vhyl 接 vhtt)→ `docs/session-state-vhtt.md`
   - 「接續 vhyl」(在 vhtt 接 vhyl)→ `docs/session-state-vhyl.md`
   - 「接續上次」(同機接同機)→ `docs/session-state-<本機>.md`
3. 讀 Notion Dashboard(Open / 最新 Done)
4. 讀對方最新 `WORKLOG.md` 條目(三 repo)
5. 若有 `TASK_BRIEF_handoff_<對方>_to_<本機>_*` → 列出未 _done 的
6. 把以上整理成「上一階段做了什麼、現在該做什麼」清單給 YC 確認

### SOP J — End thread(結束本對話 thread)

1. 全部 SOP G 跑完
2. 給 YC **新 session 的開場句範例**,例如:
   > 「接續 2026-05-19 vhyl 規則修訂後的狀態。請讀 `patterns/docs/session-state-vhyl.md` 跟 Notion 開機 SOP 後告訴我接下來該做什麼。」
3. Claude **主動提醒** SOP J 觸發時機:
   - context 已逼近 session 上限
   - 同一個問題 YC 重述 ≥ 2 次(暗示我已失憶)
   - 一段工作的決策 / 規則修改完成(自然斷點)

### Session snapshot 檔結構

每個 `session-state-<machine>.md` 固定 5 區:

```markdown
# Session state — <machine>

**Last wrap**: <YYYY-MM-DD HH:MM>
**Last session type**: Cowork | Claude Code
**Last action**: <一行摘要>

## 1. 本 session 完成
## 2. 本 session 未完
## 3. 下次該先做什麼
## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)
## 5. Parked questions
```

### 容量考量

- `docs/session-state-archive/` 累積快(每 wrap 一個檔)。Claude wrap 時順便檢查 size,**超過 50 檔或最舊超過 90 天主動建議歸檔**(打包成 `session-state-archive-<YYYY-Qn>.tar.gz` 移到 patterns repo 之外,或刪)
- archive 子夾**不**加 .gitignore(會失去跨機追溯)

---

## 13. Cowork ↔ Chat mode handoff(established 2026-05-19)

> Cowork(本 app)有檔案系統 + git + Notion 直連;Chat mode(claude.ai web)**無**檔案系統。兩邊 state 無法自動同步,只能人工搬運。

### Cowork → Chat

需要時:Cowork 寫一份純粹想法、無 code、無 file path 的 `thinking-digest-<date>.md`(放 `patterns/docs/` 或 ad-hoc 位置),YC 人工複製內容貼到 Chat。

### Chat → Cowork

YC 在 Chat 結束時請 Chat 產生純文字 summary,人工貼回 Cowork。Cowork 收到後可選擇:
- 直接吸收進當前 brief / 對話
- 存成 `chat-import-<date>.md` 留紀錄(若內容值得保留)

### 不做的事

- 不嘗試讓 Chat「自動」寫檔(它做不到)
- 不把 Chat conversation 當 source of truth — 任何結論要落到 git / Notion 才算數


