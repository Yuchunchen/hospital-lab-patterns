# TASK_BRIEF_reporter_orderNameFilter

> Cowork → Claude Code 交付。reporter 抽值層補上 catalog `orderNameFilter` 支援。
> 建立日期：2026-11-05（vhtt Cowork）。來源：SOP F→B 偵錯 vhtt `[病歷號]` eGFR = 0。
> 執行：**Claude Code**（reporter `core/` 邏輯改動 + 兩個 build 產物 + 回歸驗證，大半徑）。

## 背景

2026-11-05 catalog 修正（patterns WORKLOG 同日條目）：CREAT / eGFR 加
`orderNameFilter: /^(?!.*(?:urine|creatinine\(u\))).*/i`，排除尿液單。

起因：vhtt `[病歷號]`（M/72）115/10/29 同日兩張單——

| OrderName | reportText | 應否進 CREAT |
|---|---|---|
| `BUN(TT),NA(TT),K(TT),Creatinine(TT) BLOOD` | `Creatinine(serum): 0.9` | ✓ |
| `腎利先鋒計畫 Urine Creatinine(TT) URINE` | `CREAT: 101`（尿 Cr） | ✗ |

CREAT pattern 的 `CREAT:` alternation 命中尿 Cr → eGFR ≈ 0.3 → 顯示 0（正確 91）。

**問題**：catalog 修正只修到 viewer（`report.js:148`、`dashboard.js:85` 有檢查
`orderNameFilter`）。reporter 的 `core/lab-extract.js` `extractLabValues()`
內層迴圈只跑 `text.match(test.pattern)`，**從未檢查 `test.orderNameFilter`**
（只有 subpage enrichment 的 `orderNameMatch` 有用到）。

## 影響面

- **reporter CKD / dialysis**：CREAT 同日會同時存血清值與尿 Cr（dedupe 只擋同值），
  eGFR / GFRStage / KDIGORisk / TaiwanCKD / EarlyCKD 可能用到尿 Cr。
  vhtt 腎利先鋒計畫自 115/07 起拆單（Urine Creatinine 獨立醫令），受影響面推測是
  該計畫所有同日抽血＋驗尿的病人（**推論，未逐一驗證**）。
- `Urine total protein` 單的 `T.PROT/CREAT:` 也會被 CREAT pattern 命中（同類）。
- catalog 既有的 UACR / FreePSA / UrineOB / UrineGlucose `orderNameFilter`
  在 reporter 同樣從未生效（若該 id 在該 html 的 `LAB_TESTS` 內）。

## 提議改動

### 1. `core/lab-extract.js` `extractLabValues()` 內層迴圈

在 `const match = text.match(test.pattern);` 之前加：

```js
if (test.orderNameFilter && !ORDER_FILTER_EXEMPT.has(test.id)
    && !test.orderNameFilter.test(orderName)) continue;
```

### 2. BUN_pre / BUN_post 豁免（⚠️ 須保護既有行為）

catalog 的 `BUN_pre: /,/`、`BUN_post: /^BUN$/i` 在 reporter **刻意不生效**——
`classifyBUNPrePost()` 假設兩個 array 都收到每一筆 BUN，再依 signOffTime
（Method A）／orderName（Method B）重分。若直接開啟 filter，會在分類前就把 BUN
切掉，改變 URR / KiDiTi 匯出。

**預設做法（待 YC 確認）**：code 端豁免
`const ORDER_FILTER_EXEMPT = new Set(['BUN_pre', 'BUN_post']);`，附註解說明原因。

替代方案：把 BUN_pre / BUN_post 的 `orderNameFilter` 從 catalog 拿掉（目前只有
reporter 用這兩個 id，filter 等同死設定）。較乾淨，但屬 catalog 改動、要再走一次
release + 三 repo sync。→ 開工前問 YC 選哪個。

### 3. build 產物

`node build.js dialysis` + `node build.js ckd` 重產兩個 html。
legacy `hospital-lab-data.html`（monolith，非 end-user）是否同步 patch：預設**不動**，
WORKLOG 註明；YC 另有指示再改。

### 4. 開工前先查清楚（不確定點）

- 各 html 的 `LAB_TESTS` 實際組成：`build.js` 用 `_resolveManifest(REPORTER_MANIFEST, CATALOG)`，
  但 `REPORTER_MANIFEST` 不含 UACR / UrineOB / UrineGlucose，而 `groups/early-ckd.js`
  `labManifest` 有。確認 CKD html 的 UACR 從哪條路徑抽值、會不會經過本修改。
- reporter 既有 IndexedDB 資料是「存值」還是「存 orders 再重抽」→ 決定修完後
  使用者要不要按「全部更新」才看得到正確值，寫進 WORKLOG / 交付說明。

## 成功標準

1. vhtt `[病歷號]` 在 reporter（該病人所在 group）重抓後：115/10/29 CREAT 只有
   **0.9** 一筆（無 101）；該日 eGFR = **91**，GFRStage = 正常。
2. dialysis group BUN 洗前／洗後與 URR 結果與修改前**完全一致**（無回歸）。
3. 尿液單（`Urine Creatinine`、`Urine total protein`、合併式 `Urine Microalbumin`、
   vhyl `Creatinine(U)`）不再進 CREAT。
4. 兩個 build html 由 `build.js` 重產、內容含新邏輯；WORKLOG（繁中）記錄。

## 測試清單

| # | 業務行為 | 方法 |
|---|---|---|
| T1 | 同日血清＋尿 Cr：CREAT 只留血清值 | node fixture：兩張 order（上表）餵 `extractLabValues` → `CREAT` 該日只有 0.9 |
| T2 | 尿蛋白單 `T.PROT/CREAT:` 不污染 CREAT | node fixture：`Urine total protein(TT) URINE` + `T.PROT/CREAT: 0.21` → CREAT 無此筆；UPCR 照抓 |
| T3 | 醫令名稱空白不被誤擋 | fixture：`orderName:''` + `CREAT: 1.0` → CREAT 有 1.0 |
| T4 | BUN 洗前／洗後分類不變 | fixture：同日 composite panel BUN（洗前）＋單獨 `BUN` 單（洗後）→ 修改前後 `BUN_pre` / `BUN_post` / URR 結果相同（before/after snapshot diff = 0） |
| T5 | 既有 filter 在 reporter 生效且無副作用 | 若 UACR 在 LAB_TESTS：`Free PSA(TT)` `RATIO: 4.8` 不進 UACR；vhtt 拆單 `Urine Creatinine(TT)` `ALB/CR: 158.68` 照進 UACR |
| T6 | eGFR 衍生值正確 | fixture 跑 compute：T1 資料 + M/72 → eGFR 91、GFRStage 正常 |
| T7 | 真機（vhtt） | reporter 重抓 `[病歷號]` → 符合成功標準 #1；dialysis 抽一位既有病人比對 URR / KiDiTi 匯出與修改前一致 |

## 交付

- reporter commit（core + 兩個 build html + WORKLOG）
- 本 brief 改名 `_done`（rule #6，同最後一個 commit 那輪，於 patterns repo）
- push 前問 YC（rule #3）；push 後同步 Notion Dashboard（rule #7）
