# Cowork Project Instructions — paste-able snapshot

**用途：** 在新的 Cowork 機器（例如台東 vhtt 內網 desktop）setup 時，把下面
這段純文字複製貼到 Cowork 的 **Project Instructions** UI 設定欄位。

**為什麼需要這份備份：** Cowork 的 project instructions 寫在 app UI 裡，如果
帳號設定沒同步、或要在新機器快速重建環境，這份檔案就是 single source of
truth。修改 project instructions 後**請同步更新本檔**，才不會 drift。

**最後同步：** 2026-05-19（加入「思考規則」section #8–#11 + Session 切換 trigger section,Karpathy/Forrest Chang 12-rule 篩選版 + Session SOPs G–J)

---

```
# Project: Hospital Lab Data System

3 repos in <workspace-root>/
(hospital-lab-patterns, hospital-lab-viewer, hospital-lab-reporter).
All public on github.com/Yuchunchen.

# 註：<workspace-root> 兩台 desktop 統一為 D:\self\hospital-lab\
#   vhtt（台東）: D:\self\hospital-lab\
#   vhyl（玉里）: D:\self\hospital-lab\
# （2026-05-10 起 vhyl 從 Dropbox 路徑搬出對齊）

## 強制規則

1. WORKLOG.md 用繁體中文撰寫
2. 改程式碼後立刻更新 WORKLOG.md
3. git push 之前先問我
4. 跨 repo 副作用主動提醒（patterns 改 → viewer/reporter re-sync）
5. 動手寫程式前先說明在 Cowork 還是 Claude Code
6. TASK_BRIEF_xxx.md 執行完成後改名加 _done 後綴（變 TASK_BRIEF_xxx_done.md），表示已歸檔；改名動作在最後一個 commit 同一輪做掉。
7. Notion 的「🛠 開機 SOP (vhyl ↔ vhtt 共用)」page 是 vhtt / vhyl 共用的儀表板入口（URL 在 PROJECT_CONTEXT § 10）。每次 session 開始時讀一次，把 TASK_BRIEF Dashboard 當當前 TODO 來源（優先於翻 docs/task-briefs/ 目錄）。每次有 brief 新增、改名 _done、順序調整、依賴變動，Claude 主動同步 Notion（時序：git push 成功之後才寫 Notion；Notion 寫失敗不擋 push，但要在回應內明示「Notion 沒更到」）。

## 思考規則（Cowork mode 適用；Coding 規則見各 repo CLAUDE.md § Coding behavior contract）

8. 暴露假設：給結論 / 報告狀態前先說明依據。若依據是 Notion / WORKLOG / Dashboard，session 開始要先跑 § 1.1 環境 sync（git pull 三 repo），不要拿舊 cache 當 ground truth。
9. brief 必含「成功標準」+「測試清單」：TASK_BRIEF.md 沒寫「怎樣算做完」就不算寫完；測試清單要可獨立驗證、且每條對應一個業務行為（不是只「函式有回傳值」這類淺層斷言）。
10. 跨 session / 跨機 / 跨 repo 任務，每段交付前自我複述當前狀態（已做什麼、已驗證什麼、還剩什麼）。無法清楚複述就停下重述，別硬撐繼續。
11. 靜默失敗 → 明示。該成功而沒成功的事必須在回應裡直接點出（不限於 Notion 同步；含跳過、降級、跳過驗證、部分完成等）；不確定就先說不確定，預設暴露而非隱藏。

## Modes

- Cowork (this app) — 思考、設計、pattern learning、寫 TASK_BRIEF.md
- Claude Code — 從 workspace root 啟動，一次跨 3 repo 操作
  （多檔重構、git、跑 sync-patterns；Claude Code 自行 cd 切換）

## Pattern-learning trigger（live-fetch SOP）

當我訊息符合以下任一格式，自動啟動對應 SOP（不要先問我選哪一條）：

- <vhyl|vhtt>/<chartno> <test_name>            → SOP A（新增 pattern）
- <vhyl|vhtt>/<chartno> <test_name> 沒抓到/missing → SOP F→B/D（偵錯）
- <test_id> ref range 改成 lo/hi               → SOP C
- 把 <test_id> 從 viewer/reporter 拿掉         → SOP E

預設：opsid = A123456789；Claude in Chrome 已連線。
完整流程細節（步驟、Chrome 自動化技巧、輸出格式）見
PROJECT_CONTEXT.md § 9（位於 hospital-lab-patterns/PROJECT_CONTEXT.md）。

## Session 切換 trigger（established 2026-05-19）

當我訊息符合以下任一格式，自動啟動對應 SOP（不要先問我選哪一條）：

- 「階段完成」/「wrap」→ SOP G（一段工作完成、要開新 session 或休息）
- 「離開 vhyl」/「離開 vhtt」→ SOP H（離開本台機器、之後可能對方機接續）
- 「接續 vhtt」/「接續 vhyl」/「接續上次」→ SOP I（開新 session 接續上一段）
- 「結束 session」→ SOP J（結束本 chat session，給開新 session 的開場句）

完整動作清單（每個 SOP 該做的步驟、session snapshot 檔結構、容量考量）見
PROJECT_CONTEXT.md § 12。

Claude 主動觸發時機（SOP J）：context 已逼近 session 上限、同一個問題使用者重述 ≥ 2 次、一段工作完成的自然斷點。

## Deep context

Read PROJECT_CONTEXT.md in hospital-lab-patterns/ for architecture, commands,
marker names, milestones, and full SOPs. Each repo's CLAUDE.md is
authoritative for that repo.

Follow these instructions when working in this project.
```

---

## 維護紀錄

| 日期 | 變更 |
|---|---|
| 2026-05-06 | 加入規則 #6（TASK_BRIEF _done 改名約定） |
| 2026-05-06 | PROJECT_CONTEXT.md 從 workspace root 搬進 hospital-lab-patterns/ |
| 2026-05-06 | 新建本檔，作為 portability snapshot |
| 2026-05-07 | 加入規則 #7（回覆加簡短中文註解） |
| 2026-05-07 | 規則 #6 重寫（集中到 patterns/docs/task-briefs/ + 分層更新策略） |
| 2026-05-07 | 本檔從 repo root 搬到 docs/cowork-project-instructions.md |
| 2026-05-07 | Modes 加註 Claude Code 從 workspace root 啟動 |
| 2026-05-12 | 規則 #6 收回單行版（(a)-(e) 細節 live UI 沒採用,留在 PROJECT_CONTEXT § 5 hand-off pattern 段） |
| 2026-05-12 | 移除舊 #7（中文註解,live UI 未採用） |
| 2026-05-12 | 加入新 #7（Notion「🛠 開機 SOP (vhyl ↔ vhtt 共用)」page 為 cross-machine TODO 入口,sync 時序規則） |
| 2026-05-19 | 加入「思考規則」section（#8–#11:暴露假設 / 成功標準 / 複述狀態 / 靜默失敗明示）。來源:Karpathy + Forrest Chang 12-rule CLAUDE.md（blocktempo 2026-05-14）對應本專案踩過的失敗模式篩選。Coding 端規則同步加入三個 repo CLAUDE.md § Coding behavior contract。 |
| 2026-05-19 | 加入「Session 切換 trigger」section（4 條中文 trigger 對應 SOP G–J:階段完成 / 離開 vhyl-vhtt / 接續 vhtt-vhyl-上次 / 結束 session）。完整動作清單在 PROJECT_CONTEXT § 12。同日 docs/session-state-vhyl.md / session-state-vhtt.md / session-state-archive/ / workflow-changelog.md 誕生。 |

## 若改了 Cowork UI 的規則

請按以下順序：

1. 在 UI 編輯 → 確認運作
2. 同步更新本檔（更新「最後同步」日期 + 維護紀錄）
3. 在 patterns repo commit 本檔
4. 兩台機器都 git pull
5. 另一台機器手動把本檔內容貼回
