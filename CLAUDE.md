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

## Coding behavior contract（Cowork + Claude Code 寫程式時皆適用）

> 三個 repo CLAUDE.md 共用同一份;改動請同步 patterns/viewer/reporter。Cowork 端思考規則見 `docs/cowork-project-instructions.md` § 思考規則。

- **A. 外科手術式修改**:只改必須改的;不順手「最佳化」相鄰程式碼、註釋、格式;不重構沒壞掉的東西;保持與該檔現有風格一致。
- **B. 矛盾模式不混用**:同一 repo 內若已有兩種模式衝突(例如錯誤處理、命名、儲存後端、regex 風格),選一條 + 說明理由,另一條標 cleanup,不要寫「同時滿足兩套」的平均程式碼。歷史教訓:5/8 對 vhtt RATIO 的誤判就是試圖讓 vhyl/vhtt 兩套行為「自動分流」沒先選一條。
- **C. 新增程式碼前先讀**:該檔 exports、直接呼叫方、相關共享工具(patterns 端:`patterns/catalog.js` 內既有 entry 是否已用同 alternation、`patterns/computed.js` 是否已有 helper、`patterns/normalizers.js`、`dist/patterns.json` 上一版差異)。不理解現有組織就先問;「在我看來不相關」是這個 codebase 最危險的話。歷史教訓:5/13 FreePSA orderNameFilter brief 就是因為原本沒讀到 UACR 也用 `RATIO:` alternation,改 FreePSA pattern 時跟 UACR 撞號 → 同一筆 reportText 兩個 entry 都命中。

來源:Forrest Chang 12-rule CLAUDE.md(blocktempo 2026-05-14 中文版整理,原規則 3 / 7 / 8);只挑出對應本專案實際踩過坑的條目,其餘條目評估為 redundant 或 not applicable。

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
