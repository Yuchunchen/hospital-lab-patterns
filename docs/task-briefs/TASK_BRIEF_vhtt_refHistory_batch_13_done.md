# TASK_BRIEF — vhtt refHistory 批次加 13 條 override

**Owner**: YC
**寫於**: 2026-05-28(vhtt Cowork,接 Order 5.0 之後)
**目標執行機器**: Claude Code(workspace root,跨 3 repo)
**估時**: 1-2 hr
**Order(Notion Dashboard)**: 5.0 follow-up(承接 ref_range_machine_time_dim brief)
**Source**: `docs/cross-reference-vhtt-2026-05-28.md`(本 thread 跨 3 病人完整 cross-reference 結論)

---

## § 0 背景

Order 5.0(`TASK_BRIEF_ref_range_machine_time_dim`)已 land:catalog 51 entry 補 `refHistory[{machine:'*',...}]` migration 起點 + 新增 `patterns/lib/resolveRef.js` helper。

本 thread cross-reference 從 12 個 vhtt chartno 走解讀 (a)(Claude in Chrome 抓 ernode 正式報告 ref vs catalog 對齊),找出 13 個 entry 的 vhtt 印 ref 跟 catalog `*` 不一致,需加 `machine:'vhtt'` override 進 refHistory。

YC 拍板「1 sample 即信」(vhtt 機器試劑短期不跳),13 條一次全上。

委外 9 筆已 audit(8 筆印 ref = catalog `*` 或 vhtt 沒印 ref → 不動;Fe 唯一因外送單位 universal vs catalog 性別 → 加 vhtt override)。

---

## § 1 in-scope:13 條 SOP C 觸發

逐條對應 PROJECT_CONTEXT § 9 SOP C `vhtt/<test_id> ref range 改成 lo/hi` 觸發,refHistory 末加一筆 `{machine:'vhtt', refLo, refHi, validFrom:'2026-05-28', source:'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch'}`。性別 inline override 補述加進該筆。

| # | trigger 語 + 補述 | refHistory 應加的 entry |
|---|---|---|
| 1 | `vhtt/Hb ref range 改成 12.3/18.3` 補述「男 12.3-18.3,女 11.3-15.3」 | `{machine:'vhtt', refLo:12.3, refHi:18.3, refLoM:12.3, refHiM:18.3, refLoF:11.3, refHiF:15.3, validFrom:'2026-05-28', source:'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch'}` |
| 2 | `vhtt/Platelet ref range 改成 120/320` | `{machine:'vhtt', refLo:120, refHi:320, validFrom:'2026-05-28', source:'...'}` |
| 3 | `vhtt/BUN ref range 改成 7/25` | `{machine:'vhtt', refLo:7, refHi:25, validFrom:'2026-05-28', source:'...'}`(無性別 inline,vhtt 印 universal) |
| 4 | `vhtt/CREAT ref range 改成 0.6/1.3` 補述「男 0.7-1.3,女 0.6-1.2」 | `{machine:'vhtt', refLo:0.6, refHi:1.3, refLoM:0.7, refHiM:1.3, refLoF:0.6, refHiF:1.2, validFrom:'2026-05-28', source:'...'}` |
| 5 | `vhtt/GOT ref range 改成 13/39` | `{machine:'vhtt', refLo:13, refHi:39, validFrom:'2026-05-28', source:'...'}` |
| 6 | `vhtt/GPT ref range 改成 7/52` | `{machine:'vhtt', refLo:7, refHi:52, validFrom:'2026-05-28', source:'...'}`(無性別 inline,vhtt 印 universal) |
| 7 | `vhtt/ALP ref range 改成 34/104` | `{machine:'vhtt', refLo:34, refHi:104, validFrom:'2026-05-28', source:'...'}` |
| 8 | `vhtt/UA ref range 改成 2.3/7.6` 補述「男 4.4-7.6,女 2.3-6.6」 | `{machine:'vhtt', refLo:2.3, refHi:7.6, refLoM:4.4, refHiM:7.6, refLoF:2.3, refHiF:6.6, validFrom:'2026-05-28', source:'...'}` |
| 9 | `vhtt/GluAC ref range 改成 74/106` | `{machine:'vhtt', refLo:74, refHi:106, validFrom:'2026-05-28', source:'...'}` |
| 10 | `vhtt/HbA1c ref range 改成 4.3/5.8` | `{machine:'vhtt', refLo:4.3, refHi:5.8, validFrom:'2026-05-28', source:'...'}` |
| 11 | `vhtt/LDL ref range 改成 0/140` | `{machine:'vhtt', refLo:0, refHi:140, validFrom:'2026-05-28', source:'...'}` |
| 12 | `vhtt/Fe ref range 改成 50/175` | `{machine:'vhtt', refLo:50, refHi:175, validFrom:'2026-05-28', source:'... + 委外:新南海'}`(無性別 inline,放棄 catalog 性別 inner) |
| 13 | `vhtt/AFP ref range 改成 0/9.0` | `{machine:'vhtt', refLo:0, refHi:9.0, validFrom:'2026-05-28', source:'...'}` |

`source` 字串建議統一格式:`'YC SOP C 觸發 2026-05-28 cross-reference 12 chart batch — see docs/cross-reference-vhtt-2026-05-28.md'`(Fe 加 `+ 委外:新南海`)

---

## § 2 out-of-scope(scope guard)

1. **不**改 catalog `*` 那筆 refHistory(維持 migration 起點)
2. **不**改 outer `refLo / refHi / loM / hiM / loF / hiF`(維持舊值不動,新值都進 refHistory)
3. **不**處理委外 9 筆中 8 筆 match 的 entries(FreeCa, CA199, iPTH, TIBC, TSAT, P, CEA — 已驗證 ref match,不動)
4. **不**處理 vhtt 沒印 ref 的 entries(TSH, FreeT4, FolicAcid, PSA, FreePSA, Mg)
5. **不**處理 12 chartno 沒涵蓋的 8 entries(RGT, VitB12, Aluminum, HBsAgTiter, AntiHBsTiter, AntiHCVTiter, HIVLoad, CD4)— 需另批病人 / 後續 thread
6. **不**處理 catalog ALP 內部 drift(`ref:'40-130'` vs `refLo:34, refHi:130`)— 獨立 cleanup task,本 brief 不混(只動 ALP refHistory 末加 vhtt 那筆;outer 維持現狀)

---

## § 3 跨 repo 副作用

依 brief `ref_range_machine_time_dim` § 5 release flow:

1. `patterns/catalog.js`:13 個 entry 各加一筆 refHistory(後 push)
2. `patterns/schema.js`:no change(schema 已支援 refHistory + inline gender,Order 5.0 已 land)
3. `patterns/lib/resolveRef.js`:no change(helper 已 land)
4. `dist/patterns.json`:`npm run release` 自動產出
5. `hospital-lab-viewer`:`node sync-patterns.js` 拉新 catalog.js + lib/resolveRef.js(若仍未拉)
6. `hospital-lab-reporter`:同上

---

## § 4 成功標準(規則 #9)

任何一條沒過 = 沒做完:

1. ✅ `patterns/catalog.js` 13 個 entry 的 refHistory 各多一筆 `machine:'vhtt'` 且 validFrom='2026-05-28'
2. ✅ Hb / CREAT / UA 那 3 筆有 inline 性別 override(refLoM/refHiM/refLoF/refHiF)
3. ✅ Fe 那筆無 inline 性別(放棄 catalog 性別 inner,YC 拍板)+ source 含 "委外:新南海"
4. ✅ `npm run release` pass schema validate(refHistory shape rules § 2.3:有 inline 性別必有 refLo/refHi wide envelope)
5. ✅ 任選 1 個 vhtt entry + 1 個 vhyl entry + 1 個 cross-machine entry,各 sanity check `resolveRef(testId, 'vhtt', '2026-05-28', 'M')` / `('vhtt', '2025-12-31', 'F')` 對 vhtt 取到新加的 override,'vhyl' 取到 `*`
6. ✅ viewer + reporter `sync-patterns.js` 跑完,新 catalog.js + lib/resolveRef.js 進 sibling repo
7. ✅ WORKLOG.md(三 repo 都加)中文記載本次 13 條 vhtt override + reference cross-reference doc

---

## § 5 測試清單(規則 #9 對應「測試清單」要求)

每條獨立可驗,對應一個業務行為:

1. `resolveRef('Hb', 'vhtt', '2026-05-29', 'M')` → `{refLo: 12.3, refHi: 18.3}`(取新加的 inline M)
2. `resolveRef('Hb', 'vhtt', '2026-05-29', 'F')` → `{refLo: 11.3, refHi: 15.3}`
3. `resolveRef('Hb', 'vhyl', '2026-05-29', 'M')` → `{refLo: 14, refHi: 18}`(取 `*` migration 起點,後 fallback outer loM/hiM)
4. `resolveRef('Hb', 'vhtt', '2026-05-27', 'M')` → `{refLo: 14, refHi: 18}`(reportDate 早於新加 validFrom,取 `*`)
5. `resolveRef('Fe', 'vhtt', '2026-05-29', 'M')` → `{refLo: 50, refHi: 175}`(無 inline 性別,取 base refLo/refHi)
6. `resolveRef('Fe', 'vhtt', '2026-05-29', 'F')` → `{refLo: 50, refHi: 175}`(同上,vhtt 不分性別)
7. `resolveRef('Fe', 'vhyl', '2026-05-29', 'F')` → `{refLo: 50, refHi: 170}`(fallback `*` then outer hiF)
8. `resolveRef('Platelet', 'vhtt', '2026-05-29', null)` → `{refLo: 120, refHi: 320}`(gender 未知,取 base)
9. viewer 跑 `loadOrders()` mock 1 個 vhtt 病人 Hb=12,patientGender='F' → 應該標**異常低**(11.3 lower bound;12 落在區間內可能還是正常,確認標 normal)
10. reporter `hospital-lab-data.html` 同 mock → 同樣標 normal
11. catalog `*` 那筆 refHistory 沒被動(每個 entry 第一筆仍 `validFrom:'1900-01-01', source:'migration 起點'`)
12. outer refLo/refHi/loM/... 沒被動(13 個 entry 都是)
13. `npm run test:refhistory`(若 exist)pass

---

## § 6 跨 repo commit / push 順序

依工作根 CLAUDE.md「Cross-repo workflow」+ 規則 #3「commit 後自動 push,破壞性改動才先問」:

```powershell
cd hospital-lab-patterns
# 編輯 catalog.js 13 entry refHistory
npm run release
git add -A
git commit -m "catalog: 13 entry 加 vhtt refHistory override (cross-ref 2026-05-28 12 chart batch)"
git push

cd ../hospital-lab-viewer
node sync-patterns.js
git add -A
git commit -m "sync: 拉 patterns vhtt refHistory 13 條 (Order 5.0 follow-up)"
git push

cd ../hospital-lab-reporter
node sync-patterns.js
git add -A
git commit -m "sync: 拉 patterns vhtt refHistory 13 條 (Order 5.0 follow-up)"
git push
```

本 brief 非破壞性改動(只末加 refHistory,outer 不動,schema 不改)→ commit 後直接 push,不必先問。

---

## § 7 完成後規則 #6 動作

- 本 brief 改名 `TASK_BRIEF_vhtt_refHistory_batch_13_done.md`
- 改名動作 + 最後一個 commit 同一輪
- 同步 Notion Dashboard(本 brief 從 Open 移到 Done;若有 follow-up「剩 8 entries 待 cross-reference」起新 row 對應後續 thread)

---

## § 8 follow-up(本 brief 後)

未在本 brief scope,留下一 thread 接:

1. **剩 8 entries cross-reference**:RGT, VitB12, Aluminum, HBsAgTiter, AntiHBsTiter, AntiHCVTiter, HIVLoad, CD4 — 需另選肝炎 / HIV / 透析 / 鋁中毒病人
2. **catalog ALP 內部 drift**:`ref` 字串 "40-130" vs `refLo:34 refHi:130` — 獨立修
3. **vhyl 對應 cross-reference**:同 12 chartno 邏輯但跑 vhyl,看哪些 entry 是真的 vhtt-vs-vhyl machine 差異(本 brief 加的 vhtt override 只是覆蓋 catalog `*` 過舊值,真正 vhyl 是否同樣印此 ref 還沒驗)
