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

### **★ 下個 thread 優先任務:viewer 看診序號 brief 撰寫 + 實作**

**狀態**: YC 已釐清所有 spec 細節(2026-05-19 vhyl thread),brief 檔尚未寫。下個 thread 直接寫 `patterns/docs/task-briefs/TASK_BRIEF_viewer_visit_serial.md` + 開始實作。

**已釐清細節(不必再問 YC)**:

1. **觸發場景**:只在現有 **Tabular paste**(tab-separated,從 Excel 貼)模式下產生看診序號。Free-form paste(逗號 / 分號 / pipe / 空白 分隔)跟單一 chartno 模式**不**處理看診序號 → 報表不顯示 overlay。
2. **看診序號從哪抓**:Tabular paste 每行 tab 分欄,**col 1(index 0)= 看診序號**,**col 5(index 4)= chartno**(現有邏輯)。YC 會自己修改貼上格式,讓 col 1 是序號。
3. **看診序號要印在哪**:每份報表(一個病人對應 page 1 + page 2 兩頁)**右上角**用 CSS absolute positioning 做 **top-layer 大字 overlay**。
4. **設計限制**:**不影響現有 4-column 2-page layout** — overlay 用 absolute position,wrap container 必要時改 `position: relative`。
5. **Multi-patient batch print**:每位病人的兩頁都印自己對應的序號(不會張冠李戴);無序號的病人不印 overlay。
6. **B&W / 彩色列印兩種模式都要顯示** overlay。

**Implementation 範圍(viewer repo)**:
- `popup.js splitChartInput()`:tabular path 多回傳 col 1 → tokens 從 `[chartno]` 改成 `[{chartno, visitSerial}]` 結構;其他兩條 paste path 維持原樣 → `visitSerial = null`
- `popup.js` 下游處理(loadData / fetchAndStore call site):把 `visitSerial` 傳到 report.js
- `report.js generatePatientPages(patientInfo, ...)`:`patientInfo` 加 `visitSerial` 欄位;若有值,page 1 + page 2 都 render 一個 `.visit-serial-overlay` div
- CSS(report.js 內 inline style):`.visit-serial-overlay { position:absolute; top:5mm; right:5mm; font-size:48pt; font-weight:bold; z-index:1000; ... }` — 重點:`@media print` 規則內也要保留(列印時不被印表機 margin 切掉、不被 layout 推開)

**測試清單(brief 內必寫)**:
1. 表格貼 3 個病人(col 1 = 1/2/3,col 5 = 三個 chartno)→ 列印 6 頁,各對應右上角顯示 1/2/3
2. Free-form 貼 `000017679E, 000023456X` → 列印 → **沒有** overlay
3. 單個 chartno 貼 → 同 (2),無 overlay
4. Batch print 多病人時序號不錯位
5. 彩色 + B&W 兩 mode 都驗 overlay 字顯示正確
6. PDF preview / 實機印表機列印各驗一次,字不被切、不影響原 layout
7. WORKLOG.md(viewer)加一條繁中

**brief 寫完後 Notion Dashboard 加列**:Status=Open / Repo=viewer / Effort=half-day(估計)/ Order=插隊到 reporter #3 之前(因為 YC 拍板 viewer 兩條優先,Reporter 兩條順延 — 可能 Order=3 然後 reporter 兩條變 4/5,或新編號方案,下個 thread 跟 YC 確認)/ Notes 簡述「右上角看診序號 overlay,tabular paste col 1 抓」

**Brief 寫作模式**:Cowork(brief 是文件 + 思考)。實作模式:可以直接在 Cowork 動 viewer 三個檔(popup.js / report.js + CSS inline),也可開 Claude Code session(多檔友善)。YC 之前說 vhyl 端可做 → Cowork 應該夠。

---

### **次要 / parked(下個 thread 不一定要動)**:

- **viewer 簡化版衛教格式 brief**:YC 提及要「不同紙張 / 版面」,具體 spec 還沒給 — 等 YC 主動提才開始寫
- **reporter #3(labs_<group> → IndexedDB)/ reporter #4(CKD eGFR/GFRStage/KDIGORisk/TaiwanCKD dispatcher)**:都還 Open。按 Order 4 依賴 3。reporter 這兩條 brief 自己標「適合 vhtt session 接掉」 → vhtt 端優先,vhyl 端不主動接

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
