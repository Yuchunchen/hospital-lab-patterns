# BOOTSTRAP — 新機器啟用流程

**適用情境：** 在新的 desktop 上要做 hospital-lab 三個 repo 的開發/測試
（例如台東 vhtt 內網 desktop、家裡新筆電、暫時性的虛擬機等）。

**設計原則：** 用 git 同步，不依賴 Dropbox。任何兩台機器之間的同步都靠
GitHub `github.com/Yuchunchen` 的三個 public repos。

---

## Phase 0 — 確認新機器的網路前提

在動手裝任何東西之前，先在目標機器試這幾件事：

```powershell
# 1. 連得到 GitHub？（git push/pull 需要）
ping github.com
git ls-remote https://github.com/Yuchunchen/hospital-lab-patterns.git

# 2. 連得到 Anthropic？（Cowork / Claude Code 需要）
nslookup api.anthropic.com
nslookup claude.ai

# 3. 連得到該機器要測的 vhtt/vhyl 內網？
ping ernode.vghb12.<host>.gov.tw   # 替換成實際 hostname
```

**結果分支：**

- 三個都通 → Phase 1 直接走完整流程
- GitHub 不通但 Anthropic 通 → 用個人手機熱點完成 git clone，後續 push/pull
  也走熱點；或請院方 IT 加白名單
- Anthropic 不通 → 整個流程不適用，改用其他方式（USB 拷檔、本機編輯器）
- 內網 vhtt/vhyl 不通 → 走錯機器了

---

## Phase 1 — 安裝 Cowork（或 Claude Code）

至少裝其中一個。建議**兩個都裝**：Cowork 處理設計討論，Claude Code 處理多檔
重構/git。

從 Anthropic 官網下載 desktop installer，安裝後用同一個 Anthropic 帳號登入。
帳號層級的設定（plugins、connectors 部分）會自動同步；project instructions
看版本，不一定同步（所以才有本 repo 的 `docs/cowork-project-instructions.md`）。

**Claude in Chrome：** 如果要跑 SOP A（live-fetch），需要在新機器的 Chrome
裝 Claude extension 並重新跟 Cowork/Claude Code 配對 — extension 配對是
device-level，不會跨機器同步。

---

## Phase 2 — Clone 三個 repos

選一個本機資料夾當 workspace root（**不要選 Dropbox 或其他 sync 資料夾** —
Dropbox sync `.git/` 會撞 line-ending 翻轉、`.git/index.lock` 殘留、conflicted
copy 等問題，已知 anti-pattern）：

```powershell
# 標準路徑（兩台 desktop 統一）
mkdir D:\self\hospital-lab
cd D:\self\hospital-lab

# Clone 三個 repos（順序：patterns 第一，因為其他兩個 sync 它）
git clone https://github.com/Yuchunchen/hospital-lab-patterns.git
git clone https://github.com/Yuchunchen/hospital-lab-viewer.git
git clone https://github.com/Yuchunchen/hospital-lab-reporter.git
```

完成後 `D:\self\hospital-lab\` 結構：

```
D:\self\hospital-lab\
  ├── hospital-lab-patterns\        ← clone 完才有 PROJECT_CONTEXT.md / docs/bootstrap.md 等
  ├── hospital-lab-viewer\
  └── hospital-lab-reporter\
```

### 建立 workspace root CLAUDE.md

這個檔案讓 Claude Code 從 workspace root 一次操作三個 repo，不用逐個 cd：

```powershell
cd D:\self\hospital-lab
copy hospital-lab-patterns\docs\workspace-claude-md-template.md CLAUDE.md
```

或直接從 patterns repo 最新版複製（template 內容見
`hospital-lab-patterns/docs/workspace-claude-md-template.md`）。

這個檔案**不屬於任何 repo**（不 git track），是本機 workspace 設定。
每台新機器 clone 完三個 repo 後都要建一次。

---

## Phase 3 — 設定 Cowork

1. 開 Cowork → 選 workspace folder → 指向 `D:\self\hospital-lab\`
2. 開新 thread
3. 打開 Cowork 的 **Project Instructions** UI
4. 用編輯器打開 `hospital-lab-patterns/docs/cowork-project-instructions.md`，找到
   裡面那段以 ` ``` ` 包起來的內容（從 `# Project: Hospital Lab Data System`
   開始）
5. 把那整段純文字複製貼進 Cowork Project Instructions UI（覆蓋掉原本內容
   或者第一次設定）
6. 把 `<workspace-root>` 改成你機器實際路徑（例如 `D:\self\hospital-lab\`）
7. Save

**驗證：** 在 Cowork 開新 thread 問「現有規則有幾條」，應該回 7 條（規則 #1
到 #7）。

---

## Phase 4 — 設定 Claude Code（可選但推薦）

Claude Code 不需要手動設 project instructions — 它會自動讀每個 repo 的
`CLAUDE.md`。三個 repo 的 `CLAUDE.md` 都已經 tracked，clone 完就有。

`patterns/CLAUDE.md` 應該包含 catalog 結構說明、release 流程、catalog 規則。
`viewer/CLAUDE.md` 包含 OPD 端 viewer 細節。`reporter/CLAUDE.md` 包含
single-HTML 案管細節。

---

## Phase 5 — 測試 SOP A（live-fetch pattern learning）

這一步只在新機器需要做 vhtt/vhyl 內網實測時跑。

1. Claude in Chrome 已配對 → 確認
2. 在 Cowork 開新 thread，打入觸發語法：
   ```
   vhtt/000123456A GPT
   ```
3. 應該自動啟動 SOP A：開 ernode 頁面、抓 label、提議 regex...
4. 我會等你確認後才寫進 `patterns/catalog.js`、加 manifest、跑 release

如果 SOP 沒自動觸發，回頭檢查 Phase 3 的 project instructions 是否貼正確。

---

## Phase 6 — 兩台機器之間的日常同步

兩台機器都 setup 完之後，日常工作流程：

```powershell
# 開工前
cd <repo>
git pull

# 改完 → Claude Code 會帶你 commit + 等你說 push → push

# 收工前確認都已 push
git status
```

**衝突避免規則：**

- 同一個 repo 同一時間只在一台機器改
- 改完立刻 push，另一台 pull 後再開始改
- TASK_BRIEF 流程只在一台機器跑（不要同時兩台都在做同一個 brief）

**如果兩台同時改了又都 push（罕見但會發生）：** GitHub 會擋第二個 push，你
需要在第二台先 pull、解 merge conflict、再 push。WORKLOG.md 的 conflict 通常
最常見（兩邊都加了當天的 entry）— 手動合併兩段。

---

## Phase 7 — 環境差異備忘

兩台 desktop 環境差異（自 2026-05-10 起兩台路徑統一、純 git 同步）：

| 項目 | vhyl（玉里 desktop） | vhtt（台東 desktop） |
|---|---|---|
| Workspace 路徑 | `D:\self\hospital-lab\` | `D:\self\hospital-lab\` |
| Sync 機制 | git only | git only |
| 內網存取 | vhyl 內網 | vhtt 內網 |
| Cowork project instructions | UI 裡（路徑統一後不再分歧） | 同 |
| Claude in Chrome 配對 | per-machine 配對 | per-machine 配對 |
| 預設 opsid | A123456789 | 同 |
| 角色 | 測試 + minor revision | 主開發 |

> 環境分工原則詳見 `PROJECT_CONTEXT.md` § 1.5。
>
> 歷史備註：vhyl 2026-05-10 之前位於 `D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\`，
> 同時依賴 Dropbox + git，已知會撞 line-ending 翻轉與 .git lock 問題。已淘汰。

特別注意：**Pattern catalog 是共用的**，但 vhtt 跟 vhyl 兩家醫院的 lab 報告
格式可能略有不同。如果發現某條 pattern 在 vhtt 抓不到，依 SOP F → B 偵錯
流程；如果是 vhtt 專屬欄位 catalog 還沒有，依 SOP A 新增。

--
