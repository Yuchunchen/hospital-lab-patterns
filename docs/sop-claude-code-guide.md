# Claude Code 操作指南（SOP 3 & 4）

> 本文件包含兩個 SOP：
> - **SOP-CC1**：Claude Code 基本操作（啟動、多檔修改、git 流程）
> - **SOP-CC2**：Cowork ↔ Claude Code 切換與 hand-off 流程

---

## SOP-CC1：Claude Code 基本操作

### 前置條件

- 已安裝 Claude Desktop App 並啟用 Claude Code 模式
  （或安裝獨立的 `claude` CLI：`npm install -g @anthropic-ai/claude-code`）
- 已 clone 三個 repos（見 `docs/bootstrap.md` Phase 2）
- Git 已設定好 credential（能 push 到 github.com/Yuchunchen）

### 步驟 1 — 啟動 Claude Code

**方法 A：從 Claude Desktop App**
1. 打開 Claude Desktop App
2. 切換到 Claude Code 模式（左側面板）
3. 選擇工作目錄（通常是某個 repo 的根目錄）

**方法 B：從 PowerShell / Terminal**
```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
claude
```

Claude Code 啟動後會自動讀取該 repo 的 `CLAUDE.md`，了解 repo 的規則和結構。

### 步驟 2 — 告訴 Claude Code 要做什麼

通常有兩種情境：

**情境 A：執行 TASK_BRIEF**
```
讀 docs/task-briefs/TASK_BRIEF_xxx.md，照裡面的步驟實作
```
Claude Code 會：
1. 讀取 brief
2. 逐步實作（修改程式碼）
3. 跑 `npm run validate` / `npm run release`
4. 更新 WORKLOG.md（繁體中文）
5. 建議 commit message → 等你確認

**情境 B：直接描述修改**
```
在 catalog.js 加一條新的 VitD entry，regex 是 /Vit\.\s*D[^:]*:\s*([\d.]+)/i，
加進 viewer manifest page 1 col 3 section 維生素
```

### 步驟 3 — 每次修改後的標準流程

Claude Code 會按照 `CLAUDE.md` 的規則自動執行：

```
1. npm run validate          ← 必須全綠
2. npm run build-json        ← 若改到 patterns/* 檔案
   （或直接 npm run release = validate + build-json）
3. 更新 WORKLOG.md           ← 繁體中文，格式見 CLAUDE.md 範本
4. 提示 commit：
   > 變更已完成，validate / build-json 皆已通過。
   > 建議 commit message：`patterns: add VitD for viewer`
   > 要我現在 git add + commit + push 嗎？
5. 你說「push」→ Claude Code 執行 git push
```

### 步驟 4 — 跨 repo 同步（sibling sync）

如果改了 patterns repo 的 catalog / normalizers / computed，
Claude Code 會主動提醒你需要同步 sibling repos：

```powershell
# 在 viewer repo
cd D:\self\hospital-lab\hospital-lab-viewer
node sync-patterns.js
# → 更新 mapping.js / normalizers.js / patterns-computed.js
git add . && git commit -m "sync: update patterns from upstream"
git push

# 在 reporter repo
cd D:\self\hospital-lab\hospital-lab-reporter
node sync-patterns.js
# → 更新 hospital-lab-data.html 的標記區塊
git add . && git commit -m "sync: update patterns from upstream"
git push
```

### 步驟 5 — 收尾：TASK_BRIEF 改名

如果是執行 TASK_BRIEF，所有 repo 都 push 完之後：

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
git mv docs/task-briefs/TASK_BRIEF_xxx.md docs/task-briefs/TASK_BRIEF_xxx_done.md
git commit -m "brief: mark TASK_BRIEF_xxx as done"
git push
```

（這是強制規則 #6：用 `git mv` 保留歷史，搭配當輪最後一個 commit）

### 常用指令速查

| 指令 | 用途 |
|---|---|
| `npm run validate` | 檢查所有 regex、找重複 ID |
| `npm run build-json` | 重建 dist/patterns.json |
| `npm run release` | validate + build-json 一步完成 |
| `node sync-patterns.js` | 在 viewer / reporter repo 執行，同步 patterns |
| `git log -1` | 看最後一個 commit |
| `Get-Date -Format yyyy-MM-dd` | PowerShell 取日期（寫 WORKLOG 用） |

---

## SOP-CC2：Cowork ↔ Claude Code 切換與 Hand-off

### 設計原則

```
Cowork = 大腦（思考、設計、學習）
Claude Code = 雙手（實作、重構、git）
```

兩者各有優勢，不能互相取代：

| 能力 | Cowork | Claude Code |
|---|:---:|:---:|
| 瀏覽器自動化（Chrome） | ✓ | ✗ |
| 設計討論、方案比較 | ✓ | 可以但不擅長 |
| 多檔同步修改 | 有限 | ✓ |
| git commit / push | ✗ | ✓ |
| 跑 npm scripts | sandbox 內可以 | ✓（直接在 repo） |
| 讀 TASK_BRIEF 執行 | ✗ | ✓ |

### Hand-off 流程（Cowork → Claude Code）

```
┌─────────────────────────────────────────────┐
│                  COWORK                      │
│                                             │
│  1. 討論需求 → 確認要做什麼                   │
│  2. (可選) Pattern learning via Chrome        │
│  3. 寫 TASK_BRIEF_xxx.md                     │
│     ├── 明確列出要改的檔案                    │
│     ├── 列出具體修改內容                      │
│     ├── 列出驗證方法                          │
│     └── 存到對應 repo 的 docs/task-briefs/    │
│                                             │
│  4. 告訴 Claude Code：                       │
│     「讀 TASK_BRIEF_xxx.md，照步驟做」        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│               CLAUDE CODE                    │
│                                             │
│  5. 讀 CLAUDE.md（自動）                     │
│  6. 讀 TASK_BRIEF_xxx.md                     │
│  7. 逐步實作                                 │
│  8. npm run release                          │
│  9. 更新 WORKLOG.md                          │
│ 10. 建議 commit message → 等你說 push        │
│ 11. push                                     │
│ 12. sibling repo sync + push                 │
│ 13. git mv TASK_BRIEF → _done               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│              回到 COWORK                     │
│                                             │
│ 14. 驗收：確認修改正確                        │
│ 15. 計畫下一步                               │
└─────────────────────────────────────────────┘
```

### Hand-off 不用 TASK_BRIEF 的情況

如果修改很簡單（例如改一個 reference range），不用寫 brief，直接在
Claude Code 描述就好：

```
在 Claude Code 直接說：
  Fe 的 ref range 改成 lo:50 hi:175，loM:65 hiM:175 loF:50 hiF:170
```

TASK_BRIEF 適合用在：
- 修改涉及 2 個以上 repo
- 修改涉及 3 個以上檔案
- 需要記錄設計決策的理由
- 需要分 phase 執行

### 常見 Hand-off 範例

**範例 1：新增 Pattern（完整流程）**
```
Cowork: vhyl/000151649A VitD
       → Chrome 抓到 label → 提議 regex → 你確認
       → Claude 印出修改指引

Claude Code: 讀指引 → 改 catalog.js + viewer.js
            → npm run release → WORKLOG → commit → push
            → viewer/reporter sync → push
```

**範例 2：修 bug（偵錯 + 修復）**
```
Cowork: vhyl/000151649A Fe 沒抓到
       → SOP F 偵錯 → 發現是 regex 沒支援 (YL) suffix
       → 提議修改方案

Claude Code: 改 catalog.js regex → release → push → sync
```

**範例 3：大型重構（需要 TASK_BRIEF）**
```
Cowork: 討論肝炎 regex 集中化方案
       → 比較兩個設計方案
       → 決定走 computed display 路線
       → 寫 TASK_BRIEF_肝炎集中computed.md（含 3 phase）

Claude Code: Phase 1 — patterns repo 修改 → push
            Phase 2 — viewer repo 修改 → push
            Phase 3 — reporter repo 修改 → push
            → git mv TASK_BRIEF → _done
```

---

## 快速參考卡

```
┌──────────────────────────────────────────────────────┐
│            何時用 Cowork？何時用 Claude Code？         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  「我要討論 / 學 / 設計」      → Cowork              │
│  「我要改 code / git / 跑指令」 → Claude Code         │
│  「我要用瀏覽器抓資料」        → Cowork (Chrome)      │
│  「我要跨 repo 同時改」        → Claude Code          │
│                                                      │
│  不確定？先開 Cowork 討論，它會告訴你該切換。         │
└──────────────────────────────────────────────────────┘
```
