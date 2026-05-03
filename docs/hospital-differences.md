# Hospital differences — vhtt vs vhyl

Catalog of known label / format divergences between the two hospital
ernode endpoints we currently support.

| Endpoint | Host | Subdomain |
|----------|------|-----------|
| 臺北榮總玉里分院 | `ernode.vghb12.vhyl.gov.tw:8000` | `vhyl` |
| 臺北榮總臺東分院 | `ernode.vghb12.vhtt.gov.tw:8000` | `vhtt` |

The `hospitalScope` field on a pattern entry pins it to one site:
- `'tt'` — vhtt only
- `'yl'` — vhyl only
- omitted — used for both (the common case)

## Known differences

> *(empty for now — populate as we discover them. The current catalogs
>  use cross-hospital patterns by default.)*

### Format

| Aspect | vhtt | vhyl |
|--------|------|------|
| HTML structure (`table.Grid` rows, `>>` pagination) | same | same |
| Date format (民國年, e.g. `115/04/14`) | same | same |
| Chartno format (`9 digits + 1 letter`) | same | same |
| RESDTTM (`YYYYMMDDHHMMSS` Gregorian) | same | same |

### Test labels

(Document any labels that differ here as you find them. Examples of what
to capture:)

```
HBsAg label:
  vhtt: "HBsAg(TT):"
  vhyl: "HBsAg:"
  → handled by /(?:HBsAg(?:\(TT\))?):/ in reporter.js (HBsAg)

HCV antibody label:
  vhtt: "HCV Ab(TT):"
  vhyl: "Anti-HCV:"
  → handled by /(?:HCV Ab\(TT\)|Anti-HCV)/ in reporter.js (AntiHCV)
```

### Observed special handling

- The `(TT)` suffix on hepatitis labels at vhtt is folded into a single
  pattern via alternation — neither hospital needs a separate entry.

## How to add a divergence

1. Find an example page from each hospital that shows the difference.
2. Save them under `examples/` (gitignored).
3. Decide:
   - **Cross-hospital pattern** with alternation (preferred): one entry,
     `(?:LABEL_TT|LABEL_YL):`. Keep `hospitalScope` omitted.
   - **Per-hospital entries**: add two entries with the same id base but
     `hospitalScope: 'tt' | 'yl'`. Use this only when display fields or
     thresholds also differ.
4. Update this doc with the divergence and the chosen approach.
5. Bump the WORKLOG.md.
