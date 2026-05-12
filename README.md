# hospital-lab-patterns

Centralized regex pattern catalog for parsing lab and imaging report data from
the **ernode** hospital order-query API used at 臺北榮民總醫院玉里分院 (vhyl) and
臺東分院 (vhtt).

> **Cross-machine TODO / brief 順序**:see Notion page「🛠 開機 SOP
> (vhyl ↔ vhtt 共用)」(single source of truth across vhyl/vhtt;detail
> in `PROJECT_CONTEXT.md` § 10).

This is the single source of truth for:

- Lab-test regex patterns (label → numeric value extraction)
- Reference ranges, alarm thresholds (including gender-aware thresholds), display names
- Hospital-specific overrides (tt vs yl)
- Named normalizers (unit harmonisation, e.g. WBC `/µL` → `×10³/µL`)
- Computed-value definitions (eGFR, URR, Ca×P, CKD staging, hepatitis display)

## Consumers

| Project                      | Role                              | Imports          |
|------------------------------|-----------------------------------|------------------|
| `hospital-lab-viewer`        | Chrome extension – outpatient PHI handout | `patterns/viewer.js` manifest |
| `hospital-lab-reporter`      | Dialysis-room patient management & lab review | `patterns/reporter.js` manifest |

Both consumers resolve their manifests against the master `patterns/catalog.js`
and receive shared computed-value formulas from `patterns/computed.js`.
The viewer also fetches `dist/patterns.json` at runtime from GitHub (24h cache).

## Repo layout

```
hospital-lab-patterns/
├── README.md                    ← this file
├── WORKLOG.md                   ← chronological log of pattern additions / changes
├── PROJECT_CONTEXT.md           ← cross-repo architecture, SOPs, form reference
├── CLAUDE.md                    ← per-repo rules for Claude (Cowork & Code)
├── package.json                 ← name + npm scripts (validate, build-json, release)
├── .gitignore
├── patterns/
│   ├── index.js                 ← entry point; resolveManifest + byId + version
│   ├── catalog.js               ← master list of all test definitions (74 entries)
│   ├── viewer.js                ← thin manifest: ids + page/col/section (60 resolved)
│   ├── reporter.js              ← thin manifest: ids + cat/label (37 resolved)
│   ├── normalizers.js           ← named transform functions (wbcCount, plateletCount)
│   ├── computed.js              ← URR, Ca×P, eGFR (CKD-EPI 2021), CKD/KDIGO staging,
│   │                               hepatitis display (HBsAg/AntiHBs/HCV), PSA ratio
│   └── schema.js                ← validation helpers + field documentation
├── dist/
│   └── patterns.json            ← runtime JSON snapshot (COMMITTED — OPD viewer fetches this)
├── docs/
│   ├── bootstrap.md             ← new-machine setup guide（新機器啟用）
│   ├── cowork-project-instructions.md ← paste-able Cowork project instructions
│   ├── pattern-spec.md          ← schema field reference
│   ├── learning-workflow.md     ← Claude-driven pattern-learning recipe
│   ├── hospital-differences.md  ← known label/format differences vhtt vs vhyl
│   ├── sop-cowork-guide.md      ← Cowork 操作與 pattern learning SOP（中文）
│   ├── sop-claude-code-guide.md ← Claude Code 操作與 hand-off SOP（中文）
│   └── task-briefs/             ← completed TASK_BRIEF archives（所有 repo 共用）
├── scripts/
│   ├── validate.js              ← compile-check every regex, find duplicate IDs
│   └── build-json.js            ← generate dist/patterns.json from resolved arrays
└── examples/                    ← gitignored — never commit real chartno data
```

## Quick start

```bash
npm install
npm run validate     # compile-check all regex, fail on duplicate IDs
npm run build-json   # regenerate dist/patterns.json
npm run release      # validate + build-json in one step
```

In a consuming project:

```js
// Node / build script
const { viewer, reporter, computed, catalog, byId } = require('../hospital-lab-patterns/patterns');

// Browser (extension or HTML)
<script src="../hospital-lab-patterns/patterns/index.js"></script>
// → window.HospitalLabPatterns.viewer / .reporter / .computed / .catalog
```

The viewer also fetches at runtime:
```
https://raw.githubusercontent.com/Yuchunchen/hospital-lab-patterns/main/dist/patterns.json
```

## Resolution model (v0.3)

```
catalog (74 universal definitions)
    ↓ + viewer manifest  → resolved viewer entries (60)
    ↓ + reporter manifest → resolved reporter entries (37)
```

`Object.assign({}, catalogEntry, manifestEntry)` — manifest overrides catalog.

## Adding a new pattern

See [`docs/learning-workflow.md`](docs/learning-workflow.md) for the
Claude-driven workflow. In short:

1. Open a Cowork session; give Claude a chartno + test name + hospital.
2. Claude uses Claude in Chrome to open the ernode lab page on the intranet.
3. Claude finds the label, proposes a regex + display fields, validates
   against the captured text.
4. You confirm; Claude writes catalog.js + manifest, runs `npm run release`.
5. Push patterns repo → viewer gets it via `dist/patterns.json` within 24h;
   reporter gets it after `node sync-patterns.js` in reporter repo.

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
