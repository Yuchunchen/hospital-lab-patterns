# Session state — vhtt

> 每次在 vhtt 觸發「階段完成」/「離開 vhtt」/「結束 session」時 overwrite 本檔。
> 在 vhtt 開新 session 接續 vhtt(「接續上次」)或在 vhyl 接續 vhtt(「接續 vhtt」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-05-20 ~24:00
**Last session type**: Cowork + Claude Code
**Last action**: CKD eGFR staging dispatcher 完工（Order 4），三 repo push + Notion 同步 + SOP G/J wrap

## 1. 本 session 完成

- `TASK_BRIEF_labs_storage_indexeddb` 收尾：brief 漏 commit 補正（git rename → `_done` + push）+ Notion Dashboard Done
- `TASK_BRIEF_ckd_egfr_staging`（Order 4，Claude Code 執行）：
  - Phase A：`core/compute.js` registry-driven dispatcher 重構（hardcoded URR/CaxP → iterate COMPUTATIONS）
  - Phase B：`core/ui-lab-view.js` staging 渲染 + KDIGO 配色（綠/黃/橙/紅）+ `groups/early-ckd.js` 加 7 staging ids
  - Phase C：CKD CSV export 加 staging 欄
  - patterns `computed.js` URR/CaxP naming 對齊 + REPORTER_COMPUTED 2→9 條
  - viewer sync refresh（行為不變）
  - Node smoke test 通過；瀏覽器端未驗
- Notion § 1.0 paste 追蹤：vhtt → ✅ up to date（2026-05-20）
- Notion Dashboard：全部 brief Done，零 Open

## 2. 本 session 未完

- **CKD 瀏覽器端實機驗證**（brief 測試清單 #6–#8）：
  1. CKD HTML bulk-add 已知 stage 3 病人 → staging 欄出現、顏色合理
  2. Dialysis HTML 不出現 staging（regression check）
  3. CKD CSV export 末尾多 7 欄 staging
- birthDate 正確版 eGFR：目前用 current age，歷史 eGFR 有些微誤差。ernode 若有 birthDate 可升級（低優先）

## 3. 下次該先做什麼

1. CKD 實機驗證（上述 #6–#8），Cowork + Claude in Chrome 即可
2. 驗證通過後規劃下一個 TASK_BRIEF（新 disease group / birthDate eGFR / 其他）

## 4. Active TODOs（snapshot at wrap；以 Notion Dashboard 為準）

全部 Done（10 條）。零 Open / In-progress / Blocked。

## 5. Parked questions

- ernode 是否提供 birthDate？若有，eGFR 可升級為 per-date 精確年齡計算
- reporter `file://` origin 下 sub-page fetch CORS blocked（Aluminum 不需 sub-page 目前無感，未來新 test 可能觸發）
