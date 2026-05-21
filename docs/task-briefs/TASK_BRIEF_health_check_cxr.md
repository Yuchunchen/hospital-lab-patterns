# TASK_BRIEF: Viewer — 健檢 CXR 批次翻譯

> **方向**：vhtt 提出 + 執行
> **產出 session**：vhtt Cowork session, 2026-05-21
> **前置條件**：TASK_BRIEF_ckd_screening_dashboard S2 完成（批次 fetch pipeline、獨立視窗架構已就位）
>
> **執行完畢後請改名為 `TASK_BRIEF_health_check_cxr_done.md`**（rule #6）

---

## Problem

健康檢查門診每日約 50 人，每人需查看最近一次 CXR（胸部 X 光）報告。CXR 報告為英文，醫師需要：

1. 快速看到中文白話摘要（非逐字翻譯）
2. 異常項目明確標記（方便一眼辨識需追蹤個案）

目前流程：人工逐筆進 ernode → 開子頁面 → 讀英文報告 → 自行判讀。50 人需大量重複操作。

**目標**：批次抓取 CXR 報告 → Claude API（Haiku）自動翻譯 + 異常標記 → 表格呈現 + 列印。

---

## 架構定位

本功能屬於「給 ID 抓資料 → 以不同方式呈現」共用 pipeline 的第二個 use case：

| Use case | 資料來源 | 處理方式 | 呈現 |
|---|---|---|---|
| CKD/DM Dashboard | ernode orders | Pattern match + 日期比對 | 篩檢表格 |
| **健檢 CXR 翻譯** | **ernode orders → 子頁面報告** | **Claude API 翻譯** | **翻譯表格 + 列印** |

與 CKD/DM Dashboard 共用：獨立視窗架構、批次 fetch pipeline、ernode API 呼叫邏輯。

---

## Phase 0：已完成 ✅（2026-05-21）

測試病人：19606F / 1063J / 21968B / 125957A（四位健檢個案）

### P0-1：CXR order name 確認 ✅

| 問題 | 結論 |
|---|---|
| CXR order 在 `get_lab_orders`？ | **是**。放射線（Radiology）unit 有回傳 |
| 健檢 CXR order name？ | **`PE CXR`**（四位病人一致） |
| 一般 CXR order name？ | `CHEST PA or AP View (TT)`（19606F 有，其他三位無——屬臨床用） |
| searchItem 可搜？ | **是**。`searchItem=CXR` 可命中 `PE CXR` |

`PE CXR` 科別為「體檢科」，IMPRESSION 為 `Z00.00_體檢`。
`CHEST PA or AP View (TT)` 科別為臨床科別（如「內科急診」）。

健檢 pipeline regex 建議：`/PE\s*CXR|CHEST\s+PA\s+or\s+AP/i`（優先 match PE CXR，也涵蓋一般 CXR）。

### P0-2：CXR 報告文字結構 ✅

子頁面 URL：`OpdOrderReport.aspx?OrdApNo={ordapno}&hisnum={chartno}&opid={opsid}`

實際報告格式（與 DM Education 等子頁面同一頁面框架）：

```
檢查項目：15001020 PE . C X R(TT)
------
IMPRESSION：Z00.00_體檢
------
報告內容：
> Cardiomegaly with tortuous aorta and atherosclerotic change
> Mild DJD changes over T-L spine and osteoporosis change
> Prominent bilateral hila
> Elevated right hemidiaphragm
> Increasing infiltration over left lower lung field with opacity
```

格式特徵：
- `IMPRESSION:` 行含 ICD code + 診斷（健檢為 `Z00.00_體檢`）
- `報告內容:` 之後為英文 free text，每行以 `>` 開頭
- 無 `FINDINGS:` 區塊——直接是 findings 列表
- 子頁面也含 `出生日期`（bonus data）

---

## 功能設計

### 輸入

與 CKD/DM Dashboard 相同的三種 mode：
- Mode 1：貼上門診候診清單（批次）
- Mode 2：貼上病歷一筆（單人）
- Mode 3：貼上病歷多筆（多人追蹤）

健檢主要使用 **Mode 1**（每日 ~50 人批次處理）。

### 處理 Pipeline

```
ID 清單
  → ernode get_lab_orders（每人）
  → 找最近一筆 CXR order（pattern match by order name）
  → 子頁面 fetch（OpdOrderReport.aspx）取得英文報告 text
  → Claude API（Haiku）翻譯 + 異常標記
  → 組裝表格資料
```

### Claude API 設計

| 項目 | 規格 |
|---|---|
| Model | claude-haiku-4-5-20251001（速度快、成本低） |
| 呼叫方式 | Extension 直接呼叫 Anthropic API（`https://api.anthropic.com/v1/messages`） |
| API Key 儲存 | `chrome.storage.local`（extension 內部，不同步到雲端） |
| 每次 input | 單筆 CXR 英文報告 text（~200-500 tokens） |
| 每次 output | 中文白話摘要 + 異常標記 JSON（~100-200 tokens） |
| 成本估算 | ~50 人/天 × ~700 tokens/人 ≈ 35K tokens/天 ≈ **$0.01/天**（Haiku pricing） |
| 並行 | 5 concurrent requests（避免 rate limit） |

#### API Prompt 設計

```
System: 你是放射科報告翻譯助手。將英文 CXR 報告翻譯為中文白話摘要。

規則：
1. 用一般人能理解的中文描述
2. 異常發現用 🔴 標記，正常用 ✅ 標記
3. 輸出 JSON 格式

User: [英文報告 text]

Expected output:
{
  "summary": "心臟大小正常，肺部無明顯異常，無肋膜積水",
  "findings": [
    { "item": "心臟大小", "status": "normal", "detail": "正常" },
    { "item": "肺野", "status": "normal", "detail": "無浸潤或實質化" },
    { "item": "肋膜", "status": "normal", "detail": "無積水" }
  ],
  "hasAbnormal": false
}
```

### API Key 設定 UI

首次使用時：
1. Dashboard 偵測到無 API Key → 顯示設定提示
2. 使用者輸入 Anthropic API Key → 儲存至 `chrome.storage.local`
3. 後續自動帶入

Key 驗證：呼叫一次 API（空報告）確認 key 有效。

### 輸出呈現

#### 表格欄位

| 欄位 | 來源 | 說明 |
|---|---|---|
| 病歷號 | 輸入 | — |
| 姓名 | ernode | — |
| CXR 日期 | ernode order | 最近一筆 CXR 的生效時間 |
| 狀態 | — | 🔴 異常 / ✅ 正常 / ⚠️ 無報告 |
| 中文摘要 | Claude API | truncate + tooltip（列印為完整顯示） |
| 異常項目 | Claude API | 僅顯示 status=abnormal 的 findings |

#### 排序/篩選

- 預設：異常優先（🔴 → ⚠️ → ✅）
- 可篩選：只看異常 / 只看無報告

#### 列印

- 每人一行（完整摘要，不 truncate）
- 異常項目以粗體 + 紅字標示
- 頁首含日期、總人數、異常人數統計

### 容器

與 CKD/DM Dashboard 共用獨立視窗（`chrome.windows.create`），新增 Tab：

| Tab | 功能 |
|---|---|
| Tab 1：報告 | 現有單人報告 |
| Tab 2：篩檢 Dashboard | CKD/DM 收案 |
| **Tab 3：健檢 CXR** | **CXR 批次翻譯** |

或者，若 Tab 數量過多，可改為 Tab 2 Dashboard 內的 sub-tab。此決策待 S2 UI 完成後再定。

---

## 分段計畫

### S1：Catalog Pattern（Phase 0 已完成 ✅）

1. ~~ernode 測試~~：✅ 已確認（`PE CXR`，unit=放射線）
2. ~~子頁面 fetch~~：✅ 已確認（IMPRESSION + 報告內容，英文 `>` 開頭）
3. 新增 catalog pattern：`CXR` pattern entry（patterns repo）
   - regex: `/PE\s*CXR|CHEST\s+PA\s+or\s+AP/i`
   - category: 檢查（與 EKG/ABI/PVR/Fundus 同類）
   - track-only（不加 viewer/reporter manifest）
4. sync viewer（reporter 不動）

**成功標準**：
- 用測試病人 chartno（19606F / 1063J / 21968B / 125957A）確認 CXR order 被 pattern match
- 子頁面報告 text 可正確擷取

### S2：批次 CXR 報告 fetch + Claude API 翻譯

1. API Key 設定 UI（`chrome.storage.local` 存取）
2. 批次 CXR order fetch（reuse S2 dashboard batch pipeline）
3. 子頁面報告 text 擷取
4. Claude API 呼叫（並行 5 requests，error handling）
5. 翻譯結果暫存（`chrome.storage.session` 或 memory）

**成功標準**：
- 50 筆 CXR 報告在 3 分鐘內完成翻譯
- API 呼叫失敗有 retry + 錯誤訊息
- API Key 無效時有明確提示

### S3：UI 呈現 + 列印

1. CXR 翻譯結果表格（排序/篩選）
2. 異常標記 + 統計摘要
3. 列印版面（完整摘要、異常紅字）
4. Tab / sub-tab 整合到獨立視窗

**成功標準**：
- 異常個案一眼可辨（🔴 排在最前）
- 列印輸出可直接夾入健檢報告
- 50 人表格 render 流暢（< 1 秒）

---

## 測試清單

1. [x] P0 確認：CXR order 出現在 `get_lab_orders` 且為 `PE CXR`（4/4 病人一致）
2. [x] P0 確認：子頁面報告 text 可擷取（IMPRESSION + 報告內容，`>` 開頭英文 free text）
3. [ ] API Key 設定/驗證流程正常
4. [ ] 單筆 CXR 翻譯正確（中文摘要 + 異常標記）
5. [ ] 50 筆批次翻譯 < 3 分鐘完成
6. [ ] API 失敗 retry + 錯誤顯示
7. [ ] 無 CXR order 的病人顯示 ⚠️ 無報告
8. [ ] 表格排序：異常優先
9. [ ] 列印：完整摘要 + 異常紅字
10. [ ] 已翻譯結果不重複呼叫 API（cache or flag）

---

## 風險與備案

| 風險 | 影響 | 備案 |
|---|---|---|
| ~~CXR order 不在 `get_lab_orders`~~ | ~~無法用現有 pipeline 抓取~~ | ✅ 已排除 — `PE CXR` 確認在 `get_lab_orders` 回傳（unit=放射線） |
| CXR 報告格式不固定 | Claude API prompt 需調整 | 多收集幾份報告樣本，調整 prompt + few-shot |
| Anthropic API rate limit | 50 筆並行可能觸發 | 降低並行數（3）+ exponential backoff |
| API Key 外洩風險 | — | `chrome.storage.local` 不同步；extension 僅本機使用 |
| 報告含 PHI（Protected Health Information） | 送至外部 API 有隱私顧慮 | Haiku 處理後不留存；或改用 local model 替代 |
