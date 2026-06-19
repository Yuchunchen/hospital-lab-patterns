# TASK_BRIEF: 健檢報告(cxr.html)預設排序改為「輸入順序為主」

> **方向**:vhtt 提出 + Cowork 設計/執行(小半徑單檔)
> **產出 session**:vhtt Cowork session, 2026-06-19
> **前置條件**:viewer repo 已 `git pull`(2026-06-19 YC 已 sync)
>
> **執行完畢後請改名為 `TASK_BRIEF_健檢報告輸入順序排序_done.md`**(rule #6;
> 改名在最後一個 commit 同輪做掉 —— commit 由 YC / Claude Code,不在 Cowork)

---

## Problem(2026-06-19 vhtt 提出)

健檢報告視窗(cxr.html)目前預設排序是「異常浮頂」(`cxrState.sortKey = 'abnormal'`):
第一排序鍵是**判讀狀態**(abnormal → normal → noReport → error),同狀態內才按
病歷號 + 檢查類型序。

副作用:同一個病人若同時有正常與異常的檢查,異常那列會被拉到表格最上方的
異常帶、正常那列沉到下方正常帶 —— **同一個人的報告被拆開**,而且呈現順序與
使用者在 popup 貼上的病歷號清單順序無關。

YC 要的行為:**以「我貼上的輸入順序」為主**,每個人的報告**連續放在一起**。
明確指示:**不要異常浮頂**(🔴 紅標保留,只是不再驅動排序)。

## Root cause(已讀程式碼確認)

- `cxrRunFromText`(cxr.js):`uniq = [...new Set(valid)]` 本來就**保留貼上順序**;
  `perPatient = new Array(uniq.length)`,pool 以 index `i` 回填,`perPatient[i]`
  對應 `uniq[i]`;`cxrState.results = perPatient.flat()` —— 所以 **results 產出時
  已經是輸入順序**(病人層級),每人內各列已依 `CXR_EXAM_TYPES`(CXR→BMD→CAC→LDCT)。
- 破壞點唯一:`cxrRenderTable` 的 `rows.sort((a,b)=>cxrCompare(a,b,cxrState.sortKey))`,
  預設 `sortKey='abnormal'` 把輸入順序重排掉。
- thead 只有 `chartno/examType/orderDate/examDate/raw/summary` 六個 data-key,
  **沒有 `abnormal` 欄 header**;`abnormal` 純粹是初始 sortKey。「只看異常」是
  獨立的 filter checkbox(`filter-abnormal`),與排序無關 → 改預設不影響該 filter。

## Fix 設計(cxr.js 單檔,3 處)

1. **每列標記 inputIdx**:`cxrRunFromText` flat 之前,對 `perPatient[i]` 的每列
   stamp `r.inputIdx = i`(error / noReport 佔位列一併 stamp)。
2. **`cxrCompare` 新增 `inputOrder` 分支**:第一鍵 `inputIdx`、第二鍵
   `cxrExamOrder(examType)`。(JS sort 為 stable,tie 後仍確定。)
3. **預設改 `sortKey: 'inputOrder'`**,更新註解。`abnormal` 分支**保留**
   (surgical:不刪可逆,雖暫無 UI 入口)。

### Scope guard(明示不做)
- **不動** fetch / cleaning / cache / 翻譯 / IndexedDB,與 task #1 完全切開。
- **不刪** `abnormal` 分支、不動 `filter-abnormal` checkbox、不動 🔴 紅標邏輯
  (`cxrSummaryCell` 依 `status` 顯示,與排序解耦)。
- **不新增** thead 欄位/reset 按鈕(列為 Open,見下)。
- **不跨 repo**:viewer 單檔 cxr.js;不動 catalog → 不需 sync-patterns。

## 成功標準
健檢報告表格**預設排序 = 使用者 popup 貼上清單的順序(病人層級)**;同一病人各
檢查列相鄰且依 CXR→BMD→CAC→LDCT;**異常狀態不再影響排序**(只保留 🔴 視覺);
手動點欄位 header 仍可臨時改排序(opt-in)。

## 測試清單(每條對應一個業務行為,可獨立驗證)
1. **貼上順序=顯示順序**:popup 貼 `[C, A, B]`(刻意非數字序)→ 表格病人區塊由上到下為 C→A→B。
2. **同人不被拆**:某人有正常 CXR + 異常 LDCT → 兩列相鄰、中間不插別人,LDCT 不浮到表頭。
3. **同人內檢查序固定**:同一人多列恆為 CXR→BMD→CAC→LDCT。
4. **異常不再浮頂**:把異常病人放清單**最後** → 他仍排最後;🔴 紅標仍在摘要欄顯示。
5. **header 仍可臨時排序**:點「病歷號」/「檢查類型」可改排序(opt-in);重跑後回到輸入順序。
6. **noReport / error 列定位**:無報告 / 錯誤列仍待在該病人的 inputIdx 位置,不亂跳。
7. WORKLOG 記一條繁中;brief 完成後改名 `_done`(最後一個 commit 同輪)。

### 驗證方式
- 邏輯項(1–4, 6):node harness 斷言 `inputOrder` comparator + inputIdx stamp 的
  排序輸出(合成資料即可,不需真機)。
- 實機項(5 + 1–4 真實 render):YC 在 vhtt reload extension,popup 貼一組刻意
  亂序、含異常的病歷號清單,核對表格順序。列為 follow-up。

## 執行模式 + commit / push
- **Cowork**(本輪 vhtt session, 2026-06-19):寫 brief + 改 cxr.js(單 repo 單檔,
  小半徑)+ 更新 viewer WORKLOG。**改完停在 working tree,commit / push 不在 Cowork**
  (歸 YC / Claude Code)。
- brief 改名 `_done`、PROJECT_CONTEXT / Notion Dashboard 同步:於 commit 該輪處理。

## 預估工時
30–45 分:程式 3 處改 15 分 · node harness 10 分 · WORKLOG + brief 10 分。

## Open（不擋本次,記著）
- 是否要加一個「原順序」reset 控制項或 thead 標示,讓使用者點完欄位排序後能一鍵
  回到輸入順序(目前靠重跑)。本次不做,待 YC 決定。
