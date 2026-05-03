# Pattern-learning workflow with Claude

This is the recipe for adding a new pattern to `hospital-lab-patterns`
through a Cowork conversation with Claude. Goal: turn a real example
page into a validated catalog entry, committed with a `WORKLOG.md` line,
in one short session.

## Architecture quick refresher (v0.2)

```
patterns/
├── catalog.js   ← THE master list of every test (universal fields only)
├── viewer.js    ← Manifest: ids the viewer renders + page/col/section
├── reporter.js  ← Manifest: ids the reporter renders + cat/label
└── computed.js  ← Derived-value formulas (eGFR, URR, Ca×P, CKD staging)
```

Adding a pattern can mean any of three things:

| Goal | What changes |
|------|--------------|
| Detect AND show in viewer printout | catalog.js + viewer.js |
| Detect AND show in reporter table   | catalog.js + reporter.js |
| Detect ONLY (track-only / shadow)    | catalog.js (no manifest entry) |

`scripts/validate.js` lists track-only ids so you can see at a glance
which catalog entries no app currently renders.

## Two ways to give Claude the example

### Option A (preferred) — Live fetch via Claude in Chrome

The Claude Chrome extension runs in *your* browser on *your* machine —
which sits on the hospital intranet. So Claude can navigate directly to
the ernode URL and read the page, even though Claude's sandbox can't
reach `ernode.vghb12.*.gov.tw` itself.

**Requirements:**
- The Claude Chrome extension is installed and authenticated.
- Chrome is open AND your machine is currently on the hospital network
  for the right hospital (vhtt or vhyl).

**Invocation template:**

> Fetch chartno **000810385G** at hospital **yl** and add a pattern for
> **Vitamin D**.
> Sample value should be around **24 ng/mL**.
> I want it rendered in **viewer** (page 1, col 3, section "維生素").
> *(Or "Detection only — don't add to any manifest.")*

What Claude does:

1. Opens a new tab and navigates to
   `http://ernode.vghb12.vhyl.gov.tw:8000/order/get_lab_orders?chartno=000810385G&opsid=<your-opsid>`
   (uses your OPSID from the chat; asks if it's not already known).
2. Walks any pagination (`>>` links) until it finds an order whose
   `reportText` contains the test name or expected label.
3. Extracts the relevant `tr.Row` and shows you the captured `reportText`.
4. Proposes a regex + display fields.
5. Validates the regex against the captured text — shows the captured
   value back to you for verification.
6. After you confirm: edits `catalog.js`, optionally edits the relevant
   manifest, runs `validate`, appends to `WORKLOG.md`, hands you a
   `git push` snippet.

**Privacy note:**
Real values flow into the conversation while Claude reads the page. The
repo never sees raw values — only the regex pattern + an *anonymised*
sample fragment in `notes` (e.g. `// Sample: "Vit. D-25(OH): 24.6"`).
If you'd like to clear the conversation after, do so — patterns survive
in the repo regardless.

### Option B (fallback) — Save the HTML, hand over the file

Use this when:
- Chrome extension isn't installed / authenticated, or
- You're not on the hospital network right now (working from home), or
- You want a permanent local archive of an interesting case.

**Workflow:**

1. In Chrome, view the ernode page for the chartno you care about.
2. `Ctrl+S` → "Webpage, HTML only" → save into
   `hospital-lab-patterns/examples/`. Name it anything; the folder is
   gitignored so nothing escapes.
3. Send Claude:

   > Add a pattern for **Vitamin D**.
   > Example saved at `examples/000810385G-2026-04.html`.
   > Hospital: **yl**. Expected value ~24 ng/mL.
   > Render in viewer (page 1, col 3, section "維生素").

Claude reads the file via the `Read` tool and proceeds the same way as
Option A from step 3 onwards.

## Privacy

**Saved pages and live-fetched pages both contain PHI.** The repo's
`.gitignore` covers the saved-page case:
- `examples/` — entire folder gitignored
- `*-chartno-*.{html,json}` and `*.real.*` — gitignored anywhere

For live-fetched pages, the data lives only in the Cowork conversation —
it never reaches the repo. Catalog entries should never include raw
chartnos, real names, or full report texts; only an anonymised regex
sample (`// Sample: "WBC: 6.87"`) in the `notes` field is appropriate.

## Confirming and committing

Once you approve the proposed regex, Claude:

1. Edits `patterns/catalog.js` — appends the new entry in the appropriate
   clinical section. Sets `notes` if there's anything tricky about the
   regex (alternation, lookarounds, label variants).
2. If the entry should be rendered, edits the appropriate manifest:
   - `patterns/viewer.js` — adds `{id:'<id>', page:?, col:?, section:'…'}`
     and any per-app overrides (e.g. tighter hi/lo for outpatient context).
   - `patterns/reporter.js` — adds `{id:'<id>', cat:'…', label:'…'}` plus
     any reporter-specific filter / qualitative flags.
3. Runs `npm run validate` to confirm the catalog still parses, ids are
   unique, and every manifest id resolves.
4. Appends a `WORKLOG.md` entry:

   ```markdown
   ## YYYY-MM-DD — Added <id>
   - Author: claude (with YC)
   - Hospital scope: <tt | yl | both>
   - Catalog entry: <id> (<category>)
   - Manifests: <viewer | reporter | both | none — track-only>
   - Rationale: <one line>
   - Validation: <anonymised sample> → <captured value>
   ```

5. Stages, commits, and gives you the `git push` command (which you run
   from PowerShell because gh CLI lives there).

## Updating an existing pattern

When a hospital changes a label (e.g. `Hb:` → `HGB:`) and the existing
regex stops matching:

> Pattern `<id>` no longer matches at hospital `<tt|yl>`.
> Fetch chartno **000810385G** at **yl** and propose a fix.
> *(Or: example saved at `examples/<file>.html`.)*

Claude reads the example, proposes an updated regex (preferring
**alternation** so old-format data still parses), validates against both
old and new fragments if both are available, edits `catalog.js`, and
adds a WORKLOG entry explaining *what changed and why*.

## When the regex is tricky

For genuinely ambiguous cases (multiple unit conventions, similar labels
that should NOT match, comparison-operator results like `<5.0` or `>2000`):

- Claude shows 2-3 candidate regexes with their match counts on the example.
- Asks you to pick or describe an additional constraint.
- Adds a `normalize` function if unit-conversion is needed (see existing
  `WBC` and `Platelet` for examples — they handle `/µL` ↔ `×10³/µL`).
- Documents the choice in the entry's `notes` field.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Live fetch fails with "tab won't load" | Chrome isn't on the hospital network, or wrong hospital subdomain (vhtt vs vhyl). |
| Live fetch returns the login page | Your OPSID is wrong or expired. Send Claude the correct OPSID. |
| `validate.js` reports duplicate id | Catalog already has that id — update the existing entry instead of adding a new one. |
| `validate.js` reports manifest id not in catalog | You added a manifest entry without first adding to the catalog. |
| Regex compiles but matches nothing | Check for hidden whitespace or full-width characters; inspect the actual `reportText` Claude extracted. |
| Regex matches the *wrong* thing | Add a negative lookahead, anchor on a non-capturing prefix, or use `\b` word boundaries. |
| Value is captured with `< ` prefix | Use `([<>=]?\s*[\d.]+)` and strip the operator in `normalize`. |

## Single-source guarantee

Both consuming projects pull from this repo at "build" (sync) time:
- `hospital-lab-viewer/sync-patterns.js` regenerates `mapping.js` by
  bundling catalog + manifest + resolver.
- `hospital-lab-reporter/sync-patterns.js` inlines the same content into
  the marker block of `hospital-lab-data.html`.

So once a commit lands here, the next sync (`node sync-patterns.js` in
each app) propagates the change automatically.

## Track-only patterns FAQ

> *I want pattern detection but no UI rendering. How?*

Add the entry to `catalog.js`. Don't list it in `viewer.js` or
`reporter.js`. Run `npm run validate` — it will report the new id under
"track-only catalog ids".

> *I want to promote a track-only pattern into one of the apps later.*

Just add a manifest entry referencing its id. No catalog change needed.
