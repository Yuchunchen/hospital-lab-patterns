# Session state — vhtt

> 每次在 vhtt 觸發「階段完成」/「離開 vhtt」/「結束 session」時 overwrite 本檔。
> 在 vhtt 開新 session 接續 vhtt(「接續上次」)或在 vhyl 接續 vhtt(「接續 vhtt」)時讀本檔。
> 歷史版本在 `session-state-archive/`。
> 檔結構見 PROJECT_CONTEXT.md § 12「Session snapshot 檔結構」。

---

**Last wrap**: 2026-06-18 22:31(台北時間 / SOP G — 段落收尾,thread 不關)
**Last session type**: Cowork(開機 sync + SOP A:DC vhtt pattern learning)
**Last action**: DC vhtt pattern land(已 push)→ 接 ref_range Order 5 跑 8-entry vhtt cross-reference(in-page fetch sweep ~65 病人 + opdweb 子報告讀 NORMAL RANGE);僅 RGT 取得 vhtt ref 9-64,已 append catalog working tree(未 release/push),其餘 7 項無數值 ref

## 1. 本 session 完成

(a) **開機環境 sync**(三 repo 對齊 origin):
- patterns 原 diverged(local ahead 1 / behind 4):YC rebase 把 06-04 SOP J wrap commit(dae8936)疊到 origin DC 工作之上 → `4b905ab`,WORKLOG.md 衝突由 Cowork 解(union)
- viewer / reporter fast-forward;清掉 sandbox pull 殘留的 stale `.git/*.lock`

(b) **SOP A — DC 五分類加 vhtt mnemonic**(DC brief Open #1):
- vhtt label 確認(Chrome 抓 ernode 真機):`Neutrophil / Lymophocyte`(EHR 拼字,非 Lymphocyte)`/ Monocyte / Eosinophil / BASO|Basophil`(Baso 兩變體)
- catalog 5 條 DC pattern:移除 `\b`(vhtt reportText run-on 無分隔,數字接字母無 word boundary)+ 加 vhtt alternation;與 CBC 慣例(HCT/MCV/Platelet 無 `\b`)對齊
- 真機 4 病人驗證 node 35/35:000032118G / 000019606F(含更正報告)/ 000105589G / 000115014H;**驗證抓到 Basophil 變體**(000105589G),補進 alternation
- push:patterns `6eb2706` / viewer `fbd24a8` / reporter `36d3643`(含後續 doc commit)

(c) **DC brief follow-up 收束**(Notion 已同步):
- #1 vhtt mnemonic → ✅ 已解
- #2 DC% 參考值 → ❌ YC 取消(DC 定案永久 display-only,不做 alarm 上色)
- #4 Total IgE → ❌ YC 取消(不做)
- #3 A5 版面溢出 → 未動(未提)

(d) memory 新增 `sandbox-mount-unreliable-for-repo`(bash sandbox 讀此 CRLF+中文 repo 會截斷/亂碼/留 lock;以 Read tool 為真,validate 在真機跑)

(e) **ref_range Order 5 — 8-entry vhtt cross-reference**(brief 主體 5/28–6/04 已 land,本輪補剩項):
- 方法:YC ~65 chartno → in-page fetch sweep `get_lab_orders`(searchItem)找已出報告 order → ordapno → opdweb `OpdOrderReport.aspx`(port 80)讀 NORMAL RANGE
- **僅 RGT 取得 vhtt 數值 ref = 9-64 IU/L**(chartno 000015165F),已 append catalog refHistory(**working tree,未 release/push**)
- 其餘 7 無數值 ref:VitB12(NORMAL RANGE 空白)、Aluminum(委外無值)、HBsAg/AntiHCV/AntiHBs(該院做定性 §1.2 排除)、HIVLoad(只見定性 Anti-HIV)、CD4(未見)

## 2. 本 session 未完

- **無未 commit**:本機改動已全 push(rule #11 確認:三 repo origin/main 皆前進)
- 待確認(Claude Code 端):本輪 viewer / reporter 的 `node sync-patterns.js` commit 是否各補 WORKLOG 條目(patterns 已補)

## 3. 下次該先做什麼

1. **(開發主軸)** Dashboard 唯一 Open brief:`ref_range` refHistory(Order 5,cross-repo schema 整合 = **大半徑 → Claude Code**)。剩「顯示欄印最新 ref + 真機整合驗證」deferred;另 8 entries cross-reference(掛 vhyl Order 5.2)
2. **(候選)** fixture corpus + 回歸測試 brief — 前 thread(06-04 回顧)暴露的最大缺角,DC 這輪 Basophil 變體靠人工抓到、再次佐證需要回歸 corpus

### 新 thread 開場句範例(回開發)

> 接續 vhtt。請讀 `patterns/docs/session-state-vhtt.md` + Notion 開機 SOP。
> 先跑環境 sync,然後從 § 3 挑一項(ref_range 大半徑要開 Claude Code)。

## 4. Active TODOs(snapshot at wrap;以 Notion Dashboard 為準)

| Title | Status | Order | 備註 |
|---|---|---|---|
| ref_range refHistory schema | Open | 5 | 主體 land;本輪補 RGT vhtt override(working tree 未 push)。剩:vhyl 側 cross-reference(0 筆,Order 5.2)+ T18-21 真機整合驗證。8-entry 中 7 項無數值 ref(見 §1e) |
| fixture corpus + 回歸測試 | 未起(候選) | — | 最大缺角;DC Basophil 變體再次佐證 |
| 剩 8 entries cross-reference | parked | 5.2 | vhyl 對應;需不同 patient profile |
| catalog ALP 內部 drift cleanup | parked | — | 獨立 cleanup |
| DM / ESRD 疾病群組 HTML | parked | — | 架構就位,awaiting |

## 5. Parked questions

### 本 session 處理
- DC brief Open #1（vhtt mnemonic）已解;#2 / #4 取消（見 §1c）

### 仍 parked(從前 thread 帶來)
- vhtt 有一個 CLAUDE.md 不在 `D:\self\hospital-lab\` — 路徑 / 用途未釐清
- ernode birthDate → eGFR 升級(carry)
- vhyl ABI/PVR/BMD/CAC/LDCT order name 未實測
- reporter `file://` origin sub-page fetch CORS
- B&W 老印表機 dither A5 風險

## SOP G 收尾步驟(給 YC 在 vhtt PowerShell 跑)

```powershell
cd D:\self\hospital-lab\hospital-lab-patterns
git status -s
# 預期:
#  M docs/session-state-vhtt.md
# ?? docs/session-state-archive/2026-06-18T2231-vhtt.md
git add docs/session-state-vhtt.md docs/session-state-archive/2026-06-18T2231-vhtt.md
git commit -m "docs(session): SOP G wrap vhtt 2026-06-18(DC vhtt pattern + follow-up 收束)"
git push
```
