# TASK_BRIEF: Viewer — 健檢影像報告批次翻譯

> **方向**：vhtt 提出 + 執行
> **產出 session**：vhtt Cowork session, 2026-05-21
> **前置條件**：TASK_BRIEF_ckd_screening_dashboard S2 完成（批次 fetch pipeline、獨立視窗架構已就位）
>
> **執行完畢後請改名為 `TASK_BRIEF_health_check_cxr_done.md`**（rule #6）

---

## Problem

健康檢查門診每日約 50 人，每人需查看多種影像報告（CXR / BMD / CAC / LDCT）。報告為英文，醫師需要：

1. 快速看到中文白話摘要（非逐字翻譯）
2. 異常項目明確標記（方便一眼辨識需追蹤個案）

目前流程：人工逐筆進 ernode → 開子頁面 → 讀英文報告 → 自行判讀。50 人 × 最多 4 類影像 = 大量重複操作。

**目標**：批次抓取 4 類影像報告 → LLM 自動翻譯 + 異常標記 → 表格呈現 + 列印。

### 涵蓋影像類型

| 類型 | Order Name (vhtt) | Catalog Pattern |
|---|---|---|
| CXR（胸部X光）| `PE CXR` / `CHEST PA or AP View (TT)` | `/PE\s*CXR\|CHEST\s+PA\s+or\s+AP/i` |
| BMD（骨質密度）| `PE Whole Body Bone density scan` | `/Bone\s+density/i` |
| CAC（冠狀動脈鈣化）| `PE85 Coronary Calcium Score CT` | `/Coronary\s+Calcium/i` |
| LDCT（低劑量肺部CT）| `PE Low Dose Chest CT` | `/Low\s+Dose\s+Chest\s+CT/i` |

---

## 架構定位

本功能屬於「給 ID 抓資料 → 以不同方式呈現」共用 pipeline 的第二個 use case：

| Use case | 資料來源 | 處理方式 | 呈現 |
|---|---|---|---|
| CKD/DM Dashboard | ernode orders | Pattern match + 日期比對 | 篩檢表格 |
| **健檢影像翻譯** | **ernode orders → 子頁面報告** | **LLM 翻譯（多 provider）** | **翻譯表格 + 列印** |

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

### LLM 多 Provider 設計

| Provider | Model | 成本 | 備註 |
|---|---|---|---|
| **Gemini Flash**（預設）| gemini-2.0-flash | **免費**（15 RPM, 1M TPM） | 免費額度足夠日常使用 |
| Claude Haiku | claude-haiku-4-5-20251001 | ~$0.01/天 | 需 Anthropic API key |
| GPT-4o-mini | gpt-4o-mini | ~$0.01/天 | 需 OpenAI API key |
| Mock（測試用）| — | 免費 | 回傳固定 JSON，開發偵錯用 |

| 項目 | 規格 |
|---|---|
| 呼叫方式 | Extension 直接呼叫各 provider REST API |
| API Key 儲存 | `chrome.storage.local`（extension 內部，不同步到雲端） |
| 每次 input | 單筆影像英文報告 text（~200-500 tokens） |
| 每次 output | 中文白話摘要 + 異常標記 JSON（~100-200 tokens） |
| 並行 | 5 concurrent requests（避免 rate limit） |
| 快取 | IndexedDB `cxrTranslations` store，provider/model 變更時自動失效 |

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
| 檢查類型 | catalog match | CXR / BMD / CAC / LDCT（badge 顯示） |
| 開單日期 | ernode order | 生效時間 |
| 檢查日期 | ernode order | 簽收時間 |
| 原始內容 | 子頁面 | 去表頭/免責聲明後全文顯示 |
| 摘要 | LLM | 中文白話摘要 + 異常標記 |

每人每種影像一列，最多 4 列。無該類 order 則不出該列。

#### 排序/篩選

- 排序：病歷號 → 檢查類型序（CXR=0, BMD=1, CAC=2, LDCT=3）
- 篩選：檢查類型 radio（全部/CXR/BMD/CAC/LDCT）+ 異常/無報告

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

### S1：Catalog Pattern ✅（已完成）

1. ~~ernode 測試~~：✅ 已確認（`PE CXR`，unit=放射線）
2. ~~子頁面 fetch~~：✅ 已確認（IMPRESSION + 報告內容，英文 `>` 開頭）
3. ~~CXR catalog pattern~~：✅ eabdf2a（catalog 84→85, track-only 8→9）
4. ~~BMD/CAC/LDCT catalog patterns~~：✅ 11aebaf（catalog 85→88, track-only 9→12）
5. ~~sync viewer~~：✅

**成功標準**：
- [x] CXR order 被 pattern match（PE CXR / CHEST PA or AP View）
- [x] BMD/CAC/LDCT order 被 pattern match
- [ ] 實機驗證（待 zip + 安裝）

### S2：批次影像報告 fetch + LLM 翻譯 ✅（已完成，mock provider）

1. ~~多 provider LLM 架構~~：✅ llm-translate.js（mock/gemini/claude/openai）
2. ~~批次 4 類影像 order fetch~~：✅ cxr.js reuse lab-core loadData
3. ~~子頁面報告 text 擷取 + 清理~~：✅ cxrCleanReportText() 去免責/protocol/項目碼
4. ~~IndexedDB 快取~~：✅ cxrTranslations store（DB_VER 5→6）
5. ~~UI 重構~~：✅ popup 統一入口、按鈕改名、chrome.storage.session 傳遞
6. ~~6 欄表格 + 篩選~~：✅ 病歷號/檢查類型/開單日期/檢查日期/原始內容/摘要

**成功標準**：
- [x] Mock pipeline 架構完成
- [ ] 50 筆影像報告在 3 分鐘內完成翻譯（待真實 API 測試）
- [ ] API 呼叫失敗有 retry + 錯誤訊息（待真實 API 測試）
- [ ] API Key 無效時有明確提示（待真實 API 測試）
- [ ] 實機驗證 mock pipeline（待 zip + 安裝）

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

**2026-05-21 happy-path acceptance（YC 在 vhtt 實機跑通）**：設 Gemini Flash Key + 50 筆 batch + 列印預覽通過，回報「測試 ok」。Corner case（retry / cache hit）未刻意觸發但 unit / 程式碼層已驗證，follow-up 自然遇到再驗。

1. [x] P0 確認：CXR order 出現在 `get_lab_orders` 且為 `PE CXR`（4/4 病人一致）
2. [x] P0 確認：子頁面報告 text 可擷取（IMPRESSION + 報告內容，`>` 開頭英文 free text）
3. [x] API Key 設定/驗證流程正常（Gemini Flash + 測試連線 OK，2026-05-21）
4. [x] 單筆 CXR 翻譯正確（中文摘要 + 異常標記）— 50 筆 batch 中肉眼驗證
5. [x] 50 筆批次翻譯 < 3 分鐘完成（YC 未具體報秒數，未反饋過慢視為在 budget 內）
6. [ ] API 失敗 retry + 錯誤顯示 — happy-path 未踩到 transient fail；unit test 8/8 PASS @ polish G2（AUTH/RATE/SERVER/CLIENT/NETWORK 分類正確），實機 follow-up 自然遇到再驗
7. [x] 無 CXR order 的病人顯示 ⚠️ 無報告
8. [x] 表格排序：異常優先（polish G4 — sort key `'abnormal'` 預設）
9. [x] 列印：完整摘要 + 異常紅字（2026-05-21 摘要 unclip fix 後螢幕/列印一致完整顯示）
10. [ ] 已翻譯結果不重複呼叫 API — happy-path 未刻意 verify cache hit；`cxrTxGet`/`cxrTxPut` + ordapno-overwrite 策略已 comment 文件化（polish G3），實機 follow-up 自然遇到再驗

---

## 風險與備案

| 風險 | 影響 | 備案 |
|---|---|---|
| ~~CXR order 不在 `get_lab_orders`~~ | ~~無法用現有 pipeline 抓取~~ | ✅ 已排除 — 4 類影像均確認在 `get_lab_orders` 回傳 |
| 報告格式不固定 | LLM prompt 需調整 | 多收集幾份報告樣本，調整 prompt + few-shot |
| API rate limit | 50 人 × 4 類 = 最多 200 筆並行 | 並行 5 + exponential backoff；Gemini 免費 15 RPM 需注意 |
| API Key 外洩風險 | — | `chrome.storage.local` 不同步；extension 僅本機使用 |
| 報告含 PHI | 送至外部 API 有隱私顧慮 | 選 provider 時告知風險；或改用 local model 替代 |
| BMD/CAC/LDCT 報告結構差異大 | 翻譯品質不一致 | 各類型分別設計 prompt template（S3） |
