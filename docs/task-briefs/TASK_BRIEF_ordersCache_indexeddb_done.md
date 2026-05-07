# TASK_BRIEF: Reporter ordersCache — localStorage → IndexedDB

## Problem

Reporter's `ordersCache_dialysis` stores full raw orders in localStorage.
30 patients × ~100KB = ~3MB, approaching the 5MB localStorage limit.
Viewer already uses IndexedDB for the same purpose — reporter should too.

## What to change

### 1. Add IndexedDB infrastructure (similar to viewer's popup.js)

```js
const ORDERS_DB_NAME = 'LabReporterOrdersCache';
const ORDERS_DB_VER  = 1;
const ORDERS_STORE   = 'orders';   // keyPath: 'chartno'
let _ordersDb = null;

function openOrdersDB() { ... }  // same pattern as viewer's openDB()

async function ordersCacheGet(chartno) {
  // returns { orders: [...], ts: Number } or null
}

async function ordersCachePut(chartno, orders) {
  // stores { chartno, orders, ts: Date.now() }
}

async function ordersCacheDelete(chartno) {
  // called when patient is removed
}
```

### 2. Remove localStorage-based ordersCache

Delete:
- `ORDERS_CACHE_KEY` constant
- `loadOrdersCache()` function
- `saveOrdersCache()` function

### 3. Update `fetchAndStore()` to use async IndexedDB calls

```js
async function fetchAndStore(chartno) {
  const cached = await ordersCacheGet(chartno);
  let orders, patientInfo;

  if (cached && cached.orders && cached.orders.length > 0) {
    // Incremental fetch
    const result = await fetchIncremental(chartno, cached.orders, ...);
    orders = result.orders;
    patientInfo = result.patientInfo;
  } else {
    // Full fetch
    const result = await fetchAllOrders(chartno, ...);
    orders = result.orders;
    patientInfo = result.patientInfo;
  }

  // Save to IndexedDB (no quota concern)
  await ordersCachePut(chartno, orders);

  // Rest unchanged: enrichment, extractLabValues, saveLabData...
}
```

### 4. Update `confirmRemovePatient()` to use async delete

Currently does `delete ordersCache[chartno]; saveOrdersCache(ordersCache);`
Change to `await ordersCacheDelete(chartno);`

### 5. Keep enrichCache in localStorage (for now)

The `enrichCache_dialysis` (sub-page text by ordapno) is relatively small
and doesn't grow as fast. Leave it in localStorage for this task.
Converting it to IndexedDB can be done later if needed.

### 6. Migration: clear old localStorage key on first load

```js
// One-time cleanup: remove old localStorage ordersCache
if (localStorage.getItem('ordersCache_dialysis')) {
  localStorage.removeItem('ordersCache_dialysis');
}
```

## Release steps

```bash
cd hospital-lab-reporter
# Edit hospital-lab-data.html
git add -A && git commit -m "refactor: ordersCache localStorage → IndexedDB (no quota limit)"
```

## Verification

1. Open reporter, add a patient, fetch → orders stored in IndexedDB
   (DevTools → Application → IndexedDB → LabReporterOrdersCache)
2. Re-fetch same patient → incremental works as before
3. Remove patient → IndexedDB entry deleted
4. localStorage should NOT have `ordersCache_dialysis` key anymore
5. `enrichCache_dialysis` in localStorage should be unaffected

## Post-task

- Rename to `TASK_BRIEF_ordersCache_indexeddb_done.md`
- Move to `hospital-lab-patterns/docs/task-briefs/`
- Update WORKLOG.md (繁體中文)
- Do NOT git push — ask first
