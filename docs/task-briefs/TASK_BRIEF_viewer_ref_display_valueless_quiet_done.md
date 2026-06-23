# TASK_BRIEF — viewer §4.3 動態 ref:無值項目靜默顯示最新 ref(去 warn 噪音)

- 建立:2026-06-24(Cowork,YC + claude)
- repo:hospital-lab-viewer(單檔 `report.js`;`resolveRef` 由 patterns 經 sync 進 mapping.js,**不改 resolveRef 本身**)
- mode:Claude Code
- Depends on:`ref_range_age_dim`(已 Done)

## 背景

age-dim §4.3 把動態 ref 顯示改成 **full-scope**(所有帶 `refHistory` 的 entry 都動態化)。
`buildRefDisplay`(report.js,約 line 617)因此會對**每一個** refHistory entry 呼叫
`resolveRef`,包含「此病人沒驗、因此沒有檢驗值報告日」的項目(manifest 有列、但無值,
例:Fe / VitB12 / FolicAcid / AFP / CA199 / CA125)。這些呼叫的 `reportDate` 是
`undefined` → `resolveRef` 走 `warnOnce` 印:

```
[resolveRef] missing/unparseable reportDate for "<id>" — falling back to today (newest ref).
```

非 crash:報表照常產生(handlePrint 完成),只是 dev console 噪音、且可能蓋掉真正的 warn。

## 目標行為(YC 2026-06-24 拍板)

**無值 / 無報告日的項目 → 靜默顯示「最新」reference range**(= 目前 fallback-to-today 的結果),
**不**印 warn。有值的項目維持原樣(ref 仍以該值的報告日解析)。

## 變更(建議)

`report.js` `buildRefDisplay`:取不到該 test 的檢驗值報告日時,呼叫 `resolveRef` /
`resolveRef.pickEntry` 傳入明確的「今天」(例 `new Date()`)而非 `undefined`。
`normalizeRefDate` 認得 `Date` 物件 → 回今天 ISO → 不觸發 `warnOnce`,且選到 machine-
resolved 的最新 refHistory(newest validFrom)。**只動 report.js 這一處呼叫點**,不動
`resolveRef`(避免改到 patterns 共享邏輯 / reporter 行為)。

> 註:`pickEntry` 本來就用 today 靜默(不 warn);噪音只來自主 `resolveRef` 呼叫。確認
> buildRefDisplay 兩個呼叫(range + 維度 label)都不再傳 undefined date。

## 成功標準

1. 列印一個「部分 manifest 項目無值」的 vhyl 病人 → console **完全沒有** `[resolveRef] missing/unparseable reportDate` warn。
2. 無值項目在 handout 仍顯示 reference range,且與修改前**相同**(machine-resolved 最新 ref;例 vhyl AFP 顯示 0.89–8.78)。
3. **有值**項目不受影響:ref 仍以該值的報告日解析(舊報告日仍選到對應較舊的 refHistory entry — regression guard)。
4. 上色 / alarm 邏輯零改動(本 brief 不碰 valueStyle 的判定,只碰 ref **顯示**)。

## 測試清單(可獨立驗證)

- T1(主因):vhyl 列印一個沒驗 Fe/AFP/CA199 的病人 → F12 console 無 resolveRef warn。
- T2(顯示不變):同病人 handout 上 AFP 那列顯示 `0.89–8.78`(vhyl 最新),CA199 顯示 `<37`(universal)。
- T3(有值 regression):某病人有「舊報告日」的某 test 值,且該 test 有跨時間多筆 refHistory → 仍選到該報告日對應的較舊 entry(不是被強制 today)。
- T4(age regression):BUN 有年齡帶的病人,上色仍依年齡正確切換(<50 / ≥50)。
- T5(reporter 不受影響):reporter sync 後行為不變(reporter 不呼叫 buildRefDisplay)。

## 分發

viewer-only,不動 catalog / patterns → **無 sync-patterns 必要**(除非順手重 build mapping.js)。
改完更新 viewer `WORKLOG.md`(繁中);push 前問 YC(rule #3)。
