# TASK_BRIEF: 健檢 CXR 翻譯 — S2/S3 polish + Mode B spec

> **Parent brief**: `TASK_BRIEF_health_check_cxr.md`(仍 Open,S3 polish 完成不代表 parent 完工 — 需實機 happy-path 驗證後才能歸檔)
> **Mode**: Claude Code(workspace root,可能跨 patterns + viewer,但實際只動 viewer)
> **產出 session**: 2026-05-21 vhtt Cowork(spec 設計)→ 接 Claude Code 實作
> **動機**: 上次 vhtt session(2026-05-21 ~15:00 wrap)完工後,YC 在 Cowork 重審 S2/S3 code 發現:大部分功能已實作,但有 5 個 gap + 1 個 spec 改動需 polish。合成本 brief 給 Claude Code 一次跑完。
>
> **執行完畢後請改名為 `TASK_BRIEF_health_check_cxr_polish_done.md`**(rule #6)。**注意 parent brief `health_check_cxr` 仍保持 Open**。

---

## 改動清單(5 項)

### G1 — Mode B per-row opt-in spec patch(新 spec)

**動機**:避免 mock provider 或 API Key 空時自動 batch translate 造成困惑、或誤觸 PHI 外流(雖然 mock 不外流網路,UX 對齊)。

**新 spec**:

| Mode | 條件 | 第二階段行為 | 摘要欄 |
|---|---|---|---|
| **A** | `cxrSettings.provider ∈ {gemini, claude, openai}` **且** `cxrSettings.apiKey` 非空 | 自動 batch translate(維持現況)、skip cache hit、skip noReport、progressive render | row 翻完即時更新 |
| **B** | `cxrSettings.provider === 'mock'` **或** `cxrSettings.apiKey` 為空 | **不翻譯**,顯示 status 提示 | 全部空白 |

**改動位置**:`cxr.js` 中 `cxrRunFromText`,第二階段 batch translate 前加一個 if(其他不動):

```js
// 第二階段:translate(concurrency 5 — LLM)只翻有報告的列
const toTranslate = cxrState.results.filter(r => r.status === 'pending' && r.reportText);
const llmReady = cxrSettings.provider !== 'mock' && !!cxrSettings.apiKey;

if (toTranslate.length && llmReady) {
  // 原 batch translate code 不動
  cxrSetStatus(`第二階段:翻譯 ${toTranslate.length} 筆報告(provider: ${cxrSettings.provider})…`);
  cxrSetProgress(0, toTranslate.length, '翻譯');
  await cxrRunPool(toTranslate, async (row) => { await cxrTranslateRow(row); }, 5,
    (d, t) => { cxrSetProgress(d, t, '翻譯'); cxrRenderTable(); });
} else if (toTranslate.length) {
  // Mode B: LLM 未設定,跳過翻譯,提示
  const reason = cxrSettings.provider === 'mock' ? 'mock 模式'
               : !cxrSettings.apiKey ? `${cxrSettings.provider} 無 API Key`
               : '未設定';
  cxrSetStatus(`完成抓取 ${toTranslate.length} 筆。LLM 未設定(${reason}) — 摘要空白。請點右上 ⚙️ 設定 provider + API Key 後重跑。`);
}
```

**成功標準**:
- mock provider 進 cxr.html → 第一階段 fetch 跑、第二階段 skip、表格 render 出 row、摘要欄全空、status 顯示提示文字
- gemini + API Key 空 → 同上(提示文字含「gemini 無 API Key」)
- gemini + Key 有效 → 維持原 batch 行為(50 筆翻完,progressive render)

---

### G2 — Retry + 友善錯誤分類

**動機**:目前 `llm-translate.js` 的 `cxrGemini` / `cxrClaude` / `cxrOpenai` 是 `throw new Error('Gemini HTTP {status}: {body 前 200 字}')`,`cxrTranslateRow` catch 後直接存進 `row.translation.error`,**不 retry**。50 筆 batch 中一筆 transient 5xx / 429 都會永久變 error row,UX 對使用者不夠 friendly。

**新 spec**:

| HTTP 狀態 / Error 類型 | retry policy | 失敗 row 訊息 |
|---|---|---|
| 200 | — | (正常) |
| 401, 403 | **不 retry** | `「API Key 無效或無權限,請點右上 ⚙️ 重設」` |
| 429(rate limit) | retry 2 次,exponential backoff(500ms → 2000ms) | `「rate limit,稍後重試」` |
| 5xx | retry 1 次,1000ms backoff | `「API 暫時無回應」` |
| network / TypeError(fetch failed) | retry 1 次,1000ms backoff | `「網路錯誤,確認 vhtt 院內網路能連到 generativelanguage.googleapis.com」` |
| 其他(JSON parse 等) | 不 retry | `「LLM 回應格式錯誤」`(後接原 error.message) |

**實作**:統一 helper 在 `llm-translate.js` top-level:

```js
// 包裝 fetch + retry + 錯誤分類。caller 傳回 raw Response 由 caller 自己 .json() / 解析。
async function cxrFetchWithRetry(url, opts) {
  let lastErr;
  const attempts = [
    { delay: 0,    name: 'initial' },
    { delay: 500,  name: 'retry-1' },
    { delay: 2000, name: 'retry-2' },
  ];
  for (let i = 0; i < attempts.length; i++) {
    if (attempts[i].delay) await new Promise(r => setTimeout(r, attempts[i].delay));
    try {
      const resp = await fetch(url, opts);
      if (resp.ok) return resp;
      // 分類 retry 決定
      if (resp.status === 401 || resp.status === 403) {
        throw new CxrLlmError('AUTH', `API Key 無效或無權限,請點右上 ⚙️ 重設`, resp.status);
      }
      if (resp.status === 429) {
        lastErr = new CxrLlmError('RATE', `rate limit,稍後重試`, resp.status);
        if (i < 2) continue;  // retry 2 次
        throw lastErr;
      }
      if (resp.status >= 500) {
        lastErr = new CxrLlmError('SERVER', `API 暫時無回應`, resp.status);
        if (i < 1) continue;  // retry 1 次
        throw lastErr;
      }
      // 4xx 其他 → 不 retry
      const body = (await resp.text()).slice(0, 200);
      throw new CxrLlmError('CLIENT', `請求錯誤(HTTP ${resp.status}): ${body}`, resp.status);
    } catch (e) {
      if (e instanceof CxrLlmError) throw e;  // 已分類,直接 raise
      // network / TypeError
      lastErr = new CxrLlmError('NETWORK', `網路錯誤,確認院內網路能連到 LLM API`, 0, e);
      if (i < 1) continue;
      throw lastErr;
    }
  }
  throw lastErr;
}

class CxrLlmError extends Error {
  constructor(kind, msg, status, cause) {
    super(msg);
    this.kind = kind;  // 'AUTH' | 'RATE' | 'SERVER' | 'CLIENT' | 'NETWORK'
    this.status = status;
    this.cause = cause;
  }
}
```

每個 provider 的 fetch 換成用 `cxrFetchWithRetry`:

```js
async function cxrGemini(reportText, settings) {
  const model = settings.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(settings.apiKey || '')}`;
  const body = { /* 不動 */ };
  const resp = await cxrFetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return cxrNormalizeResult(cxrParseModelJson(text));
}
// cxrClaude / cxrOpenai 同樣 swap fetch → cxrFetchWithRetry
```

`cxrTranslateRow`(`cxr.js`)catch 處改成顯示 `e.message`(已是友善文字):

```js
} catch (e) {
  row.status = 'error';
  row.translation = { error: e && e.message ? e.message : String(e), kind: e?.kind || 'UNKNOWN' };
}
```

(可選)`cxrSummaryCell` 對 error row 用 `row.translation.kind` 加 icon:🔑 AUTH / ⏳ RATE / 🌐 NETWORK / 🛠 SERVER。

**成功標準**:
- 故意填錯 API Key(刪幾個字)→ row 顯示「API Key 無效或無權限,請點右上 ⚙️ 重設」(**不**是 raw `Gemini HTTP 400: ...`)
- 對 50 筆有效資料 batch translate → 全部成功(無 transient fail)
- (難手動觸發 — 透過 Chrome DevTools Network throttle 模擬 429 / 5xx 即可)retry 後成功;若一直失敗顯示對應友善文字

**測試清單**:
- [ ] 錯誤 Key → AUTH 訊息(無 retry)
- [ ] 有效 Key + 50 筆 → 全 ok
- [ ] DevTools throttle 模擬 5xx → retry 一次後成功 或 顯示 SERVER 訊息

---

### G3 — Cache evict 行為定義

**動機**:`cxrTranslateRow` 比對 `cached.provider === current && cached.model === current` 不符 → **不重用**,但**不主動清除**舊 record。同 ordapno 切了三次 provider 就會留三筆 record。長期 IndexedDB 會膨脹(雖然每筆 ~500 bytes,萬筆 = 5MB,還在可接受)。

**選擇 (a)**(本 brief 採用):**永不主動 evict**。
- 信任「同 ordapno + 同 provider + 同 model」最多 1 筆。
- 空間影響可忽略。
- 若使用者真要清:`chrome://settings/site-data` 找 extension 清。
- **不寫 evict code,僅在 brief 明文記載這是有意行為**(避免下次別人以為是 bug 又加 evict)。

**選擇 (b)**(不採用,但記錄為何不採):lazy evict — `cxrTxPut` 寫入前 delete 同 ordapno 其他 provider/model 的 record。
- 缺點:race condition(同時兩個 batch 切 provider 跨翻同 ordapno);extra IndexedDB call 拖慢 50 筆 batch
- 若日後 IndexedDB 真大到爆 → 加一個 ⚙️ → 清快取按鈕,而不是 lazy evict

**改動位置**:`lab-core.js` 的 `cxrTxPut` **不動**。在 brief 與 cxr.js 開頭 comment 標明 evict 策略:

```js
// IndexedDB cxrTranslations cache 策略:
// - 鍵 = ordapno(每筆 order 一筆 cache)
// - 同 ordapno 切 provider/model → cxrTranslateRow 不重用,但 cxrTxPut 仍以 ordapno overwrite
//   (即新 provider 的結果會覆蓋舊 provider 的)
// - 不需主動 evict 跨 provider record(本案就靠 overwrite 自然 cap 在 1 筆/ordapno)
```

**等等 — Claude Code 實作前確認**:現況 `cxrTxPut` 是用 `ordapno` 當 key 還是 auto-increment?若是 ordapno key → 同 ordapno 寫入會 overwrite,等於行為已對(本 G3 變成「文件化現況」)。**Claude Code 第一步:讀 `lab-core.js` 的 `cxrTxPut` IDB store 定義確認**,若是 ordapno keyPath → 只加 comment,不改 code。若不是 → 改 keyPath 為 ordapno,順手 migrate(DB_VER 6 → 7)。

**成功標準**:
- 同 ordapno 切 provider 翻譯 2 次 → IndexedDB 該 ordapno **只剩 1 筆 record**(最新 provider 的)
- 或:文件 comment 已寫明策略(若現況就已是)

---

### G4 — 異常優先排序(brief § S3 成功標準)

**動機**:`TASK_BRIEF_health_check_cxr.md § S3 成功標準` 寫「異常個案一眼可辨(🔴 排在最前)」,但 `cxrState.sortKey` 預設 `'group'`(病歷號 + 檢查類型序),50 筆混在一起異常 row 散落,不直觀。

**新 spec**:

- 新增 sort key `'abnormal'`:**異常 row 浮頂**;同 status 群組內次序仍按 `group`(病歷號 + 檢查類型序)→ 等於「先按 status 群,再按原 group 排」
- `cxrState.sortKey` 初值從 `'group'` 改成 `'abnormal'`(進畫面就異常先)
- 表頭點擊仍可切回 `chartno` / `examType` / `orderDate` / `examDate`(原 sort key 邏輯不動)
- 排序穩定性:status 內次序按 chartno 字典序 + examType 序(避免 50 筆隨機洗牌)

**改動位置**:`cxr.js` 的 `cxrCompare` 加 case + `cxrState.sortKey` 初值:

```js
const cxrState = {
  results: [],
  sortKey: 'abnormal',          // ← 從 'group' 改
  sortDir: 'asc',
  filterAbnormal: false,
  filterNoreport: false,
  filterExam: 'all',
};

function cxrCompare(a, b, key) {
  if (key === 'abnormal') {
    // status 優先序:abnormal=0(浮頂) > normal=1 > noReport=2 > error=3
    const rank = { abnormal: 0, normal: 1, noReport: 2, error: 3, pending: 1 };
    const ra = rank[a.status] ?? 9;
    const rb = rank[b.status] ?? 9;
    if (ra !== rb) return ra - rb;
    // tie-break:chartno asc + examType seq
    if (a.chartno !== b.chartno) return a.chartno.localeCompare(b.chartno);
    return cxrExamOrder(a.examType) - cxrExamOrder(b.examType);
  }
  // ... 原 cases 不動
}
```

**成功標準**:
- 50 筆 5 異常 + 45 正常 → 表格前 5 列都是 abnormal,後 45 列按病歷號 + examType 排
- 點「病歷號」表頭 → 切到 chartno 排序,異常不再浮頂
- 點「檢查類型」表頭 → 切到 examType 排序

**測試清單**:
- [ ] 預設 render 異常浮頂
- [ ] 切其他 sort key 後異常順序不再特別
- [ ] sortDir desc 對 abnormal 反向(error 最前、abnormal 最後)是否 OK?— 本 brief**保留**現況反向行為,UX 上可能怪;若實機看不爽再 follow-up

---

### G5 — 收尾(Claude Code 做完上面四項後)

1. `hospital-lab-viewer/WORKLOG.md` 加條目(繁中):
   ```
   ## 2026-05-21 — 健檢 CXR S2/S3 polish(Mode B + retry + 排序 + cache 行為)
   - cxr.js cxrRunFromText:第二階段加 Mode A/B 分流(mock/Key 空時 skip translate)
   - llm-translate.js:加 cxrFetchWithRetry + CxrLlmError 友善錯誤分類(AUTH/RATE/SERVER/CLIENT/NETWORK)
   - cxrCompare 加 'abnormal' sort key;預設排序改 'abnormal'(異常浮頂)
   - cache evict 策略:本案維持 ordapno key overwrite,不主動 evict 跨 provider record(已 comment 說明)
   - 不動:patterns repo / reporter repo;parent brief health_check_cxr 仍 Open
   ```
2. **本 brief 改名 `_done`**(rule #6),**parent brief `health_check_cxr` 不改**(parent 仍 Open;實機 happy-path 才能歸檔 parent)
3. push 前問 YC(rule #3)
4. push 完同步 Notion Dashboard:本 polish brief 加一條 Done;parent `health_check_cxr` 維持 Open

---

## 不在 sub-brief 範圍(明示)

- **parent brief `TASK_BRIEF_health_check_cxr.md` 不歸檔** — S2/S3 完整 acceptance 需實機 50 筆 Gemini batch 跑通(計時 < 3 分鐘、retry 正常、列印 OK)。**polish 完才能跑 happy-path**。
- **`TASK_BRIEF_ckd_screening_dashboard.md`(目前 untracked)** — S3 還沒做,**不歸檔也不主動 git add**。但**提醒 YC**:這個 brief 還 untracked,沒進 git 跨機器看不到,該手動 `git add docs/task-briefs/TASK_BRIEF_ckd_screening_dashboard.md` 進下次 patterns commit(自己處理,不在本 brief 範圍)。
- **Tab/sub-tab 整合(原 brief § 容器)**:決策維持獨立視窗,**不改**。
- **實機 happy-path 50 筆 Gemini batch**:留給 polish 後 YC 在 vhtt 自己跑。Claude Code **不**做這步(它能改 code 但不能按 popup 鍵)。

---

## 風險與備案

| 風險 | 影響 | 備案 |
|---|---|---|
| `cxrTxPut` 現況不是 ordapno key → G3 評估錯 | 同 ordapno 切 provider 仍會多筆 record | Claude Code 第一步先讀 lab-core.js 確認 IDB store 定義,**有歧義停下來請 YC 看** |
| retry policy 在實機 vhtt 院內網被擋的 case → AUTH/SERVER 都不會觸發,變 NETWORK | 提示文字「網路錯誤」可能對使用者不夠精確(他們不知道是 firewall 還是 internet 不通) | 提示文字已含「確認院內網路能連 LLM API」,使用者知道是 network layer 問題;若實機常見再加診斷 button |
| 預設 sortKey 改 abnormal 後,fetch 跑完先 render 時還沒翻譯 → 全 status='pending'(rank=1) → 看起來跟原 group 排序一樣 | 預期內,因為 translate 還沒跑 | 翻譯 progressive 過程中,異常 row 翻完逐步浮頂(用戶看到動態浮頂效果,反而是正向 UX) |

---

## Claude Code 動手前 checklist

1. **先讀**:
   - `D:\self\hospital-lab\hospital-lab-patterns\docs\task-briefs\TASK_BRIEF_health_check_cxr.md`(parent brief,理解整體 S1/S2/S3 設計)
   - `D:\self\hospital-lab\hospital-lab-viewer\cxr.js`、`llm-translate.js`、`lab-core.js`(三個本 brief 動的檔)
   - `D:\self\hospital-lab\hospital-lab-viewer\CLAUDE.md`(viewer repo Coding behavior contract)
2. **不動的東西**:patterns 整個 repo(本 polish 不需 catalog/computed/manifest 改);reporter 整個 repo;cxr.html UI 模板(modal、表頭、CSS 都不動);options.html;popup.js / popup.html
3. **改動順序建議**:G3(先確認 IDB store 定義,1 行 comment 為主)→ G1(2 行 if 加進去)→ G4(`cxrCompare` 加 case + 預設值)→ G2(`llm-translate.js` 重構 — 最大塊)→ G5(WORKLOG + brief rename)
4. **每一輪 commit**(rule #1, #2):code + WORKLOG 同一個 commit;G5 改名 brief 跟最後一個 commit 同一輪

---

## 成功標準(整體本 brief)

- [ ] G1 — Mode B 三 case 行為驗證(mock / Key 空 / Key 有效)
- [ ] G2 — AUTH 錯誤訊息友善;有效 50 筆全成功;DevTools throttle 模擬 retry 觸發
- [ ] G3 — IndexedDB 同 ordapno 切 provider 只剩 1 筆 record(或 comment 已寫明);無 race
- [ ] G4 — 預設 render 異常浮頂;切 sort key 行為正確
- [ ] G5 — WORKLOG 加條目;本 brief 改名 `_done`;parent brief `health_check_cxr` 仍 Open;push 完 Notion 同步
