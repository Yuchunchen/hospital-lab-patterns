# Session state — vhtt

> 每次在 vhtt 觸發「階段完成」/「離開 vhtt」/「結束 session」時 overwrite 本檔。
> 在 vhtt 開新 session 接續 vhtt(「接續上次」)或在 vhyl 接續 vhtt(「接續 vhtt」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-05-22 12:26(台北時間 / SOP H + SOP J)
**Last session type**: Cowork(SOP I 接續 2026-05-21 vhtt CKD/DM Dashboard S3;S3 brief 重寫 + LDCT 子頁面 read-only debug + Order 2.9 imaging cleaning brief)+ Claude Code(S3 + Order 2.9 兩輪實作)
**Last action**: Order 2.9 imaging cleaning Claude Code 一輪做完 push → Notion 2.9 row Done(id `3684b464-2c99-819b-...`)→ 本 wrap

## 1. 本 session 完成

本 thread 從 SOP I 接續 2026-05-21 vhtt CKD/DM Dashboard S3 起,land 兩條工作線:**S3(Order 2.8)+ Order 2.9 imaging cleaning**。

(a) **SOP I pre-flight ✅** — Notion § 1.0 vhtt 顯示 2026-05-20 paste,已對齊。§ 1.1 sandbox 三 repo 同 origin/main(實機應同;sandbox `M docs/session-state-vhtt.md` 是鏡像 truncate 殘留,實機 git tracked = commit `862e1af` 完整版)

(b) **S3 brief 重寫(Cowork)** — 原 S3「CSV + 批列印 + Tab 1 收案按鈕」改為 **read-only 篩檢**:
- § 設計總覽加 2026-05-22 修訂 banner
- § S3 整段重寫:Dashboard 四欄並排(DM 衛教內容 / DM 天數 / Early CKD / Pre-ESRD)取代 S2 既有 Early-CKD / Pre-ESRD 單欄
- DM 天數欄:固定「N 天」整數,>180 橘 / >365 紅;與 DM 衛教內容欄連動(「有內容」判定 = 此次問題 OR 衛教項目任一非空;往前最多看 5 筆跳過空的)
- DM 衛教欄拆 truncate+tooltip → 表格內直接完整兩行顯示
- Early CKD / Pre-ESRD 沿用 `EarlyCKD` computed(Pre-ESRD 不收緊到 <30,parked)
- CSV UTF-8 BOM;批次列印篩選後可見列;不做 registry write / Tab 1 收案按鈕 / DM-CKD-PreESRD stage 引擎
- 新增 § Follow-up 9 項(跨 repo 共享 registry DB blocker / DM stage 引擎 spec(A-B 兩層 + 84 天 + 365/4 上限 + P1407/8/9)/ Early CKD + Pre-ESRD stage 引擎 spec / 每階段檢查 checklist 自動提示 / 收案按鈕 / 糖網標示 / Pre-ESRD 門檻 <30 / registry source of truth / DM+CKD 同時符合 UX)
- brief 從 untracked 進 git(修正上 thread silent miss)

(c) **S3 Claude Code 實作 + push** — node harness 26/26 PASS;registry UI 拆除(brief 寫「保留 store 不接 UI」,Claude Code 額外拆 UI 按鈕 — **YC confirm OK**);跨 repo 不動 catalog 不需 sync-patterns。Commit `e5803da` brief 改名 _done + WORKLOG

(d) **000034324I LDCT debug(Cowork, read-only)** — YC 回報 vhtt popup 主視窗 LDCT 報告查詢只顯示 letterhead:
- patterns catalog LDCT pattern `/Low\s+Dose\s+Chest\s+CT/i` 確實 match `PE Low Dose Chest CT`,不是 pattern 問題
- popup 主視窗 `popup.js renderSection` 用 `o.reportText`(`lab-core.js parseOrdersPage` 抓 master orders page `row.cells[2].textContent`),**不 fetch 子頁面、不做 cleaning**;cxr.html 健檢視窗才走 cxr.js + cxrCleanReportText
- YC console evidence:master page `bodyLen 9443 vs innerText 1700` 落差 + `hasReportContentLabel: true` + `hasImpressionLabel: true` → body 已在 master page hidden 區段;YC 進一步貼 LDCT cell[2] 完整內容含「報告內容:...A 6mm subpleural nodule over RUL...Impression: 1...2...」
- YC 進一步驗:ernode 正式報告 navigate page **反為空殼**(只 letterhead+header 沒 body)→ fix 不 fetch 子頁面,只需對既有 reportText 套 cleaning
- 同 bug:CAC / Bone density(YC 確認 vhtt 000058895E 三筆都同)
- 關鍵 phrasing 進 brief:不要寫成「從 hidden 抓」(cells[2].textContent 既有就把 hidden+visible 全部 concat,fix 是對既抓到字串套 cleaning)

(e) **Order 2.9 brief 寫(Cowork)** — `TASK_BRIEF_imaging_report_cleaning_share.md`:
- 抽 cxr.js 三層 cleaning(「報告內容:」分隔線主路徑 + header rows strip 備援 + 通用清理:box字元/協議括號/檢查項目碼行)成共用 `cleanImagingReport(rawText)` 放 lab-core.js
- popup.js renderSection 對 imaging row render 層套用
- cxr.js refactor 改 call 同一份(行為一致)
- 驗證 chartno:000034324I + 000058895E
- Scope guard:不 fetch 子頁面 / 不對 lab orders 套 / 不改 parseOrdersPage
- 預估 1–2 小時

(f) **Order 2.9 Claude Code 實作 + push** — viewer + brief 改名 _done;`node --check` 三檔 OK + vm-load node harness 17/17 PASS(LDCT 主路徑 body 斷言、BMD 備援、稽核 layer、邊界)。Commit `d88d03b`(brief)+ `eb0ba3f`(brief 歸檔 _done + WORKLOG)

(g) **Notion 同步**:
- 2.8 row 新建 Done(id `3684b464-2c99-81eb-8ef4-c38e4a8cc40e`,Order 2.8,Repo viewer,Effort half-day,Brief path 指 `_done.md`);Notes 含 registry UI 拆除 = YC confirm OK + 實機驗證 deferred
- 2.9 row 新建 Open → 同日改 Done(id `3684b464-2c99-819b-a1c3-cbe1adae5242`,Order 2.9,Repo viewer,Effort half-day,Brief path 指 `_done.md`);Notes 含 root cause + fix + 驗證 chartno + 實機驗證 deferred

## 2. 本 thread 未完

**無工作未完** — S3 + Order 2.9 兩條工作線完整 land,Notion 兩 row 都 Done。

唯一 outstanding(本 wrap 動作本身待 commit + push):
- `docs/session-state-vhtt.md`(本檔,本次 wrap 新寫 overwrite)
- `docs/session-state-archive/2026-05-22T1226-vhtt.md`(archive,本次 wrap 新加)
- patterns `WORKLOG.md`(SOP J wrap 條目,本次 wrap 新加)

要進下一個 commit。指令見本檔末尾 SOP J 收尾步驟(給 YC 在 vhtt PowerShell 跑)。

無 cross-machine handoff brief(對方 vhyl 接這條只需讀本檔 + Notion 開機 SOP 即可,無 in-progress 工作線交接)。

## 3. 下次該先做什麼

### 沒有明確接續工作 — 下次任一機 session 開場可選

優先序由高到低(YC 拍板):

1. **S3 + Order 2.9 實機驗證**(兩條 deferred):
   - reload extension(`chrome://extensions/` 重新載入未封裝)
   - S3:列印 A4 預覽 + Tab 1 dialysis regression + S2 候診/手動/batch/排序篩選 regression
   - Order 2.9:vhtt 000034324I + 000058895E LDCT/CAC/Bone density popup 顯示 body 驗證 + cxr.html 健檢視窗 refactor 無 regression
   - 跑完 → Notion 2.8 + 2.9 row Notes 加「實機 happy-path OK」
2. **Reporter Order 3 — labs_<group> storage → IndexedDB**:parked 已久,self-tag 適合 vhtt(已切到 vhtt 但連續被 CXR + CKD/DM 線插隊兩次)
3. **CKD/DM Dashboard Follow-up #1 跨 repo 共享 registry DB 設計討論**:解這條才能解 #2–9(stage 引擎、收案按鈕、糖網標示等)。技術路線待 YC 拍板(中央 registry API / 本地 JSON sync / 雲端後端 / 個管師人工貼上)
4. YC 提別的方向

### 下個 thread 開場句範例(SOP J Step 2)

> 接續 2026-05-22 vhtt 兩條工作線(CKD/DM Dashboard S3 + popup imaging cleaning)。請讀 `patterns/docs/session-state-vhtt.md` + Notion 開機 SOP 後,告訴我下一步該做什麼。

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Title | Status | Order | 備註 |
|---|---|---|---|
| **Viewer CKD/DM 篩檢 Dashboard S3(read-only)** | **Done(2026-05-22)** | 2.8 | 本 thread land;registry UI 拆除 YC confirm OK;實機驗證 deferred |
| **Viewer popup imaging report 套 cleaning(共用 cxr.js)** | **Done(2026-05-22)** | 2.9 | 本 thread land;node harness 17/17 PASS;實機驗證 deferred |
| 健檢報告批次翻譯(CXR/BMD/CAC/LDCT) | Done(2026-05-21) | 2.7 | parent brief,上 thread 歸檔 |
| 健檢 CXR S2/S3 polish | Done(2026-05-21) | — | sub-brief,上 thread Claude Code 歸檔 |
| Viewer A5 landscape 單表版型 (v1.4.0) | Done | 2.6 | 前 thread |
| Reporter Order 3 — `labs_<group>` storage → IndexedDB | Open | 3 | parked,self-tag 適合 vhtt(連續被 CXR / CKD-DM 線插隊) |
| Reporter Order 4 — CKD eGFR/GFRStage/KDIGORisk/TaiwanCKD dispatcher | Open(depends on Order 3) | 4 | parked |
| viewer 簡化版衛教格式 | parked | — | A5 layout(v1.4.0)已部分滿足,等 YC 評估是否還要寫 brief |

## 5. Parked questions

### 本 thread 新產生(都非 blocking)

- **S3 實機驗證 deferred**:列印 A4 預覽 / Tab 1 dialysis regression / S2 各功能 regression(候診清單 / 手動輸入 / batch fetch / 排序 / 篩選)— YC 2026-05-22 決定下次測試。完成後 Notion 2.8 row Notes 加「實機 happy-path OK」
- **Order 2.9 實機驗證 deferred**:vhtt 000034324I + 000058895E 三筆 imaging(LDCT / CAC / Bone density)popup 顯示 body + cxr.html 健檢視窗 refactor 無 regression — YC 2026-05-22 決定下次測試。完成後 Notion 2.9 row Notes 加「實機 happy-path OK」
- **CKD/DM Dashboard § Follow-up 9 項**:跨 repo 共享 registry DB(blocker for #2–9)/ DM stage 引擎(A-B 兩層 + 84 天 + 365/4 上限 + P1407/8/9)/ Early CKD + Pre-ESRD stage 引擎(spec 待 YC 補,可能不同階段集合與申報代碼)/ 每階段檢查 checklist 自動提示 / 收案按鈕(語意依跨 repo DB 路線)/ 糖網標示(判定來源待 YC)/ Pre-ESRD 門檻收緊 <30(KDIGO Stage 3b–5)/ registry source of truth 確認(健保署 VPN / 中榮 HIS / 院內 web app)/ DM+Early CKD 同時符合 UX。**全部 parked,等 #1 跨 repo DB 設計拍板才能往下**

### 長期 parked(從前 thread 帶來,仍未解)

- **vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\`** — 路徑、用途、是否與本專案規則衝突,未釐清
- **YC 提過「修改 project instruction, claude.md」** — 是 vhyl 還 vhtt?是 Cowork app UI 還 git canonical?具體改了什麼,未釐清
- ernode birthDate → DM Education 子頁面有 `出生日期`,可順便升級 eGFR(carry from vhtt 前 thread)
- vhyl 的 ABI / PVR / BMD / CAC / LDCT order name 未實測(只在 vhtt 確認 `PE *` 前綴)
- reporter `file://` origin sub-page fetch CORS blocked(未來新 test 可能觸發)
- B&W 老印表機 dither(#AAAAAA)風險(未換印表機驗證 A5 layout)
- viewer CLAUDE.md zip include-list 過時(沒列 cxr.js / llm-translate.js / cxr.html / lab-core.js / dashboard.js / dashboard.html)— 不影響 vhtt 自身 reload 本地 source;若 vhyl 要 sync 才要更新清單 + 重打包
- **Cowork memory 系統寫不進**(carry from 上 thread):memory dir 屬 app-internal,Write tool 回 outside connected folders。下次踩同樣 sandbox vs 實機鏡像問題時要花時間重新判讀

### 本 thread 學到(給未來 self)

- **read-only debug 階段不動 code 是對的**:Claude Code S3 跑時 YC 提 LDCT bug,本 Cowork thread 只 read-only diagnose / 寫 brief / 給 console 指令;沒去碰 viewer 避免衝突。等 Claude Code 完成 S3 + push 後才動 Order 2.9。乾淨無 race condition
- **沒實機 fetch 能力時,console evidence 蒐集要逐步推**:本 thread LDCT debug 跑 3 輪 console:(1) master page bodyLen vs innerText 落差(2) `hasReportContentLabel / hasImpressionLabel`(3) ernode 正式報告 navigate 路徑驗證。最後 YC 自己貼 cell[2] 完整內容 + 確認 navigate page 反為空殼,root cause + fix 同時定案。逐步推比一次給大指令好
- **Brief 寫「不做的事」比「要做的事」重要**:S3 brief 加 § 「S3 不做的事」(7 條明示)+ § Follow-up(9 項 parked),Claude Code 完全遵守。Order 2.9 brief 加「關鍵 phrasing 提醒」(不要寫成『從 hidden 抓』)+ scope guard 5 條,Claude Code 也完全遵守。下次 brief 都該寫這兩段
- **YC confirm 不對稱的快慢**:brief sketch 通常 YC 一句話拍板(「Order 2.8 ok」/「OK 開始 Claude Code」)很快。但 spec ambiguity 必須先用 AskUserQuestion tappable 確認,直接寫進 brief 反而會被改 — 例如 DM 衛教欄位處置 YC 選「原欄位不要 truncate+tooltip + 新增一欄」,我若直接猜「取代」就會做錯
- **sandbox vs 實機鏡像 lesson 仍 carry**:本 thread 多次踩到 sandbox bash `git status` 顯示 dirty 但實機乾淨(viewer M WORKLOG.md / cxr.html / cxr.js;patterns session-state-vhtt.md 後段 truncate)。處理方式:從實機角度判讀(YC PowerShell 結果為準),sandbox 看到 dirty 直接 disclose 給 YC 但不阻擋動作
