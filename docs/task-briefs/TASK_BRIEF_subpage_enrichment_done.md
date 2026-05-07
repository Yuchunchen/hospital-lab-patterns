# TASK_BRIEF — 統一 sub-page enrichment + Aluminum pattern 新增

> **Status:** ACTIVE — 設計確定，等 Claude Code 接手實作
> **Last updated:** 2026-05-07
> **Scope:** patterns + viewer + reporter 三 repo
> **觸發:** vhtt 透析病人 Aluminum 檢驗資料確認存在（18 人探測，12 人有 Blood Aluminum 年檢資料），Aluminin 從 DEFERRED 解除

---

## 1. 為什麼要做

**現況痛點：**

- 部分 lab order 的主頁面 reportText 只顯示「請 Click「正式報告」」，實際數值藏在子連結（OpdOrderReport.aspx）。
- 目前只有 Viewer 針對 UACR 做了 sub-page enrichment（`enrichUACRMulti()`），邏輯是 test-centric：一個 test 一個 function，無法擴展。
- Reporter 完全沒有 sub-page fetch 能力。
- Aluminum 檢驗在主頁面有時展開（`Al鋁: 6`）、有時只有「請 Click」，需要 sub-page 才能拿到值。
- 每新增一個需要子頁面的 test 就要寫一個新的 enrichXxx function — 不可維護。

**目標狀態：**

- 統一的 `enrichMissingValues()` 取代 `enrichUACRMulti()`，兩個 repo 共用邏輯。
- Two-pass 設計：先正常抽值 → 找出缺值的 testId → selective sub-fetch 只補需要的。
- Sub-page 結果持久化 cache（以 ordapno 為 key），避免重複 fetch。
- Aluminum 加進 catalog + 兩個 manifest。

---

## 2. 設計概觀

### 2.1 Two-pass enrichment flow

```
Pass 1（現有流程，不改）
  fetchAllOrders() → orders[]
  extractLabValues() / buildResultMap() → { testId: [values] }

Pass 2（新增：selective enrichment）
  missingIds = manifest 期望的 testId − Pass 1 有結果的 testId
  if missingIds is empty → done（不做任何 sub-fetch）

  candidates = orders.filter(o =>
    o.ordapno &&
    /請\s*Click/.test(o.reportText) &&
    withinCutoff(o) &&
    missingIds 的 regex 在 o.reportText 沒 match 到
  )

  for each candidate（上限 maxFetches=15）:
    if enrichCache[ordapno] exists → 用 cache，不 fetch
    else → fetch OpdOrderReport 子頁面 → 存入 enrichCache
    order.reportText = subpageText

  re-run extractLabValues() 只針對 enriched orders → merge 進結果
```

### 2.2 關鍵判斷：什麼時候「不」去抓子頁面

- 所有 manifest 期望的 testId 都已在 Pass 1 拿到值 → 不觸發 Pass 2
- 某個 order 雖然有「請 Click」但它的 reportText 已有我們要的值 → 跳過該 order
- 已經在 enrichCache 裡 → 直接用 cache，0 HTTP request
- 超過 maxFetches 上限 → 停止

### 2.3 enrichCache 持久化

| | Viewer | Reporter |
|---|---|---|
| 儲存 | IndexedDB，與 order cache 同 store 或獨立 store | localStorage `enrichCache_dialysis` |
| Key | ordapno (string) | ordapno (string) |
| Value | 子頁面 body textContent (string) | 同左 |
| TTL | 永久（lab 報告簽收後不會再改） | 永久 |

---

## 3. Aluminum catalog entry

### 3.1 Ground truth 樣本（vhtt 2026-05-07 確認）

**主頁面格式（ernode API reportText）：**
```
Al鋁: 6
Al鋁: 13
Al鋁: <2          ← 注意 < 符號（低於偵測下限）
Al鋁: 20
```

**子頁面格式（OpdOrderReport.aspx）：**
```
檢查項目：Blood Aluminum
Result:    4
```

**醫囑名稱變體：**
- `Blood Aluminum`（主要）
- `Blood Aluminum(TT)`（偶見）

**「請 Click」出現規律：** 大約超過 1 年的報告就不會在主頁面展開數值，改為顯示「請 Click「正式報告」」。114 年（最近）的幾乎都有展開，112 年以前幾乎全部是「請 Click」。

**樣本病人（18 人探測，2026-05-07）：**

| chartno | 姓名 | 性別/年齡 | Al 筆數 | 主頁面展開的值 | 「請 Click」筆數 |
|---|---|---|---|---|---|
| 000023355G | 羅賢成 | M 67 | 7 | Al鋁:6, Al鋁:13 | 5 |
| 000029720B | 許陳卻 | F 88 | 6 | Al鋁:7 | 5 |
| 000116917B | 蔡勳 | M 43 | 3 | Al鋁:6, Al鋁:4 | 1 |
| 000107771A | 范秀英 | F 51 | 4 | Al鋁:3 | 3 |
| 000024679H | 葉良己 | M 79 | 1 | Al鋁:5 | 0 |
| 000033244F | 賴金正 | M 61 | 1 | Al鋁:4 | 0 |
| 000023982H | 賴春喜 | M 76 | 4 | Al鋁:3, **Al鋁:<2** | 2 |
| 000087358F | 宋金造 | M 67 | 7 | Al鋁:6, **Al鋁:<2** | 5 |
| 000118307J | 李阮?仔 | F 68 | 3 | Al鋁:4 | 2 |
| 000022601H | 朱漢芸 | M 72 | 3 | **Al鋁:20**, Al鋁:8 | 1 |
| 000050187B | 謝芝純 | F 64 | 5 | Al鋁:5 | 4 |
| 000092066B | 賴映雪 | F 76 | 6 | Al鋁:4 | 5 |
| 000085322F | 郝炳? | F 74 | 0 | — | — |
| 000123680C | 羅錚 | M 61 | 0 | — | — |
| 000085338F | — | — | 0 | — | — |
| 000039431A | 潘秀美 | F 73 | 0 | — | — |

**覆蓋率：** 18 人中 12 人有鋁資料（67%）。無資料的可能是較新透析病人或非長期透析。
**值域觀察：** 大部分 2-8 µg/L，朱漢芸 Al鋁:20 剛好踩到 ref 上限。`<2` 表示低於偵測下限。

### 3.2 Catalog entry（草案）

```js
{ id:'Aluminum',
  pattern: /Al鋁:\s*([<>]?\s*[\d.]+)/,
  displayName:'鋁 (Aluminum)', shortLabel:'Al',
  unit:'µg/L', category:'微量元素',
  ref:'<20 µg/L',
  refLo:null, refHi:20, hi:20, lo:null,
  meaning:'鋁中毒監測（長期透析）',
  notes:'Annual test. vhtt confirmed 2026-05-07 (18-patient survey, 12 with data). Main page label "Al鋁: N" or "Al鋁: <2" (below detection limit). Sub-page shows "Result: N" — handled by enrichment pass, regex only needs to match main-page format. Ref <20 µg/L per KDOQI guidelines.' }
```

**Regex 說明：**
- `[<>]?` — 支援 `<2`（低於偵測下限）和潛在的 `>` 值
- 與 catalog 中 AFP 的 `[<>]?` 寫法一致
- 只 match 主頁面格式 `Al鋁: N`。子頁面 `Result: N` 太通用不適合當 catalog regex

**注意：** enrichment pass 把子頁面文字整段替換為 reportText。子頁面可能只有 `Result: N` 而非 `Al鋁: N`。若子頁面不含 `Al鋁:`，enrichment 需根據 orderName 含 `Aluminum` 轉譯為 `Al鋁: {value}` 再 append（待確認更多子頁面樣本，見 §3.4）。

### 3.3 Manifest 登記

**viewer.js：** 加進適當的 page/col/section
**reporter.js：** 加進 dialysis manifest，periodicity: `'annual'`

### 3.4 子頁面是否包含 `Al鋁:` 格式 — 待確認

目前只看到一個子頁面樣本（29720B OrdApNo=11383228），顯示的是：
```
檢查項目：Blood Aluminum
Result:    4
Methods:
```
只有 `Result: 4`，沒有 `Al鋁: 4`。

Claude Code 實作 enrichment 時應多展開 2-3 個其他病人的子頁面確認格式是否一致。建議用有「請 Click」的樣本：
- 000107771A 113/12 的那筆
- 000087358F 112/12 的那筆
- 000092066B 113/11 的那筆

處理策略：
- 若子頁面也有 `Al鋁: N` → regex 直接 match，OK
- 若子頁面只有 `Result: N`（目前唯一觀察）→ enrichment 需根據 orderName 含 `Aluminum` 轉譯：append `Al鋁: {value}` 到 reportText，讓下游 regex 正常 match

---

## 4. 改動清單

### Phase 1: patterns repo

1. `catalog.js` — 新增 Aluminum entry（§3.2）
2. `viewer.js` — 新增 Aluminum 到 viewer manifest
3. `reporter.js` — 新增 Aluminum 到 reporter manifest，`periodicity:'annual'`
4. `npm run release`（validate + build-json）
5. 更新 WORKLOG.md

### Phase 2: viewer repo

1. **重構 `enrichUACRMulti()` → 通用 `enrichMissingValues()`**
   - 刪除 `enrichUACRMulti()`、`UACR_RE` 常數
   - 新增 `needsSubpageFetch(order)` — 檢查 `/請\s*Click/`
   - 新增 `findEnrichmentCandidates(orders, missingTestIds, catalogById)`
   - 新增 `enrichMissingValues(orders, chartno, manifest, catalogById, opts)`
   - 保留 `getOpdwebBase()`、`buildSubpageUrl()`、`fetchSubpageText()` 不變
2. **enrichCache 持久化**
   - IndexedDB 新增或複用 store，key = ordapno
   - `loadData()` 中：讀 enrichCache → enrichMissingValues() → 寫回 enrichCache
3. **`loadData()` 呼叫點修改**
   - 移除 `await enrichUACRMulti(labRecent, chartno, onProgress);`（line 325）
   - 改為呼叫 `enrichMissingValues()`，傳入 manifest + catalogById
4. `node sync-patterns.js`
5. 更新 WORKLOG.md

### Phase 3: reporter repo

1. **新增 sub-page fetch 能力**
   - 從 viewer 搬入 `getOpdwebBase()`、`buildSubpageUrl()`、`fetchSubpageText()`
   - 搬入 `enrichMissingValues()` 全套
2. **enrichCache 持久化**
   - localStorage key: `enrichCache_dialysis`
   - 結構：`{ ordapno: subpageText, ... }`
3. **`fetchAndStore()` 呼叫點修改**
   - 在 `extractLabValues()` 前插入 enrichment pass
4. `node sync-patterns.js`
5. 更新 WORKLOG.md

---

## 5. 測試驗證

### 5.1 Viewer

- 載入 000023355G（有 Al，主頁面有展開值）→ Aluminum 出現在 handout，不觸發 sub-fetch
- 載入 000092066B（有 Al，僅 114 年展開，其餘 5 筆「請 Click」）→ 最近值直接 match；若需歷史值 → sub-page enrichment 觸發
- 載入 000023982H（有 `Al鋁: <2`）→ `<2` 被 regex capture，顯示 `<2`
- 載入 000022601H（有 `Al鋁: 20`）→ 觸發 hi alarm（refHi=20）
- 載入 000085322F（無 Al）→ 不觸發 enrichment，Aluminum 欄空白
- 載入有 UACR 的病人 → 確認 UACR 仍正常（regression test — enrichment 統一機制不應影響 UACR）
- 第二次載入同病人（cache 命中）→ 0 sub-page HTTP requests

### 5.2 Reporter

- 同上 chartno 的驗證
- CSV 匯出包含 Aluminum 欄位（annual periodicity）
- `<2` 值在 CSV 中原樣輸出（string，不做數值比較）
- enrichCache 持久化後重新開啟頁面 → 不重複 fetch

### 5.3 Edge cases

- 複合型 order 有「請 Click」但我們需要的值（如 WBC/RBC）已在 reportText → 不應觸發 sub-fetch
- Aluminum 已在主頁面展開，即使 order 有「請 Click」（其他值未展開）→ Aluminum 不在 missingIds，不觸發
- `searchItem=鋁`（中文）在 ernode API 回傳 0 筆 → 確認 enrichment 只用 ordapno fetch 子頁面，不依賴 searchItem

---

## 6. PROJECT_CONTEXT.md 更新

- §0 Milestones：加上 Aluminum + 統一 enrichment 的 milestone
- §8 Form reference：Aluminin 從 DEFERRED 改為 `Aluminum` with catalog ID
- 若 enrichment 機制改變了 cache 行為，更新相關段落

---

## 7. 風險 & 注意事項

- `Result: N` 格式太通用，不能當 catalog regex，只能透過 enrichment + orderName 轉譯
- 子頁面 opdweb 伺服器可能有 rate limit → maxFetches 上限 15
- reporter 原本沒有 sub-page fetch → 新增的 fetch 需要處理 CORS / credentials
- enrichCache 隨時間增長 → 考慮只保留近 2 年的 ordapno，或 lazy cleanup
- `<2` 等帶 `<>` 符號的值：regex capture 為 string（如 `"<2"`），alarm 比較邏輯需處理非純數值（跳過或視為 0）
- `searchItem=鋁`（中文 URL encode）在 ernode API 搜不到 → 用 `searchItem=alu` 才有結果。此問題僅影響手動搜尋，不影響 enrichment（enrichment 用 ordapno 直接 fetch 子頁面）
- 「請 Click」出現規律：大約超過 1 年的報告不會展開。reporter 12 個月 cutoff 內的最新值大多已在主頁面，enrichment 主要補歷史資料。但 annual test 如 Aluminum 一年才一筆，可能剛好落在邊界
