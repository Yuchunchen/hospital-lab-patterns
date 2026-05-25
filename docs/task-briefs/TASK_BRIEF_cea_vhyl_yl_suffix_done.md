# TASK_BRIEF: CEA catalog regex 放寬 — vhyl `(YL)` suffix

> **方向**:vhyl Cowork 偵錯 → Claude Code 實作
> **產出 session**:vhyl Cowork session, 2026-05-25
> **執行完畢後請改名為 `TASK_BRIEF_cea_vhyl_yl_suffix_done.md`**(rule #6)

---

## 一句話

vhyl viewer 沒抓到 CEA。Raw label `CEA(YL): 7.37` value line 帶 `(YL)` suffix,
現行 catalog regex `/CEA:\s*([<>]?[\d.]+)/` 不匹配。比照 2026-05-05 milestone
同期 fix 的 AFP / Fe / TSAT / HBsAg / AntiHCV style,加 `(?:\((?:TT|YL)\))?` 可選後綴。

---

## 觸發 case

- chartno:`000023172B`(vhyl, 陳添枝 M 72)
- 抽血時間:115/04/21 16:00
- ernode label 樣式:`CEA(YL): 7.37`(refHi=5 ng/mL → 該值會 alarm)
- 介面:viewer(OPD handout),catalog + viewer manifest 都有 CEA 但 regex 漏

---

## 根因

CEA 是 2026-05-05「vhyl 五批修正」當時遺漏的同類 case。同 section(癌症指數)
的 AFP 已修(line 501),CEA(line 507)沒同步處理。

順手實證(同 session 內驗證):
- vhyl/000043086E PSA value `PSA: 5.830` → 不帶 (YL),現行 regex ✓
- vhyl/000043086E Free PSA value `FREE PSA/PSA RATIO: 1.286` → 已涵蓋 ✓
- vhyl/000043086E CA-199 value `CA 19-9: 37.6` → 現行 `.?` × 2 已涵蓋 ✓

**結論**:vhyl 同 section 只 CEA 一條漏,本 brief **不擴張** 到其他 test。

---

## 修改

### `patterns/catalog.js` — CEA entry(line 507-512)

```diff
-  { id:'CEA',
-    pattern: /CEA:\s*([<>]?[\d.]+)/,
+  // vhyl sample (2026-05-25): "正式報告 CEA(YL): 7.37" — chartno 000023172B
+  // 比照 AFP / Fe / TSAT 同期 fix 加 (TT|YL) 可選後綴。
+  // 同 section 其他 test (PSA / FreePSA / CA199 / CA125) 在 vhyl 端 value
+  // line 都不帶 (YL),CEA 是異例 — 不擴張本 fix 範圍。
+  { id:'CEA',
+    pattern: /CEA\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/,
     displayName:'癌胚抗原 (CEA)', shortLabel:'CEA',
     unit:'ng/mL', category:'癌症指數',
     ref:'< 5 ng/mL(大腸直腸)',
     refLo:null, refHi:5, hi:5, lo:null },
```

注意:value capture group 同時從 `([<>]?[\d.]+)` → `([<>]?\s*[\d.]+)`,加 `\s*` 對齊同期其他 entry,防備未來 detection-limit `CEA: < 0.5` 樣本。

### `WORKLOG.md` — 加 5/25 條目

```
## 2026-05-25 (vhyl)

### CEA catalog regex 放寬支援 vhyl (YL) suffix

- 觸發 case:vhyl/000023172B CEA(YL): 7.37 — viewer 沒抓到
- 根因:2026-05-05「vhyl 五批修正」當時 catalog 同期遺漏 CEA;value line 帶
  `(YL)` suffix,現行 `/CEA:\s*.../` 不命中
- Patch:`pattern: /CEA\s*(?:\((?:TT|YL)\))?:\s*([<>]?\s*[\d.]+)/`
  - 順手 `([<>]?[\d.]+)` → `([<>]?\s*[\d.]+)` 對齊同期 detection-limit style
- 同 session 順手實證,vhyl 同 section 其他 test value line 都不帶 (YL):
  - PSA `PSA: 5.830` ✓ / Free PSA `FREE PSA/PSA RATIO: 1.286` ✓ / CA-199 `CA 19-9: 37.6` ✓
  - 不擴張本 fix 範圍
- Validation:
  - `CEA(YL): 7.37` → "7.37" ✓
  - `CEA: 5.0` (vhtt in-house) → "5.0" ✓
  - `CEA(TT): 3.2` (vhtt suffix 防備) → "3.2" ✓
  - `CEA: <0.5` (detection limit 防備) → "<0.5" ✓
```

### 跑 release + sync

```powershell
cd hospital-lab-patterns ; npm run release
cd ../hospital-lab-viewer ; node sync-patterns.js
cd ../hospital-lab-reporter ; node sync-patterns.js   # CEA 不在 reporter manifest,但維持紀律
```

### git commit + push

```
patterns: relax CEA regex for vhyl (YL) suffix

vhyl/000023172B 的 CEA value line 帶 (YL) suffix,viewer 漏抓。
比照 2026-05-05 同期 fix 加 (?:TT|YL) optional alternation。
順手 ([<>]?[\d.]+) → ([<>]?\s*[\d.]+) 對齊 detection-limit style。
```

---

## 成功標準

1. catalog.js CEA entry pattern 已替換成新 regex
2. `npm run validate` 通過
3. `dist/patterns.json` rebuild,CEA 條目 regex 反映新樣式
4. viewer `mapping.js` sync 後含新 pattern
5. reporter sync 後 inline pattern block 同步(無 CEA manifest 不影響,但保持紀律)
6. WORKLOG.md 加好條目
7. 三 repo 都 commit;**push 前先問 YC**(rule #3)

## 測試清單

每條對應一個業務行為,可獨立驗證:

| # | 行為 | 驗證方法 |
|---|---|---|
| 1 | vhyl `(YL)` suffix 樣本能抓到值 | console: `re.exec('CEA(YL): 7.37')[1] === '7.37'` |
| 2 | vhtt 無 suffix 樣本仍能抓到值(不 regress) | console: `re.exec('CEA: 5.0')[1] === '5.0'` |
| 3 | vhtt `(TT)` suffix 樣本能抓到值(對稱防備) | console: `re.exec('CEA(TT): 3.2')[1] === '3.2'` |
| 4 | detection-limit `<` 帶空格樣本能抓到值 | console: `re.exec('CEA: < 0.5')[1] === '< 0.5'` |
| 5 | viewer 端 OPD handout 渲染 vhyl/000023172B 能看到 CEA = 7.37(alarm color) | 手動:重 sync viewer extension → 點該病人 → 看癌症指數 section |
| 6 | `npm run validate` 沒新增 warning | `npm run validate` 輸出檢查 |

---

## 跨 repo 副作用提醒(rule #4)

- patterns 改 → viewer **必** re-sync(CEA 在 viewer manifest)
- reporter 無 CEA manifest,sync 動作 inline pattern block 會更新但沒實質效果 — 仍跑保持紀律
- viewer 端 OPD 24h 內自動拿到新 `dist/patterns.json`(runtime fetch),不需重灌 zip
- reporter 端不需發新 HTML(本 fix 對 reporter 無感)

---

## 完成 checklist

- [ ] catalog.js CEA entry 替換
- [ ] WORKLOG.md 加 5/25 條目
- [ ] `npm run release` 通過
- [ ] viewer `node sync-patterns.js`
- [ ] reporter `node sync-patterns.js`
- [ ] 三 repo `git add / commit`
- [ ] 顯示 commit msg 等 YC 說 push
- [ ] push 後改名 `_done` + 同輪 commit
- [ ] push 後同步 Notion 「🛠 開機 SOP」TASK_BRIEF Dashboard(rule #7)
