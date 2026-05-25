# Session state — vhyl

> 每次「告一段落」/「離開 vhyl」/「結束 thread / session / 對話」/ 透過含糊語 disambiguate 進 SOP G+J 時 overwrite 本檔。
> 在 vhyl 開新 thread 接續 vhyl(「接續上次」)或在 vhtt 接續 vhyl(「接續 vhyl」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。
> 詞彙明確化(2026-05-19 addendum 3):session / thread / 對話 互通;階段 / 段落 = 工作 chunk;機器 = 物理環境。

---

**Last wrap**: 2026-05-25 13:44(Taiwan)
**Last session type**: Cowork(SOP I resume → 驗證上週 vhtt 進度 + UPCR 增強)
**Last action**: SOP G — 階段段落收尾(thread 不關,本對話可能還繼續或之後新 thread 接續)。本 thread 重點:vhyl 接續驗證上週(2026-05-19 ~ 2026-05-22)vhtt push 的 viewer / patterns / reporter 變更,實際 ship 桶 4-A/B(ABI/Fundus regex 修)+ UPCR / 18 欄重排(slid in 新需求);桶 5 light-touch PASS;桶 3 / 1 / 2 / 4-C 按 YC 順位 deferred。

## 1. 本 thread 完成

工作量:Cowork 端設計 + edit + 直接 ship,3 輪 push 跨兩 repo。

**A. SOP I resume(明確 trigger:「i am in vhyl now」)**
- pre-flight § 1.0 兩台 paste 追蹤:vhyl ✅ up to date(2026-05-19 paste),跳過貼上動作
- § 1.1 環境 sync:三 repo `git pull` 全部 `Already up to date`(vhyl 之前已同步過 vhtt push 的 commits)
- 讀 WORKLOG.md(三 repo,2026-05-19 ~ 2026-05-22 區段)+ Notion Dashboard,整理出五桶 verification 計畫:
  1. 桶 1:meta-rules / SOPs(規則層,5 分鐘)
  2. 桶 2:A5 + visit serial(vhyl 上週已動手 + 列印過,可能 skip)
  3. 桶 3:CKD eGFR staging dispatcher(reporter,費工)
  4. 桶 4:CKD/DM Dashboard + 健檢 CXR(viewer,vhyl-specific 風險最高)
  5. 桶 5:popup imaging cleaning(viewer)
- YC 順位拍板:**桶 4 → 桶 5 → 桶 3 → 桶 1 → 桶 2**

**B. 桶 4-A/B:Dashboard ABI/Fundus regex 修正(vhyl-specific silent miss)**
- YC 提供 16 位 vhyl DM 病人 chartno(000000022G ~ 000003937C)
- popup → Dashboard 16 列 → 觀察:**ABI 全空**(silent miss),其他欄正常
- 診斷:vhyl ABI order name = `四肢血流探測,壓力測量並記錄(YL)`(不含 `ABI` 字、不含 `Doppling ex.`),catalog regex 沒 cover
- 順帶發現 Fundus 有兩個 vhyl 變體:`Fundoscopy(眼底鏡檢查)`(舊 regex cover)+ `Fundus color photo pictureX2(YL)`(舊 regex miss)
- 修法 catalog.js 兩條 regex 加 alternation:
  - ABI:`/\bABI\b|Doppling ex\.|四肢血流探測/i`
  - Fundus:`/Fundoscopy|眼底鏡|Fundus\s+color/i`
- `npm run release` 全綠(88 catalog 不變,dist 51.0 KB)→ viewer `node sync-patterns.js` → Chrome reload → 16 位重 fetch:ABI/Fundus 兩欄都補上日期 ✅
- 2 commits ship:patterns `d4bbef0` + viewer `510782a`(兩 repo WORKLOG 各一條)
- **無寫 Notion**(無 brief 改名 _done 觸發,純 catalog 修正;rule #7 + #11 已在回應內明示)

**C. UPCR + 18 欄重排(slid in 新需求)**
- YC 在驗 ABI/Fundus 後提:DM Dashboard 加 UPCR 欄 + 欄序重排為 `id / name / 最近抽血 / Sugar / HBA1c / EKG / ABI / PVR / 眼底鏡 / UACR / UPCR / eGFR / DM衛教 / DM天數 / EarlyCKD / GFR分期 / preESRD`
- 我先 push back(rule #10 自我複述):桶 4 regex 還沒 commit,UPCR 是另一條獨立工作線,建議 split commit;YC 空回答 → default A(先驗 regex + commit + push,UPCR 另開)
- 寫 brief `TASK_BRIEF_dm_dashboard_upcr_and_reorder.md`(rule #9,18 欄 spec + 16 條測試清單,§4 邏輯 5 + 實機 7 + regression 4)
- YC OK → 編 dashboard.html + dashboard.js(9 個 edit:thead 重排 / extractLatestLabValue UPCR / TaiwanCKD upcrVal / values.upcr / row HTML 18 cols / compareForSort upcr / CSV header + row 20 cells / colspan 17→18 / error colspan 16→17)
- 順手修 pre-existing bug:TaiwanCKD 原硬寫 `UPCR: null` → 改傳 upcrVal,UPCR-only 病人 staging 從此能算
- node --check PASS + 實機 vhyl 16 位 PASS
- 2 commits ship:patterns brief `0695c00`(初次寫 + 直接以 _done 進 git + WORKLOG pointer 一輪,跟 2026-05-20 visit_serial 範式一致)+ viewer dashboard `9d40e88`
- Notion Dashboard 加 Done row(Order **2.95**,viewer repo)— 過程中踩到 2.10 → 2.1 numeric collapse silent failure,主動修正
- **rule #11 兩次主動 flag**:(a) patterns 第一次 commit 沒 git add(brief 是 Write tool 創,還沒進 git tracking);(b) Notion Order numeric collapse

**D. 桶 5:popup imaging cleaning(light-touch 驗證)**
- 給 YC 完整測試 checklist(預期看到 finding/impression、不該看到 letterhead/稽核表單/box 字元)
- YC 簡短回「報告抓取 ok」 — 細部殘留沒明確核對
- task 標 complete,但 **rule #11 標記為 light-touch**(parked 在下方 § 5,vhyl 影像報告若日後格式變需回頭補測)

**E. SOP G wrap(本動作)**
- archive 舊 snapshot(2026-05-20T0318 vhyl wrap)→ `session-state-archive/2026-05-25T1344-vhyl.md`
- overwrite 本檔(本份新 snapshot)
- patterns WORKLOG 加 SOP G pointer 條目

## 2. 本 thread 未完

(無大件未完 — 主目標桶 4-A/B 已 ship,加碼的 UPCR / 桶 5 也 ship)

剩下未動的桶(按 YC 拍板順位 deferred 至下次):

- **桶 4-C:健檢 CXR vhyl 驗證**(deferred 至 YC 確認 vhyl 是否跑健檢業務;若否 → 永久 skip)
- **桶 3:reporter hospital-lab-ckd.html staging 欄**(費工 — 需 bulk-add vhyl stage 3 病人,看 STAGING 7 欄 + csv 多 7 欄)
- **桶 1:meta-rules / SOPs 對齊**(輕 — 5 分鐘 grep CLAUDE.md / PROJECT_CONTEXT.md)
- **桶 2:A5 + visit serial**(vhyl 上週已動手 + 列印過,可能 skip)

本機未 commit(本次 wrap 動作產生):
- `docs/session-state-vhyl.md`(本檔,本次 wrap 新寫)
- `docs/session-state-archive/2026-05-25T1344-vhyl.md`(本次 wrap 新加 archive)
- `WORKLOG.md`(SOP G wrap pointer 條目)

要進下一個 commit。給 YC 的指令見本檔末尾 SOP G Step 5。

## 3. 下次該先做什麼

按 YC 本 thread 開頭拍板的順位:**桶 3 → 桶 1 → 桶 2 → 桶 4-C**

### 桶 3(reporter CKD HTML staging)— **下次先動**

開啟 `hospital-lab-ckd.html`,bulk-add vhyl stage 3 病人(YC 手選 chartno),看:
1. STAGING category 是否出現 7 欄(eGFR / GFRStage / UACRStage / UPCRStage / KDIGORisk / TaiwanCKD / EarlyCKD)
2. 顏色對 KDIGO 階級(normal/mild/moderate/severe)
3. `hospital-lab-dialysis.html` 不出現 staging(regression — 透析 eGFR<15 全紅沒意義)
4. csv 匯出 header 末尾多 7 欄

需要 chartno list — YC 在 vhyl HIS 可查到(找 CREAT + UACR / UPCR 都有抓的病人)。

### 桶 1(meta-rules / SOPs 對齊)— **快速,5 分鐘**

純文件對齊 grep,無實機行為:
- 三 repo CLAUDE.md 都有 § Coding behavior contract A–C
- PROJECT_CONTEXT 有 § 12(Session SOPs)+ § 13(Cowork↔Chat handoff)
- cowork-project-instructions.md 含規則 #7–#12 + Session 切換 trigger 兩段式

### 桶 2(A5 + visit serial)— **可能 skip**

vhyl 上週已動手 + 實機列印 Brother HL-L5100DN PASS。本次只需確認在 vhyl 機器仍 work,UI checkbox mutually-exclusive 行為正常 — 視 YC 是否想驗。

### 桶 4-C(健檢 CXR)— **等 YC 確認**

若 vhyl 玉里完全不跑健檢業務 → 永久 skip 本桶。

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Order | Brief | Repo | Status |
|---|---|---|---|
| 2.5 | viewer 看診序號 overlay (v1.3.0) | viewer | Done |
| 2.6 | viewer A5 landscape (v1.4.0) | cross-repo | Done |
| 2.8 | CKD/DM Dashboard S3 read-only | viewer | Done(vhtt 2026-05-22) |
| 2.9 | popup imaging report cleaning | viewer | Done(vhtt 2026-05-22) |
| **2.95** | **DM Dashboard 加 UPCR 欄 + 18 欄重排** | **viewer** | **Done ✅ 本 thread(2026-05-25)** |
| 3 | labs_<group> storage → IndexedDB | reporter | Done(vhtt 2026-05-13;brief 2026-05-20 補正改名 _done) |
| 4 | CKD eGFR staging dispatcher | reporter | Done(vhtt 2026-05-20) |
| — | viewer 簡化版衛教格式(brief 未寫) | viewer | parked(A5 可能已滿足) |

### 本 thread 未進 Notion 的工作

| 內容 | Commit | Notion 寫入? |
|---|---|---|
| ABI/Fundus regex 加 vhyl alternation | patterns `d4bbef0` + viewer `510782a` | **無**(無 brief 改名 _done 觸發,純 catalog tweak;rule #7 + #11 已明示) |

## 5. Parked questions

**本 thread 新出現 parked**:

- **vhyl 是否跑健檢業務?** — 桶 4-C 等這個確認。是 → 找一位健檢病人驗 CXR 視窗 + 四類影像;否 → 桶 4-C 永久 skip
- **桶 5 light-touch 驗證細部殘留**:YC 只回「報告抓取 ok」,letterhead / 稽核表單 / box 字元殘留 / 空行收斂沒對 checklist 逐項驗。vhyl 影像報告若日後格式變需回頭補測
- **vhyl ABI / Fundus 變體完整性**:本次 cover 兩個變體(`四肢血流探測` + `Fundus color photo`)。vhyl 可能還有其他 order name 變體 — 看後續 Dashboard 實用是否有 silent miss
- **Notion Order numeric 欄填 2.10 會 collapse 成 2.1**(本 thread 踩到 + 主動修為 2.95)— 未來 Order 跨整數小數時要用 2.95 / 2.99 之類唯一非衝突值

**長期 parked(從上 thread 帶來,仍未解)**:
- vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\` — 路徑是?哪種 CLAUDE.md?切 vhtt 時順便問 YC
- YC 提過「我有修改 project instruction, claude.md」— 哪台 / 哪個改了?未釐清
- A5 landscape 列印實機 90° 翻轉 fix 在不同 driver / 不同印表機驗證範圍
- B&W 老印表機 dither (#AAAAAA) 風險
- Brief 集中慣例重議(viewer 工作 brief 放 patterns/docs/task-briefs/ 的直覺性問題)

**Cowork UI paste 兩台狀況(2026-05-25T1344 更新)**:
- vhyl:✅ up to date(本 thread `cowork-project-instructions.md` **未動**,§ 1.0 不重置)
- vhtt:✅(2026-05-20 起 ✅;本 thread 未跨機,vhtt 狀態不變)

**本 thread 學到的 lesson(可考慮存 memory)**:
- **Notion Order numeric collapse** — 2.10 → 2.1 silent rounding,跨整數小數時要用唯一非衝突小數
- **patterns 首次 commit 沒 git add untracked brief** — Write tool 創的檔在 git 是 untracked,`git mv` 對 untracked 會 fatal,要先 `Move-Item` rename 再 `git add` 新路徑
- **規則 #11 silent failure 暴露 vs 用戶簡短回答的 tension** — 本 thread 兩次主動 flag(commit 沒 add / Order numeric collapse),避免使用者下次踩到
