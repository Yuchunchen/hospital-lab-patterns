# TASK_BRIEF — Item B:肝炎 regex 集中化到 patterns-computed.js

> **Status:** ACTIVE — 設計確定,等 Claude Code 接手實作
> **Last updated:** 2026-05-05
> **Scope:** patterns + viewer 兩 repo(reporter 不動)
> **觸發:** 2026-05-05 Issue 1 收尾 backlog 第 2 條 — viewer 肝炎硬編 regex 應該搬進 patterns-computed.js,跟 catalog 規則對齊到單一來源
> **使用者選項:**(α)+ viewer 切到 computed display,reporter 維持原 raw 顯示

---

## 1. 為什麼要做

**現況痛點:**

- catalog 的 HBsAg / AntiHBs / AntiHCV 有「定性 regex」(reporter 直接用)。
- viewer `report.js` 的 `findHepatitis()` 跟 `findAntiHBs()` IIFE **硬編了自己的一套 regex**,完全 bypass catalog。
- 結果:同一份規則寫兩次,vhyl/vhtt 變體要兩邊同步(這就是 2026-05-05 為什麼開了 catalog batch 還要單開 Issue 2 補 viewer 的原因)。

**目標狀態:**

- 所有肝炎 regex 集中在 catalog(raw 定性 + raw 數值各一條)。
- patterns-computed.js 內三個函式,負責把 raw 定性 + raw 數值組成顯示用 tuple。
- viewer 透過 manifest 指向 computed display 條目,移除 report.js 的硬編 regex。
- reporter 維持現狀(用 raw 定性,不切到 computed display)。

## 2. 設計概觀

```
catalog.js
├── 既有 (raw 定性,reporter 用)
│   HBsAg     pattern: /HBsAg\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/
│   AntiHBs   pattern: /Anti-HBs\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/   ← Issue 2 也要把 viewer 一樣的對齊邏輯反向 sync 進來
│   AntiHCV   pattern: /(?:HCV Ab|Anti-HCV)\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/
│
├── 新增 (raw 數值滴度,viewer computed 用)
│   HBsAgTiter     pattern: /HBsAg:\s*([\d.]+)/
│   AntiHBsTiter   pattern: /Anti-HBs:\s*([\d.]+)/
│   AntiHCVTiter   pattern: /(?:HCV Ab|Anti-HCV):\s*([\d.]+)/
│
└── 新增 / 既有 (computed display wrappers,viewer 用)
    HBsAgDisplay     computed:'HBsAgDisplay',  needs:['HBsAg','HBsAgTiter']         ← 新
    AntiHBsDisplay   computed:'AntiHBsDisplay', needs:['AntiHBs','AntiHBsTiter']    ← 新
    HCV              computed:'HCV',            needs:['AntiHCV','AntiHCVTiter']    ← 既有,把函式真正寫出來

patterns/computed.js
├── HBsAgDisplay({ HBsAg, HBsAgTiter })   → { value, tag }   polarity:Reactive=warning
├── AntiHBsDisplay({ AntiHBs, AntiHBsTiter }) → { value, tag } polarity:Reactive=normal
└── HCV({ AntiHCV, AntiHCVTiter })        → { value, tag }   polarity:Reactive=warning
```

**註:** AntiHBs 顯示邏輯與 HBsAg / HCV polarity 相反(`Reactive` = 有抗體 = `normal`,`Non-Reactive` = 無抗體 = `warning`)。函式內處理。

## 3. 顯示 tuple 規格

每個 computed 函式回傳:

```js
{
  value: '正常 (HBsAg 0.21)',         // 顯示字串(顯示邏輯與目前 viewer 完全一致)
  tag:   'normal',                     // 'normal' | 'warning' | 'caution'
}
```

字串組合規則(從現行 viewer report.js findHepatitis 直接搬):

| qualRaw | HBsAgDisplay / HCV(Reactive=bad) | AntiHBsDisplay(Reactive=good) |
|---|---|---|
| `Reactive` | `帶原 ({label} {titer})` tag:warning | `有抗體 (Anti-HBs {titer})` tag:normal |
| `Non-Reactive` | `正常 ({label} {titer})` tag:normal | `無抗體 (Anti-HBs {titer})` tag:warning |
| 其他文字 | 原文 + `({label} {titer})` tag:caution | 原文 + `(Anti-HBs {titer})` tag:caution |

`titer` 缺值時,字串去掉括號部分(只剩 `正常` 之類)。日期取對應 raw 條目的 entry.date。

## 4. catalog.js 修改

新增 3 條 raw 數值 + 2 條 computed display(HCV 只是補上 needs 欄位,不重寫)。

放置位置:現有 hepatitis 區塊(line 478+):

```js
// ═══════════════════════════════════════════════════════════════════════
// HEPATITIS / INFECTION
// ═══════════════════════════════════════════════════════════════════════

// Raw qualitative — used by reporter for table display
{ id:'HBsAg', pattern: /HBsAg\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/, ... }   // 既有
{ id:'AntiHBs', pattern: /Anti-HBs\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/, ... } // 既有(若沒對齊到 vhyl 樣式,連同對齊)
{ id:'AntiHCV', pattern: /(?:HCV Ab|Anti-HCV)\s*(?:\((?:TT|YL)\))?:\s*([^\s\d]\S*)/, ... } // 既有

// Raw numeric titer — NEW. Captures the OD/titer numeric line.
// vhyl 黏連格式 "HBsAg: 0.21HBsAg (YL): Non-Reactive" — \[\d.\]+ 自然停在 "H"
{ id:'HBsAgTiter',
  pattern: /HBsAg:\s*([\d.]+)/,
  displayName:'HBsAg 滴度', shortLabel:'HBsAg titer',
  unit:'', category:'肝炎 / 感染',
  notes:'Numeric titer for HBsAg. Used by HBsAgDisplay computed wrapper.' },

{ id:'AntiHBsTiter',
  pattern: /Anti-HBs:\s*([\d.]+)/,
  displayName:'Anti-HBs 滴度', shortLabel:'Anti-HBs titer',
  unit:'', category:'肝炎 / 感染' },

{ id:'AntiHCVTiter',
  pattern: /(?:HCV Ab|Anti-HCV):\s*([\d.]+)/,
  displayName:'Anti-HCV 滴度', shortLabel:'Anti-HCV titer',
  unit:'', category:'肝炎 / 感染' },

// Computed display wrappers — NEW (HBsAgDisplay, AntiHBsDisplay) +
// EXISTING HCV gets its `needs` array specified.
{ id:'HBsAgDisplay', computed:'HBsAgDisplay', pattern:null,
  needs:['HBsAg','HBsAgTiter'],
  displayName:'B型肝炎(顯示)', shortLabel:'HBsAg',
  category:'肝炎 / 感染', qualitative:true, singleValue:true,
  notes:'Computed display wrapper. viewer 用此 id 顯示;reporter 用 raw HBsAg.' },

{ id:'AntiHBsDisplay', computed:'AntiHBsDisplay', pattern:null,
  needs:['AntiHBs','AntiHBsTiter'],
  displayName:'B肝抗體(顯示)', shortLabel:'Anti-HBs',
  category:'肝炎 / 感染', qualitative:true, singleValue:true,
  notes:'Anti-HBs polarity 與 HBsAg/HCV 相反:Reactive=normal' },

{ id:'HCV', computed:'HCV', pattern:null,                              // 既有,加 needs
  needs:['AntiHCV','AntiHCVTiter'],
  displayName:'C型肝炎', shortLabel:'HCV',
  category:'肝炎 / 感染', qualitative:true, singleValue:true,
  notes:'Computed display wrapper around AntiHCV raw + AntiHCVTiter numeric.' },
```

## 5. patterns/computed.js 修改

加 3 個函式。共用 helper 處理字串組合:

```js
// ─── Hepatitis display ──────────────────────────────────────────────────
//
// 三個 marker(HBsAg / Anti-HBs / Anti-HCV)的呈現邏輯共用一份,差別只在
// polarity:HBsAg / HCV 的 Reactive=有疾病(warning),Anti-HBs 的
// Reactive=有抗體(normal)。
//
// Inputs 都是 [{ date, value, ... }] 形式,從 raw qualitative / raw titer
// catalog 條目來。本函式取最新一筆。

function _hepatitisDisplay(qualEntries, titerEntries, label, polarity) {
  // polarity: 'antigen' (Reactive=warning) | 'antibody' (Reactive=normal)
  const q = (qualEntries && qualEntries[0]) || null;
  if (!q) return null;
  const t = (titerEntries && titerEntries[0]) || null;
  const numStr = t ? t.value : '';

  let displayVal, tag;
  const qualRaw = q.value;
  if (qualRaw === 'Reactive') {
    if (polarity === 'antigen') { displayVal = '帶原'; tag = 'warning'; }
    else                        { displayVal = '有抗體'; tag = 'normal'; }
  } else if (qualRaw === 'Non-Reactive') {
    if (polarity === 'antigen') { displayVal = '正常'; tag = 'normal'; }
    else                        { displayVal = '無抗體'; tag = 'warning'; }
  } else {
    displayVal = qualRaw; tag = 'caution';
  }
  if (numStr) displayVal += ` (${label} ${numStr})`;

  return { date: q.date, value: displayVal, tag };
}

function HBsAgDisplay({ HBsAg, HBsAgTiter }) {
  return _hepatitisDisplay(HBsAg, HBsAgTiter, 'HBsAg', 'antigen');
}
function AntiHBsDisplay({ AntiHBs, AntiHBsTiter }) {
  return _hepatitisDisplay(AntiHBs, AntiHBsTiter, 'Anti-HBs', 'antibody');
}
function HCV({ AntiHCV, AntiHCVTiter }) {
  return _hepatitisDisplay(AntiHCV, AntiHCVTiter, 'Anti-HCV', 'antigen');
}
```

註冊到 module 匯出 + 既有的 computed name → function 對照表(viewer / reporter consumer 透過字串名 lookup)。

## 6. viewer 修改

### 6.1 manifest (`patterns/viewer.js`)

```js
// before
{ id:'HCV',     page:1, col:4, section:'肝炎' },
{ id:'HBsAg',   page:1, col:4, section:'肝炎',
  computed:'HBsAg',  pattern:null, singleValue:true },
{ id:'AntiHBs', page:1, col:4, section:'肝炎',
  computed:'AntiHBs', pattern:null, singleValue:true },

// after
{ id:'HCV',             page:1, col:4, section:'肝炎' },          // 不變
{ id:'HBsAgDisplay',    page:1, col:4, section:'肝炎' },          // 改 id
{ id:'AntiHBsDisplay',  page:1, col:4, section:'肝炎' },          // 改 id
```

確認以下兩件事的處理(Claude Code 在 viewer repo 實作時驗證):

a. **viewer parse loop 抓 raw HBsAg / HBsAgTiter / AntiHBs / AntiHBsTiter / AntiHCV / AntiHCVTiter 的路徑**:這 6 條是 raw 條目供 computed 函式吃。它們可能本來就在 catalog → viewer 自動抓;也可能 viewer 是基於 manifest 來決定要抓哪些 → 需要另外加進 manifest 並標 `extractOnly:true`(或 page/col 留空)讓 render 跳過它們。看 `pattern-loader.js` / parse loop 怎麼設計。

b. **computed runner**:viewer 內目前沒有「manifest 上的 computed entry → 自動 lookup patterns-computed.js 的函式 → 結果存進 map」這種泛用機制。eGFR / GFRStage 那些是在 report.js 內 inline 計算。實作時可以:
   - **路徑 1(推薦,最小變動):**在 report.js 加幾行專用 dispatcher,看到 manifest entry 有 `computed: 'HBsAgDisplay' | 'AntiHBsDisplay' | 'HCV'` 時,從 patterns-computed.js 拿函式跑出結果存進 map。
   - **路徑 2(好但範圍大):**寫一個泛用的 computed runner,所有 `computed` 欄位的 entry 都自動跑。順便把 eGFR / URR / GFRStage 也統一成這條路徑。**不在本輪 scope**,放後續 backlog。

走路徑 1。

### 6.2 `report.js` 改動

a. **刪除 `findHepatitis()` 函式**(line ~336 整段,包含 line 364-373 的兩個 `map['HCV']` / `map['HBsAg']` 賦值)。

b. **刪除 `findAntiHBs` IIFE**(line ~377-400)。

c. **加入小 dispatcher**,把肝炎三項從 patterns-computed.js 跑出來:

```js
// 假設 patterns-computed.js 已經 export 為 PATTERNS_COMPUTED 全域物件
function runHepDisplay(id, fn, neededIds) {
  const inputs = {};
  for (const k of neededIds) inputs[k] = map[k] || [];
  const out = fn(inputs);
  map[id] = out ? [{ date: out.date, value: out.value, _tag: out.tag }] : [];
}

if (PATTERNS_COMPUTED.HCV) {
  runHepDisplay('HCV',           PATTERNS_COMPUTED.HCV,           ['AntiHCV','AntiHCVTiter']);
  runHepDisplay('HBsAgDisplay',  PATTERNS_COMPUTED.HBsAgDisplay,  ['HBsAg','HBsAgTiter']);
  runHepDisplay('AntiHBsDisplay',PATTERNS_COMPUTED.AntiHBsDisplay,['AntiHBs','AntiHBsTiter']);
}
```

實際變數名以 viewer 內既有引用為準。

d. **確認 singleValue 顯示路徑**(line ~593 註解處的 "Single-value display"):viewer 目前已用此路徑顯示 HCV / HBsAg / AntiHBs,改用新 id (HBsAgDisplay / AntiHBsDisplay) 後,看 render 是否依然透過這條路徑找 map[id] 取資料。如果 render 用 hardcoded id list,要把 'HBsAg' / 'AntiHBs' 換成 'HBsAgDisplay' / 'AntiHBsDisplay'(或兩邊都列以 backwards-compat)。

## 7. reporter 不變

reporter manifest 用 raw `HBsAg` / `AntiHBs` / `AntiHCV` 顯示 raw 定性文字(`Non-Reactive` / `Reactive`)。這些 entry 仍從 catalog 拿,跟前面 vhyl batch 已經修好的 regex 一致。

reporter 只需要 sync-patterns 把新加的 raw 數值條目(HBsAgTiter / AntiHBsTiter / AntiHCVTiter)同步進 inline pattern block — **這些不會出現在 reporter manifest,所以不會 render 出來**,但 catalog 的完整性需要它們在 inline block 內。確認 sync-patterns.js 是把整份 catalog inline,還是只 inline 在 reporter manifest 內的 entry — 可能要視情況更新 sync 腳本。

如果 sync-patterns.js 只 inline 在 manifest 內的 entry → 新加的 *Titer 不會出現在 reporter inline block → 對 reporter 沒任何影響(reporter 也不會用到)。**這應該是預設情形,不需改 sync 腳本。**

## 8. 測試樣本

### 8.1 vhyl 樣本(從 000151649A)

```
HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)
Anti-HCV: 0.12Anti-HCV (YL): Non-Reactive (Non-Reactive)請判讀
Anti-HBs: <num>Anti-HBs (YL): <Reactive|Non-Reactive>(實樣未截,以實際結果為準)
```

期望:
- HBsAgDisplay 跑 `_hepatitisDisplay(HBsAg=[{value:'Non-Reactive',...}], HBsAgTiter=[{value:'0.21',...}], 'HBsAg', 'antigen')` → `{ value:'正常 (HBsAg 0.21)', tag:'normal' }`
- HCV 同模式 → `{ value:'正常 (Anti-HCV 0.12)', tag:'normal' }`
- AntiHBsDisplay 看實際定性結果:Reactive → `有抗體 (Anti-HBs <num>)` normal;Non-Reactive → `無抗體 (Anti-HBs <num>)` warning

### 8.2 vhtt 樣本(回歸測試)

```
HBsAg(TT): Reactive             → HBsAgDisplay: 帶原 (HBsAg <titer>) warning
HCV Ab(TT): Non-Reactive        → HCV: 正常 (Anti-HCV <titer>) normal
Anti-HBs(TT): Reactive          → AntiHBsDisplay: 有抗體 (Anti-HBs <titer>) normal
```

### 8.3 邊界 case

- titer 不存在:`{ value:'正常', tag:'normal' }`(不附括號)
- 異常 qualitative 文字:`{ value:'<原文>', tag:'caution' }`
- 完全沒抓到定性:`null` → map[id] = `[]`(viewer render 顯示空白)

## 9. 實作順序

### Phase 1 — patterns repo

```powershell
cd D:\self\Dropbox\1.Project.YuLi\20251005.lab_report\hospital-lab-patterns
claude
```

讓 Claude Code:

1. 改 `patterns/catalog.js`,加 3 條 raw titer + 2 條新 display + 補 HCV.needs。
2. 改 `patterns/computed.js`,加 `_hepatitisDisplay` helper 跟 3 個函式,註冊到 module exports + computed name 對照表。
3. 跑 `npm run release`,確認 validate / build-json 都通過。
4. 寫暫存 spec script `scripts/hep-display-spec.js` 跑第 8 節所有樣本,印 PASS/FAIL。全 PASS 刪掉。
5. 用繁中更新 WORKLOG.md(主題:肝炎顯示集中化)。
6. git add + commit + 顯示 commit message + 等使用者 push。

### Phase 2 — viewer repo

patterns push 之後:

```powershell
cd ..\hospital-lab-viewer
claude
```

讓 Claude Code:

1. `node sync-patterns.js`,確認 mapping.js 多了 HBsAgTiter / AntiHBsTiter / AntiHCVTiter / HBsAgDisplay / AntiHBsDisplay 5 條,patterns-computed.js 新加的 3 個函式有同步進 viewer 的 patterns-computed.js。
2. 改 `patterns/viewer.js`(viewer manifest),把 HBsAg / AntiHBs 兩條改 id 成 HBsAgDisplay / AntiHBsDisplay。確認:
   - 如果 viewer 的 parse loop 是看 manifest extract:加 raw HBsAg / HBsAgTiter / AntiHBs / AntiHBsTiter / AntiHCV / AntiHCVTiter 為 extract-only entry(看 viewer.js 既有慣例)。
   - 如果 parse loop 是吃整份 catalog:不需加。
3. 改 `report.js`:刪除 findHepatitis 跟 findAntiHBs;加入 dispatcher 跑 PATTERNS_COMPUTED.{HCV,HBsAgDisplay,AntiHBsDisplay}。確認 singleValue render 路徑用 HBsAgDisplay/AntiHBsDisplay id 取得結果。
4. 開瀏覽器手測:
   - 載入 vhyl 000151649A,看肝炎欄是否正確顯示「正常 (HBsAg 0.21)」、「正常 (Anti-HCV 0.12)」、Anti-HBs 看實際結果。
   - 載入 vhtt 任一肝炎有結果的病人,確認回歸樣本正確顯示。
5. 重打包 zip,WORKLOG 寫一條,commit + 顯示 commit message + 等使用者 push。

### Phase 3 — reporter sync(只 sync,不改 code)

```powershell
cd ..\hospital-lab-reporter
claude
```

1. `node sync-patterns.js`,看 inline pattern block 是否新增了 *Titer 三條(看 sync 腳本怎麼選 entry)。
2. 確認 reporter 重 fetch 那兩個 vhyl 病人,HBsAg / Anti-HBs / Anti-HCV 表格欄位仍是 raw 定性文字(無變化)。
3. WORKLOG 寫一條 sync 紀錄,commit + 顯示 commit message + 等使用者 push。

## 10. 跨 repo 副作用 checklist

- [ ] patterns push(catalog 5 entry + computed.js + dist/patterns.json)
- [ ] viewer push(viewer manifest + report.js + mapping.js sync + 重打包 zip)
- [ ] reporter push(只是 sync 同步,可能無實質變化)

## 11. 驗收

- vhyl 000151649A viewer:三項肝炎顯示「正常 (HBsAg 0.21)」格式 ✓
- vhtt 既有病人 viewer:三項肝炎顯示不退化 ✓
- vhyl 000151649A reporter:三項肝炎仍顯示 raw `Non-Reactive` 文字 ✓
- 不再有 viewer 與 catalog 規則不同步的可能(report.js 已無硬編 regex)✓

## 12. 後續 backlog

- 寫泛用 computed runner,把 eGFR / URR / GFRStage / UACRStage / UPCRStage / KDIGO / TaiwanCKD / EarlyCKD 等也統一收編,徹底取代 report.js 內各種 inline 計算。本輪不做。
- 針對 reporter 加可選的「formatted display」manifest flag(同一條 catalog entry 可選 raw 或 computed display),讓 reporter 將來想切過去時不需修改 catalog 結構。本輪不做。

---

## Reference: notes for future Kt/V brief(從上一版保留)

If/when Kt/V gets reactivated:

- Formula: simplified Daugirdas single-pool with t=4hr, UF/W=0.03 →
  `Kt/V = -ln(R - 0.032) + (4 - 3.5·R) × 0.03`, where `R = BUN_post / BUN_pre`
- Hand-test target: BUN 80/25 → Kt/V ≈ 1.36 (adequate dialysis)
- Reference: Daugirdas JT. JASN 1993; 4(5):1205–13.
- Add as `KtV` (id), unit `''`, ref `>= 1.2`, lo `1.2`, hi `null`,
  needs `['BUN_pre','BUN_post']`.

## Reference: notes for future Al brief(從上一版保留)

If/when Al gets reactivated:

- Need a real sample (raw `reportText` line) before writing the regex
- Vhyl `searchItem=alu` and `searchItem=鋁` both return 0 on
  patient 000105069H — confirm with another long-term dialysis patient
  or call the lab to verify Al is on the panel
- Check vhtt separately — the two hospitals may differ
- Suggested initial regex shape (subject to sample): `(?:Al|Aluminum)(?:\(Serum\))?\s*:\s*([\d.]+)`
- Unit on form: µg/L; some labs report ng/mL. Add normalizer if needed.
