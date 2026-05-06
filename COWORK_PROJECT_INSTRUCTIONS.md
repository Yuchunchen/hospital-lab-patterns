# Cowork Project Instructions — paste-able snapshot

**用途：** 在新的 Cowork 機器（例如台東 vhtt 內網 desktop）setup 時，把下面
這段純文字複製貼到 Cowork 的 **Project Instructions** UI 設定欄位。

**為什麼需要這份備份：** Cowork 的 project instructions 寫在 app UI 裡，如果
帳號設定沒同步、或要在新機器快速重建環境，這份檔案就是 single source of
truth。修改 project instructions 後**請同步更新本檔**，才不會 drift。

**最後同步：** 2026-05-07（加入規則 #7 後）

---

```
# Project: Hospital Lab Data System

3 repos in <workspace-root>/
(hospital-lab-patterns, hospital-lab-viewer, hospital-lab-reporter).
All public on github.com/Yuchunchen.

# 註：<workspace-root> 在不同機器路徑不同
#   Dropbox 主機: D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\
#   台東 vhtt:   D:\self\hospital-lab\ （建議，避免依賴 Dropbox）

## 強制規則

1. WORKLOG.md 用繁體中文撰寫
2. 改程式碼後立刻更新 WORKLOG.md
3. git push 之前先問我
4. 跨 repo 副作用主動提醒（patterns 改 → viewer/reporter re-sync）
5. 動手寫程式前先說明在 Cowork 還是 Claude Code
6. TASK_BRIEF_xxx.md 執行完後改名加 _done 後綴（git mv 保留歷史，
   與當輪最後一個 commit 同一輪做掉）
7. 回覆時在關鍵段落或結論旁加上簡短繁體中文註解（一句話），
   方便快速瀏覽；文件內容本身維持英文

## Modes

- Cowork (this app) — 思考、設計、pattern learning、寫 TASK_BRIEF.md
- Claude Code — 多檔重構、git、跑 sync-patterns

## Pattern-learning trigger（live-fetch SOP）

當我訊息符合以下任一格式，自動啟動對應 SOP（不要先問我選哪一條）：

- <vhyl|vhtt>/<chartno> <test_name>            → SOP A（新增 pattern）
- <vhyl|vhtt>/<chartno> <test_name> 沒抓到/missing → SOP F→B/D（偵錯）
- <test_id> ref range 改成 lo/hi               → SOP C
- 把 <test_id> 從 viewer/reporter 拿掉         → SOP E

預設：opsid = A123456789；Claude in Chrome 已連線。
完整流程細節（步驟、Chrome 自動化技巧、輸出格式）見
PROJECT_CONTEXT.md § 9（位於 hospital-lab-patterns/PROJECT_CONTEXT.md）。

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

## 若改了 Cowork UI 的規則

請按以下順序：

1. 在 UI 編輯 → 確認運作
2. 同步更新本檔（更新「最後同步」日期 + 維護紀錄）
3. 在 patterns repo commit 本檔
4. 兩台機器都 git pull
5. 另一台機器手動把本檔內容貼回它的 Cowork UI
