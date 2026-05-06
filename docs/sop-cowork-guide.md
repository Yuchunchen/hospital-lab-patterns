# Cowork 操作指南（SOP 1 & 2）

> 本文件包含兩個 SOP：
> - **SOP-CW1**：Cowork 基本操作（開專案、設定、日常使用）
> - **SOP-CW2**：Cowork Pattern Learning 流程（用 Claude in Chrome 從內網學 regex）

---

## SOP-CW1：Cowork 基本操作

### 前置條件

- 已安裝 Claude Desktop App（從 anthropic.com 下載）
- 已登入 Anthropic 帳號
- 已 clone 三個 repos 到 workspace root（見 `BOOTSTRAP.md` Phase 2）

### 步驟 1 — 開啟專案資料夾

1. 打開 Claude Desktop App
2. 點選左上角 **「選擇資料夾」**（或 Project folder 圖示）
3. 選擇你的 workspace root：
   - 台東機器：`D:\self\hospital-lab\`
   - Dropbox 主機：`D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\`
4. Claude 會自動偵測到三個 repo 子資料夾

### 步驟 2 — 設定 Project Instructions

1. 進入 Cowork 的 **Project Instructions** 設定畫面
2. 打開 `hospital-lab-patterns/COWORK_PROJECT_INSTRUCTIONS.md`
3. 複製裡面 ` ``` ` 區塊的純文字內容（從 `# Project: Hospital Lab Data System` 開始）
4. 貼到 Project Instructions UI
5. 把 `<workspace-root>` 改成你機器的實際路徑
6. 儲存

**驗證方式：** 開新 thread 問「現有強制規則有幾條」→ 應回答 6 條。

### 步驟 3 — 日常使用流程

| 你想做的事 | 在 Cowork 怎麼做 |
|---|---|
| 討論設計方案 | 直接開 thread 描述需求，Claude 會分析並提建議 |
| 學習新 pattern | 用觸發語法（見 SOP-CW2） |
| 寫 TASK_BRIEF | 告訴 Claude 你要做什麼，請它寫 TASK_BRIEF_xxx.md |
| Code review | 貼程式碼或指定檔案路徑，請 Claude 檢查 |
| 比較方案 | 描述兩個以上方案，請 Claude 列表比較 pros/cons |
| 畫架構圖 | 請 Claude 畫 mermaid diagram 或 SVG |

### 步驟 4 — 注意事項

- Cowork **不能** 直接 git commit/push — 這些操作在 Claude Code 做
- Cowork **不能** 直接跑 `npm run release` — 也是在 Claude Code 做
- Cowork **可以** 讀寫檔案、執行 bash（在 sandbox 裡），但最終的多檔修改
  建議交給 Claude Code
- 每次修改程式碼後，提醒 Claude 更新 WORKLOG.md（強制規則 #2）

---

## SOP-CW2：Cowork Pattern Learning 流程

### 前置條件

- Claude in Chrome extension 已安裝並與 Cowork 配對
  （在 Chrome 裝 Claude extension → 回 Cowork 點配對）
- 你的機器連得到醫院內網（`ernode.vghb12.<host>.gov.tw:8000`）
- 預設 opsid = `A123456789`

### 觸發語法

在 Cowork thread 直接輸入以下格式，Claude 會**自動選擇對應 SOP**：

| 你輸入的訊息 | Claude 啟動的流程 |
|---|---|
| `vhyl/000123456A WBC` | SOP A — 新增 pattern |
| `vhtt/000123456A AFP 沒抓到` | SOP F→B/D — 偵錯 |
| `Fe ref range 改成 50/175` | SOP C — 修 reference range |
| `把 Mg 從 viewer 拿掉` | SOP E — 從 manifest 移除 |

### SOP A 完整流程（以新增 pattern 為例）

```
步驟 1：你輸入觸發訊息
         例：vhyl/000151649A Vitamin_D

步驟 2：Claude 用 Claude in Chrome 自動操作
         ├── 開新 tab → 導航到 ernode lab page
         ├── 用 searchItem 參數過濾（比翻頁快）
         ├── 找到該 test 的真實 label 樣式
         └── 讀取 HTML 內容

步驟 3：Claude 提議 regex
         ├── 顯示找到的 label 文字
         ├── 提議 regex（含負向前瞻、alternation）
         ├── 建議 displayName / shortLabel / unit / hi / lo
         └── 確認 vhtt 跟 vhyl 命名是否相同

步驟 4：你確認
         ├── 檢查 regex 是否正確
         ├── 確認 reference range
         └── 決定放進 viewer / reporter / 兩者 / track-only

步驟 5：Claude 輸出修改指引
         ├── 完整的 catalog.js 新 entry
         ├── manifest entry（viewer.js / reporter.js）
         └── 給你貼到 Claude Code 的指令
```

### 步驟 5 輸出格式範例

Claude 確認後會印出類似這樣的內容：

```
✅ 已找到 label 樣式：「Vit. D-25(OH): 24.6 ng/mL」
建議 regex：/Vit\.\s*D[^:]*:\s*([\d.]+)/i
（vhtt 也適用 / 需要 alternation：否）

要做的修改：
1. patterns/catalog.js 新增條目：{ id:'VitD', ... }
2. patterns/viewer.js manifest 加上：{ id:'VitD', page:1, col:3, section:'維生素' }

接下來在 Claude Code 跑：
  cd hospital-lab-patterns && npm run release
  git add ... && git commit ...
```

### Chrome 自動化技巧（Claude 內部使用）

- `searchItem=<keyword>` 可過濾，比翻頁快
- 英文名搜不到時試中文（例如 `searchItem=鋁`）
- 翻頁：`&limit=20&offset=N`
- 0 筆結果 → 該病人沒做過此檢查，換病人

### 注意事項

- **隱私**：regex pattern 本身不含 PHI；真實數值只在 Cowork 對話中出現，
  不會進入 repo
- **跨醫院**：如果 vhtt 跟 vhyl label 不同，用 alternation 合併成一條
  regex，不要建兩條 catalog entry
- **確認後才動手**：Claude 提議 regex 後會等你說「OK」才繼續

---

## 快速參考卡

```
┌──────────────────────────────────────────┐
│  Cowork 能做              Cowork 不能做   │
├──────────────────────────────────────────┤
│  ✓ 討論、設計             ✗ git commit    │
│  ✓ Pattern learning       ✗ git push      │
│  ✓ 寫 TASK_BRIEF          ✗ npm run xxx   │
│  ✓ Code review            ✗ 多檔重構      │
│  ✓ 讀寫單一檔案           ✗ sync-patterns │
│  ✓ Chrome 自動化                          │
└──────────────────────────────────────────┘
```
