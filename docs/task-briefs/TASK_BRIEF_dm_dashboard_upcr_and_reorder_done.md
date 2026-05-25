# TASK_BRIEF:DM Dashboard 加 UPCR 欄 + 欄序重排

- 作者:claude(與 YC 共同,vhyl Cowork)
- 日期:2026-05-25
- 範圍:viewer `dashboard.html` + `dashboard.js`
- 跨 repo:無 — UPCR catalog entry 已於 2026-05-08 Phase 3 Early CKD brief 加入
- 模式:Cowork
- 依賴 brief:`TASK_BRIEF_ckd_screening_dashboard_done.md`(S3 read-only 收尾 2026-05-22)— 本 brief 在 S3 read-only 基礎上加欄 + 重排

---

## §1 動機

YC 在 vhyl 實機驗 DM Dashboard 後(同日 ABI/Fundus regex 修正 commit 已 PASS)提兩個需求:

1. **加 UPCR 欄**:Dashboard 目前只顯示 UACR(尿微量白蛋白)。UPCR(尿蛋白肌酐比)是 KDIGO A 軸的並列指標 — 有些病人只有 UPCR 沒有 UACR(尤其早期 CKD 沒做尿微量白蛋白),Dashboard 看不到 UPCR 等於少資訊。
2. **欄序重排**:把同質指標放在一起(實驗值 → 影像/檢查 → 蛋白尿系列 → 計算分期 → DM 衛教 → 動作),臨床瀏覽動線更順。

---

## §2 Spec / 邊界

### §2.1 新欄序(18 欄)

| # | data-key  | 欄名(thead 文字) | render 邏輯                           |
|---|-----------|---------------------|---------------------------------------|
| 1 | chartno   | 病歷號              | `escHtml(r.chartno)`                  |
| 2 | name      | 姓名                | `escHtml(r.name)`                     |
| 3 | recentLab | 最近抽血            | `r.recentLab.date` + `relativeFromTwDate` |
| 4 | sugar     | Sugar               | `renderLabCell(r.values.sugar, catById('GluAC'))` |
| 5 | hba1c     | HbA1c               | `renderLabCell(r.values.hba1c, catById('HbA1c'))` |
| 6 | ekg       | EKG                 | `renderExamCell(r.exams.EKG)`         |
| 7 | abi       | ABI                 | `renderExamCell(r.exams.ABI)`         |
| 8 | pvr       | PVR                 | `renderExamCell(r.exams.PVR)`         |
| 9 | fundus    | 眼底鏡              | `renderExamCell(r.exams.Fundus)`      |
| 10| uacr      | UACR                | `renderLabCell(r.values.uacr, catById('UACR'))` |
| 11| **upcr**  | **UPCR  *NEW***     | `renderLabCell(r.values.upcr, catById('UPCR'))` |
| 12| egfr      | eGFR                | `renderEgfrCell(r.values.egfr)`       |
| 13| dm        | DM 衛教內容         | `renderDmCell(r.dmEducation)`         |
| 14| dmDays    | DM 天數             | `renderDmDaysCell(r.dmEducation)`     |
| 15| earlyCKD  | Early CKD           | `renderEligibilityCell(r.enrollEligible.earlyCKD)` |
| 16| gfrStage  | GFR分期             | `r.staging.gfrStage` + 顏色 class      |
| 17| preESRD   | Pre-ESRD            | `renderEligibilityCell(r.enrollEligible.preESRD)` |
| 18| action    | ⚡動作              | `<button class="row-action report">報告</button>` |

### §2.2 UPCR 顯示格式

跟 UACR 完全一致 — `renderLabCell(r.values?.upcr, catById('UPCR'))`:
- 顯示 raw value + 單位(`renderLabCell` helper 既有支援)
- 異常超標紅字(`valueStyle()` 既有邏輯)
- 缺值顯示 `—`

**不**另加 UPCRStage 欄。UPCRStage 仍在 staging 計算內部使用(TaiwanCKD / EarlyCKD eligibility),不另外露出避免欄過多。

### §2.3 UPCR 資料來源

- catalog id `UPCR`(2026-05-08 加入,pattern 含 `T.PROT/CREAT` alternation)
- dashboard.js 跟 UACR 平行抓:`extractLatestLabValue(lab, catById('UPCR'))`
- 寫入 `row.values.upcr`

### §2.4 TaiwanCKD / EarlyCKD computation 順手修

dashboard.js 線 201 目前硬寫:
```js
LAB_HELPERS.TaiwanCKD({ eGFR: egfrVal, UACR: uacrVal, UPCR: null })
```

改為:
```js
LAB_HELPERS.TaiwanCKD({ eGFR: egfrVal, UACR: uacrVal, UPCR: upcrVal })
```

**副作用**:vhyl/vhtt 病人若只有 UPCR 沒 UACR,TaiwanCKD 從此能算出 stage(原本 UPCR 永遠 null = only UACR drive 分期,是 pre-existing bug)。**commit 訊息要明標**這條順手修。

### §2.5 邊界 / 不動的東西

- registry write / 收案按鈕 仍 parked(承襲 S3 read-only 收尾)
- CSV export 欄序同步更新(否則 CSV 跟畫面不一致 = confusing)
- 列印 CSS `.action-col` 隱藏規則保留(動作欄列印仍隱藏)
- colspan 從 17 → 18(error row、empty row 都要改)
- **不動** popup / cxr.html / lab-core.js(本 brief 純 dashboard 改)

---

## §3 變更檔案

| 檔案                 | 變更                                                                 |
|----------------------|----------------------------------------------------------------------|
| `dashboard.html`     | thead 18 個 `<th data-key>` 依新順序重排;tbody empty row colspan 17→18 |
| `dashboard.js`       | `extractLatestLabValue UPCR` + `values.upcr` + upcrCell render + TaiwanCKD upcrVal + row HTML 18 cols 依新序 + `compareForSort` 加 `upcr` key + CSV header + cells 18 欄(動作欄不出 CSV) + error row colspan 17→18 |
| `WORKLOG.md`(viewer)| 一條條目(rule #2)                                                  |
| brief 改名 `_done`   | 全綠後 rule #6                                                       |

---

## §4 測試清單(獨立驗證 + 對應業務行為,rule #9)

### §4.1 邏輯層

- [ ] `node --check dashboard.js` 通過(無 SyntaxError)
- [ ] grep dashboard.html 確認 18 個 `<th data-key>`,順序對 §2.1
- [ ] grep dashboard.js 確認 `extractLatestLabValue(lab, catById('UPCR'))` 出現 ≥1 次
- [ ] grep dashboard.js 確認 TaiwanCKD 那行 `UPCR: upcrVal`(非 `null`)
- [ ] grep dashboard.html 確認 empty row `colspan="18"`(非 17)

### §4.2 實機驗證(vhyl Cowork)

- [ ] 同 16 位 vhyl DM 病人重貼 popup → Dashboard 出 18 欄、順序對 §2.1
- [ ] **至少 1 位 vhyl 病人 UPCR 欄有 raw value**(其餘可能空,但若有做過 T.PROT/CREAT 就該顯示)
- [ ] **TaiwanCKD stage 對 UPCR-only 病人(如有)算出來**(不再卡 null)
- [ ] 點 thead 任一欄排序 → 該欄正確 asc/desc
- [ ] **UPCR 也能排序**(數值排序,缺值排最下)
- [ ] CSV 匯出 → header 列 17 欄對 §2.1 排除動作欄(動作欄不出 CSV);UPCR 在 col 11
- [ ] 批次列印 → A4 橫印預覽,動作欄隱藏,其他 17 欄序對

### §4.3 Regression(不被本 brief 改壞)

- [ ] popup「報告查詢」單人模式不變(本 brief 不動 popup)
- [ ] CXR 健檢視窗不變(本 brief 不動 cxr.html / cxr.js)
- [ ] vhyl ABI / Fundus 仍 match(上一個 commit d4bbef0 / 510782a 不被本 commit 覆寫)
- [ ] DM 衛教欄內容 + DM 天數欄 仍正常(`extractDMEducation` 邏輯不動)
- [ ] vhtt 病人(隨便挑一位)dashboard 行為一致 — UPCR 欄若有值就顯示、無值顯示 `—`

---

## §5 步驟

1. brief 寫完 → YC 確認 spec / 邊界(本步)
2. Edit `dashboard.html` thead + empty row colspan
3. Edit `dashboard.js` — 抓 UPCR + values.upcr + TaiwanCKD upcrVal + row HTML 18 cols + sort key + CSV
4. `node --check dashboard.js`(在 vhyl PowerShell)
5. 寫 viewer WORKLOG 條目(rule #2)
6. YC 在 vhyl Chrome reload + 跑 §4 全部測試
7. 全綠 → brief 改名 `_done.md` + 勾測試清單(rule #6)
8. commit(brief rename + dashboard.html + dashboard.js + viewer WORKLOG)
9. push 前問 YC(rule #3)
10. push → Notion Dashboard 加一條 Done(rule #7,本 brief 有 brief 改名 _done,**會**寫 Notion)

---

## §6 風險

- **CSV 欄序若沒對齊 print 用戶會混亂** — §4.2 含 CSV header 驗證
- **compareForSort 漏 `upcr` key** → UPCR 欄點不動排序 — §4.2 含排序測試
- **colspan 17→18 漏改** → error row / empty row 整列跳掉 — §4.1 grep colspan
- **TaiwanCKD 行為改變(UPCR 從 null 變實值)** → vhyl/vhtt 病人 stage 可能從 null 變有值。是修 pre-existing bug,但 commit 訊息要標明,避免日後追 git blame 困惑
- **新增 row.values.upcr 的 destructure 點漏改** → 若 dashboard.js 其他地方 destructure `{sugar, hba1c, uacr}` 沒帶 `upcr`,UPCR 不會傳到 render — §4.1 grep 補測

---

## §7 跨 repo 影響

- patterns:無(UPCR catalog entry 已存在,2026-05-08 加)
- reporter:無
- 純 viewer own-code 改動 → `sync-patterns.js` **不必跑**

---

## §8 預估規模

- 改動行數:dashboard.html ~30 行(thead + colspan);dashboard.js ~80 行(抓值 + render + sort + CSV)
- 工時:half-day(編 + 自測 + 實機驗 + commit)
