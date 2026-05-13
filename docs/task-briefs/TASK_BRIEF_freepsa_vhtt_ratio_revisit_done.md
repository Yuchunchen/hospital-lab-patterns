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

- [x] Phase 1 vhtt 病人取樣完成,結果寫進本 brief 末段「驗證紀錄」
- [x] Phase 2 決策落定,WORKLOG 加紀錄(路線 A:已更正 2026-05-08 條目加註腳)
- [x] Phase 3 程式碼改動 + `npm run release` + viewer/reporter sync-patterns
- [ ] git commit + push(各 repo);問 YC 後再 push
- [x] 改名加 `_done` 後綴(2026-05-13);Notion 同步待 YC

---

## 驗證紀錄

### Phase 1 — vhtt 取樣(2026-05-13 Cowork session)

用 ernode API + Claude in Chrome 撈了 3 個 vhtt 病人(Free PSA 是少見檢驗,隨機 chartno 命中率低):

| # | chartno | orderName | PSA (ng/mL) | RATIO 值 | reportText label |
|---|---|---|---|---|---|
| 1 | 000017679E | Free PSA(TT) | 0.631 | 0.152 | `RATIO: 0.152 (Free PSA/Total PSA ratio:>25%),Total PSA值落在4-10 ng/mL...` |
| 2 | 000043524F | Free PSA(TT) | 0.113 | 0.093 | 同上模板 |
| 3 | 000026353G | FREE PSA | 0.241 | 0.079 | 同上模板 |

**Label 樣式**:vhtt 全部是 `RATIO: N.NNN`，後接固定 boilerplate 說明文字。

**報告 boilerplate 內容**:`(Free PSA/Total PSA ratio:>25%),Total PSA值落在4-10 ng/mL的病患，測定其Percent Free PSA，若Percent Free PSA＞25%則表示為良性，不需做Biopsy。若Percent Free PSA＜25%則表示可能為惡性，需做Biopsy確認`。此段為檢驗科固定附加的**判讀指引**，描述的是 ratio 的臨床意義，而非 `RATIO:` 數值本身的語意。

### Phase 2 — 決策(2026-05-13)

**YC(clinician)裁定:路線 A。**

> 無論 vhtt 或 vhyl，`RATIO:` 後面的值就是 Free PSA 絕對濃度(ng/mL)。
> 兩院 label 不同但語意相同。2026-05-08 移除 `RATIO` alternation 是誤判。

YC 同時指出:vhtt 病人 000017679E、000043524F 的 Free PSA 值目前在 viewer 顯示為空(missing)——這正是 5/8 移除 `RATIO` alternation 造成的。

### Phase 3 — Claude Code 實作指示

#### 3a. `patterns/catalog.js` FreePSA entry

修改 regex,加回 `RATIO`:
```js
// 修改前(current)
pattern: /(?:Free PSA|FREE PSA\/PSA RATIO):\s*([<>]?\s*[\d.]+)/,

// 修改後
pattern: /(?:Free PSA|FREE PSA\/PSA RATIO|RATIO):\s*([<>]?\s*[\d.]+)/,
```

同時**全面改寫 notes**,移除 5/8 那段錯誤論述:
```js
// 2026-05-08: 原本移除 `|RATIO` alternation,錯誤假設 vhtt `RATIO:` 值為
// Free/Total 比值。2026-05-13 vhtt 端以 3 個病人取樣驗證(000017679E /
// 000043524F / 000026353G),YC(clinician)確認:vhtt 與 vhyl 的 RATIO
// 值都是 Free PSA 絕對濃度(ng/mL),報告後接的 boilerplate 是判讀指引,
// 不是數值語意描述。故加回 `RATIO` alternation。
// Label 樣式覆蓋:
//   vhtt: `RATIO: 0.152`         ← Free PSA(TT) / FREE PSA
//   vhyl: `FREE PSA/PSA RATIO: 0.097`  ← Free PSA(YL)
//   通用: `Free PSA: N`          ← 其他院區(若有)
```

#### 3b. WORKLOG.md

在最上面加新條目:

```
## 2026-05-13 — FreePSA 加回 `RATIO:` alternation(更正 2026-05-08 誤判)

- 作者:claude(與 YC 共同,在 vhtt 動手)
- 範圍:catalog(`patterns/catalog.js` + `dist/patterns.json`)
- 醫院 scope:both(vhtt 主要受益;vhyl 已有 FREE PSA/PSA RATIO 涵蓋)
- 影響 Test ID:`FreePSA`
- 變更:updated(加回 `RATIO` alternation,更正 5/8 註解)
- Rationale:
  2026-05-08 移除 `|RATIO` 時錯誤假設 vhtt `RATIO: 0.152` 為 Free/Total
  比值。2026-05-13 在 vhtt 取樣 3 個病人(000017679E / 000043524F /
  000026353G),YC 確認 RATIO 值為 Free PSA 絕對濃度(ng/mL),報告後接
  的 boilerplate 為判讀指引而非數值語意。加回 alternation 讓 vhtt 的
  Free PSA 重新被正確擷取。
- 變更後 pattern:
  `/(?:Free PSA|FREE PSA\/PSA RATIO|RATIO):\s*([<>]?\s*[\d.]+)/`
- Validation(vhtt):
  - 000017679E `RATIO: 0.152` → capture `0.152` ✓(先前 null)
  - 000043524F `RATIO: 0.093` → capture `0.093` ✓(先前 null)
  - 000026353G `RATIO: 0.079` → capture `0.079` ✓(先前 null)
  - vhyl 000025318J `FREE PSA/PSA RATIO: 0.097` → capture `0.097` ✓(維持)
  - 假想 `Free PSA: 1.23` → capture `1.23` ✓(維持)
```

同時在 2026-05-08 那段 WORKLOG 條目末尾**加註腳**:
```
- ⚠️ 事後更正(2026-05-13):上述「RATIO 是比值」的判斷為誤判。
  vhtt RATIO 值實為 Free PSA 絕對濃度(ng/mL)。已在 2026-05-13 加回
  RATIO alternation,詳見當日 WORKLOG 條目。
```

#### 3c. `npm run release` + sibling sync

```powershell
cd hospital-lab-patterns
npm run release

cd ../hospital-lab-viewer
node sync-patterns.js

cd ../hospital-lab-reporter
node sync-patterns.js
```

#### 3d. brief 歸檔

```powershell
cd hospital-lab-patterns/docs/task-briefs
git mv TASK_BRIEF_freepsa_vhtt_ratio_revisit.md TASK_BRIEF_freepsa_vhtt_ratio_revisit_done.md
```

與 code 改動同一個 commit。

#### 3e. git commit(push 前問 YC)

```
patterns: restore RATIO alternation in FreePSA (corrects 2026-05-08 removal)
```
