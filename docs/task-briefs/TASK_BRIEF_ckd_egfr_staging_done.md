# TASK_BRIEF: Reporter — 接上 eGFR / GFRStage / KDIGORisk / TaiwanCKD computed dispatch

> **方向**:vhyl 提出 → vhtt 執行
> **產出 session**:vhyl Cowork session, 2026-05-12
> **建議在**:`TASK_BRIEF_labs_storage_indexeddb` 完成之後(避免 30+ 個 CKD 病人觸發 storage quota 然後資料丟失)
>
> **執行完畢後請改名為 `TASK_BRIEF_ckd_egfr_staging_done.md`**(rule #6)

---

## Problem

`hospital-lab-ckd.html`(Phase 3,2026-05-08 上線)目前是「raw CREAT/UACR/UPCR 表」,**沒有 CKD 分期顯示**。

但 `patterns/computed.js` 早就把整套 eGFR + staging 邏輯寫好了,只是 reporter 端的 `core/compute.js` 沒接上。Phase 3 commit 自己有標 backlog:

> "wiring them to the lab table is a Phase 3.x follow-up, out of scope for this commit"
>      — `groups/early-ckd.js` line 67–69

vhyl 2026-05-12 validation 確認:46 個病人裡 0 個有任何 staging 計算出來,`labs_ckd[chartno].eGFR` 等欄位都是 undefined。

---

## 現況盤點

### Patterns 端(已備好)

`patterns/computed.js` 的 `COMPUTATIONS` registry 有 14 個 entries,其中 CKD 相關:

| id | needs | meta |
|---|---|---|
| `eGFR` | `CREAT`, `__patient.age`, `__patient.gender` | `mL/min/1.73m², ref > 60` |
| `GFRStage` | `eGFR` | 回傳 G1 / G2 / G3a / G3b / G4 / G5 string |
| `UACRStage` | `UACR` | A1 / A2 / A3 |
| `UPCRStage` | `UPCR` | A1 / A2 / A3(用 UPCR 換算)|
| `KDIGORisk` | `eGFR`, `UACR` | 綠 / 黃 / 橙 / 紅(2×2 heatmap)|
| `TaiwanCKD` | `eGFR`, `UACR`, `UPCR` | Taiwan 五期分期 |
| `EarlyCKD` | `eGFR`, `TaiwanCKD` | 是否「初期 CKD」 boolean / tag |

`__patient.<field>` prefix 表示要從 patient demographics 取(不是 lab value)。

### Reporter 端(尚未接)

`core/compute.js` 的 `computeDerivedValues` 只 dispatch URR 和 CaxP,**完全沒用** `COMPUTATIONS` registry:

```js
// 現況(只 hardcode 兩個)
function computeDerivedValues(results) {
  for (const ct of COMPUTED_TESTS) {       // COMPUTED_TESTS = [URR, CaxP]
    results[ct.id] = [];
    if (ct.id === 'URR') { ... }
    else if (ct.id === 'CaxP') { ... }
  }
  return results;
}
```

`REPORTER_COMPUTED`(`lab-mapping.js` 第 217 行附近)只列了 URR 和 CaxP 兩條。`COMPUTATIONS` 裡的其他 12 條都沒匯入。

---

## 變更範圍

### Phase A — Compute dispatcher 重構(必做)

#### A1. `core/compute.js` 改成 registry-driven

放棄 hard-coded URR/CaxP `if-else`,改成走 patterns repo 同步進來的 `COMPUTATIONS` registry:

```js
async function computeDerivedValues(results, patient) {
  for (const comp of COMPUTATIONS) {
    if (!comp.compute) continue;          // skip display-only stub
    results[comp.id] = computeSeries(results, comp, patient);
  }
  return results;
}

function computeSeries(results, comp, patient) {
  // Determine which inputs are date-bearing series vs patient-static.
  const labNeeds = comp.needs.filter(n => !n.startsWith('__patient.'));
  const ptNeeds  = comp.needs.filter(n =>  n.startsWith('__patient.'));

  // Build patient-static args once.
  const ptArgs = Object.fromEntries(ptNeeds.map(n => [
    n.replace('__patient.', ''),
    patient && patient[n.replace('__patient.', '')]
  ]));

  // Date dimension = intersection of dates across all needed lab series.
  // (Or: for each date in the first need, see if every other need has a value.)
  const seriesByDate = {};   // date -> { needId: value }
  for (const needId of labNeeds) {
    const arr = results[needId] || [];
    for (const e of arr) {
      const d = e.date;
      if (!d) continue;
      if (!seriesByDate[d]) seriesByDate[d] = {};
      if (seriesByDate[d][needId] == null) {  // first occurrence wins (per-date dedupe)
        seriesByDate[d][needId] = e.value;
      }
    }
  }

  // Compute one entry per qualifying date.
  const out = [];
  for (const date of Object.keys(seriesByDate).sort()) {
    const slot = seriesByDate[date];
    const haveAll = labNeeds.every(n => slot[n] != null);
    if (!haveAll) continue;
    const args = Object.assign({}, ptArgs, slot);
    try {
      const v = comp.compute(args);
      if (v != null) {
        out.push({ date, value: v, dateObj: new Date(date) });
      }
    } catch (e) {
      console.warn(`[compute] ${comp.id} on ${date} failed:`, e);
    }
  }
  return out;
}
```

#### A2. `patient` 參數注入

`computeDerivedValues` 目前簽名是 `(results)`,需要改成 `(results, patient)`。Call site 在 `core/ui-patient-crud.js` 的 `fetchAndStore` 函式內,已經有 `patientInfo` 可用:

```js
// core/ui-patient-crud.js 約 line 95
let labValues = extractLabValues(orders);
labValues = computeDerivedValues(labValues, patientInfo);  // 加第二個 arg
```

注意 `patient.age` 在多年的 lab data 裡會變,**保守做法是用「該 lab date 時的年齡」**(由 patient.birthDate 推算)而不是「現在」。但 birthDate 在 ernode patientInfo 沒直接給,有 age (current),要追溯:

- **簡單版**:用當前 age,所有 historical eGFR 都用同個值算 — 早期 CKD 病人通常 age 差幾歲,eGFR 差幾 mL/min/1.73m²。可接受。
- **正確版**:從 birthDate 推。但需要先確認 ernode 是否提供。

→ 建議先做簡單版,正確版列為後續 followup。在 brief 內標註。

#### A3. `lab-mapping.js` 同步整個 `COMPUTATIONS`

`scripts/build-json.js` 把 patterns repo 的 `COMPUTATIONS` 全部串到 `dist/patterns.json`(再 sync 到 reporter 的 inline pattern block)。檢查現況:

```
catalog entries:    80
viewer manifest:    60
reporter manifest:  41
computed entries:   14   ← 確認 dist/patterns.json 帶了全部 14 條(目前應該已經帶了)
```

reporter `sync-patterns.js` 把 `REPORTER_COMPUTED` 從 `[URR, CaxP]` 擴成全部(或至少加入 eGFR / GFRStage / UACRStage / UPCRStage / KDIGORisk / TaiwanCKD / EarlyCKD)。

#### A4. URR / CaxP 維持原邏輯

`COMPUTATIONS` 裡 URR 的 needs 是 `['BUNPre', 'BUNPost']`,但 reporter 內 lab 是 `BUN_pre` / `BUN_post`。要嘛在 dispatcher 加 alias,要嘛在 patterns/computed.js 改 needs。

→ 建議在 patterns/computed.js 把 needs 改成 `['BUN_pre','BUN_post']`(對齊 viewer / reporter 共用的 id 命名);順帶確認 `CaxP` 對應到 reporter 用的 `Ca` / `P`。

---

### Phase B — UI 顯示 staging(必做)

#### B1. CKD HTML lab-view 加 staging 欄

`core/ui-lab-view.js` 現在每列只 render `{value, unit, ref}`。staging 是字串(`G3a`、`A2`、`綠/黃/橙/紅`),需要不同 render path:

```js
// 約在 renderLabTable 的 columns array
if (manifestEntry.computed) {       // 標 manifest 有 computed: true 的欄
  td.textContent = lab.value;       // 字串顯示
  td.className = stagingClass(lab.value);  // 顏色標記
}
```

`groups/early-ckd.js` labManifest 加進 staging ids:

```js
labManifest: [
  // 原本的 raw labs ...
  'CREAT', 'BUN', 'UA', 'HCT', ...
  // 加 computed/staging:
  { id: 'eGFR',      displayLabel: 'eGFR' },
  { id: 'GFRStage',  displayLabel: 'GFR 分期', kind: 'staging' },
  { id: 'UACRStage', displayLabel: 'UACR 分期', kind: 'staging' },
  { id: 'KDIGORisk', displayLabel: 'KDIGO 風險', kind: 'staging' },
  { id: 'TaiwanCKD', displayLabel: '台灣 CKD 分期', kind: 'staging' },
  { id: 'EarlyCKD',  displayLabel: '早期 CKD', kind: 'staging' },
],
```

`kind: 'staging'` 觸發 UI 分支(不畫 hi/lo 警示色,改畫 staging 對應色)。

#### B2. 配色

KDIGO 4 級配色建議跟 KDIGO guideline 對齊:綠 #c8e6c9 / 黃 #fff9c4 / 橙 #ffcc80 / 紅 #ef9a9a。

GFRStage 顏色可順 KDIGO 邏輯(G1 G2 綠,G3a G3b 黃→橙,G4 紅,G5 深紅)。

#### B3. dialysis HTML 怎麼辦?

透析病人 eGFR 通常 <15,KDIGORisk 全紅(廢話)。但有時新收病人從 stage 4 開始洗,看 CKD 演進有意義。**建議透析 group 不接 staging**(免得擾亂月檢表)。

只有 `groups/early-ckd.js` 加 staging 顯示。

---

### Phase C — Export 同步(視需要)

#### C1. KiDiTi 58 欄

KiDiTi 沒有 staging 欄位,**不動**。

#### C2. 腎平台 xlsx(early CKD 用)

腎平台格式檢查:`docs/format-specs/early-ckd/腎平台檢驗數據匯入格式.xlsx`,看是否有 KDIGO 分期欄。如果有 → export-formats/renal-platform-xlsx.js 加 column;沒有 → 不動。

#### C3. Long-format CSV(`匯出csv`)

CKD HTML 的 `groups/early-ckd.js` `exporter.formatAll`:加 staging columns(value 直接是字串,no unit/lo/hi,可單欄 staging 不需要 4-tuple)。

---

## 測試清單(完成前必跑)

1. **乾淨 CKD 病人**(已知 stage 3 的 vhyl/vhtt 病人各一)bulk-add → `labs_ckd[cn].eGFR / GFRStage / KDIGORisk / TaiwanCKD` 都有值,且分期合理。
2. **沒 UACR 沒 UPCR 的病人**:`labs_ckd[cn].KDIGORisk` 應為空 array(needs 不滿足);`GFRStage` 還是要有(只 needs eGFR)。
3. **不同性別**:eGFR 公式 CKD-EPI 2021 對男女係數不同,用 patient.sex='M' 跟 'F' 各驗一個 CREAT 一樣的病人,值不一樣。
4. **歷史日期**:同病人多年份 CREAT,每年都該算出一個 eGFR(per-date computation)。
5. **URR / CaxP regression**:確認舊 dialysis 病人 URR 還是算出來(dispatcher 重構不該破壞)。
6. **UI 顯示**:CKD HTML lab table 出現 staging 欄,顏色正確,dialysis HTML 不出現。
7. **WORKLOG**:patterns + reporter + viewer 各記一筆。

---

## 相關前例 / 參考

- 5/4 dialysis revision 1:URR / CaxP 接 compute 的 hardcode 寫法。
- 5/8 phase 3 commit:`groups/early-ckd.js` line 67 那段 backlog 註解。
- `patterns/computed.js` `eGFR_CKDEPI_2021` 實作:已完整,無需改動。

---

## 風險 / 注意

- **birthDate / age 不確定性**:目前用 patient.age(current snapshot),歷史 eGFR 有些微誤差。若 ernode 後續暴露 birthDate 可升級。先掛 TODO 註解,不擋本 brief 完工。
- **`__patient.<field>` prefix 是新 convention**:dispatcher 必須懂得 unwrap;若 patterns/computed.js 改命名(如 `__demo.age`),要同步調整。建議本 brief 鎖死 `__patient.<field>` 為唯一格式。
- **per-date 計算可能很慢**:若 lab history 大(46 人 × 12 月 × 14 條 computed ≈ 7700 次 compute call),需確認 dispatcher 沒有 O(n²) 慢點。實測若 fetchAndStore 完整跑超過 1 秒/人,考慮加 memoization。
- **build pipeline**:`patterns/computed.js` 改 needs 後跑 `npm run release`,再 viewer + reporter 各 `sync-patterns.js`,然後 `node build.js dialysis` + `node build.js ckd`。Legacy `hospital-lab-data.html` markers 也要 sync。

---

## 預計工時

- Phase A:4–6 小時(dispatcher 重構 + per-date 計算 + URR/CaxP regression)
- Phase B:2–3 小時(UI staging 欄 + 配色 + manifest 調整)
- Phase C:1–2 小時(視腎平台 xlsx 而定)

合計約一整天工作,適合一個 vhtt session 接掉。
