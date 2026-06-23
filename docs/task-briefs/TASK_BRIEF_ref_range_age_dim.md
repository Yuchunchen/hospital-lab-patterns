# TASK_BRIEF — reference range 加「年齡」維度 + viewer 正確套用

> **Status:** ACTIVE — 等 Claude Code 接手實作
> **Last updated:** 2026-06-23
> **Author:** YC (規格) / Cowork (草擬)
> **Mode:** Claude Code（跨 patterns → viewer → reporter，含 build / sync-patterns）
> **前置:** 接續 `TASK_BRIEF_ref_range_machine_time_dim_done`（機器 × 時間 × 性別三維已上線）
> **Scope:** 在 `refHistory` 既有「機器 × 時間 × 性別」三維上**加第四維：年齡**；
>   並把年齡 thread 進 viewer 報告上色路徑，讓 viewer 判讀正確。
> **預設行為:** 不分年齡（age-agnostic）。沒寫年齡帶的 entry 對所有年齡一視同仁 →
>   zero-regression，現有 51 個 entry 行為完全不變。

---

## 1. 問題陳述 / 目標

部分檢驗的正常值會因**年齡帶**不同（例：ALP、某些荷爾蒙、鹼性磷酸酶在兒童 vs 成人；
碼後依院區實際印製為準）。目前 `refHistory` 只有機器 × 時間 ×（inline 性別），
無法表達「同一機器、同一時期，但不同年齡帶 ref 不同」。

本 brief 要：

1. **schema**：`refHistory[]` 條目新增可選 `ageMin` / `ageMax`（歲，整數）。
2. **resolveRef**：解析時多吃一個 `patientAge` 參數，依年齡帶篩選候選；
   缺年齡帶 = 不分年齡（適用所有年齡）。
3. **viewer**：把 `patientInfo.age` thread 進 `valueStyle` → `resolveRef`，
   並修 `dashboard.js` 漏傳 gender/age 的既有不一致。
4. **reporter**：同步 bundle（`ui-lab-view.js` 核心 + ckd/dialysis 報告）。
   **legacy `hospital-lab-data.html` 本輪不處理**（YC 2026-06-23 拍板：目標放 viewer；
   data.html 走退役，不接 resolveRef）。

> ⚠️ 跨 repo 副作用（規則 #4）：改 `resolveRef.js` / `catalog.js` / `schema.js` 在
> patterns repo；viewer + reporter 都靠 `sync-patterns.js` 重新 bundle，**三個 repo 都要動**。

---

## 2. Schema 變更（patterns/`docs/pattern-spec.md` § refHistory + `scripts/`/schema validate）

`refHistory[]` 條目新增兩個 optional 欄位：

```js
{
  machine: 'vhtt' | 'vhyl' | '*',
  refLo, refHi,
  refLoM?, refHiM?, refLoF?, refHiF?,   // 既有 inline 性別 override
  ageMin?: number,   // 含；歲。缺/null = 無下界（0）
  ageMax?: number,   // 含；歲。缺/null = 無上界（∞）
  validFrom: 'YYYY-MM-DD',
  source: string
}
```

語意：
- **兩個都缺** = age-agnostic（適用所有年齡）。← 預設、現有 entry 全屬此類。
- `ageMin:18`（無 ageMax）= 18 歲（含）以上。
- `ageMin:0, ageMax:17` = 0–17 歲（含）。
- 年齡帶**不重疊**為原則；同 (machine, validFrom) 下若多筆年齡帶，須能完整切分。

**Validate 強制（`schema.js`）新增：**
- `ageMin` / `ageMax` 若在場必須為非負整數；同筆若兩者皆在場，`ageMin <= ageMax`。
- 同一 entry 內、同 `machine` 同 `validFrom` 的多筆年齡帶**不得重疊**（重疊報錯，避免解析歧義）。
- 不破壞既有規則（machine ∈ valid set、validFrom ISO、base refLo/refHi 必填、hospitalScope 'tt'→不得 vhyl 等）。

---

## 3. resolveRef 變更（`patterns/lib/resolveRef.js`）

**簽名（向後相容，新參數加在最後）：**

```js
resolveRef(testId, machineSource, reportDate, patientGender, catalogList, patientAge)
```

- 舊呼叫端只傳 5 個參數 → `patientAge === undefined` → 視為「年齡未知」。

**候選篩選**（在現有 `machine ∈ [machineSource,'*'] && validFrom <= date` 上再加年齡）：

```
ageOK(h, age):
  ageAgnostic = (h.ageMin == null && h.ageMax == null)
  if age == null:  return ageAgnostic            // 年齡未知 → 只取不分年齡那筆
  lo = h.ageMin == null ? -Infinity : h.ageMin
  hi = h.ageMax == null ?  Infinity : h.ageMax
  return age >= lo && age <= hi
```

**precedence（排序，由強到弱）— YC 拍板 2026-06-23：machine > age：**
1. machine-specific（`vhtt`/`vhyl`）勝 `*`
2. age-specific（有年齡帶）勝 age-agnostic（更精準者勝）
3. 同上述條件下，`validFrom` 越晚者勝
4. 取第一筆為 base → 再走既有性別三層 fallback

**候選為空** → 退回現有 outer fallback（outer `refLo/refHi` + outer 性別欄）。

**年齡來自哪個時間點（重要正確性決策）：**
viewer 的 `patientInfo.age` 是**目前年齡**，不是每筆歷史報告當時的年齡。年齡帶在
邊界（如 17↔18 歲）對舊報告會差一歲。本 brief 採近似法：

```
birthYearApprox = todayYear - currentAge
ageAtReport     = reportYear - birthYearApprox   // ±1 歲邊界誤差
```

由 caller 算好 `ageAtReport` 再傳給 resolveRef（resolveRef 不碰「目前年齡」邏輯）。
精確解（抓 ernode `出生日期`，DM Education 子頁面有）列為後續增強，本輪不做。

---

## 4. viewer 變更（`hospital-lab-viewer/`）

### 4.1 `report.js` — thread 年齡進上色路徑
`gender` 目前的 thread 路徑：`buildColumn` / `buildPage2Column` → `buildSectionBox`
→ `buildTestBlock` → `valueStyle`。**比照加一個 `ageAtReport`（或把 patientAge 一路帶下去，在 valueStyle 內依 cell 日期算 ageAtReport）。**

- `valueStyle(val, test, bw, isLatest, gender, reportDate)` →
  加參數 `patientAge`（目前年齡），在函式內用 `reportDate` 算 `ageAtReport`，
  呼叫 `resolveRef(test.id, getMachineSource(), reportDate, g, window.TEST_MAP, ageAtReport)`。
- `patientInfo.age`（字串）需 `parseInt` 後一路帶到 `valueStyle`（來源：`buildResultMap` 已有 `patientInfo`）。
- 保留現有「resolveRef 不可用 → legacy inline 性別」defensive fallback。

### 4.2 `dashboard.js:~293` — 修既有不一致
目前 `resolveRef(testDef.id, getMachineSource(), entry.date, null, window.TEST_MAP)`：
gender 傳 `null`、無 age。改成傳入 `patientInfo.gender`（'男'/'女'→ 由 resolveRef 端或此端轉）
與 `ageAtReport`。確認 dashboard 用到的 test 是否含性別/年齡相依項；即使目前多為 eGFR/staging，
仍應傳正確值以免日後加項出錯。

---

## 5. reporter 變更（`hospital-lab-reporter/`）

- `resolveRef.js` 改完，跑 `node sync-patterns.js` 重新 bundle 進 reporter。
- 確認 `core/ui-lab-view.js:~242` 與 build 後的 `hospital-lab-ckd.html` /
  `hospital-lab-dialysis.html`（`resolveRef(test.id, getMachineSource(), d, g, catList)`）
  **補上 age 參數**：`resolveRef(..., catList, ageAtReport)`。
- reporter 的 patient 年齡來源：確認 `patient.age` / `currentPatient` 是否有年齡欄；
  若無，本輪 reporter 端可先傳 `undefined`（= age-agnostic，zero-regression），
  並在 WORKLOG 標明「reporter 年齡維度待補資料來源」。
- legacy `hospital-lab-data.html`：**不動**（退役中）。

---

## 6. 成功標準（怎樣算做完）

1. `npm run release`（patterns）validate + build-json 全綠，含新的 ageMin/ageMax 規則。
2. `npm run test:refhistory` 全綠，且**新增**第 7 節的年齡測項並全數通過。
3. 既有 14 條 refHistory 測試**全部仍通過**（zero-regression）。
4. 對一個故意加了年齡帶的 sample entry：viewer 報告中，**同一病人不同年齡帶**
   的數值上色依年齡正確切換（用 console 或臨時 fixture 驗）。
5. 沒寫年齡帶的所有現有 entry：上色結果與本次改動前**完全一致**（diff 驗）。
6. 三 repo `sync-patterns` 後，viewer `mapping.js` 與 reporter bundle 內的 resolveRef
   皆為新版（grep 確認簽名含第 6 參數）。
7. WORKLOG.md（繁中）更新；跨 repo 影響已註明。

---

## 7. 測試清單（每條對應一個業務行為，可獨立驗證）

於 `scripts/test-refhistory.js` 新增（沿用既有 harness 風格）：

- **A1 schema：** entry 帶 `ageMin:18`（無 ageMax）validate 通過。
- **A2 schema：** 同 (machine,validFrom) 下年齡帶重疊（如 0–17 與 10–20）→ validate **報錯**。
- **A3 schema：** `ageMin` 為負或非整數 → validate **報錯**。
- **B1 resolve：** test 有 `{*, 0–17, lo/hi=A}` 與 `{*, 18+, lo/hi=B}`；
  `patientAge=10` → 得 A；`patientAge=40` → 得 B。
- **B2 resolve：** `patientAge=null`（未知）→ 取 age-agnostic 那筆；若無 age-agnostic →
  退回 outer fallback（**不**亂抓某個年齡帶）。
- **B3 resolve：** age 命中年齡帶 + machine-specific 同時存在 → 依 §3 precedence 取對。
- **B4 resolve（回歸）：** 無任何年齡帶的 entry（現況 51 個代表一個）→ 結果與舊版相同。
- **B5 resolve（性別×年齡）：** entry 同時有性別 inline override 與年齡帶 →
  先選對年齡帶 base，再套性別 override，結果正確。
- **C1 viewer（整合）：** 一個含年齡帶的 fixture，`ageAtReport` 由 report 日期算出，
  邊界年齡（如報告當年 17 歲、今年 19 歲）取到**該報告當時年齡**對應的帶。

---

## 8. 實作後分發

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
npm run release ; npm run test:refhistory
git add patterns/ dist/patterns.json docs/ scripts/ WORKLOG.md
git commit -m "refHistory: add age dimension (ageMin/ageMax) + viewer threading"
# 顯示 commit msg 給 YC → 等 YC 說 push（規則 #3）

cd ..\hospital-lab-viewer   ; node sync-patterns.js ; git add -A ; git commit ...
cd ..\hospital-lab-reporter ; node sync-patterns.js ; git add -A ; git commit ...
```

- viewer：OPD 端 runtime fetch 24h 內自動拿到新 `dist/patterns.json` + bundle。
- reporter：重 build ckd/dialysis HTML，依現行流程分發。
- push 成功後同步 Notion TASK_BRIEF Dashboard（規則 #7）。
- 完成後本檔改名加 `_done`（規則 #6）。

---

## 9. 已確認決策（YC 拍板 2026-06-23）

1. **precedence：machine > age**（machine-specific 勝過年齡帶命中）。
2. **年齡時間點：近似 birthYear 回推**（`birthYearApprox = todayYear - currentAge`，
   `ageAtReport = reportYear - birthYearApprox`，接受 ±1 歲邊界誤差）。精確抓 ernode
   `出生日期` 列為後續增強，本輪不做。
3. **reporter 年齡來源：本輪傳 `undefined`**（= age-agnostic、zero-regression），
   並在 WORKLOG 標明「reporter 年齡維度待補資料來源」。

→ 三項已無 open decision，Claude Code 可直接實作。
