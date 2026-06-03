# Session state — vhtt

> 每次在 vhtt 觸發「階段完成」/「離開 vhtt」/「結束 session」時 overwrite 本檔。
> 在 vhtt 開新 session 接續 vhtt(「接續上次」)或在 vhyl 接續 vhtt(「接續 vhtt」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-06-04 07:04(台北時間 / SOP J)
**Last session type**: Cowork(全程回顧 meta-session:AI coding 過程檢視 → 治理方法討論 → Modes/Notion 規則修訂 → 教材 repo 分拆)
**Last action**: 教材從 hospital-lab 移出至獨立 `D:\self\teaching`,workspace 回到乾淨開發狀態(三 repo + CLAUDE.md);本機尚有兩個 docs 修改待 commit

## 1. 本 session 完成

本 thread 是 **meta-session**(回顧 + 治理,非寫 catalog / feature):

(a) **全程回顧** — Explore subagent 重建專案時間線(32 天 / 205 commits / 37 briefs / 88 entries / 5 phase 全交付);產出踩坑清單 F1–F8、工作方法演變史、規模數據

(b) **治理問答**(YC 提問,Claude 分析,未改 code):
- Notion 定位:確立為單向投影(read-model),git 為唯一 write-model
- Cowork/Claude Code 分工真實邏輯 = 影響範圍(blast radius),非「思考 vs 實作」
- docs-as-code / 情境工程 / spec-driven development 業界方法論對照
- 方法論譜系:affaan-m/ECC 種子(初版 project instruction 參考)→ 在地化 → 踩坑演化 → 蒸餾

(c) **規則修訂**(canonical 已改,**待 commit**):
- `docs/cowork-project-instructions.md`:Modes 段改寫成 blast-radius 分工;規則 #7 加 Notion 單向投影條款
- `docs/workflow-changelog.md`:2026-06-04 條目(含 ECC 出處補登)

(d) **教材 repo 分拆**(已脫離 hospital-lab):
- 教材原放 hospital-lab root(污染),移入 `teaching/` 子夾,再由 YC 整個移出至 `D:\self\teaching`(獨立,與開發環境解耦)
- 教材庫骨架:README(canonical 判準「產出是檔案→git;純線上頁→Notion」+ 發布規則)、shared/(METHOD_SEED_TEMPLATE + CASE_TEMPLATE)、ai-coding-hospital-lab/(outline + sources + for-busy-you)
- 對外品牌「For Busy You」= 每教案一頁精簡版

## 2. 本 session 未完

**本機(vhtt)未 commit**(本 thread 產生):
- `docs/cowork-project-instructions.md`(M)— Modes + Notion 規則
- `docs/workflow-changelog.md`(M)— 2026-06-04 條目
- `docs/session-state-vhtt.md`(本檔,本次 wrap 覆寫)
- `docs/session-state-archive/2026-06-04T0704-vhtt.md`(archive 舊 5/28 wrap)
- `WORKLOG.md`(待加 SOP J pointer 條目)

指令見本檔末尾 SOP J 收尾步驟。

**教材側待辦**(在 `D:\self\teaching`,非本 repo):
- git init + GitHub repo `Yuchunchen/teaching`(public)+ push
- 其他點 clone
- 開 chat project「教材」(instructions + 素材 URL 在 teaching/ai-coding-hospital-lab/sources.md)

**開發側 open work(從前 thread 帶來,本 meta-session 未動)**:
- vhtt 13 chartno refHistory batch(`TASK_BRIEF_vhtt_refHistory_batch_13` 已被 5/28 後 Claude Code land,見 git log `5bcd638`)
- 剩 8 entries cross-reference / catalog ALP 內部 drift cleanup / vhyl 對應 cross-reference
- 真機整合驗證(T18-T21 + Order 2.8/2.9 + UPCR/ABI/Fundus)
- **最大缺角(本回顧暴露)**:無 fixture corpus + 回歸測試,AI 無法自我驗證(F8 Platelet 漏抓一個月即此因)→ 值得起 brief

## 3. 下次該先做什麼

1. **(YC PowerShell)** commit + push 本機兩個 docs 修改 + session-state + archive + WORKLOG — 指令見本檔末尾
2. **(push 後)** 兩台 Cowork UI 重貼 `cowork-project-instructions.md`;Notion §1.0 paste 追蹤兩格重置 ⏳;開機 SOP page 加 workflow-changelog pointer 行
3. **(教材)** 在 `D:\self\teaching` git init + push,開 chat project
4. **(開發主軸,擇一)** 起 fixture+回歸測試 brief(補最大缺角)/ 剩 8 entries cross-reference / DM-ESRD 疾病群組

### 新 thread 開場句範例(回開發)

> 接續 vhtt。請讀 `patterns/docs/session-state-vhtt.md` + Notion 開機 SOP。
> 先跑環境 sync,然後我們從 § 2「開發側 open work」挑一項。

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Title | Status | Order | 備註 |
|---|---|---|---|
| 參考值 refHistory schema | Done(Claude Code land,5/28 後)| 5.0 | vhtt 13 override land(`5bcd638`);剩 8 entries / vhyl 對應為 follow-up |
| CBC Platelet PLATE alternation | Done(2026-06-04)| — | F8 修復;暴露無回歸測試問題 |
| fixture corpus + 回歸測試 | **未起(候選)** | — | 本回顧暴露的最大缺角,值得起 brief |
| 剩 8 entries cross-reference | parked | — | 需不同 patient profile |
| catalog ALP 內部 drift cleanup | parked | — | 獨立 cleanup |
| DM / ESRD 疾病群組 HTML | parked | — | 架構就位,awaiting |

## 5. Parked questions

### 本 thread 解決
- **「YC 有修改 project instruction / claude.md」**(前 thread 長期 parked)→ 本 thread 釐清:是 Cowork app UI 的 project instructions;canonical 在 git `docs/cowork-project-instructions.md`,本 thread 已更新
- **ECC 出處**:YC 確認初版 project instruction 參考 affaan-m/ECC → 補進 workflow-changelog(具體借用機制仍待 YC 回憶補述)

### 仍 parked(從前 thread 帶來)
- **vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\`** — 路徑 / 用途未釐清
- ernode birthDate → eGFR 升級(carry)
- vhyl ABI/PVR/BMD/CAC/LDCT order name 未實測
- reporter `file://` origin sub-page fetch CORS
- B&W 老印表機 dither A5 風險
- viewer CLAUDE.md zip include-list 過時
- **Cowork memory 系統**:本 thread 確認可寫(MEMORY.md 機制存在,與舊「寫不進」紀錄不同;舊紀錄可能過時)

### 教材側待補(在 teaching repo,非本 repo)
- for-busy-you.md 行動呼籲是否對臨床受眾承諾過頭,待 YC 過目
- METHOD_SEED_TEMPLATE §4.4(fixture+測試)是唯一未經親身驗證條目,下個專案優先驗證

## SOP J 收尾步驟(給 YC 在 vhtt PowerShell 跑)

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns

# 1. confirm working tree
git status -s
# 預期:
#  M WORKLOG.md
#  M docs/cowork-project-instructions.md
#  M docs/session-state-vhtt.md
#  M docs/workflow-changelog.md
# ?? docs/session-state-archive/2026-06-04T0704-vhtt.md

# 2. git add
git add docs/cowork-project-instructions.md docs/workflow-changelog.md
git add docs/session-state-vhtt.md docs/session-state-archive/2026-06-04T0704-vhtt.md
git add WORKLOG.md

# 3. commit
git commit -m "docs(session): SOP J wrap vhtt 2026-06-04(全程回顧 + Modes blast-radius + Notion 投影 + ECC 出處 + 教材分拆)"

# 4. push(規則 #3 — 確認後再 push)

# 5. (push 後)兩台 Cowork UI 重貼 + Notion §1.0 兩格 ⏳ + 開機 SOP page 加 changelog pointer 行
```
