# TASK_BRIEF: FreePSA 加 orderNameFilter 防止 UACR `RATIO:` 誤匹配

> **方向**:vhtt Cowork 發現 → Claude Code 實作
> **產出 session**:vhtt Cowork session, 2026-05-13
> **執行完畢後請改名為 `TASK_BRIEF_freepsa_orderNameFilter_done.md`**（rule #6）

---

## 一句話

剛加回的 `RATIO` alternation 把 `Urine Microalbumin(TT)` 舊格式報告裡的
`RATIO: 4.8`（UACR 值）誤抓成 FreePSA。加 `orderNameFilter: /Free\s*PSA/i`
限制匹配範圍即可。

---

## 觸發 case

vhtt 000017679E：viewer 出現 110/08/21 Free PSA = 4.8（不存在）。

實際來源：
```
Urine Creatinine(TT),Urine Microalbumin(TT)   ← orderName
URINE
Creatinine(24hrs Urine): 250
mALB: 1.2
RATIO: 4.8       ← 這是 UACR (mg/g)，被 FreePSA regex 誤抓
請判讀
檢驗 110/08/20 08:44
```

同病人較新的 Urine Microalbumin 報告已改用 `ALB/CR: 7.38`，但 110 年舊格式
仍為 `RATIO:`。

---

## 根因

`RATIO:` 至少出現在兩種 order 的 reportText：

| Order | `RATIO:` 語意 | 值域 |
|---|---|---|
| `Free PSA(TT)` / `FREE PSA` | Free PSA 絕對濃度 ng/mL | 0.01–2 |
| `Urine Microalbumin(TT)` | UACR (albumin/creatinine ratio) mg/g | 1–3000+ |

FreePSA regex 不區分 orderName，任何 reportText 含 `RATIO: N` 都會命中。

---

## 修改

### `patterns/catalog.js` — FreePSA entry 加一行

```diff
  { id:'FreePSA',
    // ... notes ...
    pattern: /(?:Free PSA|FREE PSA\/PSA RATIO|RATIO):\s*([<>]?\s*[\d.]+)/,
+   orderNameFilter: /Free\s*PSA/i,
    displayName:'游離 PSA (Free PSA)', shortLabel:'Free PSA',
    unit:'ng/mL', category:'癌症指數',
    gender:'M' },
```

`orderNameFilter` 讓 extractLabValues 只在 orderName match `/Free\s*PSA/i`
的 order 裡跑 FreePSA regex。覆蓋：
- `Free PSA(TT)` ✓
- `FREE PSA` ✓
- `Urine Microalbumin(TT)` ✗（正確排除）

### WORKLOG.md — 在 5/13 條目末尾加 patch 紀錄

```
### 同日追加：FreePSA 加 orderNameFilter（防 UACR `RATIO:` 誤匹配）

- 觸發 case：vhtt 000017679E 出現不存在的 110/08/21 Free PSA = 4.8
- 根因：`Urine Microalbumin(TT)` 舊格式報告用 `RATIO: 4.8`（UACR mg/g），
  被 FreePSA 的 `RATIO` alternation 誤抓
- Patch：`orderNameFilter: /Free\s*PSA/i`
- Validation：
  - 000017679E Free PSA(TT) `RATIO: 0.152` → 命中 ✓（orderName match）
  - 000017679E Urine Microalbumin(TT) `RATIO: 4.8` → 不命中 ✓（orderName 排除）
```

### 跑 release + sync

```powershell
cd hospital-lab-patterns ; npm run release
cd ../hospital-lab-viewer ; node sync-patterns.js
cd ../hospital-lab-reporter ; node sync-patterns.js
```

### git commit + push（自動，非破壞性改動）

```
patterns: add orderNameFilter to FreePSA (fixes UACR RATIO false positive)
```

---

## 衍生發現（不在本 brief 範圍）

UACR entry 的 pattern 不認得舊格式 `RATIO:`（110 年之前的 Urine Microalbumin
報告），只認新格式 `ALB/CR:`。若需要覆蓋舊 UACR 資料，可考慮：
- UACR pattern 加 `RATIO` alternation + `orderNameFilter: /microalbumin|micro.*alb/i`
- 但影響範圍需另開 brief 評估

---

## 完成 checklist

- [ ] catalog.js 加 orderNameFilter
- [ ] WORKLOG 加紀錄
- [ ] npm run release + viewer/reporter sync
- [ ] git commit + push
- [ ] 改名 `_done` + 歸檔
