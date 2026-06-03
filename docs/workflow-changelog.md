# Workflow / Process Changelog

> 跨 repo 工作流變動史。本檔記錄 process / SOP / 檔案結構 / repo 組織 等變動,**不**記程式碼變動(各 repo `WORKLOG.md` 負責那塊)。
>
> **Canonical 位置**:`hospital-lab-patterns/docs/workflow-changelog.md`(git authoritative;Notion 不放規則內文,只在「🛠 開機 SOP」page 加 pointer 行)
>
> **何時寫**:任何 process / SOP / 檔案結構 / repo 組織 變動,在對應 commit 內順手寫一條。最新在上。

---

## 2026-06-04 — Modes 改為 blast-radius 分工 + Notion 單向投影條款 + ECC 出處補登

**範圍**: process(Modes 分工標準 + Notion 定位)+ provenance(方法論出處回溯補登)

**動機**: 2026-06-04 Cowork 全程回顧 session 發現兩件事。(1) Modes 段寫「Cowork=思考、Claude Code=實作」,但實踐上 SOP A/C pattern learning 一直在 Cowork 改 catalog — 文件與實踐落差,邊界 case 會產生歧義。實際遵守的分工標準是**影響範圍(blast radius)**,與 PROJECT_CONTEXT § 1.5 機器分工(minor 邊界表)同邏輯。(2) 規則 #7 只定了 Notion 同步時序,沒定方向性 — 補「單向投影」條款防止未來在 Notion 端直接改狀態造成雙真相源。

**變動**(cowork-project-instructions.md,canonical 已改,**兩台 UI 待重貼,§ 1.0 paste 追蹤待重置 ⏳**):
- Modes 段改寫:Cowork 限小半徑(單 repo / 單檔 / 單 entry;SOP A/C 屬此類),commit/push 一律不在 Cowork;Claude Code 負責大半徑(跨 repo / 多檔重構 / schema / git / sync-patterns);半徑有疑義 → 規則 #12 先問
- 規則 #7 尾加:Notion 為單向投影,狀態一律先改 git 端,不一致時以 git 為 canonical

**Provenance 補登(回溯)**: YC 確認 — 2026-05 月初架構**初版 project instruction** 時,曾要 Claude 參考 **affaan-m/ECC(Everything Claude Code)**(agent harness 體系:rules / skills / memory / hooks / continuous learning)。該對話未留書面紀錄,致三 repo md 檔皆無 ECC 字樣;05-19 思考規則的紀錄來源(Karpathy + Forrest Chang 12-rule)是另一波獨立輸入。**具體從 ECC 借了哪些機制(規則檔結構?觸發語?SOP 形式?)待 YC 回憶補述。** 教案引用時,本專案方法論譜系應寫為:ECC 模板種子 → 在地化 → 踩坑演化(incident-driven)→ 蒸餾自有種子。

**Process implication**: 分工從「按性質(思考 vs 實作)」改為「按影響範圍」,與機器分工(§ 1.5)統一成同一條軸線:半徑越大 → 越靠近 vhtt + Claude Code + 人工把關。Notion 確立為 read-model,git 為唯一 write-model。

---

## 2026-05-19(addendum 3)— Glossary 區 + SOP J 重新命名「End thread」+ 思考規則 #12「混淆時詢問」

**範圍**: process(詞彙 + 觸發語 + 思考規則)

**動機**: YC 反映「session」跟「階段」在原命名下會混淆(兩者都帶「結束 / 完成」語意但層級不同)。原 SOP G 用「階段完成」、SOP J 用「結束 session」— 都掛「結束 / 完成」關鍵字 → 觸發語意外重疊。同時 YC 強調「Claude 混淆時要主動問」,值得提升為 catch-all 思考規則。

**變動**:
- **Glossary 區**(加在 PROJECT_CONTEXT § 12 頂端 + cowork-project-instructions.md Session 切換 trigger section 開頭):
  - `session / thread / 對話` = 一個 Cowork 對話視窗(三詞互通)
  - `階段 / 段落 / phase` = 工作的一個 chunk(一個 thread 可跑多個階段,一個階段也可橫跨多 thread)
  - `機器` = vhyl / vhtt 物理開發環境
- **判讀關鍵字規則**:看到「階段 / 段落 / 這段」→ G;「thread / session / 對話」→ J;「機器 / 換到」→ H;「接續 / 繼續」→ I;**都沒看到 → 含糊語強制問**
- **SOP J 重新命名「End thread」**(原「End session」)— 觸發語擴成:「結束 thread」/「結束 session」/「結束對話」/「準備開新 thread」/「準備開新 session」/「這個對話收掉」/「等等要重開對話」
- **思考規則 #12「混淆時詢問」加入 cowork-project-instructions.md**:catch-all,涵蓋 § 12 含糊語 / SOP I pre-flight / 規則 #8 沒明列的所有混淆情境
- 更新維護紀錄表加 addendum 3 列

**Process implication**: 詞彙層從「session 跟階段語意重疊」→「三層明確分開,各有判讀關鍵字」。思考規則 #12 提供 catch-all 抓未明示情境。對應 Coding behavior contract B 精神(矛盾模式不混用)— 詞彙層也適用同邏輯。

**規則總數**:強制 #1–#7 + 思考 #8–#12 + Coding contract A–C。思考規則從 4 條增為 5 條,total 12+3=15 條(若計入 contract);Forrest Chang 文章 14 條安全線屬於「單一檔案」,本系統三檔分散(Cowork instructions 12 + 三 repo CLAUDE.md 各 contract 3),單檔最高仍在 12 條內。

---

## 2026-05-19(addendum 2)— Session 切換 trigger 改成「明確語 + 含糊語 disambiguate」兩段式

**範圍**: process(觸發語表 + Claude 行為)

**動機**: YC 反映「結束 session」太模糊,可能對應 SOP G(休息)/ J(關對話)/ H(離開機器)三種不同情境;且 YC 日常更常脫口而出「結束」/「收工」/「告一段落」/「下次再說」這類自然口語,原表沒涵蓋。

**變動**:
- **明確語直接觸發**:
  - 「告一段落」/「階段完成」/「先停一下」/「休息一下」→ SOP G
  - 「離開 vhyl」/「離開 vhtt」/「換到 vhtt」/「換到 vhyl」/「換機器」→ SOP H
  - 「接續 vhtt」/「接續 vhyl」/「接續上次」/「繼續上次」→ SOP I
  - 「準備開新 session」/「等等要重開對話」→ SOP J
- **含糊語強制 disambiguate**:「結束」/「結束 session」/「結束對話」/「收工」/「下次再說」/「先這樣」/「就到這」→ Claude **不**直接動作,先問三選一(G / G+J / H)
- 更新 `PROJECT_CONTEXT.md § 12 Trigger 對照表`(分明確語 + 含糊語 disambiguation 兩段)
- 更新 `docs/cowork-project-instructions.md` Session 切換 trigger section 同步分段
- 更新維護紀錄表加 addendum 2 列

**Process implication**: 觸發語層從「猜使用者意圖」→「明確語不問、含糊語強制問」。降低 silent miss-trigger 風險(誤跑 J 浪費開新對話 / 誤跑 G 漏 handoff)。對應 Coding behavior contract B 精神(矛盾模式不混用)— 明確語跟含糊語走不同處理路徑。

---

## 2026-05-19(addendum)— SOP I pre-flight check:cross-machine resume 強制 Cowork Project Instructions 對齊

**範圍**: process(SOP I 增補 Step 0)

**動機**: YC 反映 — 切換到另一台工作環境時,容易忘記上機改了 `cowork-project-instructions.md` 而本機 Cowork app UI 仍是舊版 → Claude 在本機跑舊規則 silent drift。原本 § 1.0 paste 追蹤表只是被動標記 ⏳,需要 YC 自己注意。

**變動**:
- `PROJECT_CONTEXT.md § 12 SOP I` 加 Step 0「Pre-flight check」:讀 Notion § 1.0 paste 追蹤表本機格,若 ⏳ block 後續步驟、提示 YC 重貼後才繼續
- `PROJECT_CONTEXT.md § 12 SOP G` Step 6 加「特別檢查」:若本 session 改動 cowork-project-instructions.md 則 § 1.0 兩格(或對方那格)重置 ⏳
- `docs/cowork-project-instructions.md` Session 切換 trigger section 末尾加一行 SOP I pre-flight 註記

**Process implication**: cross-machine resume 從「被動 + 易忘」變成「主動 block」。trade-off:多一個 confirmation round,但杜絕 silent drift。

---

## 2026-05-19 — Session 切換 SOPs G–J + session-state 機制 + workflow-changelog 本檔誕生

**範圍**: process(非 catalog / 非 code)

**動機**: cross-session / cross-machine 切換時,Claude 沒有「最後狀態」可讀,常會不知道使用者上一步做什麼。Notion + WORKLOG + briefs 雖各自完整,但碎片化,沒單一 entry-point 接續。

**變動**:
1. `PROJECT_CONTEXT.md` 加 § 12「Session 切換 SOPs」(4 條 + snapshot 檔結構 + 容量考量)
2. `PROJECT_CONTEXT.md` 加 § 13「Cowork ↔ Chat mode handoff」(機制說明,非 SOP)
3. 新檔:`docs/session-state-vhyl.md` + `docs/session-state-vhtt.md`(每機一份 current snapshot,wrap 時 overwrite)
4. 新檔夾:`docs/session-state-archive/`(加 .gitkeep)wrap 時把舊 current 搬進來,檔名格式 `YYYY-MM-DDTHHMM-<machine>.md`
5. `docs/cowork-project-instructions.md` 加「Session 切換 trigger」section(類似 Pattern-learning trigger 區塊)
6. 本檔(workflow-changelog.md)誕生

**Trigger 對照**:
- 「階段完成」→ SOP G(Wrap)
- 「離開 vhyl」/「離開 vhtt」→ SOP H(Leave machine)
- 「接續 vhyl」/「接續 vhtt」/「接續上次」→ SOP I(Resume)
- 「結束 session」→ SOP J(End session)

**Notion 同步**: push 後在主入口 page「🛠 開機 SOP」頁首 pointer 行加上本檔路徑

**未做(後續評估)**:
- `session-state-archive/` 自動歸檔策略(超過 50 檔或 90 天時打包) — 等實際用一陣子看頻率再定
- 兩台機器 Cowork app UI 重貼 Project Instructions(YC 端手動,工作流 SOP 改動會觸發 § 1.0 paste 追蹤重置為 ⏳)

---

## 2026-05-19 — Brief 集中:reporter / viewer 4 條歷史 brief 搬至 patterns/docs/task-briefs/

**範圍**: process / 檔案結構

**動機**: reporter / viewer `.gitignore: TASK_BRIEF*.md`(line 25)→ 該 4 條 brief 從未進 git → 兩台機本機版本可能 drift。

**變動**:
- 4 條 brief 改名(加 `<repo>_` 前綴 + descriptive 敘述)搬至 patterns/docs/task-briefs/
- step2(原無 `_done`)YC 2026-05-19 確認當 Done,加 `_done` 後綴
- 對應表見 patterns WORKLOG 2026-05-19 同日條目

**Process implication**: 確立 `TASK_BRIEF*.md` canonical 位置是 `hospital-lab-patterns/docs/task-briefs/`;reporter / viewer 兩 repo 的 .gitignore 規則維持(防誤放本機 draft 進 git),所有 brief 統一寫到 patterns 端。

---

## 2026-05-19 — Behavior rules 三塊化:強制規則 #1–#7 + 思考規則 #8–#11 + Coding behavior contract A–C

**範圍**: process / 行為規則 source 整理

**動機**: 套用 Karpathy / Forrest Chang 12-rule CLAUDE.md([blocktempo 2026-05-14](https://www.blocktempo.com/claude-code-12-rules-error-rate-3-percent-karpathy-agent/))對應本專案踩過坑的條目,但分清 Cowork(思考)/ Claude Code(寫程式)兩端落點,避免規則 200 行 / 14 條遵守率懸崖。

**變動**:
- Cowork project instructions 加思考規則 #8–#11(暴露假設 / 成功標準 / 複述狀態 / 靜默失敗明示)
- 三個 repo CLAUDE.md 各加 § Coding behavior contract A–C(外科修改 / 矛盾模式不混用 / 新增前讀 caller)
- PROJECT_CONTEXT.md 加 § 11「Behavior rules sources」,含篩選矩陣

**Process implication**: 行為規則三塊 canonical 位置;Notion 不放規則內文(避免多源 drift),只在主入口 page 頁首加 pointer 行。

---

## 2026-05-12 — Notion 同步機制 established(PROJECT_CONTEXT § 10)

**範圍**: process / cross-machine coordination

**Process implication**: Notion「🛠 開機 SOP」page 為 cross-machine TODO 入口;不取代 git canonical 地位;TASK_BRIEF Dashboard 為 inline database,只記列表 + 狀態。Sync 時序:git push 成功之後才寫 Notion;Notion 寫失敗不擋 push,但須在回應內明示「Notion 沒更到」。

---

## 2026-05-10 — vhyl 從 Dropbox 路徑搬出對齊 D:\self\hospital-lab\

**範圍**: process / workspace 結構

**Process implication**: 兩台機器(vhyl / vhtt)workspace root 統一為 `D:\self\hospital-lab\`;純 git 同步,不再走 Dropbox。

---
