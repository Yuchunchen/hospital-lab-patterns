# WORKLOG

Chronological log of pattern catalog changes. Newest entries on top.

---

## 2026-06-24 — vhyl ref harvest 落 catalog refHistory(machine-specific + BUN 年齡帶)

- 作者:claude(與 YC 共同,Cowork)
- 範圍:catalog.js(單檔資料維護),無 code 邏輯變更
- 變更:新增(29 個 in-scope entry 各加一筆 machine:'vhyl' refHistory;BUN 加兩筆年齡帶,共 30 筆)
- 來源:`vhyl_ref_harvest_000012885I_2026-06-23.csv`(opdweb OpdOrderReport.aspx auto-crawl,病人 F/84)
- 內容:
  - 29 entry 末加 vhyl 筆,性別分者帶 inline `refLoM/refHiM/refLoF/refHiF`:
    ALB/ALP/DBIL/TBIL/BUN/CA/CHOL/CL/CREAT/GluAC/GOT/GPT/HDLC/HbA1c/HCT/Hb/K/LDL/MCV/NA/P/Platelet/FreeCa/RBC/TP/TG/UA/WBC/RGT。
  - **BUN 兩筆年齡帶**(全 harvest 唯一印年齡帶者):<50y(`ageMax:49`)F7.0-18.7、M8.9-20.6;≥50y(`ageMin:50`)F9.8-20.1、M8.4-25.7。報告寫 `<50`/`>50`,正好 50 歲歸 ≥50 帶(YC 2026-06-24 拍板)。
  - `validFrom` = 各 harvest 最新報告日轉 ISO(多數 2026-03-31;P=2025-12-30;RGT=2022-11-29);`source='auto-crawl 000012885I 2026-06-23'`。
  - **35 列 skip**:無對應 in-scope entry(血氣 PCO2/PO2/SO2/HCO3、尿液電解質、CK/CKMB/LDH/LACTATE/D-Dimer/AMMONIA/Troponin/MICROALBUMIN/UACR…),或 review_flag=Y(header 誤抓 / off-by-one:NORMAL RANGE、Non-Reactive、Patient、CRP、EpithCell、T.PROT.)。
- 判斷點(YC 已認):GLUCOSE→GluAC(假設空腹);單邊 `0-X` 下界寫字面 0(=不觸低警示);GPT 只高界、HDLC 只低界。
- 驗證:catalog `require` parse 綠;自含 schema refHistory 規則檢查 30 筆全過(base 鍵齊 / 年齡帶非負且不重疊 / validFrom ISO / machine 合法 / hospitalScope 不衝突)。**`npm run release` 待在真實 disk(PowerShell)跑** — 本輪沙箱 mount 的 schema.js 是過時截斷鏡像,沙箱 validate 不可靠;真實 D:\ schema.js 完整(250 行,file 工具確認)。
- 後續(Claude Code / PowerShell,real disk):`npm run release` → viewer + reporter `node sync-patterns.js` → 驗收後 commit/push(rule #3 先問)→ push 後同步 Notion;YC 真機驗收年齡切換(step #2)通過才把 `TASK_BRIEF_ref_range_age_dim` 改名 `_done`。
- 殘留待刪:`patterns/catalog.js.bak`、`.cowork_write_test.tmp`(沙箱無法 unlink)。

---

## 2026-06-23 — refHistory 加第四維「年齡」(schema + resolveRef + tests)

- 作者:claude(與 YC 共同,Claude Code)
- 範圍:schema / resolveRef(lib)/ runtime-snapshot / docs(pattern-spec)/ tests
- 變更:新增(年齡維,向後相容)
- 測試 ID:resolveRef 全體;新增 schema A1–A4、resolve B1–B5 / C1、pickEntry D1–D2
- 變更內容:
  - `schema.js`:refHistory item 加可選 `ageMin`/`ageMax`(非負整數;兩者皆在場
    `ageMin<=ageMax`);同 `(machine, validFrom)` 年齡帶不得重疊(age-agnostic 那筆例外)。
    新增 `isNonNegIntOrNullish` helper。
  - `patterns/lib/resolveRef.js`:簽名末加 `patientAge`(undefined/null/NaN → 年齡未知 →
    只取 age-agnostic);候選篩選加 `ageOK`;precedence **machine > age > time**(YC 拍板);
    抽出 `selectBase`;新增 `resolveRef.pickEntry(...)` 回傳選中 refHistory item(viewer §4.3 用)。
  - `docs/pattern-spec.md`:§refHistory 標題加「× age」+ 年齡維語意 / lookup / validate 說明。
- 預設行為:**age-agnostic**。現有 51 個 refHistory entry 無年齡帶 → 行為完全不變(zero-regression)。
- 分工:年齡帶 **資料**(refHistory entry)由 Cowork 從 harvest 落 `catalog.js`(machine-specific
  vhyl),本輪只落**程式**。本輪 catalog **無**年齡帶資料,故 dist 無新增 entry。
- 驗證:`npm run test:refhistory` 33 條全綠(既有 14 + 新增 19);`npm run release` validate +
  build-json 綠(93 catalog / 65 viewer / 41 reporter)。
- 影響:catalog/lib 改動 → viewer + reporter 都已重 sync;OPD 端 24h 內自動拿到新 dist/patterns.json。
  reporter 本輪傳 `undefined`(年齡維待補資料來源)。

---

## 2026-06-23 — auto-crawl 可行性驗證(opdweb)+「完整報告」trigger(docs only,無 code 變更)

- 作者:claude(與 YC 共同,Cowork — 純 docs/SOP)
- 範圍:docs(PROJECT_CONTEXT § 9 + cowork-project-instructions),無 catalog/code 變更
- 起因:接續上段,驗證 SOP C-crawl ⚠️「ernode 是否印 ref / 印在哪層」
- 驗證結果(vhyl / 000012885I 羅清子 F84):
  - ernode `get_lab_orders` 列**只印 `analyte: value`,無 ref**(先前 PSA 000023800G「只見數值」即此層)
  - 完整 ref 在**另一站台 opdweb**:`http://opdweb.vghb12.<machine>.gov.tw/QueryReport/OpdOrderReport.aspx?OrdApNo=<ORDAPNO>&hisnum=<chartno>&opid=A123456789`
  - `ORDAPNO` 來自 ernode 每列 hidden input(OPSID/PFCODE/ORDTYPE 同列);**未執行列也有 → 須先用狀態濾 resulted**
  - ref 格式**不統一**:性別分 `M..-..,F..-..unit`(生化常括號、血液多無)/ 通用 `..-..unit` / 單邊 `<15%`;單位黏數字且含 `X10^n`
  - **年齡帶:多數項目不印,但部分項目印**(全患者 harvest 發現 BUN 印 `<50years…;>50years…` 且帶內分性別)→ 有印就抓 ageMin/ageMax、沒印才預設不分年齡(YC 拍板)。先前「CBC+生化都沒印 → 一律不分年齡」的推論過廣,已更正
  - **全患者 harvest**(000012885I 55 panel→70 analyte,序列爬 opdweb):產 `vhyl_ref_harvest_000012885I_2026-06-23.csv`(workspace root,僅 ref);發現 opdweb 併發會炸(log 鎖→IOException,須序列節流)、ref 格式變體多(`;`/`:`/單邊/年齡帶)、parser 偶有 label off-by-one(舊報告)
- 檔案:
  - 改 `PROJECT_CONTEXT.md` § 9 — 步驟 3/4 + ⚠️ 區塊改寫成「已驗」(opdweb + ORDAPNO + 格式);trigger 表加一列「完整報告／原始報告」;SOP C-crawl 段加取閱捷徑說明
  - 改 `docs/cowork-project-instructions.md` — Pattern-learning trigger 加「完整報告／原始報告」(純取閱、不自動提議 ref);bump 最後同步 2026-06-23
  - 改 `docs/task-briefs/TASK_BRIEF_ref_range_age_dim.md` + PROJECT_CONTEXT §9 歸屬 — YC 2026-06-23 分工修訂:**ref 解析 + 寫 refHistory 進 catalog = Cowork**(不寫死 parser code);Claude Code 不寫 ref parser,只做 resolveRef/viewer 程式 + release + sync + push。brief 加 §4.3 顯示規則(挑最新檢驗值報告日當時 ref、無值取最新;最精簡顯示 — 不分維度不顯示;保留手動註解行)
- 兩台同步(規則 §1.0):動到 canonical trigger + 最後同步日 → push 後 vhyl + vhtt **兩台都需重貼**;§1.0 vhyl 由 ✅ 退 ⏳
- 殘留:`ORDAPNO → opdweb` 全自動串接(免手貼 URL)待 Claude Code 落地;過渡期手貼可行
- git:Cowork 未 git(規則 #3);Notion 待 push 後同步(規則 #7)

---

## 2026-06-23 — reference range 加年齡維度 brief + SOP C-crawl(docs only,無 code 變更)

- 作者:claude(與 YC 共同,Cowork — 純 docs/SOP;code 實作交 Claude Code)
- 範圍:docs(brief + PROJECT_CONTEXT § 9 + cowork-project-instructions),無 catalog/code 變更
- 變更:新增 + 修改 + 刪除
- 起因:YC 要(a) reference range 加「年齡」第四維(預設不分年齡);(b) 把 auto-crawl ref 流程正式化為 SOP
- 檔案:
  - 新增 `docs/task-briefs/TASK_BRIEF_ref_range_age_dim.md` — 年齡維度 brief(schema ageMin/ageMax → resolveRef +patientAge → viewer thread;含成功標準 + 9 條測試清單;決策已鎖:machine>age、近似 birthYear、reporter 本輪傳 undefined)
  - 改 `PROJECT_CONTEXT.md` § 9 — 新增 SOP C-crawl 本體(模式 A 自動爬 / 模式 B 手動)+ trigger 表加兩列(`… ref`、`ref-scan`)
  - 改 `docs/cowork-project-instructions.md` — Pattern-learning trigger 段加兩條
  - 刪 `docs/SOP_ref_range_autocrawl.md` — 孤兒檔,內容已併入 § 9
- 待驗(明示):ernode 報告是否印 ref 字串、印在哪層**未驗證**;auto-crawl 全自動化前需 YC 給首個 id 做一次探勘爬取(見 § 9 SOP C-crawl ⚠️)
- 兩台同步(規則 §1.0):動到 canonical trigger → push 後 vhyl + vhtt **兩台 Cowork UI 都需重貼** Project Instructions,否則跑舊規則
- 跨 repo 副作用:本輪僅 patterns docs;年齡維度 code 實作才會觸發 release + viewer/reporter sync(見 brief §8)
- git:Cowork 未 git(規則 #3 push 前先問);Notion 待 push 後同步(規則 #7)

---

## 2026-06-18 — RGT 加 vhtt refHistory override(ref_range Order 5 — 8-entry cross-reference 收尾)

- 作者:claude(與 YC 共同,Cowork — catalog 單 entry;release/sync 交 Claude Code)
- 範圍:catalog(RGT refHistory 末加 vhtt 筆)
- 變更:新增
- 對應 brief:`docs/task-briefs/TASK_BRIEF_ref_range_machine_time_dim.md`(Order 5,§1.1 剩 8 entry vhtt cross-reference)
- 檔案:`patterns/catalog.js` RGT entry refHistory 加 `{machine:'vhtt', refLo:9, refHi:64, validFrom:'2026-06-18', source:...}`
- 來源:vhtt ernode 正式報告 cross-reference(chartno 000015165F,`r-GT(TT)` 印 `9-64 IU/L`,無性別分項)。universal `*` 為 refLo:null/refHi:55 + 性別 M<55/F<38 → vhtt 不同,故加 machine 筆
- 方法:YC 提供 ~65 chartno;in-page `fetch` sweep `get_lab_orders`(searchItem,跨 history)找各 test 第一筆已出報告 → 隱藏 `input[name=ORDAPNO]` 取 ordapno → 開 opdweb `OpdOrderReport.aspx`(**port 80**,host ernode→opdweb)讀「NORMAL RANGE / 參考值」
- 8 entry 結果(只有 RGT 取得數值 vhtt ref):
  - RGT → 9-64 IU/L ✓(本筆)
  - VitB12 → 正式報告 `NORMAL RANGE` 空白(000115014H + 000125509A 兩病人證實)→ 無 ref,維持 universal
  - Aluminum → 委外送驗(洗腎室 000023355G),報告無 result/range → 無法 cross-reference
  - HBsAgTiter / AntiHCVTiter → 該院做的是**定性**(S/CO,Non-Reactive,§1.2 排除清單),in-scope 定量 titer 本批病人未做
  - AntiHBsTiter → 定性 Anti-HBs(Non-Reactive,參考值空白)
  - HIVLoad → 只見定性 Anti-HIV EIA(S/CO,Non-Reactive);病毒量未見
  - CD4 → 整批 ~65 病人未見
- 跨 repo 副作用(規則 #4):需 `npm run release` + viewer/reporter `node sync-patterns.js` + 三 repo commit/push(大半徑,Claude Code)。Cowork 只改 catalog working tree,未 git
- 結論:ref_range 的「剩 8 entry vhtt cross-reference」實質收尾 — 僅 RGT 有 machine-specific 數值;其餘因「報告未印 ref / 委外 / 該院做定性 / 未做」無 override,維持 universal(建議 brief §1.1 對應註記)

---

## 2026-06-18 — DC 五分類加 vhtt mnemonic alternation(DC brief Open #1 收尾)

- 作者:claude(與 YC 共同,Cowork — catalog 單檔小半徑)
- 範圍:catalog(5 條 DC pattern regex tweak)
- 變更:修改
- 對應 brief:`docs/task-briefs/TASK_BRIEF_viewer_wbc_dc_section_done.md`(Open #1 follow-up:vhtt DC mnemonic)
- 測試 ID:Neut / Lymph / Mono / Eos / Baso
- 檔案 `patterns/catalog.js` 5 條 DC pattern,加 vhtt alternation + 移除 `\b`:
  - Neut:`/\bNEUT:…/` → `/(?:NEUT|Neutrophil):…/`
  - Lymph:`/\bLYM:…/` → `/(?:LYM|Lymophocyte):…/`(vhtt EHR 拼字 `Lymophocyte`,非 Lymphocyte,照官方字面)
  - Mono:`/\bMONO:…/` → `/(?:MONO|Monocyte):…/`
  - Eos:`/\bEOSINO:…/` → `/(?:EOSINO|Eosinophil):…/`
  - Baso:`/\bBASO:…/` → `/(?:BASO|Basophil):…/`(移除 `\b`;vhtt 另見 `Basophil` 變體,真機驗證時抓到)
- 原因:vhtt Cowork 2026-06-18 取 chartno `000032118G` DC 樣本(order `Differential Count(D.C)`,報告 114/01/22)。vhtt label 與 vhyl 完全不同(全字 vs 縮寫),且 reportText **run-on 無分隔**(`…Monocyte: 4.4Neutrophil: 73.9…`)。原 vhyl-only regex 的 `\b` 在「數字接字母」處無 word boundary → vhtt 一律抓不到。
- 設計選擇:移除 `\b` 與現有 CBC 慣例對齊(HCT/MCV/Platelet 皆無 `\b`,靠「Label:」當分隔);維持 case-sensitive(不加 /i,catalog 全域慣例),vhtt 大小寫照官方 label 寫死。DC 仍 display-only,不放 hi/lo(Open #2 待官方區間)。
- 驗證(node 對真機樣本跑 5 條 regex,**35/35 綠**):
  - vhtt 真機 4 病人(Chrome 抓 ernode,2026-06-18):000032118G / 000019606F(正式+更正報告)/ 000105589G / 000115014H,各自值單獨 capture、無互咬。
  - **Basophil 變體**:000105589G 印 `Basophil: 0.2`(非 BASO)→ 原 `/BASO:…/` 會漏,故 Baso 改 `(?:BASO|Basophil)`;重驗通過。
  - vhyl line-sep 回溯:NEUT 51.5 / LYM 39.0 / MONO 5.8 / EOSINO 2.8 / BASO 0.9 仍命中。
  - 負向:vhtt WBC-only 與 CBC(不含DC) order → 5 條全 no-match(無誤抓)。
  - 兩個 chartno(0000112124J / 00004567A)API 回 400(格式非 `[0-9]{9}[A-Z]`);000043563C 無 DC 紀錄 — 皆非 regex 問題。
  - `npm run validate` / `npm run release`:**未於 Cowork 跑** — sandbox 掛載點讀此 CRLF+多位元組檔會截斷亂碼、node require 失敗(real-machine Read 確認檔完整)。留 Claude Code release 階段跑為 canonical。
- 影響:catalog 改 → viewer + reporter 需重 sync;dist/patterns.json 重出;OPD 24h 內自動拿到。
- 跨 repo 副作用(規則 #4):需 `npm run release` + viewer/reporter 各 `node sync-patterns.js` → 三 repo commit + push(大半徑,Claude Code / YC)。本輪 Cowork 只停在 patterns working tree,未 git。
- Open 更新:DC brief Open #1(vhtt DC mnemonic)本輪解決;Open #2(DC% 參考值)+ Open #4(Total IgE)YC 2026-06-18 取消(DC 定案永久 display-only)。

---

## 2026-06-17 — Page 2 layout 收斂:col 1 文字報告 lump、col 2 DC + HIV stacked

- 作者:claude(與 YC 共同,Claude Code workspace root 跨 repo)
- 範圍:viewer-manifest
- 變更:修改
- 對應 brief:`docs/task-briefs/TASK_BRIEF_viewer_wbc_dc_section_done.md`(brief Open #3 延伸,YC 真機驗收期間調整 page 2 layout)
- 測試 ID:Neut / Lymph / Mono / Eos / Baso / HIVLoad / CD4 / RPR / TPHA / BoneDensity / Endoscopy / AbdSono
- 檔案:
  - `patterns/viewer.js`:
    - BoneDensity / Endoscopy / AbdSono 三條 manifest entry col 全部統一 `page:2 col:1`(原本是 col:1 / col:2 / col:3,但 report.js 的 buildPage2Column 一直把它們 lump 在同欄,manifest 名實對齊)
    - DC 5 條 manifest entry `page:2 col:4` → `page:2 col:2`
    - HIV 4 條 manifest entry `page:2 col:3` → `page:2 col:2`
  - `dist/patterns.json`:`npm run release` 自動產出
- 原因:YC 真機驗收期間決定 page 2 收斂到只用 2 個 grid col(左:三個文字報告,右:DC + HIV stacked),并拿掉 reminder box。manifest col 對齊新 layout 讓 report.js render path 直接吃。
- 設計選擇:
  - 不動 catalog(5 條 DC pattern 不變);WBC 仍 page 1 col 3「血液」hi:10/lo:5
  - 不動 A5 manifest(A5 本來就沒 DC / HIV / 文字報告)
  - reminder box(其他三個月內檢查)在 report.js 端拿掉(viewer code change,patterns 不負責)
- 驗證:
  - `npm run validate` pass(93 catalog · 65 viewer · 41 reporter,數量不變)
  - `npm run build-json` pass
  - manifest 重檢:page 1 col 3 血液 ids 仍 `[RBC,WBC,Hb,Platelet]`,WBC override hi=10 lo=5 不變,page 2 col 2 含 DC 5 + HIV 4 = 9 entry
- 影響:viewer 必 re-sync;reporter 跑保持 catalog snapshot;OPD 24h 內透過 `dist/patterns.json` 自動拿到
- 跨 repo 副作用:三 repo 同輪 sync;reporter manifest 不收 DC / HIV,disease group 行為不變

---

## 2026-06-17 — DC section 從 page 1 col 3 移到 page 2 col 4(brief Open #3 觸發)

- 作者:claude(與 YC 共同,Claude Code workspace root 跨 repo)
- 範圍:viewer-manifest
- 變更:修改
- 對應 brief:`docs/task-briefs/TASK_BRIEF_viewer_wbc_dc_section_done.md`(brief Open #3 收尾)
- 測試 ID:Neut / Lymph / Mono / Eos / Baso
- 檔案:
  - `patterns/viewer.js`:5 條 DC entry 的 `page:1, col:3` 改 `page:2, col:4`;原 col 3「血液」section 後的 DC section block 整段搬到 page 2 BoneDensity/Endoscopy/AbdSono 後,獨立 col 4
  - `dist/patterns.json`:`npm run release` 自動產出
- 原因:6/16 第一輪 land 後 YC 真機測,page 1 col 3 原本就有「血液」(4) + 「營養／電解質」(7),再插 5 條 DC% 共 16 個 test block,直版面顯著擠到。Brief Open #3 預警過,本輪修。Page 2 col 4 原本完全空(BoneDensity col 1 / Endoscopy col 2 / AbdSono col 3 + HIV 可選),搬過去整列 5 條就一個 section。
- 設計選擇:不動 WBC(仍 page 1 col 3「血液」hi:10/lo:5);不動 catalog(5 條 pattern 不變);只動 viewer manifest 的 layout 欄。reporter 不受影響(manifest 未收 DC)。
- 驗證:
  - `npm run validate` pass(93 catalog · 65 viewer · 41 reporter,數量不變)
  - `npm run build-json` pass
  - viewer manifest 重檢:5 DC 全部 `page=2 col=4`,WBC 仍 page=1 col=3 section=血液 hi=10 lo=5,page 2 col 4 ids 唯一 = ["Neut","Lymph","Mono","Eos","Baso"]
- 影響:viewer 必 re-sync;OPD 24h 內透過 `dist/patterns.json` 自動拿到(本地 reload extension + 點 popup freshness 強刷可立即生效);A5 manifest 不含 DC,不受影響
- 跨 repo 副作用:同一輪 sync viewer + reporter(reporter `dist/patterns.json` 含 viewer manifest snapshot,patterns 區塊需重出);三 repo commit + push

---

## 2026-06-16 — 新增 DC 五分類 catalog entries + viewer「白血球分類 (DC)」section

- 作者:claude(與 YC 共同,Claude Code workspace root 跨 repo)
- 範圍:catalog + viewer-manifest
- 變更:新增
- 對應 brief:`docs/task-briefs/TASK_BRIEF_viewer_wbc_dc_section.md`
- 測試 ID:Neut / Lymph / Mono / Eos / Baso
- 檔案:
  - `patterns/catalog.js`:HEMATOLOGY 區段 Platelet 後新增 5 條 DC% entry(`Neut` `Lymph` `Mono` `Eos` `Baso`),`category:'血液'`,**刻意不放 hi/lo/ref**(YC 指定 display-only)。
  - `patterns/viewer.js`:Col 3「血液」section 後新增「白血球分類 (DC)」section 5 條 manifest entry;**WBC 維持在「血液」section 不動**。
  - `dist/patterns.json`:`npm run release` 自動產出。
- 原因:vhyl Cowork 2026-06-16 抓 chartno `000037249G` 兩份 DC(YL) 樣本(115/03/17 + 114/09/22),確認 label 格式 `<MNEMONIC>: <number>` 且 value line 不帶 (YL) suffix。OPD handout 加 DC 五分類%(嗜中性/淋巴/單核/嗜酸/嗜鹼)讓臨床端讀分類結果,WBC 留血液 section 維持既有顯示與 alarm 門檻(hi10/lo5)。Total IgE 樣本未取得,本輪延後。
- 設計選擇:
  - DC% 不放 hi/lo/refHistory — display-only,viewer alarm 上色全部走 catalog refLo/refHi resolveRef,沒值就中性色;不在本輪加 lo/hi 是因為 vhyl 官方區間還沒抓,亂填會誤上色。日後要加 alarm 再於 catalog 補(Open #2)。
  - regex 用 `\b` word boundary 避免 `MONO:` 撞到其他 label 子字串;value capture 沿用 catalog `([<>]?\s*[\d.]+)` 慣例,即使本輪不顯示也保留 `<>` 寬容(以後接 reporter 不用改)。
  - 新 section 放 Col 3 緊接「血液」之後 — 同樣是血液報告語意上的延伸;A5 版面溢出風險先目視確認(Open #3),溢出再搬 Col 4 / page 2。
  - vhtt DC label 本 session 抓不到,先不加 alternation(Open #1);vhtt OPD 端目前 DC 不顯示,brief 已記。
- 驗證:
  - 5 條 regex 單行 capture node 跑過:NEUT 51.5 / LYM 39.0 / MONO 5.8 / EOSINO 2.8 / BASO 0.9 全部 cap 對 ✓
  - 5 條對整段樣本 reportText 跑,各只命中自己那行,沒誤抓 WBC/RBC/HGB/MCV 等 ✓
  - `npm run validate` pass(93 catalog · 65 viewer · 41 reporter)
  - `npm run build-json` pass,`dist/patterns.json` 含 5 條新 pattern
- 影響:viewer 必 re-sync(WBC + 5 DC 在 viewer manifest);reporter 沒有 DC manifest 但仍跑 sync 保持紀律;OPD 24h 內自動拿到 `dist/patterns.json`,不需重灌 zip。
- 跨 repo 副作用:同一輪 sync viewer(`node sync-patterns.js`)+ reporter(`node sync-patterns.js`),三 repo 各自 commit;push 前停下等 YC 確認(rule #3)。
- Open(本輪不擋):vhtt DC mnemonic / DC% 參考值 / A5 版面溢出 / Total IgE 延後。

---

## 2026-06-04 — SOP J wrap(全程回顧 meta-session)

- 作者:claude(與 YC 共同,Cowork)
- 範圍:process / docs(無 catalog 變動)
- 變更:Modes 改 blast-radius 分工 + 規則 #7 Notion 單向投影條款 + workflow-changelog 2026-06-04 條目(含 ECC 出處補登)+ session-state-vhtt SOP J wrap
- 教材分拆:原 hospital-lab root 的教材移出至獨立 `D:\self\teaching`(repo 待 init)
- 細節:見 `docs/workflow-changelog.md` 2026-06-04 + `docs/session-state-vhtt.md`
- 暴露(規則 #11):最大開發缺角 = 無 fixture corpus + 回歸測試(F8 Platelet 漏抓一個月即此因),值得起 brief

---

## 2026-06-04 — Platelet regex 加 PLATE alternation(CBC 套餐漏抓修復)

- 作者:claude(與 YC 共同,Claude Code workspace root 跨 repo)
- 範圍:catalog(單條 pattern regex tweak)
- 變更:修改
- 對應 brief:`docs/task-briefs/TASK_BRIEF_platelet_PLATE_alternation_done.md`
- 測試 ID:Platelet
- 檔案:
  - `patterns/catalog.js` 第 81 行:`/Platelet:\s*([<>]?\s*[\d.]+)/` → `/(?:Platelet|PLATE):\s*([<>]?\s*[\d.]+)/`
  - `dist/patterns.json`:`npm run release` 自動產出
  - `docs/task-briefs/TASK_BRIEF_platelet_PLATE_alternation_done.md`:brief 改名 _done(規則 #6)
- 原因:Cowork 2026-06-03 偵錯 vhtt `000030794I` 發現 ernode CBC 套餐(`CBC(RBC,WBC,HB,HCT,PLT,...)`)reportText 印的是 `PLATE: 89`,單獨 Platelet/D.C. 訂單才印 `Platelet: 158`。舊 regex 只罩後者,所有走 CBC 套餐的病人 Platelet 都漏抓(只剩有 D.C. 才暴露)。屬全院長期狀態,SOP B 修現有 pattern。
- 設計選擇:不用 `/i` 因為 catalog 全部 case-sensitive,改一條等於 catalog-wide 政策變動超範圍;不用 `\b` 因為 `PLATE` 後接 `:` 已等同 word boundary。`PLATELET:` 全大寫變體先不收(brief §「未來變體」備註)。
- 驗證:
  - T1–T4 node regex 跑過:`PLATE: 89` match cap=89、`Platelet: 158` match cap=158、`PLATELET: 200` no match、`WBC...HGB` no match ✓
  - `npm run release`(validate + build-json)pass
- 影響:viewer + reporter 需重 sync(viewer/reporter sub-repo 各自 WORKLOG);OPD 24h 內自動拿到 `dist/patterns.json`
- 跨 repo 副作用:同一輪 sync viewer + reporter(各 `node sync-patterns.js`),三 repo 各自 commit + push

---

## 2026-05-28 — 13 entry 加 vhtt refHistory override(cross-ref 12 chart batch)

- 作者:claude(與 YC 共同,Claude Code workspace root 跨 repo)
- 範圍:catalog(refHistory 末加 vhtt 筆)
- 變更:新增
- 對應 brief:`docs/task-briefs/TASK_BRIEF_vhtt_refHistory_batch_13_done.md`(Order 5.0 follow-up)
- 檔案:
  - `patterns/catalog.js`:13 entry refHistory 末加一筆 `machine:'vhtt', validFrom:'2026-05-28'`
    - Hb:`refLo:12.3, refHi:18.3` + inline `refLoM/F:12.3/11.3, refHiM/F:18.3/15.3`
    - Platelet:`refLo:120, refHi:320`
    - GOT:`refLo:13, refHi:39`
    - GPT:`refLo:7, refHi:52` + inline 性別 mirror(suppress outer `hiM:45/hiF:34` fallback)
    - ALP:`refLo:34, refHi:104`
    - LDL:`refLo:0, refHi:140`
    - GluAC:`refLo:74, refHi:106`
    - HbA1c:`refLo:4.3, refHi:5.8`
    - BUN:`refLo:7, refHi:25` + inline 性別 mirror(suppress outer `hiM:20.6/hiF:18.7` fallback)
    - CREAT:`refLo:0.6, refHi:1.3` + inline `refLoM/F:0.7/0.6, refHiM/F:1.3/1.2`
    - UA:`refLo:2.3, refHi:7.6` + inline `refLoM/F:4.4/2.3, refHiM/F:7.6/6.6`
    - Fe:`refLo:50, refHi:175` + inline 性別 mirror(suppress outer `loM:65/hiF:170`,委外:新南海)
    - AFP:`refLo:0, refHi:9.0`
  - `dist/patterns.json`:`npm run release` 自動產出
  - `docs/cross-reference-vhtt-2026-05-28.md`:新檔(YC 12 chartno 跨病人 cross-reference 結論,brief source)
  - `docs/task-briefs/TASK_BRIEF_vhtt_refHistory_batch_13_done.md`:brief 改名 _done(規則 #6)
- 原因:YC cross-reference 12 vhtt chartno 正式報告印 ref vs catalog `*`,13 個 mismatch entry 加 vhtt-specific override(SOP C `vhtt/<test> ref range 改成 lo/hi` 觸發)
- 設計選擇:Fe/BUN/GPT brief 字面說「無 inline 性別」,但 resolveRef 3-layer chain(inline→outer→base)會讓無 inline 時 fall through 到 outer `loM/hiM`(Order 5.0 T12 設計);為了滿足 brief §5「vhtt M/F 都回 universal」,改加 inline 性別 mirror universal 來抑制 outer 性別 fallback。outer 不動,resolver 不動。
- 驗證:
  - `npm run validate` pass(88 catalog · 60 viewer · 41 reporter · resolver 無錯)
  - `npm run build-json` pass,dist/patterns.json 65.9KB
  - resolveRef 22 條 sanity matrix 全綠(brief §5 12 條 + 額外 GPT/BUN F 各補 1 條,共涵蓋 vhtt new override / vhyl 取 `*` / reportDate 早於 validFrom 取 `*` / null gender / inline 性別 / 性別 mirror)
- 影響:viewer + reporter 需重 sync(下方兩 repo 條目處理);OPD 24h 內自動拿到 `dist/patterns.json`
- 跨 repo 副作用:已在同一輪一併 sync viewer(`node sync-patterns.js`) + reporter(`node sync-patterns.js`),三 repo 各自 commit + push

---

## 2026-05-28T0711 — Session SOP J wrap:vhtt thread(ref range brief + Claude Code 一輪實作 + 16 chartno hand-off)

- 作者:claude(與 YC 共同,在 vhtt Cowork 動手)
- 範圍:docs/session-state(vhtt)
- 變更:snapshot 更新 + archive
- 檔案:
  - `docs/session-state-vhtt.md`:overwrite 為 2026-05-28T0711 wrap snapshot(本 thread 跨 ref range schema 設計 → Claude Code 一輪實作 → 16 chartno cross-reference hand-off)
  - `docs/session-state-archive/2026-05-28T0711-vhtt.md`:archive 舊版(前 wrap 2026-05-22T1226,S3 + Order 2.9 land + 無 in-progress)
- 內容(snapshot 5 區):
  1. 本 session 完成 11 段:SOP I 隱式 resume(YC 開頭「im in vhtt now」)/ § 1.1 env sync sandbox 撞 mounted .git permission YC PowerShell 補跑 / A+B(5/22 deferred + 5/25 sanity)押到 ref range 整合驗證 / ref range brief 設計 + 寫 + 11 議題 lock / brief commit + push (`79bbf5a`) / Notion Order 5.0 Open 同步 / Claude Code 一輪實作 land (`cf9abd7`) / 三 repo HEAD = origin/main / SOP C 速查語法 confirmed / 16 chartno hand-off / SOP J wrap
  2. 本 thread 主要交付都 land,4 條 open 押到下一階段:16 chartno cross-reference(新 thread 接)/ 顯示欄印最新 ref(Claude Code memory)/ 真機整合驗證(Claude Code memory)/ brief _done + Notion Done(等前 3 條 land)
  3. 下次主路徑 — vhtt 16 chartno × 51 entry cross-reference(Claude in Chrome 抓 ernode 正式報告 ref 對齊 catalog `*` ref);Active TODOs + Parked questions(短期 4 + 長期 8 + 本 thread 6 lesson)
  4. 規則 #11 暴露重點:「報告 print ref」(hospital-wide 通用)vs「試劑校正 ref」(校正單)識別 — 本批 chartno 抓的多半是前者,意涵是 universal `*` 對齊而非 vhtt-specific machine override
  5. 16 chartno 含重複(`124879J` ×2、`43524F` ×2)— typo/刻意未確認,新 thread 開頭問 YC
- 模式:Cowork(本 thread)→ 新 thread Cowork(continue cross-reference)
- 沒有 cross-machine handoff brief 產生
- 本 thread 跨度:單 thread 完成 brief 設計 + 11 議題 lock + Claude Code 一輪 hand-off + 16 chartno hand-off
- 主要 lesson(存進新 session-state § 5 本 thread 學到):Schema 設計拷問先問 awareness 在哪一層(不要先推 model 才被 push back)/ sandbox 不動 mounted .git 寫操作(第二次踩,read-only ops only)/ Write tool 創檔在 git untracked(5/25 vhyl lesson 再次驗證)/ TODO 結構解讀需要規則 #12 不猜先問 / context mentor 提示時機:自然斷點優先(brief commit/push + Notion 是斷點,YC 想繼續就讓他繼續;工作量明確膨脹時 SOP J 才順 land)/ 規則 #11 silent failure 暴露無漏

---

## 2026-05-28 — catalog/schema/lib:refHistory 機器×時間×性別 ref(patterns 端基礎,Claude Code)

- 作者:claude(與 YC 共同,workspace root 跨 repo session)
- 範圍:catalog + schema + 新增 lib/resolveRef.js + scripts(migration/test)+ runtime-snapshot
- 變更:新增 `refHistory` 欄位 + 共享 resolveRef helper + schema validation
- 對應 brief:`docs/task-briefs/TASK_BRIEF_ref_range_machine_time_dim.md` §2/§9/§10(Order 5.0)
- 影響檔:
  - `patterns/catalog.js`:51 個 in-scope entry 加 `refHistory:[{machine:'*', refLo, refHi, validFrom:'1900-01-01', source}]` migration 起點筆(BUN_pre/BUN_post 不加,繼承 BUN;script-driven 插入)。**base seed 自 `lo`/`hi`(現行警示門檻)非 refLo/refHi** — YC 2026-05-28 拍板 zero-regression(9 個 entry GOT/GPT/RGT/TBIL/DBIL/HbA1c/BUN/CREAT/UA 兩者分歧,lo/hi 是刻意警示值);refLo/refHi 維持教科書值供 export
  - `patterns/schema.js`:ALLOWED_FIELDS 加 `refHistory`;validateEntry 加 refHistory shape 驗證(machine∈{vhtt,vhyl,*}、validFrom ISO、base refLo/refHi、source 非空、inline 性別 override §2.3、hospitalScope×machine §2.4);export VALID_MACHINES
  - `patterns/lib/resolveRef.js`:**新增** 共享 helper,簽名 `resolveRef(testId, machineSource, reportDate, patientGender, catalogList)`→`{refLo,refHi}`(§2.2 三維 lookup + fallback chain + 內建 ROC/西元/ISO 日期正規化 §11.3 guard);IIFE 包裝避免 concat scope 名稱衝突;吃 catalogList 參數不依賴 global(支援 viewer runtime dist swap + BUN_pre→BUN fallback)
  - `scripts/migrate-refhistory.js`:**新增** 一次性 codemod(idempotent,留存)
  - `scripts/test-refhistory.js` + package.json `test:refhistory`:**新增** T1–T13 node harness
- 測試 ID:WBC/RBC/BUN/BUN_pre/eGFR + 合成 catalog
- 驗證:`npm run release` 全綠(88 catalog validate pass、dist/patterns.json 含 51 條 refHistory 資料);`npm run test:refhistory` 14/14 pass(T1–T13)
- docs:`docs/pattern-spec.md`(refHistory 欄位 + lookup 說明)、`PROJECT_CONTEXT.md` §9 SOP C 改寫(machine 變體 trigger + parser §4.2 + 步驟)、`docs/cowork-project-instructions.md`(machine trigger + parser)皆已更新
- §9.1 寫 53,權威解讀(§1.1 特例/§6.11/§10 T5)為 51 加 refHistory(BUN_pre/post 繼承)— 已採 51,T10 驗證 fallback
- 影響:sibling repo(viewer/reporter)**尚未** sync — 待 consumer wiring(dashboard/report/ui-lab-view 接 resolveRef)+ first-run wizard(viewer chrome.storage / reporter localStorage)+ sync-patterns 拉 lib/resolveRef.js 一起做
- 模式聲明:實作在 Claude Code(workspace root);schema 變更屬破壞性改動,**commit/push 前先問**(規則 #3)

---

## 2026-05-27 — docs/task-briefs:寫 TASK_BRIEF_ref_range_machine_time_dim.md

- 作者:claude(與 YC 共同,在 vhtt Cowork 動手)
- 範圍:docs/task-briefs(新 brief 設計 + § 7 議題 lock)
- 變更:新增 brief
- 影響檔:
  - `docs/task-briefs/TASK_BRIEF_ref_range_machine_time_dim.md`:新增,約 16 KB
- 動機:catalog ref range 目前只 universal 一份,沒 machine(vhtt/vhyl)維度也沒時間維度;實際儀器試劑校正會差,且男女有差異的檢查在 vhtt/vhyl 也可能各自不同 — 需擴 schema 表達。
- 設計拍板(YC 2026-05-27 lock 11 條):
  1. validFrom 起點 = `1900-01-01`(實用第一,lookup 永遠有 candidate)
  2. machine awareness 三層 — pattern-learning(session 開頭明示 + trigger 語前綴)+ runtime(viewer chrome.storage / reporter localStorage first-run prompt)+ setup-time 不用
  3. catalog model — Central + refHistory[].machine 內嵌(不分流兩份 catalog)
  4. reportDate 缺 fallback = today + console.warn 同 chartno 一次
  5. SOP C trigger 不衝突,parser 邏輯寫進文件
  6. viewer + reporter 各自 first-run prompt(localStorage / chrome.storage 各寫一次)
  7. inline 性別 override = 版本 A 保留(cover machine × gender 交叉差異)
  8. BUN_pre/post 列入 in-scope 但 ref 繼承 BUN
  9. HIVLoad 進 scope
  10. resolveRef 共享 `patterns/lib/resolveRef.js`(sync-patterns 拉到 viewer/reporter)
  11. Order = 5.0 放 Notion Dashboard
- in-scope:53 個 id(CBC/蛋白質/肝/血脂/血糖/腎非計算/電解質/鐵/副甲腺/重金屬/腫瘤/甲狀腺/肝炎 Titer/HIV 量化)
- out-of-scope:35 個 id(computed / UACR / UPCR / eGFR / 影像 / 尿液定性 / 定性血清)
- 設計過程 lesson:Claude 推 (B') merge 路線是 over-engineering — YC 釐清「awareness 在哪一層」(pattern-learning + runtime 兩層 explicit)後落回 (A) Central + inline。下次類似 schema 設計拷問先問「awareness 在哪一層」再展開分析。
- 後續:本 brief commit + push 後同步 Notion(Order 5.0 Open);Claude Code 第一輪做 § 8 prep work(grep ref 引用點 surface / 確認 reportDate 欄位 / sync-patterns 拉 lib 邏輯)後動手實作 catalog migration + resolveRef helper + viewer/reporter first-run wizard
- 模式聲明:本 brief 在 Cowork 寫,實作交 Claude Code(workspace root,跨 3 repo)
- 整合驗證:A+B(5/22 vhtt deferred Order 2.8 S3 + Order 2.9 popup imaging cleaning 實機驗證)押到 ref range Claude Code 改完一起跑(共用 chrome reload + vhtt 病人 fetch,邊際成本最低)

---

## 2026-05-25 — catalog:CEA regex 放寬支援 vhyl (YL) suffix

- 作者:claude(與 YC 共同,在 vhyl Cowork 動手)
- 範圍:catalog(1 條 regex 加 (TT|YL) 可選後綴 + value capture 對齊)+ runtime-snapshot
- 醫院 scope:vhyl(新增字串;vhtt 既有行為不變)
- 變更:修改
- 影響檔:
  - `patterns/catalog.js`:
    - CEA:`/CEA:\s*([<>]?[\d.]+)/` → `/CEA\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/`
  - `dist/patterns.json`:跑 `npm run release` 重新產出(51.0 KB,catalog 88 不變)
- 測試 ID:CEA
- 動機:vhyl/000023172B(陳添枝 M 72,抽血 115/04/21 16:00)CEA value line 字面為 `CEA(YL): 7.37`,viewer 漏抓(refHi=5 → 該值應 alarm)。2026-05-05「vhyl 五批修正」當時同 section AFP 已修(line 501 加 (TT|YL) alternation),CEA 同期遺漏。
- 設計邊界:
  - 順手 value capture `([<>]?[\d.]+)` → `([<>]?\s*[\d.]+)` 對齊同期 detection-limit style(防備未來 `CEA: < 0.5`)
  - 同 session 順手實證 vhyl 同 section 其他 test value line 都不帶 (YL):PSA `PSA: 5.830` ✓ / Free PSA `FREE PSA/PSA RATIO: 1.286` ✓ / CA-199 `CA 19-9: 37.6` ✓ → 不擴張本 fix 範圍
- 驗證:
  - regex:`CEA(YL): 7.37` → "7.37" ✓ / `CEA: 5.0` → "5.0" ✓(不 regress)/ `CEA(TT): 3.2` → "3.2" ✓(對稱防備)/ `CEA: < 0.5` → "< 0.5" ✓(detection-limit)
  - `npm run release` 全綠 — 88 catalog · 60 viewer · 15 viewer-A5 · 41 reporter,dist 51.0 KB,track-only 12 條不變
- 影響:viewer 需重 sync(CEA 在 viewer manifest);reporter sync 跑保持紀律(無 CEA manifest,inline pattern block 更新但無實質效果)。OPD 端 24h 內透過 `dist/patterns.json` 自動拿到。
- 相依:本 commit 推 main 後,viewer sync commit 才接得上。

---

## 2026-05-25 — Session SOP G wrap:vhyl thread(桶 4-A/B + UPCR + 桶 5 light-touch)

- 作者:claude(與 YC 共同,在 vhyl Cowork 動手)
- 範圍:docs/session-state(vhyl)
- 變更:snapshot 更新 + archive
- 檔案:
  - `docs/session-state-vhyl.md`:overwrite 為 2026-05-25 13:44 wrap snapshot(本 thread 接續 vhtt 上週進度 + 修 vhyl-specific silent miss + slid in UPCR/欄序)
  - `docs/session-state-archive/2026-05-25T1344-vhyl.md`:archive 舊版(前 wrap 2026-05-20 03:18,A5 layout 完工 wrap)
- 內容(snapshot 5 區):
  1. 本 thread 完成 5 段(SOP I resume / 桶 4-A/B ABI/Fundus regex 修 / UPCR 18 欄重排 / 桶 5 light-touch / SOP G 本動作)
  2. 本 thread 無大件未完(桶 3/1/2/4-C 按 YC 順位 deferred 至下次)
  3. 下次該先做什麼:桶 3 reporter CKD HTML staging(費工 — bulk-add vhyl stage 3 病人)
  4. Active TODOs snapshot:Order 2.95 加入(UPCR brief Done)
  5. Parked:vhyl 健檢業務範圍 / 桶 5 light-touch / vhyl regex 變體完整性 / Notion Order numeric collapse lesson + 長期 parked carry-over
- 觸發 SOP:YC 訊息「今天先這樣 — 接 SOP G 寫 session-state snapshot」→ SOP G(階段完成,thread 不關)
- 規則對應:rule #2(改 docs 立刻寫 WORKLOG)、rule #7(本 wrap 不動 Notion 因為本 session 內已同步過 brief Done + SOP G 本身不觸發 Notion)
- 兩台 paste 追蹤:本 wrap 未動 `docs/cowork-project-instructions.md` → § 1.0 兩格不重置
- 不動:catalog / computed / manifest / sibling repos(純文件操作)

---

## 2026-05-25 — Brief 新增 + viewer DM Dashboard UPCR / 欄序實作 pointer

- 作者:claude(與 YC 共同,在 vhyl Cowork 動手)
- 範圍:doc(本 repo 加 1 個 brief 檔;**catalog 完全無動,viewer/reporter 不需 sync-patterns**)
- 醫院 scope:both
- 變更:新增
- 影響檔:
  - `docs/task-briefs/TASK_BRIEF_dm_dashboard_upcr_and_reorder_done.md`(直接以 `_done` 進 git;brief 在本 session 內寫完 + 實作 + 驗收一輪結束)
- 動機:vhyl DM Dashboard 加 UPCR 欄(KDIGO A 軸並列指標,有些病人只做 UPCR 沒做 UACR)+ 18 欄重排(同質指標聚集 — 實驗值 / 影像 / 蛋白尿 / 計算分期 / DM 衛教 / 動作),臨床瀏覽動線更順。
- 實作 commit(viewer repo):`9d40e88` feat(dashboard): 加 UPCR 欄 + 18 欄重排
- 設計重點:
  - UPCR 顯示同 UACR(`renderLabCell` raw value + 異常紅字),不另加 UPCRStage 欄
  - TaiwanCKD 順手修 pre-existing bug:UPCR 原硬寫 null → 改傳 upcrVal,UPCR-only 病人 staging 從此算得出來
- Spec 邊界:CSV 含 性別/年齡 故 CSV 比畫面多 2 欄(20 vs 18);動作欄列印隱藏(沿用既有 `.action-col` 規則)。
- 跨 repo 副作用:**無** — catalog 沒動,UPCR catalog entry 已於 2026-05-08 Phase 3 Early CKD brief 加入(`T.PROT/CREAT` alternation)。viewer/reporter 不需 sync-patterns。
- Notion 同步:Dashboard 加一條 Done(Done date 2026-05-25)— push 後處理(rule #7)。
- 相依:無
- 兩台 paste 追蹤:本 commit **未**動 `docs/cowork-project-instructions.md` → § 1.0 兩格狀態不重置

---

## 2026-05-25 — catalog:ABI / Fundus 加 vhyl alternation

- 作者:claude(與 YC 共同,在 vhyl Cowork 動手)
- 範圍:catalog(2 條 regex 擴 alternation)+ runtime-snapshot
- 醫院 scope:vhyl(新增字串;vhtt 既有 alternation 不動)
- 變更:修改
- 影響檔:
  - `patterns/catalog.js`:
    - ABI:`/\bABI\b|Doppling ex\./i` → `/\bABI\b|Doppling ex\.|四肢血流探測/i`
    - Fundus:`/Fundoscopy|眼底鏡/i` → `/Fundoscopy|眼底鏡|Fundus\s+color/i`
  - `dist/patterns.json`:跑 `npm run release` 重新產出(51.0 KB,catalog 88 不變)
- 動機:vhyl DM Dashboard S2 實機驗發現 — 16 位 DM 病人 ABI 欄全空。進 ernode 確認 vhyl ABI 的 order name 字面為 `四肢血流探測,壓力測量並記錄(YL)`(不含 `ABI` 字、不含 `Doppling ex.`)→ silent miss。同時看到 vhyl 至少兩個 Fundus 變體:`Fundoscopy(眼底鏡檢查)`(舊 regex cover)+ `Fundus color photo pictureX2(YL)`(舊 regex miss)。
- 設計邊界:
  - `四肢血流探測` 不會誤 match vhyl PVR 的 `動脈分段血流及壓力之測定(YL)`,也不會 match vhtt(vhtt 用 `Doppling ex.` 仍走 alternation cover)
  - `Fundus\s+color` 比單 `Fundus` 安全 — 避免將來如 `Fundus uteri`(產科)等 order 誤命中
- 驗證:
  - `npm run release` 全綠 — 88 catalog · 60 viewer · 15 viewer-A5 · 41 reporter,dist 51.0 KB,track-only 12 條不變
  - vhyl 16 位 DM 病人 Chrome extension reload + 重 fetch:ABI 與 Fundus 兩欄都補上日期(YC 在 vhyl Cowork 2026-05-25 實機驗證 PASS)
- 影響:viewer 需重 sync(已執行 `node sync-patterns.js`);reporter 不動(track-only,不在 REPORTER_MANIFEST)。OPD 端 24h 內透過 `dist/patterns.json` 自動拿到。
- 相依:本 commit 推 main 後,viewer sync commit 才接得上。

---

## 2026-05-22 — vhtt SOP H + SOP J wrap（本 thread 結束、離開 vhtt）

- 作者：claude（與 YC 共同）
- 範圍：`docs/session-state-vhtt.md`（overwrite）+ `docs/session-state-archive/2026-05-22T1226-vhtt.md`（新 archive）+ 本檔（SOP wrap 條目）；無 catalog / computed / manifest 變更
- 本 thread 動作：從 SOP I 接續 2026-05-21 vhtt CKD/DM Dashboard S3,land 兩條工作線：
  - **S3（Order 2.8）read-only 篩檢**：Dashboard 四欄並排（DM 衛教內容 / DM 天數 / Early CKD / Pre-ESRD）取代單欄 / DM 衛教欄拆 truncate+tooltip / CSV UTF-8 BOM / 批次列印篩選後可見列。registry write / DM-CKD-PreESRD stage 引擎 / 收案按鈕 parked → Follow-up 9 項。Commit `e5803da`
  - **Order 2.9 imaging report cleaning**：抽 cxr.js 三層 cleaning 變共用 `cleanImagingReport(rawText)` 放 lab-core.js + popup imaging row render 層套用 + cxr.js refactor。Commit `d88d03b`（brief）+ `eb0ba3f`（歸檔 _done）
- 測試 ID：無（本輪 wrap 不動 catalog;S3 node harness 26/26 PASS 跟 Order 2.9 17/17 PASS 在各自 commit 已記錄）
- Notion 同步：2.8 row Done id `3684b464-2c99-81eb-...` + 2.9 row Done id `3684b464-2c99-819b-...`（2026-05-22）。registry UI 拆除 YC confirm OK + S3/Order 2.9 實機驗證 deferred 已寫進兩 row Notes
- 跨機接手：無 handoff brief（兩條工作線完整 land;vhyl 接這條只需讀 `docs/session-state-vhtt.md` + Notion 開機 SOP）
- 影響：本 thread 結束（YC 訊息「結束 vhtt 工作」= SOP H + SOP J）;下次任一機開新 thread 接續

---

## 2026-05-22 — popup imaging cleaning 收尾：brief 歸檔 _done（無 pattern 變更）

- 作者：claude（與 YC 共同）
- 範圍：docs/task-briefs（brief 歸檔；無 catalog / computed / manifest 變更）
- 變更：改名 `TASK_BRIEF_imaging_report_cleaning_share_done.md` + 勾選測試清單
- 測試 ID：無（本輪不動任何 pattern）
- 原因：`TASK_BRIEF_imaging_report_cleaning_share` 由 viewer 一輪做掉 —— 把 cxr.js
  既有三層 cleaning 抽到 `lab-core.js` 的共用 `cleanImagingReport(rawText)`，popup
  `renderSection` 對 imaging row 在 render 層套用，使 popup 主視窗 LDCT/CAC/BMD row
  顯示 finding/impression 而非 letterhead；cxr.js 改 call 同一份（行為一致）。
- 驗證：無 pattern 變更，未跑 `validate` / `build-json`（`dist/patterns.json` 不動）；
  viewer 端 `node --check` 三檔 OK + vm-load node harness 17/17 PASS（LDCT 主路徑 body
  斷言、BMD 備援、稽核 layer、邊界）。
- 影響：純 viewer 行為，不動 catalog，sibling repo 不需重 sync；OPD 端無 dist 變更。
  實機驗證（vhtt 院內網）列 follow-up 待 YC。

## 2026-05-22 — CKD/DM 篩檢 Dashboard S3 收尾：brief 歸檔 _done（無 pattern 變更）

- 作者：claude（與 YC 共同）
- 範圍：docs/task-briefs（brief 歸檔；無 catalog / computed / manifest 變更）
- 變更：git add（先前 untracked）+ 改名 `_done` + 勾選 S3 測試清單
- 測試 ID：無（本輪不動任何 pattern）
- 原因：`TASK_BRIEF_ckd_screening_dashboard` S3（read-only 篩檢）由 viewer 一輪做掉 —
  四欄資格並排（DM 衛教內容 / DM 天數 / Early CKD / Pre-ESRD）、拆 DM 衛教 truncate+tooltip、
  CSV export（UTF-8 BOM）、批次列印（A4 橫印、篩選後可見列）。brief 先前 untracked，
  本輪 `git add` + 改名 `TASK_BRIEF_ckd_screening_dashboard_done.md`，勾選測試清單
  （邏輯項 ✅、實機項 ⏳ 待 YC）。
- 驗證：無 pattern 變更，未跑 `validate` / `build-json`（`dist/patterns.json` 不動）；
  viewer 端 `node --check` + vm-load node harness 26/26 PASS。
- 影響：S3 不動 catalog，sibling repo 不需重 sync。registry 寫入 / DM·CKD·Pre-ESRD
  stage 引擎 / 收案按鈕 / Pre-ESRD 門檻收緊到 eGFR<30 等均 parked 至下一個 brief
  （brief § Follow-up）。Notion Dashboard row 由 YC 切回 Cowork 後更新。

## 2026-05-21 — Session SOP J wrap：vhtt thread（健檢 CXR 工作線完整收尾）

- 作者：claude（與 YC 共同）
- 範圍：docs/session-state（vhtt）
- 變更：snapshot 更新 + archive
- 檔案：
  - `docs/session-state-vhtt.md`：overwrite 為 2026-05-21 22:13 wrap snapshot（health_check_cxr 工作線收尾、下個 thread 主題 CKD/DM Dashboard S3）
  - `docs/session-state-archive/2026-05-21T2213-vhtt.md`：archive 舊版（前 wrap 2026-05-21 ~15:00；vhtt 首份 archive — 過去 wrap 只 overwrite 沒 archive）
- 內容（snapshot 5 區）：
  1. 本 session 完成 9 段（環境驗證 / 程式碼盤點 / sub-brief 撰寫 / Claude Code polish / Notion 同步 polish / 摘要 unclip fix / 實機 happy-path / parent brief 歸檔 / Notion 補建 parent row）
  2. 本 thread 無工作未完（只剩 wrap 動作本身待 commit）
  3. 下次該先做什麼：CKD/DM Dashboard S3（brief 仍 untracked，第一件事先 git add + Notion 補 row）
  4. Active TODOs snapshot：parent / polish / A5 layout / Reporter Order 3-4 / 衛教格式
  5. Parked：CKD brief untracked / retry-cache corner case 未實機驗 / Cowork memory 寫不進 / 長期 parked carry-over
- 觸發 SOP：YC 訊息「我要開 new thread 以繼續 CKD/DM Dashboard S3」→ SOP G + SOP J（明確語「準備開新 thread」）
- 規則對應：rule #2（改 code/docs 立刻寫 WORKLOG）、rule #7（push 後同步 Notion，本 wrap 不動 Notion 因為單純 snapshot 不影響 Dashboard 狀態）
- 不動：catalog / computed / manifest / sibling repos（純文件操作）

---

## 2026-05-21 — 健檢 CXR brief 歸檔：parent `health_check_cxr` → `_done`

- 作者：claude（與 YC 共同）
- 範圍：docs/task-briefs
- 變更：brief 歸檔（rule #6）
- 檔案：
  - `docs/task-briefs/TASK_BRIEF_health_check_cxr.md` → `_done.md`
- 內容：
  1. parent brief 測試清單打勾：1-5、7-9 通過；6（retry）/ 10（cache hit）corner case 未刻意觸發，unit / 程式碼層已驗證，標 follow-up
  2. § 測試清單頂部加 2026-05-21 happy-path acceptance 註記
- 依據：YC 在 vhtt 實機跑通 — Gemini Flash Key + 50 筆 batch + 列印預覽，回報「測試 ok」
- 觸發 polish 子 brief（`TASK_BRIEF_health_check_cxr_polish_done.md`，上一輪歸檔）+ 摘要 unclip fix（viewer cxr.html 同日）合計三輪改動全部 land。
- 不動：catalog / computed / manifest（純 viewer pipeline，不需 sync-patterns）
- 後續 follow-up（不擋本歸檔）：
  - retry corner case 實機驗證（Chrome DevTools throttle 或自然遇到 5xx/429）
  - cache hit 實機驗證（同 chartno 跑第二次確認 IndexedDB 命中、未打 API）
  - `TASK_BRIEF_ckd_screening_dashboard.md` 仍 untracked（前 thread 起的事，等 CKD S3 完工再一起 commit）

---

## 2026-05-21 — viewer：CXR 報告清理 + 原始內容欄全文顯示

- 作者：claude（與 YC 共同）
- 範圍：viewer（cxr.js）
- 變更：改善
- 影響檔：`cxr.js`
- 內容：
  1. **新增 `cxrCleanReportText()`**：移除報告中的免責聲明（box-drawing 字元 + 敬告/請病患行）、LDCT protocol 說明段落、檢查項目碼行（`檢查項目：數字`）、連續空行壓縮為單行。
  2. **原始內容欄**：從 truncate + tooltip 改為 `white-space:pre-wrap; word-break:break-word` 全文顯示。
- commit：d1a6711

## 2026-05-21 — viewer：健檢報告擴充為四類影像 + 新欄位 + 篩選

- 作者：claude（與 YC 共同）
- 範圍：viewer（cxr.html / cxr.js）
- 變更：擴充
- 影響檔：`cxr.html`、`cxr.js`
- 內容：
  1. 從 CXR-only 擴充到 CXR / BMD / CAC / LDCT 四類影像，每人最多 4 列（每類一列）。
  2. 表格 6 欄：病歷號 / 檢查類型（badge）/ 開單日期（生效時間）/ 檢查日期（簽收時間）/ 原始內容 / 摘要。
  3. 篩選 UI：檢查類型 radio（全部/CXR/BMD/CAC/LDCT）+ 異常/無報告。
  4. 排序：病歷號 → 檢查類型序（CXR=0, BMD=1, CAC=2, LDCT=3）。
- commit：9a50877

## 2026-05-21 — viewer：UI 重構 — popup 統一入口 + 按鈕改名

- 作者：claude（與 YC 共同）
- 範圍：viewer（popup.html / popup.js / dashboard.html / dashboard.js / cxr.html / cxr.js / manifest.json）
- 變更：重構
- 影響檔：7 檔，+152/−226
- 內容：
  1. 按鈕改名：Search→報告查詢 / Dashboard→📊 DM腎病個案管理 / CXR翻譯→🩻 健檢報告。
  2. popup textarea 為唯一輸入入口，Dashboard/CXR 移除輸入區。
  3. `chrome.storage.session` + `onChanged` 監聽實現跨視窗清單傳遞。
  4. Dashboard/CXR 開啟時 focus 已開視窗（不重複開）。
- commit：34119cd

## 2026-05-21 — viewer：健檢 CXR 批次翻譯 pipeline（mock LLM）

- 作者：claude（與 YC 共同）
- 範圍：viewer（新增 cxr.html / cxr.js / llm-translate.js；修改 lab-core.js / popup.html / popup.js / manifest.json）
- 變更：新增
- 內容：
  1. 健檢報告獨立視窗（CXR tab），batch fetch CXR order → 子頁面報告 → LLM 翻譯。
  2. 四種 LLM backend：mock / gemini / claude / openai（llm-translate.js）。
  3. IndexedDB `cxrTranslations` store（DB_VER 5→6），provider/model 快取失效。
  4. CXR 按鈕加入 popup。
- commit：906f32c

## 2026-05-21 — health_check_cxr S1 補充：catalog 新增 BMD / CAC / LDCT 三個檢查 pattern

- 作者：claude（與 YC 共同）
- 範圍：catalog（「檢查」category 新增 3 個 track-only entry）+ runtime-snapshot
- 醫院 scope：vhtt 健檢（order name 為 `PE ...` 系列）
- 變更：新增
- 影響檔：
  - `patterns/catalog.js`：EXAMINATIONS section 尾端 CXR 之後追加 3 條：
    - `BMD`  : `/Bone\s+density/i`         — `PE Whole Body Bone density scan`
    - `CAC`  : `/Coronary\s+Calcium/i`     — `PE85 Coronary Calcium Score CT`
    - `LDCT` : `/Low\s+Dose\s+Chest\s+CT/i` — `PE Low Dose Chest CT`
    依 brief 指定 `unit/ref/lo/hi` 全 `null`（同 section 既有 CXR/EKG 等用 `''`，純 cosmetic 差異，track-only 不渲染故不影響；未統一以保持外科手術式修改）。
  - `dist/patterns.json`：`npm run release` 自動更新（51.0 KB；catalog 85 → 88）。
- 動機：`TASK_BRIEF_health_check_cxr` S2 擴充 — 健檢報告視窗從只看 CXR 擴大到四類影像（CXR/BMD/CAC/LDCT），catalog 先補這 3 個 order name pattern 讓 cxr.js 能 pattern match。純加 catalog，不動 viewer/reporter manifest（track-only）。
- 驗證：
  - `npm run release` 全綠 — 88 catalog · 60 viewer · 15 viewer-A5 · 41 reporter · 14 computed · 9 reporter_computed；dist 51.0 KB；track-only 9 → 12（多 BMD/CAC/LDCT）。
  - regex 樣本對照（6/6）：BMD/CAC/LDCT 各自命中對應 order name；`PE CXR` → 只 [CXR] 不誤命中三者；`CHEST PA or AP View (TT)` → [CXR]；`Chest Left oblique(TT)` → []。
- 影響：viewer 需重 sync（已執行 `node sync-patterns.js`）；reporter 不動。OPD 端 24h 內自動拿到 dist/patterns.json。

## 2026-05-21 — health_check_cxr S1：catalog 新增 CXR track-only pattern

- 作者：claude（與 YC 共同）
- 範圍：catalog（新增 1 個 track-only entry，category「檢查」）+ runtime-snapshot
- 醫院 scope：both（vhtt 健檢用 `PE CXR`；臨床用 `CHEST PA or AP View (TT)`；vhyl 預期 alternation 同樣覆蓋）
- 變更：新增
- 影響檔：
  - `patterns/catalog.js`：EXAMINATIONS section 尾端追加 `CXR` entry，緊接 Fundus。
    - id: `CXR`、displayName: `CXR (胸部X光)`、shortLabel: `CXR`
    - pattern: `/PE\s*CXR|CHEST\s+PA\s+or\s+AP/i`
    - category: 檢查；`unit`/`ref` 留空、`lo`/`hi` null（沿用同 section EKG/ABI/PVR/Fundus 寫法）
  - `dist/patterns.json`：跑完 `npm run release` 自動更新（50.1 KB；catalog 84 → 85）。
- 動機：`TASK_BRIEF_health_check_cxr` Phase 0 已實測 `get_lab_orders` 四位健檢病人（19606F / 1063J / 21968B / 125957A）皆回傳 `PE CXR`（unit=放射線, IMPRESSION=Z00.00_體檢）；S1 就是把這個 order name 編入 catalog，讓 S2 批次 fetch pipeline 能 pattern match。本 commit 純加 catalog entry，不動 viewer / reporter manifest — track-only，現有單人報表零影響。
- 驗證：
  - `npm run release` 全綠 — 85 catalog · 60 viewer · 15 viewer-A5 · 41 reporter · 14 computed · 9 reporter_computed；dist 50.1 KB；track-only 從 8 → 9（多 CXR，符合預期）。
  - regex 樣本對照測試（pass=3/3 必測 + 2 bonus）：
    - `PE CXR` → [CXR] ✅
    - `CHEST PA or AP View (TT)` → [CXR] ✅（match `CHEST PA or AP`）
    - `Chest Left oblique(TT)` → [] ✅（不誤命中其他胸部影像 order）
    - bonus `PECXR`（無空白）→ [CXR] ✅（`\s*` 允許 0 個空白）
    - bonus `15001020 PE . C X R(TT)` → [] ✅（子頁面報告 header 帶 dot+space，但這不是 order name，不影響 S1）
- 影響：viewer 需重 sync（已執行 `node sync-patterns.js`）；reporter 不動（catalog 變更但 reporter manifest 不引用，sync 與否結果一致——但若日後 reporter 也想顯示就要 sync）。OPD 端會在 24 小時內透過 `dist/patterns.json` 自動拿到。

## 2026-05-21 — docs：ernode 取樣 SOP 改為逐頁 fallback + 新增健檢 CXR brief

- 作者：claude（與 YC 共同）
- 範圍：PROJECT_CONTEXT.md § 9 + 新 task brief
- 變更：
  1. **PROJECT_CONTEXT.md § 9 Chrome 自動化技巧**：`searchItem` 搜尋不到時，原本直接判定「病人沒做過」，改為**逐頁瀏覽**所有 order page，掃完全部頁面仍找不到才確認沒做過。同時修正 offset 參數從 1 起（offset=0 回 400 error）。
  2. **TASK_BRIEF_health_check_cxr.md**：新增健檢 CXR 批次翻譯 brief。健檢門診每日 ~50 人，batch fetch CXR 英文報告 → Claude API（Haiku）翻譯為中文白話摘要 + 異常標記。Phase 0 CXR order name 待用健檢病人 chartno 確認（三位 CKD/DM Phase 0 病人的 ernode 均無放射線 order）。
- 動機：Phase 0 掃 76708I（225 筆 12 頁）和 125509A（60 筆 3 頁）時，`searchItem` 搜不到 CXR 但逐頁也沒找到放射線 order，暴露 SOP 原先「searchItem 0 筆就放棄」太武斷的問題。
- commit：627c87b

## 2026-05-21 — ckd_screening_dashboard S1：catalog 新增 EKG / ABI / PVR / Fundus 四個檢查 pattern

- 作者：claude（與 YC 共同）
- 範圍：catalog（新增「檢查」category，4 個 track-only entry）+ runtime-snapshot
- 醫院 scope：both（pattern 設計上 vhtt 合併 order「Doppling ex.」會同時 match ABI/PVR；vhyl 分開兩筆 order 由各自 id match）
- 變更：新增
- 影響檔：
  - `patterns/catalog.js`：尾端新增 4 條 entry（EKG / ABI / PVR / Fundus），category 統一為「檢查」。pattern 設計：
    - `EKG`    : `/E\.K\.G\.|心電圖|EKG|ECG/i` — 對應 vhtt `E.K.G.(TT)`，留 ECG / 中文 alternation 給其他院區
    - `ABI`    : `/\bABI\b|Doppling ex\./i` — `\b` word boundary 避免誤 match 其他 order name 子字串；`Doppling ex.` 對應 vhtt 合併 order
    - `PVR`    : `/\bPVR\b|Doppling ex\./i` — 同上，vhtt 合併 order 會同時 match ABI/PVR，語義正確
    - `Fundus` : `/Fundoscopy|眼底鏡/i` — 對應 vhtt `Fundoscopy(眼底鏡檢查)`
    `unit`/`ref` 留空、`lo`/`hi` 為 null（這四個只需 orderDate / status，沒有 lab 數值要 capture）。
  - `dist/patterns.json`：跑完 `npm run release` 自動更新（49.8 KB；catalog 80 → 84）。
- 動機：`TASK_BRIEF_ckd_screening_dashboard` S1 第一步 — 為了讓 viewer 新 Dashboard（S2）能列出 CKD/DM 收案需要的 EKG / ABI / PVR / 眼底鏡 檢查日期。Phase 0 已實測 ernode `get_lab_orders` 確認回傳這三類 order（測試病人 125509A / 76708I / 122426G）。本 commit 純加 catalog entry，不動 viewer / reporter manifest — 故為 track-only，現有單人報表零影響。
- 驗證：
  - `npm run release` 全綠 — 84 catalog · 60 viewer · 15 viewer-A5 · 41 reporter · 14 computed · 9 reporter_computed；dist 49.8 KB；track-only 從 4 → 8（多 EKG / ABI / PVR / Fundus 4 條，符合預期）。
  - regex 樣本對照測試（pass=6/6）：
    - `E.K.G.(TT)` → [EKG] ✅
    - `Doppling ex. and pressure recodring` → [ABI, PVR] ✅（合併 order 同時 match）
    - `Fundoscopy(眼底鏡檢查)` → [Fundus] ✅
    - `Bil Knee AP+LAT+Tangential 6張 (TT)` → [] ✅（放射線 order 不誤 match）
    - `DM EDUCATION` → [] ✅
    - `BUN` → [] ✅
- 影響：
  - viewer 端：跑 `node sync-patterns.js` 把新 catalog entry bundle 進 `mapping.js`。新 entry 不在 `VIEWER_MANIFEST`，`TEST_MAP = _resolveManifest(VIEWER_MANIFEST, CATALOG)` 不會解析到，故 report.js 既有單人報表完全不受影響。
  - reporter 端：不在 `REPORTER_MANIFEST`，reporter 不受影響、不必重 sync。
  - OPD 端：24h 內透過 `dist/patterns.json` 自動拿到（但 viewer popup 目前還沒消費這四個 id；S2 Dashboard 才會用）。
- 相依：本 commit 推 main 後，viewer commit（同日 chore: sync-patterns）才接得上。reporter 不必動。

## 2026-05-20 — ckd_egfr_staging brief Phase A：computed.js 命名對齊 + REPORTER_COMPUTED 擴充

- 作者：claude（與 YC 共同）
- 範圍：computed（命名修正）+ reporter-manifest（STAGING 類別 + 9 條 computed render manifest）+ runtime-snapshot（dist 多兩欄）
- 醫院 scope：both
- 變更：修改 + 新增
- 影響檔：
  - `patterns/computed.js`：`URR.needs` 從 `['BUNPre','BUNPost']` 對齊成 `['BUN_pre','BUN_post']`（reporter / viewer 共用 id 命名）；id `CaP` → `CaxP`（reporter UI 已用此名）。compute 函式對應改 destructuring。其餘 12 條 computation 不動。
  - `patterns/reporter.js`：CATEGORIES 加 `{id:'STAGING', label:'腎臟病分期'}`；`REPORTER_COMPUTED` 從 2 條（URR/CaxP）擴成 9 條 — 新增 eGFR（cat:STAGING, 數值有 lo:60）+ GFRStage / UACRStage / UPCRStage / KDIGORisk / TaiwanCKD / EarlyCKD（cat:STAGING, kind:'staging'）。URR / CaxP 移除 inline compute 函式（compute 邏輯改由 reporter dispatcher 從 COMPUTATIONS 拿；reporter.js 只留 render metadata）。
  - `scripts/build-json.js`：snapshot 加 `reporter_computed`（現在純 render metadata，可安全 serialize）+ `computed_meta`（COMPUTATIONS 的 id/needs/meta，compute fn 由 replacer 自動丟）。log 印 reporter_computed.length + computed_meta.length。註解更新（原本說「reporter_computed 含 compute fn 故不 snapshot」已不適用）。
  - `dist/patterns.json`：跑完 `npm run release` 自動更新（47.8 → 48.8 KB；新增 reporter_computed + computed_meta 區塊；dropped functions 從 0 → 14，全部來自 COMPUTATIONS 的 compute fn，reporter 端是 inline 取得不靠 dist）。
- 動機：reporter 端 `core/compute.js` 原本只 hardcode 兩條 if-else（URR / CaxP），CKD HTML 上線 12 天 0 個病人有 eGFR / 分期 — Phase 3 commit 自己標 backlog（`groups/early-ckd.js` 舊 line 67–69）。brief `TASK_BRIEF_ckd_egfr_staging` 要求重構 dispatcher 走 COMPUTATIONS registry + 接上 7 條 CKD staging。本 commit 是 Phase A 的 patterns 端，reporter 端 dispatcher 改寫見 reporter WORKLOG 同日條目。
- 命名一致性：COMPUTATIONS 與 REPORTER_COMPUTED / 兩 consumer 內部命名統一（URR 用 BUN_pre / BUN_post、Ca×P 統一稱 CaxP）— 之前 COMPUTATIONS 的 BUNPre / BUNPost 沒對應任何 reporter id，URR 根本算不出來；renaming 後 dispatcher 才能正確跑。
- 驗證：`npm run release` 全綠 — 80 catalog · 60 viewer · 15 viewer-A5 · 41 reporter · 14 computed · 9 reporter_computed；dist 48.8 KB；track-only 仍 4 條（4 個 Urine* catalog entry，CKD HTML 用 — 不變）。
- 影響：
  - reporter 兩個 sync entry-point（`sync-patterns.js` legacy + `build.js` Phase 1 pipeline）都要把 `patterns/computed.js` 一起 inline 才能讓 reporter dispatcher 用 COMPUTATIONS — 改動見 reporter WORKLOG 同日。
  - viewer 端 `patterns-computed.js`（從 computed.js 整檔複製）需重 sync 拿到 URR / CaxP 新命名 — 已跑 `node sync-patterns.js`。viewer report.js 不用 URR / CaxP（只用 HBsAg / Anti-HBs / Anti-HCV display + eGFR helper），所以行為不變。
  - OPD 端 24h 內透過 dist/patterns.json 自動拿到新 reporter_computed + computed_meta 區塊（但 viewer popup 不引用，純資訊性）。
- 相依：本 commit 必須先 push，reporter / viewer commit 才接得上。

## 2026-05-20 — labs_storage_indexeddb brief 收尾（漏 commit 補正）

- 作者:claude（與 YC 共同）
- 範圍:doc（brief 改名歸檔,rule #6）
- 變更:重新命名
- 影響檔:`docs/task-briefs/TASK_BRIEF_labs_storage_indexeddb.md` → `..._done.md`
- 動機:2026-05-13 vhtt 已完成 reporter IndexedDB labs migration（reporter `indexeddb-cache.js` LABDATA_STORE + storage.js / ui-patient-crud.js 全面改用 IDB），brief 本機改名 `_done` 但漏了 `git add` + commit，導致 git 仍追蹤舊檔、Notion Dashboard 未同步。本次補正。
- 跨 repo:無 — reporter 程式碼早已 push。
- 相依:reporter 原始 commit 約 2026-05-13

## 2026-05-20 — A5 brief 歸檔完工(`_done.md`)

- 作者:claude(與 YC 共同)
- 範圍:doc(brief 改名歸檔,rule #6)
- 變更:重新命名
- 影響檔:`docs/task-briefs/TASK_BRIEF_viewer_a5_layout.md` → `..._done.md`
- 動機:viewer A5 landscape 單表版型 v1.4.0 已 push(viewer `02dffd2` + `bf90912` driver hotfix),YC 實機列印 Brother HL-L5100DN 過了,brief § 11 SOP 也寫進去。整個任務從 § 5 step 13 規定完工後改名。
- 跨 repo:viewer 已先 push;patterns 本次只是 brief rename。
- 待 YC 手動:Notion Dashboard 同步 Done(rule #7)— 此處只能提醒,不代操作。
- 相依:patterns `3094167` + `7d23c87`;viewer `02dffd2` + `bf90912`

## 2026-05-20(addendum)— Brief 加 § 11 印表機設定 SOP(Brother HL-L5100DN A5 Long Side)

- 作者:claude(與 YC 共同)
- 範圍:doc(brief 補實機運維 SOP)
- 醫院 scope:both(SOP 適用任何 Brother driver;原則延伸到其他機型)
- 變更:修改
- 影響檔:`docs/task-briefs/TASK_BRIEF_viewer_a5_layout.md` — 新增 § 11(11.1 / 11.2 / 11.3 三小節)
- 動機:YC 實機列印 Brother HL-L5100DN 發現 driver 把 `A5` 與 `A5 Long Side` 視為兩個 paper size,選錯 driver 會把內容 auto-rotate 90°。雖然 viewer commit `bf90912` 已把 `@page` 從 `A5 landscape` keyword 改成 `210mm × 148mm` 顯式寬高(瀏覽器端最強 hint),driver 層的 paper-size + 紙匣 orientation 仍須正確選 — 這條知識若不寫進 brief,下一位接手會踩同樣坑。
- 內容:§ 11 列出必選 4 欄位(A5 Long Side / Landscape / MP tray / 長邊先進)、解釋 root cause、提兩個減少每次手選的方案(11.1 改 driver 預設;11.2 同印表機系統裝兩份不同預設 — 推薦混合用情境);§ 11.3 換機型時的判斷原則。
- 跨 repo:無 — 純 doc。viewer repo `bf90912`(driver 相容性 hotfix)同一波 release 一起 push。
- 相依:viewer `02dffd2` + `bf90912`

## 2026-05-20 — 新增 VIEWER_A5_MANIFEST(viewer A5 單頁版型 source of truth)

- 作者:claude(與 YC 共同)
- 範圍:viewer-manifest(新增第二份 manifest)+ runtime-snapshot(dist/patterns.json 多一欄)
- 醫院 scope:both
- 變更:新增
- 影響檔:
  - `patterns/viewer.js` — 新增 `VIEWER_A5_MANIFEST`(15 個 id,順序 fixed by YC 2026-05-20 cowork);CommonJS 以 property 方式掛在現有 `module.exports = VIEWER_MANIFEST` 上,window 加 `HOSPITAL_LAB_PATTERNS_VIEWER_A5_MANIFEST`。VIEWER_MANIFEST 的 60 個 entry 完全不動。
  - `patterns/index.js` — 載入 `viewerA5Manifest` + resolve 成 `viewerA5`,加進 exported object;version 0.3.0 → 0.4.0(新 manifest = minor bump)。
  - `scripts/validate.js` — 對 VIEWER_A5_MANIFEST 跑同樣的 catalog id 檢查 + 印 resolved length。
  - `scripts/build-json.js` — snapshot 加 `viewer_a5_manifest` 欄位 + log line。
  - `dist/patterns.json` — 跑完 `npm run release` 自動更新(version 0.4.0、新增 15 entry 區塊)。
  - `docs/task-briefs/TASK_BRIEF_viewer_a5_layout.md` — 同 commit 一起進 git(brief 之前 untracked)。
- 動機:viewer A5 landscape 單表版型(衛教/紀錄單)需要一份精簡的列印 id list 與順序。沿用「patterns repo = source of truth」原則,A5 list 寫在 viewer.js 與 VIEWER_MANIFEST 並列,sync-patterns.js 文字 inline → viewer 端 mapping.js 自然帶到。spec 與決議見 brief § 2.3 / § 10。
- Spec 邊界:A5 manifest 只記 `{id, order, section}`,所有 regex/normalize/ref 仍由 catalog 提供;buildA5Page 渲染端不認 `section`(目前為元資料,留待未來分組標頭)。15 個 id 全部已存在於 VIEWER_MANIFEST,所以 viewer mapping.js resolver 已建好 TEST_MAP,無需另外 resolve。
- 驗證:
  - `npm run release` 全綠 — 80 catalog · 60 viewer · 15 viewer-A5 · 41 reporter;dist/patterns.json 45.8 KB,新增 viewer_a5_manifest 區塊。
- 影響:
  - viewer 需重跑 `sync-patterns.js` 才能在 mapping.js 看到 `VIEWER_A5_MANIFEST` 常數(本輪 brief 接下來的步驟會做)。
  - OPD 端 24 小時內透過 dist/patterns.json 自動拿到 A5 list(但 viewer report.js 還沒 implement buildA5Page,所以 OPD 拿到也沒處用 — 等 viewer 端 push 1.4.0)。
  - reporter 不受影響(未引用)。
- 跨 repo 副作用:**viewer 需 sync + 實作 buildA5Page + bump 1.4.0**(本 brief § 5 步驟 3–11)。reporter 無動作。
- 相依:無

## 2026-05-20 — Brief 新增 + viewer 看診序號 overlay 實作 pointer

- 作者:claude(與 YC 共同,在 vhyl Cowork 動手)
- 範圍:doc(本 repo 加 1 個 brief 檔;**catalog 完全無動,viewer/reporter 不需 sync-patterns**)
- 醫院 scope:both
- 變更:新增
- 影響檔:
  - `docs/task-briefs/TASK_BRIEF_viewer_visit_serial_done.md`(直接以 `_done` 進 git;brief 在本 session 內寫完 + 實作 + 驗收一輪結束)
- 動機:viewer 列印多病人報表需印「看診序號」協助護理站分發。spec 來自 2026-05-19 vhyl thread,本 thread 寫 brief + 實作 + 驗收一氣呵成。
- 實作 commit(viewer repo):`91634da` feat(report): tabular paste 看診序號右上角 overlay (v1.3.0)。
- 設計重點:tabular paste(≥5 tab cells)新增 col 1 抓 visitSerial → 報表 page 1+2 右上角 48pt #AAAAAA 淺灰 watermark overlay。free-form / 單一 chartno 不顯示。
- Breaking change(viewer 內部):`popup.js splitChartInput()` 回傳結構 `string[]` → `Array<{chartno, visitSerial}>`,4 個 call site 對齊。
- Spec 邊界:門診上午序號 ≤ 99 假設成立(48pt 不需 auto-shrink);若未來超過需重評估。
- 跨 repo 副作用:**無** — catalog 沒動,viewer/reporter 不用 sync-patterns。
- Notion 同步:Dashboard 加一條 Done(Order 2.5,Done date 2026-05-20)。
- 相依:無
- 兩台 paste 追蹤:本 commit **未**動 `docs/cowork-project-instructions.md` → § 1.0 兩格狀態不重置

## 2026-05-19(addendum 3)— Glossary 區 + SOP J 改名「End thread」+ 思考規則 #12「混淆時詢問」

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:meta-process(詞彙 + 觸發語 + 思考規則,patterns 內 4 個檔)
- 醫院 scope:both
- 影響檔:
  - `PROJECT_CONTEXT.md § 12` — 頂端加 Glossary 區(session/thread/對話 互通 / 階段/段落 / 機器 三層詞彙)+ 判讀關鍵字規則;Trigger 對照表更新明確語(SOP G 加「這段先收」/ SOP J 改「End thread」並擴觸發語)+ 含糊語清單更新;SOP J 子標題改「End thread」
  - `docs/cowork-project-instructions.md` 思考規則加 #12「混淆時詢問」(catch-all,涵蓋 § 12 含糊語 / SOP I pre-flight / 規則 #8 沒明列情境);Session 切換 trigger section 加 Glossary + 明確語更新 + 含糊語更新;最後同步 + 維護紀錄 addendum 3
  - `docs/workflow-changelog.md` 加 addendum 3 條目
- 動機:YC 反映「session」跟「階段」原命名混淆 — SOP G 用「階段完成」、SOP J 用「結束 session」都掛「結束 / 完成」關鍵字,layer 不同但詞撞號。YC 強調 Claude 混淆時要主動問 → 提升為思考規則 #12 catch-all。
- 詞彙三層:
  - `session / thread / 對話` = Cowork 對話視窗(互通)
  - `階段 / 段落 / phase` = 工作 chunk(一個 thread 可多階段,一個階段可橫跨多 thread)
  - `機器` = vhyl/vhtt 物理環境
- 判讀關鍵字:階段→G / thread→J / 機器→H / 接續→I / 都沒→ 強制問
- 規則總數:強制 #1–#7 + 思考 #8–#12(+1)+ Coding contract A–C。單檔最高 cowork-project-instructions.md 12 條,仍在 Forrest Chang 14 條安全線內。
- Trade-off:詞彙明確化前期需要 YC 適應(不能再隨意混用「結束」「告一段落」);換取 silent miss-trigger 大幅降低。
- 測試:N/A(規則層)
- 跨 repo 副作用:無(純 patterns 內 SOP 改動)
- 兩台 paste 追蹤:本 commit 又改 cowork-project-instructions.md → § 1.0 兩格繼續 ⏳
- 相依:本 commit + 同 commit 內重跑 SOP J wrap snapshot(session-state-vhyl.md overwrite + archive 第二個版本)

---

## 2026-05-19(addendum 2)— Session 切換 trigger 改成「明確語 + 含糊語 disambiguate」兩段式

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:meta-process(觸發語表 + Claude 行為,patterns 內 4 個檔)
- 醫院 scope:both
- 影響檔:
  - `PROJECT_CONTEXT.md § 12 Trigger 對照表` — 改成「明確語(直接觸發)+ 含糊語(強制 disambiguate)」兩段
  - `docs/cowork-project-instructions.md` Session 切換 trigger section — 同步分段
  - `docs/cowork-project-instructions.md` 維護紀錄表 — 加 addendum 2 列
  - `docs/workflow-changelog.md` — 加 addendum 2 條目
- 明確語對照(新版):
  - 「告一段落」/「階段完成」/「先停一下」/「休息一下」 → SOP G
  - 「離開 vhyl」/「離開 vhtt」/「換到 vhtt」/「換到 vhyl」/「換機器」 → SOP H
  - 「接續 vhtt」/「接續 vhyl」/「接續上次」/「繼續上次」 → SOP I
  - 「準備開新 session」/「等等要重開對話」 → SOP J
- 含糊語清單(不直接動作,Claude 強制問三選一):「結束」/「結束 session」/「結束對話」/「收工」/「下次再說」/「先這樣」/「就到這」
- 動機:YC 反映「結束 session」太模糊 — 可能是 G(休息)/ J(關對話)/ H(離開機器)三種不同情境。日常更常脫口而出「告一段落」「下次再說」這類口語,原表沒涵蓋。
- Trade-off:含糊語多一個 confirmation round,但避免 silent miss-trigger(誤跑 J 浪費開新對話力氣 / 誤跑 G 漏 handoff)。對應 Coding behavior contract B 精神(矛盾模式不混用)— 明確語跟含糊語走不同處理路徑。
- 測試:N/A(規則層)。下次 YC 講含糊語時 Claude 應該強制 disambiguate。
- 跨 repo 副作用:無(純 patterns 內 SOP 改動;viewer/reporter 無感)
- 兩台 paste 追蹤:本 commit 又改 cowork-project-instructions.md → § 1.0 兩格繼續維持 ⏳(本 session 已是 ⏳ 狀態,無變化)
- 相依:本 commit 單獨 patterns repo 即可

---

## 2026-05-19(addendum)— SOP I pre-flight:cross-machine resume 強制 Project Instructions 對齊

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:meta-process(SOP 增補,patterns 內 3 個檔)
- 醫院 scope:both
- 影響檔:
  - `PROJECT_CONTEXT.md § 12 SOP I` — 加 Step 0「Pre-flight check」:cross-machine resume 時讀 Notion § 1.0 paste 追蹤表本機格,⏳ block 後續、提示 YC 重貼 Cowork UI Project Instructions,貼完才繼續
  - `PROJECT_CONTEXT.md § 12 SOP G` Step 6 加「特別檢查」:本 session 改動 `cowork-project-instructions.md` → § 1.0 兩格(或對方那格)重置 ⏳
  - `docs/cowork-project-instructions.md` Session 切換 trigger section 末尾加一行 pre-flight 註記;維護紀錄表加 addendum 列
  - `docs/workflow-changelog.md` 加 2026-05-19 addendum 條目
- 動機:YC 反映 — 上機(例如 vhtt)改了 cowork-project-instructions.md 但本機(vhyl)Cowork app UI 仍是舊版,Claude 在本機跑舊規則 → silent drift。原本 § 1.0 paste 追蹤表只是被動標記,YC 易忘。改成 SOP I Step 0 主動 block。
- Trade-off:多一個 confirmation round,但杜絕 silent drift。對應 Coding behavior contract B(矛盾模式不混用)的精神 — 舊規則跟新規則並存就是矛盾模式。
- 測試:N/A(規則層)。下次跨機 resume 觸發時實際驗證 pre-flight block 流程跑得起來。
- 跨 repo 副作用:無(純 patterns 內 SOP 增補;viewer/reporter 無感)
- 兩台 paste 追蹤:本 commit 又改 cowork-project-instructions.md → § 1.0 兩格繼續維持 ⏳(本 session 已是 ⏳ 狀態,無變化)
- 相依:本 commit 單獨 patterns repo 即可

---

## 2026-05-19 — Session 切換 SOPs G–J + session-state 機制 + workflow-changelog.md

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:meta-process(非 catalog;改 PROJECT_CONTEXT.md + cowork-project-instructions.md + 4 個新檔)
- 醫院 scope:both(規則對 vhyl / vhtt 共用)
- 影響檔:
  - `PROJECT_CONTEXT.md` — 加 § 12「Session 切換 SOPs」(SOP G–J + snapshot 檔結構 + 容量考量)+ § 13「Cowork ↔ Chat mode handoff」
  - `docs/cowork-project-instructions.md` — 加「Session 切換 trigger」section(類似 Pattern-learning trigger);最後同步日期 + 維護紀錄追加一行
  - 新檔 `docs/session-state-vhyl.md`(每機 current snapshot,Cowork 端 wrap 時 overwrite)
  - 新檔 `docs/session-state-vhtt.md`(同上)
  - 新檔夾 `docs/session-state-archive/`(.gitkeep)wrap 時把舊 current 搬進來,檔名 `YYYY-MM-DDTHHMM-<machine>.md`
  - 新檔 `docs/workflow-changelog.md`(跨 repo 工作流變動史 canonical;不放 Notion,Notion 加 pointer 行)
- 動機:cross-session / cross-machine 切換時 Claude 沒有「最後狀態」可讀,YC 反映「切換方式不穩定 你會不知道我上一步做甚麼」。Notion + WORKLOG + briefs 雖各完整但碎片化,缺單一 entry-point 接續。
- 設計決策:
  - 每機一份 `session-state-<machine>.md` current 檔(無日期 → 讀邏輯簡單);archive 子夾保留歷史,檔名含 timestamp + machine
  - 機器 ID(`-vhyl` / `-vhtt`)必加 — 跨機 resume 要分辨「最後寫入是誰」;同機 end+resume 也用同一機制
  - Notion 不放 SOP 內文,只在主入口 page 加 pointer 行
- Trigger 對照:「階段完成」→ G;「離開 vhyl/vhtt」→ H;「接續 vhtt/vhyl/上次」→ I;「結束 session」→ J(SOP J Claude 主動觸發 — context 逼近上限、同問題重述 ≥ 2 次、決策完成自然斷點)
- 測試:N/A(規則 / SOP 層)。下一個 session 結束實際跑 SOP G 時驗證 archive cp + overwrite 流程跑得起來。
- 跨 repo 副作用:viewer / reporter `WORKLOG.md` 各補一條 pointer 條目。下次規則 / SOP 改動需三個 repo 一起改才不會 drift。
- 兩台 paste 追蹤:cowork-project-instructions.md 改動 → § 1.0 表狀態仍為 ⏳,vhyl + vhtt 兩台 boot 後都要重貼新版 Project Instructions(規則修訂 + Session 切換 trigger 都進去了)
- 相依:本 commit 內全部一起。Notion pointer 行 push 後同步。
- 來源連結(設計依據):blocktempo 文末「6 條對症規則 > 12 條其中 6 條用不上」原則;對應本專案踩過坑的失敗模式(YC 2026-05-19 vhyl session 內反映)

---

## 2026-05-19 — Brief 集中:把 reporter / viewer 散落 4 條歷史 brief 搬進 docs/task-briefs/

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:doc relocation(無 code 動)
- 醫院 scope:both
- 變更:新增 4 個 brief 檔到 `docs/task-briefs/`,原始檔自各 sibling repo root 移走
- 背景:reporter / viewer 兩 repo 的 `.gitignore` 都有 `TASK_BRIEF*.md`(line 25),所以這 4 個 brief 從來沒進 git 歷史、兩台機器各自有本機版本可能 drift。統一搬到 patterns/docs/task-briefs/ 後第一次納入 git 追蹤、跨機可見、跟 Notion Dashboard 的 Brief path 路徑慣例一致。
- 改名對應:
  | 原路徑 | 新路徑 |
  |---|---|
  | `hospital-lab-reporter/TASK_BRIEF_step1_done.md` | `docs/task-briefs/TASK_BRIEF_reporter_step1_extract_dialysis_module_done.md` |
  | `hospital-lab-reporter/TASK_BRIEF_step1_v3_done.md` | `docs/task-briefs/TASK_BRIEF_reporter_step1v3_dialysis_form_aware_export_done.md` |
  | `hospital-lab-reporter/TASK_BRIEF_step2.md` | `docs/task-briefs/TASK_BRIEF_reporter_step2_bun_reporttime_switch_done.md` |
  | `hospital-lab-viewer/TASK_BRIEF_肝炎硬編對齊vhyl_done.md` | `docs/task-briefs/TASK_BRIEF_viewer_hepatitis_regex_align_vhyl_done.md` |
- 命名約定:`TASK_BRIEF_<source_repo>_<descriptor>_done.md`,讓檔名一眼看出原 repo + 內容。step2 原本沒 _done 後綴,YC 2026-05-19 確認當已完成處理,加 _done。
- 測試:N/A(純檔案搬移)。reporter / viewer root 兩個 `ls TASK_BRIEF*` 結果為空。新位置 4 個檔 size 與原檔對齊(13410 / 14816 / 11865 / 8202 bytes)。
- 跨 repo 副作用:reporter / viewer 兩個 repo 因 .gitignore 將原檔忽略,搬走後 `git status -s` 仍應乾淨(不會看到 delete 紀錄)。patterns repo 會看到 4 個 untracked 新檔。
- Notion 處理:不主動補進 Dashboard(這 4 條都是 pre-Dashboard 時期 2026-05-04 ~ 2026-05-05 的歷史 brief,加進去會混淆當下 TODO 視覺;git 檔案路徑足以追溯)。
- 相依:無;單 commit 在 patterns repo 即可。reporter / viewer 各補一條 WORKLOG pointer 條目(由 cross-repo 一致性考量)。

---

## 2026-05-19 — Behavior rules: 加入「思考規則」+「Coding behavior contract」

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:meta-rules(非 catalog;改的是 CLAUDE.md / PROJECT_CONTEXT.md / cowork-project-instructions.md)
- 醫院 scope:both(規則對 vhyl / vhtt 共用)
- 影響檔:
  - `docs/cowork-project-instructions.md` — 強制規則 7 條後加「思考規則」section(#8–#11),更新「最後同步」日期 + 維護紀錄
  - `CLAUDE.md` — 「不要做的事」之前加「Coding behavior contract」section(A–C)
  - `PROJECT_CONTEXT.md` — 加 § 11「Behavior rules sources」,含篩選矩陣 + Notion 處理立場
- 來源:Forrest Chang 12-rule CLAUDE.md(blocktempo 2026-05-14 中文版整理,Karpathy 原 4 條 + 補 8 條共 12 條)。
- 篩選原則:只選對應本專案實際踩過坑的條目(原 3 / 7 / 8 / 1 / 4 / 10 / 12);評估標準是「過去 8 週 session log 內能不能對應到一次實際失敗 / 修正」。對應不到 → 不採。
- 落點:
  - Cowork 端思考類 → cowork-project-instructions.md § 思考規則(#8–#11)
  - 寫碼類 → 三個 repo CLAUDE.md § Coding behavior contract(A–C,內容同步)
  - Notion 不放規則內文 — Notion 是狀態鏡像,規則進 Notion 會多源 drift。Notion「🛠 開機 SOP」page 後續只加一行 pointer。
- 跨 repo 副作用:viewer / reporter 兩個 CLAUDE.md 同 commit 加上同一份 Coding behavior contract(三 repo 共用版本)。下次規則改動需三個 repo 一起改才不會 drift。
- 測試:N/A(規則層,非 catalog;不跑 npm run validate / build-json)。
- 兩台 paste 追蹤:`cowork-project-instructions.md` 改動 → § 1.0 表狀態應重置為 ⏳,vhyl + vhtt 兩台 boot 後都要重貼 Cowork app UI 的 Project Instructions(等本 commit push 後 Notion 同步)。
- 相依:本 commit + viewer/reporter 各自的 WORKLOG.md + CLAUDE.md 改動,三個 repo 一起 push。
- 來源連結:https://www.blocktempo.com/claude-code-12-rules-error-rate-3-percent-karpathy-agent/

---

Each entry should include:

- **Date** (YYYY-MM-DD)
- **Author** (your initials, or `claude` for Claude-driven sessions)
- **Hospital scope** (tt / yl / both)
- **Test ID(s)** affected
- **Change** (added / updated / removed)
- **Rationale** (one or two sentences)
- **Validation** (sample value the regex captured, e.g. `WBC: 6.87` → `6.87`)

---

## 2026-05-13 — FreePSA 加回 `RATIO:` alternation（更正 2026-05-08 誤判）

- 作者:claude(與 YC 共同,在 vhtt 動手)
- 範圍:catalog + runtime-snapshot(`patterns/catalog.js` + `dist/patterns.json`)
- 醫院 scope:both(vhtt 主要受益;vhyl 已有 `FREE PSA/PSA RATIO:` 涵蓋)
- 影響 Test ID:`FreePSA`
- 變更:updated(加回 `RATIO` alternation,更正 5/8 錯誤註解)
- Rationale:
  2026-05-08 移除 `|RATIO` 時錯誤假設 vhtt `RATIO: 0.152` 為 Free/Total
  比值。2026-05-13 在 vhtt 取樣 3 個病人(000017679E / 000043524F /
  000026353G),YC 確認 RATIO 值為 Free PSA 絕對濃度(ng/mL),報告後接
  的 boilerplate(`(Free PSA/Total PSA ratio:>25%),Total PSA值落在4-10
  ng/mL的病患…`)為判讀指引而非數值語意。加回 alternation 讓 vhtt 的
  Free PSA 重新被正確擷取。詳細取樣與決策過程見
  `docs/task-briefs/TASK_BRIEF_freepsa_vhtt_ratio_revisit_done.md`。
- 變更後 pattern:
  `/(?:Free PSA|FREE PSA\/PSA RATIO|RATIO):\s*([<>]?\s*[\d.]+)/`
- Validation(vhtt):
  - 000017679E `RATIO: 0.152` → capture `0.152` ✓(先前 null)
  - 000043524F `RATIO: 0.093` → capture `0.093` ✓(先前 null)
  - 000026353G `RATIO: 0.079` → capture `0.079` ✓(先前 null)
  - vhyl 000025318J `FREE PSA/PSA RATIO: 0.097` → capture `0.097` ✓(維持)
  - 假想 `Free PSA: 1.23` → capture `1.23` ✓(維持)
- Sibling sync:`hospital-lab-viewer` + `hospital-lab-reporter` 都要跑
  `node sync-patterns.js`(catalog 改動)。

### 同日追加:FreePSA 加 `orderNameFilter`(防 UACR `RATIO:` 誤匹配)

- 觸發 case:vhtt 000017679E,viewer 出現不存在的 110/08/21 Free PSA = 4.8。
  實際來源為同病人 `Urine Microalbumin(TT)` 舊格式報告的 `RATIO: 4.8`
  (UACR mg/g),被 FreePSA 的 `RATIO` alternation 誤抓。
- 根因:`RATIO:` 至少出現在兩種 order 的 reportText —
  - `Free PSA(TT)` / `FREE PSA`:Free PSA 絕對濃度 ng/mL(0.01–2)
  - `Urine Microalbumin(TT)`:UACR albumin/creatinine ratio mg/g(1–3000+)
  原 FreePSA regex 不區分 orderName,任何 reportText 含 `RATIO: N` 都命中。
- Patch:加 `orderNameFilter: /Free\s*PSA/i`,只在 orderName match
  `/Free\s*PSA/i` 的 order 裡跑 FreePSA regex。
- 覆蓋:
  - `Free PSA(TT)` ✓
  - `FREE PSA` ✓
  - `Urine Microalbumin(TT)` ✗(正確排除)
- Validation:
  - 000017679E `Free PSA(TT)` reportText `RATIO: 0.152` → 命中 ✓
    (orderName `Free PSA(TT)` match `/Free\s*PSA/i`)
  - 000017679E `Urine Microalbumin(TT)` reportText `RATIO: 4.8` → 不命中 ✓
    (orderName 排除)
- 衍生發現(不在本 patch 範圍):UACR entry 的 pattern 不認得舊格式
  `RATIO:`(110 年之前的 Urine Microalbumin 報告),只認新格式 `ALB/CR:`。
  若需覆蓋舊 UACR 資料另開 brief 評估。
- 詳細決策見 `docs/task-briefs/TASK_BRIEF_freepsa_orderNameFilter_done.md`。

### 同日追加:UACR 加 `RATIO` alternation + `orderNameFilter`(補抓 110 年前舊格式)

- 觸發來源:上一條 FreePSA orderNameFilter brief 的衍生發現
  (000017679E 110/08/20 `RATIO: 4.8` 為真實 UACR 值,但 UACR pattern 漏抓)。
- 範圍:catalog + runtime-snapshot(`patterns/catalog.js` + `dist/patterns.json`)
- 醫院 scope:vhtt(主要;vhyl 是否有同現象待確認但不阻擋)
- 影響 Test ID:`UACR`
- 變更:updated(pattern 加 `RATIO` alternation + `orderNameFilter: /microalbumin/i`)
- Rationale:
  vhtt 的 Urine Microalbumin 報告在 110 年中以前用 `RATIO: N` 輸出 UACR,
  之後改為 `ALB/CR: N`。原 UACR pattern 只認 `ALB/CR` 系列,110 年中以前
  的 UACR 全部漏抓 → CKD reporter 早期病人歷史趨勢會出現斷層。加 `RATIO`
  alternation 補上,同時加 `orderNameFilter: /microalbumin/i` 防止與
  Free PSA 的 `RATIO:` 衝突(FreePSA 那邊也已加對稱的
  `orderNameFilter: /Free\s*PSA/i`,兩條 filter 互斥)。
- 變更後 pattern:
  `/(?:U-?ACR|UACR|Alb(?:umin)?\/Cr(?:eatinine)?|Urine\s*Alb\/Cr|RATIO):\s*([<>]?\s*[\d.]+)/i`
- orderName 覆蓋(Phase 1 取樣 3 個 vhtt 病人):
  - `Urine Creatinine(TT),Urine Microalbumin(TT)` ✓
  - `Urine Microalbumin(TT),Urine Creatinine(TT)` ✓
  - `Urine Microalbumin(TT)` ✓
  - `Creatinine,Microalbumin`(舊式短名) ✓
  - `Free PSA(TT)` ✗(正確排除)
- Validation(3 個 vhtt 病人,4 筆舊格式樣本全部驗算 mALB/Cr×1000 吻合):
  - 000017679E 110/08/20 `RATIO: 4.8` → capture `4.8` ✓(先前 null)
  - 000026353G 109/09/08 `RATIO: 15.79` → capture `15.79` ✓(先前 null)
  - 000043524F 110/03/23 `RATIO: 25.53` → capture `25.53` ✓(先前 null)
  - 000043524F 109/10/06 `RATIO: 72.73` → capture `72.73` ✓(先前 null)
  - 新格式 `ALB/CR: 7.35` 等 → 維持命中 ✓
  - Free PSA(TT) reportText `RATIO: 0.152` → UACR 不命中 ✓
    (orderName `Free PSA(TT)` 不含 microalbumin;FreePSA 仍命中)
- 格式轉換時間點(Phase 1 取樣):約 110 年中(2021 年中),精確窗口
  110/03–110/11 之間(由 000043524F 框住)。
- Sibling sync:`hospital-lab-viewer` + `hospital-lab-reporter` 都要跑
  `node sync-patterns.js`(catalog 改動)。
- 詳細決策與 Phase 1 取樣見
  `docs/task-briefs/TASK_BRIEF_uacr_old_ratio_label_done.md`。

---

## 2026-05-12 — FreePSA 加 `FREE PSA/PSA RATIO:` alternation（vhyl 變體）

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:catalog + runtime-snapshot(`patterns/catalog.js` + `dist/patterns.json`)
- 醫院 scope:yl(觸發 case;vhtt 無感 — 路線 1 不動 vhtt `RATIO:` 處理)
- 影響 Test ID:`FreePSA`
- 變更:updated(pattern alternation 加 `FREE PSA/PSA RATIO:` 變體)
- Rationale:
  - **觸發 case**:vhyl 000025318J,viewer 顯示 Free PSA 為 empty。
  - **vhyl 實際 label 樣式**:`Free PSA(YL)` order 的 reportText 為
    `FREE PSA/PSA RATIO: 0.097`(該值經 YC 確認為 Free PSA 絕對濃度
    ng/mL,非 Free/Total 比值;PSA=0.395 + FreePSA=0.097 → ratio 24.6%
    屬正常範圍,語意 consistent)。
  - 原 pattern `/Free PSA:\s*([<>]?\s*[\d.]+)/` 因 vhyl label 為全大寫
    + 接 `/PSA RATIO` 後綴而漏抓。加 alternation 涵蓋此樣式。
- 變更後 pattern:`/(?:Free PSA|FREE PSA\/PSA RATIO):\s*([<>]?\s*[\d.]+)/`
- Validation(vhyl 000025318J):
  - `FREE PSA/PSA RATIO: 0.097` → capture `0.097` ✓
  - `Free PSA: 1.23`(假想其他院區)→ capture `1.23` ✓(舊行為維持)
  - vhtt `RATIO: 0.152` → 不命中(維持 2026-05-08 行為,符合路線 1 設計)
- 範圍邊界(路線 1):本次**只**處理 vhyl 變體;2026-05-08 對 vhtt
  `RATIO:` 樣式「該值為比值不該存」的解讀是否誤判,另寫
  `docs/task-briefs/TASK_BRIEF_freepsa_vhtt_ratio_revisit.md` 帶回 vhtt
  嚴肅處理(涉及歷史 case 重新檢視 + 可能 WORKLOG 更正,超出 vhyl minor
  範圍)。

---

## 2026-05-12 — RBC + GluAC 加 negative lookahead（vhyl 尿液常規誤匹配）

- 作者:claude(與 YC 共同,在 vhyl 動手)
- 範圍:catalog + runtime-snapshot(`patterns/catalog.js` + `dist/patterns.json`)
- 醫院 scope:both(yl 觸發 case;邏輯 vhtt 無感)
- 影響 Test ID:`RBC`、`GluAC`
- 變更:updated(各加一個 negative lookahead)
- Rationale:
  - **RBC**(vhyl 000012148C 觸發):`URINE ROUTINE(YL)` 尿沉渣的
    `RBC: 0-2`(顆/HPF range)被 `/\bRBC:\s*([<>]?\s*[\d.]+)/` 抓到,
    capture group 取到開頭的 `0` → 存進血液 RBC = 0 ×10⁶/µL。WBC 早就
    有同型 lookahead 擋掉 `WBC: 0-5`,RBC 漏寫。
  - **GluAC**(vhyl 000124693B 觸發):`URINE ROUTINE(YL)` 的尿糖
    qualitative gradient `GLU: 4+` 被 alternation 內的 `GLU[\s-]*(?:AC)?:`
    抓到,capture group 取到 `4` → 存進空腹血糖 = 4 mg/dL。5/8 收緊
    `bare Glucose:` 沒同步處理 `GLU:` label 變體(因為當時只見到 vhtt 的
    Glucose case)。
- Patch:
  ```js
  // RBC
  pattern: /\bRBC:\s*([<>]?\s*[\d.]+)(?!\s*[-–]\s*\d)/

  // GluAC
  pattern: /(?:Glucose\([^)]*\)|GLU[\s-]*(?:AC)?|Sugar(?:\([^)]*\))?
            |AC[\s-]*Sugar|飯前血糖):\s*([<>]?\s*[\d.]+)(?!\s*\+)/i
  ```
- 對 vhtt 影響:無。`(?!\s*[-–]\s*\d)` 只擋 range(`數字-數字`),
  `(?!\s*\+)` 只擋 gradient(`數字+`)。vhtt 血液 RBC=4.5 / serum
  GluAC=95 都不會被擋。
- Validation:vhyl 兩個觸發病人 re-extract 後:
  - 000012148C RBC:5 → 4 筆,0 個 zero、0 筆來自 URINE。
  - 000124693B GluAC:8 → 4 筆,0 個 four、0 筆來自 URINE,
    剩下皆 `GLUCOSE(AC)(YL)` orderName,值 125–137 mg/dL。
- Sibling sync:`hospital-lab-viewer` + `hospital-lab-reporter` 跑
  `node sync-patterns.js`,reporter 兩個 disease HTML 一起重 build。

---

## 2026-05-08 — GluAC 收緊 bare-Glucose alternation（修尿液 Glucose: 4+ 誤匹配）

- 作者：claude（與 YC 共同）
- 範圍：catalog + runtime-snapshot
- 變更：修改
- 測試 ID：GluAC
- 原因：CHEM EXAM(TT) 尿液例行報告含 `Glucose: 4+`（定性）。原 regex
  `Glucose(?:\([^)]*\))?` 把括號設為 optional，所以尿液的 bare
  `Glucose:` 也被命中；接著 `[\d.]+` capture 抓到 `4+` 的開頭數字 `4`，
  把 GluAC 誤存成 `4 mg/dL`。已確認 case：vhtt 000026353G 115/02/26
  尿液報告 `Glucose: 4+` → GluAC 被誤存成 4（實際空腹血糖 80）。
- 變更後：bare `Glucose` 改成必須帶括號（site qualifier），即
  `Glucose\([^)]*\)`。Serum 報告寫 `Glucose(AC-serum): 80` /
  `Glucose(serum): 75` 仍正常匹配；尿液 bare `Glucose: 4+` / `Glucose: -`
  不再誤匹配。其他 alternation（`GLU` / `GLU-AC` / `Sugar(...)` /
  bare `Sugar:` / `AC-Sugar:` / `飯前血糖:`）全部不變 — 沒已知尿液
  label 用這些 alias，零回歸風險。
- 驗證：本機 12 個 case 全過：`Glucose(AC-serum): 80` ✓、
  `Glucose(serum): 75` ✓、`GLU: 92` ✓、`GLU-AC: 88` ✓、
  `Sugar(AC-serum): 81` ✓、`Sugar: 79` ✓、`AC-Sugar: 84` ✓、
  `飯前血糖: 90` ✓、`Glucose: 4+` ✗（reject）、`Glucose: -` ✗、
  CHEM EXAM 尿液長 / 短格式 ✗。`npm run release` 全綠（catalog 80 /
  viewer 60 / reporter 41 / computed 14 / 4 track-only urine）。
- 影響：sibling repos 都需 re-sync — 已跑：
  - viewer：`node sync-patterns.js` 重產 mapping.js / normalizers.js /
    patterns-computed.js
  - reporter：`node sync-patterns.js` 重產 legacy markers + dialysis +
    ckd 兩個 built HTML

## 2026-05-08 — FreePSA regex 移除 RATIO alternation（修 vhtt 誤匹配）

- 作者：claude（與 YC 共同）
- 範圍：catalog + runtime-snapshot
- 變更：修改
- 測試 ID：FreePSA
- 原因：vhtt 的 `Free PSA(TT)` 報告**只**輸出 `RATIO: 0.152`（Free/Total
  比值，小數），**不**輸出 Free PSA 絕對濃度。原 regex
  `/(?:Free PSA|RATIO):\s*([<>]?\s*[\d.]+)/` 的 `RATIO` alternation 把
  比值（如 0.152）當成 `FreePSA` 濃度（ng/mL）抓進去 → 下游 PSARatio
  computed 觸發、UI 顯示錯誤資料。已確認 case：
  - vhtt 000017679E：PSA=0.631，報告 `RATIO: 0.152` → 被誤存 FreePSA=0.152
  - vhtt 000043524F：PSA=0.113，報告 `RATIO: 0.093` → 被誤存 FreePSA=0.093
- 變更後：pattern 改為 `/Free PSA:\s*([<>]?\s*[\d.]+)/`，移除 `RATIO`
  alternation。vhtt 這類「只有 RATIO」的報告 → FreePSA 正確留 null →
  PSARatio computed 不觸發（`PSA == null || FreePSA == null` 直接
  return null）— 這是正確行為。其他院區若 inline 用 `Free PSA: N`
  輸出絕對濃度仍照常匹配，零回歸。
- 驗證：`npm run release` 全綠 — catalog 80 / viewer 60 / reporter 41 /
  computed 14。`Grep` 跨三 repo 確認沒任何 `Free PSA|RATIO` / `FreePSA
  ... RATIO` 殘留。
- 影響：sibling repos 都需要 re-sync — 已跑：
  - viewer：`node sync-patterns.js` 重產 mapping.js / normalizers.js /
    patterns-computed.js
  - reporter：`node sync-patterns.js` 重產 legacy markers + dialysis +
    ckd 兩個 built HTML
- ⚠️ 事後更正（2026-05-13）：上述「RATIO 是比值」的判斷為誤判。
  vhtt RATIO 值實為 Free PSA 絕對濃度（ng/mL）。已在 2026-05-13 加回
  RATIO alternation，詳見當日 WORKLOG 條目。

## 2026-05-08 — Phase 3 前置：catalog 加 4 條尿液 + UPCR 加 T.PROT/CREAT alternation

- 作者：claude（與 YC 共同）
- 範圍：catalog + runtime-snapshot
- 變更：新增 4 條 / 修改 1 條
- 測試 ID：UrineOB、UrineGlucose、UrineCr、UrineProtein、UPCR
- 原因：reporter Phase 3 將推出 `hospital-lab-ckd.html`，對應腎臟病平台
  「檢驗數據」匯出（23 欄），其中 4 個尿液項目（尿潛血 OB、尿糖、尿肌
  酸酐、尿蛋白定量）catalog 原本沒有；UPCR pattern 也只認 `RATTC:`
  （vhyl）不認 `T.PROT/CREAT:`（vhtt 主流），跨院區會漏抓。Phase 3 已
  於 84 位 vhtt CKD 病患的 ernode 報告驗證 regex（見
  `TASK_BRIEF_phase3_early_ckd.md` §1.3 + §0 統計）。
- 具體變更：
  - **UrineOB**：`/(?:\bOB|\bOCCL):\s*([+\-]+(?:\/[+\-])?|\d+\+)/` —
    支援 long `OB: -`（vhyl/舊版）和 short `OCCL: 1+ (-)`（vhtt/新版）
    兩種 reportText 格式；capture 停在空白以丟掉參考值 `(-)` 後綴。
    `qualitative:true`，定性正規化（→ `[-]`/`[+]`/`[++]`/...）由
    export-formats 層處理。`orderNameFilter: /CHEM\s*EXAM|尿液|Urine\s*protein/i`。
  - **UrineGlucose**：同 OB pattern 結構，`(?:\bGlucose|\bGLU)`。
    `orderNameFilter` 同 OB（與 serum GluAC 區分）。
  - **UrineCr**：`/Creatinine\s*\((?:24hrs?\s*)?Urine\):\s*([<>]?\s*[\d.]+)/i`，
    來源 Urine Microalbumin(TT)+Creatinine(TT)。Label `Creatinine(24hrs Urine):`
    與 serum `Creatinine(serum):` 不同 — 不會誤撈 serum CREAT。
  - **UrineProtein**：`/尿蛋白\s+([<>]?\s*[\d.]+)\s*mg\/dL/i`，
    來源 Urine total protein(TT) **子頁面**（inline 只有 UPCR）。配
    `subpage.orderNameMatch: /Urine\s*total\s*protein|尿蛋白定量/i` 觸發
    enrichMissingValues 的 sub-page chase；子頁面已直接印 `尿蛋白 N mg/dL`，
    不需 resultPattern 翻譯。
  - **UPCR**：alternation 加 `T\.?PROT\/CREAT`（`T\.?` 同時匹配
    `T.PROT/CREAT` 與 `TPROT/CREAT`）。原本的 `RATTC` / `TP/Cr` /
    `Urine TP/Cr` 等保留 — 跨院區相容。實測 vhtt 45+ 位病患
    `Urine total protein(TT)` inline 全部用 `T.PROT/CREAT:`。
- 驗證：`npm run release` 全綠 — catalog 80（+4）、viewer 60、
  reporter 41 / computed 14 / 2 normalizers。**Track-only 暫時 4 項**
  （UrineOB / UrineGlucose / UrineCr / UrineProtein）— 預期，因為 CKD
  manifest 依 brief 設計放在 reporter 的 `groups/early-ckd.js`（self-
  contained group module），不在 `patterns/reporter.js`。後續 Step 2
  reporter sync 會把 catalog 注入到 ckd HTML，新 manifest 在 group module
  端 reference 這些 ids。
- 影響：sibling repos：
  - viewer：無影響（尿液項目不在 viewer manifest）。
  - reporter：必須跑 `node sync-patterns.js` 拉新版 catalog 再 build；
    Phase 3 同 commit 一起做。

## 2026-05-08 — reporter manifest 加 FreeCa / Mg / UIBC（KiDiTi Phase 2 前置）

- 作者：claude（與 YC 共同）
- 範圍：reporter-manifest + runtime-snapshot
- 變更：新增 3 條 manifest entries
- 測試 ID：FreeCa（在 Ca 後）、Mg（在 P 後）、UIBC（在 TIBC 後，computed=TIBC−Fe）
- 原因：reporter 端要新增 `匯出KiDiTi資料` 按鈕（KiDiTi 平台檢驗記錄
  58 欄），其中 field 34（離子鈣 FreeCa）、field 37（UIBC）、field 41
  （Mg）原本不在 reporter manifest，因此 `extractLabValues` 不會 store
  到 localStorage，匯出時會空值。三個 ID 在 catalog 早就有（FreeCa /
  Mg pattern 已就位、UIBC 是 catalog computed 條目），只缺 reporter
  manifest 的 opt-in。
- 驗證：`npm run release` 全綠 — catalog 76 / viewer 60 / reporter
  41（從 38 → 41）/ computed 14。reporter sync 重跑後 LAB_TESTS 含
  三條新 entry。
- 影響：只有 reporter 需要重 sync。viewer 不受影響（viewer manifest
  獨立，FreeCa 已在 viewer manifest，Mg/UIBC viewer 沒對應 page slot
  不需加）。

## 2026-05-07 — Detection-limit regex（49 條 capture group 加 `[<>]?\s*`）

- 作者：claude（與 YC 共同）
- 範圍：catalog（regex 全面擴充）+ runtime-snapshot
- 變更：修改
- 測試 ID：WBC, RBC, Hb, HCT, MCV, Platelet, TP, Albumin, GOT, GPT, RGT, ALP,
  TBIL, DBIL, CHOL, HDLC, LDL, TG, GluAC, HbA1c, BUN, BUN_pre, BUN_post,
  CREAT, UA, eGFR, UACR, UPCR, Na, K, Cl, Ca, FreeCa, P, Mg, Fe, TIBC, TSAT,
  iPTH, VitB12, FolicAcid, PSA, FreePSA, TSH, FreeT4, HBsAgTiter,
  AntiHBsTiter, AntiHCVTiter, CD4
- 原因：原本 49 條 numeric capture group 是 `([\d.]+)`，遇到偵測下限值
  `<0.01` / `<2` / `>2000` 完全不 match — 連 pipeline 都進不來。Ferritin /
  Aluminum / AFP / CEA / CA199 / CA125 已先各自加過 `[<>]?`，本輪把還沒加
  的 49 條一次補齊。`[<>]?` 是 zero-width optional，純數字 case 完全不變；
  `\s*` 容許 `<` 與數字間有空白（例 `< 2.00`）；WBC negative lookahead
  不受影響。viewer `valueStyle()` 早就 `replace(/^[<>]\s*/, '')` 後 parseFloat；
  reporter `extractLabValues()` 自 2026-05-07 起對 `<` / `>` 開頭值保留為
  string（不 parseFloat → 不掉）— 兩端都已支援，這次只是補上 regex 入口。
  順手把 Aluminum entry 內提到 "extractLabValues currently parseFloats it
  ... pre-existing limitation, not fixed in this task" 的過時備註改成現況
  描述（reporter 早就修了）。
- 驗證：`npm run release` 通過 — catalog 75 · viewer 60 · reporter 38 ·
  dist/patterns.json 41.2 KB。MISS-detection 一行 node 檢查 0 命中
  (`/\(\[\d.\]\+\)/.test(s)` 全無)；spot-check：TSH `2.5` → `2.5`、
  TSH `<0.01` → `<0.01`、TSH `< 0.01` → `< 0.01`、WBC `0-5`（urine）仍
  reject、WBC `6.7` 正常 capture。viewer / reporter 已重 sync。
- 影響：sibling repo（viewer / reporter）已執行 `node sync-patterns.js`
  並重新內嵌；OPD 端 24h 內透過 dist/patterns.json 自動拿到。
- TASK_BRIEF：`docs/task-briefs/TASK_BRIEF_detection_limit_regex_done.md`

---

## 2026-05-07 — 肝炎 6 條 regex 全加 i flag（修 vhtt 全大寫 ANTI-HCV match 不到）

- 作者：claude（與 YC 共同）
- 範圍：catalog（regex case-insensitive）+ runtime-snapshot
- 變更：修改
- 測試 ID：HBsAg, AntiHBs, AntiHCV, HBsAgTiter, AntiHBsTiter, AntiHCVTiter
- 原因：vhtt 110 年之後 ANTI-HCV order 主 reportText 格式為:
  ```
  Anti-HCV: 0.13
  ANTI-HCV: Non-Reactive Non-Reactive
  ```
  定性行用全大寫 `ANTI-HCV`，但 catalog regex
  `/(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/`
  沒有 i flag → fail → AntiHCV globally missing。
  92066B 跟 23355G 各 7 筆 ANTI-HCV 全部抓不到。Titer 行剛好混合大小寫
  `Anti-HCV:` 能 match，但缺 i flag 是隱患。
  順手檢查 6 條肝炎相關 regex 全沒 i flag，**全部一併加上**防禦
  vhtt 可能存在的 HBSAG / ANTI-HBS 全大寫變體。i flag 對既有
  `[^\s\d]\S*` / `[\d.]` capture 無副作用。
  舊格式 `HCV Ab(TT): Non-Reactive` 不受影響（regex 先 match
  `HCV Ab`）。
- 驗證：`npm run release` 通過 — catalog 75 · viewer 60 · reporter 38；
  dist/patterns.json 40.8 KB。等 YC reporter 重新 fetch 92066B →
  「檢驗資料」分頁 AntiHCV 應從 missing → 顯示 `Non-Reactive`。
- 影響：sibling repo（viewer / reporter）需要重 sync，已執行。
  PROJECT_CONTEXT.md 不更新（純 bug fix，非新功能）。
- 備註：92066B 的 AFP（0 筆）是真缺，非 regex 問題，本輪不修。

---

## 2026-05-07 — Aluminum regex 加 BALR0101（外送 lab code）+ UACR opt-in subpage chase

- 作者：claude（與 YC 共同）
- 範圍：catalog（regex 擴充 + UACR subpage opt-in）+ runtime-snapshot
- 變更：修改
- 測試 ID：Aluminum、UACR
- 原因：reporter 端實機測 92066B，看到 6 筆 Blood Aluminum order 但表格只 1 筆。
  F12 console diag 顯示主 reportText **已含全部 6 筆值**，只是格式分兩種：
  - 最近一筆（在地檢驗）：`Al鋁: 4`
  - 歷史 5 筆（外送「新南海醫事檢驗所」）：`BALR0101: <2 / 3 / 6 / 5 / 6`
  原 catalog regex `Al鋁:` 只認在地格式，外送的 5 筆全漏，被誤判成 missing；
  之後 enrichMissingValues 又因為 chartno orgin = `file://`（reporter 是
  本機 HTML）+ opdweb 沒 CORS header，所有 sub-page fetch 全 blocked。本輪
  改成不抓 sub-page、純靠主 regex 命中：
  - Aluminum pattern → `/(?:Al鋁|BALR0101):\s*([<>]?\s*[\d.]+)/`
  - UACR catalog 加 `subpage.orderNameMatch`（broad urine regex）讓 UACR
    在 viewer 端能繼續走 sub-page chase（viewer 是 Chrome extension，有
    host_permissions 沒 CORS 問題）
- 驗證：`npm run release` 通過 — catalog 75 · viewer 60 · reporter 38；
  dist/patterns.json 40.8 KB；regex 對 `BALR0101: <2`、`BALR0101: 3`、
  `Al鋁: 4` 三種樣本全部命中（capture group 1）。
- 影響：sibling repo（viewer / reporter）需要重 sync，已執行。
- **已知限制（非本輪 scope）**：
  - extractLabValues 把 `<2` parseFloat 後成 NaN 直接 drop。`<2`（低於
    偵測下限）是臨床上有意義的值（≠ missing）但目前會消失。要處理需
    跨層改 alarm 比較邏輯與 CSV 輸出。
  - reporter 走 `file://` 開啟時所有 opdweb sub-page fetch 都 CORS
    blocked。要解決需把 HTML 移到 localhost server 或裝 CORS bypass
    extension。viewer Chrome extension 不受影響。

---

## 2026-05-07 — 新增 Aluminum + 微量元素 category + sub-page enrichment 配置

- 作者：claude（與 YC 共同）
- 範圍：catalog + reporter-manifest + schema + runtime-snapshot
- 變更：新增
- 測試 ID：Aluminum
- 原因：vhtt 透析病人血鋁年檢資料探測（18 人，12 人有資料），主頁面
  格式 `Al鋁: 6` / `Al鋁: <2`（低於偵測下限），子頁面 OpdOrderReport.aspx
  只給 `Result: N`。為了讓 viewer / reporter 共用通用 sub-page enrichment
  機制（後續 Phase 2/3），catalog entry 新增 optional `subpage` 欄位
  記錄 `{ orderNameMatch, resultPattern, synthLabel }`，由 enrichment pass
  在子頁面文字沒有 `Al鋁:` 時，根據 orderName 含 Aluminum 翻譯
  `Result: N` → 注入 `Al鋁: N` 進 reportText，下游 regex 即可命中。
- 驗證：`npm run release` 通過 — catalog 75 (+1) · viewer 60 · reporter 38
  (+1) · dist/patterns.json 40.3 KB；schema.js `subpage` 已加入
  ALLOWED_FIELDS。AFP 既有的 `[<>]?` 寫法被沿用到 Aluminum 主 regex 與
  subpage.resultPattern。
- 影響：sibling repo（hospital-lab-viewer 與 hospital-lab-reporter）的
  `sync-patterns.js` 都需要重跑（catalog 動到了）；Phase 2 會接著重構
  viewer 的 enrichUACRMulti → 通用 enrichMissingValues，Phase 3 會把
  enrichment 整套搬進 reporter HTML。**Viewer manifest 不收 Aluminum**
  （per YC 決議：門診衛教單不顯示血鋁），只在 reporter 的透析表格與
  CSV 出現。

---

## 2026-05-07 — gitignore 加 TASK_BRIEF / TASK_revision_BRIEF

- 作者：claude（與 YC 共同）
- 範圍：—（gitignore 一致性）
- 變更：修改
- 測試 ID：—
- 原因：sibling `hospital-lab-viewer` / `hospital-lab-reporter` 兩端
  `.gitignore` 都早已忽略 `TASK_BRIEF*.md` / `TASK_revision*_BRIEF*.md`
  （per-task hand-off brief，不入庫）。本 repo 漏了這條，每次 cowork
  寫 brief 進這裡都會以 untracked 浮現。本輪補齊一致性。
- 驗證：`git status` 不再列出 root 的 `TASK_BRIEF_subpage_enrichment.md`。
- 影響：完工 brief 仍依規則 #6 改名 `_done` 並搬到 `docs/task-briefs/`。
  pattern 用 `/TASK_BRIEF*.md` 開頭錨定 repo root，所以
  `docs/task-briefs/TASK_BRIEF_*_done.md` 不會被 ignore，可正常 commit。

---

## 2026-05-07 — Claude Code 改為從 workspace root 啟動 + workspace CLAUDE.md template

- 作者：claude（與 YC 共同）
- 範圍：docs（新增 1 + 修改 4；workspace 機制定義）
- 變更：新增 workspace-claude-md-template + 校正 4 份既有文件
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 收尾本日（2026-05-07）的文件大整理。前面三輪 commit
（`6a4f6c8` v0.3 校正 + 4 份 SOP；`19ee557` 加規則 #7；`a42f5be` 搬位置
+ 規則 #6 重寫）之後，發現操作層面還有一個漏洞：Claude Code 一直以來
都是 `cd <single repo>` + `claude`，每次只能看一個 repo，跨 repo 改動
要重複 cd / exit / re-enter。實務上 patterns + viewer + reporter 三個
repo 經常一起改，這種逐個切換很沒效率。本輪定義「workspace root」
機制 — Claude Code 永遠從 `D:\self\hospital-lab` 啟動，由其自行 cd
到各 repo。

**設計重點：**

- **新增 workspace CLAUDE.md template**：`docs/workspace-claude-md-template.md`
  作為 source of truth。內容包含 (a) 三個 repo 的角色說明；(b) 跨 repo
  工作順序（patterns → viewer → reporter）；(c) full release + sync
  cycle 範例命令；(d) 7 條強制規則摘要；(e) 指向 PROJECT_CONTEXT.md
  的深度參考。**workspace root 的 CLAUDE.md 不屬於任何 repo**（不 git
  track），是本機 workspace 設定。每台新機器 clone 完三個 repo 後從
  template 複製一次。
- **bootstrap.md Phase 2 加 workspace CLAUDE.md 步驟**：clone 完三個
  repo 之後，從 template 複製成 workspace root 的 `CLAUDE.md`。
- **PROJECT_CONTEXT.md §10.7 Mode split + Hand-off pattern 重寫**：
  加 「Claude Code 執行方式」小節（強調永遠從 workspace root 啟動），
  hand-off diagram 從「PowerShell, in repo root」改為「PowerShell, 從
  workspace root」，並加註各 repo 分別 commit、一起 push 的 flow。
- **cowork-project-instructions.md Modes 段同步**：「Claude Code — 從
  workspace root 啟動，一次跨 3 repo 操作」（取代原本「git、跑
  sync-patterns」單行說明）。
- **sop-claude-code-guide.md 步驟 1 重寫**：刪掉「方法 A / 方法 B」
  二選一寫法，改為「永遠從 workspace root 啟動」單一指令路徑，並警告
  不要 cd 進單一 repo 跑 claude。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 僅 synced_at 時間戳
  差異，已 checkout 還原。
- workspace CLAUDE.md 已實際運行測試：本輪 commit 就是從 workspace
  root 啟動 Claude Code 跨 3 repo 操作完成的（自我驗證）。

**影響：**

- 新機器設定：bootstrap.md Phase 2 多一步「複製 template」，但省下後續
  每次跨 repo 工作都要逐個 cd 的時間。
- 既有機器：已存在 workspace root CLAUDE.md 的機器無變化；沒建立的
  機器下次需依 bootstrap Phase 2 補建。
- sibling repo 不需 sync，OPD viewer 無變化；patterns 沒動。

---

## 2026-05-07 — 文件大整理：BOOTSTRAP / COWORK_PI 搬進 docs/ + 規則 #6 重寫

- 作者：claude（與 YC 共同）
- 範圍：docs（檔案搬移 + 路徑引用校正 + 規則重寫）
- 變更：搬移 2 + 修改 5
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 收尾本日（2026-05-07）的文件大整理。前兩輪 commit（`6a4f6c8`
v0.3 校正 + 新增 4 份 SOP；`19ee557` 加規則 #7）之後，發現 repo root
還散著兩份「明明是 docs」的檔案（`BOOTSTRAP.md`、`COWORK_PROJECT_INSTRUCTIONS.md`），
而且 `cowork-project-instructions` 內的規則 #6（TASK_BRIEF _done 改名）
只寫了一行，沒涵蓋實務上的分層更新邏輯（CLAUDE.md / PROJECT_CONTEXT.md
誰要動、其餘 docs 何時動）。本輪一口氣搬位置 + 重寫規則 #6 + 同步所有
路徑引用。

**設計重點：**

- **搬移**：兩份檔搬進 `docs/`（git 自動偵測為 rename，history 保留）：
  - `BOOTSTRAP.md` → `docs/bootstrap.md`
  - `COWORK_PROJECT_INSTRUCTIONS.md` → `docs/cowork-project-instructions.md`
- **規則 #6 重寫為分層更新策略**（取代原本一行式說明）。新版分 5 點：
  (a) `_done` 改名 + 集中搬到 `hospital-lab-patterns/docs/task-briefs/`；
  (b) brief 原在 sibling repo（gitignored）時的處理；
  (c) 與當輪最後一個 commit 同一輪做掉；
  (d) **同時更新** `CLAUDE.md`（若架構/行為變了）與 `PROJECT_CONTEXT.md`
  （加 milestone）；(e) **其餘 `docs/` 文件留到 major revision 再整批校正**
  — 避免每次小改都觸發大量周邊 doc 更新。
- **路徑引用同步**：`README.md`、`PROJECT_CONTEXT.md`、`CLAUDE.md` 三檔
  把對 `BOOTSTRAP.md` / `COWORK_PROJECT_INSTRUCTIONS.md` 的舊路徑全改成
  `docs/bootstrap.md` / `docs/cowork-project-instructions.md`。
- **SOP 文件小修**：`docs/sop-cowork-guide.md` / `docs/sop-claude-code-guide.md`
  也順手對齊新路徑（前兩輪 commit 寫好的版本裡引用了舊 root 路徑）。
- **不動 patterns**：純 docs commit，`patterns/*.js` / `dist/patterns.json`
  零異動，sibling repo 不需 sync。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 僅 synced_at 時間戳
  差異，已 checkout 還原。
- `git status` 顯示：兩個 `R` rename + 5 個 `M`，符合預期；BOOTSTRAP /
  COWORK_PI 在 root 已不存在，docs/ 下出現對應新檔。

**影響：**

- repo 結構：root 只剩專案級 README / CLAUDE / PROJECT_CONTEXT / WORKLOG
  / package.json 等，所有人類向操作手冊都收進 `docs/`。
- Claude（本身）行為：下次依新版規則 #6 處理 TASK_BRIEF 完工搬遷 +
  分層 doc 更新；不再每輪都被逼著校正所有周邊 docs。
- sibling repo 不需 sync，OPD viewer 無變化。

---

## 2026-05-07 — Cowork project instructions 加規則 #7（回覆加中文註解）

- 作者：claude（與 YC 共同）
- 範圍：docs（COWORK_PROJECT_INSTRUCTIONS.md）
- 變更：修改（在強制規則段落新增第 7 條 + footer 同步日期 2026-05-06 → 2026-05-07
  + history 表新增一列）
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 使用者在 Cowork UI 端把 project instructions 加了第 7 條規則
「回覆時在關鍵段落或結論旁加上簡短繁體中文註解（一句話），方便快速瀏覽；
文件內容本身維持英文」。本檔是 portability snapshot，UI 改了就必須同步
本檔，避免 drift（這個慣例本身寫在檔案開頭）。

**設計重點：**

- 規則 #7 適用「Cowork 對話回覆」場景；不影響 repo 內既有英文文件、
  程式碼註解、commit message 風格。
- WORKLOG（本檔）本來就是繁體中文，不受規則 #7 直接影響。
- 純 docs commit；`patterns/*.js` / `dist/patterns.json` 全無異動，sibling
  repo 不需 sync。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 只有 synced_at 時間戳
  差異，已 checkout 還原。

**影響：**

- 純 Cowork 端行為調整（影響 Claude 回覆風格），repo 行為與 OPD viewer
  皆無變化。

---

## 2026-05-07 — 文件校正 + 新增 4 份中文 SOP（docs only，不動 patterns）

- 作者：claude（與 YC 共同）
- 範圍：docs（README、PROJECT_CONTEXT、learning-workflow、pattern-spec、
  hospital-differences）+ 新增 docs/sop-cowork-guide.md、
  docs/sop-claude-code-guide.md
- 變更：修改既有文件 + 新增 2 份 SOP 檔（含 4 個 SOP）
- 測試 ID：—（純文件變更，無 catalog / regex 異動）

**觸發：** Cowork 端做完了一輪文件對齊：(a) 把 README / PROJECT_CONTEXT
裡的 counts 從舊的 69/54 更新到 v0.3 實際數字 74 catalog · 60 viewer · 37
reporter；(b) learning-workflow.md 從 v0.2 提到 v0.3 並把 quick refresher
的數字、computed 條目數對齊；(c) pattern-spec.md 補上 2026-05-05 SOP G
新加的 `loM` / `hiM` / `loF` / `hiF` 四個欄位、gender-aware fallback 規則
與已遷移清單；(d) hospital-differences.md 把舊 "empty / TBD" 占位移除，
列出 2026-05-05 五批修正期間實際確認的 6 筆 vhtt vs vhyl label 差異；
(e) 新增兩份中文 SOP 文件：sop-cowork-guide.md（SOP-CW1 Cowork 基本操作 +
SOP-CW2 pattern learning via Chrome）與 sop-claude-code-guide.md（SOP-CC1
Claude Code 基本操作 + SOP-CC2 Cowork ↔ Claude Code hand-off 流程）。

**設計重點：**

- 純文件變更，不動 `patterns/*.js`，所以 `dist/patterns.json` 不需重 build
  入庫（本輪 release 跑出來只有 `synced_at` 時間戳差異，已 checkout 還原，
  避免污染 commit diff）。
- 兩份新 SOP 只是把現有 PROJECT_CONTEXT.md §9 / CLAUDE.md 既定流程拆成
  獨立、可單獨閱讀的中文操作手冊，方便新機器（如 vhtt 桌機）使用者直接
  照步驟跑，不需先讀整份 PROJECT_CONTEXT。
- pattern-spec.md 的 gender-aware 段落把 SOP G validate 規則明文化：
  「若任一 `loM/hiM/loF/hiF` 存在，`lo/hi` 必須存在作 fallback」。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 2 normalizers · 1 track-only（Mg）· dist/patterns.json
  39.3 KB（內容無實質變化，僅 synced_at 時間戳，已還原）。
- 文件交叉檢查：README、PROJECT_CONTEXT、learning-workflow 三處的 catalog
  / viewer / reporter counts 一致（74 / 60 / 37）；pattern-spec 中列的
  已遷移 entry 清單與 catalog 實際情形一致。

**影響：**

- 純 docs commit，**sibling repo 不需 sync**（catalog / computed /
  normalizers / dist 全無異動），OPD viewer 不會有任何行為變化。
- 兩份新 SOP 是對使用者（YC）的操作參考，不影響 Claude 自身行為（強制
  規則仍以 Cowork Custom Instructions 與 per-repo CLAUDE.md 為準）。

---

## 2026-05-06 — EarlyCKD 非 CKD 時回傳「正常」(視覺一致性)

- 作者：claude（與 YC 共同）
- 範圍：computed、runtime-snapshot
- 變更：修改 `patterns/computed.js` 的 `EarlyCKD()`，把 `tw === '正常'`
  分支從 `return null` 改成 `return '正常'`；其餘行為不動。
- 測試 ID：EarlyCKD
- 原因：使用者在 OPD 看到病患 000151649A 三筆紀錄裡，「慢性腎臟病分期」列
  顯示 正常 / 第一期 / 正常，但「健保 CKD 分群」列顯示 空白 / P1 早期 / 空白，
  兩列視覺不一致，誤以為系統漏抓。改後 EarlyCKD 在「沒抽 eGFR」時仍空白，
  其餘狀態都會出值（正常 / P1早期 / P2中晚期）。
- 驗證：`npm run release` 全綠（74 catalog · 60 viewer · 37 reporter ·
  13 computed · dist/patterns.json 39.3 KB）；spec 抽樣：
  `EarlyCKD({TaiwanCKD:'正常', eGFR:95})` → `'正常'`、
  `EarlyCKD({TaiwanCKD:'第一期', eGFR:95})` → `'P1早期'`、
  `EarlyCKD({TaiwanCKD:'第三期 3b', eGFR:35})` → `'P2中晚期'`、
  `EarlyCKD({TaiwanCKD:null, eGFR:null})` → `null`。
- 影響：viewer 與 reporter 都要重跑 `node sync-patterns.js` 以取得新版
  `patterns-computed.js`；viewer 還需手改 `report.js` 的 client-side
  pairing 迴圈（`if (!twCKD)` 分支多 push 一筆 EarlyCKD 正常 cell）並
  更新 `CLAUDE.md` line 42 / `ckd_staging.svg` line 189 兩處說明，
  以及重打包 zip + 寄發 viewer 更新通知 Draft。OPD 端 dist/patterns.json
  推上 main 後 24 小時內自動拿到。

---

## 2026-05-06 — viewer manifest 切換到肝炎 *Display(Item B Phase 1.5)

- 作者：claude(與 YC 共同)
- 範圍:viewer-manifest、runtime-snapshot
- 變更:viewer manifest 把 `HBsAg`、`AntiHBs` 兩條改成 `HBsAgDisplay`、
  `AntiHBsDisplay`(套 catalog 預設,不再用 manifest 端 `computed:'HBsAg'` /
  `pattern:null` / `singleValue:true` override);新增 6 條 raw extract-only
  entry(`HBsAg`、`HBsAgTiter`、`AntiHBs`、`AntiHBsTiter`、`AntiHCV`、
  `AntiHCVTiter`)讓 viewer 的 parse loop 抓得到原始定性 + 滴度供
  computed wrappers 取用。HCV 條目不動(catalog 端已補 needs)。
- 測試 ID:HBsAgDisplay、AntiHBsDisplay、HCV、HBsAg、HBsAgTiter、
  AntiHBs、AntiHBsTiter、AntiHCV、AntiHCVTiter

**觸發:** Phase 1 已把 catalog + computed 改好,但 viewer 端 manifest
還指向舊 id。本輪只動 patterns repo 的 viewer 端 manifest,讓 OPD viewer
透過 `dist/patterns.json` 24h 內拿到新映射。viewer repo 端的 `report.js`
findHepatitis / findAntiHBs 拆除 + dispatcher 加上,留到 Phase 2 viewer
那一輪做(因為改到 viewer code 必須在 sibling repo 內)。

**設計重點:**

- viewer 的 `pattern-loader.js` `buildTestMap` 只 resolve viewer manifest
  ✕ catalog,所以不在 manifest 內的 catalog entry 不會被抓。確認後決定
  把 6 條 raw entry 加到 manifest;為了讓它們不被 render,沿用 viewer
  既有的 page-filter 慣例(`tests.filter(t => t.page === pageNum)`,
  report.js:752)— 不寫 `page` 就會自動跳過 render,但 parse loop 仍會
  跑 `text.match(test.pattern)`(report.js:141-173 不依賴 page)。比
  brief 提的 `extractOnly:true` 字面欄位更乾淨,不需新增 schema 欄位。
- HBsAgDisplay / AntiHBsDisplay 的 manifest entry 從原本的「全 override」
  退化成只指定 `page:1, col:4, section:'肝炎'`;catalog 已備好 `computed`、
  `needs`、`singleValue:true`、`pattern:null`,沿用即可。

**驗證:**

- `npm run release` 全綠:74 catalog · 60 viewer · 37 reporter
  (viewer 從 54 → 60:+8 新加,-2 舊的 HBsAg/AntiHBs);track-only
  從 6 條剩 1 條(只剩 Mg,5 條肝炎相關全進了 viewer manifest)。
- `node -e` 直接打 resolved entry 確認 `lib.byId('HBsAgDisplay').needs`
  = `['HBsAg','HBsAgTiter']`、`AntiHBsDisplay.needs` =
  `['AntiHBs','AntiHBsTiter']`、`HCV.needs` = `['AntiHCV','AntiHCVTiter']`,
  `computed` 欄位也都有。
- dist/patterns.json 重 build(39.3 KB)。

**影響:**

- 這次 push 之後 OPD viewer 會在 24h 內拿到新 viewer manifest。但 viewer
  端 `report.js` 還用 `findHepatitis()` / `findAntiHBs()` 用舊 id
  (`map['HBsAg']` / `map['AntiHBs']`)寫結果;新 manifest 已改用
  `HBsAgDisplay` / `AntiHBsDisplay` 渲染 → **這段時間若沒同步更新
  viewer code,肝炎欄會渲染空白**。
- 因此 Phase 1.5 push 完不要等 24h,**馬上接 Phase 2**(進 viewer repo
  改 report.js + 重打包)。否則 OPD 端會出現短暫渲染破損。

---

## 2026-05-06 — 肝炎顯示集中化(Item B Phase 1)

- 作者：claude（與 YC 共同）
- 範圍：catalog、computed、runtime-snapshot
- 變更：新增 5 條 entry（3 raw titer + 2 computed display）+ 補 HCV.needs
  + AntiHBs regex 對齊到 vhyl 樣式;computed.js 新增 _hepatitisDisplay
  helper 與 HBsAgDisplay/AntiHBsDisplay/HCV 三個函式並註冊到 COMPUTATIONS。
- 測試 ID：HBsAg、AntiHBs、AntiHCV、HBsAgTiter、AntiHBsTiter、AntiHCVTiter、
  HBsAgDisplay、AntiHBsDisplay、HCV

**觸發：** TASK_BRIEF.B.md — viewer `report.js` 的 `findHepatitis()` 與
`findAntiHBs()` 硬編了一套跟 catalog 重複的肝炎 regex,vhyl/vhtt 變體要兩邊
同步維護(2026-05-05 Issue 1 收尾的 backlog 第 2 條)。本輪 Phase 1 把所有
肝炎 regex 集中到 catalog,並把顯示邏輯(Reactive→帶原 / 正常 / 有抗體)
寫進 patterns/computed.js,作為單一來源。viewer 端的搬遷留到 Phase 2。

**設計重點：**

- catalog 改為「raw qualitative + raw numeric titer + computed display」
  三層結構。reporter 維持用 raw qualitative 顯示原始 `Non-Reactive` 文字;
  viewer 的 manifest 改指向 computed display 條目(Phase 2 才動)。
- Anti-HBs 的 polarity 與 HBsAg / Anti-HCV 相反:Reactive=有抗體=`normal`,
  Non-Reactive=無抗體=`warning`。`_hepatitisDisplay` 用 `polarity:'antibody'`
  / `'antigen'` 參數切換,共用一份字串組合邏輯。
- AntiHBs 原本 regex `/Anti-HBs(?:\(TT\))?:\s*(\S+)/` 抓不掉 vhyl
  「Anti-HBs: 245.5Anti-HBs (YL): Reactive」這種黏連格式(會抓到
  `245.5Anti-HBs`)。本輪對齊到 HBsAg / AntiHCV 同款
  `/Anti-HBs\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/`,vhyl 與 vhtt 都正確。
- HBsAgTiter / AntiHBsTiter / AntiHCVTiter 用 `[\d.]+` 自然停在後接的字母
  `H` / `A`(vhyl 的 "0.21HBsAg"、"0.12Anti-HCV" 黏連格式)。
- 5 條新 entry 暫時不在任何 manifest 內,validate 顯示為 track-only
  (預期行為,Phase 2 viewer 接手後 5 條全進 viewer manifest)。
- HCV 既有 catalog entry 補 `needs:['AntiHCV','AntiHCVTiter']`,把原本
  「name 在 catalog,實作在 viewer」的斷裂修起來。

**驗證：**

- `npm run release` 全綠:74 catalog · 54 viewer · 37 reporter;
  dist/patterns.json 重 build(39.2 KB)。
- 暫存 spec `scripts/hep-display-spec.js` 跑 26 個 assertion(vhyl 9 +
  vhtt 9 + 邊界 8)全 PASS,涵蓋:
  - vhyl 黏連格式 "HBsAg: 0.21HBsAg (YL): Non-Reactive"
    → HBsAgDisplay = `正常 (HBsAg 0.21)` tag:normal
  - vhtt 樣式 "HBsAg(TT): Reactive" → `帶原 (HBsAg 1.85)` tag:warning
  - antibody polarity:Reactive → `有抗體` tag:normal
  - titer 缺值不附括號;異常文字 → caution 帶原文;qualitative 空 → null
- 全 PASS 後依 brief 指示已刪除 spec 檔。

**影響：**

- viewer 與 reporter 兩個 sibling repo 的 `sync-patterns.js` 都應該
  重跑(catalog 與 computed.js 都改了)並重新打包推送。
- OPD viewer 24h 內透過 `dist/patterns.json` 自動拿到新 catalog,但
  **viewer 端 report.js 的 `findHepatitis()` / `findAntiHBs()` 仍硬編
  舊 regex**,這部分要等 Phase 2 viewer 改完才會徹底切過去。Phase 1
  本身對既有 viewer 行為無破壞性。

---

## 2026-05-06 — GPT/RGT/BUN/CREAT/UA 加 gender-aware hi（沿用 SOP G）

- 作者：claude（與 YC 共同）
- 範圍：catalog、runtime-snapshot
- 變更：5 條 entry 補 `hiM` / `hiF`（不加 lo 系列）
- 測試 ID：GPT、RGT、BUN、CREAT、UA

**觸發：** 收尾 2026-05-05 Issue 1 backlog 第 1 條。剩下 5 條 catalog entry
原本 `hi` 鎖男性、`lo:null`，女性中段值會「漏 alarm」（不誤判但少警示）。
本輪沿用 5 月 5 日已建好的 schema 機制（loM/hiM/loF/hiF + lo/hi fallback）
把它們補上，只動 patterns repo。

**設計重點：**

- 5 條原本都 `lo:null`、只 alarm 高邊；本輪維持醫學意圖**只加 `hiM`/`hiF`**，
  不引入低值 alarm。
- BUN 的 fallback `hi:25.7` 是原作者對「男性 ULN 20.6」加的軟緩衝，unknown
  gender 時保留；已知性別則精準用 `hiM:20.6` / `hiF:18.7`（這是預期的設計
  緊縮，不是 regression）。
- 其他 4 條的 fallback `hi` 等於男性 hi，跟原值一致，unknown gender 行為不變。

| ID | hiM | hiF | hi (fallback) | lo |
|---|---|---|---|---|
| GPT | 45 | 34 | 45 | null |
| RGT | 55 | 38 | 55 | null |
| BUN | 20.6 | 18.7 | **25.7（軟緩衝保留）** | null |
| CREAT | 1.2 | 1.0 | 1.2 | null |
| UA | 7.7 | 6.2 | 7.7 | null |

**驗證：**

- `npm run release` 全綠：69 catalog · 54 viewer · 37 reporter；
  dist/patterns.json 重 build（37.3 KB）。
- 暫存 spec `scripts/gender-threshold-2.js` 跑 15 個樣本 + 5 條欄位存在性檢查
  → 20/20 PASS：
  - 男 GPT 40 → NORMAL；男 GPT 50 → HIGH
  - 女 GPT 30 → NORMAL；女 GPT 40 → **HIGH（關鍵 case，本輪修補）**
  - 男 BUN 25 → HIGH（gender-aware 緊縮：hiM=20.6）
  - 男 BUN 19 → NORMAL；女 BUN 19 → HIGH
  - unknown gender BUN 25 → NORMAL（fallback 25.7 軟緩衝）；BUN 26 → HIGH
  - CREAT/UA 同模式抽驗通過
- spec script 通過後已刪除（CLAUDE.md 暫存物清理慣例）。

**不動的東西：** schema.js（5 月 5 日已加四欄 optional）、viewer / reporter
manifest（這 5 條不需 override）、normalizers / computed。

**影響：**

- patterns repo push 後 OPD viewer 24 小時內透過 dist/patterns.json 自動拿到
  新 hiM/hiF 欄位；report.js valueStyle() 已是 gender-aware，直接吃。
- sibling repo (`hospital-lab-viewer` / `hospital-lab-reporter`) 應重跑
  `node sync-patterns.js` 把 5 條 entry 的 hiM/hiF 同步進 mapping.js / inline
  pattern block，再各自重新打包推送。**本輪只動 patterns repo，sync 由 Phase
  B / C 在 sibling repo 執行。**

---

## 2026-05-05 — schema 加性別感知 threshold（loM/hiM/loF/hiF, Phase 1 patterns repo）

- 作者：claude（與 YC 共同）
- 範圍：schema、catalog、runtime-snapshot
- 變更：新增 schema 欄位 + 6 條 catalog 遷移
- 測試 ID：RBC、Hb、HCT、Fe、TIBC、Ferritin

**觸發：** 使用者回報 vhyl 病人 000151649A（女）在 viewer 顯示血清鐵 58 µg/dL
被誤判過低 — Fe 的 `lo:65` 鎖在男性下限，女性正常下限是 50。盤點後共 6 個
test 有同樣男女不同 reference range 的問題（女性中段值被當成過低）：

| ID | 舊 lo/hi | 女性誤判區間 |
|---|---|---|
| Fe | 65–175 | 50 ≤ x < 65 µg/dL |
| TIBC | 134–415 | 120 ≤ x < 134 µg/dL |
| Ferritin | 21.81–274.66 | 4.63 ≤ x < 21.81 ng/mL |
| RBC | 4.2–6.2 | 3.7 ≤ x < 4.2 ×10⁶/µL |
| Hb | 14–18 | 12 ≤ x < 14 g/dL |
| HCT | 39–53 | 33 ≤ x < 39 % |

**設計（C 方案 — 混合）：**

catalog schema 新增 4 個 optional 欄位 `loM` / `hiM` / `loF` / `hiF`，只在
有男女差異的少數 test 上用。舊 `lo` / `hi` 保留，角色降為「fallback /
unknown gender」並設成最寬包絡（= `min(loM,loF), max(hiM,hiF)`），確保
unknown 性別不會被任何一邊誤判。

Resolution rule（viewer / reporter Phase 2/3 會實作）：
- entry 有 `loM/hiM/loF/hiF`（任一存在）：
  - patient.gender 已知 → 用對應性別組
  - unknown → fallback 到 `lo/hi`（wide envelope）
- entry 沒有性別欄位 → 維持現有 `lo/hi` 邏輯

**修改 patterns/schema.js：**

1. `ALLOWED_FIELDS` 加入 `loM/hiM/loF/hiF`。
2. 加 validate 規則：4 個欄位若存在必須是 number 或 null/undefined；若任一
   存在，該 entry 必須**也有** `lo/hi` 作 fallback（不然 unknown 性別會炸）。
   失敗訊息明確點出哪個 id 缺 fallback。
3. 匯出 `GENDER_THRESHOLD_FIELDS` 常數讓 sibling repo 之後若需 introspect 可用。

**修改 patterns/catalog.js（6 條 entry，欄位順序：refLo/refHi → loM/hiM/loF/hiF → lo/hi）：**

| ID | loM/hiM | loF/hiF | lo/hi (fallback wide envelope) |
|---|---|---|---|
| RBC | 4.2–6.2 | 3.7–5.5 | 3.7–6.2 |
| Hb | 14–18 | 12–16 | 12–18 |
| HCT | 39–53 | 33–47 | 33–53 |
| Fe | 65–175 | 50–170 | 50–175 |
| TIBC | 134–415 | 120–480 | 120–480 |
| Ferritin | 21.81–274.66 | 4.63–204.00 | 4.63–274.66 |

其他欄位（pattern / displayName / unit / ref / refLo / refHi / 註解）一字未動。

**驗證：**

- `npm run release` 全綠：catalog 69 · viewer manifest 54 · reporter
  manifest 37 · `dist/patterns.json` 37.0 KB 重 build 成功。新四欄位
  全部進 JSON snapshot（都是 number，不需動 reviver / serialiser）。
  `byId('Fe')` 結果含 `lo:50, hi:175, loM:65, hiM:175, loF:50, hiF:170`。
- 暫存的 `scripts/gender-threshold-spec.js` 把 TASK_BRIEF §8 全 11 條
  測試樣本灌進新 catalog（pickThresholds + classify 模擬 viewer/reporter
  端的 alarm 邏輯）：
  - Fe×5 case（含觸發 case：女性 58 → normal、男性 58 → low、unknown 58 → normal）
  - Hb×3 case（女 13 → normal、女 11 → low、男 13 → low）
  - Ferritin×3 case（男 25 → normal、女 25 → normal、女 250 → high）
  - 11 PASS · 0 FAIL；spec 檔已刪除。

**影響：**

- catalog + dist/patterns.json 異動 → sibling repo 必須重 sync：
  - viewer：`node sync-patterns.js` 重 sync mapping.js；接著 Phase 2 改
    `report.js valueStyle()` 加 gender 參數 + threshold pick 邏輯，並把
    patient gender 沿 render call chain 傳進去。viewer 對 RBC/Hb/HCT
    無 manifest override，會直接吃 catalog 新欄位。
  - reporter：`node sync-patterns.js` 重 sync inline pattern block；
    Phase 3 改 `hospital-lab-data.html` (~line 2835) alarm 計算 + 決定
    是否打開 6 條原本被 manifest `hi:null lo:null` 蓋掉的 alarm 顯示。
- OPD 端 viewer popup 透過 `dist/patterns.json` 在 24h 內自動拿到新欄位
  （pattern 已序列化），但 alarm 邏輯仍要等 viewer Phase 2 推送的
  zip 才能生效（valueStyle 還沒讀新欄位）。

**Backlog（本輪不處理，等使用者實際遇到再開新 brief）：**

- GOT、GPT、RGT、BUN、CREAT、UA 6 個 test 的 `hi` 都鎖男性、`lo:null`，
  女性中段值會漏 alarm（不是誤判）。優先級低，schema 機制相同，加
  `hiM/hiF` 即可。

---

## 2026-05-05 — vhyl 5 條 regex 放寬（HBsAg / AntiHCV / AFP / TSAT / Fe）

- 作者：claude（與 YC 共同）
- 範圍：catalog
- 變更：修改
- 測試 ID：HBsAg、AntiHCV、AFP、TSAT、Fe

**觸發：** 使用者回報 vhyl 病人 000151649A 的 HBsAg / Anti-HCV / AFP、000051055E 的 Fe
在 reporter 漏顯示。連帶發現 TSAT 舊 regex `/SAT:/` 對 vhyl 的 `TS:` label 不命中。

**根因：** vhyl lab text 把同一項目的「數值滴度行」與「定性結果行」黏在同一行
（例：`HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)`）；lab name 後固定加
`(YL)` suffix；TSAT vhyl 寫成 `TS:`。詳見 TASK_BRIEF.md。

**修改 patterns/catalog.js（只改 pattern 欄位）：**

| testId | 舊 → 新 |
|---|---|
| HBsAg | `/HBsAg(?:\(TT\))?:\s*(\S+)/` → `/HBsAg\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AntiHCV | `/(?:HCV Ab\(TT\)|Anti-HCV):\s*(\S+)/` → `/(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AFP | `/AFP:\s*([<>]?[\d.]+)/` → `/AFP\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/` |
| TSAT | `/SAT:\s*([\d.]+)/` → `/(?<![A-Za-z])(?:TSAT|TS|SAT):\s*([\d.]+)/` |
| Fe | `/FE:\s*([\d.]+)/` → `/(?:Fe|Iron)\s*(?:\((?:TT|YL)\))?:\s*([\d.]+)/i` |

設計關鍵：HBsAg / AntiHCV 的 capture 改成 `[^\s\d]\S*`，讓引擎在 `(YL):` 那行才命中，
自動跳過前面的 `0.21` / `0.12` 數值；統一支援 `(TT|YL)` 兩家醫院 + 無 suffix；
TSAT lookbehind 防 `DESAT:` 誤命中、但允許 `267.00TS:` 命中（前一字是數字）；
Fe 加 `i` flag 與 `Iron` alternation。

每個 entry 上方加註解標記 vhyl 原始樣本，便於日後追溯。

**驗證：**
- `npm run release` 全綠：catalog 69、viewer manifest 54、reporter manifest 37、
  `dist/patterns.json` 36.6 KB 重 build 成功。
- 暫存的 `scripts/regex-spot-check.js` 把 TASK_BRIEF §5 全部 18 條樣本灌進新 pattern：
  - HBsAg：4/4（含 vhyl 黏連字串 `HBsAg: 0.21HBsAg (YL): Non-Reactive ...` → `Non-Reactive`）
  - AntiHCV：3/3（含 vhyl 黏連字串）
  - AFP：3/3（`AFP(YL): < 2.00` → `< 2.00`）
  - TSAT：4/4（`267.00TS: 22` → `22`；`DESAT: 95` 正確不命中）
  - Fe：4/4（`FE: 58`、`Fe (YL): 58`、`Iron: 100` 命中；`FERRITIN: 234` 正確不命中）
  - 18 pass · 0 fail；spot-check 檔已刪除。

**影響：**
- catalog 異動 → sibling repo 必須重 sync：
  - `hospital-lab-viewer` 跑 `node sync-patterns.js` 並重新發布（OPD 端另外
    24h 內透過 `dist/patterns.json` 自動拿到最新版）。
  - `hospital-lab-reporter` 跑 `node sync-patterns.js` 並重新發布。
- 預期：reporter 重 fetch 000151649A 後，HBsAg / Anti-HCV / AFP / TSAT 都會出值。

---

## 2026-05-03 — Runtime auto-update via dist/patterns.json (v0.3)

- Author: claude (with YC)
- Goal: pattern updates propagate to OPD computers automatically — no
  per-machine action when patterns change.
- New: `dist/patterns.json` — JSON snapshot of catalog + manifests, with
  RegExp values serialised as `{__regex:[source,flags]}` and functions
  dropped. Generated by `npm run build-json` on each push.
- New: `patterns/normalizers.js` — named normaliser fns (wbcCount,
  plateletCount). Catalog entries now reference normalisers by string
  name instead of inlining functions, so the JSON snapshot can survive
  the round-trip.
- `patterns/index.js`: `resolveManifest()` now rehydrates string
  normaliser refs to functions on the way out.
- `patterns/schema.js`: validates that string normalise refs resolve.
- `scripts/validate.js`: confirms WBC/Platelet rehydration works
  (`wbc.normalize(6700) === 6.7`).
- Viewer-side companion (`hospital-lab-viewer/`):
  - `pattern-loader.js` — fetches `dist/patterns.json` from
    `raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/`,
    caches in `chrome.storage.local` with 24h TTL, rehydrates RegExp via
    JSON reviver, falls back to bundled `mapping.js` if offline.
  - `popup.html`/`popup.js`: freshness badge in header (✓/📦/⚠) shows
    cache state; click to force-refresh.
  - `sync-patterns.js`: `mapping.js` now inlines `normalizers.js` so the
    bundled fallback also rehydrates correctly.
  - `manifest.json` host_permissions already covered `https://*/*`.
- Verification: 69 catalog · 54 viewer resolved · 37 reporter resolved ·
  2 normalisers (wbcCount, plateletCount) · 1 track-only (Mg) · WBC
  normalize round-trips JSON correctly (6700 → 6.7).
- Effect for OPD deployment: maintainer pushes patterns + dist/patterns.json
  to GitHub; every Chrome popup picks up the change on next open (or
  within 24h). Re-distribution of the extension itself only required for
  code changes (rare) or when adding a new normaliser.

## 2026-05-03 — Centralised catalog + thin manifests (v0.2 architecture)

- Author: claude (with YC)
- Hospital scope: both
- Change: refactored repo from "two parallel catalogs" to "one master
  catalog + per-app manifests".
- New file: `patterns/catalog.js` — 69 unique entries, every test
  definition lives here. Universal fields only (pattern, displayName,
  unit, ref, refLo/refHi, hi/lo, qualitative, normalize, computed, etc.).
  No app-specific layout (page/col/section/cat).
- Rewritten as thin manifests:
  - `patterns/viewer.js` — 56 entries; each is `{id, page, col, section,
    ...overrides}`. Picks subset of catalog for the outpatient handout.
  - `patterns/reporter.js` — 37 entries; each is `{id, cat, label,
    ...overrides}`. Picks subset for the dialysis table view.
- `patterns/index.js` resolves each manifest against the catalog (manifest
  fields override catalog defaults). Exposes resolved `viewer` and
  `reporter` arrays so consumers see the same shape as before.
- `scripts/validate.js` updated: validates catalog + checks every manifest
  id resolves + lists "track-only" catalog ids (entries not referenced by
  any manifest — these get pattern detection but no UI rendering).
- Both apps' sync scripts rewritten to bundle catalog + manifest +
  resolver into one self-contained output:
  - `hospital-lab-viewer/mapping.js` — catalog + viewer manifest +
    resolver inlined; exposes `TEST_MAP` and `VIEWER_CATALOG`.
  - `hospital-lab-reporter/hospital-lab-data.html` — same content
    inlined between `__HOSPITAL_LAB_PATTERNS_BEGIN/END__` markers; the
    resolver produces `LAB_TESTS`, `LAB_CATEGORIES`, `COMPUTED_TESTS`.
- Verification (validate.js): 69 catalog ids, 56 viewer resolved,
  37 reporter resolved, 25 shared between manifests. WBC viewer-specific
  override (5.0–10.0) and reporter default (4.0–11.0) both verified
  via `node -e` smoke tests.
- ID renames in viewer manifest (case normalisation; safe — no code
  references): `Glucose` → `GluAC`, `HbA1C` → `HbA1c`, `NA` → `Na`,
  `FE` → `Fe`, `ALKP` → `ALP`. Reporter ids unchanged.
- "Track-only" patterns (catalog entries not in any manifest): currently
  just `Mg` (Magnesium — kept in catalog for future re-use, removed from
  viewer's nutrition column on user request earlier today). Add more by
  defining them in `catalog.js` without listing them in any manifest.
- patterns/index.js exposes `version: '0.2.0'`.

## 2026-05-03 — Viewer further trimmed: drop 腎功能（透析） section + Mg

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `BUNPre`, `BUNPost` (section `腎功能（透析）`) and `MG`
  (section `營養／電解質`) from `patterns/viewer.js`.
- Change: removed (viewer only — these entries remain in
  `patterns/reporter.js` for the dialysis project where pre/post-dialysis
  BUN drives URR).
- Rationale: outpatient handout is for general ambulatory patients, not
  dialysis; the 腎功能（透析） column is irrelevant. Magnesium pruned per
  user preference for a leaner nutrition column.
- Validation: viewer catalog 59 → 56 entries. Section `腎功能（透析）` no
  longer exists. `營養／電解質` now 7 entries: Albumin, NA, K, FreeCa, FE,
  VitB12, FolicAcid. Renal section unchanged: BUN, CREAT, UA, eGFR, UACR,
  UPCR.

## 2026-05-03 — Viewer nutrition section pruned

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `TP`, `Cl`, `Ca`, `P`, `TIBC`, `TSAT`, `Ferritin`, `iPTH`
  from `patterns/viewer.js` (section `營養／電解質`)
- Change: removed (viewer only — these entries remain in `patterns/reporter.js`
  for the dialysis project)
- Rationale: outpatient handout's nutrition column should focus on Albumin,
  electrolytes (Na/K/Mg), free Ca, iron, B12, folate. Bone-mineral metabolism
  markers (Ca/P/iPTH) and protein/iron-status panels (TP/TIBC/TSAT/Ferritin)
  belong in the dialysis catalog where they're clinically actionable.
- Validation: viewer catalog entries 67 → 59; nutrition section now contains
  exactly 8 entries: Albumin, NA, K, MG, FreeCa, FE, VitB12, FolicAcid.

## 2026-05-03 — Lifelong hepatitis markers fix (consumer-side)

- Author: claude (with YC)
- Scope: hospital-lab-viewer/popup.js (NOT this repo — fix lives in the
  consumer because it's a fetch/filter behaviour, not a pattern definition)
- Change: added `Anti-HBs` to the all-time pass-through regex in popup.js
  (previously only `HBsAg|HCV Ab|REACT:|TPHA|HIV virus load|LEU3AN`).
- Rationale: HBsAg, Anti-HBs, Anti-HCV are lifelong markers — once positive
  (or once vaccinated for Anti-HBs), they tend to remain positive. The
  outpatient handout should surface the most recent value regardless of
  the 1-year lab-window cutoff.
- Validation: lab orders containing "Anti-HBs:" in reportText now bypass the
  12-month cutoff. The corresponding viewer catalog entries (`HBsAg`, `HCV`,
  `AntiHBs`) already carry `singleValue: true`, so report.js renders only
  the most recent value.

## 2026-05-03 — Phase 1 bootstrap

- Author: claude (with YC)
- Hospital scope: both
- Initial commit. Catalogs migrated unchanged from the two consuming projects:
  - `patterns/viewer.js` — 56 entries from `hospital-lab-viewer/mapping.js`
  - `patterns/reporter.js` — 50 entries from `hospital-lab-reporter/hospital-lab-data.html`
  - `patterns/computed.js` — URR, Ca×P, eGFR (CKD-EPI 2021), GFR/UACR/UPCR
    staging, KDIGO risk, Taiwan CKD stage, Early CKD class, PSA ratio,
    HCV / HBsAg / RPR / TPHA qualitative
- Schema documented in `docs/pattern-spec.md`.
- `scripts/validate.js` confirms: no duplicate IDs within either catalog;
  every pattern compiles.
- **Known overlaps** to reconcile in phase 2 (different IDs / different
  thresholds for the same underlying test):
  - `Glucose` (viewer) ↔ `GluAC` (reporter)
  - `BUNPre` / `BUNPost` (viewer) ↔ `BUN_pre` / `BUN_post` (reporter, uses `filter`)
  - `HbA1C` (viewer) ↔ `HbA1c` (reporter)  *only case difference*
  - `HCV` computed (viewer) ↔ `AntiHCV` raw (reporter)
  - `RPR` computed (viewer) ↔ `RPR` raw (reporter)
- Reporter's `qualitative: true` flag and viewer's `singleValue: true` /
  `computed: '...'` flags express overlapping concepts — to be unified in
  phase 2.
- Both consumer projects refactored to import from this repo; their inline
  catalogs removed.

---

## Template for future entries

```markdown
## YYYY-MM-DD — Short summary

- Author: <initials>
- Hospital scope: <tt | yl | both>
- Tests: <ID(s)>
- Change: <added | updated | removed>
- Rationale: <why>
- Validation: <example raw text → captured value>
- Related commit: <git short-hash>
```
