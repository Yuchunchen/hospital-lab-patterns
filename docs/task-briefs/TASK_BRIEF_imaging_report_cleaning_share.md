# TASK_BRIEF: Viewer popup 對 imaging report 套 cleaning(共用 cxr.js 既有邏輯)

> **方向**:vhtt 提出 + Claude Code 執行
> **產出 session**:vhtt Cowork session, 2026-05-22
> **前置條件**:無(僅動 viewer 內部 refactor + popup wire-up)
>
> **執行完畢後請改名為 `TASK_BRIEF_imaging_report_cleaning_share_done.md`**(rule #6)

---

## Problem(2026-05-22 vhtt 發現)

vhtt 病歷號 000034324I 的「報告查詢」(popup 主視窗)LDCT row 顯示的 `reportText` 只有 letterhead+header,看不到 finding/impression。已確認 CAC、Bone density 同病 — 所有 imaging row 都有這個 bug,只是 letterhead 字數不同,有些被截前 80 字蓋過。

### Root cause(已 evidence 確認)

- ernode master orders page 對 imaging row 把整份子頁面 textContent(letterhead + header + body)inline render 到 `cells[2]` 內(部分內容是 hidden block,但 textContent 仍會抓出)。LDCT body **已在 master page 內**,YC 在 master page DevTools 確認 `cells[2].textContent` 含 `檢查項目:.../IMPRESSION:.../報告內容:.../> A 6mm subpleural nodule over RUL.../Impression: 1. ... 2. ...`。
- viewer `lab-core.js:135` `parseOrdersPage` 用 `row.cells[2].textContent.trim()` 抓全部 concat,letterhead 在前、body 在後。
- viewer `popup.js` `renderSection` 對 imaging row(`isRad === true`)直接把 raw `reportText` 丟給 `makeExpandableCell`,truncate 前 80 字 → 使用者看到 letterhead 不看到 body。
- `cxr.js` 既有的 `cxrCleanReportText` + `報告內容:` 分隔線 + header rows strip 備援已能 handle 這格式,但只在 cxr.html 健檢視窗 path 用,popup 沒共用。
- 點 ernode 「正式報告」navigate 到的另一頁反而**只有 letterhead+header 沒 body**(空殼),所以 fix **不是** fetch 子頁面,而是對 master page 既抓到的 `reportText` 套 cleaning。

### 關鍵 phrasing 提醒

不要寫成「從 hidden 抓」。`cells[2].textContent` 既有就已經把 hidden + visible 全部 concat 抓進來。fix 是**對既有的 `reportText` 套 cleaning**,把 letterhead+header 去掉只留 body。若實作走「另寫 selector 找 hidden div」會走錯路。

---

## Fix 設計(共用既有 cleaning,不 fetch 子頁面、不改 parseOrdersPage)

### 改動 1:抽 `cxr.js` cleaning 邏輯出來變共用 module

把 `cxr.js` 既有的三層 cleaning 抽到 `lab-core.js` 變共用 function `cleanImagingReport(rawText)`:

- **主路徑**:取 `報告內容:` 之後 free text(對應 cxr.js 既有「報告內容:」分隔線主路徑)
- **備援**:strip 已知 header 欄位行(BMD/CAC/LDCT 子頁面格式可能無分隔線時用,對應 cxr.js `CXR_HEADER_LABELS` strip 邏輯)
- **通用清理**:strip box 字元行(`[┌┐└┘│─]+`)、LDCT 協議括號段(`(The low dose protocol[\s\S]*?evaluation\.\)`)、檢查項目碼行(`檢查項目:\d+...`)

注意 cxr.js 既有的 `cxrCleanReportText` regex (c) 可能有 syntax 細節(動之前 grep 一次原檔確認 regex literal 開頭是 `/` 不是 `\`)。

### 改動 2:`popup.js` `renderSection` wire-up

`renderSection` 對 imaging row(`orders[0].ordType === 'RAD'`)render `reportText` 之前過一遍 `cleanImagingReport`。順序:
1. `data.rad` 從 `lab-core.js` `loadData` 拿到後,在 render 前對每筆 `o.reportText = cleanImagingReport(o.reportText)`
2. 或在 `makeExpandableCell` 之前對 imaging row 的 `o.reportText` 套 cleaning

哪一層套要 Claude Code 看程式碼決定(優先後者,只 touch render path 不污染 data layer)。

### 改動 3:`cxr.js` 改用共用 module(refactor)

`cxr.js` 既有的 `cxrCleanReportText` + header strip + 「報告內容:」分隔線,改 call `cleanImagingReport`。行為應**完全一致**(refactor 不改 cleaning 語意)。若不一致表示原 cxr.js 有 imaging-specific 邏輯本應抽出,brief 範圍含此釐清。

---

## Scope guard(明示不做)

- **不 fetch 子頁面**:body 已在 master page `cells[2]`,fetch 子頁面只會拿到空殼,徒增 fetch volume + IndexedDB cache 維護
- **不對 lab orders 套 cleaning**:lab row `reportText` 是檢驗結果格式(`BUN: 10 +` 之類),套 imaging cleaning 會破壞
- **不改 `parseOrdersPage` cell 抓法**:`cells[2].textContent.trim()` 保留;cleaning 在 render 層套
- **不改 master orders page URL / fetch 邏輯**:`fetchAllOrders` 不動
- **不改 IndexedDB schema**(無新 store / 無 cache 邏輯改動)

---

## 測試清單

1. ✅ **000034324I**(原 reported case,vhtt)— popup 主視窗 LDCT row 點 + 展開後顯示 body 含「A 6mm subpleural nodule over RUL」「Mild fibrotic change over LLL」等 finding,不只 letterhead
2. ✅ **000058895E**(vhtt 驗證 case)— LDCT / CAC / Bone density 三筆 popup row 都顯示完整 finding,letterhead 被 strip
3. ✅ cxr.html 健檢報告獨立視窗 LDCT 翻譯結果與 refactor 前一致(用同病人前後對照,無 regression)
4. ✅ Lab orders popup 顯示完全不受影響(regression — 隨抽一個 dialysis 病人如 80885F 看 lab 結果格式不變)
5. ✅ Cleaning 各層 regex 都運作:`報告內容:` 分隔線主路徑 / box 字元行 / 協議括號段 / 檢查項目碼行 / header rows 備援
6. ✅ patterns(brief 改名 _done)+ viewer(WORKLOG)各記一條繁中

---

## 執行模式 + commit / push

- **Cowork**(本輪 vhtt session,2026-05-22)寫 brief
- **Claude Code** 從 workspace root 一輪做:viewer 改 lab-core.js / popup.js / cxr.js + brief 改名 `_done` + patterns + viewer WORKLOG 各記一條
- 最後一個 commit 同時 commit brief 改名(rule #6)
- push 前問 YC(rule #3)
- 跨 repo 副作用:**不動 catalog**,不需 sync-patterns。只動 viewer + patterns(brief 改名)

---

## 預估工時

1–2 小時:
- cleaning 邏輯抽出 + 通用化 30 分
- popup wire-up 15 分
- cxr.js refactor 套共用 module + 既有功能 regression 30 分
- 自動測試 / 實機驗證 15–30 分
- WORKLOG + brief 改名 + commit 15 分

實機驗證若卡(YC 不在 vhtt 或 ernode 連不到),Claude Code 可寫 node harness 模擬 cells[2] textContent → cleaning → 預期 body 字串斷言,實機驗證列為 follow-up 並在 brief 改名 _done 時註記。
