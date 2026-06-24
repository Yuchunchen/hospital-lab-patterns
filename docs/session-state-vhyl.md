# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread」/含糊語進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續(「接續上次」)時讀本檔。歷史版本在 `session-state-archive/`。

**Last wrap**: 2026-06-24（Cowork）
**Last session type**: Cowork
**Last action**: vhyl refHistory 時間維重做 round-1（3pt）已 push；exhaustive 30/30 掃完並收斂（round-2），catalog.js delta 停在 working tree，待 Claude Code release/sync/push。

## 0. ⚠️ 最重要 — 下一件事:跑 round-2 release（catalog.js 已改好在 working tree）

時間維重做 + exhaustive 全掃**都做完了**。狀態：
- round-1（3 病人）catalog.js → 已 release + 三 repo push（33 測試過，Notion Done）。
- round-2（exhaustive 30/30 收斂）catalog.js delta → **在 working tree，待 Claude Code release**。
  brief: `docs/task-briefs/TASK_BRIEF_vhyl_refhistory_timedim_release_round2.md`。

**round-2 delta（已落 working tree + resolveRef 驗過）：**
- 改版邊界收斂 新版 validFrom `2025-06-24` → `2025-06-04`（30pt；舊末見 2025-05-02）。
- GOT v3 `2026-03-13` → `2026-02-02`。
- r-GT 拆兩版：舊 M8-61,F5-36 @1900 + 新 M<55,F<38 @2025-06-04。
- TSAT validFrom `2026-03-31` → `1900`（穩定 M15-50,F12-45）。

**下一個 thread 第一件事:** 開 Claude Code 跑 round-2 brief 的 release/sync/push（push 前問 YC）。

## 1. 已完成
- vhyl refHistory 時間維重做 round-1：catalog.js → release + viewer/reporter sync + push（33 測試）。Notion Done。
  附帶修復 working tree catalog.js 先前被截斷的尾端。
- exhaustive 30/30 病人掃完（errors=0，103 analytes），收斂結果見 `ref-timedim-2026-06-24/harvest-results.md`「UPDATE — 30/30」。
- round-2 catalog.js delta 落 working tree + resolveRef 驗過。
- PROJECT_CONTEXT §9 新增「模式 C — 時間維重掃」方法文件。

## 2. 進行中 / 待辦
- **round-2 release/sync/push（Claude Code，待跑）** ← 主。
- `viewer_ref_display_valueless_quiet`（warn 噪音，Claude Code，獨立）。

## 3. 結案 / 不在範圍
- 無時間維資料、維持現狀:TIBC / Fe / Ferritin / AFP / CEA / iPTH（30 人全無做）。
- 報告不印 ref（需手動查手冊）:FreeT4/TSH/Folate/FreePSA/VitB12。

## 4. Parked questions
- 時間版本 vs 真外送他院的自動判別準則。
- validFrom 用「最早觀測日」（保守）— 30pt 收斂後新版定在 2025-06-04（真改版在 2025-05-02~06-04 間）。

## 5. 備忘（本機 sandbox 限制）
- bash sandbox mount 對 hospital-lab repo 檔可能讀到 stale/截斷版（與真實 D:\ 不一致）→ 用 Read/Edit 為準，
  node 驗證受影響時改用 embedded entry + `git show HEAD` 取乾淨檔。opdweb fetch 一律包 AbortController。
