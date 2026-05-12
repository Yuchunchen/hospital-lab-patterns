# Hospital Lab — Workspace Root

This is the workspace root containing 3 repos. When running from this
directory, Claude Code can operate across all of them in a single session.

## Repos

| Directory | Role | Its own CLAUDE.md |
|---|---|---|
| `hospital-lab-patterns/` | Master pattern catalog (bootstrap repo) | ✓ Read it for catalog rules, release flow |
| `hospital-lab-viewer/` | Chrome extension (OPD handout) | ✓ Read it for viewer architecture |
| `hospital-lab-reporter/` | Single HTML (dialysis case management) | ✓ Read it for reporter architecture |

## First step in every session

1. **Read Notion 「🛠 開機 SOP (vhyl ↔ vhtt 共用)」 page** for current TODO
   and brief order (single source of truth across machines). See
   `hospital-lab-patterns/PROJECT_CONTEXT.md` § 10 for the page URL and
   sync convention.
2. Read the per-repo `CLAUDE.md` for whichever repos you're about to modify:

```bash
cat hospital-lab-patterns/CLAUDE.md
cat hospital-lab-viewer/CLAUDE.md
cat hospital-lab-reporter/CLAUDE.md
```

## Cross-repo workflow

When working across repos, follow this order:

1. **patterns first** — modify catalog/manifest/computed → `npm run release` → commit
2. **viewer second** — `cd hospital-lab-viewer && node sync-patterns.js` → commit
3. **reporter third** — `cd hospital-lab-reporter && node sync-patterns.js` → commit

Always ask before `git push` (強制規則 #3).

## Common cross-repo commands

```powershell
# Full release + sync cycle
cd hospital-lab-patterns ; npm run release
cd ../hospital-lab-viewer ; node sync-patterns.js
cd ../hospital-lab-reporter ; node sync-patterns.js

# Check status across all repos
cd hospital-lab-patterns ; git status
cd ../hospital-lab-viewer ; git status
cd ../hospital-lab-reporter ; git status
```

## Key rules (from project instructions)

1. WORKLOG.md 用繁體中文
2. 改程式碼後立刻更新 WORKLOG.md
3. git push 之前先問我
4. 跨 repo 副作用主動提醒
5. 動手寫程式前先說明在 Cowork 還是 Claude Code
6. TASK_BRIEF 完成後：改名 _done，搬到 patterns/docs/task-briefs/，
   更新 CLAUDE.md + PROJECT_CONTEXT.md
7. 回覆加簡短繁體中文註解

## Deep context

Full architecture, SOPs, form reference:
`hospital-lab-patterns/PROJECT_CONTEXT.md`
