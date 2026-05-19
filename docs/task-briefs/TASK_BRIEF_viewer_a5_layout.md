# TASK_BRIEF — viewer repo:A5 landscape 單表版型

> **Status:** ACTIVE — 等接手實作(建議 Claude Code,跨 patterns + viewer 兩 repo)
> **Last updated:** 2026-05-20
> **Scope:** `patterns/viewer.js VIEWER_A5_MANIFEST` + viewer `popup.js renderResults/handlePrint` + `report.js generatePatientPages/generateReport/generateMultiReport` + REPORT_CSS_A5 + `manifest.json`
> **Spec 來源:** 2026-05-20 Cowork session,mockup 已 YC review 完(`hospital-lab-viewer/mockups/a5-layout-mockup.html`)
> **所有設計決策已決議** — 詳見 § 10
> **執行完畢後請改名為 `TASK_BRIEF_viewer_a5_layout_done.md`(rule #6)**

---

## 1. 問題陳述 / 動機

現有 viewer 列印只支援 **A4 landscape 4-column**,適合醫師判讀(3 timepoint + 完整 section box)。
但有兩種情境需要更精簡的列印版:

1. **病人帶走的衛教/紀錄單** — A4 太大、密度過高、不適合放健保卡夾或衛教資料夾
2. **快速 quick glance** — 醫師時間緊時,只想看最新一筆 + 是否異常

mockup 比較後決定:**A5 landscape 單表格、最新值、Excel 風**。原因見 2026-05-20 Cowork session 結論。

附帶兩個新項目:**eGFR**(估算腎絲球過濾率)與**慢性腎臟病分期**(EarlyCKD: 正常 / P1 / P2)。eGFR 與 EarlyCKD 在 catalog/computed 已存在(`patterns-computed.js` HELPERS、`report.js calcEGFR/getEarlyCKDClass`),這次只是把它們納入 A5 列印項目。

---

## 2. 設計策略(重點 + spec 邊界)

### 2.1 觸發與 UI(YC 已決:checkbox 方案)

popup `renderResults()`(popup.js line 624)現有 print bar:

```
[僅第1頁] [HIV報表] [檢查比對] [🎨 彩色列印] [🖨️ 黑白列印]
```

**新行為**:既有 button 不動,加 checkbox:

```
[僅第1頁] [HIV報表] [📄 A5單頁] [檢查比對] [🎨 彩色列印] [🖨️ 黑白列印]
```

- `[📄 A5單頁]` checkbox 勾選後,彩色/黑白列印兩個 button 都改走 A5 路徑
- 不勾 = 現有 A4 行為
- A5 模式下「僅第1頁」「HIV報表」**互斥 disabled**(A5 強制 1 頁、無 HIV column)

理由:button 多 2 個會塞;checkbox 跟既有「僅第1頁」「HIV報表」風格一致,且 A5 本就是 1 頁所以 mutually exclusive 邏輯清楚。

### 2.2 渲染:rounded single-table

A5 landscape (210 × 148 mm),@page margin 5mm,可用內容區約 200 × 138 mm。

**單一表格**(沿用 mockup `.excel-style` 規格):
- `border-collapse: separate` + `border-radius: 6px` + `overflow: hidden` → 4 角圓
- 4 欄:`名稱 | 數值 | 正常值 | 檢驗日期`(30% / 14% / 34% / 22%)
- 表頭灰底(`#f0f0f0`)
- **只顯示最新一筆**(沿用 report.js 既有 `buildResultMap` 出來的 vals[0])
- 數值偏高 → 紅 `#c0392b`(沿用 valueStyle)
- 數值偏低 → 藍 `#2471a3`
- 性別不適用 → 不出現(沿用 genderFilteredTests)

**頁頭**(沿用 A4):
- 中央:院名 title
- 副資訊:姓名 / 病歷號 / 性別 / 年齡 / 列印日期
- 右上角:visitSerial overlay(`.visit-serial-overlay`,40pt 淺灰,沿用 v1.3.0 邏輯;A5 字級從 48pt 縮成 40pt)

**Legend**:紅 = 偏高、藍 = 偏低(A5 不顯示「最新數值」灰底 legend,因為只有最新值)

### 2.3 Manifest 來源(YC 已決:patterns 加 `VIEWER_A5_MANIFEST`)

`hospital-lab-patterns/patterns/viewer.js` 新增:

```js
const VIEWER_A5_MANIFEST = [
  { id:'GluAC',     order:1,  section:'血糖' },
  { id:'HbA1c',     order:2,  section:'血糖' },
  { id:'CHOL',      order:3,  section:'血脂' },
  { id:'TG',        order:4,  section:'血脂' },
  { id:'HDLC',      order:5,  section:'血脂' },
  { id:'LDL',       order:6,  section:'血脂' },
  { id:'BUN',       order:7,  section:'腎' },
  { id:'CREAT',     order:8,  section:'腎' },
  { id:'eGFR',      order:9,  section:'腎' },
  { id:'GOT',       order:10, section:'肝' },
  { id:'GPT',       order:11, section:'肝' },
  { id:'UA',        order:12, section:'其他' },
  { id:'UACR',      order:13, section:'腎' },
  { id:'GFRStage',  order:14, section:'腎臟病分期' },
  { id:'EarlyCKD',  order:15, section:'腎臟病分期' },
];
```

跑 `sync-patterns.js` → 帶入 viewer `mapping.js`,buildA5Page 讀此 list。
理由:跟現有 `VIEWER_MANIFEST` 架構一致,單一 source of truth,以後改 A5 項目只動一處。
順序為 YC 2026-05-20 確認版本。

### 2.4 「eGFR 分期」+「慢性腎臟病分期」兩個都留(YC 已決)

mockup 三層腎臟 summary 全部保留:
- **eGFR 數值**(例:99)
- **eGFR 分期** (`GFRStage`):正常 / CKD2 / CKD3a / CKD3b / CKD4 / CKD5
- **慢性腎臟病分期** (`EarlyCKD`):正常 / P1 早期 / P2 中晚期

醫學意義:`GFRStage` 是 KDIGO 純 G 軸;`EarlyCKD` 是台灣健保 Pre-ESRD 二分(含 damage marker 判斷)。
兩者在某些案例會分歧(如本案 eGFR=99 → GFRStage=正常 但 EarlyCKD=P1 早期,因 UACR 觸發 damage marker)。
YC 2026-05-20 確認兩個都留可幫助快速從 G 軸跨到 P 軸理解,且只多 1 列。

### 2.5 正式版型不視覺標記新項目(YC 已決)

mockup 初版用淺藍底(`.new-row`)+「新增」chip(`.new-tag`)標記新加入的列。**正式版型移除**。
理由:新項目(eGFR / GFRStage / EarlyCKD)對醫師、病人都是普通檢驗欄位,沒必要視覺強調。標記只在開發 review 階段有用,production 不留痕跡。

實作意義:`buildA5Page` 渲染 row 時,**不要**對某些 id 加特殊 class。所有 row 視覺一致。

### 2.6 邊界 case(已預設,YC 可改)

| Case | A5 行為 |
|---|---|
| `eGFR` 算不出來(無 Cr 資料 / 無 age) | 列照印,值欄顯示 `—` |
| UACR 沒抓到 → `EarlyCKD` 無法判 | 值欄顯示 `—`,不顯示 P1/P2 |
| 男性病人不適用某項(如 CA125 — 但 A5 沒列癌指,本案無此 issue) | 沿用 genderFilteredTests,直接 skip |
| Multi-patient batch print | 每病人 1 頁,沿用 `generateMultiReport` |
| visitSerial overlay | 沿用 v1.3.0 邏輯,A5 字級 40pt(非 48pt) |
| B&W mode | A5 也支援。`body.bw` 規則沿用 |
| 「僅第1頁」 / 「HIV報表」 | A5 模式下兩個 checkbox **disabled**(A5 強制 1 頁、無 HIV column) |

---

## 3. 改動範圍

僅 viewer repo(Option B);或 viewer + patterns 兩 repo(Option A,patterns 改完跑 sync)。

### 3.1 `popup.html` / `popup.js`

#### popup.html(line 263 附近 header,或 line 138 .btn-print CSS 下方)

無需改動。print bar 是 popup.js `renderResults` 動態渲染。

#### popup.js renderResults(line 624)

`printBtns` template literal 加 A5 checkbox:

```js
const printBtns =
  `<label class="page1-only-label"><input type="checkbox" id="page1-only-cb" checked /> 僅第1頁</label>` +
  `<label class="page1-only-label"><input type="checkbox" id="hiv-report-cb" /> HIV報表</label>` +
  `<label class="page1-only-label"><input type="checkbox" id="a5-layout-cb" /> 📄 A5單頁</label>` +    // ← 新增
  ` <button class="btn-print btn-debug" id="debug-btn">檢查比對</button>` +
  ` <button class="btn-print" id="print-color-btn">🎨 彩色列印</button>` +
  ` <button class="btn-print btn-print-bw" id="print-bw-btn">🖨️ 黑白列印</button>`;
```

加 A5 mutual-exclusive 邏輯(在 `print-color-btn` listener 註冊那邊):

```js
const a5Cb = document.getElementById('a5-layout-cb');
const p1Cb = document.getElementById('page1-only-cb');
const hivCb = document.getElementById('hiv-report-cb');
a5Cb?.addEventListener('change', () => {
  if (a5Cb.checked) {
    p1Cb.disabled = true; p1Cb.checked = true;
    hivCb.disabled = true; hivCb.checked = false;
  } else {
    p1Cb.disabled = false;
    hivCb.disabled = false;
  }
});
```

#### popup.js handlePrint(line 657)

讀 a5 flag,改傳給 generateReport / generateMultiReport:

```js
async function handlePrint(bw) {
  // ...
  const page1Only  = document.getElementById('page1-only-cb')?.checked || false;
  const hivReport  = document.getElementById('hiv-report-cb')?.checked || false;
  const a5Layout   = document.getElementById('a5-layout-cb')?.checked || false;  // ← 新增
  // ...
  const html = generateReport(info, allOrders, bw, CONFIG.REPORT_TITLE, page1Only, hivReport, a5Layout);
  // 或 multi-patient:
  const html = generateMultiReport(patients, bw, CONFIG.REPORT_TITLE, page1Only, hivReport, a5Layout);
}
```

### 3.2 `report.js`

#### (a) `generateReport` / `generateMultiReport` / `generatePatientPages` signature 加 `a5Layout`

```js
function generateReport(patientInfo, orders, bw, title, page1Only, hivReport, a5Layout) {
  const pages = generatePatientPages(patientInfo, orders, bw, title, page1Only, hivReport, a5Layout);
  // ...rest unchanged
}

function generateMultiReport(patients, bw, title, page1Only, hivReport, a5Layout) {
  // ... loop calls generatePatientPages(..., a5Layout)
}

function generatePatientPages(patientInfo, orders, bw, title, page1Only, hivReport, a5Layout) {
  // ... existing logic
  if (a5Layout) return buildA5Page(patientInfo, orders, bw, title);
  // 否則跑現有 A4 邏輯
}
```

#### (b) 新增 `buildA5Page(patientInfo, orders, bw, title)`

```js
// Read from VIEWER_A5_MANIFEST (synced from patterns repo into mapping.js).
// VIEWER_A5_MANIFEST is the source of truth — do NOT hardcode IDs here.

function buildA5Page(patientInfo, orders, bw, title) {
  // Get the ordered list of test IDs from the manifest.
  const a5Ids = (typeof VIEWER_A5_MANIFEST !== 'undefined' ? VIEWER_A5_MANIFEST : [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(e => e.id);
  const { name='', chartno='', gender='', age='', printDate='', visitSerial=null } = patientInfo;
  const tests       = genderFilteredTests(gender, false);  // a5 不支援 HIV
  const numMap      = buildResultMap(orders, tests, patientInfo);
  const textMap     = buildTextResultMap(orders, tests);
  const resultMap   = { ...numMap, ...textMap };
  const headerTitle = title || DEFAULT_REPORT_TITLE;
  const visitSerialOverlay = visitSerial
    ? `<div class="visit-serial-overlay-a5">${h(String(visitSerial))}</div>` : '';
  const subInfo = [
    `姓名:${h(name)}`, `病歷號:${h(chartno)}`, `性別:${h(gender)}`,
    `年齡:${h(String(age))}歲`, `列印日期:${h(printDate)}`
  ].join('　');

  // Build rows in a5Ids (manifest) order; latest value only.
  // Each test:render <tr> name/value/ref/date,kind:'text' skip.
  // 注意:所有 row 視覺一致,不對特定 id(eGFR/GFRStage/EarlyCKD)加特殊 class — § 2.5。
  const rowsHtml = a5Ids.map(id => {
    const test = tests.find(t => t.id === id);
    if (!test || test.kind === 'text') return '';
    const entry = (resultMap[id] || [])[0];
    if (!entry) return `
      <tr><td class="name">${h(test.displayName)}</td>
          <td class="value">—</td>
          <td class="ref">${h(test.ref || '')}</td>
          <td class="date">—</td></tr>`;
    let valStyle = '';
    if (entry._tag) valStyle = psaRatioStyle(entry._tag, bw);
    else            valStyle = valueStyle(entry.value, test, bw, false, gender);
    return `
      <tr><td class="name">${h(test.displayName)}</td>
          <td class="value" style="${valStyle}">${h(entry.value)}</td>
          <td class="ref">${h(test.ref || '')}</td>
          <td class="date">${h(entry.date)}</td></tr>`;
  }).join('');

  return `
    <div class="page-a5">
      ${visitSerialOverlay}
      <div class="page-header">${h(headerTitle)}</div>
      <div class="page-sub">${subInfo}</div>
      <table class="excel-style-a5">
        <colgroup>
          <col style="width:30%"><col style="width:14%"><col style="width:34%"><col style="width:22%">
        </colgroup>
        <thead>
          <tr><th>名稱</th><th>數值</th><th>正常值</th><th>檢驗日期</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="legend">
        <span><span class="leg-hi">紅色</span> = 偏高</span>
        <span><span class="leg-lo">藍色</span> = 偏低</span>
      </div>
    </div>`;
}
```

#### (c) REPORT_CSS 追加 A5 規則

CSS 規格從 `mockups/a5-layout-mockup.html` 抽出,改前綴避免跟 A4 衝突:

```css
/* ─── A5 layout (single rounded table) ─────────────────────────────── */
/* 重要:用顯式寬高(210mm × 148mm)指定 landscape,不要用 `A5 landscape` keyword。
   原因:有些印表機 driver 不認 keyword,fall back 到紙匣預設方向(portrait),
   實際列印會看到內容在 portrait 紙上轉 90 度。Chrome preview 是 OK 的(Chrome
   honor keyword),但 driver 不一定。YC 2026-05-20 mockup 實機列印踩到此坑。 */
@page { size: 210mm 148mm; margin: 5mm; }
/* 注意:@page 規則在實作時要根據 a5Layout 動態切換 — 見下面 caveat */

.page-a5 {
  position: relative;
  width: 100%;
  padding: 2mm 4mm;
  page-break-after: always;
}
.page-a5:last-child { page-break-after: auto; }

.visit-serial-overlay-a5 {
  position: absolute;
  top: 3mm; right: 6mm;
  font-size: 40pt; font-weight: 900;
  color: #AAAAAA; line-height: 1; z-index: 1000;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}

table.excel-style-a5 {
  width: 100%;
  border-collapse: separate; border-spacing: 0;
  table-layout: fixed;
  font-size: 9pt;
  border: 0.7pt solid #555;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 2mm;
}
table.excel-style-a5 th,
table.excel-style-a5 td {
  border-right: 0.7pt solid #555;
  border-bottom: 0.7pt solid #555;
  padding: 0.9mm 2mm;
  text-align: center;
  line-height: 1.25;
}
table.excel-style-a5 th:last-child,
table.excel-style-a5 td:last-child { border-right: none; }
table.excel-style-a5 tr:last-child td { border-bottom: none; }
table.excel-style-a5 th {
  background: #f0f0f0; font-weight: 700; font-size: 9pt;
}
table.excel-style-a5 td.name {
  text-align: left; font-weight: 600; font-size: 8.8pt;
}
table.excel-style-a5 td.value {
  font-weight: 700; font-size: 11pt;
}
table.excel-style-a5 td.ref { font-size: 7.8pt; color: #444; }
table.excel-style-a5 td.date { font-size: 8pt; color: #555; }
```

> **重要 caveat**:CSS `@page size` 是 page-level,**無法**根據 element class 動態切換到 A5。
> 解法:`buildA5Page` 自己生整個 HTML wrapper(不走 `generateReport` 的 `<style>${REPORT_CSS}</style>` 包裝),用自己一份 `@page { size: A5 landscape; }` REPORT_CSS_A5。或在 generateReport 判斷 `a5Layout` 後 swap REPORT_CSS。
> **推薦做法**:抽一個 `const REPORT_CSS_A5 = ...` 跟 `REPORT_CSS` 並列,`generateReport` 依 `a5Layout` 選一份注入。

### 3.3 `manifest.json`

`"version": "1.3.0"` → `"1.4.0"`(新使用者可見功能 — minor bump)

### 3.4 (Option A only)`hospital-lab-patterns/patterns/viewer.js` + sync

若走 Option A:
1. patterns/patterns/viewer.js 末尾 export `VIEWER_A5_MANIFEST`(內容見 § 2.3)
2. `cd hospital-lab-viewer && node sync-patterns.js` → mapping.js 帶入
3. `buildA5Page` 改用 `VIEWER_A5_MANIFEST` 而非 hardcoded `A5_LAYOUT_IDS`

---

## 4. 測試清單(完成前必跑)

### 4.1 A5 基本

1. **單病人 A5 彩色**:勾「A5單頁」+ 按「彩色列印」 → 開新 tab,Ctrl+P preview 為 A5 landscape 1 頁,15 列項目齊全(順序見 § 2.3),eGFR 與 EarlyCKD 兩列有數值或 `—`
2. **單病人 A5 黑白**:同上但按「黑白列印」 → 紅藍顏色變粗體底線/斜體,表格圓角仍在
3. **多病人 A5(2 人)**:tabular paste 2 行 → A5 列印 2 頁,每頁右上角各自 visitSerial,字級 40pt
4. **eGFR 算得出來的案例**(有 CREAT + 病人 age + gender):顯示數字,例如 99
5. **eGFR 算不出來**(只有 CREAT 沒 age):顯示 `—`,不報錯
6. **EarlyCKD 觸發 P1**(UACR ≥ 30 + eGFR ≥ 45):顯示「P1 早期」紅色
7. **EarlyCKD = 正常**(UACR < 30 + eGFR ≥ 60):顯示「正常」黑色

### 4.2 UI 互斥邏輯

8. **勾 A5 → 「僅第1頁」自動 checked + disabled、「HIV報表」自動 unchecked + disabled**
9. **取消 A5 → 兩個 checkbox 恢復可用**
10. **A4 模式行為不變**:不勾 A5 → 走原 4-column,所有測試 case 仍綠(regression)

### 4.3 視覺驗收

11. **Chrome 內建 PDF preview**:列印前 preview → A5 landscape 比例對(寬:高 ≈ 210:148),表格圓角清楚,無 element 被切
12. **實機印表機列印**(挑一台辦公室常用機):A5 紙列印,表格邊框、圓角、visitSerial 都印得出來;**特別檢查紙張方向不會 90° 轉**(此坑歷史見 § 7 風險點 2 — 用顯式寬高 `210mm 148mm` 才不會踩到);若 B&W 老印表機 #AAAAAA halftone 太糊,記錄下來(後續微調)
13. **A4 → A5 切換不殘留**:列印一次 A4、勾 A5、再列印 → A5 出來不會帶 A4 殘留 CSS

### 4.4 Regression

14. **A4 既有功能**:對既有 chartno 做 search + 列印 A4(不勾 A5) → lab/imaging/reminder/legend/4-col/visitSerial 全部正常
15. **WORKLOG.md (viewer)** 加一條繁中,格式見 § 8

---

## 5. 實作步驟

建議 **Claude Code 開 session**(跨 patterns + viewer 兩 repo,以 Cowork 跨 repo 操作略繁瑣)。

1. 從 workspace root 啟 Claude Code,讀本 brief + mockup(`hospital-lab-viewer/mockups/a5-layout-mockup.html`)
2. **patterns repo**:
   - 編 `hospital-lab-patterns/patterns/viewer.js`,末尾加 `VIEWER_A5_MANIFEST`(內容見 § 2.3)
   - 確認 patterns 的 `index.js` / build 腳本有 export 這個常數(若沒有,要補)
   - 更新 patterns 自家 WORKLOG.md
   - commit,**停下來等 YC 說 push**(rule #3)
3. **回 viewer repo**(patterns push 完之後):
   - `cd hospital-lab-viewer && node sync-patterns.js` → 把 `VIEWER_A5_MANIFEST` 帶入 `mapping.js`
   - **驗證 mapping.js 確實多了 `VIEWER_A5_MANIFEST` block**(若 sync-patterns.js 不認得新的 export,要先擴它)
4. 編 `popup.js renderResults`(line 624)加 `a5-layout-cb` + mutual-exclusive listener
5. 編 `popup.js handlePrint`(line 657)讀 `a5Layout` flag,傳給 generateReport/generateMultiReport
6. 編 `report.js`:
   - signature 加 `a5Layout` 參數(generateReport / generateMultiReport / generatePatientPages)
   - 新增 `buildA5Page()`(見 § 3.2(b),讀 `VIEWER_A5_MANIFEST`)
   - 新增 `REPORT_CSS_A5`(見 § 3.2(c)),`generateReport` 依 `a5Layout` 選一份注入
7. 編 `manifest.json` — version 1.3.0 → 1.4.0
8. 重打包、side-load Chrome 測試
9. 跑 § 4 所有測試清單,有 fail 就修
10. 用繁中更新 `hospital-lab-viewer/WORKLOG.md`
11. viewer git add + commit,顯示 commit message,**停下來等 YC 說 push**(rule #3)
12. patterns + viewer 兩 repo 都 push 完跟 YC 說「好了」 → 同步 Notion Dashboard:這條 brief 狀態改 Done(rule #7)
13. `git mv TASK_BRIEF_viewer_a5_layout.md → _done.md`(rule #6),同 patterns push 最後一個 commit 一起

---

## 6. 跨 repo 副作用

patterns → viewer 一次 sync(VIEWER_A5_MANIFEST)。
reporter **不**用動 — reporter 沒有 A5 列印需求,這條 brief 不擴展到 reporter。

若以後 reporter 也想 A5,需另開 brief。本輪 viewer-only。

---

## 7. 風險 / 注意

1. **`@page size: A5 landscape` 沒法跟 `@page size: A4 landscape` 在同一份 HTML 共存** — 必須在 `generateReport` 入口決定走哪一份 REPORT_CSS。不要把兩個 `@page` 規則都塞進同一份 stylesheet,Chrome 會用後面的覆蓋前面的(無法 page-level 切換)
2. **`@page size` 一定要用顯式寬高 `210mm 148mm`,不要用 keyword `A5 landscape`** — Chrome preview 兩種寫法都顯示 landscape OK,但某些印表機 driver 不認 keyword,fall back 到紙匣預設方向(portrait),導致實機列印「內容在 portrait 紙上轉 90 度」。YC 2026-05-20 mockup 實機列印踩到此坑,改顯式寬高後解決
3. **`buildA5Page` 沒走 4-column 路徑,所以 `buildColumn`/`buildSectionBox` 都不用** — 但 `buildResultMap` / `genderFilteredTests` / `valueStyle` 等 helper 仍要重用,別重複寫
4. **A5 紙印表機支援**:確認辦公室印表機 A5 紙匣 / 手動進紙正常,否則做完使用者印不出來
4. **eGFR `—` 時 EarlyCKD 也會 `—`**(計算依賴 eGFR) — 預期行為,不算 bug,但測試 case (5) 要驗證 graceful
5. **未來擴展(超出本輪)**:
   - A5 portrait 版(若衛教用更小)
   - 自訂 A5 manifest UI(讓 YC 在 popup 內勾選哪些項目進 A5,不用每次改 code) → 大概要等 A5 用熟、需求明確再做
6. **PR 大小估計**:Option A 約 +120 行 CSS、+100 行 JS、+20 行 manifest;Option B 約 +120 行 CSS、+110 行 JS。屬中等

---

## 8. WORKLOG.md 條目模板(`hospital-lab-viewer/WORKLOG.md`)

```markdown
## 2026-05-?? — viewer:A5 landscape 單表版型(v1.4.0)

**動機:** 病人衛教/紀錄單需要 A4 以外的更精簡版型;同時把 eGFR + 慢性腎臟病分期(EarlyCKD)
納入列印。

**改動:**
- `popup.js renderResults`:print bar 加 `📄 A5單頁` checkbox + 跟「僅第1頁」「HIV報表」
  mutually-exclusive listener。
- `popup.js handlePrint`:讀 `a5Layout` flag,傳給 generateReport / generateMultiReport。
- `report.js`:
  - signature 加 `a5Layout` 參數穿透到 generatePatientPages。
  - 新增 `buildA5Page()` — 單表格,15 個 id 固定順序(or 讀 VIEWER_A5_MANIFEST),
    最新值,4 欄(名稱/數值/正常值/檢驗日期)。
  - 新增 `REPORT_CSS_A5`,`@page size: A5 landscape; margin: 5mm`,圓角表格 `border-radius: 6px`。
  - `visit-serial-overlay-a5` 字級 40pt(非 A4 的 48pt)。
- `manifest.json`:1.3.0 → 1.4.0。
- (若 Option A)patterns repo:`patterns/viewer.js` 加 `VIEWER_A5_MANIFEST`,sync 進 viewer/mapping.js。

**Spec 邊界:** A5 模式強制 1 頁、無 HIV column;UI checkbox mutually-exclusive 防呆。
eGFR / EarlyCKD 算不出來時顯示 `—`,不報錯。

**測試:** 7 case A5 基本 / 3 case UI 互斥 / 3 case 視覺 / 2 case regression 全綠。

**跨 repo:** Option A 走 patterns → viewer sync;Option B 無。
```

---

## 9. 預計工時

- 實作:3–4 小時(patterns + viewer + sync + UI + CSS,跨 repo 流程)
- 列印實機測試:45 分鐘(A4 + A5 各印幾張,B&W 切換)
- WORKLOG / commit / push / Notion 同步:20 分鐘

合計:**約 1 個工作天**。

---

## 10. YC 已決議事項(2026-05-20 Cowork session)

1. **Manifest 來源** → **Option A**:patterns repo 加 `VIEWER_A5_MANIFEST`,sync 進 viewer
2. **三層腎臟 summary** → **兩個都留**(`GFRStage` + `EarlyCKD`)
3. **項目順序** → 按 § 2.3 預設順序(血糖 → 血脂 → 腎(BUN/Cr/eGFR) → 肝 → 尿酸 → UACR → 分期)
4. **A5 print buttons** → **checkbox 方案**(§ 2.1)
5. **正式版型不標記新項目** → 移除淺藍底 + 「新增」chip;所有 row 視覺一致(§ 2.5)

---

## 11. 印表機設定 SOP(實機運維)

YC 2026-05-20 實機驗收找到的 driver 設定。Brother HL-L5100DN(玉里分院辦公室)印 A5 衛教單必選:

| 欄位 | 值 |
|---|---|
| 紙張大小 | **A5 Long Side**(不是普通 `A5` — 那是短邊先進) |
| 方向 / Orientation | 橫向(Landscape) |
| 紙張來源 | 手動送紙 / MP tray |
| 紙張裝載 | A5 紙橫放,長邊(210mm)先進印表機 |

**為什麼**:Brother driver 把 `A5` 與 `A5 Long Side` 視為兩個不同的 paper size。`A5` 預設短邊先進(driver 認為紙是直向 148×210),收到 Chrome 送出的 `210mm × 148mm` 內容會自動旋轉 90° 塞進去 → 印出來紙橫向、內容轉 90°。`A5 Long Side` 告訴 driver 紙是長邊先進(已是橫向 210×148),1:1 對位不旋轉。

程式碼層已盡可能 hint(`report.js REPORT_CSS_A5` `@page { size: 210mm 148mm; margin: 5mm }` 顯式寬高,不用 `A5 landscape` keyword — 顯式寬高 driver 比較認;見 viewer commit `bf90912`)。但選紙匣 / orientation 是 driver 層決定,瀏覽器無法強制蓋過。

**沒選對的症狀**:Chrome PDF preview 看起來正常,但實機列印紙橫向出、內容轉 90°(讀的時候要把紙轉回來)。

### 11.1 改 Brother driver 全域預設(若印表機主要印 A5 衛教單)

Windows「裝置和印表機」→ Brother HL-L5100DN → 右鍵「列印喜好設定」→ 基本標籤 → 紙張大小 = A5 Long Side / 方向 = 橫向 / 紙張來源 = MP tray → 套用。

**取捨**:這台印表機若還要印 A4(其他病患報表、HIV 報表),每次都要手調回 A4 + Tray 1 — 等於麻煩搬家。

### 11.2 同一台印表機系統裝兩份(推薦,混合用情境)

「裝置和印表機」→ 新增印表機 → 同一個 IP / port,取兩個名:

- **「Brother A5 衛教單」** — 預設 A5 Long Side / Landscape / MP tray
- **「Brother A4 一般」** — 預設 A4 / Auto / Tray 1

Chrome 列印對話框「目的地」選哪台,設定跟著走 — 護理站印 A5 衛教單前只要選對印表機名稱,不用再碰其他設定。

### 11.3 換印表機 / 其他院區

相同 Brother driver 一般都有 `A5 Long Side` 區分;若換非 Brother 機型,先在 driver 找有沒有對應「A5 長邊送紙 / A5 LEF / A5 (Long Edge Feed)」option。若 driver 完全沒有 → 只能讓紙匣物理上長邊先進 +`@page` 維持顯式寬高(目前 `210mm × 148mm` 已是此狀態)。
