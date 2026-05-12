# TASK_BRIEF: Reporter labs_<group> storage — localStorage → IndexedDB

> **方向**:vhyl 提出 → vhtt 執行
> **產出 session**:vhyl Cowork session, 2026-05-12
> **建議在**:reporter 重 build framework 已穩、`groups/early-ckd.js` 不再頻繁變動之後
>
> **執行完畢後請改名為 `TASK_BRIEF_labs_storage_indexeddb_done.md`**(rule #6)

---

## Problem(2026-05-12 vhyl validation 期間發現)

CKD reporter bulk-add 20 個病人後 `localStorage.setItem('labs_ckd', ...)` 噴 `QuotaExceededError`,剩下 26 人 lab data 全部丟失。控制台典型訊息:

```
Failed to fetch <chartno>: QuotaExceededError: Failed to execute 'setItem'
on 'Storage': Setting the value of 'labs_ckd' exceeded the quota.
    at saveLabData (...)
    at fetchAndStore (...)
```

dialysis HTML 不會這麼快踩到,因為 dialysis 不啟用 UACR sub-page enrichment,每人 lab 約 60 KB(46 人約 3 MB,還沒到 5 MB)。CKD 因為 UACR opt-in 把 sub-page text 內容也擷取進來,每人約 250 KB,**20 人就 5 MB**。

驗證樣本:vhyl validation 跑 46 人 → 必須切成 20+20+6 三批,中間還要手動清空 `labs_ckd` 才能繼續。完整可重現步驟見 `docs/validation_vhyl_2026-05-12.md` § 6。

---

## 為什麼選 IndexedDB(不是其他方案)

| 方案 | 評估 |
|---|---|
| **IndexedDB(本 brief 建議)** | 與 `LabReporterOrdersCache`(2026-05-08 milestone)路線一致;quota 上限是裝置整體配額(MB→GB 級),不再是 5MB origin-wide |
| 縮減 storage 範圍(只存 manifest 內 testId) | 救不了 — CKD 的 storage 大頭是 sub-page text(經 `enrichMissingValues` 注回 reportText),不在 manifest 內 |
| 縮減 sub-page text 長度 | 違反 enrichment opt-in 設計;某些 sub-page 內容很長(全頁文字)沒地方塞 |
| `chrome.storage.local` | 跨 origin、有 10MB cap、僅 extension 可用 — reporter 是 file:// HTML,用不到 |

直接走 IndexedDB,沿用 2026-05-08 `ordersCache` migration 已驗證的 pattern,認知負擔最小。

---

## 變更範圍

僅 reporter repo。所有 changes 都在 `core/` 模組內,disease groups 不動。

### 1. 新增 IndexedDB store(可選:擴展現有 DB)

兩個選項:

**(A) 擴展現有 `LabReporterOrdersCache` DB,加一個 `labData` store**

```js
// core/indexeddb-cache.js
const ORDERS_DB_VER = 2;   // bump from 1 → 2
// onupgradeneeded:
//   if oldVersion < 2:
//     db.createObjectStore('labData', { keyPath: 'chartno' })
```

優點:單一 DB,connection 共用。
缺點:DB version 變動,需確保 viewer / 其他工具不會誤開 v1。

**(B) 開新 DB `LabReporterLabData`,獨立 store**

優點:清晰分離,upgrade path 簡單。
缺點:多開一個 IDB connection。

→ **建議 (A)**,跟 2026-05-08 milestone 維持「reporter 只有一個 IDB DB」原則。

### 2. 新增 lab data CRUD helpers

```js
// core/indexeddb-cache.js
async function labDataGet(chartno) {
  // returns { chartno, lab: {...}, _lastUpdate: number } | null
}

async function labDataGetAll() {
  // returns { [chartno]: {lab fields with _lastUpdate} } — replaces
  // the in-memory loadLabData() return value
}

async function labDataPut(chartno, lab) {
  // stores { chartno, ...lab, _lastUpdate: Date.now() }
}

async function labDataDelete(chartno) {
  // called when patient is removed (in confirmRemovePatient)
}
```

### 3. 改造 `core/storage.js` 的 `loadLabData` / `saveLabData`

當前(同步):

```js
function loadLabData() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.labData)) || {}; }
function saveLabData(data) { localStorage.setItem(STORAGE_KEYS.labData, JSON.stringify(data)); }
```

改為 async wrapper:

```js
async function loadLabData() { return await labDataGetAll(); }
async function saveLabData(data) { /* per-chartno labDataPut for each key */ }
```

**重要**:`loadLabData` / `saveLabData` 是同步 API,**所有 call site 都要改 await**。
依 `git grep loadLabData hospital-lab-reporter/core/`,call sites:

- `core/ui-patient-crud.js`(2 處:fetchAndStore / refresh)
- `core/ui-patient-list.js`(渲染 lab summary)
- `core/ui-lab-view.js`(切到 Lab Table tab 時)
- `core/ui-remove-patient.js`(刪除時連同 lab data 一起清)
- `export-formats/kiditi-csv.js` / `renal-platform-xlsx.js`(匯出時)

全部都要 `await loadLabData()`。

### 4. 一次性 migration IIFE(同 2026-05-08 ordersCache 模式)

`core/init.js` 或 `core/indexeddb-cache.js` 開頭:

```js
(async function migrateLabsToIDB() {
  const groupId = window.ACTIVE_GROUP_ID || 'dialysis';
  const lsKey = `labs_${groupId}`;
  const lsData = localStorage.getItem(lsKey);
  if (!lsData) return;

  try {
    const obj = JSON.parse(lsData);
    if (!obj || typeof obj !== 'object') return;
    let migrated = 0;
    for (const [cn, lab] of Object.entries(obj)) {
      await labDataPut(cn, lab);
      migrated++;
    }
    // 保留 lsKey 作 backup,one-release 後再清。仿 2026-05-08 hd_* migration。
    console.log(`[migration] migrated ${migrated} labs from ${lsKey} → IDB`);
    localStorage.setItem(lsKey + '_legacy', lsData);   // backup
    localStorage.removeItem(lsKey);
  } catch (e) {
    console.warn(`[migration] failed migrating ${lsKey}:`, e);
  }
})();
```

### 5. 移除 `STORAGE_KEYS.labData` 相關 localStorage 程式碼

`core/storage.js`:

```js
const STORAGE_KEYS = {
  patients: GROUP.storageKey.patients,
  settings: 'hd_settings',
  // labData:  GROUP.storageKey.labs,  ← 刪除
  patientSort:    GROUP.storageKey.patients + '_sort',
  patientFilters: GROUP.storageKey.patients + '_filters',
};
```

`group.storageKey.labs` 在 `groups/dialysis.js` 與 `groups/early-ckd.js` 還是要保留(IDB store 內仍可拿來區分 disease,或當 fallback identifier),但 reporter 端不再直接用它讀 localStorage。

---

## 測試清單(完成前必跑)

1. **乾淨環境**(清 localStorage + 清 IDB)bulk-add 30 個 CKD 病人 → 不該再爆 quota。
2. **舊環境**(localStorage 已有 labs_dialysis 半滿)首次載入新版 → migration IIFE 把資料搬到 IDB,localStorage 清空,UI 仍顯示原本病人 list。
3. **跨 group 隔離**:dialysis HTML 與 ckd HTML 各自 labs 互不污染(用 chartno + ACTIVE_GROUP_ID 做 key,或兩個 store)。
4. **patient 刪除**:`confirmRemovePatient` 後 IDB store 內該 chartno 的 lab record 也清掉,避免 ghost。
5. **incremental fetch + extract**:`fetchAndStore` 跑完仍能正確把新 labs 寫進 IDB,reload 後讀回。
6. **export CSV / xlsx**:KiDiTi + renal platform 兩個 exporter 跑 30 人 → 不該因 await 漏寫導致空欄。
7. **WORKLOG**:照 5/8 ordersCache migration 的 entry 格式記錄。

---

## 相關前例 / 參考

- `TASK_BRIEF_ordersCache_indexeddb_done.md`(2026-05-08)— 直接模仿那條的結構。
- viewer `popup.js` 的 `openDB` / `enrichCache` 模式 — IndexedDB CRUD helpers 範本。

---

## 風險 / 注意

- **同步 → 非同步擴散**:`loadLabData` 是非常熱的 API,改 async 後 call site 一處漏 `await` 就會渲染空表。Phase 1 restructure 後 call site 集中在 `core/*.js`,逐檔 grep + 替換即可,但漏一處的 cost 不低 → 強烈建議用 grep 列清單、逐檔 review。
- **build.js 重 build**:改完後 `node build.js dialysis` + `node build.js ckd` 都要跑,legacy `hospital-lab-data.html` 也要 sync。
- **migration 不要破壞回退**:保留 `labs_<group>_legacy` 一個 release,確保萬一 IDB 寫入失敗,可以回退到 localStorage。
- **viewer 沒影響**:viewer 已經是 chrome extension,labs 用的是 popup.js 自管的 IDB,本 brief 範圍不在 viewer。

---

## 預計工時

3–4 小時實作 + 1 小時測試。比 ordersCache migration 複雜一點(call site 多),但 pattern 已知。
