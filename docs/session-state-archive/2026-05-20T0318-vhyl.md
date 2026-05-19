# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread / session / 對話」/ 透過含糊語 disambiguate 進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續 vhyl(「接續上次」)或在 vhtt 接續 vhyl(「接續 vhyl」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。
> 詞彙明確化(2026-05-19 addendum 3):session / thread / 對話 互通;階段 / 段落 = 工作 chunk;機器 = 物理環境。

---

**Last wrap**: 2026-05-20 01:21(Taiwan)
**Last session type**: Cowork
**Last action**: SOP J — End thread。整個 thread 重點:viewer 看診序號 overlay brief 撰寫 + 實作 + 驗收 + 兩 repo push + Notion 同步 一氣呵成

## 1. 本 thread 完成

工作量約 5 個 commit cycle,單一目標 = viewer 看診序號 overlay(v1.3.0)。

**A. SOP I resume**
- Pre-flight check § 1.0 paste 追蹤(vhyl ✅ up to date,無 block)
- § 1.1 環境 sync 三 repo Already up to date(YC 在 PowerShell 跑;sandbox 不能 git on Windows mount,踩到一次留下 stale lock 教訓 → 已存 memory)
- 讀上 thread session-state-vhyl.md 取斷點

**B. 殘留物清理(SOP G Step 4 順手解決上 thread parked)**
- 6 個 stale `.tmp.NNNN.NNNN` 檔(2026-04-28 timestamp,舊 Claude Code atomic-write 沒清)全部驗證為 stale 後刪除
- 三 repo `.gitignore` 都已含 `*.tmp.*`,本來就 untracked,清完不需 commit
- 上 thread parked 解 1 條

**C. Brief 撰寫 + 改名一輪做掉**
- 新檔:`docs/task-briefs/TASK_BRIEF_viewer_visit_serial_done.md`(直接以 `_done` 進 git)
- 規則 #9 結構:1 問題 / 2 設計 / 3 改動範圍 / 4 測試清單 13 case / 5 實作步驟 / 6 跨 repo 副作用 / 7 風險 / 8 WORKLOG 模板 / 9 工時
- 寫之前讀過 popup.js / report.js / manifest.json / WORKLOG.md 實證,brief 帶實際 line number 而非憑空
- mockup 給 YC 預覽兩次(黑色 48pt → 淺灰 #AAAAAA),pin 字級 / 顏色 / 邊界 case

**D. 實作 (viewer repo 4 檔)**
- `popup.js splitChartInput()`:回傳結構 `string[]` → `Array<{chartno, visitSerial}>`(breaking change)
- `popup.js` 4 個 call site(handlePrint single + multi、updateHint、doSearch + firstToken)全部對齊讀 `.chartno`
  - **漏網之魚自己捕**:line 799 firstToken 直接傳 loadData,sweep 時抓到並修
- `report.js generatePatientPages`:patientInfo destructure 加 `visitSerial = null`,page 1 + page 2 共用 visitSerialOverlay 字串
- `report.js REPORT_CSS`:`.page` 加 `position: relative`,新增 `.visit-serial-overlay`(48pt #AAAAAA 淺灰 absolute 右上角)+ `@media print` block
- `manifest.json`:1.2.0 → 1.3.0

**E. 驗收 + Push + Notion 同步**
- YC side-load Chrome → 跑 § 4 測試 13 case → 回報「測試結果 ok」全綠
- viewer commit `91634da` feat(report): tabular paste 看診序號右上角 overlay (v1.3.0)
- patterns commit `c868b3d` docs(brief): TASK_BRIEF_viewer_visit_serial 完成歸檔
- 兩 repo push origin main,驗證 `Already up to date` + working tree clean
- Notion Dashboard 加 Done 條目:Order 2.5、Repo viewer、Effort half-day、Done date 2026-05-20

**F. WORKLOG**
- viewer WORKLOG:詳細實作條目(改動清單 + spec 邊界 + 測試 pointer)
- patterns WORKLOG:pointer 條目(本 repo catalog 無動,viewer/reporter 不需 sync-patterns)— SOP J wrap 時補

## 2. 本 thread 未完

(無 — viewer overlay 已完整 ship)

## 3. 下次該先做什麼

### **★ 沒有 hard-pinned 優先項**

上 thread 的優先項(viewer 看診序號)已完成。下個 thread 由 YC 決定走向。預期幾條路線:

**(a) 接 reporter #3 / #4(self-tagged「適合 vhtt」)**
- Order 3:reporter labs_<group> storage → IndexedDB(localStorage QuotaExceededError 已知問題)
- Order 4:reporter CKD eGFR/GFRStage/KDIGORisk/TaiwanCKD dispatcher(depends 3)
- 兩條都標「適合 vhtt session 接」(多檔重構,Claude Code 友善)→ 若 YC 切到 vhtt 就接;**vhyl 端不主動接**

**(b) viewer 簡化版衛教格式 brief(等 YC 主動給 spec)**
- 上上 thread 提及「不同紙張 / 版面」需求,spec 未細化 → 等 YC 主動帶
- vhyl 端可做

**(c) 其他 OPD-driven 新需求**
- 雖然 viewer 1.3.0 剛上,但實際門診用了可能會冒出新需求(B&W 印 #AAAAAA dither 糊?序號位置要再調?)→ 收到回報再啟動

### Brief 集中慣例(parked from 本 thread,值得未來重議)

本 thread 中途 YC 問「為什麼要動到 lab pattern」反映 brief 集中於 patterns/docs/task-briefs/ 的慣例(2026-05-19 establish)直覺上不自然 — brief 描述 viewer 工作為何放 patterns?

當時理由(patterns WORKLOG 2026-05-19):viewer/reporter `.gitignore` 排除 `TASK_BRIEF*.md` → brief 不能跨機共享。集中到 patterns 解這個問題,但 trade-off 是 patterns repo 變成 catch-all。

下個 thread 若 YC 想重議:
- 替代方案 A:把 viewer/reporter `.gitignore` 的 `TASK_BRIEF*.md` 改成只排除 root-level(`/TASK_BRIEF*.md`),允許 `docs/task-briefs/` 子目錄被追蹤
- 替代方案 B:每 repo 開自己的 `docs/task-briefs/` 各自存
- 替代方案 C:維持現狀,但 commit message / brief 命名前綴 `<repo>_` 已可一眼看出歸屬

不重議也 OK,只是未來 brief 數量大可能複雜化。

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Order | Brief | Repo | Status |
|---|---|---|---|
| 2.5 | viewer 看診序號右上角 overlay (v1.3.0) | viewer | **Done ✅ 本 thread** |
| 3 | labs_<group> storage → IndexedDB | reporter | Open(self-tag 適合 vhtt) |
| 4 | CKD eGFR / GFRStage / KDIGORisk / TaiwanCKD dispatcher | reporter | Open(depends on Order 3) |
| — | viewer 簡化版衛教格式(brief 未寫) | viewer | parked,等 YC spec |

## 5. Parked questions

**長期 parked(從上 thread 帶來,仍未解)**:
- **vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\`** — 路徑是什麼?哪種 CLAUDE.md(workspace-level / user-level / 其他工具)?跟本專案規則衝突嗎?next 切 vhtt 時問 YC
- **YC 提過「我有修改 project instruction, claude.md」** — vhyl 還 vhtt?Cowork app UI 還是 git canonical?具體改了什麼?

**本 thread 新出現 parked**:
- **B&W 老印表機 dither (#AAAAAA) 風險**:本 thread 測試 #11 實機印一台 OK,但若未來換印表機需留意。已記在 brief § 2.2 + § 7 風險
- **Brief 集中慣例重議**:見 § 3 末段(non-blocking,可主動帶出討論或忽略)

**Cowork UI paste 兩台狀況(2026-05-20 更新)**:
- vhyl:✅ up to date(本 thread SOP I pre-flight 確認;`cowork-project-instructions.md` 本 thread **未動**,§ 1.0 兩格不重置)
- vhtt:仍 ⏳ 未驗收(從未貼過新版;下次切 vhtt 時 SOP I pre-flight 會 block 流程,提示先重貼)

**本 thread 學到的 lesson(已存 memory,不需 parked)**:
- `sandbox-no-git-on-windows-mount.md`:Linux sandbox 對 Windows-mounted `.git` 沒寫權限,跑 git 會留 stale lock 給 YC 收尾。**未來 Claude 動 git 一律請 YC PowerShell,sandbox 不要嘗試**
