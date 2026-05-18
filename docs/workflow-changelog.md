# Workflow / Process Changelog

> 跨 repo 工作流變動史。本檔記錄 process / SOP / 檔案結構 / repo 組織 等變動,**不**記程式碼變動(各 repo `WORKLOG.md` 負責那塊)。
>
> **Canonical 位置**:`hospital-lab-patterns/docs/workflow-changelog.md`(git authoritative;Notion 不放規則內文,只在「🛠 開機 SOP」page 加 pointer 行)
>
> **何時寫**:任何 process / SOP / 檔案結構 / repo 組織 變動,在對應 commit 內順手寫一條。最新在上。

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
