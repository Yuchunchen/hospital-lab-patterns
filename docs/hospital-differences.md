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

The current catalogs use cross-hospital patterns by default. Divergences
are handled via regex alternation so a single catalog entry covers both
hospitals. The following have been confirmed as of 2026-05-05.

### Format (identical)

| Aspect | vhtt | vhyl |
|--------|------|------|
| HTML structure (`table.Grid` rows, `>>` pagination) | same | same |
| Date format (民國年, e.g. `115/04/14`) | same | same |
| Chartno format (`9 digits + 1 letter`) | same | same |
| RESDTTM (`YYYYMMDDHHMMSS` Gregorian) | same | same |

### Test label differences (confirmed)

| Test | vhtt label | vhyl label | Catalog handling |
|------|-----------|-----------|-----------------|
| HBsAg | `HBsAg(TT):` | `HBsAg:` or `HBsAg(YL):` | alternation `(?:HBsAg(?:\((?:TT\|YL)\))?)` |
| Anti-HCV | `HCV Ab(TT):` | `Anti-HCV:` | alternation `(?:HCV Ab\(TT\)\|Anti-HCV)` |
| Anti-HBs | `Anti-HBs(TT):` | `Anti-HBs:` or `Anti-HBs(YL):` | alternation with optional suffix |
| AFP | `AFP(TT):` | `AFP:` or `AFP(YL):` | alternation with optional suffix |
| TSAT | `TSAT:` | may appear as `TSAT(YL):` | optional `(YL)` suffix in regex |
| Fe (Iron) | `Fe:` | may appear with `(YL)` suffix or concatenated to previous line | regex handles concatenated format |

### Suffix patterns

- **vhtt** uses `(TT)` suffix on hepatitis and some other lab labels.
- **vhyl** uses `(YL)` suffix on some labels, but not consistently — some
  labels appear without any suffix.
- Both suffixes are folded into regex alternation, so neither hospital
  needs a separate catalog entry.
- The `(YL)` suffix was discovered during 2026-05-05 五批修正; some vhyl
  labels also have a "concatenated" format where the value runs into the
  previous line without a newline separator.

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
