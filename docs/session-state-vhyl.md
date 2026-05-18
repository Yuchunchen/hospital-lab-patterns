# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread / session / 對話」/ 透過含糊語 disambiguate 進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續 vhyl(「接續上次」)或在 vhtt 接續 vhyl(「接續 vhyl」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。
> 詞彙明確化(2026-05-19 addendum 3):session / thread / 對話 互通;階段 / 段落 = 工作 chunk;機器 = 物理環境。

---

**Last wrap**: 2026-05-19(Taiwan;含 addendum 3 詞彙明確化 + 思考規則 #12)
**Last session type**: Cowork
**Last action**: SOP J — End thread,結束本 Cowork 對話 thread。整個 thread 重點:規則修訂 + 4 條歷史 brief 集中 + Session 切換 SOPs 建立 + 三次 addendum(pre-flight check / 觸發語兩段式 / Glossary + 思考規則 #12)

## 1. 本 thread 完成

完整工作量超過 8 個 commit cycle,分四大階段:

**A. 規則修訂(Karpathy/Forrest Chang 12-rule 篩選版)**
- Cowork project instructions 加思考規則 #8–#12(暴露假設 / 成功標準 / 複述狀態 / 靜默失敗明示 / **混淆時詢問**)
- 三個 repo CLAUDE.md 加 § Coding behavior contract A–C(外科修改 / 矛盾模式不混用 / 新增前讀 caller)
- PROJECT_CONTEXT.md 加 § 11「Behavior rules sources」含篩選矩陣
- 三 repo 一起 commit + push

**B. Notion Dashboard 補記**
- 補進 5/13 兩條 Done brief(Order 11 FreePSA orderNameFilter / Order 12 UACR+RATIO alternation)
- 頁首加 Behavior rules canonical pointer + 後續再擴充
- § 1.0 paste 追蹤兩格皆為 ⏳

**C. Brief 集中歸位**
- 4 條歷史 brief(reporter step1/step1v3/step2 + viewer 肝炎)從各自 repo root 搬至 `patterns/docs/task-briefs/`
- 加 `<repo>_` 前綴 + descriptive 命名
- step2 補加 `_done` 後綴(YC 確認當完成)
- 三 repo 各加 WORKLOG

**D. Session 切換 SOPs 建立(本 thread 最重要的 meta 產出)**
- 加 SOP G(Wrap 段落收尾)/ H(Leave machine)/ I(Resume)/ J(**End thread**)
- 新檔:`docs/session-state-vhyl.md` / `session-state-vhtt.md` / `session-state-archive/.gitkeep` / `workflow-changelog.md`
- PROJECT_CONTEXT.md 加 § 12「Session 切換 SOPs」+ § 13「Cowork ↔ Chat handoff」
- Cowork project instructions 加「Session 切換 trigger」section
- Notion 頁首 pointer 擴充涵蓋全部 canonical 檔
- **Addendum 1**:SOP I 加 Step 0 pre-flight check(cross-machine resume 強制 Project Instructions 對齊)
- **Addendum 2**:觸發語改成「明確語 + 含糊語 disambiguate」兩段式
- **Addendum 3**:Glossary 區明確化 session/thread/對話 互通 vs 階段/段落 vs 機器 三層詞彙;SOP J 改名「End thread」;思考規則 #12「混淆時詢問」catch-all

## 2. 本 thread 未完

(無)

## 3. 下次該先做什麼

**最可能的下一步**:
- **viewer 看診序號 brief**:已釐清細節(tabular paste col 1 = 看診序號;右上角 top-layer 大字 overlay;不影響現有 4-col layout);brief 還沒寫 → 寫進 `patterns/docs/task-briefs/TASK_BRIEF_viewer_visit_serial.md` Order TBD
- **viewer 簡化版衛教格式 brief**:YC 提及要「不同紙張 / 版面」,具體 spec 還沒給 — 等 YC 提才寫
- **reporter #3(labs_<group> → IndexedDB)/ reporter #4(CKD eGFR/GFRStage/KDIGORisk/TaiwanCKD dispatcher)**:都還 Open。按 Order 4 依賴 3。reporter 這兩條 brief 自己標「適合 vhtt session 接掉」,所以 vhtt 端優先

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Order | Brief | Repo | Status |
|---|---|---|---|
| 3 | labs_<group> storage → IndexedDB | reporter | Open |
| 4 | CKD eGFR / GFRStage / KDIGORisk / TaiwanCKD dispatcher | reporter | Open(depends on Order 3)|
| — | viewer 看診序號(brief 未寫) | viewer | (parked,可優先,vhyl 端可做) |
| — | viewer 簡化版衛教格式(brief 未寫) | viewer | (parked,等 YC spec) |

## 5. Parked questions

**長期 parked**:
- **vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\`** — 路徑是什麼?是哪種 CLAUDE.md(workspace-level / user-level / 其他 Claude 工具的)?跟本專案規則會不會相互蓋掉?next thread resume 時 YC 可提供細節
- **YC 提及「我有修改 project instruction, claude.md」** — 是 vhyl 端改的還是 vhtt 端?Cowork app UI 改的還是 git canonical 改的?具體改了什麼規則?

**本 thread 新出現 parked(SOP G Step 4 殘留檢查)**:
- patterns / reporter 兩 repo 有 6 個遺留 `.tmp.NNNN.NNNN` 檔(Unix ms timestamp 解出來是 2026-04-28 附近,不是本 thread 產的),清單:
  - `patterns/docs/learning-workflow.md.tmp.18320.1777808890935`
  - `patterns/docs/pattern-spec.md.tmp.18320.1777808860084`
  - `patterns/package.json.tmp.18320.1777808539576`
  - `patterns/patterns/computed.js.tmp.18320.1777808786720`
  - `patterns/patterns/reporter.js.tmp.18320.1777808743731`
  - `reporter/CLAUDE.md.tmp.22252.1777811429920`
  - 看起來是過去 Claude Code session 原子寫入沒清乾淨。下次 thread 開始時建議檢查 `.gitignore` 是否含 `.tmp.*`(若有 → 安全刪除;若無 → 個別 check 是否還在用)

**Cowork UI paste 兩台都 ⏳**:
- 本 thread 改了 `cowork-project-instructions.md` 三次(思考規則 #8–#11 / Session 切換 trigger / addendum 1 SOP I pre-flight / addendum 2 觸發語兩段式 / addendum 3 Glossary + 思考規則 #12 + SOP J 改名)
- Notion § 1.0 表 vhyl + vhtt 兩格都 ⏳
- 下次任何一台 boot 開新 thread,SOP I 的 Step 0 pre-flight 會 block 流程 → 提示先貼新版 Project Instructions 才能繼續
