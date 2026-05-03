# hospital-lab-patterns

Centralized regex pattern catalog for parsing lab and imaging report data from
the **ernode** hospital order-query API used at 臺北榮民總醫院玉里分院 (vhyl) and
臺東分院 (vhtt).

This is the single source of truth for:

- Lab-test regex patterns (label → numeric value extraction)
- Reference ranges, alarm thresholds, display names
- Hospital-specific overrides (tt vs yl)
- Computed-value definitions (eGFR, URR, Ca×P, CKD staging)

## Consumers

| Project                      | Role                              | Imports          |
|------------------------------|-----------------------------------|------------------|
| `hospital-lab-viewer`        | Chrome extension – outpatient PHI handout | `patterns/viewer.js` |
| `hospital-lab-reporter`      | Dialysis-room patient management & lab review | `patterns/reporter.js` |

Both consumers also receive shared computed-value formulas from `patterns/computed.js`.

## Repo layout

```
hospital-lab-patterns/
├── README.md                    ← this file
├── WORKLOG.md                   ← chronological log of pattern additions / changes
├── package.json                 ← name + npm scripts (validate, test)
├── .gitignore
├── patterns/
│   ├── index.js                 ← entry point; exports viewer / reporter / computed / merged
│   ├── schema.js                ← shared field documentation + helpers
│   ├── viewer.js                ← outpatient catalog (56+ entries, layout-aware)
│   ├── reporter.js              ← dialysis catalog (50+ entries, category-grouped)
│   └── computed.js              ← URR, Ca×P, eGFR (CKD-EPI 2021), CKD/KDIGO staging
├── docs/
│   ├── pattern-spec.md          ← schema field reference
│   ├── learning-workflow.md     ← Claude-driven pattern-learning recipe
│   └── hospital-differences.md  ← known label/format differences vhtt vs vhyl
├── scripts/
│   └── validate.js              ← compile-check every regex, find duplicate IDs
└── examples/                    ← gitignored — never commit real chartno data
```

## Quick start

```bash
npm install
npm run validate     # compile-check all regex, fail on duplicate IDs
```

In a consuming project:

```js
// Node / build script
const { viewer, reporter, computed, byId } = require('../hospital-lab-patterns/patterns');

// Browser (extension or HTML)
<script src="../hospital-lab-patterns/patterns/index.js"></script>
// → window.HospitalLabPatterns.viewer / .reporter / .computed
```

## Adding a new pattern

See [`docs/learning-workflow.md`](docs/learning-workflow.md) for the
Claude-driven workflow. In short:

1. Open a Cowork session, paste an example HTML page or report-text excerpt
   from the ernode API for a chartno that contains the new test.
2. Tell Claude the test name and which hospital (tt / yl).
3. Claude proposes a regex + display fields, runs it against the example,
   and shows you the captured value.
4. You confirm; Claude commits to this repo with a `WORKLOG.md` entry.
5. Both consumer apps pick it up on next pull.

## Hospital scope

Each pattern entry may carry `hospitalScope`:
- `'tt'` — only used for vhtt (臺東分院)
- `'yl'` — only used for vhyl (玉里分院)
- omitted — used for both (the common case)

See [`docs/hospital-differences.md`](docs/hospital-differences.md) for known
label divergences between hospitals.

## Privacy

**Never commit raw API responses, real chart numbers, real patient names,
or any PHI.** The `examples/` folder is gitignored. Patterns themselves
contain no patient data — only regex strings, display text, and reference
ranges — so this repo can be private but is not a PHI store.

## License

Proprietary / internal use. Not for redistribution.
