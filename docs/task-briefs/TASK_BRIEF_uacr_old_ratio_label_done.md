# TASK_BRIEF: UACR 舊格式 `RATIO:` label 補抓

> **方向**:vhtt Cowork 發現 → vhtt 評估 + Claude Code 實作
> **產出 session**:vhtt Cowork session, 2026-05-13
> **來源**:FreePSA orderNameFilter brief 的衍生發現
>
> **執行完畢後請改名為 `TASK_BRIEF_uacr_old_ratio_label_done.md`**（rule #6）

---

## 一句話

vhtt `Urine Microalbumin(TT)` 較舊的報告（約 110 年以前）用 `RATIO: N` 輸出
UACR 值，較新的改為 `ALB/CR: N`。目前 UACR pattern 只認 `ALB/CR` 系列，
舊格式 `RATIO:` 漏抓 → 歷史 UACR 數據缺口。

---

## 證據

vhtt 000017679E 的 `Urine Creatinine(TT),Urine Microalbumin(TT)` order：

| 日期 | reportText label | 值 | 被 UACR 抓到？ |
|---|---|---|---|
| 110/08/20 | `RATIO: 4.8` | 4.8 mg/g | ❌ 漏抓 |
| 112/02/07 | `ALB/CR: 7.35` | 7.35 mg/g | ✅ |
| 112/02/07 → 115/02/13 | `ALB/CR: N` | 各值 | ✅ |

格式轉換約在 110–112 年之間（需更多病人確認精確時間點）。

---

## 影響範圍

- **CKD reporter**：早期 CKD 病人的 UACR 歷史趨勢在 ~110 年以前會出現斷層
- **viewer**：UACR sub-page chase 可能補償部分漏抓（若 sub-page 用新格式），
  但若 sub-page 也是 `RATIO:` 就一樣漏
- **computed staging**：KDIGORisk / UACRStage / TaiwanCKD 在缺 UACR 的日期
  不會計算（needs 不滿足），不會產生錯誤值，但會有缺口

---

## 建議修法

### UACR pattern 加 `RATIO` alternation + `orderNameFilter`

```diff
  { id:'UACR',
-   pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr):\s*([<>]?\s*[\d.]+)/i,
+   pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr|RATIO):\s*([<>]?\s*[\d.]+)/i,
+   orderNameFilter: /microalbumin|micro.?albumin|Urine\s*Cr/i,
    ...
```

**`orderNameFilter` 必要性**：`RATIO:` 太泛用（Free PSA 也有），必須限制在
Urine Microalbumin 相關 order 裡才匹配。

覆蓋 orderName：
- `Urine Creatinine(TT),Urine Microalbumin(TT)` ✓（含 "microalbumin" + "Urine Cr"）
- `Urine Microalbumin(TT)` ✓
- `Free PSA(TT)` ✗（正確排除）

### 注意事項

1. **`orderNameFilter` 只在含 `RATIO` 時需要** — 現有的 `ALB/CR` / `UACR` 等
   label 不會出現在非 urine order 裡，加 filter 不會造成回歸。但若 filter 太窄
   可能漏掉某些 vhyl orderName 變體。

2. **需要確認 vhyl 是否也有舊 `RATIO:` 格式** — 若 vhyl 的 Urine Microalbumin
   order 用不同 label（如 `RATTC:`），filter 要涵蓋。

3. **sub-page chase 交互**：UACR 已有 `subpage.orderNameMatch`，加
   `orderNameFilter` 不影響 sub-page chase 行為（兩者獨立判斷）。

---

## Phase 1：取樣驗證（在 Cowork 或 Claude Code 做都行）

找 3–5 個 vhtt 病人有 110 年以前的 Urine Microalbumin order，確認：

1. 舊格式是否一致為 `RATIO: N`（還是有其他變體）
2. 格式轉換的大致時間點
3. vhyl 是否有相同現象（若可跨院查）

---

## Phase 1 取樣結果（2026-05-13 Cowork）

3 個 vhtt 病人，共 4 筆舊格式 + 7 筆新格式：

### 轉換時間點

| chartno | 最後一筆 `RATIO:` | 第一筆 `ALB/CR:` |
|---|---|---|
| 000017679E | 110/08/20 | 111/03/02 |
| 000026353G | 109/09/08 | 111/10/24 |
| 000043524F | 110/03/23 | 110/11/30 |

**轉換發生在 110 年中（約 2021 年中）**，43524F 精確到 110/03→110/11 之間。

### 舊格式樣本（全部為 `RATIO: N`，無其他變體）

| chartno | 日期 | RATIO 值 | mALB | Cr(Urine) | 驗算 mALB/Cr×1000 |
|---|---|---|---|---|---|
| 000017679E | 110/08/20 | 4.8 | 1.2 | 250 | 4.80 ✓ |
| 000026353G | 109/09/08 | 15.79 | 0.6 | 38 | 15.79 ✓ |
| 000043524F | 110/03/23 | 25.53 | 1.2 | 47 | 25.53 ✓ |
| 000043524F | 109/10/06 | 72.73 | 3.2 | 44 | 72.73 ✓ |

### orderName 變體

| 格式時期 | orderName 樣式 |
|---|---|
| 舊（109–110） | `Urine Creatinine(TT),Urine Microalbumin(TT)` 或 `Creatinine,Microalbumin` |
| 新（110–115） | `Urine Microalbumin(TT),Urine Creatinine(TT)` |

兩種都含 `microalbumin`（case-insensitive），`orderNameFilter: /microalbumin/i`
全部覆蓋。

### 結論

- 舊格式一致為 `RATIO: N`，無其他變體 → 直接走建議 diff
- `orderNameFilter: /microalbumin/i` 足夠（比 brief 原本建議的更簡潔）
- vhyl 狀況待確認（但不阻擋 vhtt 修改）

---

## Phase 2：實作（Claude Code）

舊格式確認一致，直接做：

### catalog.js UACR entry

```diff
  { id:'UACR',
-   pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr):\s*([<>]?\s*[\d.]+)/i,
+   pattern: /(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr|RATIO):\s*([<>]?\s*[\d.]+)/i,
+   orderNameFilter: /microalbumin/i,
    displayName:'尿白蛋白／肌酸酐比 (UACR)', shortLabel:'UACR',
```

### WORKLOG 新條目

```
## 2026-05-13 — UACR 加 `RATIO` alternation + orderNameFilter（補抓 110 年前舊格式）

- 作者：claude（與 YC 共同，在 vhtt 動手）
- 範圍：catalog（`patterns/catalog.js` + `dist/patterns.json`）
- 醫院 scope：vhtt（vhyl 待確認但不阻擋）
- 影響 Test ID：`UACR`
- 變更：updated（加 `RATIO` alternation + `orderNameFilter: /microalbumin/i`）
- Rationale：
  vhtt 的 Urine Microalbumin 報告在 110 年中以前用 `RATIO: N` 輸出 UACR，
  之後改為 `ALB/CR: N`。原 UACR pattern 只認 `ALB/CR` 系列，110 年前的
  UACR 全部漏抓。加 `RATIO` alternation 補上，同時加 `orderNameFilter`
  防止與 Free PSA 的 `RATIO:` 衝突。
- 來源：FreePSA orderNameFilter brief 的衍生發現（000017679E 觸發）
- Validation（3 個 vhtt 病人，4 筆舊格式全部驗算吻合）：
  - 000017679E 110/08/20 `RATIO: 4.8` → capture 4.8 ✓
  - 000026353G 109/09/08 `RATIO: 15.79` → capture 15.79 ✓
  - 000043524F 110/03/23 `RATIO: 25.53` → capture 25.53 ✓
  - 000043524F 109/10/06 `RATIO: 72.73` → capture 72.73 ✓
  - 新格式 `ALB/CR: 7.38` 等 → 維持命中 ✓
  - Free PSA(TT) `RATIO: 0.152` → 不命中 ✓（orderName 不含 microalbumin）
```

### release + sync + commit + push

```powershell
cd hospital-lab-patterns ; npm run release
cd ../hospital-lab-viewer ; node sync-patterns.js
cd ../hospital-lab-reporter ; node sync-patterns.js
```

commit message: `patterns: add RATIO alternation to UACR with orderNameFilter (fixes pre-110 gap)`

---

## 完成 checklist

- [x] Phase 1 取樣（3 個病人、4 筆舊格式樣本）
- [x] 確認 orderNameFilter 覆蓋所有 vhtt orderName 變體
- [ ] catalog.js 改 UACR pattern + orderNameFilter
- [ ] WORKLOG 加紀錄
- [ ] npm run release + viewer/reporter sync
- [ ] git commit + push
- [ ] 改名 `_done` + 歸檔
