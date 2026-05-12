# TASK_BRIEF: vhyl → vhtt handoff (2026-05-12)

> **方向**:vhyl(玉里 desktop)→ vhtt(台東 desktop)
> **產出 session**:vhyl Cowork session, 2026-05-12
> **預計執行 session**:下次 vhtt 開機時
>
> **執行完畢後請改名為 `TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12_done.md`**(rule #6)

---

## 一句話

`groups/dialysis.js` 加了一行 fallback 修補 BUN_post 配對,vhtt 端只需 `git pull` + 把 `hospital-lab-dialysis.html` 重新放到分發位置(若有的話)。**無語義影響**,vhtt 行為無變化。

---

## 背景

在 vhyl 跑使用者提供的 50 個 chartno(dedupe 後 46 個唯一)做 CKD / dialysis pattern 驗證,結果報告在:

- `hospital-lab-patterns/docs/validation_vhyl_2026-05-12.md`
- `hospital-lab-patterns/docs/validation_vhyl_2026-05-12.tsv`(per-patient 表)

最重要的發現:`groups/dialysis.js` 的 `detectMonthlyDrawsFromStored` 在 vhyl 病人身上,**85% 的 monthly cluster 配不上 BUN_post**,造成 URR 大多算不出來、CSV `BUN (AD)` 欄全空。

---

## 根因(技術細節 — 之後維護時用得到)

`detectMonthlyDrawsFromStored` 內(line 224 起):

1. `drawDateIso` 從 `bucket.effectiveTime` 透過 local-time accessors 算 `YYYY-MM-DD`(2026-05-06 hotfix 已校正 UTC vs TPE off-by-one)。
2. `bunIdx = this._indexBunByDate(...)` 用 `entry.date` 當 key(line 115–125)。
3. line 276 原本只 `bunIdx.post[drawDateIso] || null`。

**vhyl 的特性**:醫囑下單時間(`effectiveTime`)和實際抽血時間(`date`)差 5–9 天最常見。50 ID 樣本中:

| eff vs entry.date gap | BUN_pre 筆數 |
|---|---|
| 0(同天) | 112 |
| 1–4 | 56 |
| 5–6 | 122 |
| 7–8 | 139 |
| **9** | **338** ← 最大宗 |
| 10+ | 30 |
| 合計 | 797(mismatch 685 = **86%**)|

→ `bunIdx.post[drawDateIso]` 找不到 entry(因為 entry.date 比 eff 晚 5–9 天)→ post = null。

**為什麼 pre 不會炸**:line 271–274 已經有三層 fallback:

```js
const pre = bunIdx.pre[drawDateIso]
  || (bucket.byTestId.BUN_pre && bucket.byTestId.BUN_pre[0])
  || (bucket.byTestId.BUN     && bucket.byTestId.BUN[0])
  || null;
```

post 卻沒。在 vhyl,BUN_pre 和 BUN_post **共用相同 `effectiveTime`**(同一張醫囑出來的 pre+post 兩個 result),所以 `bucket.byTestId.BUN_post` 通常就有資料 — 補上對應的 cluster-local fallback 就配上了。

**vhtt 端**(假設):通常下單當天就抽,`effLocal == entry.date`,主 lookup 先命中,fallback 永遠不會走到 → 行為完全不變。

---

## 變更

`hospital-lab-reporter/groups/dialysis.js` line 276 從一行變五行(含 comment):

```diff
-      // BUN post: cross-cluster lookup by date (post lives in its own cluster).
-      const post = bunIdx.post[drawDateIso] || null;
+      // BUN post: cross-cluster lookup by date (post lives in its own cluster
+      // on vhtt where eff==entry.date). On vhyl, eff is days before the actual
+      // draw date, so the date-keyed bunIdx lookup misses — fall back to the
+      // current cluster's own BUN_post bucket, which is where pre/post end up
+      // when they share an effectiveTime (vhyl pattern, 2026-05-12).
+      const post = bunIdx.post[drawDateIso]
+        || (bucket.byTestId.BUN_post && bucket.byTestId.BUN_post[0])
+        || null;
```

另兩個檔案是 build 重產:

- `hospital-lab-dialysis.html`(167.3 → 171.7 KB)
- `hospital-lab-data.html`(legacy markers sync)

---

## 驗證(vhyl 端 before / after,同樣 46 個 chartno)

| | 修前 | 修後 |
|---|---|---|
| Total monthly clusters | 520 | 520 |
| `withBoth` (pre+post 配對) | 11 | **516** |
| `preOnly` | 多 | 4 |
| URR 在 draw 層級算出 | 11 | **515** |
| 零配對病人 | 39 / 46 | **0 / 46** |

剩下 4 個 pre-only cluster 是真實「當月只抽了 pre,沒抽 post」的 case,不是 bug。

---

## vhtt 端待辦

```powershell
cd D:\self\hospital-lab

# 1. patterns repo(只有 brief + validation doc)
cd hospital-lab-patterns
git pull
git status   # 確認 brief 已到位

# 2. reporter repo(groups/dialysis.js 修補 + 兩個 HTML 重 build)
cd ..\hospital-lab-reporter
git pull
git status

# 3.(可選)在 vhtt 端目測 dialysis HTML
#    開 hospital-lab-dialysis.html → 加幾個 vhtt 透析病人 → 看 URR 還是正常顯示
#    預期:行為跟以前一樣(eff==date 走主 lookup,fallback 不會生效)

# 4. 改 brief 名為 _done + commit
cd ..\hospital-lab-patterns\docs\task-briefs
git mv TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12.md TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-12_done.md
cd ..\..
git commit -m "docs: archive vhyl→vhtt handoff 2026-05-12 (BUN_post fallback verified)"
git push
```

如果 step 3 發現 vhtt 端 URR 行為有變(理論上不應該),請寫反向 handoff brief 帶回 vhyl。

---

## 旁路發現(不在這 commit 內,記錄給未來)

vhyl validation 報告(`docs/validation_vhyl_2026-05-12.md`)還挑出兩件**不在本 brief 範疇**的事,需 vhtt 端評估:

1. **CKD reporter 的 eGFR / KDIGO / TaiwanCKD staging 沒接** — Phase 3 commit 自己標 backlog,確認尚未實作。
2. **`labs_<group>` localStorage 5MB 上限** — CKD bulk-add 20 人就會 QuotaExceededError。建議比照 ordersCache migration 路線改 IndexedDB,或縮減 storage 範圍(只存 manifest 內 testId)。

兩件都偏向 Phase 3.x 工作,屬 vhtt scope。若 vhtt 想接,各自開 TASK_BRIEF 即可。
