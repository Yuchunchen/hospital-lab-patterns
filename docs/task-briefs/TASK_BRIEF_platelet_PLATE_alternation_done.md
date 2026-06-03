# TASK_BRIEF_platelet_PLATE_alternation

> Cowork → Claude Code 交付。修一條 catalog regex,跨 patterns / viewer / reporter sync。
> 建立日期:2026-06-03。SOP B(修現有 pattern 的 regex)。

## 背景

vhtt 病人 `000030794I` 的 viewer printout 只顯示 4/13 那筆 `Platelet: 158`,
缺最新 5/20 CBC 的 89。Live-fetch 偵錯(Cowork session 2026-06-03)發現:

| Order | OrderName | reportText 真實 label | 現行 regex 是否 match |
|---|---|---|---|
| 5/20 CBC 套餐 | `CBC(RBC,WBC,HB,HCT,PLT,MCH,MCHC,MCV)(TT)` | `PLATE: 89` | ❌ |
| 4/13 單獨 Platelet 訂單 | `Platelet (TT),Differential Count(D.C)` | `Platelet: 158` | ✓ |

→ ernode 對血小板用兩種 label:CBC 套餐裡 `PLATE:`,單獨 Platelet/D.C. 訂單 `Platelet:`。
Catalog 現行 regex 只罩後者。屬全院長期狀態,不是這個病人特例。

**注意:** Chrome 前端(Quasar/Vue)的 DOM 把 `PLATE` 重寫成 `Platelet` 顯示,
所以肉眼 / `get_page_text` 看到的是 `Platelet`;但 viewer extension 走 raw HTML
parse `row.cells[2].textContent`,看到的是 `PLATE`。偵錯時別被前端改寫騙了。

## 影響面

- **Viewer**:CBC 套餐裡的 Platelet 全部漏抓(只剩 D.C. / 單獨 Platelet 訂單才有);
  推測歷史所有走 CBC 套餐的病人都中招,只是這次特定病人剛好近期沒有 D.C. 才暴露
- **Reporter (dialysis)**:同 catalog regex,同樣漏抓 — KiDiTi 匯出第 X 欄(field 6,
  Platelet)會空,影響月例 CSV 完整度
- **Reporter (CKD)**:CKD manifest 不含 Platelet,不影響

## 提議改動

`patterns/catalog.js` 第 81 行:

```diff
- pattern: /Platelet:\s*([<>]?\s*[\d.]+)/,
+ pattern: /(?:Platelet|PLATE):\s*([<>]?\s*[\d.]+)/,
```

### 為何不用 `/i`(case-insensitive)

保守做:只加 observed-in-the-wild 的 label。若未來再撞到第三種(如 `PLT:`、
`PLATELET:` 全大寫、`platelet:` 全小寫),再以同樣 SOP B 加進 alternation。
不直接 `/i` 是因為現行 catalog 全部 case-sensitive,改一條的 case sensitivity
是 catalog-wide 政策變動,範圍超過這次 minor patch。

### 為何不用 `\b(?:Platelet|PLATE)\b`

`PLATE` 後面強制接 `:`,實作上等同 word boundary;加 `\b` 對 match 結果沒差,
但讓 regex 更冗。維持與 catalog 其他條目風格一致。

### Collision 檢查

跑過 catalog 全文 grep,沒有其他 `PLATE` 開頭的 label 會被誤觸。
`PLATELET:` 全大寫(假設未來變體)不會 match — 加進 brief 的「未來變體」備註。

## 成功標準

在 vhtt `000030794I` 上跑完 release + sync 之後:

1. Viewer printout 的 Platelet row 顯示兩筆:**89 (115/05/20)** + **158 (115/04/13)**
2. 89 應顯示紅色(低於 vhtt refLo 120 + universal refLo 150)
3. 4/13 那筆 158 仍正常顯示(回歸:不破舊功能)
4. 同病人的 reporter dialysis HTML 跑「全部更新」後,KiDiTi 匯出 CSV
   field 6(Platelet)5 月那筆有值 89

## 測試清單(每條對應一個業務行為,可獨立驗證)

| # | 測試 | 預期 | 對應業務行為 |
|---|---|---|---|
| T1 | catalog regex against `PLATE: 89` | match,capture=`"89"` | CBC 套餐 platelet 抓得到 |
| T2 | catalog regex against `Platelet: 158` | match,capture=`"158"` | 單獨 Platelet 訂單仍抓得到(回歸) |
| T3 | catalog regex against `PLATELET: 200`(全大寫) | no match | 未實際遇到的變體先不誤吞 |
| T4 | catalog regex against `WBC: 8.98 HGB: 10.7`(無 platelet) | no match | 不誤觸其他 label |
| T5 | viewer popup 跑 vhtt/000030794I,Platelet row | 89 + 158 兩筆,89 紅色 | end-to-end CBC 套餐解析 |
| T6 | reporter dialysis HTML,vhtt/000030794I,KiDiTi 匯出 | 5 月 field 6 = 89 | end-to-end 透析月例 |
| T7 | `npm run release` validate 全 pass | 0 error,0 warning | catalog schema 健康 |
| T8 | `dist/patterns.json` rehydrate 後 regex 行為與 source 一致 | T1–T4 重跑都通過 | runtime artifact 不漂移 |

T1–T4 可在 Claude Code session 開頭快速 node REPL 驗,T5–T6 要實際開 viewer /
reporter HTML(reporter 要先跑「全部更新」清掉 6h cache,因為原本可能 cache
住舊解析結果)。T7–T8 是 release pipeline 預設步驟。

## 動作步驟(Claude Code 在 vhtt 跑)

1. `cd hospital-lab-patterns`
2. 改 `patterns/catalog.js` 第 81 行 regex(diff 如上)
3. 更新 `WORKLOG.md`(繁中):加一筆「Platelet regex 補 PLATE alternation,
   觸發 case vhtt/000030794I CBC 套餐漏抓」
4. `npm run release`(validate + build-json)
5. `cd ../hospital-lab-viewer && node sync-patterns.js`
6. `cd ../hospital-lab-reporter && node sync-patterns.js`(會連帶 rebuild 兩支 HTML)
7. 各 repo git status / commit(三個 repo 各一個 commit)
8. **YC 確認後** push(規則 #3:Cowork 不 drive push;但 Claude Code 跑 commit
   就會自動 push,除非 destructive — 這次不是 destructive,可一氣呵成,
   commit message 出來給 YC 看一眼)
9. push 完寫 Notion(SOP 規則 #7):
   - 在 TASK_BRIEF Dashboard 加這筆 / 改 status → done
   - Notion 寫失敗不擋 push,但要回應裡明示「Notion 沒更到」(規則 #11)
10. 改名 `TASK_BRIEF_platelet_PLATE_alternation.md` →
    `TASK_BRIEF_platelet_PLATE_alternation_done.md`(規則 #6,與最後一個 commit
    同一輪)

## 分發

- **viewer**:OPD 端 24h 內自動拿到 `dist/patterns.json`;急用可點 freshness badge 強刷
- **reporter**:dialysis HTML 與 CKD HTML 重建後,把 dialysis HTML 放 Dropbox 共用

## 風險 / 注意事項

- 改的是 catalog 主檔 regex,不是性別 / refHistory / schema,屬規則 #5 1.5 表
  vhtt-only 動手範圍以外的「單條 pattern regex tweak」— 兩台都可改,但既然
  已 surface 在 vhtt,就直接在 vhtt 改完 push
- viewer 跟 reporter 的 6h orders cache 不會自動知道 catalog 變了,要清才看得到
  新解析結果(reporter 跑「全部更新」、viewer 點 ↻)
- 不涉及 catalog schema / resolution model / refHistory — 不是 destructive
