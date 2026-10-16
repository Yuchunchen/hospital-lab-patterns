# TASK_BRIEF: Viewer — Fundoscopy(眼底鏡檢查) 一年內提醒 + 前次異常不漏看

> **方向**：vhtt 提出（設計）＋ Claude Code 執行（大半徑：整合進 viewer/reporter）
> **產出 session**：vhtt Cowork session, 2026-07-18
> **前置條件**：無新前置；沿用既有 ernode `get_lab_orders` + opdweb `OpdOrderReport.aspx` 批次 fetch pipeline
> **首步可在 vhyl 做**：S1 異常案例幾何驗證（見下）——YC 在 vhyl 抓一份眼底異常報告即可
>
> **執行完畢後請改名為 `TASK_BRIEF_fundoscopy_reminder_done.md`**（rule #6）

---

## Problem

家醫／DM 門診病人需定期（一般一年）做眼底鏡檢查（Fundoscopy）。目前痛點（YC 2026-07-18 定義）：

1. **會忘記翻前面的報告** —— 病人上次眼底報告若有異常，這次看診容易漏掉。
2. **異常訊號要主動浮出** —— 若前次報告有勾 `REFER TO EYE CLINIC`（建議轉診眼科），或 grid 勾到 **NPDR / PDR / PPDR / MACULOPATHY**，醫師應被明確提醒。
3. 附帶：**一年內**沒做（或從未做過）也要能看出來 → 提醒安排。

**目標**：在 viewer/reporter 看病人時，自動浮出「最近一次 Fundoscopy 的日期 + 是否異常 + 是否建議轉診 + 是否逾期／從未做」，讓醫師一眼掌握，不用自己翻舊報告。

**重點排序（YC 拍板）**：異常不漏看 > 逾期提醒。核心訊號是「前次是否異常 / 是否建議轉診」，不是單純的時間計算。

---

## 架構定位

延續「給 ID 抓資料 → 以不同方式呈現」共用 pipeline，第三個 use case：

| Use case | 資料來源 | 處理方式 | 呈現 |
|---|---|---|---|
| CKD/DM Dashboard | ernode orders | Pattern match + 日期比對 | 篩檢表格 |
| 健檢影像翻譯 | ernode orders → 子頁面報告 | LLM 翻譯 | 翻譯表格 + 列印 |
| **Fundoscopy 提醒** | **ernode orders → opdweb 子頁面（座標解析）** | **異常旗標 + 到期判定** | **viewer/reporter 病人層提醒 badge** |

與前兩者共用：ernode API 呼叫、opdweb 子頁面 fetch、獨立視窗架構。

**運作方式（YC 選）**：整合進 viewer/reporter（大半徑 → Claude Code 落地，非 Cowork）。

---

## Phase 0：本 session 已確認 ✅（2026-07-18, vhtt, 三個 example）

測試病人：`000076708I`（1 份正常）、`000125509A`（2 份，取最新正常）、`000122426G`（**完全無** Fundoscopy）。

### P0-1：Discovery — 怎麼找到 Fundoscopy order ✅

| 問題 | 結論 |
|---|---|
| Fundoscopy 在 `get_lab_orders`？ | **是**，但 **執行單位 = META、ORDTYPE = `MET`**（不是檢驗／LAB） |
| searchItem 可搜？ | **是**。`searchItem=Fundoscopy` 直接列出該病人所有 Fundoscopy（免翻 230 筆），列序＝新到舊 |
| 內容在 ernode 清單？ | **否**。清單只顯示「請 Click『正式報告』」，內容要開 opdweb 子頁面才有 |
| searchItem 掃不到＝沒做？ | 對此 order **可信**（單一具名 META order，非 co-bundle analyte）。`000122426G` 用 `Fundoscopy` 與 `眼底` 兩詞皆「沒有紀錄／總筆數 0」→ 真的沒做 |

### P0-2：ORDAPNO 取法（踩過的雷）✅

- ⚠️ **不可**用「從 order 名往 DOM 上爬找最近 ORDAPNO」——會抓到隔壁列（本 session 首試抓 Fundoscopy 卻拿到隔壁 DM 衛教單的 ORDAPNO）。
- **正解**：`document.querySelectorAll('input[name=ORDAPNO]')` 依**文件出現順序**對應可見列序（Fundoscopy 在 row 0 → ORDAPNO[0]）。
- 子頁面 URL（vhtt 已驗）：
  `http://opdweb.vghb12.vhtt.gov.tw/QueryReport/OpdOrderReport.aspx?OrdApNo=<ORDAPNO>&hisnum=<chartno>&opid=A123456789`
  （參數是 `opid` 不是 opsid；跨子網域用親域 cookie 橋接，同 §9 既有作法）

### P0-3：報告版面結構 ✅（關鍵）

版面是**絕對座標定位的 `<div>`**（約 73 個 leaf div），**不是 HTML table**。純文字攤平會失去 OD/OS 欄位對齊 → **必須用座標解析**。YC 稱「text report」＝欄位是文字（非掃描影像）→ 可解析，只是要靠 (x,y) 對位。

實測座標（`000076708I` 正常報告，單位 px；不同報告會微移，實作要用「相對標籤」而非寫死）：

```
報告時間：（獨立 label 可穩定選取）→ 已西元，免 ROC 轉換 → 到期日的錨
檢驗項目：Fundoscopy(眼底鏡檢查)；申請序號 = ORDAPNO

發現 grid：標籤 x≈15，每列 y +30
  OD 欄 x≈345 / OS 欄 x≈425（表頭 y=247）
  NORMAL y=277 / NPDR 307 / PDR 337 / MACULOPATHY 367 /
  S/P LASER PHOTOCOAGULATION 397 / BLINDNESS 427 / CATARACT 457 /
  PPDR 487 / RETINAL EXAMINATION 517 / LATE STAGE DM EYE DISEASE 547 / OTHERS 577
  → 某列被勾 = 該列 y 上有 "V"；x≈348 → OD、x≈428 → OS

COMMENT 區（兩選一勾選框）：
  y=643：☑ "PLEASE FOLLOW UP" [間隔數字 x≈304] "MONTHS LATER"，勾記 V 在 x≈108
  y=673：☐ "PLEASE REFER TO EYE CLINIC FOR FURTHER EVALUATION"，勾記 V 應在 x≈108, y≈673
```

**判定規則（解析後要產出的欄位）**：
- `reportDate` = 報告時間（ISO）
- `abnormalFindings` = NPDR/PDR/PPDR/MACULOPATHY 任一列（任一眼）有 V
- `referEyeClinic` = COMMENT 的 REFER 那列（y≈673）有勾 V
- `followUpMonths` = FOLLOW UP 那列的間隔數字（本例 12）
- `isNormal` = 只有 NORMAL 勾、且 REFER 未勾

### P0-4：三個 example 實際值 ✅

| chartno | 姓名 | Fundoscopy 份數 | 最新報告 | 發現 | COMMENT |
|---|---|---|---|---|---|
| 000076708I | 洪玉化 F76 | 1 | 2026/07/17 | NORMAL(OD+OS) | ☑ FOLLOW UP 12 MONTHS，REFER 未勾 |
| 000125509A | 陳昭文 M | 2（取最新） | 2026/07/17 | NORMAL | ☑ FOLLOW UP 12 MONTHS |
| 000122426G | 趙宗珮 M56 | **0** | — | — | — → 「從未做」情境 |

---

## ⚠️ 驗證缺口（必須先補，rule #8/#11）

三個 example **全是正常報告**（V 都在 FOLLOW UP、grid 只勾 NORMAL）。以下屬**推論、未實證**：

1. 病人異常時，V 會出現在 grid 的 NPDR/PDR/PPDR/MACULOPATHY 列（x≈348/428, y=對應列）。
2. 建議轉診時，V 會出現在 COMMENT 的 REFER 列（x≈108, y≈673）。

→ **落 parser 前必須先抓 ≥1 份眼底異常報告**確認上述幾何（含 REFER 打勾的實際 x/y、以及 grid 勾記在異常列的座標）。這是 **S1、可在 vhyl 做**：YC 提供一個眼底異常的 chartno（NPDR/PDR/PPDR/MACULOPATHY 或 REFER 有勾）即可。

---

## 待設計 / 待確認（給 Claude Code 落地前）

1. **資料流**：整合進 viewer/reporter 需要每位病人的「最新 Fundoscopy {date, abnormal, refer, followUpMonths}」。這筆資料怎麼進 viewer？沿用現有批次 fetch pipeline 即時抓，還是新增快取（IndexedDB，如 cxrTranslations 模式）？—— **需先讀 viewer/reporter 現有資料流再定**（本 session 尚未讀 viewer/reporter repo）。
2. **呈現位置**：主要在 viewer（OPD handout，醫師看病人處）浮出 badge；reporter / CKD-DM dashboard 是否也要？先以 viewer 為主，其餘待 YC 確認。
3. **到期規則**：預設「最新報告日 + 12 個月」為到期日；`followUpMonths` 若解析到（COMMENT）可覆蓋。無紀錄 → 標「從未做」。**但顯示優先序：異常/轉診旗標 > 逾期**（YC 定調）。
4. **提醒文案**：如「上次眼底 2026-07-17：正常，建議一年後複查」／「⚠️ 上次眼底異常（PDR），已建議轉診眼科」／「⚠️ 無眼底紀錄」。

---

## 分段計畫

### S1：異常幾何驗證（可在 vhyl）
- YC 提供眼底異常 chartno → 抓報告 → 確認 NPDR/PDR/PPDR/MACULOPATHY 勾記座標 + REFER 打勾的 x/y。
- **成功標準**：至少一份異常報告，能用座標規則正確判出 `abnormalFindings=true` 且（若有）`referEyeClinic=true`，並記錄實際座標帶入 P0-3 規格。

### S2：Parser + 資料流設計（Claude Code）
- 讀 viewer/reporter 現有 fetch/快取架構 → 定資料流（待確認 #1）。
- 寫座標解析器：報告日期 + 發現 grid（OD/OS）+ COMMENT 兩選一 + 間隔數字；座標用相對標籤 anchor，不寫死像素；含 timeout 的同源 fetch（§9 Chrome 技法）。
- **成功標準**：三個 example + S1 異常案例，解析出的 {date, abnormalFindings, referEyeClinic, followUpMonths} 全部正確；無報告病人回「從未做」不報錯。

### S3：Viewer 整合 + 提醒呈現（Claude Code）
- 病人層 badge：最新 Fundoscopy 摘要 + 異常/轉診/逾期旗標，異常優先浮出。
- **成功標準**：看病人時一眼看到上次眼底狀態；異常/建議轉診明顯標示；逾期或無紀錄可辨；不影響既有 viewer 效能。

---

## 測試清單（每條對應一個業務行為，可獨立驗證）

1. [x] P0：`searchItem=Fundoscopy` 列出該病人所有 Fundoscopy，列序新到舊（000076708I/000125509A 驗證）
2. [x] P0：ORDAPNO 用 input 出現順序對應列序（非 DOM 上爬）→ 開對正確報告
3. [x] P0：無紀錄病人（000122426G）`Fundoscopy`+`眼底` 皆 0 → 判「從未做」
4. [x] P0：正常報告座標解析 → NORMAL 雙眼、FOLLOW UP 12、REFER 未勾
5. [ ] S1：**異常報告** grid 勾記正確判為 abnormal（NPDR/PDR/PPDR/MACULOPATHY）
6. [ ] S1：**REFER TO EYE CLINIC 有勾** 時正確判為 referEyeClinic=true
7. [ ] S2：多份報告取「最新一筆」（000125509A 有 2 份 → 取 2026/07/17）
8. [ ] S2：報告日期取自「報告時間」且已西元（免 ROC 轉換）
9. [ ] S2：座標微移（不同報告）仍正確 —— 相對標籤 anchor，非寫死像素
10. [ ] S3：viewer 病人層一眼可見上次眼底狀態；異常/轉診優先浮出
11. [ ] S3：逾期（>12 月）與無紀錄各有明確標示

---

## 風險與備案

| 風險 | 影響 | 備案 |
|---|---|---|
| 只驗過正常報告 | 異常分支幾何是推論 | **S1 先補一份異常報告**再落 parser（已列為前置） |
| 座標寫死像素 | 不同報告微移就抓錯 | 用「相對標籤最近 y / 欄位 x-band」，不用絕對值 |
| label off-by-one（舊報告版面少一行）| V 掛錯列 | 同 §9 CBC 教訓：以最近報告為準，歷史 variant 人工複核 |
| opdweb 併發炸（IOException）| 批次抓失敗 | 序列 + 節流 + 重試（§9 已驗，序列 0 error）；同源 fetch 一定包 AbortController timeout |
| viewer 資料流未定 | S2 卡住 | 先讀 viewer/reporter repo（待確認 #1）再設計 |
| 報告含 PHI | 隱私 | 座標解析在本機 extension 內，不外送 |

---

## 備註（Cowork/Claude Code 分工 + 狀態）

- 本 brief 為 **Cowork 產出（設計）**；本 session **未寫任何程式、未 commit/push**（memory: Cowork 不 drive commit/push）。
- 檔案寫入 vhtt working tree：`hospital-lab-patterns/docs/task-briefs/TASK_BRIEF_fundoscopy_reminder.md`。
- **要在 vhyl 接手，需先在 vhtt `git commit + push`（YC 或 Claude Code），vhyl `git pull` 後才看得到本 brief。**
- Notion Dashboard 同步：依 rule #7「push 成功後才寫 Notion」→ **本 session 尚未寫 Notion**；push 後再加一列 Status=Open。
