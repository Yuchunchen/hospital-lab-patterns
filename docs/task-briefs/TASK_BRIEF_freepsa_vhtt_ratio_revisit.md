# TASK_BRIEF: 重新檢視 2026-05-08 FreePSA `RATIO:` 移除決定(vhtt 端)

> **方向**:vhyl 發現 → vhtt 評估與處置
> **產出 session**:vhyl Cowork session, 2026-05-12
> **預計執行 session**:下次 vhtt 開機,需查 vhtt 端 PSA 病人歷史 case
>
> **執行完畢後請改名為 `TASK_BRIEF_freepsa_vhtt_ratio_revisit_done.md`**(rule #6)

---

## 一句話

2026-05-08 把 FreePSA pattern 的 `|RATIO` alternation 移除,當時假設「`RATIO: 0.152` 是 Free/Total 比值」;但 2026-05-12 在 vhyl 發現同類 label(`FREE PSA/PSA RATIO: 0.097`)實為 Free PSA 絕對濃度 ng/mL,推測 2026-05-08 的解讀可能誤判 — 需在 vhtt 端用病人實證重新驗證,決定是否該把 `RATIO:` 加回 alternation。

---

## 背景

### 2026-05-08 紀錄(WORKLOG)

> vhtt 000017679E:PSA=0.631,報告 `RATIO: 0.152` → 被誤存 FreePSA=0.152
> vhtt 000043524F:PSA=0.113,報告 `RATIO: 0.093` → 被誤存 FreePSA=0.093

當時論點:0.152 / 0.093 是 Free/Total 比值(小數形式),不是 ng/mL 濃度。修改後 vhtt 的 `Free PSA(TT)` 報告 FreePSA 都留 null。

### 2026-05-12 vhyl 觀察

vhyl 000025318J 的 `Free PSA(YL)` 報告:

```
FREE PSA/PSA RATIO: 0.097
```

同時段 `PSA(YL)` 為 `PSA: 0.395`。

YC(clinician)在 vhyl 確認:**這個 0.097 是 Free PSA 絕對濃度(ng/mL)**,不是比值。

驗證:0.097 / 0.395 = 24.6% → 屬正常 free/total ratio 範圍。若 0.097 當比值(9.7%),在 PSA 只有 0.395 的病人身上偏低、不合常理。

### 推論

vhyl `FREE PSA/PSA RATIO:` 與 vhtt `RATIO:` 在語意上很可能**同一種值**(都是 Free PSA 絕對濃度),只是兩院 label prefix 不同。

回頭看 2026-05-08 case:

| 病人 | PSA | 「RATIO」值 | 當比值看 | 當絕對濃度看 |
|---|---|---|---|---|
| vhtt 000017679E | 0.631 | 0.152 | 15.2%(可能) | 0.152 ng/mL → ratio 24.1%(正常) |
| vhtt 000043524F | 0.113 | 0.093 | 9.3%(可能但低) | 0.093 ng/mL → ratio 82.3%(極端高) |

兩種解讀都各有問題,單從那兩個 case 無法 100% 判定。需要更多 vhtt 樣本。

---

## 任務

### Phase 1:用 vhtt 樣本驗證

在 vhtt 端找 ≥ 5 個有做過 Free PSA 的病人,看他們的 reportText 樣式。需要的資訊:

1. **label 樣式分佈**:有多少報告是 `RATIO: N`、`Free PSA: N`、`FREE PSA/PSA RATIO: N`、其他?
2. **同病人多次檢驗**:若同一病人前後做兩次 Free PSA,值在合理範圍內 drift 嗎?(若兩次都解讀為「比值」結果一個 9.3% 一個 82.3%,顯然其中至少一個是誤判)
3. **檢驗單外帶報告**:若 vhtt Free PSA 是外送,看送驗單位的單位欄(若有 `ng/mL`、`%`、`fraction` 等線索)

具體做法:在 vhtt 用 ernode 撈 PSA-related order:

```
http://ernode.vghb12.vhtt.gov.tw:8000/order/get_lab_orders?chartno=<9碼+1字>&opsid=<your-opsid>&searchItem=Free%20PSA&limit=20
```

或用「Free PSA」中文翻譯查更廣。

### Phase 2:決策

依 Phase 1 結果,三選一:

- **A. 確認 2026-05-08 誤判** → 把 `RATIO:` 加回 alternation(連同 vhyl 已加的 `FREE PSA/PSA RATIO:`),更正 2026-05-08 WORKLOG 條目加註腳「事後 2026-05-12 重新檢視 → 該值為絕對濃度」。
- **B. 確認 2026-05-08 正確,vhtt 真的就是輸出比值** → 維持現狀,順手在 catalog FreePSA 註解補上「vhtt vs vhyl label 語意差異」說明,避免未來再被同樣的 trigger 案例困惑。
- **C. 兩種樣式並存(部分 order 是濃度、部分是比值)** → 需要新欄位區分,例如 `FreePSARatioReported`(已知比值)+ 既有 `FreePSA`(絕對濃度),catalog 加 entry + 改 PSARatio computed 邏輯。這條最複雜,但若 vhtt 確實兩種都出現過,就只能走這條。

### Phase 3:實作

依 Phase 2 決策動 catalog / computed / WORKLOG。

---

## 與本次 vhyl 改動的關係

2026-05-12 已在 vhyl 走「路線 1」:**只**加 `FREE PSA/PSA RATIO:` alternation,不動 `RATIO:`。所以 vhyl 的 case 已修好,vhtt 行為未變。本 brief 是「revisit 歷史決定」的後續工作,**不**是 vhyl 那次改動的修復需求。

兩件事**不要塞在同一個 commit**。

---

## 完成 checklist

- [ ] Phase 1 vhtt 病人取樣完成,結果寫進本 brief 末段「驗證紀錄」
- [ ] Phase 2 決策落定,WORKLOG 加紀錄(若 A/C 路線:更正 2026-05-08 條目)
- [ ] Phase 3 程式碼改動(若有)+ `npm run release` + viewer/reporter sync-patterns
- [ ] git commit + push(各 repo);問 YC 後再 push
- [ ] 改名加 `_done` 後綴 + Notion 同步

---

## 驗證紀錄(Phase 1 完成後填)

(等 vhtt session 補)
