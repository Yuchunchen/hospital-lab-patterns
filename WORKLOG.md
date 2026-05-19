# WORKLOG

Chronological log of pattern catalog changes. Newest entries on top.

---

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
