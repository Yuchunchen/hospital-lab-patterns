# TASK_BRIEF — reporter:BUN(AD) CSV 匯出為空修復

> **Status:** ACTIVE — 等 Claude Code 接手實作
> **Last updated:** 2026-05-06
> **Scope:** 將前端 `classifyBUNPrePost()` 邏輯移植到 `fetcher.js`，讓 server-side CSV 匯出也能正確分離 BUN_pre / BUN_post
> **觸發:** 使用者發現 000006658A 的 BUN(AD) 在報表畫面有值但 CSV 匯出全為空

---

## 1. 問題陳述

BUN(AD)（洗後 BUN）在 reporter 報表畫面正確顯示，但透過「匯出 CSV」按鈕
產生的 `dialysis_export_*.csv` 中，所有病患的 `BUN (AD) value` 欄位全部為空。
BUN(BD) 正常匯出。

以 `000006658A` 為例（截圖 vs CSV）：

| YYYYMM | 畫面 BUN(AD) | CSV BUN(AD) |
|--------|-------------|-------------|
| 202604 | 23          | *(空)*      |
| 202603 | 24          | *(空)*      |
| 202602 | 23          | *(空)*      |
| 202601 | 22          | *(空)*      |
| 202511 | 15          | *(空)*      |
| 202509 | 17          | *(空)*      |

## 2. 根因分析

BUN_pre 和 BUN_post 共用同一條 regex `/BUN:\s*([\d.]+)/`，靠 `filter` 欄位
區分 composite（洗前 panel）vs standalone（洗後單獨開 BUN）。

### 兩條資料路徑

| 路徑 | 提取函式 | BUN 分類 | 結果 |
|------|---------|---------|------|
| **前端**（報表畫面）| `hospital-lab-data.html` 內的 `extractLabValues()` | 結尾呼叫 `classifyBUNPrePost()` ✅ | BUN_pre / BUN_post 正確分離 |
| **後端**（csv-compiler / server.js）| `fetcher.js` 的 `extractLabValues()` | **無** `classifyBUNPrePost()` ❌ | BUN_post 依賴 `filter:'standalone_bun'`，但很多醫院的洗後 BUN orderName 不符合 `=== 'BUN'` 的精確匹配，導致陣列為空 |

`classifyBUNPrePost()` 是 2026-05-05 的 Revision 1 hotfix，當時只修了前端
（`hospital-lab-data.html` line 2072–2189），**沒有同步到 `fetcher.js`**。

### classifyBUNPrePost 的分類邏輯

1. **Method A（primary）:** 同日期多筆 BUN，依 signOffTime 排序 → 最早 = pre（洗前），最晚 = post（洗後）
2. **Method B（fallback）:** signOffTime 缺失或相同時，以 orderName 中的「洗前」/「洗後」文字判斷

這套邏輯不依賴 `filter` 欄位，已在前端驗證穩定。

## 3. 修法

將 `classifyBUNPrePost()` 及其輔助函式移植到 `fetcher.js`，在
`extractLabValues()` 結尾呼叫。

### 3.1 需要搬移的函式（從 hospital-lab-data.html 複製）

1. `classifyBUNPrePost(results)` — 主函式，重建 `results.BUN_pre` / `results.BUN_post`
2. `classifyBUNForDate(entries, date)` — 單日分類（Method A + B）
3. `_bunEntryTime(e)` — 從 entry 取出時間戳（signOffTime → dateObj → reportDateTime）

### 3.2 fetcher.js 的修改

在 `extractLabValues()` 函式結尾，`return results` 之前加入：

```js
// Revision 1 hotfix sync: rebuild BUN_pre[] / BUN_post[] so each
// physical draw appears exactly once in the correct bucket.
// (Ported from hospital-lab-data.html classifyBUNPrePost)
classifyBUNPrePost(results);
```

### 3.3 注意事項

- `fetcher.js` 的 entry 物件欄位名可能與前端不完全一致。前端用
  `signOffTime`、`dateObj`、`reportDateTime`，後端 entry 有
  `date`、`orderDatetime`、`reportDatetime`（注意大小寫）。
  搬移時要確認 `_bunEntryTime(e)` 的欄位名映射。
- 搬過來之後，`fetcher.js` 中 `DIALYSIS_TESTS` 的 BUN_post `filter: 'standalone_bun'`
  仍保留（不影響，因為 classifyBUNPrePost 會覆寫整個 BUN_post 陣列）。
  日後若要清理可移除 filter，但本輪不動以降低風險。

## 4. 不需要動的東西

- `hospital-lab-data.html`：前端已有 classifyBUNPrePost，不需改動。
- `groups/dialysis.js`：CSV exporter 的 `detectMonthlyDrawsFromStored()` 和
  `_indexBunByDate()` 已正確從 `labData.BUN_post[]` 取值，只要該陣列有資料就會正常匯出。
- `lab-mapping.js`：BUN_pre / BUN_post 的 DIALYSIS_TESTS 定義不動。
- patterns / viewer repo：不受影響。

## 5. 實作步驟

### Phase A — reporter repo

```powershell
cd D:\self\hospital-lab\hospital-lab-reporter
claude
```

讓 Claude Code：

1. 讀 `hospital-lab-data.html` 中的 `classifyBUNPrePost()`、`classifyBUNForDate()`、
   `_bunEntryTime()` 三個函式（line 2092–2189）。
2. 在 `fetcher.js` 中新增這三個函式（放在 `extractLabValues` 函式之前或模組底部），
   注意 entry 欄位名映射：
   - 前端 `e.signOffTime` → 後端 `e.signOffTime`（若 fetchAllOrders 有存）
   - 前端 `e.dateObj` → 後端可能沒有，改用 `new Date(e.date)` 或 `e.reportDatetime`
   - 前端 `e.reportDateTime` → 後端 `e.reportDatetime`（小寫 t）
   - 前端 `e.orderName` → 後端 `e.orderName`（需確認 fetchAllOrders 是否有存這個欄位到 entry）
3. 在 `fetcher.js` 的 `extractLabValues()` 結尾（`return results` 之前），
   加入 `classifyBUNPrePost(results);`。
4. **重要檢查**：確認 `fetchAllOrders` → `extractLabValues` 的 entry 物件
   是否帶有 `signOffTime` 和 `orderName`。如果沒有，需要在 line 266–272
   的 entry push 中補上這些欄位（從 `order` 物件中取得）。
5. 用繁中更新 WORKLOG.md，標題類似：
   `## 2026-05-06 — 修復 CSV 匯出 BUN(AD) 為空（同步 classifyBUNPrePost 到 fetcher.js）`
6. git add fetcher.js WORKLOG.md
   git commit，顯示 commit message，**停下來等使用者說 push**。

## 6. 跨 repo 副作用 checklist

- [x] patterns — 不需動
- [x] viewer — 不需動
- [ ] reporter push（fetcher.js + WORKLOG.md）

只動 reporter 一個 repo。

## 7. 驗收

### 自動驗證

在 reporter 目錄跑一個暫存測試 script（如 `scripts/test-bun-csv.js`）：

1. 載入 `fetcher.js`，給一組模擬 orders（同日期兩筆 BUN，不同 signOffTime）
2. 呼叫 `extractLabValues()`
3. 斷言 `results.BUN_pre` 和 `results.BUN_post` 各有一筆且值不同
4. 全 PASS 後刪掉暫存 script

### 手動驗證

1. 重啟 reporter server
2. 開病患 `000006658A` 的報表畫面 → 確認 BUN(BD) / BUN(AD) 仍正常顯示（regression check）
3. 點「匯出 CSV」→ 開啟 CSV 確認 `BUN (AD) value` 欄位有值
4. 比對 CSV 的 BUN(AD) 與畫面上的值，應一致
5. 同時確認 URR 欄位也有值（URR 依賴 BUN_pre + BUN_post 計算）

---

## Reference: entry 欄位映射速查

| 用途 | 前端 (hospital-lab-data.html) | 後端 (fetcher.js) | 備註 |
|------|------|------|------|
| 簽收時間 | `e.signOffTime` | 待確認 | fetchAllOrders 是否有存 |
| 日期物件 | `e.dateObj` | 無（可用 `new Date(e.date)`） | |
| 報告時間 | `e.reportDateTime` | `e.reportDatetime` | 大小寫差異 |
| 醫令名稱 | `e.orderName` | 待確認 | Method B fallback 需要 |
| 日期字串 | `e.date` | `e.date` | YYYY-MM-DD 格式 |
