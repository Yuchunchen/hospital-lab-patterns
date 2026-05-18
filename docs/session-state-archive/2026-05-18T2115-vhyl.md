# Session state — vhyl

> 每次「階段完成」/「離開 vhyl」/「結束 session」在 vhyl 觸發時 overwrite 本檔。
> 在 vhyl 開新 session 接續 vhyl(「接續上次」)或在 vhtt 接續 vhyl(「接續 vhyl」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-05-19(本檔初始化;尚未真正 wrap 過)
**Last session type**: Cowork
**Last action**: 建立 session-state 機制 + 4 個 Session 切換 SOPs

## 1. 本 session 完成

- 規則修訂(思考規則 #8–#11 加入 Cowork project instructions;Coding behavior contract A–C 加入三個 repo CLAUDE.md)— 已 push
- 4 條歷史 brief(reporter step1/step1v3/step2 + viewer 肝炎)集中搬至 `patterns/docs/task-briefs/` 並改可讀命名 — 已 push
- Notion Dashboard 補進 5/13 兩條 Done brief(Order 11 FreePSA orderNameFilter / Order 12 UACR+RATIO alternation)
- 建立 Session 切換 SOPs G/H/I/J + session-state 機制 + workflow-changelog.md

## 2. 本 session 未完

(無)

## 3. 下次該先做什麼

- viewer 看診序號 brief(parked,釐清過細節:tabular paste col 1 = 看診序號;右上角 top-layer 大字 overlay;不影響現有 4-col layout)
- viewer 簡化版衛教格式 brief(parked,等 YC 給 spec — 紙張 / 版面 方向)
- reporter #3(labs_<group> → IndexedDB)/ reporter #4(CKD eGFR/GFRStage/KDIGORisk/TaiwanCKD dispatcher)仍 Open;按 Order 4 依賴 3

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

- Order 3: labs_<group> storage → IndexedDB(reporter,half-day,Open)
- Order 4: CKD eGFR / GFRStage / KDIGORisk / TaiwanCKD dispatcher(reporter,one-day,Open,depends on Order 3)
- viewer 看診序號 brief(未寫,parked)
- viewer 簡化版衛教 brief(未寫,parked 等 spec)

## 5. Parked questions(等 YC 之後回答)

- vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\` — 路徑是?是哪種 CLAUDE.md(workspace-level / user-level / 其他 Claude 工具的)?跟本專案規則會不會相互蓋掉?
- YC 提及「我有修改 project instruction, claude.md」— 是 vhyl 端改的還是 vhtt 端?Cowork app UI 改的還是 git canonical 改的?改了什麼具體規則?(剛 pull 進來 patterns/CLAUDE.md 只動 2 行描述微調,看起來不是主要那筆。)
