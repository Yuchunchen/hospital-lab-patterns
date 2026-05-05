# TASK_BRIEF — 健保 CKD 分群（EarlyCKD）非 P1/P2 時顯示「正常」

> **Status:** ACTIVE — 等 Claude Code 接手實作
> **Last updated:** 2026-05-06
> **Scope:** 把 EarlyCKD 在「非 CKD」情況的回傳從 `null` 改成 `'正常'`，避免使用者誤判為「漏抓」。
> **觸發:** 病患 000151649A 三筆紀錄中只有 115/02/02 顯示 P1，其餘空白；使用者要求空白格改顯示「正常」。

---

## 1. 問題陳述

目前 `EarlyCKD()` 在以下情況回傳 `null`：

1. `eGFR == null`（沒資料）
2. `TaiwanCKD === '正常'`（eGFR≥90 且無腎損傷標誌物）

→ Viewer / Reporter 在 null 時不 push cell，整格空白。

但同一報表上 `TaiwanCKD === '正常'` 的格子有顯示「正常」字樣（_tag='normal'），導致兩列視覺不一致：使用者看到 EarlyCKD 空白會誤以為系統漏抓。

**目標：** EarlyCKD 在「TaiwanCKD = 正常」時顯示「正常」(_tag='normal')；只有真的「沒 eGFR 資料」才保持空白。

## 2. 三種狀態的對照表

| 情況 | eGFR | TaiwanCKD | EarlyCKD 改前 | EarlyCKD 改後 |
|---|---|---|---|---|
| 沒抽 eGFR | null | null | null（空白） | **null（空白）** ← 不變 |
| eGFR 正常無腎損 | 有值 | '正常' | null（空白） | **'正常'**（_tag='normal'） |
| CKD 1～3a | ≥45 | 第一/二/三3a期 | 'P1早期' | 'P1早期'（_tag='caution'） ← 不變 |
| CKD 3b～5 | <45 | 第三3b/四/五期 | 'P2中晚期' | 'P2中晚期'（_tag='hi'） ← 不變 |

## 3. patterns repo：computed.js 改動

`patterns/computed.js` line 124–129：

```js
// ─── Early CKD class (健保 P1 / P2) ─────────────────────────────────────
function EarlyCKD({ TaiwanCKD: tw, eGFR }) {
  if (eGFR == null) return null;          // 沒資料 → 空白
  if (tw === '正常') return '正常';       // ← 改：原本 return null
  return eGFR >= 45 ? 'P1早期' : 'P2中晚期';
}
```

只動一行（`null` → `'正常'`）。其餘行為完全不變。

## 4. viewer repo：report.js 改動

`hospital-lab-viewer/report.js` line 304–328 區塊有獨立的 `getEarlyCKDClass()` + push 迴圈（這支才是實際 render 表格的程式）。要同步改 line 315–326：

```js
const twCKD = getTaiwanCKDStage(egfr, upcr, uacr);
if (!twCKD) {
  map['TaiwanCKD'].push({ date: e.date, value: '正常', _tag: 'normal' });
  map['EarlyCKD'].push({ date: e.date, value: '正常', _tag: 'normal' });   // ← 新增
} else {
  map['TaiwanCKD'].push({ date: e.date, value: twCKD.stage, _tag: 'hi' });
  const earlyCKD = getEarlyCKDClass(twCKD);
  if (earlyCKD) {
    const earlyTag = earlyCKD.stage.startsWith('P1') ? 'caution' : 'hi';
    map['EarlyCKD'].push({ date: e.date, value: earlyCKD.stage, _tag: earlyTag });
  }
}
```

只新增一行 push。`getEarlyCKDClass()` 函式本身不用改（仍可回傳 null；caller 端決定如何處理）。

## 5. 文件同步

兩處說明要刪掉「Only shown when CKD is present」描述：

- `hospital-lab-viewer/CLAUDE.md` line 42 — 「Only shown when CKD is present.」改寫成「正常時顯示「正常」(normal tag)；CKD 時顯示 P1/P2。」
- `hospital-lab-viewer/ckd_staging.svg` line 189 — 「只有確認為 CKD（台灣分期第一～五期）時才會產生此欄位」改寫類似。

## 6. 不需要動的東西

- `mapping.js` 的 EarlyCKD 顯示名稱（`健保 CKD 分群 (P1早期/P2中晚期)`）：這是欄位 label，不影響 cell 內容。可保留或微調為「健保 CKD 分群 (正常/P1早期/P2中晚期)」由實作者判斷。
- `getEarlyCKDClass()` 內部邏輯：不動。
- KDIGO / TaiwanCKD / UACR/UPCR 分級：不動。

## 7. 實作步驟

### Phase A — patterns repo

```powershell
cd D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\hospital-lab-patterns
claude
```

讓 Claude Code：

1. 改 `patterns/computed.js` 的 `EarlyCKD()`，第二個 return 改成 `'正常'`。
2. 跑 `npm run release`，確認 `dist/patterns.json` 重 build、validate 全綠。
3. 寫暫存 spec script 跑樣本：
   - `EarlyCKD({ TaiwanCKD:'正常', eGFR:95 })` → `'正常'`
   - `EarlyCKD({ TaiwanCKD:'第一期', eGFR:95 })` → `'P1早期'`
   - `EarlyCKD({ TaiwanCKD:'第三期 3b', eGFR:35 })` → `'P2中晚期'`
   - `EarlyCKD({ TaiwanCKD:null, eGFR:null })` → `null`
   - 全 PASS 後刪掉。
4. 繁中更新 WORKLOG.md：
   標題「## 2026-05-06 — EarlyCKD 非 CKD 時回傳「正常」(視覺一致性)」
   內容：問題、改動範圍、跨 repo 影響（viewer/reporter sync）。
5. `git add patterns/ dist/ WORKLOG.md` → commit → 顯示 commit message → **停下來等 push**。

### Phase B — viewer repo

```powershell
cd ..\hospital-lab-viewer
claude
```

1. `node sync-patterns.js`（自動更新 `patterns-computed.js`）。
2. 手改 `report.js` line 315–326：在 `if (!twCKD)` 分支多 push 一筆 EarlyCKD「正常」cell。
3. 改 `CLAUDE.md` line 42 + `ckd_staging.svg` line 189 兩處說明。
4. 重打包 zip（若 viewer 流程有 build 步驟）。
5. 用病患 000151649A 三筆 eGFR/UACR/UPCR 在本機 viewer 跑一次，確認三格各顯示：正常 / P1早期 / 正常（colour: normal/caution/normal）。
6. 繁中更新 WORKLOG.md。
7. commit + 顯示 commit message + 等 push。

### Phase C — reporter repo

```powershell
cd ..\hospital-lab-reporter
claude
```

1. `node sync-patterns.js` → 確認 inline pattern block 有同步 EarlyCKD 新邏輯。
2. **檢查 reporter 端是否也有 client-side pairing/render**（類似 viewer report.js 那段獨立迴圈）。如有，比照 Phase B step 2 改。如無，純 sync 即可。
3. 繁中 WORKLOG。
4. commit + 顯示 commit message + 等 push。

## 8. 跨 repo 副作用 checklist

- [ ] patterns push（computed.js + dist/patterns.json）
- [ ] viewer push（patterns-computed.js sync + report.js 改 + CLAUDE.md/svg 文件 + 重打包 zip）
- [ ] reporter push（patterns sync + 視情況改 client-side render）
- [ ] 三個 repo 都 push 完之後，回 patterns repo 把本檔 `git mv` 為
      `TASK_BRIEF_早期CKD正常顯示_done.md`，跟 patterns 最後一個 commit 同輪
      （依強制規則 #6 / PROJECT_CONTEXT.md §5）

## 9. 驗收

用病患 000151649A：

| 日期 | 慢性腎臟病分期 | 健保 CKD（改前） | 健保 CKD（改後） |
|---|---|---|---|
| 114/11/07 | 正常 | 空白 | **正常**（normal） |
| 115/02/02 | 第一期 | P1 早期 | P1 早期（不變，caution） |
| 115/04/27 | 正常 | 空白 | **正常**（normal） |

三格皆有值，視覺與「慢性腎臟病分期」列一致。

## 10. 後續 backlog（可選）

- 考慮把 `mapping.js` 的 displayName 從「健保 CKD 分群 (P1早期/P2中晚期)」改成「健保 CKD 分群 (正常/P1早期/P2中晚期)」，讓欄位標題反映完整值域。但這純文案，不影響邏輯。
