# TASK_BRIEF: vhyl → vhtt handoff (2026-05-12 part 2)

> **方向**:vhyl → vhtt
> **產出 session**:vhyl Cowork session, 2026-05-12(同日下午)
> **預計執行 session**:下次 vhtt 開機時(可與 part 1 一起做)
>
> **執行完畢後請改名為 `TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12_part2_done.md`**(rule #6)

---

## 一句話

`patterns/catalog.js` 的 RBC + GluAC 加 negative lookahead 擋 vhyl 尿液常規誤匹配,vhtt 端只需 `git pull` 三個 repo + viewer 重整 chrome extension。**對 vhtt 行為無影響**。

---

## 背景

Part 1 brief 處理完 BUN 配對之後,YC 同日下午丟兩個觸發 case:

- vhyl/000012148C **RBC 出現 0**
- vhyl/000124693B **Sugar 出現 4**

兩個都是 `URINE ROUTINE(YL)` 的 qualitative 字串被血液數值 regex 抓到:

| Test | reportText | 被誤抓到的 capture |
|---|---|---|
| RBC | `RBC: 0-2`(尿沉渣 RBC/HPF range)| `0` |
| GluAC | `GLU: 4+`(尿糖 gradient)| `4` |

WBC 早就有 `(?!\s*[-–]\s*\d)` 擋 range,RBC 漏寫;5/8 收緊 bare `Glucose:` 沒處理 `GLU:` label 變體(那時只見到 vhtt 的 case)。

---

## 變更

**`patterns/catalog.js`**(兩條 regex,各加一個 negative lookahead + 更新 notes):

```diff
   { id:'RBC',
-    pattern: /\bRBC:\s*([<>]?\s*[\d.]+)/,
+    pattern: /\bRBC:\s*([<>]?\s*[\d.]+)(?!\s*[-–]\s*\d)/,
     ...

   { id:'GluAC',
-    pattern: /...|GLU[\s-]*(?:AC)?|...|飯前血糖):\s*([<>]?\s*[\d.]+)/i,
+    pattern: /...|GLU[\s-]*(?:AC)?|...|飯前血糖):\s*([<>]?\s*[\d.]+)(?!\s*\+)/i,
```

加完跑了 `npm run release` + reporter sync + viewer sync,所以同 commit 內帶了:

- `patterns/catalog.js` 兩條 regex + notes
- `dist/patterns.json`(re-built)
- viewer `mapping.js` / `normalizers.js` / `patterns-computed.js`(sync 重生)
- reporter `hospital-lab-data.html` / `hospital-lab-dialysis.html` / `hospital-lab-ckd.html`(legacy sync + build 重產)

---

## 驗證(vhyl 端)

Re-extract 兩個觸發病人的 cached orders,結果:

| | 修前 | 修後 |
|---|---|---|
| 000012148C RBC count | 5(1 個 0,1 個 URINE) | 4(0 個 0,0 個 URINE) |
| 000124693B GluAC count | 8(3 個 4,3 個 URINE) | 4(0 個 4,0 個 URINE) |

修後值都合理(RBC 4.76–5.07 ×10⁶/µL,GluAC 125–137 mg/dL),orderName 全是血液單。

---

## vhtt 端待辦

```powershell
cd D:\self\hospital-lab

# 三個 repo 都 git pull
foreach ($d in 'hospital-lab-patterns','hospital-lab-viewer','hospital-lab-reporter') {
  Set-Location "D:\self\hospital-lab\$d"
  Write-Host "`n=== $d ===" -ForegroundColor Cyan
  git pull
}

# viewer:OPD 端 24h 內自動拿到 dist/patterns.json,不需 redeploy
#         (測試機可在 popup freshness badge 點一下強制刷新)
# reporter:把更新後的 hospital-lab-{dialysis,ckd,data}.html 放共用路徑

# 改 brief _done + commit + push
cd hospital-lab-patterns\docs\task-briefs
git mv TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12_part2.md `
       TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12_part2_done.md
cd ..\..
git commit -m "docs: archive vhyl→vhtt handoff 2026-05-12 part 2 (RBC + GluAC lookahead)"
git push
```

---

## 對 vhtt 行為影響:無

兩個 lookahead 只擋特定字串:

- `(?!\s*[-–]\s*\d)` — 擋 `0-2` 這種 range 形式
- `(?!\s*\+)` — 擋 `4+` 這種 gradient 形式

vhtt 一般血液報告的 `RBC: 4.5` 或 `Sugar(AC-serum): 95` 都不含這些尾綴,主 match 仍 succeeded。若 vhtt 端有任何疑似 false negative,寫反向 brief 帶回 vhyl。
