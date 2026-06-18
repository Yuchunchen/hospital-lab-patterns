# TASK_BRIEF: viewer 新增「白血球分類 (DC)」section — DC 五分類%

> **方向**:vhyl Cowork 設計/抓樣本 → Claude Code 實作
> **產出 session**:vhyl Cowork session, 2026-06-16
> **執行完畢後請改名為 `TASK_BRIEF_viewer_wbc_dc_section_done.md`**（rule #6）

---

## 一句話

viewer (OPD handout) 新增一個 section「白血球分類 (DC)」,放 DC 五分類百分比
(Neutrophil / Lymphocyte / Monocyte / Eosinophil / Basophil)。`WBC` **維持
在「血液」section 不動**。**catalog 沒有任何 DC entry,需新增 5 條。**
範圍 **viewer only**,不動 reporter manifest。

---

## 範圍與決策(2026-06-16 vhyl Cowork 已定）

| 項目 | 決策 |
|---|---|
| DC 內容 | 只要 5 分類**百分比**(不含絕對值) |
| 參考值 hi/lo | **不放**(YC 指定)→ DC% 為 display-only,無 alarm 上色 |
| Total IgE | **本輪不做**(樣本未取得,延後) |
| 目標 app | **viewer only**(reporter 不加) |
| WBC 位置 | **維持在「血液」section 不動** |
| section 名稱 | `白血球分類 (DC)`(原「白血球免疫過敏」因 IgE 拿掉、WBC 留血液而改名;YC 可改回) |

---

## 樣本(live-fetch 實證,vhyl)

chartno `000037249G`(吳靜如 F 55),order name `DC(YL)`,兩個日期一致:

```
DC(YL) 正式報告  115/03/17
NEUT: 51.5   LYM: 39.0   MONO: 5.8   EOSINO: 2.8   BASO: 0.9

DC(YL) 正式報告  114/09/22
NEUT: 52.7   LYM: 38.3   MONO: 5.6   EOSINO: 2.8   BASO: 0.6
```

label 格式:`<MNEMONIC>: <number>`,value line **不帶 `(YL)` suffix**。
WBC 樣本(同病人 `CBC(YL)`):`WBC: 7.02` — 現行 catalog regex 已命中,WBC 不動 pattern。

⚠️ **vhtt 端 DC label 尚未確認**(本 session 在 vhyl,抓不到 vhtt host)。
value line 不帶院區 suffix,**推測** vhtt 同名,但分析儀 mnemonic 可能不同
(如 `SEG`/`NE%`/`LY%`)。見下方「Open / 待確認」。

---

## 修改

### 1. `patterns/catalog.js` — 新增 5 條 DC entry

放在 WBC/RBC 附近(category `血液`)。**刻意不放 hi/lo/ref**(YC 指定)。

```js
// DC 五分類百分比 (differential count, %) — vhyl sample 2026-06-16
// order name DC(YL); value line 不帶 (YL) suffix。display-only,無參考值。
// vhtt mnemonic 未確認 — 若 vhtt 不同名,於此加 alternation。
{ id:'Neut',
  pattern: /\bNEUT:\s*([<>]?\s*[\d.]+)/,
  displayName:'嗜中性球 (Neutrophil %)', shortLabel:'Neut%',
  unit:'%', category:'血液' },

{ id:'Lymph',
  pattern: /\bLYM:\s*([<>]?\s*[\d.]+)/,
  displayName:'淋巴球 (Lymphocyte %)', shortLabel:'Lym%',
  unit:'%', category:'血液' },

{ id:'Mono',
  pattern: /\bMONO:\s*([<>]?\s*[\d.]+)/,
  displayName:'單核球 (Monocyte %)', shortLabel:'Mono%',
  unit:'%', category:'血液' },

{ id:'Eos',
  pattern: /\bEOSINO:\s*([<>]?\s*[\d.]+)/,
  displayName:'嗜酸性球 (Eosinophil %)', shortLabel:'Eos%',
  unit:'%', category:'血液' },

{ id:'Baso',
  pattern: /\bBASO:\s*([<>]?\s*[\d.]+)/,
  displayName:'嗜鹼性球 (Basophil %)', shortLabel:'Baso%',
  unit:'%', category:'血液' },
```

### 2. `patterns/viewer.js` — 新增 DC section(WBC 不動)

WBC **維持在「血液」section 不動**。新增 section block(緊接 `血液` 之後,col 3):

```js
  // ── Col 3 │ 白血球分類 (DC) ───────────────────────────────────────────
  // DC 五分類% display-only(catalog 無 hi/lo)。WBC 仍在上方「血液」section。
  { id:'Neut',  page:1, col:3, section:'白血球分類 (DC)' },
  { id:'Lymph', page:1, col:3, section:'白血球分類 (DC)' },
  { id:'Mono',  page:1, col:3, section:'白血球分類 (DC)' },
  { id:'Eos',   page:1, col:3, section:'白血球分類 (DC)' },
  { id:'Baso',  page:1, col:3, section:'白血球分類 (DC)' },
```

> 結果:`血液` section 不變(RBC / WBC / Hb / Platelet);
> 新 section `白血球分類 (DC)` = 5×DC%。

### 3. `WORKLOG.md`(patterns repo) — 加 2026-06-16 條目(繁中)

要點:新增 DC 五分類 catalog entries(無參考值,display-only)+ viewer 新
section「白血球分類 (DC)」;WBC 維持在「血液」不動;樣本 vhyl/000037249G
DC(YL);vhtt mnemonic 待確認;IgE 延後。

### 4. release + sync

```powershell
cd hospital-lab-patterns ; npm run release
cd ../hospital-lab-viewer ; node sync-patterns.js
cd ../hospital-lab-reporter ; node sync-patterns.js   # DC 不在 reporter manifest,維持紀律
```

---

## 成功標準

1. catalog.js 新增 Neut / Lymph / Mono / Eos / Baso 共 5 條,皆無 hi/lo/ref
2. `npm run validate` 通過(5 條應出現在 validate 的 track-only / 無門檻清單,不報 unknown field)
3. `dist/patterns.json` rebuild,含 5 條新 pattern
4. viewer.js:新增 5 條 DC manifest entry(section `白血球分類 (DC)`);WBC 維持在「血液」不動
5. viewer `mapping.js` sync 後含 5 條 DC pattern + 新 section
6. WORKLOG.md 加好條目
7. 三 repo commit;**push 前先問 YC**(rule #3)

## 測試清單

每條對應一個業務行為,可獨立驗證:

| # | 行為 | 驗證方法 |
|---|---|---|
| 1 | NEUT% 能抓到值 | console: `/\bNEUT:\s*([<>]?\s*[\d.]+)/.exec('NEUT: 51.5')[1] === '51.5'` |
| 2 | LYM% 能抓到值 | `...exec('LYM: 39.0')[1] === '39.0'` |
| 3 | MONO% 能抓到值 | `...exec('MONO: 5.8')[1] === '5.8'` |
| 4 | EOSINO% 能抓到值 | `...exec('EOSINO: 2.8')[1] === '2.8'` |
| 5 | BASO% 能抓到值 | `...exec('BASO: 0.9')[1] === '0.9'` |
| 6 | DC% 不誤抓 WBC/RBC 等其他行 | 對整段 CBC+DC reportText 跑,5 條各只命中自己那行 |
| 7 | 無 hi/lo 時 viewer 不報錯、不上色 | 手動:重 sync viewer → 點 000037249G → 「白血球分類 (DC)」section 顯示 5 DC%,皆中性色(無 alarm),console 無 error |
| 8 | WBC 維持在「血液」section,顯示與 alarm 門檻(hi10/lo5)不變 | 手動:確認 RBC/WBC/Hb/Platelet 仍在「血液」,新 section 只有 5 DC% |
| 9 | `npm run validate` 無新 warning | 檢查輸出 |

---

## 跨 repo 副作用提醒（rule #4）

- patterns 改 → viewer **必** re-sync(WBC + 5 DC 在 viewer manifest)
- reporter **無** DC manifest → sync 跑了但無實質效果,仍跑保持紀律
- viewer 端 OPD 24h 內自動拿到新 `dist/patterns.json`(runtime fetch),不需重灌 zip
- reporter 端不需發新 HTML

---

## Open / 待確認(不擋本輪,但要追)

1. ✅ **vhtt DC mnemonic** — 已解(2026-06-18 vhtt session)。真機 4 病人驗證:
   vhtt label = Neutrophil / Lymophocyte(EHR 拼字)/ Monocyte / Eosinophil /
   BASO|Basophil(兩變體);5 條 pattern 移除 `\b` + 加 vhtt alternation,三 repo 已 push。
2. ❌ **DC% 參考值** — 取消(YC 2026-06-18)。DC 定案永久 display-only,不加 lo/hi、不做 alarm 上色。
3. **A5 版面溢出**:col 3 原有「血液 + 營養/電解質」,再插 5 行;sync 後請目視
   確認沒擠到下一頁或破版,必要時把新 section 移到 col 4 或 page 2。
4. ❌ **Total IgE** — 取消(YC 2026-06-18,不做)。

---

## 完成 checklist

- [ ] catalog.js 加 5 條 DC entry
- [ ] viewer.js 新增 DC section block(WBC 不動)
- [ ] WORKLOG.md 加 6/16 條目
- [ ] `npm run release` 通過
- [ ] viewer `node sync-patterns.js`
- [ ] reporter `node sync-patterns.js`
- [ ] 三 repo `git add / commit`
- [ ] 顯示 commit msg 等 YC 說 push
- [ ] push 後改名 `_done` + 同輪 commit
- [ ] push 後同步 Notion「🛠 開機 SOP」TASK_BRIEF Dashboard(rule #7)
- [ ] 追 vhtt DC mnemonic（Open #1）
