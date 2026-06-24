# TASK_BRIEF — vhyl refHistory 時間維 round-2（exhaustive 30/30 收斂）：release + sync + push

**建立**:2026-06-24（Cowork，YC + claude）
**執行端**:**Claude Code**（大半徑：跨 repo + git）
**前置**:round-1（3 病人）已 push。本輪是 exhaustive 全 30 病人收斂後的 catalog.js delta，在 working tree。

## 背景
首輪只掃 3 病人就 ship；本輪掃完全 30 病人（errors=0）收斂日期 + 補 r-GT/TSAT。
詳見 WORKLOG 最新條 + `ref-timedim-2026-06-24/harvest-results.md`「UPDATE — 30/30」。**僅 catalog.js。**

## 本輪 catalog.js delta
1. 全部新版 vhyl validFrom `2025-06-24` → **`2025-06-04`**（chem 11 + GOT v2 + BUN×2 + ALP；replace-all）。
2. GOT v3 validFrom `2026-03-13` → **`2026-02-02`**。
3. r-GT(RGT)：原單筆 @2022-11-29 → 拆成 玉里舊 M8-61,F5-36 @1900 + 玉里新 **M<55,F<38** @2025-06-04。
4. TSAT：validFrom `2026-03-31` → **`1900-01-01`**（穩定，30pt 確認）。

## ⚠️ 動手前 pre-flight
1. `cd hospital-lab-patterns && git diff --stat` → 預期變更:`patterns/catalog.js` + `WORKLOG.md`
   + `docs/session-state-vhyl.md` + 本 brief（+ `ref-timedim-2026-06-24/harvest-results.md`）。
2. `node --check patterns/catalog.js` 應通過（Cowork sandbox 因 mount stale 無法自跑；以此為準）。
3. `git diff patterns/catalog.js` 應只見上述 4 類 refHistory 改動，無整段消失。

## 待做（依序）
1. `npm run release`（validate + build-json）。
2. viewer + reporter `node sync-patterns.js`。
3. **push 前問 YC** → commit 三 repo → push。
4. push 後同步 Notion Dashboard；本 brief git mv 加 `_done`。

## 成功標準 + 測試清單（每條對應業務行為）
1. `node scripts/validate.js` 通過；`npm run test:refhistory` 無 regression。
2. 邊界：`resolveRef('ALP','vhyl','2025-05-15','F')`→`{35,104}`；`'2025-06-10','F'`→`{46,122}`。
3. GOT：`'2026-01-15','F'`→`{11,34}`；`'2026-02-10','F'`→`{5,34}`。
4. r-GT：`resolveRef('RGT','vhyl','2024-01-01','M')`→`{8,61}`；`'2026-01-01','M'`→`{null,55}`；`'2026-01-01','F'`→`{null,38}`。
5. TSAT：`resolveRef('TSAT','vhyl','2022-01-01','F')`→`{12,45}`（不再掉 universal 20-45）。
6. sync 後 dist/patterns.json 反映上述。

## 已結案 / 不在範圍
- exhaustive 30/30 **已完成**（不需再掃）。
- 無時間維資料、維持現狀:TIBC / Fe / Ferritin / AFP / CEA / iPTH（30 人全無）；FreeCa（值同 universal，1900）。
- warn brief `viewer_ref_display_valueless_quiet`（獨立）。
