# TASK_BRIEF — patterns repo:GPT/RGT/BUN/CREAT/UA 性別感知 threshold 補完

> **Status:** ACTIVE — 等 Claude Code 接手實作
> **Last updated:** 2026-05-05
> **Scope:** 5 條 catalog entry 補 `hiM`/`hiF`,沿用 2026-05-05 已建好的 schema 機制
> **觸發:** Issue 1 收尾的 backlog 第 1 條

---

## 1. 問題陳述

2026-05-05 的 Issue 1 batch 已經把 schema 加上 `loM/hiM/loF/hiF` 並遷移
RBC / Hb / HCT / Fe / TIBC / Ferritin 6 條(誤判 case)。剩下 5 條 catalog
entry 的 `hi` 鎖男性、`lo:null`,女性中段值會「漏 alarm」(不誤判但少警示)。
本輪沿用同一套機制把它們補上,只動 patterns repo。

(GOT 在原始 backlog 名單內,但 catalog ref 是 `5–34 U/L` 沒分性別,不需遷移。)

## 2. 五條 entry 的設計

| ID | line | 現況 ref | 加的欄位 | fallback hi | fallback lo |
|---|---|---|---|---|---|
| GPT | ~107 | 男<45,女<34 U/L | hiM:45, hiF:34 | 45 (不變) | null (不變) |
| RGT | ~113 | 男<55,女<38 U/L | hiM:55, hiF:38 | 55 (不變) | null (不變) |
| BUN | ~199 | 男 8.9–20.6,女 7.0–18.7 mg/dL | hiM:20.6, hiF:18.7 | **25.7 維持原值** | null (不變) |
| CREAT | ~229 | 男 0.6–1.2,女 0.5–1.0 mg/dL | hiM:1.2, hiF:1.0 | 1.2 (不變) | null (不變) |
| UA | ~237 | 男 3.3–7.7,女 2.5–6.2 mg/dL | hiM:7.7, hiF:6.2 | 7.7 (不變) | null (不變) |

**設計關鍵:**

1. 這 5 條原本都 `lo:null`,只 alarm 高邊。本輪**不加 `loM/loF`**,維持醫學意圖
   不無端引入低值 alarm。
2. BUN 的 fallback `hi:25.7` 是原作者對「男性 ULN 20.6」加的軟緩衝,unknown
   gender 時保留;已知性別則精準用 `hiM:20.6` / `hiF:18.7`(這是預期的設計
   緊縮,不是 regression)。
3. 其他 4 條的 fallback hi 等於男性 hi,跟原值一致,unknown gender 行為不變。

## 3. catalog.js 修改範例(以 GPT 為例,其他 4 條同模式)

```js
{ id:'GPT',
  pattern: /GPT:\s*([\d.]+)/,
  displayName:'丙胺酸轉氨酶 (GPT / ALT)', shortLabel:'GPT/ALT',
  unit:'U/L', category:'肝功能',
  ref:'男<45，女<34 U/L',
  refLo:7, refHi:45,
  hiM:45, hiF:34,                    // ← 新增
  hi:45, lo:null },                  // fallback 不變
```

`loM` / `loF` 不加。schema validate 應該允許「只有 hiM/hiF 沒有 loM/loF」的情形。
2026-05-05 的 schema 已將四欄都設為 optional,應不需再改 schema.js。如果 validate
意外拒絕,加上「成對欄位非強制,各欄位獨立 optional」的允許邏輯。

## 4. 不需要動的東西

- viewer `report.js` 的 `valueStyle()`:已是 gender-aware,直接吃新欄位。
- reporter `hospital-lab-data.html` line ~2835:已是 gender-aware。
- viewer / reporter 的 manifest:這 5 條不需 override。
- schema.js:2026-05-05 已加四欄 optional,應該已支援。

## 5. 實作步驟

### Phase A — patterns repo

```powershell
cd D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\hospital-lab-patterns
claude
```

讓 Claude Code:

1. 改 `patterns/catalog.js` 5 個 entry,各加 `hiM` / `hiF`(不加 lo 系列)。
   參考第 3 節範例,逐條對照第 2 節表格。
2. 跑 `npm run release`,確認:
   - validate 全綠(包含「有 hiM/hiF 不必有 loM/loF」也允許)
   - dist/patterns.json 重 build
   - byId 結果含新欄位
3. 寫一個暫存 spec script(如 `scripts/gender-threshold-2.js`)跑下列樣本:
   - 男 GPT 40 → 正常;男 GPT 50 → 高
   - 女 GPT 30 → 正常;女 GPT 40 → 高(關鍵 case)
   - 男 BUN 25 → 正常(在 fallback hi 25.7 內,但已知男時用 hiM=20.6 → 高)
     兩種期待測試,看實作是否遵循 gender 優先;這個 case 涉及 BUN 軟緩衝
     的設計緊縮,要在 spec 把預期講清楚。
   - 性別未知病人 BUN 25 → 正常(走 fallback 25.7)
   - 跑完印 PASS/FAIL,全 PASS 後刪掉暫存 script。
4. 用繁中更新 WORKLOG.md,標題類似:
   "## 2026-05-05 — GPT/RGT/BUN/CREAT/UA 加 gender-aware hi(沿用 SOP G)"
   寫:Issue 1 backlog 第 1 條收尾、5 條 entry 補 hiM/hiF、BUN 的設計緊縮
   說明、不動 viewer/reporter。
5. git add patterns/ dist/ WORKLOG.md
   git commit,顯示 commit message,**停下來等使用者說 push**。

### Phase B — viewer sync(只跑 sync,不改 code)

patterns push 之後:

```powershell
cd ..\hospital-lab-viewer
claude
```

讓 Claude Code:

1. `node sync-patterns.js`,確認 mapping.js 內這 5 條 entry 帶到新 hiM/hiF。
2. 重打包 zip(若 viewer CLAUDE.md 有 build 步驟)。
3. WORKLOG 寫一條 sync 紀錄(繁中)。
4. commit + 顯示 commit message + 等使用者 push。

### Phase C — reporter sync(只跑 sync,不改 code)

```powershell
cd ..\hospital-lab-reporter
claude
```

讓 Claude Code:

1. `node sync-patterns.js`,確認 inline pattern block 內這 5 條 entry 同步。
2. WORKLOG 寫一條 sync 紀錄(繁中)。
3. commit + 顯示 commit message + 等使用者 push。

## 6. 跨 repo 副作用 checklist

- [ ] patterns push(catalog 5 條 + dist/patterns.json)
- [ ] viewer push(mapping.js sync + 重打包 zip)
- [ ] reporter push(inline pattern block sync)

## 7. 驗收

- **GPT**:任一女性病人 GPT 40 應顯示紅(過高,女 ULN 34);男性 GPT 40 黑(正常)
- **BUN**:女性 BUN 19 應紅(超過女 ULN 18.7);男性 BUN 19 黑(在男 ULN 20.6 內);
  unknown gender BUN 19 黑(在 fallback 25.7 內)
- **CREAT/UA/RGT** 同模式抽驗

## 8. 後續 backlog

- viewer 肝炎硬編 regex 搬進 patterns-computed.js(架構債,獨立 brief 處理)。

---

## Reference: notes for future Kt/V brief(從上一版保留)

If/when Kt/V gets reactivated:

- Formula: simplified Daugirdas single-pool with t=4hr, UF/W=0.03 →
  `Kt/V = -ln(R - 0.032) + (4 - 3.5·R) × 0.03`, where `R = BUN_post / BUN_pre`
- Hand-test target: BUN 80/25 → Kt/V ≈ 1.36 (adequate dialysis)
- Reference: Daugirdas JT. JASN 1993; 4(5):1205–13.
- Add as `KtV` (id), unit `''`, ref `>= 1.2`, lo `1.2`, hi `null`,
  needs `['BUN_pre','BUN_post']`.

## Reference: notes for future Al brief(從上一版保留)

If/when Al gets reactivated:

- Need a real sample (raw `reportText` line) before writing the regex
- Vhyl `searchItem=alu` and `searchItem=鋁` both return 0 on
  patient 000105069H — confirm with another long-term dialysis patient
  or call the lab to verify Al is on the panel
- Check vhtt separately — the two hospitals may differ
- Suggested initial regex shape (subject to sample): `(?:Al|Aluminum)(?:\(Serum\))?\s*:\s*([\d.]+)`
- Unit on form: µg/L; some labs report ng/mL. Add normalizer if needed.
