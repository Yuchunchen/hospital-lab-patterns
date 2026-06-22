# TASK_BRIEF — 參考值 (reference range) 加機器 / 時間維度

**Owner**: YC
**寫於**: 2026-05-27(vhtt Cowork)
**改寫於**: 2026-05-27(§ 7 議題全 lock 後完整改寫)
**目標執行機器**: Claude Code(workspace root,跨 3 repo)
**估時**: half-day ~ one-day
**Order(Notion Dashboard)**: 5.0

---

## § 0 背景 / 動機

`patterns/catalog.js` 目前所有條目的參考值(reference range)只存一份 universal `refLo / refHi`(+ 可選性別 `loM/hiM/loF/hiF`),沒有機器(machine)維度也沒有時間維度。

但實際上同一個檢驗項目:
1. **vhtt 跟 vhyl 因為儀器試劑校正不同**,「正常範圍」會有差異
2. **同一台機器隨時間試劑批號 / 校正流程變動**,參考值也會偶爾調整
3. **男女有差異的檢查在 vhtt / vhyl 也可能各自不同**(性別差異 × 機器差異交叉)

最權威來源是「打開每份檢查的正式報告連結」,但每個都點開很耗時、也沒必要。需要一個機制把這些維度納入 catalog,並讓 viewer / reporter 在判定「正常 / 異常」(黃紅綠標示)時用到的是該筆檢驗值的正確 ref。

---

## § 1 範圍(in-scope / out-of-scope)

YC 2026-05-27 拍板:**只 cover 試劑校正出來的 lab 值**,計算欄位 + 文獻 / 國際定義 cut-off 不 cover。

### 1.1 進 scope — 必須加 `refHistory` 的 catalog id 清單

依 `patterns/catalog.js` 2026-05-27 commit `7dcb47b` 版本切分:

| 類別 | id 清單 | 數 |
|---|---|---|
| CBC | `WBC, RBC, Hb, HCT, MCV, Platelet` | 6 |
| 蛋白質 | `TP, Albumin` | 2 |
| 肝功能 | `GOT, GPT, RGT, ALP, TBIL, DBIL` | 6 |
| 血脂 | `CHOL, HDLC, LDL, TG` | 4 |
| 血糖 | `GluAC, HbA1c` | 2 |
| 腎功能(非計算) | `BUN, BUN_pre, BUN_post, CREAT, UA` | 5 |
| 電解質 | `Na, K, Cl, Ca, FreeCa, P, Mg` | 7 |
| 鐵 | `Fe, TIBC, TSAT, Ferritin` | 4 |
| 副甲狀腺 / B 群 | `iPTH, VitB12, FolicAcid` | 3 |
| 重金屬 | `Aluminum` | 1 |
| 腫瘤標誌 | `AFP, CEA, CA199, PSA, FreePSA, CA125` | 6 |
| 甲狀腺 | `TSH, FreeT4` | 2 |
| 肝炎 Titer | `HBsAgTiter, AntiHBsTiter, AntiHCVTiter` | 3 |
| HIV 量化 | `HIVLoad, CD4` | 2 |

**合計 in-scope: 53 個 id。**

**特例**:
- `BUN_pre / BUN_post` 列入 in-scope,但 **refHistory 繼承 `BUN` 的**(不獨立維護;lookup 時若 `BUN_pre / BUN_post` 自身無 refHistory,fallback 到 BUN 的 refHistory,再 fallback 到 outer refLo/refHi)
- `HIVLoad` 確認進 scope(YC 拍板)

### 1.2 排除 scope — 不加 `refHistory`,理由各自

| 排除類別 | id 清單 | 排除理由 |
|---|---|---|
| Computed(`pattern:null`) | `GFRStage, UACRStage, UPCRStage, KDIGORisk, TaiwanCKD, EarlyCKD, UIBC, PSARatio, HBsAgDisplay, AntiHBsDisplay, HCV` | 數學定義 / 衍生值,無「試劑校正」概念 |
| YC 明確排除 — 文獻 cut-off | `UACR, UPCR` | 文獻 cut-off,不隨儀器變 |
| YC 明確排除 — 計算公式 | `eGFR` | CKD-EPI / MDRD 公式輸出,不隨儀器變 |
| 影像 / 評估 | `EKG, ABI, PVR, Fundus, CXR, BMD, CAC, LDCT, Endoscopy, AbdSono, BoneDensity` | 無「試劑校正出來的數值」概念 |
| 尿液定性 | `UrineOB, UrineGlucose, UrineProtein, UrineCr` | qualitative,無 numeric ref range |
| 定性血清 | `HBsAg, AntiHBs, AntiHCV, HIV, RPR, TPHA` | qualitative(Reactive / Non-Reactive) |

**合計排除: 88 − 53 = 35 個 id**。

---

## § 2 資料模型(data model)— schema spec

### 2.1 新欄位 `refHistory`(版本 A — 含 inline 性別 override)

每個 § 1.1 in-scope entry 新加 `refHistory` 欄位,結構:

```js
refHistory: [
  {
    machine: 'vhtt' | 'vhyl' | '*',     // '*' = 所有機器通用(migration 起點)
    refLo: number | null,
    refHi: number | null,
    // 可選 inline 性別 override(machine × gender 交叉差異):
    refLoM?: number, refHiM?: number,
    refLoF?: number, refHiF?: number,
    validFrom: 'YYYY-MM-DD',             // 此 ref 生效的起始日(比對報告日期)
    source: string,                      // 來源說明,人類可讀
  },
  // 後加的 override 排在後面,validFrom 越新排越後
]
```

**migration 起點**:每個 in-scope entry 都會放第一筆 `{machine:'*', refLo: 既有 refLo, refHi: 既有 refHi, validFrom:'1900-01-01', source:'migration 起點 — universal ref 既有值'}`。

### 2.2 Lookup 演算法(三維 nested:machine × time × gender)

給定 `(testId, machineSource, reportDate, patientGender)`:

```
1. 找 entry by testId
2. 若 entry 無 refHistory(排除 scope 或 BUN_pre/post 未獨立)→ 走 fallback chain:
   a. BUN_pre / BUN_post → 用 BUN 的 refHistory(若 BUN 有的話)
   b. 否則 → 用 outer refLo/refHi + outer loM/hiM/loF/hiF
3. 若 entry 有 refHistory:
   a. 篩 candidates: machine ∈ [machineSource, '*'], validFrom <= reportDate
   b. 排序: machine specific 勝 '*',同 machine 則 validFrom 越晚勝
   c. 取第一筆(本筆即 base)
   d. 解析性別 override(三層 fallback chain):
      若 patientGender = 'M':
        若本筆有 refLoM/refHiM → 用 refLoM/refHiM
        否則若 outer 有 loM/hiM → 用 loM/hiM
        否則用本筆 refLo/refHi
      若 patientGender = 'F':
        若本筆有 refLoF/refHiF → 用 refLoF/refHiF
        否則若 outer 有 loF/hiF → 用 loF/hiF
        否則用本筆 refLo/refHi
      若 patientGender 未知 → 用本筆 refLo/refHi
4. 若 candidates 為空(reportDate 早於所有 validFrom 或無對應 machine)→ 走 step 2 的 fallback chain
```

### 2.3 既有 `loM/hiM/loF/hiF` 與新 inline 性別 override 共存

- **outer `loM/hiM/loF/hiF`** 維持原樣不刪(backward compat + 第二層性別 fallback)
- **refHistory[] 內 inline** `refLoM/refHiM/refLoF/refHiF` 為**第一優先**性別 override
- 驗證規則(schema.js validateEntry 擴充):若 refHistory 內某筆有任一個 `refLoM/refHiM/refLoF/refHiF`,該筆**必須**同時有 `refLo/refHi` 作為性別未知時的 wide envelope

### 2.4 與既有 `hospitalScope` 互動(規則 #11)

`hospitalScope: 'tt' | 'yl' | undefined` 是**條目層**的限定 — 整個 entry 只在某院出現(例:vhyl-specific ABI 變體,但本案 ABI 不進 scope)。`refHistory[].machine` 是**ref 層**的限定 — 同一 entry 兩院都有,只是 ref 不同。

**規則**:
- 若 entry 有 `hospitalScope='tt'`,則 `refHistory[].machine` 只能是 `'vhtt' | '*'`
- 若 entry 有 `hospitalScope='yl'`,則 `refHistory[].machine` 只能是 `'vhyl' | '*'`
- 若 entry 無 `hospitalScope`(cross-hospital,本案多數情況),三值任意

---

## § 3 Machine source 識別(從本機 chrome 設定,不從 lab order)

YC 2026-05-27 拍板:**lookup key 用「本機 chrome 設定值」,不從 lab order key 推導**。前提:vhtt 和 vhyl 物理隔離獨立運作,vhtt 只看 vhtt 病人,vhyl 只看 vhyl 病人(極少跨機器看)。

### 3.1 Viewer 端(chrome extension)

- 存儲位置:**`chrome.storage.local`**,key = `currentMachine`,值 = `'vhtt' | 'vhyl'`
- **First-run wizard**:viewer 啟動時讀 storage,無值 → popup 下拉選一次(`'vhtt'` / `'vhyl'`)強制寫入
- 之後永久不變;lookup 時所有 `resolveRef()` call 都 carry 本機 `currentMachine` 當 `machineSource` 參數

### 3.2 Reporter 端(single HTML, file:// origin)

- 存儲位置:**`localStorage`**(reporter 無法讀 chrome extension 的 chrome.storage,namespace 隔離)
- key = `currentMachine`,值 = `'vhtt' | 'vhyl'`
- **First-run prompt**:reporter 三 HTML 各自啟動時讀 localStorage,無值 → modal 選一次強制寫入
- 之後永久不變

**規則 #11 暴露**:viewer 端 + reporter 端 storage **是兩個 namespace**,各自寫一次。YC 裝機時要在 viewer + reporter 端各做一次 first-run。設定後不再 prompt。

### 3.3 reportDate 識別 + fallback

`parseOrdersPage` 抓 row 時應該已經有採血日期或報告日期。

**Claude Code 第一輪 prep work**:
1. 確認 order 物件的日期欄位名(`collectDate` / `reportDate` / `date`)
2. 若 row 有兩個日期(採血 vs 報告),lookup 用「**報告日期**」(臨床嚴謹)
3. 確認 ROC 年 vs Western 年解析

**Fallback**:若 reportDate 抓不到(欄位缺 / 解析失敗)→ **lookup key = `today`**(用最新 ref)。同 chartno 只 `console.warn` 一次(避免 noisy)。

### 3.4 不再從 lab order key 推導 machine

既有 viewer/mapping.js 有 `(TT|YL)` 後綴處理,但那是 **catalog regex 分支**用(同一 entry vhyl 變體用不同 label,例 `CEA(YL)`),**不是 machine source 識別**。本案 machine source 識別純粹靠本機 chrome 設定,跟 lab order content 無關。

---

## § 4 SOP C 擴充

### 4.1 SOP C 觸發語(維持既有 + 新增 machine 變體)

| 觸發語 | 動作 |
|---|---|
| `<test_id> ref range 改成 lo/hi`(既有) | universal `*` 變體 — 改 refHistory 中 `machine:'*'` 那筆(或新加一筆覆蓋) |
| `vhtt/<test_id> ref range 改成 lo/hi`(新) | refHistory 末加 `{machine:'vhtt', refLo, refHi, validFrom:今天, source:'YC SOP C 觸發 ' + 日期}` |
| `vhyl/<test_id> ref range 改成 lo/hi`(新) | 同上,machine='vhyl' |
| `vhtt/<test_id> ref range 改成 lo/hi 來源 <source>`(新) | 同上,source 為指定 string |

性別 inline override(`refLoM/refHiM/refLoF/refHiF`)**不寫成 trigger 語**,由 YC 對話補述:
> 範例:`vhyl/RBC ref range 改成 3.5/6.0` + 補述「男 4.0-6.0,女 3.5-5.5」→ Claude 寫進 inline 性別 override

### 4.2 Trigger parser 邏輯(寫進 `cowork-project-instructions.md` + `PROJECT_CONTEXT.md`)

```
1. 訊息含「ref range 改成」keyword → SOP C 分支:
   a. 第二 token 帶 `vhyl/` 或 `vhtt/` 前綴 → machine-specific 變體
   b. 沒前綴 → universal 變體
2. 訊息含「沒抓到 / missing / 沒出現」keyword → SOP F→B/D
3. 訊息含「從 viewer/reporter 拿掉」keyword → SOP E
4. 否則第二 token 是 chartno 格式(數字+字母 9-11 字元混合) → SOP A
```

### 4.3 SOP C 動作步驟(擴充版)

1. 在 patterns repo 找到 entry
2. 若 entry 無 refHistory 欄位 → 先 migrate(把現有 refLo/refHi 變成第一筆 `{machine:'*', refLo, refHi, validFrom:'1900-01-01', source:'migration 起點'}`)
3. 加新的 override 筆數(視 trigger 語含 vhtt/ 或 vhyl/ 前綴決定 machine 值;視 YC 對話補述決定是否加 inline 性別 override)
4. `npm run release` → 跑 schema validate + node harness
5. 兩個 sibling repo `node sync-patterns.js` → push(維持規則 #3 先問)

### 4.4 Pattern-learning time machine awareness

YC 在 Cowork session 開頭明示「im in vhtt / im in vhyl」→ Claude carry context throughout session(SOP A pattern learning 用該 machine 對應 ernode URL 抓正式報告)。

Trigger 語含 `vhtt/` 或 `vhyl/` 前綴 → 覆蓋 session context(同 session 也可改別台 catalog,但極罕見)。

---

## § 5 跨 repo 副作用 + Release flow

新 schema 上線,跨 3 repo 都有副作用:

### 5.1 patterns repo

- `patterns/catalog.js`:53 個 in-scope entry 加 refHistory 欄位 + migration 起點筆數
- `patterns/schema.js`:
  - `ALLOWED_FIELDS` 加 `'refHistory'`
  - `validateEntry` 加 refHistory shape validation(陣列 / 每筆 machine ∈ valid set / validFrom 格式 / hospitalScope × machine 互動規則 § 2.4 / inline 性別 override fallback 規則 § 2.3)
- **新增 `patterns/lib/resolveRef.js`**(YC 拍板共享 helper):
  - export `resolveRef(testId, machineSource, reportDate, patientGender) → {refLo, refHi}`
  - 演算法見 § 2.2
- `docs/pattern-spec.md`:加 refHistory 欄位說明
- `PROJECT_CONTEXT.md` § 9:SOP C 改寫(對應 § 4)
- `docs/cowork-project-instructions.md`:加 machine 變體觸發語 + parser 邏輯(§ 4.2)
- `dist/patterns.json`:`npm run release` 自動產出
- **release flow 新增**:`lib/resolveRef.js` 進 dist,sync-patterns 端要拉這份檔到 viewer/reporter

### 5.2 viewer repo

- **First-run wizard** 加進 popup options page 或 popup 首啟動 modal:選 `'vhtt' | 'vhyl'` 寫 chrome.storage.local
- `lab-core.js` 新加 helper `getMachineSource()` 讀 chrome.storage(async 包 sync wrapper)
- `dashboard.js` / `report.js` / `popup.js` / `lab-core.js`:所有 refLo/refHi/lo/hi/loM/hiM/loF/hiF 引用點改 call `resolveRef()`(經 sync-patterns 拉 `patterns/lib/resolveRef.js`)
- `parseOrdersPage` 補確認 reportDate 欄位 § 3.3
- `sync-patterns.js`:拉新 catalog.js + 新 `lib/resolveRef.js`

### 5.3 reporter repo

- **First-run prompt** 加進三 HTML(`hospital-lab-ckd.html / hospital-lab-data.html / hospital-lab-dialysis.html`)各自啟動時:無 localStorage 值 → modal 選 `'vhtt' | 'vhyl'`
- 三 HTML 既有 refLo/refHi 引用點改 call `resolveRef()`(從 sync-patterns 拉的 `lib/resolveRef.js`)
- `sync-patterns.js`:拉新 catalog.js + 新 `lib/resolveRef.js`

---

## § 6 不做的事(scope guard)

1. **不**改 § 1.2 排除清單裡任何 entry 的 schema
2. **不**自動 fetch 正式報告 PDF 解析 ref(半自動 — 觸發式 SOP)
3. **不**改 Notion 同步邏輯(catalog 本身就是 single source of truth)
4. **不**加跨 repo 共享 registry DB(δ 路線);本案用 (A) 內嵌 catalog
5. **不**改 viewer / reporter 主畫面 UX 顯示(機器 + 校正日期不主動顯示在每個值旁,hover tooltip deferred follow-up)
6. **不**回頭 break 既有 SOP A/B/C/D/E/F 觸發語(backward compat)
7. **不**改 PROJECT_CONTEXT.md / cowork-project-instructions.md 以外的 SOP(只動 SOP C 區塊)
8. **不**從 lab order key 推 machine(YC 拍板)
9. **不**自動偵測哪台機器(沒 first-run prompt 就 lookup 等於 schema 設計 bug)
10. **不**強制使用者每次重啟 prompt 一次(設定一次後 silent)
11. **不**對 `BUN_pre / BUN_post` 獨立 refHistory(繼承 BUN)

---

## § 7 ✅ YC 已決議事項(2026-05-27 lock,不再開放)

| # | 議題 | 拍板 |
|---|---|---|
| 1 | validFrom 起點 | `1900-01-01`(無限早,字串 ISO 格式,lookup 永遠有 candidate) |
| 2 | machine awareness 三層 | pattern-learning(session 開頭明示 + trigger 語前綴)+ runtime(viewer chrome.storage + reporter localStorage first-run prompt)+ setup-time(不用,sync-patterns 兩台拉同一份 dist) |
| 3 | catalog model | (A) Central catalog + refHistory[].machine 內嵌(不分流兩份 catalog) |
| 4 | reportDate 缺 fallback | `today` + console.warn 同 chartno 一次 |
| 5 | SOP C trigger 衝突 | 不衝突,parser 邏輯寫進文件(§ 4.2) |
| 6 | viewer + reporter first-run prompt | 各自寫一次(viewer chrome.storage / reporter localStorage),設定後 silent |
| 7 | inline 性別 override | **版本 A 保留**(refHistory[] 內可 inline `refLoM/refHiM/refLoF/refHiF`,cover machine × gender 交叉差異) |
| 8 | BUN_pre/post 處理 | 列入 in-scope 但 ref 繼承 BUN(fallback chain) |
| 9 | HIVLoad 是否進 scope | 進 scope(獨立 refHistory) |
| 10 | resolveRef 共享 / 各自一份 | 共享 `patterns/lib/resolveRef.js`,sync-patterns 拉到 viewer/reporter |
| 11 | brief 自己 Order | 5.0,放 Notion |

---

## § 8 Claude Code 第一輪 prep work(動 catalog 前先做)

1. **grep viewer/reporter 既有 ref 引用點**:
   - pattern: `refLo|refHi|\.lo\b|\.hi\b|loM|hiM|loF|hiF`
   - 列引用點清單,評估 surface area
   - 若 >30 處且分散 → 分兩 commit(helper + 引用點)
2. **確認 parseOrdersPage 抓 reportDate 欄位名**(`collectDate` / `reportDate` / `date`)
3. **確認 ROC 年 vs Western 年解析**(避免 catalog `'1900-01-01'` 比錯)
4. **53 entry migration 路線評估**:script-driven(讀現有 refLo/refHi 自動產 refHistory 起點筆)還是手寫
5. **first-run wizard UI 設計**:viewer popup options page / popup 首啟動 modal / reporter HTML modal
6. **`patterns/lib/resolveRef.js` 在 release dist 怎麼包**:現 `sync-patterns.js` 邏輯能不能直接拉 lib 子目錄,還是要擴

---

## § 9 成功標準(規則 #9)

**做完判斷依據**(任何一條沒過 = 沒做完):

1. **catalog 53 個 in-scope entry 都有 refHistory 欄位**,每個至少一筆 `{machine:'*', validFrom:'1900-01-01', ...}` migration 起點
2. **`BUN_pre / BUN_post` 不獨立 refHistory**,lookup fallback 走 BUN
3. **schema.js validate 全綠**:`npm run release` 在 patterns repo 跑通
4. **`patterns/lib/resolveRef.js` 跑得通**:對任一 in-scope entry call resolveRef(testId, machine, date, gender),回 `{refLo, refHi}` 對應 § 2.2 演算法
5. **viewer first-run wizard** 跑通:無 chrome.storage `currentMachine` 時 prompt,選完後 silent
6. **reporter 三 HTML first-run prompt** 跑通:無 localStorage `currentMachine` 時 prompt,選完後 silent
7. **viewer Dashboard / popup / report**:對 vhtt 病人沒 regression(同 universal `*` ref 結果),設定為 vhyl 時若有 vhyl override 能讀
8. **reporter 三 HTML**:同上 regression check + override read
9. **SOP C 文件**:`PROJECT_CONTEXT.md § 9` + `cowork-project-instructions.md` 兩處 trigger 語都更新 + parser 邏輯(§ 4.2)寫入
10. **`docs/pattern-spec.md`**:加 refHistory 欄位說明
11. **三 repo `WORKLOG.md`**:各加一條(規則 #2)

## § 10 測試清單(規則 #9 — 每條對應一個業務行為)

### 10.1 schema 層(patterns repo,node harness)

- [ ] T1: 對 53 in-scope entry 各跑 `validateEntry`,全 pass
- [ ] T2: 寫一筆 invalid refHistory(`machine:'vhtt'` 但 entry `hospitalScope='yl'`)→ validate 報錯
- [ ] T3: 寫一筆 invalid refHistory(內有 `refLoM` 但無 `refLo`)→ validate 報錯
- [ ] T4: 對排除 scope entry(`eGFR / UACR / ABI`)不加 refHistory,validate 仍 pass(backward compat)
- [ ] T5: `BUN_pre / BUN_post` 不加 refHistory,但 BUN 有 → validate 仍 pass(fallback chain 設計)

### 10.2 resolveRef helper 層(patterns/lib/resolveRef.js,node harness)

- [ ] T6: 對 `WBC` 加兩筆 refHistory(`*` 預設 + `vhyl` 覆寫),`resolveRef('WBC', 'vhyl', today, null)` → 回 vhyl 覆寫值
- [ ] T7: 同上,`resolveRef('WBC', 'vhtt', today, null)` → 回 `*` 預設值
- [ ] T8: 對 `WBC` 的 vhyl override 設 `validFrom:'2026-02-01'`,`resolveRef('WBC', 'vhyl', '2025-08-01', null)` → 回 `*` 預設(date 早於 vhyl override)
- [ ] T9: 對排除 scope entry(`eGFR`)`resolveRef` → fallback 回 outer refLo/refHi
- [ ] T10: `BUN_pre` 無 refHistory,`resolveRef('BUN_pre', 'vhyl', today, null)` → 用 BUN 的 vhyl refHistory(若有);否則 BUN 的 `*`
- [ ] T11: inline 性別:對 `RBC` 加 refHistory 含 `refLoM:4.0, refHiM:6.0`,`resolveRef('RBC', 'vhyl', today, 'M')` → 回 refLoM/refHiM(inline 性別優先)
- [ ] T12: inline 性別 fallback:對 `RBC` refHistory 無 inline 性別,outer 有 `loM/hiM`,`resolveRef('RBC', 'vhyl', today, 'M')` → 回 outer loM/hiM(第二層 fallback)
- [ ] T13: reportDate 缺 fallback:`resolveRef('WBC', 'vhyl', null, null)` → 用 today + `console.warn` 觸發一次

### 10.3 機器識別層(viewer chrome.storage / reporter localStorage)

- [ ] T14: viewer 首次啟動無 `currentMachine` → first-run wizard 出現,選 `'vhyl'` 寫入 chrome.storage
- [ ] T15: viewer 後續啟動 → silent,直接拿 storage 值當 machineSource
- [ ] T16: reporter 三 HTML 首次啟動無 `currentMachine` → modal 出現,選 `'vhtt'` 寫入 localStorage
- [ ] T17: reporter 後續啟動 → silent

### 10.4 整合層(實機驗證,deferred 至 Claude Code 完成後)

- [ ] T18: vhtt OPD 開 viewer Dashboard 一位 vhtt-only DM 病人 → 所有 in-scope 欄位 ref 顯示跟 migration 前一致(no regression)
- [ ] T19: 手動加一筆 vhyl override(例:vhyl WBC refLo=3.8)→ release + sync → 把 viewer chrome.storage 改為 vhyl(or 在 vhyl 機器) → 同一病人 WBC ref 變 3.8
- [ ] T20: SOP C trigger 語 `vhyl/WBC ref range 改成 3.5/10.5` 跑通 → refHistory 末加一筆 → sync 後 vhyl 端 ref 變
- [ ] T21: SOP C 補述測試:`vhyl/RBC ref range 改成 3.5/6.0` + 補述「男 4.0-6.0,女 3.5-5.5」 → refHistory 末加一筆含 inline 性別 override

---

## § 11 風險區

1. **catalog migration 53 entry**:script-driven migration 比手寫穩(讀現有 refLo/refHi 自動產 refHistory 起點筆)。Claude Code prep work 評估
2. **viewer / reporter 既有 ref 引用點 surface area 未知**:Claude Code 第一輪 grep,若 >30 處且分散 → 分兩 commit
3. **reportDate 時區 / ROC 年解析**:catalog validFrom 寫 `'YYYY-MM-DD'`,跟 ernode reportDate 字串格式可能不一致 → Claude Code 第一輪確認
4. **schema 變動是 catalog 結構 change**,規則 #3 push 前要問。但內部 release flow / sync-patterns 不破壞 → 不算最高警告等級
5. **first-run wizard UX**:vhyl 端使用者若不熟流程可能誤選 vhtt → 加 confirm step(「你選的是 vhyl 玉里,確認?」)
6. **localStorage / chrome.storage 被手動清掉** → 下次啟動會再 prompt(可接受,不算 bug)
7. **patterns/lib/ 子目錄是新概念**:現 `sync-patterns.js` 可能只拉 catalog.js + dist/patterns.json,沒處理 lib/。Claude Code prep work 評估 sync 邏輯擴
8. **inline 性別 override migration 時不寫**:53 entry migration 起點筆只放 `{machine:'*', refLo, refHi, validFrom:'1900-01-01'}`,**不**自動 copy outer loM/hiM/loF/hiF 進 inline refLoM/refHiM/refLoF/refHiF — 讓性別 fallback chain 第二層(outer)自然 trigger,避免 schema 冗餘
9. **本 brief 寫好之後 catalog 仍會被別的工作線改**:若 § 7 議題回答後到 Claude Code 動手前有 vhyl pattern-learning(SOP A)新 entry,要記得新 entry 是否在 § 1.1 in-scope 清單

---

## § 12 模式聲明(規則 #5)

- 本 brief **在 Cowork 寫**(vhtt 2026-05-27)
- **實作交 Claude Code**(workspace root 開 session,跨 3 repo)
- Claude Code 第一輪做 § 8 prep work + 對 § 11 風險點給 YC 回報 → YC 拍板 prep 結論 → 動手實作
- 規則 #3 push 前問 → push → 同步 Notion(規則 #7)→ brief 改名 _done(規則 #6)

---

## § 13 後續(deferred follow-up,不入本 brief scope)

- viewer / reporter 主畫面是否在 hover tooltip 顯示 ref 來源機器 + 校正日期(UX 增強)
- 跨 repo 共享 resolveRef 寫法的進階優化(現方案是 sync-patterns 拉 lib/ 檔,未來想 ESM import / typescript 化的話 follow-up)
- 季抽樣校正 SOP(YC 每季拉 5 筆正式報告對 catalog ref)
- δ 路線(把 ref override 進跨 repo registry DB)— 跟 CKD/DM Dashboard Follow-up #1 同議題,等那條技術路線拍板再決定
- machine × gender 交叉差異實際案例累積後,evaluate 版本 A inline 性別 override 設計是否需要調整
