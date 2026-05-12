# vhyl 46 病人 — CKD / dialysis pattern validation

> 執行日期:2026-05-12
> 環境:vhyl reporter(`file://` origin),opsid=A123456789
> 樣本:使用者提供 50 個 chartno → dedupe 後 46 個唯一 ID
> 流程:bulk-add 進 hospital-lab-dialysis.html + hospital-lab-ckd.html,讀取 storage 後 audit

---

## 1. 三句話結論

1. **Pattern regex 沒問題**:46/46 都有 CREAT、BUN_pre、BUN_post、電解質 panel 等被正確抓出。
2. **dialysis group 的 BUN pre/post 配對邏輯在 vhyl 有缺陷**:46 人都有 BUN_post 原始資料,但只 7/46(15%)的月檢 cluster 真的配上 pre+post,其餘 39 人 URR 在 monthly draw 層級無法算。
3. **CKD reporter 的 eGFR / KDIGO / Taiwan-CKD staging 沒接上**:patterns/computed.js 有這些 helper,但 reporter `COMPUTED_TESTS` 只接了 URR / CaxP。Phase 3 commit 自己標記為 backlog,本次驗證確認尚未實作。

---

## 2. 分流(classify)

| 分類 | 人數 | 判定條件 |
|---|---|---|
| dialysis | 44 | ≥6 monthly draws + ≥6 BUN_pre + ≥6 BUN_post(原始) |
| occasional-draw | 2 | monthly cluster 偏少(可能新收 / 不規律) |
| CKD-only / 其他 | 0 | — |

「occasional-draw」兩位:

| chartno | 姓名 | 性別 | 年齡 | nDraws | BUN_pre | BUN_post |
|---|---|---|---|---|---|---|
| 000093336I | 陳鼎林 | M | 76 | 5 | 9 | 2 |
| 000121588J | 李貞光 | M | 54 | 3 | 5 | 3 |

→ 你說的「混合(透析 + CKD + 一般病人)」其實這 46 人**幾乎全部都是透析病人**。如果這批本來是想抓 CKD 門診樣本可能拿錯名單;若本來就是想驗透析 pattern,那 cohort 沒問題。

---

## 3. 嚴重缺陷:BUN pre/post 跨集群配對(dialysis group)

### 觀察到的數字

- raw BUN_post 存在的患者:**46/46**(regex 確實有抓)
- monthly draw cluster 內 pre+post 都配上的患者:**7/46**(15%)
- 7 人合計 pairedBUN 次數:**11**(其餘 ~500 個 monthly cluster 全部沒配上)

### 根因

`groups/dialysis.js` 第 224 行 `detectMonthlyDrawsFromStored`:

```js
const drawDateIso = /* 從 bucket.effectiveTime 算 local YYYY-MM-DD */;
const post = bunIdx.post[drawDateIso] || null;   // ← bunIdx 是用 entry.date 當 key
```

而 `bunIdx` 在 `_indexBunByDate` 是用 `e.date` 當 key:

```js
for (const e of (labDataForPatient.BUN_post || [])) {
  if (e && e.date && !post[e.date]) post[e.date] = e;
}
```

**vhyl 的特性**:醫囑下單(生效時間,effectiveTime)時間和實際抽血時間(date)平均差 5–9 天:

| eff vs date gap (天) | BUN_pre entry 數 |
|---|---|
| 0(同天) | 112 |
| 1–2 | 45 |
| 3–4 | 11 |
| 5–6 | 122 |
| 7–8 | 139 |
| **9** | **338** ← 最常見 |
| 10–16 | 21 |
| 17+ | 9 |
| 合計 | 797(mismatch 685 = **86%**)|

所以 lookup `bunIdx.post["2026-05-01"]` 找不到 entry,因為 entry.date 是 "2026-05-06"。

pre 有 fallback `bucket.byTestId.BUN_pre[0]` 救回(因為 pre 和 post 共用同個 effectiveTime cluster,bucket 內就有 BUN_post[]),但 post 沒寫 fallback,所以 fail。

### vhtt 沒事的原因(假設)

vhtt 通常下單當天就抽,eff_local_date == entry.date,直接命中 `bunIdx.post[drawDate]`,所以這 bug 在 vhtt 看不出來。

### 建議修法(SOP B 範疇,單檔 patch,vhyl 可動)

`groups/dialysis.js` line 276:

```js
// 原
const post = bunIdx.post[drawDateIso] || null;
// 改
const post = bunIdx.post[drawDateIso]
    || (bucket.byTestId.BUN_post && bucket.byTestId.BUN_post[0])
    || null;
```

確認過樣本:vhyl 的 BUN_pre 和 BUN_post 共用相同 `effectiveTime`(同一張醫囑下出來),所以兩者進同個 bucket,fallback 會命中。

修完後預期 paired ratio 從 15% 拉到 ~95%(剩下 5% 是真的當月只有 pre 沒 post 的)。

→ 這條我覺得值得寫一份 `TASK_BRIEF_BUN_pairing_vhyl_fix.md`,在 vhtt 端動手(雖然 vhyl 端也能動,但這牽涉到既有邏輯的語義,不只是 regex tweak)。

---

## 4. 次要缺陷:CKD 端 eGFR / Staging 沒接

`core/compute.js` 的 `computeDerivedValues` 只 dispatch `URR` 與 `CaxP`。catalog 已經有 `eGFR`、`GFRStage`、`UACRStage`、`UPCRStage`、`KDIGORisk`、`TaiwanCKD`、`EarlyCKD`、`PSARatio`、3 個 hepatitis display(14 個 computed entries),但 reporter 都沒生出來。

`hospital-lab-ckd.html` 因此只能當「raw CREAT/UACR/UPCR 表」用,**無法顯示 staging**。這條 Phase 3 commit 自己有標 backlog(`groups/early-ckd.js` 註解:「wiring them to the lab table is a Phase 3.x follow-up」),驗證結果跟註解一致。

→ 真的要做 CKD staging,需要 Phase 3.x:
1. `core/compute.js` 加 `eGFR` / `GFRStage` / `KDIGORisk` / `TaiwanCKD` dispatch(需要病人 age + sex,目前 compute.js 只吃 results)
2. `groups/early-ckd.js` 的 `computed` 從 `[]` 加進對應 ids
3. CKD HTML UI 加 staging 欄

vhtt 範疇,不在 vhyl 動。

---

## 5. 次要缺陷:UACR / UPCR 在這批人 0/46

| 尿液 lab | 有抓到的人數 |
|---|---|
| UACR | 0 |
| UPCR | 0 |
| UrineProtein | 0 |
| UrineOB | 0 |
| UrineGlucose | 0 |
| UrineCr | 0 |

可能原因:這批人是透析病人,門診醫師通常不開尿液檢查(透析病人 anuric 或 oliguric);不一定是 pattern 漏抓。要驗證 UACR pattern 在 vhyl 是否能抓,得拿真正的 CKD 門診病人(尿蛋白檢查單 active)再跑一輪。

---

## 6. Infrastructure issue(不是 pattern 問題但卡 workflow)

`labs_ckd` 在 localStorage 大約 20 人就會 `QuotaExceededError`(每人 lab data 約 250KB,20 × 250KB = 5MB)。dialysis 沒踩到是因為 dialysis 只擷取 manifest 範圍,labs_dialysis 約 60KB / 人。

CKD 因為 sub-page enrichment 把 UACR sub-page 文字也存進去,結果暴漲。

修法選項:

1. **遷移 `labs_<group>` 到 IndexedDB**(同 ordersCache 路徑,milestone 2026-05-08 走過一次)。
2. **過濾**:只存 manifest 內的 testId,其他丟掉。

vhtt 範疇,不在 vhyl 動。建議走 (1),跟前次 migration 一致。

---

## 7. Annual marker 抓取(肝炎 / α-FP / 鋁)

46 人粗略統計(只看「有」/「沒有」,沒看年份):

| 項目 | 有抓到 |
|---|---|
| HBsAg | 23 |
| Anti-HCV | 28 |
| AFP | 18 |
| Aluminum | 0 |

Aluminum 0/46 比較奇怪。可能:

1. vhyl 不送 Aluminum(只 vhtt 送外送);
2. 樣本人這批今年都還沒抽;
3. label 在 vhyl 跟我們現在的 regex 不同。

→ 想徹底驗證 Aluminum pattern 在 vhyl,需另選一位確定有抽過鋁的病人測試。

---

## 8. 完整 per-patient table(46 列)

存在 `validation_vhyl_2026-05-12.tsv`(同目錄)。欄位:

`chartno / name / sex / age / classify / nDraws_dial / pairedBUN / preOnly / has_BUN_pre / has_BUN_post / urr_topLevel / last_dial_draw / nDraws_ckd / creat / bun_generic / uacr / upcr / urineProtein / urineOB / urineGlucose / annual_HBsAg / annual_HCV / annual_AFP / annual_Al`

`urr_topLevel` 是 `core/compute.js` 算出的 URR 序列長度(這個是用 e.date pair pre+post,沒踩到 effectiveTime bug),所以這個值通常 = `has_BUN_post`。**dialysis CSV 走的不是這條,而是 monthly draw 內的 `computed.URR`,所以 CSV 大多是空的**,使用者看到的 CSV 與 URR 序列不一致。

---

## 9. 下一步建議(由我提出,你選)

| 優先 | 動作 | 在哪動 |
|---|---|---|
| 🔴 高 | 修 BUN pre/post 配對(§3)| vhtt(或 vhyl 也可,只一行)|
| 🟡 中 | `labs_<group>` → IndexedDB | vhtt |
| 🟢 低 | CKD staging 接上 | vhtt(Phase 3.x)|
| 🟢 低 | UACR / Aluminum 在 vhyl 找真正適合的病人再驗 | vhyl |
