# TASK_BRIEF — viewer repo:tabular paste 看診序號右上角 overlay

> **Status:** ACTIVE — 等接手實作（Cowork 或 Claude Code 皆可，code 範圍小）
> **Last updated:** 2026-05-20
> **Scope:** `popup.js splitChartInput` + handlePrint + `report.js generatePatientPages` + REPORT_CSS
> **Spec 來源:** 2026-05-19 vhyl thread,YC 已釐清；本 brief 為實作 spec
> **執行完畢後請改名為 `TASK_BRIEF_viewer_visit_serial_done.md`(rule #6)**

---

## 1. 問題陳述 / 動機

門診時 YC 從 HIS 排程畫面（Excel-style tab-separated）貼一批病歷號到 viewer popup，列印多病人報告。報表本身有病歷號、姓名、性別、年齡，但**沒有「看診序號」**。

實際使用情境：護理站把報表交給診間時，**看診序號是病人的識別優先索引**（叫號順序），比病歷號好認。希望每份報表右上角印一個大字看診序號 overlay，輔助分發。

## 2. 設計策略（重點 + spec 邊界）

### 2.1 觸發場景：只在 tabular paste 模式下產生看診序號

`popup.js splitChartInput()` 已經有三條 input path（line 44）：

1. **Tabular paste**：一行 ≥5 個 tab-separated cells（從 Excel 排程畫面貼）→ `cells[4]`（5th col）是病歷號
2. **Free-form**：逗號 / 分號 / pipe / whitespace 分隔 → 純病歷號 list
3. **單一 chartno**：search 欄打一個 chartno

**新行為**：
- 只有 **path 1（tabular）** 從 `cells[0]`（1st col，YC 會改貼上格式讓 col 1 是序號）抓 visitSerial
- path 2 / 3 → visitSerial = null → 報表不顯示 overlay

YC 不會把序號塞進 free-form paste，所以這個分界很乾淨。

### 2.2 視覺：右上角大字 overlay，absolute 定位

每份報表 page 1 + page 2 兩頁**右上角**各印一個 overlay div：

```html
<div class="visit-serial-overlay">3</div>
```

關鍵設計：
- **不影響原 4-column 2-page layout** — overlay 用 `position: absolute`，從 .page flex flow 抽離
- `.page` 加 `position: relative` 作 anchor
- 字大 **48pt**（YC 已 mockup 確認,2 位數序號離 page-header 末端還有舒服距離；門診一上午序號 ≤ 99 已拍板）,右上角 top: 5mm; right: 8mm（@page margin 4mm）
- **字色 #AAAAAA 淺灰**（watermark 風,不搶 lab data 視線；YC 2026-05-20 實測 mockup 後拍板）
- **不設背景色** — 透明背景
- **B&W + 彩色 mode 都印** — overlay 顏色不能用 print-color-adjust 排除規則
- `@media print` 也保留，否則印表機可能切掉 / layout 推開
- **B&W 老印表機注意**:#AAAAAA 在某些老雷射印表機會 halftone dither(網點化)導致糊;若實機印太糊改 #888888

### 2.3 Multi-patient batch print：序號跟著各自病人走

`generateMultiReport` 每位病人 page 1 + page 2 用各自的 visitSerial，不會張冠李戴。無序號的病人那兩頁不印 overlay。

### 2.4 邊界 case（YC 已確認）

| Case | 行為 |
|---|---|
| 單行 tabular paste（1 token，帶 visitSerial） | **仍要 overlay** — Tabular detection 為準，跟 token 數無關 |
| 多行 tabular paste（混 tabular + free-form line） | tabular 行的病人有 overlay，free-form 行的沒有 |
| Tabular 第 1 欄空字串 | 該病人 visitSerial = null → 那位沒 overlay |
| page1Only mode | page 1 一樣印 overlay |
| HIV report mode | 不影響 — overlay 是 page-level，跟 column 無關 |

---

## 3. 改動範圍

僅 viewer repo。三 repo（patterns/reporter/viewer）跨 repo 副作用為**無**。

### 3.1 `popup.js`

#### (a) `splitChartInput` 改回傳結構（line 44–64）

**現況**：return `tokens` = `string[]`（純 chartno）

**新版**：return `tokens` = `Array<{chartno: string, visitSerial: string|null}>`

```js
function splitChartInput(raw) {
  const tokens = [];
  raw.split(/\r?\n/).forEach(line => {
    if (!line.trim()) return;

    const cells = line.split('\t');
    if (cells.length >= 5) {
      // Tabular paste — col 5 (index 4) is the chart number,
      // col 1 (index 0) is the visit serial (clinic appointment order).
      const chartno = cells[4].trim();
      const visitSerial = cells[0].trim() || null;
      if (chartno) tokens.push({ chartno, visitSerial });
      return;
    }

    // Free-form line (no tabs / fewer than 5 cells).
    line.split(/[,;|\s]+/).forEach(t => {
      const s = t.trim();
      if (s) tokens.push({ chartno: s, visitSerial: null });
    });
  });
  return tokens;
}
```

#### (b) 4 個 call site 改讀 `.chartno`

**line 654 `handlePrint(bw)`**：

multi-patient loop（line 678）：

```js
for (let i = 0; i < tokens.length; i++) {
  const { chartno: rawChart, visitSerial } = tokens[i];
  let chartno;
  try { chartno = formatChartNo(rawChart); } catch { skipped++; continue; }

  // ... existing fetch logic, change tokens[i] → rawChart
  const d = await loadData(rawChart, false, () => {});
  // ...
  const info = {
    ...(d.patientInfo || { chartno: d.chartno, name: '', gender: '', age: '' }),
    printDate: new Date().toLocaleDateString('zh-TW'),
    visitSerial,                              // ← 新增
  };
  patients.push({ patientInfo: info, orders: allOrders });
}
```

**single-patient path（line 659, `tokens.length <= 1`）也要接 visitSerial**（YC 拍板:Option A — Tabular detection 為準，單行 tabular 也 overlay）:

```js
if (tokens.length <= 1) {
  const allOrders = [...(data.lab || []), ...(data.rad || [])];
  const tokenVisitSerial = (tokens.length === 1 ? tokens[0].visitSerial : null);
  const info = {
    ...(data.patientInfo || { chartno: data.chartno, name: '', gender: '', age: '' }),
    printDate: new Date().toLocaleDateString('zh-TW'),
    visitSerial: tokenVisitSerial,           // ← 新增
  };
  const html = generateReport(info, allOrders, bw, CONFIG.REPORT_TITLE, page1Only, hivReport);
  // ... rest unchanged
}
```

**line 743 `updateHint`** + **line 764 `doSearch`**：

兩處只關心 chartno，改成 `tokens.forEach(t => { try { formatChartNo(t.chartno); ... } catch {} });`

### 3.2 `report.js`

#### (a) `generatePatientPages` patientInfo 加欄位 + 兩頁加 overlay div（line 949）

```js
function generatePatientPages(patientInfo, orders, bw, title, page1Only, hivReport) {
  const {
    name = '', chartno = '', gender = '', age = '', printDate = '',
    visitSerial = null,           // ← 新增
  } = patientInfo;
  // ... existing logic unchanged

  const visitSerialOverlay = visitSerial
    ? `<div class="visit-serial-overlay">${h(String(visitSerial))}</div>`
    : '';

  const page1 = `
    <div class="page">
      ${visitSerialOverlay}                  // ← 新增（page1）
      <div class="page-header">${h(headerTitle)}</div>
      ...原樣
    </div>`;

  const page2 = hasPage2 ? `
    <div class="page">
      ${visitSerialOverlay}                  // ← 新增（page2）
      <div class="page-header">${h(headerTitle)}</div>
      ...原樣
    </div>` : '';

  return page1 + page2;
}
```

#### (b) REPORT_CSS 新增規則（line 712 起的 template literal）

`.page` 改 `position: relative`（line 725 起），追加 overlay 規則：

```css
.page {
  position: relative;          /* ← 新增，作 overlay anchor */
  width: 100%;
  padding: 2mm 3mm 1.5mm;
  display: flex;
  flex-direction: column;
  page-break-after: always;
}

.visit-serial-overlay {
  position: absolute;
  top: 5mm;
  right: 8mm;
  font-size: 48pt;
  font-weight: 900;
  color: #AAAAAA;              /* 淺灰 watermark 風 — YC 2026-05-20 拍板 */
  z-index: 1000;
  line-height: 1;
  /* 防止 print-color-adjust 把它排掉 — 已在 body 設 exact，這裡保險 */
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  .visit-serial-overlay {
    /* 確保印表機不切掉、layout 不推開 */
    position: absolute;
    top: 5mm;
    right: 8mm;
  }
}
```

**為什麼字色用 #AAAAAA 淺灰**:序號是純識別資訊、不傳值狀態(normal/warning/critical)。淺灰 watermark 風視覺權重比 lab data 低,護理站要看時看得到、診間醫師看 lab 時不被干擾。原本草案用純黑(#000),mockup 預覽後 YC 決定改 #AAAAAA。

### 3.3 `manifest.json`

`"version": "1.2.0"` → `"1.3.0"`（新使用者可見功能 — minor bump）

---

## 4. 測試清單（完成前必跑）

### 4.1 基本功能

1. **Tabular 多人**:Excel 排程畫面複製 3 行（col 1 = 1/2/3，col 5 = 三個 chartno），貼進 chartno-input,按彩色列印 → 列印 6 頁(每人 2 頁),各頁右上角顯示 1/2/3,不錯位
2. **Tabular 單人**:同上但只貼 1 行 → 列印 2 頁(page 1 + page 2),兩頁右上角都顯示該序號(YC 拍板 Option A — Tabular detection 為準)
3. **Free-form 多人**:貼 `000017679E, 000023456X` → 列印 4 頁,**沒有**任何 overlay
4. **Free-form 單人**:貼 `000017679E` → 列印 2 頁,**沒有** overlay
5. **單個 chartno(打字)**:直接打 `108769A` → search → 列印 → 同 (4),無 overlay
6. **Tabular 第 1 欄空字串**:某一行 col 1 是空白(YC 漏填),該病人無 overlay,其他病人正常

### 4.2 跨模式

7. **B&W mode**:勾黑白列印 → overlay 仍黑色顯示
8. **page1Only mode**:勾「只印第 1 頁」 → page 1 有 overlay,沒 page 2
9. **HIV report mode**:勾 HIV → page 2 第 3 欄變 HIV column,overlay 顯示不受影響

### 4.3 視覺驗收

10. **Chrome 內建 PDF preview**:列印前 preview → overlay 字位置在右上角,**不**被 @page margin 切掉,**不**蓋到 page-header 或 4-col grid
11. **實機印表機列印**(挑一台辦公室常用機):同 (10),overlay 字實體列印能看清楚,2 位數序號(99)整數字框完整、不被 margin 切

### 4.4 Regression

12. **既有 viewer 功能不退化**:對既有病人(無視 viewer 1.2.0 → 1.3.0 zip 替換後)做一次 search + view + 列印,確認 lab / imaging 顯示、reminder box、legend、4-col 排版全部正常
13. **WORKLOG.md (viewer)** 加一條繁中,格式見 § 8

---

## 5. 實作步驟

可以 Cowork 直接做(viewer repo,3 個檔案 + 1 個 manifest version bump,範圍小),也可 Claude Code 開 session(若覺得多檔交叉 friendlier)。

1. 在 `hospital-lab-viewer/` 開實作環境,讀本 brief
2. 編輯 `popup.js`:
   - `splitChartInput`(line 44) — 改回傳結構
   - `handlePrint` single-patient path(line 659–672) — 接 tokens[0].visitSerial
   - `handlePrint` multi-patient loop(line 678–699) — destructure + 加 visitSerial 進 info
   - `updateHint`(line 743)+`doSearch`(line 764) — 改讀 `.chartno`
3. 編輯 `report.js`:
   - `generatePatientPages`(line 949) — destructure 加 visitSerial、page1/page2 template 加 overlay div
   - REPORT_CSS(line 712) — `.page` 加 `position: relative`、追加 `.visit-serial-overlay` 規則
4. 編輯 `manifest.json` — version 1.2.0 → 1.3.0
5. 依 viewer repo 的 build 方式重打包(若有 zip script)、side-load 到 Chrome 測試
6. 跑 § 4 所有測試清單,有 fail 就修
7. 用繁中更新 `hospital-lab-viewer/WORKLOG.md`(條目模板見 § 8)
8. git add + commit,顯示 commit message,**停下來等 YC 說 push**(rule #3)
9. push 完跟 YC 說「好了」 → 同步 Notion Dashboard:這條 brief 狀態改 Done(rule #7)
10. `git mv TASK_BRIEF_viewer_visit_serial.md → _done.md`(rule #6),同 push 的最後一個 commit 一起

---

## 6. 跨 repo 副作用

**無**。

- 不動 patterns 的 catalog 或 computed.js
- 不動 reporter — viewer / reporter 雖然共用 patterns,但這個 overlay 是 viewer 自家 print UI,reporter 不會走 `generatePatientPages`
- 不需要跑 `sync-patterns`

---

## 7. 風險 / 注意

1. **`splitChartInput` 改回傳結構是 breaking change** — 4 個 call site 全部要動。漏改任何一個會跑 `formatChartNo(undefined)` 或 `.chartno` access on undefined → 整個列印流程死。**強烈建議實作完先 `git grep splitChartInput hospital-lab-viewer/` 列出全部 call site 逐一檢查**
2. **`position: absolute` 在 print mode 行為**:某些 Chrome 版本印 A4 landscape 時 absolute element 會貼到實體 page 邊緣(非 @page padded area)→ overlay 可能太靠邊或被切。`top: 5mm; right: 8mm` 是保守值,實機印之後若被切再加大
3. **Multi-patient print 的 page break**:`.page { page-break-after: always; }` 已存在,overlay 在 `.page` 內所以會跟著 break 走,理論上 OK。但 Chrome bug 偶有「absolute element 漏 page-break」案例,實機驗證(測試 #1)
4. **字級 48pt 上限假設**:YC 拍板門診一上午序號 ≤ 99(2 位數),48pt + 2 位數字寬度離 page-header 文字尾端還有距離(mockup 已驗)。若未來序號規則變動(例如午診接續編號 100+),需重新評估字級或 auto-shrink
5. **未來擴展**:若以後 reporter 也想加類似 overlay,要把 logic 搬進共用 `patterns-computed.js` 或更高層 — 本輪不處理(YAGNI)

---

## 8. WORKLOG.md 條目模板(`hospital-lab-viewer/WORKLOG.md`)

```markdown
## 2026-05-20 — viewer:tabular paste 看診序號右上角 overlay(v1.3.0)

**動機:** 多病人列印時護理站需看診序號識別病人,比病歷號好認。

**改動:**
- `popup.js splitChartInput()`:tabular path 多回傳 col 1(visitSerial);
  free-form / 單一 chartno path → visitSerial = null。
  回傳結構從 `string[]` 改成 `Array<{chartno, visitSerial}>`。
- `popup.js handlePrint`:single + multi-patient 兩條路徑都把 visitSerial
  attach 到 patientInfo。
- `popup.js updateHint / doSearch`:跟著改讀 `.chartno`。
- `report.js generatePatientPages`:patientInfo 加 visitSerial 欄,page 1 +
  page 2 各加 `<div class="visit-serial-overlay">` overlay。
- `report.js REPORT_CSS`:`.page` 加 `position: relative` 作 anchor,新增
  `.visit-serial-overlay` absolute 規則(右上角 5mm/8mm,48pt 粗體,B&W + 彩
  色 + @media print 都顯示)。
- `manifest.json`:1.2.0 → 1.3.0。

**Spec 邊界:** 只 tabular paste(≥5 tab cells)模式產生;free-form 跟單一
chartno 不顯示 overlay。單行 tabular 也顯示(tabular detection 為準)。

**測試:** 6 case 基本 / 3 case 跨模式 / 3 case 視覺 / 1 case regression,
列印 6 頁多人 / B&W / page1Only / HIV / 3 位數序號全綠。

**跨 repo:** 無(viewer 自家)。
```

---

## 9. 預計工時

實作 1.5–2 小時(code 範圍小,主要時間在 4 個 call site 對齊 + CSS 微調)
+ 列印測試 30 分鐘(實機印 + PDF preview)
+ WORKLOG / commit / push / Notion 同步 20 分鐘

合計約 **half-day**。
