# Pattern-learning workflow with Claude

This is the recipe for adding or updating a pattern in `hospital-lab-patterns`
through a Cowork conversation with Claude. The goal: turn one or more raw
example pages into a validated regex + display fields, committed with a
`WORKLOG.md` entry, in a single short session.

## Privacy first

**Real example pages contain PHI** — chartno, name, gender, age, lab
values. Never commit them. The repo's `.gitignore` keeps the `examples/`
folder out of git, and any file matching `*-chartno-*.{html,json}` or
`*.real.*` is ignored anywhere in the tree.

A safe workflow:

1. Save the raw HTML from `ernode.../order/get_lab_orders?...` into
   `hospital-lab-patterns/examples/`. This folder is gitignored.
2. Once the regex is finalised, you may keep an *anonymised* fragment as
   a doc-comment in the pattern entry (e.g. `// Sample: "WBC: 6.87"`).
3. The `examples/` raw pages can stay on your disk forever — they're
   never pushed.

## Starting a session

In Cowork, give Claude:

> Add a pattern for **`<test name>`** at hospital **`<tt|yl|both>`**.
> Example saved at `examples/<your-file>.html`. Sample value should be
> around **`<expected number / qualitative result>`**.

Claude will:

1. Read the file with the `Read` tool.
2. Find the relevant `tr.Row` containing the test, extract the
   `reportText` field.
3. Propose a regex (and a candidate id, displayName, unit, ref, hi/lo).
4. Run the regex against the raw text and **show you the captured value**.
5. Ask whether the proposed entry should be added to `viewer`, `reporter`,
   or both.

## Confirming and committing

Once you approve:

1. Claude appends the new entry to the relevant catalog file
   (`patterns/viewer.js` and/or `patterns/reporter.js`).
2. Claude runs `npm run validate` to make sure no duplicate id was
   introduced and the regex compiles.
3. Claude appends an entry to `WORKLOG.md`:

   ```markdown
   ## YYYY-MM-DD — Added <id>
   - Author: claude (with YC)
   - Hospital scope: <tt | yl | both>
   - Tests: <id>
   - Change: added
   - Rationale: <one line>
   - Validation: <raw text fragment> → <captured value>
   - Related commit: <will fill after commit>
   ```

4. Claude commits and pushes:

   ```bash
   cd hospital-lab-patterns
   git add patterns/<file>.js WORKLOG.md
   git commit -m "Add <id> pattern (<tt|yl|both>)"
   git push
   ```

5. Claude reports back the commit hash and updates the `WORKLOG.md`
   placeholder.

## Updating an existing pattern

When a hospital changes a label (e.g. `Hb:` → `HGB:`) and the existing
regex stops matching:

> Pattern `<id>` no longer matches at hospital `<tt|yl>`.
> Example: `examples/<file>.html`. The label is now `<new label>`.

Claude will:

1. Read the example, find the new label.
2. Propose updated regex preserving backwards compatibility (alternation
   is preferred over replacement — old hospital data should still parse).
3. Validate against both old and new sample fragments if both are
   available.
4. Update + commit + push, with `WORKLOG.md` documenting **what changed
   and why**.

## When the regex is tricky

For genuinely ambiguous cases (e.g. WBC reported in both `/µL` and
`×10³/µL`, or Glucose with many label variants), Claude will:

- Show 2–3 candidate regexes with their match counts on the example.
- Ask you to pick or describe an additional constraint.
- Add a `normalize` function if unit-conversion is needed
  (see existing `WBC` and `Platelet` for examples).

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `validate.js` reports duplicate id | You're adding an id that already exists — update instead of add. |
| Regex compiles but matches nothing | Check for hidden whitespace or full-width characters in the example; inspect the actual `reportText` Claude extracted. |
| Regex matches the *wrong* thing | Add a negative lookahead, anchor on a non-capturing prefix, or use `\b` word boundaries. |
| Value is captured with `< ` prefix | Use `([<>=]?\s*[\d.]+)` and strip the operator in `normalize`. |

## Single-source guarantee

Both consuming projects (`hospital-lab-viewer` and `hospital-lab-reporter`)
pull this repo at build/load time. So once a commit lands here, the next
extension reload (viewer) or HTML reload (reporter) picks up the change
automatically. There is no separate update step in either app.
