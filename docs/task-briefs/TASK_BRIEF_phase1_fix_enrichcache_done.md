# TASK_BRIEF: Phase 1 Fix — enrichCache Key 改為共用

**Parent:** `TASK_BRIEF_phase1_repo_restructure.md`
**Execution mode:** Claude Code (隨 Phase 1 一起做)

## Problem

`enrichCache` 的 localStorage key 目前 hardcoded 為 `enrichCache_dialysis`：

```javascript
const ENRICH_CACHE_KEY = 'enrichCache_dialysis';
```

Sub-page enrichment 存的是 ordapno → raw text 的對應，**跟 disease 無關**
（同一個 ordapno 在 dialysis 和 CKD 裡內容完全一樣）。如果每個 disease
各自一份 enrichCache，同一個 ordapno 會被重複 fetch、重複存，浪費空間
和 API call。

## Fix

將 key 改為 disease-neutral 的共用 key：

```javascript
const ENRICH_CACHE_KEY = 'enrichCache';
```

## Migration

舊資料搬移（一次性，開頁面時自動執行）：

```javascript
// one-time migration: enrichCache_dialysis → enrichCache
(function migrateEnrichCache() {
  const OLD_KEY = 'enrichCache_dialysis';
  const NEW_KEY = 'enrichCache';
  const old = localStorage.getItem(OLD_KEY);
  if (old && !localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(NEW_KEY, old);
    localStorage.removeItem(OLD_KEY);
    console.log('[enrichCache] migrated from enrichCache_dialysis → enrichCache');
  } else if (old && localStorage.getItem(NEW_KEY)) {
    // Both exist (edge case) — merge, old entries don't overwrite new
    try {
      const merged = { ...JSON.parse(old), ...JSON.parse(localStorage.getItem(NEW_KEY)) };
      localStorage.setItem(NEW_KEY, JSON.stringify(merged));
      localStorage.removeItem(OLD_KEY);
      console.log('[enrichCache] merged enrichCache_dialysis into enrichCache');
    } catch (e) {
      console.warn('[enrichCache] migration merge failed:', e);
    }
  }
})();
```

## Scope

只改 enrichCache 相關的 4 個函數 + 常數定義：

| 項目 | 修改 |
|---|---|
| `ENRICH_CACHE_KEY` | `'enrichCache_dialysis'` → `'enrichCache'` |
| `loadEnrichCache()` | 不變（已用 ENRICH_CACHE_KEY） |
| `saveEnrichCache()` | 不變 |
| `enrichCacheGet()` | 不變 |
| `enrichCachePut()` | 不變 |
| 新增 | migration IIFE（放在 ENRICH_CACHE_KEY 定義之後） |

## 不改的

- IndexedDB raw orders cache — 已經是共用，不需動
- localStorage `patients_*` / `labs_*` — 各 disease 分開是正確設計
- `groups/dialysis.js` — 不涉及 enrichCache

## Testing

- [ ] 開頁面後 `enrichCache_dialysis` 消失，`enrichCache` 出現且內容一致
- [ ] 新的 sub-page fetch 結果寫入 `enrichCache`（非 `enrichCache_dialysis`）
- [ ] 已有 enrichCache 的 ordapno 不重複 fetch
