# TASK_BRIEF: vhyl → vhtt handoff (2026-05-10)

> **方向**：vhyl（玉里 desktop） → vhtt（台東 desktop）
> **產出 session**：vhyl Cowork session, 2026-05-10
> **預計執行 session**：下次 vhtt Cowork / Claude Code session
>
> **執行完畢後請改名為 `TASK_BRIEF_handoff_vhyl_to_vhtt_2026-05-10_done.md`**（rule #6）

---

## 背景

vhyl 在 2026-05-10 做了「Dropbox + git 共處架構」的根本治理：

1. 從 Dropbox 路徑 `D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\hospital-lab-*\` 搬到 `D:\self\hospital-lab\hospital-lab-*\`，跟 vhtt 路徑統一
2. 純 git 同步，不再依賴 Dropbox sync working tree
3. patterns repo push 一個 docs commit（`3dc525f`）：環境分工原則 + 路徑統一

vhtt 端**沒動工作樹**（5/8 後就閒置）。本 brief 帶 vhtt 對齊新狀態。

---

## Phase 1：環境健檢（5 分鐘）

```powershell
cd D:\self\hospital-lab
foreach ($d in 'hospital-lab-patterns','hospital-lab-viewer','hospital-lab-reporter') {
  Set-Location "D:\self\hospital-lab\$d"
  Write-Host "`n=== $d ===" -ForegroundColor Cyan
  git status -s
  git log -1 --oneline
  $ahead = git rev-list --count "origin/main..HEAD" 2>$null
  $behind = git rev-list --count "HEAD..origin/main" 2>$null
  Write-Host "ahead=$ahead behind=$behind"
}
```

**預期**：
- 三個 repo 都乾淨
- `patterns` 應該 `behind=1`（vhyl 5/10 的 docs commit `3dc525f` 沒 pull）
- `viewer` / `reporter` 都 `ahead=0 behind=0`

> 若有意外 dirty changes：先 `git stash` 或 commit 處理。

## Phase 2：Pull vhyl 5/10 的 docs commit（2 分鐘）

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
git pull
```

預期拉到：
```
3dc525f docs: unify desktop workspace path + add env-split rule
```

驗證新增的 §1.5 環境分工原則 section：

```powershell
Select-String -Path PROJECT_CONTEXT.md -Pattern "環境分工原則"
```

## Phase 3：確認 vhtt 端 Cowork Project Instructions（3 分鐘）

vhtt 機器的 Cowork 是另一份安裝，Project Instructions **per-machine 儲存**，不會自動跨機器同步。

1. 開 Claude Desktop App → Cowork → lab report system project
2. 看右側 Instructions 面板第一行附近
3. 確認寫的是：
   ```
   3 repos in D:\self\hospital-lab\
   ```
4. 如果還是 Dropbox 路徑（`D:\self\Dropbox\...`）→ 改成 `D:\self\hospital-lab\`
5. Workspace folder 確認指向 `D:\self\hospital-lab`

> **省事版**：把剛 pull 下來的 `docs/cowork-project-instructions.md` 內 ` ``` ` 區塊整段複製貼上覆蓋。

## Phase 4：Cleanup（選做，按優先序）

### 4a. RESUME.md 搬進 patterns repo（建議優先）

vhyl Dropbox 內的 `RESUME.md` 已標 deprecated。要把它的核心邏輯（離開/到達 checklist）改寫成純 git 版，搬進 patterns repo：

**目標**：`D:\self\hospital-lab\hospital-lab-patterns\docs\RESUME.md`

**內容調整**：
- 移除所有 Dropbox 路徑引用
- 路徑改 `D:\self\hospital-lab\<repo>`
- 「Dropbox + git 同資料夾」整個 section 直接刪除（已不適用）
- 保留：離開 checklist、到達 checklist、固定 prompt、TL;DR

**做法**：跟 Cowork 說：
```
讀 vhyl Dropbox 的 RESUME.md（在 _INDEX.md 旁），改寫成純 git 版本放進 docs/RESUME.md
```

完成後 commit（push 前問），vhyl 下次 pull 後可刪 Dropbox 端舊版。

### 4b. 加 `.gitattributes` 治本 line-ending（次要）

只在 patterns repo 加（其他兩個 repo 等 vhyl 對齊後再做）：

`.gitattributes` 內容：
```
* text=auto
*.ps1 text eol=crlf
*.bat text eol=crlf
*.cmd text eol=crlf
*.sh text eol=lf
```

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
# 寫 .gitattributes 後...
git add --renormalize .
git status  # 看會 normalize 多少檔
git commit -m "build: add .gitattributes for cross-platform line-ending hygiene"
# push 前問
```

**警告**：renormalize 會 touch 大量檔，vhyl 下次 pull 會看到一次性 churn（`git checkout -- .` 一次清掉）。但之後永久乾淨。優先級在 4a 之下，因為純 git sync 後 line-ending 撞牆機率已大降。

---

## Phase 5：驗證 vhtt 工作流（2 分鐘）

開 Cowork 新 thread，丟 SOP 觸發測試：
```
vhtt/000123456A WBC
```

預期 Claude 啟動 SOP A（pattern learning），開始問細節 / 用 Claude in Chrome 連 ernode。如果 Claude 沒認得 SOP → Project Instructions 沒貼對，回 Phase 3 重貼。

---

## 完成 checklist

- [ ] Phase 1 環境健檢通過
- [ ] Phase 2 patterns repo pull 到 `3dc525f`
- [ ] Phase 3 Cowork Project Instructions 路徑確認 `D:\self\hospital-lab\`
- [ ] Phase 4a RESUME.md 搬進 patterns repo（commit + push）
- [ ] Phase 4b `.gitattributes` 加入（commit + push，可延後）
- [ ] Phase 5 SOP A 觸發測試通過
- [ ] **本檔改名加 `_done` 後綴 + 同輪 commit + push**

---

## 此次 vhyl session 還未做（vhyl 端待辦，不阻擋 vhtt）

下次回 vhyl 順手做（亦可建一份反方向的 `TASK_BRIEF_handoff_vhtt_to_vhyl_<date>.md` 串聯）：

1. 等 vhtt push 4a 後，刪除 Dropbox `lab_report\` root 內 deprecated 的 `RESUME.md`
2. 刪除 Dropbox `lab_report\` root 內 1KB 的 `PROJECT_CONTEXT.md` stub（與 patterns repo 內 812 行版本重複）
3. 三個 repo 加 `.gitattributes`（4b 在 patterns 做完之後，viewer / reporter 比照辦理）
