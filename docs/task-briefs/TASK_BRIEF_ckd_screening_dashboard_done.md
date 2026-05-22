# TASK_BRIEF: Viewer — CKD/DM 收案篩檢 Dashboard

> **方向**：vhtt 提出 + 執行
> **產出 session**：vhtt Cowork session, 2026-05-21
> **前置條件**：`TASK_BRIEF_ckd_egfr_staging` 已完成（eGFR / staging dispatcher 已上線）
>
> **執行完畢後請改名為 `TASK_BRIEF_ckd_screening_dashboard_done.md`**（rule #6）

---

## Problem

目前 CKD/DM 收案追蹤靠手動維護 Excel（`0519DM+CKD追蹤日期.xlsx`），欄位包含：

- 病歷號、姓名
- 最近抽血報告日期、UACR 報告日期
- 心電圖 / PVR / ABI / 眼底鏡 各項檢查日期
- DM 衛教（此次問題 / 衛教項目）
- Early-CKD 收案判定（符合 CKD stage X / 不符合）
- Pre-ESRD 收案判定（符合 CKD stage 3B / 不符合）

問題：人工查 ernode → 填 Excel → 判斷收案資格，費時且易漏。

**目標**：在 hospital-lab-viewer Chrome extension 新增「篩檢 Dashboard」view + 個案管理 registry，自動化整個流程。

---

## 設計總覽

> **2026-05-22 修訂(scope 收斂)**:S3 改為 **read-only 篩檢**(只標示「可收案 / 已有衛教紀錄」),**不**做 individual 加入 registry / 批次加入 / Tab 1 收案按鈕。原因:跨 repo(viewer chrome-extension:// ↔ reporter file://)共享 registry DB 技術路線未決,YC 決定先 ship 唯讀版本。Registry 寫入 + DM/CKD/Pre-ESRD stage 引擎 + 收案按鈕 parked 到下一個 brief。詳見章末 § Follow-up。

### Tab 架構

Viewer popup 分為兩個 tab：

| Tab | 用途 | 使用情境 |
|---|---|---|
| **Tab 1：報告**（現有） | 單人查詢 + 詳細報告 + 列印 | 衛教、個案管理（Mode 2） |
| **Tab 2：篩檢 Dashboard**（新） | 批次表格 + 篩選 + 批次操作 | 門診候診清單（Mode 1）、多人追蹤（Mode 3） |

### Dashboard 三種輸入來源

1. **候診清單** — content script 自動讀取 opdweb
2. **手動貼入** — textarea，1 筆或多筆皆可
3. **個案管理名單** — IndexedDB 持久化清單（取代 Excel）

### Dashboard 顯示欄位

```
病歷號 | 姓名 | 最近抽血 | UACR | EKG | ABI | PVR | 眼底鏡 |
DM衛教 | Sugar | HbA1c | eGFR | GFR分期 | Early-CKD | Pre-ESRD | ⚡動作
```

每個檢查日期欄顯示規則：
- **有報告** → `114/11/07（8個月前）`
- **未執行** → `⚠️ 115/04/24 已開未做`（橘色警示），上上次用簽收時間
- **無資料** → 灰色「—」

DM 衛教欄：顯示最近兩次的日期 + 此次問題 + 衛教項目（需 sub-page fetch）。

### 相對時間格式

```
≤ 30 天  → 「N 天前」
31–90 天 → 「N 週前」
> 90 天  → 「N 個月前」
```

超過 180 天加橘色警示、超過 365 天紅色警示。

### 收案判定邏輯

已有 `EarlyCKD` computed function（`patterns/computed.js`）：
- `P1早期`（eGFR ≥ 45）→ Early-CKD 可收案 ✅
- `P2中晚期`（eGFR < 45）→ Pre-ESRD 可收案 ✅

### 動作按鈕

**Tab 2 Dashboard 每列：**
- 「加入個案管理」— 符合 Early-CKD / Pre-ESRD / DM 才亮
- 「報告」— 跳到 Tab 1 看詳細

**Tab 2 Dashboard 全域：**
- 「全部列印」— 生成 printable HTML
- 「匯出 CSV」
- 「批次加入」— 把所有符合條件者一次加入個案管理

**Tab 1 報告（符合收案條件時）：**
- 「加入個案管理」
- 「列印 + 加入」

---

## Phase 0 — ernode 探索 ✅ DONE (2026-05-21)

### 0.1 確認 ernode 回傳範圍

實測結果：**(a) `get_lab_orders` 包含這些檢查**。

測試病人：76708I（225 orders, 12 pages 全掃）、125509A（60 orders）、122426G（24 orders）

| 檢查項目 | ernode order name | 執行單位 | 備註 |
|---|---|---|---|
| 眼底鏡 | `Fundoscopy(眼底鏡檢查)` | META | 76708I 有 6 筆、125509A 有 1 筆 |
| 心電圖 | `E.K.G.(TT)` | ER | 125509A 有 1 筆 |
| ABI/PVR | `Doppling ex. and pressure recodring` | ER | 125509A 有 1 筆（原文 typo "recodring"）；**vhyl 為兩筆分開** |

其他發現：
- 放射線 orders 也在（如 `Bil Knee AP+LAT+Tangential 6張 (TT)`，unit: 放射線）
- `DM EDUCATION`（unit: META）每次門診都有
- 122426G（24 筆）全是檢驗，沒做過上述檢查
- DM Education 子頁面 URL pattern: `opdweb/QueryReport/OpdOrderReport.aspx?OrdApNo={ordapno}&hisnum={chartno}&opid={opsid}`
- 子頁面含 `出生日期` 欄位 → 可解決 eGFR birthDate 問題

---

## S1 — Catalog Patterns + Viewer Sync（Claude Code session 1）

> **目標**：加入 EKG / ABI / PVR / Fundus 四個檢查 pattern，讓現有 viewer 單人模式能 match 到這些 orders。
> **預計工時**：1–2 小時
> **驗證方式**：用 125509A 在 viewer 單人模式查詢，確認出現 EKG / ABI / Fundus match。

### S1.1 patterns repo — `catalog.js` 新增 entries

在 `CATALOG` array 加入（放在尾端，現有 entries 之後）：

```js
{ id: 'EKG',    displayName: '心電圖',
  pattern: /E\.K\.G\.|心電圖|EKG|ECG/i,
  category: '檢查',
  unit: '', ref: '', lo: null, hi: null },

{ id: 'ABI',    displayName: 'ABI',
  pattern: /\bABI\b|Doppling ex\./i,
  category: '檢查',
  unit: '', ref: '', lo: null, hi: null },

{ id: 'PVR',    displayName: 'PVR',
  pattern: /\bPVR\b|Doppling ex\./i,
  category: '檢查',
  unit: '', ref: '', lo: null, hi: null },

{ id: 'Fundus', displayName: '眼底鏡',
  pattern: /Fundoscopy|眼底鏡/i,
  category: '檢查',
  unit: '', ref: '', lo: null, hi: null },
```

**設計決策 — ABI / PVR 分開**：
- vhtt 的合併 order（`Doppling ex. and pressure recodring`）會同時 match ABI 和 PVR → 兩欄顯示同日期，語義正確。
- vhyl 分開的 ABI / PVR orders 各自 match 各自的欄。
- `\b` word boundary 確保不會誤 match 其他 order name 裡的子字串。

### S1.2 patterns repo — `npm run release`

跑 `npm run release`，確認 `dist/patterns.json` 包含新 entries。

### S1.3 viewer repo — `node sync-patterns.js`

同步新 patterns 到 viewer。確認 viewer `dist/patterns.json` 更新。

### S1.4 viewer manifest 確認

新的「檢查」category 不需要加入 viewer 的 lab manifest（manifest 只管 reporter 的 HTML 表格欄位）。但需確認 `report.js` 的 pattern matching 不會因為新 category 出錯。

### S1.5 驗證

1. 用 viewer 查 125509A → 確認 lab orders 列表中 EKG、ABI/PVR、Fundus 有被 match
2. 用 viewer 查 76708I → 確認 Fundus 多筆被 match
3. 用 viewer 查 80885F（dialysis）→ 確認現有報告不受影響（regression）

### S1.6 Commit + Push

- patterns repo: commit `feat: add EKG/ABI/PVR/Fundus examination patterns`
- viewer repo: commit `chore: sync-patterns (add examination patterns)`
- WORKLOG.md 各記一筆

### S1 測試清單

1. ✅ `dist/patterns.json` 包含 EKG / ABI / PVR / Fundus 四個 entry
2. ✅ 125509A 的 `E.K.G.(TT)` order 被 EKG pattern match
3. ✅ 125509A 的 `Doppling ex. and pressure recodring` 被 ABI 和 PVR 同時 match
4. ✅ 76708I 的 `Fundoscopy(眼底鏡檢查)` 被 Fundus pattern match
5. ✅ 80885F dialysis 報告 regression — 無新增意外欄位
6. ✅ WORKLOG 更新

---

## S2 — Dashboard UI + 個案管理 Registry（Claude Code session 2）

> **目標**：新增 Tab 2 篩檢 Dashboard（tab 切換 + 3 種輸入 + batch fetch + 表格 + 排序/篩選 + 未執行顯示 + DM 衛教子頁面 + 個案管理 registry）
> **預計工時**：6–8 小時（可能拆兩個 Claude Code context）
> **前置條件**：S1 完成

### S2.1 popup.html — Tab 切換 UI

在 popup 頂部加 tab bar：

```html
<div id="tab-bar">
  <button data-tab="report" class="active">報告</button>
  <button data-tab="dashboard">篩檢 Dashboard</button>
</div>
<div id="tab-report"><!-- 現有內容 --></div>
<div id="tab-dashboard" style="display:none"><!-- 新內容 --></div>
```

切換時 show/hide 對應的 div。現有功能全部包在 `#tab-report` 裡，零改動。

### S2.2 Dashboard 輸入區

三個輸入按鈕 + 共用的 textarea：

```
[候診清單] [手動輸入] [個案管理名單]
┌─────────────────────────────┐
│ （textarea: 一行一個病歷號）  │
└─────────────────────────────┘
[開始篩檢]  進度: ██████░░░░ 5/12
```

- 「候診清單」按鈕：呼叫 content script 讀 opdweb 候診清單，填入 textarea
- 「手動輸入」：textarea 直接編輯
- 「個案管理名單」：從 IndexedDB registry 讀取已收案清單，填入 textarea

### S2.3 Batch fetch + pattern match + compute

對 textarea 裡每個 chartno：

1. `fetchAllOrders(chartno)` — reuse 現有 function（含 incremental cache）
2. Pattern match — 找 EKG / ABI / PVR / Fundus / UACR / Sugar / HbA1c / CREAT 最新日期 + 值
3. Compute eGFR / GFRStage / EarlyCKD — reuse `computeDerivedValues`
4. 找「未執行」orders — `status === '未執行'` 的最新一筆，記錄 orderDate（生效時間）

並行 fetch，concurrency ≤ 3（不打爆 ernode）。Progress bar 顯示。

### S2.4 DM Education 子頁面 fetch

對每位病人，找最近 2 筆 `DM EDUCATION` order（orderName match `/DM EDUCATION/i`）：

1. 用 `buildSubpageUrl(ordapno, chartno)` 構造子頁面 URL
2. `fetchSubpageText(url)` 取得頁面文字（reuse 現有 function + IndexedDB cache）
3. 從文字中 regex 擷取：
   ```js
   const issue = text.match(/此次問題：\s*([\s\S]*?)(?=衛教項目：)/)?.[1]?.trim() || '';
   const edu   = text.match(/衛教項目：\s*([\s\S]*?)(?=┌|$)/)?.[1]?.trim() || '';
   ```
4. Dashboard 欄位顯示：
   - 上次：`114/11/07 — 此次問題: xxx / 衛教: yyy`
   - 上上次：`114/08/15 — 此次問題: xxx / 衛教: yyy`

**Bonus**：子頁面含 `出生日期：YYYYMMDD`，可用來升級 eGFR 為 per-date 精確年齡計算。

### S2.5 「未執行」顯示邏輯

在 Dashboard 表格的每個檢查欄位：

```
if (最新 order status === '未執行') {
  顯示: ⚠️ {orderDate} 已開未做     ← 橘色
  上上次: {receiveDate}              ← 正常色
} else {
  顯示: {orderDate}（N天/週/月前）   ← 正常色
}
```

### S2.6 Dashboard table 渲染

表格 columns 如設計總覽。功能：
- **排序**：點 header 依該欄排序（預設依病歷號）
- **篩選**：「只看可收案」checkbox（Early-CKD 或 Pre-ESRD 任一為 ✅ 才顯示）
- **顏色**：
  - 檢查日期 > 180 天 → 橘底；> 365 天 → 紅底
  - Early-CKD 可收案 → 綠底
  - Pre-ESRD 可收案 → 藍底
  - 異常 lab 值 → 紅字（沿用現有 alarm 邏輯）
- **點擊病歷號** → 切到 Tab 1 顯示該病人完整報告

### S2.7 個案管理 Registry（IndexedDB）

新增 IndexedDB object store `registry`：

```js
schema: {
  keyPath: 'chartno',
  fields: {
    chartno: String,       // e.g. '000080885F'
    name: String,          // 病人姓名
    enrollDate: String,    // 加入日期 (ISO)
    category: String,      // 'Early-CKD' | 'Pre-ESRD' | 'DM'
    lastScreenDate: String, // 最後篩檢日期
    notes: String          // 備註
  }
}
```

**「加入個案管理」按鈕**：
- Tab 2 每列：符合 Early-CKD / Pre-ESRD / DM 才亮，點擊寫入 registry
- Tab 2 全域「批次加入」：所有符合條件者一次寫入
- Tab 1 報告頁：符合條件時顯示「加入個案管理」和「列印 + 加入」

**「個案管理名單」輸入源**：
- 點 Tab 2 的「個案管理名單」按鈕 → 從 registry 讀出所有 chartno → 填入 textarea → 自動開始 batch fetch

### S2.8 Dashboard 獨立視窗 ← 確定

Dashboard 用 `chrome.windows.create({ type: 'popup', width: 1200, height: 800 })` 開獨立視窗。

Tab 1（報告）留在 popup，Tab 2（篩檢 Dashboard）按鈕點擊後開獨立視窗。
和 reporter 的操作模式一致。

### S2.9 DM 衛教顯示規格

**螢幕顯示**（Dashboard 表格內）：
- Truncate：固定欄寬，`上次 115/04 血糖控制不佳/飲食...` 溢出用 `…`
- 上次 + 前次各一行，共兩行
- Hover 或 click → tooltip 展開完整內容（日期 + 此次問題全文 + 衛教項目全文）

**列印時**：DM 衛教欄完整展開，不 truncate，顯示最近兩次的完整此次問題 + 衛教項目。

**DM 判定**：有 `DM EDUCATION` order（orderName match `/DM EDUCATION/i`）即判定為 DM。

### S2.10 Sub-page fetch 模式

全抓模式：每位病人取最近 2 筆 DM EDUCATION order 的子頁面。
依賴現有 IndexedDB cache（`enrichCacheGet/Put` by ordapno），首次慢、後續秒回。
不做 lazy fetch（不等 hover 才抓）。

### S2 測試清單

1. ✅ Tab 切換：Tab 1 / Tab 2 互切，Tab 1 現有功能不受影響
2. ✅ 候診清單讀取：從 opdweb 讀入 → Dashboard 顯示
3. ✅ 手動輸入：textarea 貼入 3 個以上病歷號 → 逐人 fetch + 顯示
4. ✅ eGFR + 收案判定：80885F → P1早期 ✅；eGFR < 45 病人 → P2中晚期 ✅
5. ✅ Lab 數值：Sugar / HbA1c / eGFR 正確，異常值紅字
6. ✅ 檢查日期：EKG / ABI / PVR / Fundus 日期正確
7. ✅ 未執行：status「未執行」→ 顯示「⚠️ 已開未做」+ 生效時間
8. ✅ DM 衛教：最近兩次的此次問題 + 衛教項目
9. ✅ 相對時間：≤30 天「N 天前」、31–90「N 週前」、>90「N 個月前」
10. ✅ 排序 / 篩選：依各欄排序、「只看可收案」篩選
11. ✅ 個案管理 registry：加入 / 讀取 / 名單輸入源
12. ✅ Dialysis regression：現有 viewer 單人報告不受影響
13. ✅ WORKLOG 更新

---

## S3 — Dashboard 三欄資格標示 + CSV / 批次列印 收尾（Claude Code session 3,2026-05-22 重寫）✅ DONE（2026-05-22, vhtt Claude Code）

> **目標**:Dashboard 改成 DM 衛教 + DM 天數 + Early CKD + Pre-ESRD 四欄並排;完成 CSV export 與批次列印;**不做** registry write 與 stage 引擎(parked,見章末 § Follow-up)
> **預計工時**:3–4 小時
> **前置條件**:S2 完成
> **執行模式**:Cowork 寫 brief(2026-05-22 已完成本段重寫)→ Claude Code 從 workspace root 一輪做 viewer 改動 + brief 改名 `_done`

### S3.0 Dashboard 欄位調整(取代 S2 既有 Early-CKD / Pre-ESRD 單欄)

新四欄並排順序:

```
| ... | DM 衛教內容 | DM 天數 | Early CKD | Pre-ESRD |
```

| 欄 | 顯示 | 判定 |
|---|---|---|
| **DM 衛教內容**(S2 既有,**拆 truncate+tooltip**) | 表格內**直接完整顯示**最近兩次有內容的紀錄(`114/11/07 — 此次問題: xxx / 衛教: yyy` + 換行 + 上上次同格式);無有效紀錄 → 「—」 | S2 已抓的 DM EDUCATION 子頁面陣列,往前最多看 5 筆,跳過 regex 抓不到內容的,取最近 2 筆有內容的;5 筆都沒內容也停 |
| **DM 天數**(新欄) | `287 天`(整數固定格式);>180 天橘字;>365 天紅字;DM 衛教內容欄為空 → 灰底「—」 | 與 DM 衛教內容欄連動:最近那筆**有內容**的紀錄 order date 到今天的天數 |
| **Early CKD** | ✅ / ❌ | `patterns/computed.js` 既有 `EarlyCKD` → `P1早期`(eGFR ≥ 45) |
| **Pre-ESRD** | ✅ / ❌ | 同上 → `P2中晚期`(eGFR < 45) — **本輪不收緊到 <30,parked** |

**S2 既有 DM 衛教欄 CSS 改動**:拆掉 `.clip2` 或類似 truncate + tooltip 設計,改為表格 cell 內直接完整顯示兩行內容。`line-height` / `padding` 視覺調整以容納。列印規則 S2 已實作,本輪不再動。

**「有內容」判定**:DM EDUCATION 子頁面 regex 抓到 `此次問題` **或** `衛教項目` 任一非空字串即算有效。兩個都抓不到 → 該筆視為空,跳過。

### S3.1 Dashboard CSV export

「匯出 CSV」按鈕生成 CSV,欄位對應 Dashboard 所有列。

- **編碼**:UTF-8 with BOM(中文 Excel 不亂碼)
- 日期:民國日期(`114/11/07`),相對時間不含
- DM 天數:整數(`287`),無有效紀錄 → 空字串
- DM 衛教:最近一次的「此次問題」與「衛教項目」各一欄
- Early CKD / Pre-ESRD:`Y` / `N`
- 未執行:標 `已開未做`

### S3.2 批次列印

「全部列印」按鈕:生成 printable HTML(開新 window):

- 表格標題:「CKD/DM 收案篩檢 — {YYYY-MM-DD}」
- **列印範圍**:當下 Dashboard **篩選後可見列**(例如「只看可收案」勾選時只列印符合的)
- A4 橫印適合的欄寬壓縮
- DM 衛教欄完整展開(S2 列印規則已實作,沿用)

### S3.3 收尾

- 全量 regression(S1 + S2 測試清單重跑,焦點:S2 既有 DM 衛教欄 CSS 改動不破壞列印與 tab 切換)
- patterns + viewer `WORKLOG.md` 更新
- TASK_BRIEF 改名 `_done.md`(rule #6,最後一個 commit 一起做掉)
- Notion Dashboard row Status=Done + Done date

### S3 測試清單

1. ✅ DM 衛教內容欄:表格內直接完整顯示最近兩次有內容紀錄;無 tooltip 行為;無有效紀錄顯示「—」
2. ✅ DM 天數欄:與衛教內容欄連動,有內容才顯示「N 天」;>180 橘、>365 紅;無有效內容顯示「—」
3. ✅ 「有內容」判定:DM EDUCATION order 存在但子頁面 regex 抓不到 → 跳過繼續往前;最多看 5 筆
4. ✅ Early CKD / Pre-ESRD 欄:依 `EarlyCKD` computed 顯示 ✅/❌(P1早期 / P2中晚期 對應)
5. ✅ CSV export:UTF-8 BOM、四新欄入欄、日期格式正確、Excel 開啟中文不亂碼
6. ✅ 批次列印:A4 橫印、DM 衛教欄完整、**篩選後可見列**才列印(不是全部)
7. ✅ Dialysis regression:viewer 單人報告(Tab 1)不受影響
8. ✅ S2 既有功能 regression:候診清單讀取、手動輸入、batch fetch、排序篩選都正常
9. ✅ patterns + viewer WORKLOG 更新

**驗收註記（2026-05-22, vhtt Claude Code）**：邏輯項以 `node --check` + vm-load node harness（26/26 PASS）驗證 — #1 DM 衛教內容完整顯示無 tooltip、#2 DM 天數 180/365 門檻連動、#3 往前 5 筆跳過無內容取最近 2 筆、#4 Early/Pre ✅/❌、#5 CSV BOM+escaping+csvExam「已開未做」。實機項 ⏳ 待 YC 在 vhtt（院內網 + OPSID）跑：#6 批次列印 A4 橫印預覽、#7 Tab 1 dialysis 報告 regression、#8 S2 候診/手動/batch/排序篩選 regression（程式碼層未動 popup/report，理論不受影響）。
**Scope 決定**：S2 已 ship 的 registry 寫入 UI（批次加入 / 每列加入個案管理 / 個案名單）依本節「保留但不接 UI」+ read-only 拆除 dashboard 端 glue；lab-core.js 的 registry store + registryPut/Get/List/Remove 保留不動，待 § Follow-up #1 跨 repo DB 解後重接。

### S3 不做的事(明示,避免 Claude Code 自我擴張)

- **不寫**個案管理 registry:S2 IndexedDB `registry` store(DB_VER 5)**保留但不接 UI**;WORKLOG 註「跨 repo DB 解後再啟用」
- **不加**Tab 1「加入個案管理」/「列印 + 加入」按鈕
- **不加**Tab 2 每列「加入個案管理」按鈕、不加全域「批次加入」按鈕
- **不實作** DM stage 引擎(1-1 → 2-2 → 2-3 → 2-4 → 3-5 + 84 天 + 365 天 4 次上限 + 申報代碼 P1407/P1408/P1409)
- **不實作** Early CKD / Pre-ESRD stage 引擎
- **不改** patterns `EarlyCKD` computed(Pre-ESRD 門檻 eGFR<45 沿用,不收緊到 <30)
- **不做**糖網標示

---

## 風險 / 注意

- ~~**Phase 0 是 blocker**~~：✅ 已解除。ernode `get_lab_orders` 確認回傳 EKG（unit:ER）、ABI/PVR（unit:ER）、眼底鏡（unit:META）。
- **ABI/PVR 跨院差異**：vhtt 合併 order（`Doppling ex.`）、vhyl 分開。Pattern 已設計為兩個 id 各自 match，但需在 vhyl 實測確認 order name。
- **Batch fetch 效能**：20+ 人同時 fetch，首次可能慢（每人 1–3 秒）。需 progress bar + concurrency ≤ 3。
- **DM Education 子頁面 fetch 量**：每人可能有 10+ 筆 DM EDUCATION，但只需最近 2 筆的子頁面。要限制 fetch 數量。
- **Viewer popup 大小**：Dashboard 建議用 `chrome.windows.create` 開獨立視窗。
- **跨 repo 影響**：S1 加 catalog patterns → viewer `sync-patterns` 要重跑。Reporter 不受影響（新 pattern category 不在 reporter manifest 裡）。
- **命名**：新 pattern category 叫「檢查」。
- **birthDate 升級**：DM Education 子頁面含出生日期，可在 S2 順便解決 eGFR 的 age 精確度問題。非必做，可列為 bonus。

---

## 預計工時

- ~~Phase 0~~:✅ 已完成
- ~~**S1**~~:✅ 已完成(2026-05-21 vhtt,catalog patterns + sync + 驗證)
- ~~**S2**~~:✅ 已完成(2026-05-21 vhtt,Dashboard UI + batch + DM 衛教 + registry IndexedDB)
- **S3**(2026-05-22 重寫):3–4 小時(三欄資格 + DM 天數新欄 + DM 衛教欄 CSS 改 + CSV + 批次列印 + 收尾)

S3 為 read-only;registry write / stage 引擎 / 收案按鈕 等功能 parked 至下一個 brief(見 § Follow-up)。

---

## Follow-up(下一個 brief,scope 明示 parked)

本 brief S3 ship 完後,以下功能 parked 等下一個 brief 處理:

1. **跨 repo 共享 registry DB**(blocker for 2–5):viewer(`chrome-extension://`)與 reporter(`file://`)共用 DM / Early CKD / Pre-ESRD 個案資料庫。IndexedDB / localStorage / chrome.storage 都 per-origin 跨不過,技術路線待 YC 拍板:
   - (a) 中央 DM registry API(健保署 / 院內 HIS)
   - (b) 本地 JSON 檔(patterns repo 同步 + `chrome.downloads` 寫回)
   - (c) 雲端後端(Supabase / Firebase / 院內 PostgreSQL)
   - (d) 個管師人工貼上 → viewer 解析
2. **DM stage 引擎**:A-B 兩層代碼(A=1新收案/2年中追蹤/3年度檢查,B=1–5照護階段);合法軌跡 `1-1 → 2-2 → 2-3 → 2-4 → 3-5 → 2-2 → ...`;進階規則「距上次同個案 ≥84 天」;365 天最多申報 4 次上限;申報代碼 P1407(新收案)/ P1408(追蹤)/ P1409(年度)
3. **每階段檢查 checklist 自動提示**:
   - `1-1` / `3-5`:EKG、ABI/PVR、眼底(>84 天未做 → 提示加開)
   - `2-2` / `2-3` / `2-4`:UACR、HbA1c、AC sugar(>84 天未做 → 提示加開)
   - 三態:已做 / 已開未做 / 該開未開
4. **Early CKD / Pre-ESRD stage 引擎**:規則與申報代碼待 YC 提供完整 spec(Early CKD 是否也是 A-B 兩層、是否有 1-1、申報代碼為何;Pre-ESRD stage spec 完全待補)
5. **「收案」/「本次申報」按鈕**:語意依跨 repo DB 路線決定 — 寫本地 staging / 直送 registry API / 生成 paste 字串給個管師
6. **糖網標示**:判定來源待 YC 確認(Fundoscopy order 有紀錄 vs DM registry 糖網欄位)
7. **Pre-ESRD 門檻收緊到 eGFR<30(KDIGO Stage 3b–5)**:影響 `patterns/computed.js` 的 `EarlyCKD` computed,需評估 viewer / reporter 所有既有使用點
8. **registry source of truth 確認**:「中央 DM registry」具體指哪個系統(健保署 VPN 上傳 / 中榮 HIS table / 院內 web app),決定後 #1 技術路線才能拍板
9. **DM 與 Early CKD 同時符合時的 UX**:兩套 stage 並行 vs 合併;單一病人三欄都已收案的視覺呈現
