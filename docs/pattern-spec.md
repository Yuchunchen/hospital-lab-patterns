# Pattern entry specification

Authoritative field reference for entries in `patterns/viewer.js` and
`patterns/reporter.js`. The runtime helper `validateCatalog()` in
`patterns/schema.js` enforces this spec.

> The schema is a **superset** of fields used by both consumers. An entry
> only needs the fields its consumer actually reads — extra fields are
> harmless and useful for migration.

## Identity

| Field | Type | Required | Description |
|-------|------|:-:|-------------|
| `id` | `string` | ✓ | Unique within its catalog. Stable forever (changing it is a breaking change). |

## Detection

| Field | Type | Description |
|-------|------|-------------|
| `pattern` | `RegExp \| null` | Capture group 1 = numeric value (or qualitative token). Use `null` for purely-computed entries. |
| `orderNameFilter` | `RegExp?` | Only orders whose `orderName` matches this regex are considered. Used by reporter to separate `BUN` standalone (post-dialysis) from comma-listed composite panels (pre-dialysis). |
| `orderNameMatch` | `RegExp?` | For `kind:'text'` entries — picks which imaging / endoscopy order to render. |
| `hospitalScope` | `'tt' \| 'yl' \| undefined` | Restricts the entry to one hospital's catalog. Omit for cross-hospital entries (the common case). |

## Display

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | `string` | Long bilingual form, e.g. `"白血球 (WBC)"`. Preferred by viewer. |
| `shortLabel`  | `string?` | Short form, e.g. `"WBC"`. Preferred by reporter. |
| `unit` | `string?` | e.g. `"mg/dL"`, `"×10³/µL"`. |
| `ref` | `string?` | Human-readable reference range. Free-form. |
| `meaning` | `string?` | Plain-language note shown on patient handout. |

## Numeric thresholds

| Field | Type | Description |
|-------|------|-------------|
| `refLo` / `refHi` | `number?` | Numeric bounds of normal range. |
| `lo` / `hi` | `number?` | Alarm thresholds. Often equal `refLo`/`refHi` but may diverge for clinical reasons (e.g. Hb has a wide normal range but the alarm threshold for dialysis patients is narrower). |

## Categorisation / layout

| Field | Type | Description |
|-------|------|-------------|
| `category` | `string?` | Human-readable group label. |
| `categoryId` | `string?` | Short id for code, e.g. `"CBC"`. Reporter uses `cat` (legacy alias). |
| `section` | `string?` | Viewer section title. |
| `page` | `1 \| 2` | Viewer A4 page. |
| `col` | `1..4` | Viewer column. |

## Filters / scope

| Field | Type | Description |
|-------|------|-------------|
| `gender` | `'M' \| 'F' \| undefined` | Show only for matching gender. Unknown gender → show all. |
| `hivOnly` | `boolean?` | Viewer: only render when the HIV checkbox is on. |
| `dialysisFilter` | `'composite' \| 'standalone_bun' \| undefined` | Reporter: classify a BUN order as pre- vs post-dialysis. (`filter` is the legacy alias.) |
| `qualitative` | `boolean?` | Value is text not number (e.g. `Reactive`). |
| `singleValue` | `boolean?` | Show only the single most-recent occurrence. |

## Value transform

| Field | Type | Description |
|-------|------|-------------|
| `normalize` | `(n:number) ⇒ number` | Applied after capture. Used to harmonise units, e.g. WBC 6700 → 6.7. |

## Computed entries

| Field | Type | Description |
|-------|------|-------------|
| `computed` | `string?` | Computation key. Consumer maps this to a function in `patterns/computed.js`. |
| `needs` | `string[]?` | Source ids this computation depends on. Reporter style. |

## Text-block entries

For viewer page 2 entries (DEXA, endoscopy, sono):

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `'text'` | Marks the entry as a text-form block instead of a numeric value. |
| `rows` | `Row[]` | Each row has `{label, fields[], options[], trailing}`. See viewer.js for examples. |

## Conventions

- Capture group 1 of `pattern` is the value. Use non-capturing `(?:...)`
  for everything else.
- Prefer one regex with alternation over multiple catalog entries:
  `/(?:Glucose(?:\([^)]*\))?|GLU[\s-]*(?:AC)?|Sugar):\s*([\d.]+)/i`.
- For values containing comparison operators (`< 0.1`, `>= 50`), use
  `[<>=]?\s*` before `[\d.]+` in the capture.
- Negative lookaheads `(?!...)` are useful to reject unwanted matches
  (the WBC pattern uses `(?!\s*[-–]\s*\d)` to skip urine-routine ranges
  like `WBC: 0-5`).
- Document non-trivial regex with a short comment on intent.
