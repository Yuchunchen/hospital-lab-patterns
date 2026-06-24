# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread」/含糊語進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續(「接續上次」)時讀本檔。歷史版本在 `session-state-archive/`。

**Last wrap**: 2026-06-24 19:55 TPE（Cowork / SOP G+J — 結束 thread，開新 thread 接續）
**Last session type**: Cowork（只跑 SOP I 開機 + 等 env sync；新 15 掃描未開始）
**Last action**: round-2/3 catalog delta YC 確認已 release+push（Claude Code）。本 thread 接「新 15 掃描」但只跑到 SOP I 開機程序就結束，掃描尚未動工。

## 0. ⚠️ 最重要 — 下一件事:接續「新 15 掃描」（第 4 批 cohort）

掃描檔:`ref-timedim-2026-06-24/resume-new15.md`（完整續掃步驟 + resume 機制在此）。
目的:驗證/補蓋 catalog（目前 round-2/3 已 ship，30pt 穩定；前 3 人只 confirm 不改）。

**進度**（resume 全靠 vhyl 本機瀏覽器 localStorage，已確認同機）：
- ✅ main 已掃完 3 人:000026205F / 000020873B / 000032800H（errors=0）
- ⏳ 進行中 1 人:000026451H（cursor 在 localStorage `cur_000026451H`）
- ⬜ main 未掃 11 人:000040460E 000048134F 000001930H 000047043J 000044891J 000141511I
  000005714H 000142680I 000054312E 000010085G 000108769A
- ⬜ iron/tumor（PB2）這 15 人**全未做**（__phaseA2 收 target → PB2.run）
- 已驗（前 3 人）:catalog 不變。唯一 nudge:GOT v3 earliest 2026-02-02 → **2026-01-20**（patient1，極小）

**新 thread 開掃步驟**:依 `resume-new15.md`「新 session 開掃步驟」— Claude in Chrome 開 opdweb+ernode
兩 tab → 貼 harvester.js 重建 PB/PB2（自動讀回 REFAGG/REFAGG2/cursor）→ main 續掃 → PB2 iron/tumor →
抓 REFAGG/REFAGG2 比對 catalog。有變才 Cowork 改 catalog.js（小半徑）交 Claude Code release。

## 1. 已完成（前序 thread，git 端為準）
- round-1（3 病人）catalog.js → release + 三 repo push（33 測試，Notion Done）。
- exhaustive 30/30 掃完（errors=0，103 analytes）→ 收斂結果見 `ref-timedim-2026-06-24/harvest-results.md`。
- round-2 + round-3 catalog.js delta（邊界 2025-06-04、GOT v3 2026-02-02、r-GT 兩版、TSAT@1900、
  Fe/TIBC/AFP/CEA 修正/Ferritin）→ **YC 確認已 release+push**（brief 已 _done）。
- 本 thread:SOP I 開機（pre-flight vhyl §1.0 ✅、讀狀態檔）完成；新 15 掃描未開始。

## 2. 進行中 / 待辦
- **接續新 15 掃描** ← 下一個 thread 主線（見 §0）。
- `viewer_ref_display_valueless_quiet`（warn 噪音，Claude Code，獨立，未動）。
- ⚠️ **git 端兩處 stale 待補**（本 thread 未改，留給下個 thread 或 Claude Code）：
  1. patterns `WORKLOG.md` 缺 round-2/3 **release/push 確認條目**（rule #2）；現有 round-2/round-3 條目仍寫「待 Claude Code release」。
  2. round-2 brief Notion Dashboard 列狀態本 thread **無法驗證/更新**（query 被 Notion 方案擋，需 Business+AI）→ 確認 Claude Code push 後有把該列改 Done。

## 3. 結案 / 不在範圍
- 無時間維資料、維持現狀:iPTH（30 人全無）；FreeCa（值同 universal，@1900）。
- 報告不印 ref（需手動查手冊）:FreeT4/TSH/Folate/FreePSA/VitB12。

## 4. Parked questions
- 時間版本 vs 真外送他院的自動判別準則。
- validFrom 用「最早觀測日」（保守）；新 15 掃若觀測到更早 new 日 → 需再下修邊界。

## 5. 備忘（本機 sandbox 限制）
- bash sandbox mount 對 hospital-lab repo 檔可能讀到 stale/截斷版（與真實 D:\ 不一致）→ 用 Read/Edit 為準，
  node 驗證受影響時改用 embedded entry + `git show HEAD` 取乾淨檔。opdweb fetch 一律包 AbortController。
- Notion Dashboard query（SQL/view mode）受方案限制讀不到行資料 → 只能用 fetch 看 schema；狀態以 git 端為 canonical。
