# TASK_BRIEF — vhyl refHistory 時間維重做：release + 三 repo sync + push

**建立**:2026-06-24（Cowork,YC + claude）
**執行端**:**Claude Code**(大半徑:跨 repo + git;從 workspace root 啟動)
**前置狀態**:catalog.js 時間維 refHistory 已在 **patterns working tree** 改好並 resolveRef 驗證過(見下)。

## 背景
Cowork 端做完 vhyl refHistory「時間維重做」(validFrom 系統性修正)。詳見 WORKLOG.md
最新一條 + `ref-timedim-2026-06-24/harvest-results.md`。**僅 catalog.js 資料變更,無 code 變更。**

## ⚠️ 動手前必做(pre-flight)
1. `cd hospital-lab-patterns && git diff --stat` — 確認變更檔 = `patterns/catalog.js`
   + `WORKLOG.md` + `PROJECT_CONTEXT.md` + 本 brief(+ `ref-timedim-2026-06-24/`)。
2. **catalog.js 尾端截斷複查**:本 session 發現 working tree catalog.js 先前已被截斷
   (尾端 BMD/CAC/LDCT 三筆 + `];` + Exports 不見),已從 `git HEAD` 還原。請確認
   `git diff patterns/catalog.js` 尾端 hunk 是「還原 HEAD 既有內容」而非新增,且
   **無其他檔案被截斷**(若 diff 出現非預期的整段消失 → 停,問 YC)。
3. `node --check patterns/catalog.js` 應通過。

## 待做(依序)
1. `cd hospital-lab-patterns && npm run release`(validate + build-json)。
2. `cd ../hospital-lab-viewer && node sync-patterns.js`;`cd ../hospital-lab-reporter && node sync-patterns.js`。
3. **push 前問 YC**(rule #3)→ commit(三 repo)→ push。
4. push 成功後同步 Notion「🛠 開機 SOP」Dashboard(rule #7);本 brief git mv 加 `_done`。

## 成功標準
- `npm run release` validate 通過、build-json 產出 dist/patterns.json 含新 vhyl 時間版本筆。
- 三 repo sync-patterns 無誤。
- 下列 resolveRef 行為全部成立(原 bug 不再復現)。

## 測試清單(可獨立驗證;每條對應一個業務行為)
1. `node scripts/validate.js` 通過(schema:有 refHistory 的 entry 結構合法)。
2. **原 bug**:`resolveRef('ALP','vhyl','2022-11-29','F',CAT)` → `{35,104}`(舊女性 ref,
   **不再**掉 `*` universal 34-130)。
3. GOT 三版依日期:`'2023-01-01','F'`→`{0,32}`;`'2025-10-01'`→`{11,34}`;`'2026-04-01'`→`{5,34}`。
4. stable:`resolveRef('WBC','vhyl','2021-01-01')` → `{5,10}`(不掉 universal `{4,11}`)。
5. BUN sex/age:`'2023-01-01','F',60`→`{6,23}`(舊,sex-suppressed);
   `'2026-01-01','F',60`→`{9.8,20.1}`(新 >=50y 女);`'2026-01-01','F',40`→`{7,18.7}`(新 <50y 女)。
6. `npm run test:refhistory` 無 regression。
7. sync 後 viewer/reporter 的 dist/inline catalog 含上述 vhyl refHistory。

## 未完 / 後續(不在本 brief 範圍)
- **exhaustive 待續**:30 病人只掃 3(012885I/166569G/114403C)。其餘 27 + tail analytes
  (TIBC/TSAT/AFP/CEA/Fe/Ferritin/iPTH/RGT 新版/FreeCa 舊版)validFrom 未動,resumable
  方法見 harvest-results.md(opdweb localStorage['REFAGG'] + cur_<chartno>)。
- warn brief `TASK_BRIEF_viewer_ref_display_valueless_quiet`(獨立,console 噪音)。
