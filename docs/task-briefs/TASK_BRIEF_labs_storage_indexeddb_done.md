# TASK_BRIEF: Reporter labs_<group> storage — localStorage → IndexedDB

> **方向**:vhyl 提出 → vhtt 執行
> **產出 session**:vhyl Cowork session, 2026-05-12
> **建議在**:reporter 重 build framework 已穩、`groups/early-ckd.js` 不再頻繁變動之後
>
> **執行完畢後請改名為 `TASK_BRIEF_labs_storage_indexeddb_done.md`**(rule #6)

---

## 設計決策（2026-05-13 Cowork session 確認）

| # | 決策 | 說明 |
|---|---|---|
| D1 | **Option A：擴展現有 DB** | bump `LabReporterOrdersCache` version 1→2，加 `labData` store |
| D2 | **單一 store，keyPath = `chartno`** | 跨 disease group 共用，不用 groupId prefix；同一病人不重複儲存 |
| D3 | **刪除前檢查其他 group** | `confirmRemovePatient` 時掃描所有 `patients_*` localStorage keys；chartno 仍在任一 group → 保留 IDB record |

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

### 1. 擴展現有 DB — Option A（已確認 2026-05-13）

**決策：擴展現有 `LabReporterOrdersCache` DB，加一個 `labData` store。**
單一 DB，connection 共用，跟 2026-05-08 milestone 維持「reporter 只有一個 IDB DB」原則。

```js
// core/indexeddb-cache.js
const ORDERS_DB_VER = 2;   // bump from 1 → 2
// onupgradeneeded:
//   if oldVersion < 2:
//     db.createObjectStore('labData', { keyPath: 'chartno' })
```

**Store 設計：單一 `labData` store，keyPath = `chartno`（已確認 2026-05-13）。**
跨 disease group（dialysis / ckd）共用同一個 store，不用 groupId prefix。
理由：同一個病人可能同時出現在 dialysis 和 ckd 兩個 group，lab data 本身跟 disease group 無關，共用避免重複儲存。

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
  // ★ 刪除策略（已確認 2026-05-13）：
  //   移除病人前，檢查所有 disease group 的 patient list
  //   （localStorage keys: patients_dialysis, patients_ckd, ...）
  //   只有 chartno 不在任何其他 group 時才從 IDB 刪除。
  //   若仍在其他 group → 保留 IDB record，僅從當前 group list 移除。
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

### 4. 一次性 migration IIFE（同 2026-05-08 ordersCache 模式）

`core/init.js` 或 `core/indexeddb-cache.js` 開頭。

因為 store 現在是跨 group 共用（keyPath = chartno），migration 只需處理**當前 group**
的 `labs_<groupId>`。每個 disease HTML 各自執行一次 migration；如果同一個 chartno
已經被另一個 group 先 migrate 過，`labDataPut` 用 newer-wins 覆寫即可（lab data
本身不分 group）。

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
      // newer-wins: if chartno already in IDB from another group's migration,
      // overwrite only if this record is newer (compare _lastUpdate)
      const existing = await labDataGet(cn);
      if (!existing || (lab._lastUpdate || 0) >= (existing._lastUpdate || 0)) {
        await labDataPut(cn, lab);
        migrated++;
      }
    }
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

`group.storageKey.labs` 在 `groups/dialysis.js` 與 `groups/early-ckd.js` 保留（migration IIFE 需要它來找舊的 localStorage key），但 reporter 端不再直接用它讀寫 localStorage。migration 完成後這些 key 只剩 `_legacy` backup。

---

## 測試清單(完成前必跑)

1. **乾淨環境**(清 localStorage + 清 IDB)bulk-add 30 個 CKD 病人 → 不該再爆 quota。
2. **舊環境**(localStorage 已有 labs_dialysis 半滿)首次載入新版 → migration IIFE 把資料搬到 IDB,localStorage 清空,UI 仍顯示原本病人 list。
3. **跨 group 共用**:dialysis 和 ckd 共用同一個 IDB `labData` store（keyPath=chartno）。同一病人在兩邊都能讀到 lab data，不重複儲存。
4. **patient 刪除（cross-group check）**:`confirmRemovePatient` 後，檢查所有 group 的 patient list（`patients_dialysis`, `patients_ckd`, ...）；chartno 仍在其他 group → 保留 IDB record；不在任何 group → 刪除 IDB record。
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
