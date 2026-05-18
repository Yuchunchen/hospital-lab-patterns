# TASK_BRIEF — viewer repo:vhyl 肝炎三項硬編 regex 對齊

> **Status:** ACTIVE — 等 Claude Code 接手實作
> **Last updated:** 2026-05-05
> **Scope:** `report.js` 內 `findHepatitis()` / `findAntiHBs()` 三組 regex 改成支援 vhyl `(YL)` suffix
> **觸發:** 使用者回報 vhyl 病人 000151649A 的 HBsAg / Anti-HBs 在 reporter 已正常但 viewer 仍空白

---

## 1. 問題陳述

reporter 已經因為前一輪 catalog regex 修正(見 `hospital-lab-patterns/WORKLOG.md` 2026-05-05 條目)抓到 000151649A 的 HBsAg、Anti-HCV;但 viewer 對同一個病人:

- HBsAg、Anti-HBs **空白不顯示**
- HCV(預期也一樣空白,使用者還沒驗證)

## 2. 根因

viewer 的 `report.js` 對肝炎三項(HCV / HBsAg / AntiHBs)**完全不走 catalog 的 pattern**。它在 line 336 的 `findHepatitis()` helper 跟 line 377 的 `findAntiHBs()` IIFE 內硬編了自己的 regex:

```js
// report.js 現況
map['HCV']   = findHepatitis(
  /HCV Ab\(TT\):\s*(\S+)/,   // 只認 vhtt
  /Anti-HCV:\s*([\d.]+)/,
  'Anti-HCV'
);
map['HBsAg'] = findHepatitis(
  /HBsAg\(TT\):\s*(\S+)/,    // 只認 vhtt
  /HBsAg:\s*([\d.]+)/,
  'HBsAg'
);

// findAntiHBs
qm = text.match(/Anti-HBs:\s*(\S+)/);   // 沒鎖 suffix,vhyl 黏連格式
                                          // 抓到 "<num>Anti-HBs" 被 numeric
                                          // filter skip 掉 → 不顯示
```

之所以這樣設計:viewer 要同時呈現「定性結果 + 數值滴度」(顯示為 `正常 (HBsAg 0.24)` / `帶原 (Anti-HCV 1.92)`),單一 catalog regex 抓不到兩個東西,所以 viewer 自帶兩條(qualRe / numRe)各抓一塊。

但這也代表 catalog 改動**不會自動同步到 viewer**,需要這份 brief 把 viewer 內的硬編 regex 也對齊。

## 3. vhyl 真實樣本(來自 000151649A)

```
HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)
Anti-HCV: 0.12Anti-HCV (YL): Non-Reactive (Non-Reactive)請判讀
Anti-HBs: <num>Anti-HBs (YL): <Reactive|Non-Reactive>   ← 預期同格式,實樣未截
```

特性同前一輪:數值行 + 定性行黏連、定性行帶 `(YL)` suffix(且 lab name 與 `(YL)` 中間**有空白**)。

## 4. 提議改動

`report.js` 改三組 regex,設計策略跟 catalog 同步:

```js
// ── line ~364 ──
map['HCV']   = findHepatitis(
  /(?:HCV Ab|Anti-HCV)\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/,   // 定性鎖 (TT|YL),capture 跳過數字行
  /(?:HCV Ab|Anti-HCV):\s*([\d.]+)/,                       // 數值兼容兩種 label
  'Anti-HCV'
);

// ── line ~369 ──
map['HBsAg'] = findHepatitis(
  /HBsAg\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/,
  /HBsAg:\s*([\d.]+)/,
  'HBsAg'
);

// ── line ~377 findAntiHBs ──
// 改用 suffix-anchored 抓定性;numeric 仍然單獨抓
(function findAntiHBs() {
  for (const order of sorted) {
    const text = order.reportText || '';
    const qm = text.match(/Anti-HBs\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/);
    if (!qm) continue;
    const qualRaw = qm[1];                          // "Reactive" / "Non-Reactive" / 其他
    const date = resdttmToTaiwan(order.resdttm) || order.orderDate || '';
    const nm = text.match(/Anti-HBs:\s*([\d.]+)/);
    const numStr = nm ? nm[1] : '';
    let displayVal, tag;
    if (qualRaw === 'Reactive') {
      displayVal = '有抗體'; tag = 'normal';
    } else if (qualRaw === 'Non-Reactive') {
      displayVal = '無抗體'; tag = 'warning';
    } else {
      displayVal = qualRaw; tag = 'caution';
    }
    if (numStr) displayVal += ` (Anti-HBs ${numStr})`;
    map['AntiHBs'] = [{ date, value: displayVal, _tag: tag }];
    return;
  }
  map['AntiHBs'] = [];
})();
```

**設計關鍵(同 catalog batch):**

- 定性 regex 用 `\((?:TT|YL)\)` 鎖 suffix,只命中定性行 → capture 一定是 `Non-Reactive`/`Reactive` 之類的詞,不會抓到滴度數字。
- `[^\s\d]\S*` 雙保險:第一個字元不能是空白也不能是數字,即使未來出現新 hospital code(例如 `(KH)`)沒被 alternation 涵蓋,至少還是不會誤抓數字行。
- 數值 regex 不動策略,但 HCV 加入 `HCV Ab` alternation,以防 vhtt 數值行也用 `HCV Ab:` 開頭(觀察未確認,加上保險)。
- AntiHBs 移除原本的 `if (/[\d.]/.test(qualRaw)) continue;` 數字過濾 — 用 suffix anchor 後不再需要。

## 5. 測試樣本

| 測試 | 必須命中 → capture | 必須繼續命中(不退化) |
|---|---|---|
| HCV qual | `Anti-HCV (YL): Non-Reactive (Non-Reactive)請判讀` → `Non-Reactive` | `HCV Ab(TT): Non-Reactive` → `Non-Reactive` |
| HCV num | `Anti-HCV: 0.12Anti-HCV (YL):...` → `0.12` | `Anti-HCV: 1.92` → `1.92` |
| HBsAg qual | `HBsAg (YL): Non-Reactive (Non-Reactive)` → `Non-Reactive` | `HBsAg(TT): Non-Reactive` → `Non-Reactive` |
| HBsAg num | `HBsAg: 0.21HBsAg (YL):...` → `0.21` | `HBsAg: 0.24` → `0.24` |
| AntiHBs qual | `Anti-HBs (YL): Reactive (Reactive)` → `Reactive` | `Anti-HBs(TT): Reactive` → `Reactive` |
| AntiHBs num | `Anti-HBs: 100Anti-HBs (YL):...` → `100` | `Anti-HBs: 234` → `234` |

完整黏連字串走一次 end-to-end:

```js
const text = "HBsAg: 0.21HBsAg (YL): Non-Reactive (Non-Reactive)";
text.match(/HBsAg\s*\((?:TT|YL)\):\s*([^\s\d]\S*)/)?.[1]   // → "Non-Reactive"
text.match(/HBsAg:\s*([\d.]+)/)?.[1]                       // → "0.21"
// 組合顯示 → "正常 (HBsAg 0.21)"
```

## 6. 實作步驟(Claude Code)

1. 在 `hospital-lab-viewer/` 開 `claude`,讀本檔。
2. 編輯 `report.js`:
   - line ~364:更新 `map['HCV']` 的兩條 regex
   - line ~369:更新 `map['HBsAg']` 的兩條 regex
   - line ~377-400:更新 `findAntiHBs` IIFE,定性 regex 改用 suffix-anchored,移除舊的 `/[\d.]/` numeric filter
3. 在更動處上方加註解標記 vhyl 樣本來源,例如:

   ```js
   // vhyl sample (2026-05-05): "HBsAg (YL): Non-Reactive (Non-Reactive)"
   // vhtt sample: "HBsAg(TT): Non-Reactive"
   ```

4. **不需要跑 sync-patterns**,這是 viewer 自家 code,不從 catalog 來。
5. 開 `dist/hospital-lab-viewer.zip` 重打包(或依 viewer repo 的 build 步驟),side-load 到測試 chrome instance。
6. 用繁中更新 `WORKLOG.md`,條目重點:
   - 日期 2026-05-05
   - 補上 hepatitis 三項 regex 對齊到 vhyl
   - 註明這部分**不在 catalog,而是 viewer 自家硬編**,所以前一輪 catalog batch 沒涵蓋
   - 列舉測試樣本
7. git add + commit,顯示 commit message,**停下來等使用者說 push**。

## 7. 跨 repo 副作用

**無**。這次只動 viewer。catalog / reporter / patterns repo 都不受影響。

但有兩個延伸觀察(寫進 WORKLOG 但不馬上行動):

- viewer manifest 已經把 HBsAg / AntiHBs / HCV 標 `pattern:null + computed:'<id>'`,意圖是「定性顯示走 computed」。但 computed 函式目前沒實作,實際走 report.js 硬編。**架構債**:長期應該把 findHepatitis 邏輯搬進 `patterns-computed.js`,讓 viewer 跟 reporter 共用同一份。本輪不處理。
- AntiHBs 的 `findAntiHBs` IIFE 有套自己的標籤映射(`Reactive` → `有抗體`,跟 HBsAg 反過來)。如果未來搬進 computed.js,需要 polarity 參數化。

## 8. 驗收

side-load 新 zip 後重 fetch 000151649A:

- HBsAg 顯示 `正常 (HBsAg 0.21)`(預期 — Non-Reactive → 正常)
- Anti-HCV 顯示 `正常 (Anti-HCV 0.12)`
- Anti-HBs 顯示 `有抗體 (Anti-HBs <num>)` 或 `無抗體 (...)`,看實際定性結果

vhtt 既有病人(可挑近期一份報告)應該維持原本顯示,不退化。

## 9. WORKLOG.md 條目模板

```markdown
## 2026-05-05 — viewer hepatitis regex 對齊 vhyl (HCV / HBsAg / AntiHBs)

**觸發:** 前一輪 catalog batch 修了 vhyl 的 HBsAg/AntiHCV/AFP/TSAT/Fe,
但 viewer 對 hepatitis 三項是在 report.js 自家硬編 regex 處理(因為要
同時呈現定性+數值),catalog 改動沒同步到這裡。回報 000151649A 在 viewer
仍空白。

**修改 report.js:**
- findHepatitis HCV:定性 `(?:HCV Ab|Anti-HCV)\((TT|YL)\)`、capture `[^\s\d]\S*`
- findHepatitis HBsAg:定性 `HBsAg\((TT|YL)\)`、capture `[^\s\d]\S*`
- findAntiHBs:改 suffix-anchored,移除 numeric filter

**架構債(下次處理):** hepatitis 邏輯應該搬進 patterns-computed.js,
讓 viewer / reporter 共用同一份。

**跨 repo:** 無(catalog 不動)。
```
