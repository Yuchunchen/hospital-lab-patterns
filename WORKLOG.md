# WORKLOG

Chronological log of pattern catalog changes. Newest entries on top.

Each entry should include:

- **Date** (YYYY-MM-DD)
- **Author** (your initials, or `claude` for Claude-driven sessions)
- **Hospital scope** (tt / yl / both)
- **Test ID(s)** affected
- **Change** (added / updated / removed)
- **Rationale** (one or two sentences)
- **Validation** (sample value the regex captured, e.g. `WBC: 6.87` → `6.87`)

---

## 2026-05-07 — gitignore 加 TASK_BRIEF / TASK_revision_BRIEF

- 作者：claude（與 YC 共同）
- 範圍：—（gitignore 一致性）
- 變更：修改
- 測試 ID：—
- 原因：sibling `hospital-lab-viewer` / `hospital-lab-reporter` 兩端
  `.gitignore` 都早已忽略 `TASK_BRIEF*.md` / `TASK_revision*_BRIEF*.md`
  （per-task hand-off brief，不入庫）。本 repo 漏了這條，每次 cowork
  寫 brief 進這裡都會以 untracked 浮現。本輪補齊一致性。
- 驗證：`git status` 不再列出 root 的 `TASK_BRIEF_subpage_enrichment.md`。
- 影響：完工 brief 仍依規則 #6 改名 `_done` 並搬到 `docs/task-briefs/`。
  pattern 用 `/TASK_BRIEF*.md` 開頭錨定 repo root，所以
  `docs/task-briefs/TASK_BRIEF_*_done.md` 不會被 ignore，可正常 commit。

---

## 2026-05-07 — Claude Code 改為從 workspace root 啟動 + workspace CLAUDE.md template

- 作者：claude（與 YC 共同）
- 範圍：docs（新增 1 + 修改 4；workspace 機制定義）
- 變更：新增 workspace-claude-md-template + 校正 4 份既有文件
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 收尾本日（2026-05-07）的文件大整理。前面三輪 commit
（`6a4f6c8` v0.3 校正 + 4 份 SOP；`19ee557` 加規則 #7；`a42f5be` 搬位置
+ 規則 #6 重寫）之後，發現操作層面還有一個漏洞：Claude Code 一直以來
都是 `cd <single repo>` + `claude`，每次只能看一個 repo，跨 repo 改動
要重複 cd / exit / re-enter。實務上 patterns + viewer + reporter 三個
repo 經常一起改，這種逐個切換很沒效率。本輪定義「workspace root」
機制 — Claude Code 永遠從 `D:\self\hospital-lab` 啟動，由其自行 cd
到各 repo。

**設計重點：**

- **新增 workspace CLAUDE.md template**：`docs/workspace-claude-md-template.md`
  作為 source of truth。內容包含 (a) 三個 repo 的角色說明；(b) 跨 repo
  工作順序（patterns → viewer → reporter）；(c) full release + sync
  cycle 範例命令；(d) 7 條強制規則摘要；(e) 指向 PROJECT_CONTEXT.md
  的深度參考。**workspace root 的 CLAUDE.md 不屬於任何 repo**（不 git
  track），是本機 workspace 設定。每台新機器 clone 完三個 repo 後從
  template 複製一次。
- **bootstrap.md Phase 2 加 workspace CLAUDE.md 步驟**：clone 完三個
  repo 之後，從 template 複製成 workspace root 的 `CLAUDE.md`。
- **PROJECT_CONTEXT.md §10.7 Mode split + Hand-off pattern 重寫**：
  加 「Claude Code 執行方式」小節（強調永遠從 workspace root 啟動），
  hand-off diagram 從「PowerShell, in repo root」改為「PowerShell, 從
  workspace root」，並加註各 repo 分別 commit、一起 push 的 flow。
- **cowork-project-instructions.md Modes 段同步**：「Claude Code — 從
  workspace root 啟動，一次跨 3 repo 操作」（取代原本「git、跑
  sync-patterns」單行說明）。
- **sop-claude-code-guide.md 步驟 1 重寫**：刪掉「方法 A / 方法 B」
  二選一寫法，改為「永遠從 workspace root 啟動」單一指令路徑，並警告
  不要 cd 進單一 repo 跑 claude。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 僅 synced_at 時間戳
  差異，已 checkout 還原。
- workspace CLAUDE.md 已實際運行測試：本輪 commit 就是從 workspace
  root 啟動 Claude Code 跨 3 repo 操作完成的（自我驗證）。

**影響：**

- 新機器設定：bootstrap.md Phase 2 多一步「複製 template」，但省下後續
  每次跨 repo 工作都要逐個 cd 的時間。
- 既有機器：已存在 workspace root CLAUDE.md 的機器無變化；沒建立的
  機器下次需依 bootstrap Phase 2 補建。
- sibling repo 不需 sync，OPD viewer 無變化；patterns 沒動。

---

## 2026-05-07 — 文件大整理：BOOTSTRAP / COWORK_PI 搬進 docs/ + 規則 #6 重寫

- 作者：claude（與 YC 共同）
- 範圍：docs（檔案搬移 + 路徑引用校正 + 規則重寫）
- 變更：搬移 2 + 修改 5
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 收尾本日（2026-05-07）的文件大整理。前兩輪 commit（`6a4f6c8`
v0.3 校正 + 新增 4 份 SOP；`19ee557` 加規則 #7）之後，發現 repo root
還散著兩份「明明是 docs」的檔案（`BOOTSTRAP.md`、`COWORK_PROJECT_INSTRUCTIONS.md`），
而且 `cowork-project-instructions` 內的規則 #6（TASK_BRIEF _done 改名）
只寫了一行，沒涵蓋實務上的分層更新邏輯（CLAUDE.md / PROJECT_CONTEXT.md
誰要動、其餘 docs 何時動）。本輪一口氣搬位置 + 重寫規則 #6 + 同步所有
路徑引用。

**設計重點：**

- **搬移**：兩份檔搬進 `docs/`（git 自動偵測為 rename，history 保留）：
  - `BOOTSTRAP.md` → `docs/bootstrap.md`
  - `COWORK_PROJECT_INSTRUCTIONS.md` → `docs/cowork-project-instructions.md`
- **規則 #6 重寫為分層更新策略**（取代原本一行式說明）。新版分 5 點：
  (a) `_done` 改名 + 集中搬到 `hospital-lab-patterns/docs/task-briefs/`；
  (b) brief 原在 sibling repo（gitignored）時的處理；
  (c) 與當輪最後一個 commit 同一輪做掉；
  (d) **同時更新** `CLAUDE.md`（若架構/行為變了）與 `PROJECT_CONTEXT.md`
  （加 milestone）；(e) **其餘 `docs/` 文件留到 major revision 再整批校正**
  — 避免每次小改都觸發大量周邊 doc 更新。
- **路徑引用同步**：`README.md`、`PROJECT_CONTEXT.md`、`CLAUDE.md` 三檔
  把對 `BOOTSTRAP.md` / `COWORK_PROJECT_INSTRUCTIONS.md` 的舊路徑全改成
  `docs/bootstrap.md` / `docs/cowork-project-instructions.md`。
- **SOP 文件小修**：`docs/sop-cowork-guide.md` / `docs/sop-claude-code-guide.md`
  也順手對齊新路徑（前兩輪 commit 寫好的版本裡引用了舊 root 路徑）。
- **不動 patterns**：純 docs commit，`patterns/*.js` / `dist/patterns.json`
  零異動，sibling repo 不需 sync。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 僅 synced_at 時間戳
  差異，已 checkout 還原。
- `git status` 顯示：兩個 `R` rename + 5 個 `M`，符合預期；BOOTSTRAP /
  COWORK_PI 在 root 已不存在，docs/ 下出現對應新檔。

**影響：**

- repo 結構：root 只剩專案級 README / CLAUDE / PROJECT_CONTEXT / WORKLOG
  / package.json 等，所有人類向操作手冊都收進 `docs/`。
- Claude（本身）行為：下次依新版規則 #6 處理 TASK_BRIEF 完工搬遷 +
  分層 doc 更新；不再每輪都被逼著校正所有周邊 docs。
- sibling repo 不需 sync，OPD viewer 無變化。

---

## 2026-05-07 — Cowork project instructions 加規則 #7（回覆加中文註解）

- 作者：claude（與 YC 共同）
- 範圍：docs（COWORK_PROJECT_INSTRUCTIONS.md）
- 變更：修改（在強制規則段落新增第 7 條 + footer 同步日期 2026-05-06 → 2026-05-07
  + history 表新增一列）
- 測試 ID：—（純文件，無 catalog 異動）

**觸發：** 使用者在 Cowork UI 端把 project instructions 加了第 7 條規則
「回覆時在關鍵段落或結論旁加上簡短繁體中文註解（一句話），方便快速瀏覽；
文件內容本身維持英文」。本檔是 portability snapshot，UI 改了就必須同步
本檔，避免 drift（這個慣例本身寫在檔案開頭）。

**設計重點：**

- 規則 #7 適用「Cowork 對話回覆」場景；不影響 repo 內既有英文文件、
  程式碼註解、commit message 風格。
- WORKLOG（本檔）本來就是繁體中文，不受規則 #7 直接影響。
- 純 docs commit；`patterns/*.js` / `dist/patterns.json` 全無異動，sibling
  repo 不需 sync。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 1 track-only（Mg）。dist/patterns.json 只有 synced_at 時間戳
  差異，已 checkout 還原。

**影響：**

- 純 Cowork 端行為調整（影響 Claude 回覆風格），repo 行為與 OPD viewer
  皆無變化。

---

## 2026-05-07 — 文件校正 + 新增 4 份中文 SOP（docs only，不動 patterns）

- 作者：claude（與 YC 共同）
- 範圍：docs（README、PROJECT_CONTEXT、learning-workflow、pattern-spec、
  hospital-differences）+ 新增 docs/sop-cowork-guide.md、
  docs/sop-claude-code-guide.md
- 變更：修改既有文件 + 新增 2 份 SOP 檔（含 4 個 SOP）
- 測試 ID：—（純文件變更，無 catalog / regex 異動）

**觸發：** Cowork 端做完了一輪文件對齊：(a) 把 README / PROJECT_CONTEXT
裡的 counts 從舊的 69/54 更新到 v0.3 實際數字 74 catalog · 60 viewer · 37
reporter；(b) learning-workflow.md 從 v0.2 提到 v0.3 並把 quick refresher
的數字、computed 條目數對齊；(c) pattern-spec.md 補上 2026-05-05 SOP G
新加的 `loM` / `hiM` / `loF` / `hiF` 四個欄位、gender-aware fallback 規則
與已遷移清單；(d) hospital-differences.md 把舊 "empty / TBD" 占位移除，
列出 2026-05-05 五批修正期間實際確認的 6 筆 vhtt vs vhyl label 差異；
(e) 新增兩份中文 SOP 文件：sop-cowork-guide.md（SOP-CW1 Cowork 基本操作 +
SOP-CW2 pattern learning via Chrome）與 sop-claude-code-guide.md（SOP-CC1
Claude Code 基本操作 + SOP-CC2 Cowork ↔ Claude Code hand-off 流程）。

**設計重點：**

- 純文件變更，不動 `patterns/*.js`，所以 `dist/patterns.json` 不需重 build
  入庫（本輪 release 跑出來只有 `synced_at` 時間戳差異，已 checkout 還原，
  避免污染 commit diff）。
- 兩份新 SOP 只是把現有 PROJECT_CONTEXT.md §9 / CLAUDE.md 既定流程拆成
  獨立、可單獨閱讀的中文操作手冊，方便新機器（如 vhtt 桌機）使用者直接
  照步驟跑，不需先讀整份 PROJECT_CONTEXT。
- pattern-spec.md 的 gender-aware 段落把 SOP G validate 規則明文化：
  「若任一 `loM/hiM/loF/hiF` 存在，`lo/hi` 必須存在作 fallback」。

**驗證：**

- `npm run release` 全綠：74 catalog · 60 viewer · 37 reporter · 13
  computed · 2 normalizers · 1 track-only（Mg）· dist/patterns.json
  39.3 KB（內容無實質變化，僅 synced_at 時間戳，已還原）。
- 文件交叉檢查：README、PROJECT_CONTEXT、learning-workflow 三處的 catalog
  / viewer / reporter counts 一致（74 / 60 / 37）；pattern-spec 中列的
  已遷移 entry 清單與 catalog 實際情形一致。

**影響：**

- 純 docs commit，**sibling repo 不需 sync**（catalog / computed /
  normalizers / dist 全無異動），OPD viewer 不會有任何行為變化。
- 兩份新 SOP 是對使用者（YC）的操作參考，不影響 Claude 自身行為（強制
  規則仍以 Cowork Custom Instructions 與 per-repo CLAUDE.md 為準）。

---

## 2026-05-06 — EarlyCKD 非 CKD 時回傳「正常」(視覺一致性)

- 作者：claude（與 YC 共同）
- 範圍：computed、runtime-snapshot
- 變更：修改 `patterns/computed.js` 的 `EarlyCKD()`，把 `tw === '正常'`
  分支從 `return null` 改成 `return '正常'`；其餘行為不動。
- 測試 ID：EarlyCKD
- 原因：使用者在 OPD 看到病患 000151649A 三筆紀錄裡，「慢性腎臟病分期」列
  顯示 正常 / 第一期 / 正常，但「健保 CKD 分群」列顯示 空白 / P1 早期 / 空白，
  兩列視覺不一致，誤以為系統漏抓。改後 EarlyCKD 在「沒抽 eGFR」時仍空白，
  其餘狀態都會出值（正常 / P1早期 / P2中晚期）。
- 驗證：`npm run release` 全綠（74 catalog · 60 viewer · 37 reporter ·
  13 computed · dist/patterns.json 39.3 KB）；spec 抽樣：
  `EarlyCKD({TaiwanCKD:'正常', eGFR:95})` → `'正常'`、
  `EarlyCKD({TaiwanCKD:'第一期', eGFR:95})` → `'P1早期'`、
  `EarlyCKD({TaiwanCKD:'第三期 3b', eGFR:35})` → `'P2中晚期'`、
  `EarlyCKD({TaiwanCKD:null, eGFR:null})` → `null`。
- 影響：viewer 與 reporter 都要重跑 `node sync-patterns.js` 以取得新版
  `patterns-computed.js`；viewer 還需手改 `report.js` 的 client-side
  pairing 迴圈（`if (!twCKD)` 分支多 push 一筆 EarlyCKD 正常 cell）並
  更新 `CLAUDE.md` line 42 / `ckd_staging.svg` line 189 兩處說明，
  以及重打包 zip + 寄發 viewer 更新通知 Draft。OPD 端 dist/patterns.json
  推上 main 後 24 小時內自動拿到。

---

## 2026-05-06 — viewer manifest 切換到肝炎 *Display(Item B Phase 1.5)

- 作者：claude(與 YC 共同)
- 範圍:viewer-manifest、runtime-snapshot
- 變更:viewer manifest 把 `HBsAg`、`AntiHBs` 兩條改成 `HBsAgDisplay`、
  `AntiHBsDisplay`(套 catalog 預設,不再用 manifest 端 `computed:'HBsAg'` /
  `pattern:null` / `singleValue:true` override);新增 6 條 raw extract-only
  entry(`HBsAg`、`HBsAgTiter`、`AntiHBs`、`AntiHBsTiter`、`AntiHCV`、
  `AntiHCVTiter`)讓 viewer 的 parse loop 抓得到原始定性 + 滴度供
  computed wrappers 取用。HCV 條目不動(catalog 端已補 needs)。
- 測試 ID:HBsAgDisplay、AntiHBsDisplay、HCV、HBsAg、HBsAgTiter、
  AntiHBs、AntiHBsTiter、AntiHCV、AntiHCVTiter

**觸發:** Phase 1 已把 catalog + computed 改好,但 viewer 端 manifest
還指向舊 id。本輪只動 patterns repo 的 viewer 端 manifest,讓 OPD viewer
透過 `dist/patterns.json` 24h 內拿到新映射。viewer repo 端的 `report.js`
findHepatitis / findAntiHBs 拆除 + dispatcher 加上,留到 Phase 2 viewer
那一輪做(因為改到 viewer code 必須在 sibling repo 內)。

**設計重點:**

- viewer 的 `pattern-loader.js` `buildTestMap` 只 resolve viewer manifest
  ✕ catalog,所以不在 manifest 內的 catalog entry 不會被抓。確認後決定
  把 6 條 raw entry 加到 manifest;為了讓它們不被 render,沿用 viewer
  既有的 page-filter 慣例(`tests.filter(t => t.page === pageNum)`,
  report.js:752)— 不寫 `page` 就會自動跳過 render,但 parse loop 仍會
  跑 `text.match(test.pattern)`(report.js:141-173 不依賴 page)。比
  brief 提的 `extractOnly:true` 字面欄位更乾淨,不需新增 schema 欄位。
- HBsAgDisplay / AntiHBsDisplay 的 manifest entry 從原本的「全 override」
  退化成只指定 `page:1, col:4, section:'肝炎'`;catalog 已備好 `computed`、
  `needs`、`singleValue:true`、`pattern:null`,沿用即可。

**驗證:**

- `npm run release` 全綠:74 catalog · 60 viewer · 37 reporter
  (viewer 從 54 → 60:+8 新加,-2 舊的 HBsAg/AntiHBs);track-only
  從 6 條剩 1 條(只剩 Mg,5 條肝炎相關全進了 viewer manifest)。
- `node -e` 直接打 resolved entry 確認 `lib.byId('HBsAgDisplay').needs`
  = `['HBsAg','HBsAgTiter']`、`AntiHBsDisplay.needs` =
  `['AntiHBs','AntiHBsTiter']`、`HCV.needs` = `['AntiHCV','AntiHCVTiter']`,
  `computed` 欄位也都有。
- dist/patterns.json 重 build(39.3 KB)。

**影響:**

- 這次 push 之後 OPD viewer 會在 24h 內拿到新 viewer manifest。但 viewer
  端 `report.js` 還用 `findHepatitis()` / `findAntiHBs()` 用舊 id
  (`map['HBsAg']` / `map['AntiHBs']`)寫結果;新 manifest 已改用
  `HBsAgDisplay` / `AntiHBsDisplay` 渲染 → **這段時間若沒同步更新
  viewer code,肝炎欄會渲染空白**。
- 因此 Phase 1.5 push 完不要等 24h,**馬上接 Phase 2**(進 viewer repo
  改 report.js + 重打包)。否則 OPD 端會出現短暫渲染破損。

---

## 2026-05-06 — 肝炎顯示集中化(Item B Phase 1)

- 作者：claude（與 YC 共同）
- 範圍：catalog、computed、runtime-snapshot
- 變更：新增 5 條 entry（3 raw titer + 2 computed display）+ 補 HCV.needs
  + AntiHBs regex 對齊到 vhyl 樣式;computed.js 新增 _hepatitisDisplay
  helper 與 HBsAgDisplay/AntiHBsDisplay/HCV 三個函式並註冊到 COMPUTATIONS。
- 測試 ID：HBsAg、AntiHBs、AntiHCV、HBsAgTiter、AntiHBsTiter、AntiHCVTiter、
  HBsAgDisplay、AntiHBsDisplay、HCV

**觸發：** TASK_BRIEF.B.md — viewer `report.js` 的 `findHepatitis()` 與
`findAntiHBs()` 硬編了一套跟 catalog 重複的肝炎 regex,vhyl/vhtt 變體要兩邊
同步維護(2026-05-05 Issue 1 收尾的 backlog 第 2 條)。本輪 Phase 1 把所有
肝炎 regex 集中到 catalog,並把顯示邏輯(Reactive→帶原 / 正常 / 有抗體)
寫進 patterns/computed.js,作為單一來源。viewer 端的搬遷留到 Phase 2。

**設計重點：**

- catalog 改為「raw qualitative + raw numeric titer + computed display」
  三層結構。reporter 維持用 raw qualitative 顯示原始 `Non-Reactive` 文字;
  viewer 的 manifest 改指向 computed display 條目(Phase 2 才動)。
- Anti-HBs 的 polarity 與 HBsAg / Anti-HCV 相反:Reactive=有抗體=`normal`,
  Non-Reactive=無抗體=`warning`。`_hepatitisDisplay` 用 `polarity:'antibody'`
  / `'antigen'` 參數切換,共用一份字串組合邏輯。
- AntiHBs 原本 regex `/Anti-HBs(?:\(TT\))?:\s*(\S+)/` 抓不掉 vhyl
  「Anti-HBs: 245.5Anti-HBs (YL): Reactive」這種黏連格式(會抓到
  `245.5Anti-HBs`)。本輪對齊到 HBsAg / AntiHCV 同款
  `/Anti-HBs\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/`,vhyl 與 vhtt 都正確。
- HBsAgTiter / AntiHBsTiter / AntiHCVTiter 用 `[\d.]+` 自然停在後接的字母
  `H` / `A`(vhyl 的 "0.21HBsAg"、"0.12Anti-HCV" 黏連格式)。
- 5 條新 entry 暫時不在任何 manifest 內,validate 顯示為 track-only
  (預期行為,Phase 2 viewer 接手後 5 條全進 viewer manifest)。
- HCV 既有 catalog entry 補 `needs:['AntiHCV','AntiHCVTiter']`,把原本
  「name 在 catalog,實作在 viewer」的斷裂修起來。

**驗證：**

- `npm run release` 全綠:74 catalog · 54 viewer · 37 reporter;
  dist/patterns.json 重 build(39.2 KB)。
- 暫存 spec `scripts/hep-display-spec.js` 跑 26 個 assertion(vhyl 9 +
  vhtt 9 + 邊界 8)全 PASS,涵蓋:
  - vhyl 黏連格式 "HBsAg: 0.21HBsAg (YL): Non-Reactive"
    → HBsAgDisplay = `正常 (HBsAg 0.21)` tag:normal
  - vhtt 樣式 "HBsAg(TT): Reactive" → `帶原 (HBsAg 1.85)` tag:warning
  - antibody polarity:Reactive → `有抗體` tag:normal
  - titer 缺值不附括號;異常文字 → caution 帶原文;qualitative 空 → null
- 全 PASS 後依 brief 指示已刪除 spec 檔。

**影響：**

- viewer 與 reporter 兩個 sibling repo 的 `sync-patterns.js` 都應該
  重跑(catalog 與 computed.js 都改了)並重新打包推送。
- OPD viewer 24h 內透過 `dist/patterns.json` 自動拿到新 catalog,但
  **viewer 端 report.js 的 `findHepatitis()` / `findAntiHBs()` 仍硬編
  舊 regex**,這部分要等 Phase 2 viewer 改完才會徹底切過去。Phase 1
  本身對既有 viewer 行為無破壞性。

---

## 2026-05-06 — GPT/RGT/BUN/CREAT/UA 加 gender-aware hi（沿用 SOP G）

- 作者：claude（與 YC 共同）
- 範圍：catalog、runtime-snapshot
- 變更：5 條 entry 補 `hiM` / `hiF`（不加 lo 系列）
- 測試 ID：GPT、RGT、BUN、CREAT、UA

**觸發：** 收尾 2026-05-05 Issue 1 backlog 第 1 條。剩下 5 條 catalog entry
原本 `hi` 鎖男性、`lo:null`，女性中段值會「漏 alarm」（不誤判但少警示）。
本輪沿用 5 月 5 日已建好的 schema 機制（loM/hiM/loF/hiF + lo/hi fallback）
把它們補上，只動 patterns repo。

**設計重點：**

- 5 條原本都 `lo:null`、只 alarm 高邊；本輪維持醫學意圖**只加 `hiM`/`hiF`**，
  不引入低值 alarm。
- BUN 的 fallback `hi:25.7` 是原作者對「男性 ULN 20.6」加的軟緩衝，unknown
  gender 時保留；已知性別則精準用 `hiM:20.6` / `hiF:18.7`（這是預期的設計
  緊縮，不是 regression）。
- 其他 4 條的 fallback `hi` 等於男性 hi，跟原值一致，unknown gender 行為不變。

| ID | hiM | hiF | hi (fallback) | lo |
|---|---|---|---|---|
| GPT | 45 | 34 | 45 | null |
| RGT | 55 | 38 | 55 | null |
| BUN | 20.6 | 18.7 | **25.7（軟緩衝保留）** | null |
| CREAT | 1.2 | 1.0 | 1.2 | null |
| UA | 7.7 | 6.2 | 7.7 | null |

**驗證：**

- `npm run release` 全綠：69 catalog · 54 viewer · 37 reporter；
  dist/patterns.json 重 build（37.3 KB）。
- 暫存 spec `scripts/gender-threshold-2.js` 跑 15 個樣本 + 5 條欄位存在性檢查
  → 20/20 PASS：
  - 男 GPT 40 → NORMAL；男 GPT 50 → HIGH
  - 女 GPT 30 → NORMAL；女 GPT 40 → **HIGH（關鍵 case，本輪修補）**
  - 男 BUN 25 → HIGH（gender-aware 緊縮：hiM=20.6）
  - 男 BUN 19 → NORMAL；女 BUN 19 → HIGH
  - unknown gender BUN 25 → NORMAL（fallback 25.7 軟緩衝）；BUN 26 → HIGH
  - CREAT/UA 同模式抽驗通過
- spec script 通過後已刪除（CLAUDE.md 暫存物清理慣例）。

**不動的東西：** schema.js（5 月 5 日已加四欄 optional）、viewer / reporter
manifest（這 5 條不需 override）、normalizers / computed。

**影響：**

- patterns repo push 後 OPD viewer 24 小時內透過 dist/patterns.json 自動拿到
  新 hiM/hiF 欄位；report.js valueStyle() 已是 gender-aware，直接吃。
- sibling repo (`hospital-lab-viewer` / `hospital-lab-reporter`) 應重跑
  `node sync-patterns.js` 把 5 條 entry 的 hiM/hiF 同步進 mapping.js / inline
  pattern block，再各自重新打包推送。**本輪只動 patterns repo，sync 由 Phase
  B / C 在 sibling repo 執行。**

---

## 2026-05-05 — schema 加性別感知 threshold（loM/hiM/loF/hiF, Phase 1 patterns repo）

- 作者：claude（與 YC 共同）
- 範圍：schema、catalog、runtime-snapshot
- 變更：新增 schema 欄位 + 6 條 catalog 遷移
- 測試 ID：RBC、Hb、HCT、Fe、TIBC、Ferritin

**觸發：** 使用者回報 vhyl 病人 000151649A（女）在 viewer 顯示血清鐵 58 µg/dL
被誤判過低 — Fe 的 `lo:65` 鎖在男性下限，女性正常下限是 50。盤點後共 6 個
test 有同樣男女不同 reference range 的問題（女性中段值被當成過低）：

| ID | 舊 lo/hi | 女性誤判區間 |
|---|---|---|
| Fe | 65–175 | 50 ≤ x < 65 µg/dL |
| TIBC | 134–415 | 120 ≤ x < 134 µg/dL |
| Ferritin | 21.81–274.66 | 4.63 ≤ x < 21.81 ng/mL |
| RBC | 4.2–6.2 | 3.7 ≤ x < 4.2 ×10⁶/µL |
| Hb | 14–18 | 12 ≤ x < 14 g/dL |
| HCT | 39–53 | 33 ≤ x < 39 % |

**設計（C 方案 — 混合）：**

catalog schema 新增 4 個 optional 欄位 `loM` / `hiM` / `loF` / `hiF`，只在
有男女差異的少數 test 上用。舊 `lo` / `hi` 保留，角色降為「fallback /
unknown gender」並設成最寬包絡（= `min(loM,loF), max(hiM,hiF)`），確保
unknown 性別不會被任何一邊誤判。

Resolution rule（viewer / reporter Phase 2/3 會實作）：
- entry 有 `loM/hiM/loF/hiF`（任一存在）：
  - patient.gender 已知 → 用對應性別組
  - unknown → fallback 到 `lo/hi`（wide envelope）
- entry 沒有性別欄位 → 維持現有 `lo/hi` 邏輯

**修改 patterns/schema.js：**

1. `ALLOWED_FIELDS` 加入 `loM/hiM/loF/hiF`。
2. 加 validate 規則：4 個欄位若存在必須是 number 或 null/undefined；若任一
   存在，該 entry 必須**也有** `lo/hi` 作 fallback（不然 unknown 性別會炸）。
   失敗訊息明確點出哪個 id 缺 fallback。
3. 匯出 `GENDER_THRESHOLD_FIELDS` 常數讓 sibling repo 之後若需 introspect 可用。

**修改 patterns/catalog.js（6 條 entry，欄位順序：refLo/refHi → loM/hiM/loF/hiF → lo/hi）：**

| ID | loM/hiM | loF/hiF | lo/hi (fallback wide envelope) |
|---|---|---|---|
| RBC | 4.2–6.2 | 3.7–5.5 | 3.7–6.2 |
| Hb | 14–18 | 12–16 | 12–18 |
| HCT | 39–53 | 33–47 | 33–53 |
| Fe | 65–175 | 50–170 | 50–175 |
| TIBC | 134–415 | 120–480 | 120–480 |
| Ferritin | 21.81–274.66 | 4.63–204.00 | 4.63–274.66 |

其他欄位（pattern / displayName / unit / ref / refLo / refHi / 註解）一字未動。

**驗證：**

- `npm run release` 全綠：catalog 69 · viewer manifest 54 · reporter
  manifest 37 · `dist/patterns.json` 37.0 KB 重 build 成功。新四欄位
  全部進 JSON snapshot（都是 number，不需動 reviver / serialiser）。
  `byId('Fe')` 結果含 `lo:50, hi:175, loM:65, hiM:175, loF:50, hiF:170`。
- 暫存的 `scripts/gender-threshold-spec.js` 把 TASK_BRIEF §8 全 11 條
  測試樣本灌進新 catalog（pickThresholds + classify 模擬 viewer/reporter
  端的 alarm 邏輯）：
  - Fe×5 case（含觸發 case：女性 58 → normal、男性 58 → low、unknown 58 → normal）
  - Hb×3 case（女 13 → normal、女 11 → low、男 13 → low）
  - Ferritin×3 case（男 25 → normal、女 25 → normal、女 250 → high）
  - 11 PASS · 0 FAIL；spec 檔已刪除。

**影響：**

- catalog + dist/patterns.json 異動 → sibling repo 必須重 sync：
  - viewer：`node sync-patterns.js` 重 sync mapping.js；接著 Phase 2 改
    `report.js valueStyle()` 加 gender 參數 + threshold pick 邏輯，並把
    patient gender 沿 render call chain 傳進去。viewer 對 RBC/Hb/HCT
    無 manifest override，會直接吃 catalog 新欄位。
  - reporter：`node sync-patterns.js` 重 sync inline pattern block；
    Phase 3 改 `hospital-lab-data.html` (~line 2835) alarm 計算 + 決定
    是否打開 6 條原本被 manifest `hi:null lo:null` 蓋掉的 alarm 顯示。
- OPD 端 viewer popup 透過 `dist/patterns.json` 在 24h 內自動拿到新欄位
  （pattern 已序列化），但 alarm 邏輯仍要等 viewer Phase 2 推送的
  zip 才能生效（valueStyle 還沒讀新欄位）。

**Backlog（本輪不處理，等使用者實際遇到再開新 brief）：**

- GOT、GPT、RGT、BUN、CREAT、UA 6 個 test 的 `hi` 都鎖男性、`lo:null`，
  女性中段值會漏 alarm（不是誤判）。優先級低，schema 機制相同，加
  `hiM/hiF` 即可。

---

## 2026-05-05 — vhyl 5 條 regex 放寬（HBsAg / AntiHCV / AFP / TSAT / Fe）

- 作者：claude（與 YC 共同）
- 範圍：catalog
- 變更：修改
- 測試 ID：HBsAg、AntiHCV、AFP、TSAT、Fe

**觸發：** 使用者回報 vhyl 病人 000151649A 的 HBsAg / Anti-HCV / AFP、000051055E 的 Fe
在 reporter 漏顯示。連帶發現 TSAT 舊 regex `/SAT:/` 對 vhyl 的 `TS:` label 不命中。

**根因：** vhyl lab text 把同一項目的「數值滴度行」與「定性結果行」黏在同一行
（例：`HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)`）；lab name 後固定加
`(YL)` suffix；TSAT vhyl 寫成 `TS:`。詳見 TASK_BRIEF.md。

**修改 patterns/catalog.js（只改 pattern 欄位）：**

| testId | 舊 → 新 |
|---|---|
| HBsAg | `/HBsAg(?:\(TT\))?:\s*(\S+)/` → `/HBsAg\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AntiHCV | `/(?:HCV Ab\(TT\)|Anti-HCV):\s*(\S+)/` → `/(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/` |
| AFP | `/AFP:\s*([<>]?[\d.]+)/` → `/AFP\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/` |
| TSAT | `/SAT:\s*([\d.]+)/` → `/(?<![A-Za-z])(?:TSAT|TS|SAT):\s*([\d.]+)/` |
| Fe | `/FE:\s*([\d.]+)/` → `/(?:Fe|Iron)\s*(?:\((?:TT|YL)\))?:\s*([\d.]+)/i` |

設計關鍵：HBsAg / AntiHCV 的 capture 改成 `[^\s\d]\S*`，讓引擎在 `(YL):` 那行才命中，
自動跳過前面的 `0.21` / `0.12` 數值；統一支援 `(TT|YL)` 兩家醫院 + 無 suffix；
TSAT lookbehind 防 `DESAT:` 誤命中、但允許 `267.00TS:` 命中（前一字是數字）；
Fe 加 `i` flag 與 `Iron` alternation。

每個 entry 上方加註解標記 vhyl 原始樣本，便於日後追溯。

**驗證：**
- `npm run release` 全綠：catalog 69、viewer manifest 54、reporter manifest 37、
  `dist/patterns.json` 36.6 KB 重 build 成功。
- 暫存的 `scripts/regex-spot-check.js` 把 TASK_BRIEF §5 全部 18 條樣本灌進新 pattern：
  - HBsAg：4/4（含 vhyl 黏連字串 `HBsAg: 0.21HBsAg (YL): Non-Reactive ...` → `Non-Reactive`）
  - AntiHCV：3/3（含 vhyl 黏連字串）
  - AFP：3/3（`AFP(YL): < 2.00` → `< 2.00`）
  - TSAT：4/4（`267.00TS: 22` → `22`；`DESAT: 95` 正確不命中）
  - Fe：4/4（`FE: 58`、`Fe (YL): 58`、`Iron: 100` 命中；`FERRITIN: 234` 正確不命中）
  - 18 pass · 0 fail；spot-check 檔已刪除。

**影響：**
- catalog 異動 → sibling repo 必須重 sync：
  - `hospital-lab-viewer` 跑 `node sync-patterns.js` 並重新發布（OPD 端另外
    24h 內透過 `dist/patterns.json` 自動拿到最新版）。
  - `hospital-lab-reporter` 跑 `node sync-patterns.js` 並重新發布。
- 預期：reporter 重 fetch 000151649A 後，HBsAg / Anti-HCV / AFP / TSAT 都會出值。

---

## 2026-05-03 — Runtime auto-update via dist/patterns.json (v0.3)

- Author: claude (with YC)
- Goal: pattern updates propagate to OPD computers automatically — no
  per-machine action when patterns change.
- New: `dist/patterns.json` — JSON snapshot of catalog + manifests, with
  RegExp values serialised as `{__regex:[source,flags]}` and functions
  dropped. Generated by `npm run build-json` on each push.
- New: `patterns/normalizers.js` — named normaliser fns (wbcCount,
  plateletCount). Catalog entries now reference normalisers by string
  name instead of inlining functions, so the JSON snapshot can survive
  the round-trip.
- `patterns/index.js`: `resolveManifest()` now rehydrates string
  normaliser refs to functions on the way out.
- `patterns/schema.js`: validates that string normalise refs resolve.
- `scripts/validate.js`: confirms WBC/Platelet rehydration works
  (`wbc.normalize(6700) === 6.7`).
- Viewer-side companion (`hospital-lab-viewer/`):
  - `pattern-loader.js` — fetches `dist/patterns.json` from
    `raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/`,
    caches in `chrome.storage.local` with 24h TTL, rehydrates RegExp via
    JSON reviver, falls back to bundled `mapping.js` if offline.
  - `popup.html`/`popup.js`: freshness badge in header (✓/📦/⚠) shows
    cache state; click to force-refresh.
  - `sync-patterns.js`: `mapping.js` now inlines `normalizers.js` so the
    bundled fallback also rehydrates correctly.
  - `manifest.json` host_permissions already covered `https://*/*`.
- Verification: 69 catalog · 54 viewer resolved · 37 reporter resolved ·
  2 normalisers (wbcCount, plateletCount) · 1 track-only (Mg) · WBC
  normalize round-trips JSON correctly (6700 → 6.7).
- Effect for OPD deployment: maintainer pushes patterns + dist/patterns.json
  to GitHub; every Chrome popup picks up the change on next open (or
  within 24h). Re-distribution of the extension itself only required for
  code changes (rare) or when adding a new normaliser.

## 2026-05-03 — Centralised catalog + thin manifests (v0.2 architecture)

- Author: claude (with YC)
- Hospital scope: both
- Change: refactored repo from "two parallel catalogs" to "one master
  catalog + per-app manifests".
- New file: `patterns/catalog.js` — 69 unique entries, every test
  definition lives here. Universal fields only (pattern, displayName,
  unit, ref, refLo/refHi, hi/lo, qualitative, normalize, computed, etc.).
  No app-specific layout (page/col/section/cat).
- Rewritten as thin manifests:
  - `patterns/viewer.js` — 56 entries; each is `{id, page, col, section,
    ...overrides}`. Picks subset of catalog for the outpatient handout.
  - `patterns/reporter.js` — 37 entries; each is `{id, cat, label,
    ...overrides}`. Picks subset for the dialysis table view.
- `patterns/index.js` resolves each manifest against the catalog (manifest
  fields override catalog defaults). Exposes resolved `viewer` and
  `reporter` arrays so consumers see the same shape as before.
- `scripts/validate.js` updated: validates catalog + checks every manifest
  id resolves + lists "track-only" catalog ids (entries not referenced by
  any manifest — these get pattern detection but no UI rendering).
- Both apps' sync scripts rewritten to bundle catalog + manifest +
  resolver into one self-contained output:
  - `hospital-lab-viewer/mapping.js` — catalog + viewer manifest +
    resolver inlined; exposes `TEST_MAP` and `VIEWER_CATALOG`.
  - `hospital-lab-reporter/hospital-lab-data.html` — same content
    inlined between `__HOSPITAL_LAB_PATTERNS_BEGIN/END__` markers; the
    resolver produces `LAB_TESTS`, `LAB_CATEGORIES`, `COMPUTED_TESTS`.
- Verification (validate.js): 69 catalog ids, 56 viewer resolved,
  37 reporter resolved, 25 shared between manifests. WBC viewer-specific
  override (5.0–10.0) and reporter default (4.0–11.0) both verified
  via `node -e` smoke tests.
- ID renames in viewer manifest (case normalisation; safe — no code
  references): `Glucose` → `GluAC`, `HbA1C` → `HbA1c`, `NA` → `Na`,
  `FE` → `Fe`, `ALKP` → `ALP`. Reporter ids unchanged.
- "Track-only" patterns (catalog entries not in any manifest): currently
  just `Mg` (Magnesium — kept in catalog for future re-use, removed from
  viewer's nutrition column on user request earlier today). Add more by
  defining them in `catalog.js` without listing them in any manifest.
- patterns/index.js exposes `version: '0.2.0'`.

## 2026-05-03 — Viewer further trimmed: drop 腎功能（透析） section + Mg

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `BUNPre`, `BUNPost` (section `腎功能（透析）`) and `MG`
  (section `營養／電解質`) from `patterns/viewer.js`.
- Change: removed (viewer only — these entries remain in
  `patterns/reporter.js` for the dialysis project where pre/post-dialysis
  BUN drives URR).
- Rationale: outpatient handout is for general ambulatory patients, not
  dialysis; the 腎功能（透析） column is irrelevant. Magnesium pruned per
  user preference for a leaner nutrition column.
- Validation: viewer catalog 59 → 56 entries. Section `腎功能（透析）` no
  longer exists. `營養／電解質` now 7 entries: Albumin, NA, K, FreeCa, FE,
  VitB12, FolicAcid. Renal section unchanged: BUN, CREAT, UA, eGFR, UACR,
  UPCR.

## 2026-05-03 — Viewer nutrition section pruned

- Author: claude (with YC)
- Hospital scope: both
- Tests: removed `TP`, `Cl`, `Ca`, `P`, `TIBC`, `TSAT`, `Ferritin`, `iPTH`
  from `patterns/viewer.js` (section `營養／電解質`)
- Change: removed (viewer only — these entries remain in `patterns/reporter.js`
  for the dialysis project)
- Rationale: outpatient handout's nutrition column should focus on Albumin,
  electrolytes (Na/K/Mg), free Ca, iron, B12, folate. Bone-mineral metabolism
  markers (Ca/P/iPTH) and protein/iron-status panels (TP/TIBC/TSAT/Ferritin)
  belong in the dialysis catalog where they're clinically actionable.
- Validation: viewer catalog entries 67 → 59; nutrition section now contains
  exactly 8 entries: Albumin, NA, K, MG, FreeCa, FE, VitB12, FolicAcid.

## 2026-05-03 — Lifelong hepatitis markers fix (consumer-side)

- Author: claude (with YC)
- Scope: hospital-lab-viewer/popup.js (NOT this repo — fix lives in the
  consumer because it's a fetch/filter behaviour, not a pattern definition)
- Change: added `Anti-HBs` to the all-time pass-through regex in popup.js
  (previously only `HBsAg|HCV Ab|REACT:|TPHA|HIV virus load|LEU3AN`).
- Rationale: HBsAg, Anti-HBs, Anti-HCV are lifelong markers — once positive
  (or once vaccinated for Anti-HBs), they tend to remain positive. The
  outpatient handout should surface the most recent value regardless of
  the 1-year lab-window cutoff.
- Validation: lab orders containing "Anti-HBs:" in reportText now bypass the
  12-month cutoff. The corresponding viewer catalog entries (`HBsAg`, `HCV`,
  `AntiHBs`) already carry `singleValue: true`, so report.js renders only
  the most recent value.

## 2026-05-03 — Phase 1 bootstrap

- Author: claude (with YC)
- Hospital scope: both
- Initial commit. Catalogs migrated unchanged from the two consuming projects:
  - `patterns/viewer.js` — 56 entries from `hospital-lab-viewer/mapping.js`
  - `patterns/reporter.js` — 50 entries from `hospital-lab-reporter/hospital-lab-data.html`
  - `patterns/computed.js` — URR, Ca×P, eGFR (CKD-EPI 2021), GFR/UACR/UPCR
    staging, KDIGO risk, Taiwan CKD stage, Early CKD class, PSA ratio,
    HCV / HBsAg / RPR / TPHA qualitative
- Schema documented in `docs/pattern-spec.md`.
- `scripts/validate.js` confirms: no duplicate IDs within either catalog;
  every pattern compiles.
- **Known overlaps** to reconcile in phase 2 (different IDs / different
  thresholds for the same underlying test):
  - `Glucose` (viewer) ↔ `GluAC` (reporter)
  - `BUNPre` / `BUNPost` (viewer) ↔ `BUN_pre` / `BUN_post` (reporter, uses `filter`)
  - `HbA1C` (viewer) ↔ `HbA1c` (reporter)  *only case difference*
  - `HCV` computed (viewer) ↔ `AntiHCV` raw (reporter)
  - `RPR` computed (viewer) ↔ `RPR` raw (reporter)
- Reporter's `qualitative: true` flag and viewer's `singleValue: true` /
  `computed: '...'` flags express overlapping concepts — to be unified in
  phase 2.
- Both consumer projects refactored to import from this repo; their inline
  catalogs removed.

---

## Template for future entries

```markdown
## YYYY-MM-DD — Short summary

- Author: <initials>
- Hospital scope: <tt | yl | both>
- Tests: <ID(s)>
- Change: <added | updated | removed>
- Rationale: <why>
- Validation: <example raw text → captured value>
- Related commit: <git short-hash>
```
