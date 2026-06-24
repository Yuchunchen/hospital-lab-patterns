# Session state — vhtt

> 每次在 vhtt 觸發「階段完成」/「離開 vhtt」/「結束 session」時 overwrite 本檔。
> 在 vhtt 開新 session 接續 vhtt(「接續上次」)或在 vhyl 接續 vhtt(「接續 vhtt」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-06-24(台北時間 /「結案」— vhtt ref range 大工程 + gap-fill 調查收尾)
**Last session type**: Cowork(env sync + 重貼 project instructions + Notion 同步 + cohort ref harvest round-4 + gap-fill round-5)
**Last action**: catalog.js 落本日 vhtt refHistory(round-4 22 筆 + round-5 4 筆);WORKLOG round-4/5 已寫;harvest CSV / proposal / gapfill findings 落 workspace root;Notion(開機 SOP § 1.0 vhtt 已重貼 ✅ + TASK_BRIEF Dashboard「vhtt cohort ref harvest」Done + 工作流演變紀錄 1 筆)。**⚠️ 本日 round-2/3/4/5 catalog delta 全在 working tree — push 狀態待 git 確認**。

## 1. 本 session 完成(vhtt ref range 大工程)

(a) **開機**:git pull 三 repo;從 git canonical 重貼 vhtt Cowork Project Instructions(canonical 2026-06-23 加 C-crawl trigger);Notion 開機 SOP § 1.0 vhtt 格改 ✅(2026-06-24)。

(b) **round-4 — cohort ref harvest**(19 病人 × 全歷史 1,761 opdweb 報告,背景 self-driving harness errors=0):vhtt ref **時間穩定**(無玉里式全院改版)。catalog 落 22 筆 machine:'vhtt'(11 改 validFrom 觸發日→1900 + 11 新增)。產物 `vhtt_ref_harvest_2026-06-24.csv` / `vhtt_refHistory_proposal_2026-06-24.md`。技法:親域 cookie 會壞 ernode(400 Invalid cookie value)→ 改 `window.name` 跨域;CDP 45s 用「時間預算 chunk」。

(c) **round-5 — ref gap-fill 調查**(WBC/K/P/UA/Ferritin/TBIL/DBIL):上輪這 7 項「全無」確認是 **parser 漏抓**(4 bug:panel 前綴 `CBC: WBC` / 單字母名 K,P / 名-ref off-by-row / `磷`碰`磷酸酶`)。修 targeted parser(中文名錨定 + Δy≤40 最近 range-ref)。驗 5/7(單報告 000070213G @2026-06-12):WBC 4.0-11.0 / K 3.5-5.1 / UA(已在 catalog)/ TBIL 0.3-1.0 / DBIL 0.03-0.18,**四者 = universal**。catalog 落 4 筆(WBC/K/TBIL/DBIL @1900,obs 1)。findings:`vhtt_ref_gapfill_findings_2026-06-24.md`。

vhtt machine 筆數:14 → 29(round-4 +11、round-5 +4)。

## 2. 本 session 未完 / 待辦

- **⚠️ push 本日 catalog delta**(round-2/3/4/5 同一 working tree)— **大半徑 → Claude Code**:`npm run release`(validate 是 Cowork 沒跑到的安全網)→ viewer/reporter `sync-patterns` → push(push 前問 YC)。確認 push 狀態。
- **gap-fill P(磷)/ Ferritin(鐵蛋白)未驗**:健檢/一般病人沒驗到,需腎臟/透析病人;Ferritin 免疫法版面 parser 待驗。resume 指引(含 targeted parser code)在 `vhtt_ref_gapfill_findings_2026-06-24.md`。
- **push 成功後**寫 Notion:工作流演變紀錄(parser 教訓)+ TASK_BRIEF Dashboard(P/Ferritin resume Open)。
- **CK** 偵測 2026-01 改性別分版(M:62-287;F:45-163)但 catalog 無 CK entry → 要落需先新增 CK(大半徑,另開)。

## 3. 下次該先做什麼

1. **(收尾)** 確認本日 round-2/3/4/5 delta 已 push 上 main;若 Notion 兩筆(工作流演變/Dashboard resume)未寫則補。
2. **(gap-fill resume)** 挑腎臟/透析病人驗 P/Ferritin(+ Ferritin 免疫法 parser)→ 落 catalog。
3. **(開發主軸)** ref_range refHistory 顯示欄 + 真機整合驗證(Order 5,cross-repo = 大半徑 Claude Code)。
4. **(候選)** fixture corpus + 回歸測試 — 最大缺角。

### 新 thread 開場句範例

> 接續 vhtt。請讀 `patterns/docs/session-state-vhtt.md` + Notion 開機 SOP。
> 先跑環境 sync,確認本日 ref delta 已 push,再回 § 3(gap-fill P/Ferritin 或開發主軸)。

## 4. Active TODOs(snapshot;以 Notion Dashboard 為準)

| Title | Status | Order | 備註 |
|---|---|---|---|
| vhtt ref cohort harvest(round-4) | impl done / push 待確認 | — | catalog 22 筆;CSV+proposal 落盤;Notion Dashboard Done 已建 |
| vhtt ref gap-fill(round-5) | 部分(5/7 落) | — | WBC/K/TBIL/DBIL 落;P/Ferritin 待腎臟病人 + Ferritin parser;findings 檔 |
| CK catalog entry(新增) | 候選 | — | 2026-01 改性別分版偵測到,要落需先建 CK entry(大半徑) |
| ref_range refHistory 顯示欄 + 真機驗 | Open | 5 | 大半徑 → Claude Code;+ vhyl cross-ref(5.2) |
| fixture corpus + 回歸測試 | 未起(候選) | — | 最大缺角 |
| DM / ESRD 疾病群組 HTML | parked | — | 架構就位,awaiting |

## 5. Carry-forward(從 2026-06-19 wrap,狀態未由本 session 確認 — 詳見 archive/2026-06-19T0946-vhtt.md)

- **task2 健檢報告排序**:impl done 但 commit/_done/真機 T1–T6 狀態待 git 確認(本 session 未碰)。
- **task1 enrichCache freshness**:暫緩;下次遇 stale cache 症狀**先別清快取**、先撈 ordapno enrichCache raw。
- Parked:vhtt 有一個 CLAUDE.md 不在 workspace root(路徑/用途未釐清);ernode birthDate→eGFR;vhyl ABI/PVR/BMD/CAC/LDCT order name 未實測;reporter `file://` sub-page CORS;B&W 老印表機 dither A5。
