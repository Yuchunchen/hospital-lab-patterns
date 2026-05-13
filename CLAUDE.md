# 工作協定（給 Claude — Cowork 與 Code 模式皆適用）

This repo is the **single source of truth** for lab/imaging patterns shared by
`hospital-lab-viewer` (OPD Chrome extension) and `hospital-lab-reporter`
(case-management HTML tool).

Both consumers re-bundle from this repo via their own `sync-patterns.js`. The
viewer additionally fetches `dist/patterns.json` at runtime from
`raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/`.

This repo is also the **bootstrap repo** for the whole project:

- `PROJECT_CONTEXT.md` — cross-repo architecture, commands, SOP playbook (§9)
- `docs/cowork-project-instructions.md` — paste-able snapshot of Cowork project
  instructions (強制規則 + SOP triggers); update this whenever Cowork UI changes
- `docs/bootstrap.md` — step-by-step new-machine setup (e.g., 台東 vhtt desktop)

Any new dev machine should clone this repo first to get those three docs.

---

## 每次修改後必做（順序不可顛倒）

1. **跑驗證**：`npm run validate` 必須全綠。
2. **重建快照**：若改到 `patterns/catalog.js`、`patterns/viewer.js`、
   `patterns/reporter.js`、`patterns/normalizers.js`、`patterns/computed.js`
   或 `patterns/index.js`，必須跑 `npm run build-json` 重新產生
   `dist/patterns.json`（這個檔案**必須 commit**，OPD 端從此 URL 抓最新版）。
   或直接 `npm run release`（= validate + build-json）。
3. **更新 WORKLOG.md**：在最頂端新增條目，**繁體中文**。格式見下方範本。
4. **提示提交**：用以下格式問我（不要自動 push）：

   > 變更已完成，validate / build-json 皆已通過。
   > 建議 commit message：`<scope>: <一句話說明>`
   > 要我現在 git add + commit + push 嗎？

5. **若有觸及 catalog / 通用欄位**，提醒我：
   > sibling repo（hospital-lab-viewer 與 hospital-lab-reporter）的
   > sync-patterns.js 應重跑、重新打包並各自推送。

---

## WORKLOG.md 條目範本（繁體中文）

```markdown
## YYYY-MM-DD — 一句話摘要

- 作者：claude（與 YC 共同）
- 範圍：<catalog | viewer-manifest | reporter-manifest | normalizers | computed | runtime-snapshot>
- 變更：<新增 | 修改 | 移除>
- 測試 ID：<例如 WBC, BUN_pre, AntiHBs>
- 原因：<為什麼這麼做（一兩句）>
- 驗證：<例如 `npm run validate` 顯示 69 catalog · 54 viewer · 37 reporter；
        WBC 6700 → 6.7 round-trip OK>
- 影響：<是否需要 sibling repo 重 sync；OPD 是否會在 24 小時內自動拿到>
```

日期取得：

- PowerShell：`Get-Date -Format yyyy-MM-dd`
- bash：`date +%Y-%m-%d`

---

## 不要做的事

- commit 後自動 `git push`；破壞性改動（schema 變更、大規模重構）才先問
- 不要刪除 WORKLOG.md 既有條目
- 不要重排或合併歷史條目（即使順序看起來亂）
- 不要在 `validate` 或 `build-json` 還沒通過前說「完成」
- 不要把 `dist/` 加回 `.gitignore`（它必須被 commit）

## 跨 repo 副作用清單

| 修改的檔案 | sibling 端要做的事 |
|---|---|
| `patterns/catalog.js`、`patterns/normalizers.js`、`patterns/index.js` | viewer 與 reporter 都要重跑 sync 並重新發布 |
| `patterns/viewer.js`（manifest） | 只有 viewer 需要重 sync；OPD 另外會在 24h 內透過 dist/patterns.json 自動拿到 |
| `patterns/reporter.js`（manifest） | 只有 reporter 需要重 sync |
| `patterns/computed.js` | viewer 與 reporter 都要重 sync |
| `dist/patterns.json` | 直接推 main，OPD 端 popup 開啟時拿到（或 24h 後） |
