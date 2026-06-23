# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread」/含糊語進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續(「接續上次」)時讀本檔。歷史版本在 `session-state-archive/`。

**Last wrap**: 2026-06-24（深夜，Cowork）
**Last session type**: Cowork
**Last action**: 抓出 ref **時間維(validFrom)系統性錯誤**;修好 ALK-P 當正確範本;其餘待重做。

## 0. ⚠️ 最重要 — 下個 thread 第一件事:vhyl refHistory「時間維」重做

**錯在哪(本 thread 犯的)：**
- 今天把 harvest（000012885I）+ 30-patient ref-scan 的 vhyl ref 落進 catalog 時：
  1. **把「舊日期的 ref 變體」當成外送他院雜訊丟掉** → 其實是**同一台 vhyl、不同時間**的 ref（玉里 lab 會改參考值）。
  2. **validFrom 一律標成「抓取日」**（多數 2026-03-31）→ 比抓取日早的檢驗值配不到 vhyl 筆、掉回 `*` universal，顯示錯誤 ref。
- 實證（ALK-P @ 012885I 跨日期實掃）：
  - 2024-08 ~ 2025-04-15：舊 ref `M40-129,F35-104`
  - 2025-09-22 ~ 2026-06：新 ref `M:50-116,F:46-122`（ref 在 2025/04~09 間改版）
  - 病人最新「有值」的 ALK-P 在 111/11/29(2022) → 該用**舊** ref（F35-104），但 catalog 只有 2026-03-31 那筆 → 掉 `*` 34-130（= YC 看到的 bug）。

**已修(範本)：** ALK-P 的 vhyl 改成**兩筆時間版本**：
- `{vhyl, refLoM:40,refHiM:129,refLoF:35,refHiF:104, refLo:35,refHi:129, validFrom:'1900-01-01'}`（舊；真正起始未知→1900 migration base）
- `{vhyl, refLoM:50,refHiM:116,refLoF:46,refHiF:122, refLo:46,refHi:122, validFrom:'2025-09-22'}`（新；earliest observed 2025-09-22，原誤標 2026-03-31）
- 在 working tree（未 release/sync/push）。

**正確方法(下個 thread 照做)：**
1. 對每個 in-scope test，掃**所有 30 id × 所有歷史報告（ernode offset 翻頁）**，每筆抓 opdweb `報告時間`(西元)＋ analyte 的 ref 字串。
2. 聚合：analyte → ref字串 → [報告日清單]，取每個 ref 版本的**最早日**。
3. 建時間版本 refHistory：最舊版 validFrom='1900-01-01'，後續版本 validFrom=該版本最早出現日。性別 inline 照舊。
4. **區分「時間版本」vs「真外送他院」**：時間版本 = 某日期之後全換新 ref（乾淨邊界）；外送 = 散落單筆、ref 格式異（如新南海）。後者不落 vhyl。
5. 修掉今天所有 vhyl 筆被誤標的 validFrom（多數 2026-03-31 / 2026-06）。
6. release + viewer/reporter sync + push（rule #3 先問）。

技法備忘（本 thread 已驗，可重用）：
- Claude in Chrome 同源 fetch：tab 在 **opdweb** origin 時，`fetch` ernode + opdweb **都通**（opdweb→ernode 不擋；ernode→opdweb 擋）。
- opdweb 報告解析：先抓 ref 行（`M:..-..` / `..-..` / `<N` / `<50years`），往回跳 value/unit 行找 analyte；單項免疫報告（FreeT4/TSH/PSA…）**常不印 ref**，跳過。
- 併發會炸 → 序列 + ~120ms 節流;一次 JS 跑 ≤6 病人(>6 易撞 45s CDP timeout)。

## 1. 本 thread 完成（已 push）
- SOP I 接續(pre-flight vhyl ✅)。
- 000012885I harvest:29 test vhyl refHistory + BUN 年齡帶 → push。**(validFrom 有上述時間維瑕疵,待重做)**
- age-dim brief：step #2 真機驗收過 → `_done` + Notion Done。
- 30-patient ref-scan：修 P(off-by-one 誤植 Mg→2.5-4.5)+ 新增 TSAT/TIBC/AFP/CEA → push。**(validFrom 同瑕疵)**
- viewer machine 設定釐清:`chrome.storage.local.currentMachine` 要設 vhyl(YC 本機已是 vhyl)。

## 2. 本 thread 未完
- **vhyl refHistory 時間維重做**（見 §0,下個 thread 主任務）。
- ALK-P 時間版本修正在 working tree,**待 release/sync/push**(或併進 §0 重做一起 push)。
- warn brief `TASK_BRIEF_viewer_ref_display_valueless_quiet.md`（已寫,working tree,待 commit/push + 交 Claude Code;與此 bug 無關的 console 噪音）。

## 3. 下次該先做什麼
1. （主）§0 的 vhyl refHistory 時間維重做。
2. ALK-P 修正 + 重做結果一起 release/sync/push。
3. commit/push warn brief，排進 Notion，交 Claude Code。

## 4. Active TODOs（以 Notion Dashboard 為準）
- vhyl ref 時間維重做（新，未建 brief — 可考慮建一條 TASK_BRIEF）。
- `viewer_ref_display_valueless_quiet`（warn 噪音,Claude Code）。
- ref 抓不到的 test（報告不印 ref）：FreeT4/TSH/Folate/FreePSA/VitB12/Ferritin → 需手動查手冊。
- cohort 未出現:iPTH/Aluminum/CA19-9/CA125/PSA。

## 5. Parked questions
- 時間版本 vs 外送他院的自動判別準則（目前靠日期邊界 vs 散落）。
- validFrom 要用「該版本最早觀測日」還是回推真正改版日（目前用最早觀測日,保守）。
- `ORDAPNO → opdweb` 全自動串接仍待 Claude Code。
