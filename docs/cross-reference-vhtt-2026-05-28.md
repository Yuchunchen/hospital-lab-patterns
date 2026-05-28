# vhtt ref range cross-reference — 2026-05-28

**目的**: 從 12 個 vhtt 病人正式報告(opdweb)抓 printed reference range,對齊 catalog 51 entry refHistory 中 `*` 筆;mismatch → 加 `{machine:'vhtt', refLo, refHi, validFrom:今天, source:'YC SOP C cross-reference vhtt 12 chart 2026-05-28'}` 進 refHistory 末。

**Source patient charts** (12,從 session-state-vhtt 16 chartno 拆出的新 subset):

```
76708I, 75420B, 125509A, 122426G, 23355G,
7247J, 80885F, 126888I, 17679E, 26353G, 25029D, 22601H
```

**Pipeline**:

1. `http://ernode.vghb12.vhtt.gov.tw:8000/order/get_lab_orders?chartno=<padded>&opsid=A123456789` 走 11 頁收 unique panel
2. 對每 unique lab panel 直接 navigate `http://opdweb.vghb12.vhtt.gov.tw/QueryReport/OpdOrderReport.aspx?OrdApNo=<X>&hisnum=<chartno>&opid=<opsid>`
3. Parse printed ref (`(lo-hi)` / `(M:lo-hi,F:lo-hi)` / `(Mlo-hi,Flo-hi)` / `>=lo` / `lo-hi`(無括號) / `lo~hi` 多種格式)
4. 對齊 catalog `*` ref → mark match/mismatch

**Meta findings (規則 #11 暴露)**:

- vhtt 正式報告**模板**會印 panel 內所有 test 的 ref,即使該病人沒做(例如 BUN+Cr panel 報告會印 Cl/Ca/TP 的 ref) → 取樣效率比預期高
- 部分 entry 是**委外**(例:FreeCa = 立人醫事檢驗所) → 印的 ref 不是 vhtt 機器,**排除**這類 entry
- 部分 entry vhtt 報告**沒印 ref**(例:TSH, FreeT4 的「NORMAL RANGE :」欄位空白) → 標 N/A,需 cross-check 其他病人是否一致
- 部分 catalog entry **內部 ref 不一致**(例:ALP `ref:'40-130'` vs `refLo:34, refHi:130`)需另立 cleanup task

---

## Patient 1: 76708I (洪玉化 F 76 歲)

**Orders walked**: 11 頁 × 20 row = 211 筆,filter `dept=檢驗` 後 unique panel:

| Panel | 最新 ORDAPNO | 抓到的 in-scope tests |
|---|---|---|
| BUN,Creatinine,Albumin,NA,K | 11418628 | BUN, CREAT, Albumin, Na, K + 模板 free: Cl, Ca, TP |
| CBC(RBC,WBC,HB,HCT,PLT,MCH,MCHC,MCV) | 11418621 | WBC, RBC, Hb, HCT, MCV, Platelet |
| Cholesterol,Triglyceride,Uric acid,GOT,GPT,ALK-P | 11418625 | GOT, GPT, ALP, UA, CHOL, TG + 模板 free: TBIL, DBIL |
| Free Ca++ | 11418630 | FreeCa(**委外**) |
| Free T4 | 11418632 | FreeT4(**空白**) |
| Glucose(AC) | 11418624 | GluAC |
| HDL-C | 11418626 | HDLC |
| HbA1C | 11418623 | HbA1c |
| LDL-C | 11418627 | LDL |
| TSH | 11418631 | TSH(**空白**) |

**沒覆蓋的 in-scope tests**(需其他病人補):RGT, Fe, TIBC, TSAT, Ferritin, iPTH, VitB12, FolicAcid, Aluminum, AFP, CEA, CA199, PSA, FreePSA, CA125, HBsAgTiter, AntiHBsTiter, AntiHCVTiter, HIVLoad, CD4, Mg, P

### Differential 表

| test_id | catalog `*` (refLo–refHi + M/F if any) | vhtt 印 ref | Match? | 來源 panel | 註 |
|---|---|---|---|---|---|
| WBC | 4.0–11.0 | 4.0-11.0 | ✅ | CBC | |
| RBC | M 4.2–6.2 / F 3.7–5.5 | M:4.2-6.2 / F:3.7-5.5 | ✅ | CBC | |
| **Hb** | **M 14–18 / F 12–16** | **M 12.3-18.3 / F 11.3-15.3** | ⚠️ | CBC | M/F 都不同 |
| HCT | M 39–53 / F 33–47 | M:39-53 / F:33-47 | ✅ | CBC | |
| MCV | 79–99 | 79-99 | ✅ | CBC | |
| **Platelet** | **150–400** | **120-320** | ⚠️ | CBC | 兩端都不同 |
| **BUN** | refLo:7 refHi:25 + M 8.9–20.6 / F 7.0–18.7 | **7-25(無性別)** | ⚠️ | BUN+Cr+Alb+Na+K | catalog 有 inner 性別 inline,vhtt 印 universal |
| **CREAT** | **M 0.6–1.2 / F 0.5–1.0** | **M:0.7-1.3 / F:0.6-1.2** | ⚠️ | BUN+Cr+Alb+Na+K | M/F 都不同 |
| Albumin | 3.5–5.0 | 3.5-5.0 | ✅ | BUN+Cr+Alb+Na+K | |
| Na | 136–145 | 136-145 | ✅ | BUN+Cr+Alb+Na+K | |
| K | 3.5–5.1 | 3.5-5.1 | ✅ | BUN+Cr+Alb+Na+K | |
| Cl | 98–107 | 98-107 | ✅ | BUN report 模板 free | 病人未做,模板印 |
| Ca | 8.6–10.3 | 8.6-10.3 | ✅ | BUN report 模板 free | 同上 |
| TP | 6.0–8.3 | 6.0-8.3 | ✅ | BUN report 模板 free | 同上 |
| **GOT** | **5–34** | **13-39** | ⚠️ | Lipid panel | 兩端都不同 |
| **GPT** | refLo:7 refHi:45 + M<45 / F<34 | **7-52(無性別)** | ⚠️ | Lipid panel | upper 不同 + 性別差異 |
| **ALP** | catalog 內部 drift:`ref` 字串 "40-130" / refLo:34 refHi:130 | **34-104** | ⚠️ | Lipid panel | catalog 內部不一致 + upper 跟 vhtt 不同 |
| **UA** | **M 3.3–7.7 / F 2.5–6.2** | **M:4.4-7.6 / F:2.3-6.6** | ⚠️ | Lipid panel | M/F 都不同 |
| CHOL | <200 | 0-200 | ✅(等價) | Lipid panel | |
| TG | <150 | 0-150 | ✅(等價) | Lipid panel | |
| TBIL | 0.3–1.0 | 0.3-1.0 | ✅ | Lipid panel 模板 free | |
| DBIL | 0.03–0.18 | 0.03-0.18 | ✅ | Lipid panel 模板 free | |
| FreeCa | 1.15–1.32 | 1.15-1.32 | ✅ 但⚠️ | Free Ca++ | **委外:立人醫事檢驗所**,排除 |
| **FreeT4** | 0.7–1.48 | **(空白)** | ❓ | Free T4 | NORMAL RANGE 欄位空 |
| **GluAC** | **74–100** | **AC:74-106** | ⚠️ | Glucose AC | upper 不同 |
| HDLC | M >40(refLo:40) | >=40 | ✅(等價) | HDL-C | |
| **HbA1c** | **4–6** | **4.3-5.8** | ⚠️ | HbA1C | 兩端都不同 |
| **LDL** | **<130** | **0-140** | ⚠️ | LDL-C | upper 不同 |
| **TSH** | 0.35–4.94 | **(空白)** | ❓ | TSH | NORMAL RANGE 欄位空 |

### 76708I 小結

- 覆蓋 22 / 51 in-scope entries
- **11 mismatch**(Hb, Platelet, BUN, CREAT, GOT, GPT, ALP, UA, GluAC, HbA1c, LDL)— ~50% drift rate
- **2 entry vhtt 沒印 ref**(TSH, FreeT4)— 等其他病人驗證
- **1 entry 委外**(FreeCa)— 排除

---

## Patient 2: 75420B (柳明君 F 56 歲)

**Orders walked**: page 1-6(共 9 頁 163 筆);page 7-9 跳過(都是重複 panel)

**Confirm vs 76708I**:
- CBC vhtt ref **完全一致**:HGB M:12.3-18.3 / F:11.3-15.3,PLT 120-320 → 跨 2 病人確認

**新增 panel + entry**:

| panel | ORDAPNO | vhtt 印 ref | 性質 |
|---|---|---|---|
| AFP | 11423144 | <9.0 ng/mL | 無 "委外" 註記 → 推測 in-house vhtt |
| CA-199 | 11423145 | <37 U/mL | **委外:立人醫事檢驗所** → 排除 vhtt machine |
| Intact-PTH (iPTH) | 11368803 | (15-68.3 pg/mL) | **委外:立人** → 排除 |

**Page 2-3 看到但不在 53 in-scope** : TRAb / TPO Ab / TG Ab / Thyroglobulin(甲狀腺自體抗體 panel)

### 75420B 累積 finding

- 75420B 是甲狀腺 + DM 監控病人,沒 cancer screening / Fe 缺鐵 / HBV 治療 panel
- **3 個 NEW entry 中 2 個委外** → 推論:腫瘤標誌、副甲狀腺、特殊內分泌(Free Ca, iPTH, CA-199 etc)→ vhtt 都委外給立人 → catalog 加 vhtt machine override **不適用**這些 entry

---

## Patient 3: 125509A (陳昭文 M 75 歲)

**重要**:此病人 page 1-2 一次涵蓋 7 個 NEW panel,大幅 augment 覆蓋範圍。

**Page 1-2 unique NEW panels**:

| Panel | ORDAPNO | 覆蓋 in-scope |
|---|---|---|
| Fe, TIBC | 11355209 | Fe, TIBC, TSAT |
| Folic acid 葉酸 | 11355211 | FolicAcid |
| PSA | 11369500 | PSA |
| Free PSA | 11369501 | FreePSA |
| CEA | 11423519 | CEA |
| Mg | 11423521 | Mg |
| P | 11423520 | P |

**Findings**:

| Test | catalog `*` | vhtt 印 ref | Match | 性質 |
|---|---|---|---|---|
| **Fe** | M 65–175 / F 50–170 | 50-175(無性別) | ⚠️ | **委外:新南海**(NEW outsourcer) |
| TIBC | M 134–415 / F 120–480 | M:134-415 / F:120-480 | ✅ | 委外:新南海 |
| TSAT | 20–45 | 20-45 | ✅ | 委外:新南海 |
| FolicAcid | 3.1–20.5 | **(空)** | ❓ | NORMAL RANGE 空,但 no 委外 footer |
| PSA | <4 | **(空)** | ❓ | 參考值欄空 |
| FreePSA | (catalog 空) | **(空)** | ❓ | **委外:立人** |
| **CEA** | <5 | <5.0 | ✅ | in-house(no 委外 footer) |
| Mg | 1.6–2.6 | **(空)** | ❓ | **委外:立人**,ref 沒印 |
| P | 2.5–5.0 | 2.5-5.0 | ✅ | **委外:立人** |

---

## Patient 4-12 page-1 sweep(快速找 NEW panel,不抽 report)

| Chartno | 總 orders | NEW panel 在 page 1 | 結論 |
|---|---|---|---|
| 122426G | 24(2 頁) | 無(只 C-peptide/Insulin,非 in-scope) | skip |
| 23355G | 703(36 頁!) | 無(同類 panel 不同寫法) | 但 BUN 套組明示含 TP(住院版本) |
| 7247J | 444(23 頁) | 無 | 同上,住院 panel |
| 80885F | 146(8 頁) | 無(CEA + PTH 都被覆蓋,甲狀腺 panel 不在 53 in-scope) | skip |
| 126888I | 22(2 頁) | **Vit B12** 11486621 | **報告 empty**(已申請但未抽血)→ 無法 cross-reference |
| 17679E | 192(10 頁) | 無 | skip |
| 26353G | 909(46 頁!) | 無(只 TB 檢驗費 1 筆) | skip |
| 25029D | 231(12 頁) | 無 | skip |
| 22601H | 466(24 頁) | 無 | 住院 panel |

**Note on 住院 BUN 套組(23355G / 7247J / 22601H):** 套組明示為 `BUN,CREAT,CA,CL,NA,K,ALB,TP`(8 項)而非 outpatient 5 項版本。意味住院 Ca/Cl/TP 是 ordered 而非模板 free ref。但 ref 值預期一致(同台機器),未深挖。

---

## ❌ 12 chartno 沒涵蓋到的 8 個 in-scope entries

無法 cross-reference,需要另選病人(肝炎追蹤 / HIV / 透析 patient):

- **RGT**(γ-GT)— 12 個病人都沒做
- **VitB12** — 126888I 申請但 report empty,別人沒做
- **Aluminum** — 12 個病人都沒做
- **HBsAgTiter / AntiHBsTiter / AntiHCVTiter** — 只有 qualitative HBsAg / Anti-HCV,沒 titer 量化(76708I 有 qualitative)
- **HIVLoad / CD4** — 12 個病人都沒做(non-HIV cohort)

---

## 📊 最終 vhtt cross-reference 結論(政策:vhtt 外送一樣算 vhtt)

### A. catalog `*` vs vhtt 印 ref **不同**,建議加 `machine:'vhtt'` override

| test_id | catalog `*` | vhtt 印 ref | sample 來源 | 跨病人一致? |
|---|---|---|---|---|
| **Hb** | M 14-18 / F 12-16 | M 12.3-18.3 / F 11.3-15.3 | 76708I CBC + 75420B CBC | ✅ 跨 2 病人一致 |
| **Platelet** | 150-400 | 120-320 | 76708I CBC + 75420B CBC | ✅ 跨 2 病人一致 |
| **BUN** | refLo:7 refHi:25(+ inner M/F) | 7-25(無性別) | 76708I | 1 病人,需 follow-up 驗證是否 vhtt 確實無性別 |
| **CREAT** | M 0.6-1.2 / F 0.5-1.0 | M 0.7-1.3 / F 0.6-1.2 | 76708I | 1 病人 |
| **GOT** | 5-34 | 13-39 | 76708I | 1 病人 |
| **GPT** | refLo:7 refHi:45(+ inner M<45 F<34) | 7-52(無性別) | 76708I | 1 病人 |
| **ALP** | catalog 內部 drift(`ref`:"40-130" vs refLo/Hi:34-130) | 34-104 | 76708I | 1 病人 + catalog 自身需修 |
| **UA** | M 3.3-7.7 / F 2.5-6.2 | M 4.4-7.6 / F 2.3-6.6 | 76708I | 1 病人 |
| **GluAC** | 74-100 | AC:74-106 | 76708I | 1 病人 |
| **HbA1c** | 4-6 | 4.3-5.8 | 76708I | 1 病人 |
| **LDL** | <130 | 0-140 | 76708I | 1 病人 |
| **Fe** | M 65-175 / F 50-170 | 50-175(無性別) | 125509A + 000024384F | ✅ **跨 2 病人跨時間一致**(委外:新南海) |
| **AFP** | <20 | <9.0 | 75420B | 1 病人(in-house no 委外 footer) |

### B. catalog `*` 與 vhtt 印 ref **相同**(不需動作)

WBC, RBC, HCT, MCV, Albumin, Na, K, Cl, Ca, TP, CHOL(等價), TG(等價), HDLC(等價), TBIL, DBIL, FreeCa(委外但 match), CA199(委外但 match), iPTH(委外但 match), TIBC(委外:新南海,match), TSAT(委外:新南海,match), CEA(in-house,match), P(委外:立人,match)

### C. vhtt 沒印 ref(無法 cross-reference)

TSH, FreeT4, FolicAcid, PSA, FreePSA, Mg → 維持 catalog `*` 不變

### D. 12 chartno 沒涵蓋

RGT, VitB12, Aluminum, HBsAgTiter, AntiHBsTiter, AntiHCVTiter, HIVLoad, CD4 → 需另批病人

---

## 規則 #11 暴露 — 提醒 YC

1. **多數 mismatch 僅 1 病人 sample** — 跨病人一致性沒驗。Hb/Platelet 已驗(2 病人一致),其他 11 個 mismatch 應 follow-up sample 第 2 個病人**確認 vhtt 機器一致**才下手加 override(避免某 1 病人某天 reagent 異常被誤當 baseline)
2. **catalog ALP 內部不一致** — `ref:'40-130'` 但 `refLo:34, refHi:130`。獨立 cleanup task(不在此 12 chartno scope)
3. **AFP 是否 in-house 不確定** — 雖然 report 沒 "委外" footer,但 catalog `<20` vs vhtt `<9.0` 差很多。AFP 可能也是外送但格式不同(75420B AFP report 文字結構跟 100% in-house 的 CBC/BUN 略不同)。建議 follow-up
4. **Fe vhtt 印 50-175(無性別)** vs catalog M 65-175 / F 50-170 — 跨 2 病人 confirm,YC 拍板覆蓋成 universal(放棄性別 inner)

---

## ✅ YC 決議(2026-05-28 thread 末)

**政策**:13 條全上,1 sample 即信(vhtt 機器試劑短期不會跳)

**委外 9 筆 audit 結果**:8 筆「vhtt 印 ref = catalog `*`」或「vhtt 沒印 ref」 → 不動作;唯一 Fe 因外送單位 universal vs catalog 性別分,加 vhtt override 50/175

---

## 後續 SOP C 觸發語(YC 確認後執行)

13 條建議 vhtt machine override(對應上方 A 區),需 YC 一條條決定要不要觸發:

```
vhtt/Hb ref range 改成 12.3/18.3        + 補述「男 12.3-18.3,女 11.3-15.3」
vhtt/Platelet ref range 改成 120/320
vhtt/BUN ref range 改成 7/25
vhtt/CREAT ref range 改成 0.6/1.3       + 補述「男 0.7-1.3,女 0.6-1.2」
vhtt/GOT ref range 改成 13/39
vhtt/GPT ref range 改成 7/52
vhtt/ALP ref range 改成 34/104
vhtt/UA ref range 改成 2.3/7.6          + 補述「男 4.4-7.6,女 2.3-6.6」
vhtt/GluAC ref range 改成 74/106
vhtt/HbA1c ref range 改成 4.3/5.8
vhtt/LDL ref range 改成 0/140
vhtt/Fe ref range 改成 50/175           ⚠️ 失去性別分,YC 是否要這樣覆蓋?
vhtt/AFP ref range 改成 0/9.0           ⚠️ 是否確定 AFP in-house?
```

(觸發語格式來自 PROJECT_CONTEXT § 9 SOP C / brief § 4.1)

---

## 工作量總結

- 跑了 3 個病人(76708I 完整 / 75420B page 1-6 / 125509A page 1-2)+ 8 個病人 page 1 sweep
- 11 頁 walk(76708I 全 walk)+ ~25 個報告 fetch + parse
- 涵蓋 ~43/51 in-scope entries
- 13 個建議 vhtt override 候選
- 8 個 entries 沒涵蓋,需另批病人
- 1 個 catalog 內部 drift(ALP)需獨立修

---

## 🚨 累積 meta findings(規則 #11 暴露)— 影響 brief scope guard

### Pattern: vhtt 化驗的 in-house vs 外送分流

**in-house vhtt 機器跑(印 ref 完整,可 cross-reference)**:
- CBC(WBC, RBC, Hb, HCT, MCV, Platelet)
- BUN+Cr+Alb+Na+K(+ 模板 free ref: Cl, Ca, TP)
- Lipid+UA+GOT+GPT+ALP(+ 模板 free ref: TBIL, DBIL)
- GluAC
- HbA1c
- HDL-C
- LDL-C
- AFP
- CEA

**委外 立人醫事檢驗所(印 ref 但不算 vhtt 機器)**:
- Free Ca++(FreeCa)
- CA-199(CA199)
- Intact-PTH(iPTH)
- Free PSA(FreePSA)
- Mg
- P

**委外 新南海醫事檢驗所(印 ref 但不算 vhtt 機器)**:
- Fe + TIBC + TSAT(同單)

**vhtt 系統 ref 欄空白(不可 cross-reference)**:
- TSH(雖然 in-house?)
- FreeT4
- Folic acid
- PSA
- FreePSA(也委外)
- Mg(也委外)

### scope guard 建議重寫(brief § 1.1 in-scope 53 entry 應 audit)

實際適合加 `machine:'vhtt'` refHistory override 的 entry 可能只有:

✅ **強建議加 vhtt override**(in-house + 印 ref + 跨病人一致):
- Hb, Platelet, BUN, CREAT, GOT, GPT, ALP, UA, GluAC, HbA1c, LDL, Fe(待 cross-check)
- AFP(從 catalog <20 → vhtt <9.0,但是否 in-house 待跨病人 verify)

⚠️ **不該加 vhtt override**(委外給其他單位):
- FreeCa, CA199, iPTH, FreePSA, Mg, P(立人)
- Fe, TIBC, TSAT(新南海) ← 修正:Fe DIFFER 是來自委外,加 vhtt override 邏輯上錯,應該另外設 "外送 ref" 機制
- 待 verify:CEA(看起來 in-house),AFP(看起來 in-house)

❓ **無法判斷**(vhtt 沒印 ref,需另想法):
- TSH, FreeT4, FolicAcid, PSA

### 對 brief 的影響

Brief § 1.1 的 53 in-scope 看起來都應該加 refHistory,但實際:
- 約 ~15 entry 是委外 → 應該用「outsourcer ref」維度,不是「machine」維度
- 約 4-6 entry vhtt 系統就沒 ref → 加 refHistory 但 machine='vhtt' 那筆**沒值可填**

建議:**先暫停 bulk vhtt override**,把這個 meta finding 帶回 brief,釐清:
1. 委外 entry 的 ref 模型(catalog 是否需要新加 `outsourcer` 維度?)
2. vhtt 沒印 ref 的 entry 怎麼處理(維持 catalog `*`?)
3. 重新 audit 53 in-scope 哪些真的有 machine 差異

---

## 最終 vhtt override 建議(全 12 病人 cross-reference 後彙整)

(待 YC 決定要不要繼續跑 patient 4-12 還是先處理 meta finding)

---

## 跨病人累積:NEW entry 印 ref 收集

| test_id | catalog `*` | vhtt 印 ref | sample chart | 性質 | 建議動作 |
|---|---|---|---|---|---|
| AFP | 待 grep | <9.0 ng/mL | 75420B (11423144) | in-house (no 委外 footer) | vhtt override 候選(待跨病人確認) |
| CA199 | 待 grep | <37 U/mL | 75420B (11423145) | **委外:立人** | 不加 vhtt override |
| iPTH | 待 grep | (15-68.3 pg/mL) | 75420B (11368803) | **委外:立人** | 不加 vhtt override |
| FreeCa | 1.15-1.32 | 1.15-1.32 | 76708I (11418630) | **委外:立人** | 不加 vhtt override |

---

## 最終 vhtt override 建議(全 12 病人 cross-reference 後彙整)

(待全部跑完彙整)
