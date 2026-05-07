# TASK_BRIEF: Incremental Fetch for Viewer + Reporter

## Problem

Both viewer and reporter do **full re-fetch** (all pages, all orders) every
time cache expires or user triggers refresh. A typical patient has 200–600
orders (5–15 API pages). Since signed-off reports are immutable, 95%+ of
the fetched data is identical to what's already cached.

- Viewer: 6h TTL → full re-fetch on expiry (5–15 API calls per patient)
- Reporter: manual trigger → full re-fetch for 30+ patients (300+ API calls)

## Design Change 0: Remove 12-month lab cutoff (viewer only)

With incremental cache storing ALL orders, the 12-month cutoff in the viewer
is no longer needed. `buildResultMap()` already limits display to
`MAX_HISTORY = 3` values per test, so removing the cutoff won't bloat the UI.

### What to remove/change in popup.js:

1. **Delete `cutoffDateLab()` function** (line ~95)
2. **Delete `filterLabRecent()` function** (line ~192)
3. **In `loadData()`**: replace `filterLabRecent(labAll)` with just `labAll`
4. **Remove hepatitis all-time special-case** (lines ~428-433):
   the `recentIds` / `labAll.forEach(...)` block that re-adds hepatitis
   orders — no longer needed since ALL orders are included.
5. **Keep `CONFIG.LAB_MONTHS_BACK`** for now (reporter still uses its own
   12-month cutoff in `extractLabValues()`), but it's no longer read by
   the viewer. Add a comment noting it's reporter-only.

### Why this is safe:

- `MAX_HISTORY = 3` in report.js caps the number of values per test shown
- Orders are sorted by date descending → most recent 3 are picked
- Hepatitis, Aluminum, and other rare tests now naturally surface their
  most recent values without needing special all-time bypass logic
- The cache stores `allOrders` anyway (for incremental fetch), so
  filtering before storage would just lose data

---

## Design: "Stable Frontier" Incremental Fetch

ernode API returns orders in **reverse chronological order** (newest first).
New orders appear at the top. A signed-off report (正式報告/更正報告) is
**immutable** — only 未執行 orders can change (they get their report later).

### Algorithm

```
incrementalFetch(chartno, cachedOrders):
  knownMap = Map(ordseq → {status, reportText}) from cachedOrders
  newOrders = []
  updatedIndexes = []  // track which cached orders got updated

  for each page (starting from page 1):
    fetch page
    allKnown = true

    for each order on page:
      cached = knownMap.get(order.ordseq)

      if not cached:
        // Brand new order
        newOrders.push(order)
        allKnown = false

      else if cached.status !== order.status:
        // Status changed (未執行 → 正式報告)
        update cachedOrders[index] with new data
        allKnown = false

      else:
        // Known and unchanged — stable
        (continue checking rest of page, but this is a stable hit)

    if allKnown:
      STOP — everything beyond this page is also unchanged
      break

  return { newOrders, cachedOrders (with updates) }
```

**Key property**: once we hit a page where ALL orders are known and unchanged,
we can stop. In the common case (0–2 new orders), this means **1 API call**.

### Handling 未執行 → 正式報告 transitions

Orders with status "未執行" can later become "正式報告". The algorithm handles
this because it checks `status` equality, not just `ordseq` existence. An
未執行 order that got signed off will show a different status → gets updated.

---

## Viewer Changes (popup.js)

### 1. Cache format change — store full orders

Currently the cache stores:
```js
{ chartno, patientInfo, lab: labRecent, rad: radAll, ... }
```

Change to also store **all raw orders**:
```js
{
  chartno, patientInfo,
  lab: labRecent, rad: radAll,       // keep for backward compat
  allOrders: all,                    // NEW: full unfiltered orders array
  recentCount, totalFetched, fromCache, fetchedAt
}
```

**Bump cache key** from `v3:` to `v4:` so old-format caches are ignored
(they'll simply cache-miss and do a full fetch — graceful migration).

### 2. New function: `fetchIncremental(chartno, cachedOrders, onProgress)`

```js
async function fetchIncremental(chartno, cachedOrders, onProgress) {
  // Build lookup map from cached orders
  const knownMap = new Map();
  cachedOrders.forEach((o, i) => knownMap.set(o.ordseq, { idx: i, status: o.status }));

  const newOrders = [];
  let url = `${CONFIG.BASE_URL}${CONFIG.ENDPOINT}?chartno=${chartno}&opsid=${CONFIG.OPSID}`;
  let page = 0, total = 0, patientInfo = null;

  while (url) {
    page++;
    if (page > 50) break;
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const result = parseOrdersPage(html, chartno);
    if (page === 1) { total = result.total || 0; patientInfo = result.patientInfo; }

    let allKnown = true;
    for (const order of result.orders) {
      const known = knownMap.get(order.ordseq);
      if (!known) {
        newOrders.push(order);
        allKnown = false;
      } else if (known.status !== order.status) {
        // Status changed → update in-place
        cachedOrders[known.idx] = order;
        allKnown = false;
      }
      // else: known and unchanged → skip
    }

    if (onProgress) onProgress(cachedOrders.length + newOrders.length, total || '?');
    if (allKnown || !result.nextUrl) break;
    url = result.nextUrl;
  }

  // Prepend new orders (they're newer, appear at the front)
  const merged = [...newOrders, ...cachedOrders];
  return { orders: merged, total, patientInfo: patientInfo || null, pagesChecked: page };
}
```

### 3. Modify `loadData()` flow

```js
async function loadData(rawInput, forceRefresh, onProgress) {
  const chartno  = formatChartNo(rawInput);
  const cacheKey = `v4:${chartno}`;

  if (!forceRefresh) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      const age = Date.now() - cached.ts;

      // Within TTL → return directly (no API call at all)
      if (age < CONFIG.CACHE_TTL_MS) {
        return { ...cached.payload, fromCache: true, cachedAt: new Date(cached.ts) };
      }

      // Past TTL but has allOrders → incremental fetch
      if (cached.payload.allOrders && cached.payload.allOrders.length > 0) {
        const { orders: merged, total, patientInfo, pagesChecked }
          = await fetchIncremental(chartno, cached.payload.allOrders, onProgress);

        const lab    = merged.filter(o => o.ordType === 'LAB');
        const radAll = merged.filter(o => o.ordType === 'RAD');
        // No 12-month cutoff — MAX_HISTORY in report.js caps display

        // Re-run enrichment (enrichCache handles dedup)
        try {
          const manifest = window.TEST_MAP || [];
          await enrichMissingValues(lab, chartno, manifest, { onProgress });
        } catch (e) { console.warn('[enrichMissingValues]', e); }

        const payload = {
          chartno, patientInfo: patientInfo || cached.payload.patientInfo,
          lab: lab, rad: radAll, allOrders: merged,
          recentCount: lab.length + radAll.length,
          totalFetched: total || merged.length,
          fromCache: false, fetchedAt: new Date().toISOString(),
        };
        await cachePut(cacheKey, payload);
        return { ...payload, cachedAt: null };
      }
    }
  }

  // Full fetch (first time, forceRefresh, or no allOrders in cache)
  const { orders: all, total, patientInfo } = await fetchAllOrders(chartno, onProgress);
  // ... (rest of existing full-fetch flow, but also store allOrders in payload)
}
```

### 4. forceRefresh = full fetch

Keep ↻ button as full fetch (ignores incremental). This is the user's
escape hatch when something seems stale.

---

## Reporter Changes (hospital-lab-data.html)

### 1. Store raw orders in localStorage

Add a new storage key for raw orders cache:

```js
const ORDERS_CACHE_KEY = 'ordersCache_dialysis';

function loadOrdersCache() {
  try { return JSON.parse(localStorage.getItem(ORDERS_CACHE_KEY)) || {}; }
  catch { return {}; }
}
function saveOrdersCache(cache) {
  try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(cache)); }
  catch (e) { console.warn('[ordersCache] save failed:', e); }
}
```

Structure: `{ chartno: { orders: [...], ts: Date.now() } }`

### 2. Same `fetchIncremental()` function

Copy the same algorithm. Since reporter and viewer share the same ernode API
and parseOrdersPage format, the incremental logic is identical.

### 3. Modify `fetchAndStore()` to use incremental

```js
async function fetchAndStore(chartno) {
  const ordersCache = loadOrdersCache();
  const cached = ordersCache[chartno];
  let orders, patientInfo;

  if (cached && cached.orders && cached.orders.length > 0) {
    // Incremental fetch
    const result = await fetchIncremental(chartno, cached.orders, (n, t) => {
      setStatus(`${chartno}: 增量更新 ${n} / ${t} 筆`, true);
    });
    orders = result.orders;
    patientInfo = result.patientInfo;
  } else {
    // Full fetch (first time)
    const result = await fetchAllOrders(chartno, (n, t) => {
      setStatus(`${chartno}: 已擷取 ${n} / ${t} 筆`, true);
    });
    orders = result.orders;
    patientInfo = result.patientInfo;
  }

  // Save raw orders cache
  ordersCache[chartno] = { orders, ts: Date.now() };
  saveOrdersCache(ordersCache);

  // Sub-page enrichment (unchanged)
  try {
    await enrichMissingValues(orders, chartno, LAB_TESTS, { ... });
  } catch (e) { ... }

  // Extract and store parsed data (unchanged)
  let labValues = extractLabValues(orders);
  labValues = computeDerivedValues(labValues);
  const allLabData = loadLabData();
  allLabData[chartno] = { ...labValues, _lastUpdate: Date.now() };
  saveLabData(allLabData);

  // Demographics (unchanged)
  ...
}
```

### 4. localStorage size consideration

30 patients × ~100KB raw orders each ≈ 3MB. localStorage limit is typically
5–10MB. This is within limits but monitor:
- If save fails (quota exceeded), catch the error and fall back to NOT
  caching raw orders for that patient (graceful degradation).
- Consider compressing: strip `reportText` from orders that have already
  been parsed and are signed off (keep only ordseq + status for the
  incremental check). This would cut size by ~80%.

**Recommended: lean cache variant for reporter**

Instead of storing full orders, store only what incremental needs:

```js
ordersCache[chartno] = {
  // Full orders for ordseqs that might still change
  pending: orders.filter(o => o.status === '未執行'),
  // For signed orders, store only ordseq + status (enough for frontier detection)
  knownSigned: orders
    .filter(o => o.status !== '未執行')
    .map(o => ({ ordseq: o.ordseq, status: o.status })),
  ts: Date.now()
};
```

This reduces storage to ~5KB per patient (30 patients ≈ 150KB).

The tradeoff: when a signed order IS encountered during incremental fetch
(because it was previously pending), we need to run extractLabValues on just
that one order and merge into existing parsed data. This is a small amount
of extra code but significantly reduces storage.

---

## Expected Performance Improvement

| Scenario | Before | After |
|---|---|---|
| Viewer, no changes | 5–15 API calls | **1 API call** |
| Viewer, 1 new order | 5–15 API calls | **1 API call** |
| Reporter, 30 patients batch | 150–450 API calls | **30 API calls** (1 per patient) |
| Reporter, batch with 2 new orders per patient | 150–450 API calls | **30–60 API calls** |

---

## Release steps

1. Implement viewer changes in popup.js → test with a patient
2. Implement reporter changes in hospital-lab-data.html → test batch update
3. Commit separately per repo

```bash
cd hospital-lab-viewer
git add -A && git commit -m "feat: incremental fetch — only fetch new/updated orders (v4 cache)"

cd ../hospital-lab-reporter
git add -A && git commit -m "feat: incremental fetch — only fetch new/updated orders"
```

## Verification

### Viewer
1. Load a patient → full fetch (first time, no cache)
2. Wait or clear TTL → reload same patient → should see "增量更新" in console,
   only 1 page fetched
3. Check DevTools Network tab: only 1 request to ernode (not 5–15)
4. forceRefresh (↻) should still do full fetch

### Reporter
1. Fetch a patient batch → full fetch (first time)
2. Re-fetch same batch → incremental, 1 request per patient
3. Check that lab values are identical to full fetch

## Post-task

- Rename this file to `TASK_BRIEF_incremental_fetch_done.md`
- Move to `hospital-lab-patterns/docs/task-briefs/`
- Update WORKLOG.md (繁體中文)
- Update PROJECT_CONTEXT.md — add milestone about incremental fetch
- Do NOT git push — ask first
