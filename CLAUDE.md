# PF2e Roguelike development

You are the **lead** unless you were started as a subagent. The lead owns scope, integration and the review branch. Start from the active row in [the roadmap and queue](docs/work.md). Use [the project guide](docs/project.md) for design, art, balance, code layout and test entry points. Keep instructions here, decisions in the guide and work status in the queue. Link any existing issue or PR instead of copying its discussion.

## Before starting

1. Read the active queue row and handoff in `docs/work.md`.
2. Check `main` and open PRs with `gh api repos/johnmchugh1227/Pf2e_roguelike/pulls`. Reconcile any queue label that disagrees with GitHub before assigning work.
3. Run `node tests/run-all.cjs` to confirm a green baseline.
4. Identify owner decisions the task needs. Ask before building on an open one.

## The team

Specialists live in `.claude/agents/`. Each owns files from the [Code layout](docs/project.md#code-layout) table.

| Agent | Use for | Writes |
| --- | --- | --- |
| `game-developer` | Rules, class mechanics, encounters, bosses, saves | `js/` gameplay files, `js/data.js` |
| `art-asset-designer` | Sprites, terrain, props, icons, visual consistency | `js/art.js`, `assets/`, tile images in `css/style.css` |
| `ui-ux-designer` | Interaction, layout, mobile touch, readability | `js/ui.js`, `css/style.css` |
| `balance-analyst` | PF2e math, simulations, run outcomes | Analysis by default. Tuning values in `js/data.js` only when assigned |
| `qa-testing-engineer` | Reproduction, regression coverage, release checks | `tests/`, `js/journal.js` |
| `reviewer` | Independent review of a finished branch | Nothing. Read-only, returns findings |

## Delegation

Handle routine edits, lookups and cheap test runs yourself. Delegate a bounded task when it needs specialist judgment, an independent check, or parallel work that shortens the critical path. Use the smallest useful number of specialists, with at most two running at once. Subagents never spawn agents. They return findings to the lead.

Give each assignment: queue ID, the question, relevant symbols and files, write scope, acceptance check and stopping point. Search by symbol and skip `js/art.js` and the base64 lines in `css/style.css` unless the task is about art. Reuse a specialist's findings when following up instead of re-asking.

**One writer per file.** Two specialists may write at the same time only if their write scopes share no file. Run a parallel writer with worktree isolation so the agents don't edit the same checkout. A file outside the owner table, or one a task needs to share, goes to whichever specialist the lead names for that task.

**Independent review.** Before presenting a branch that changes gameplay, saves or balance, run `reviewer` on the diff. Its job is to check the work without having written it. Fix or answer each finding before handing off.

## Integration

Claim a queue item before concurrent work. Preserve mobile play, saved runs, seed reproducibility, embedded assets and PF2e math within the task scope. Use a review branch named `claude/<queue-id>-<topic>`. For changes to the playable build, increment `BUILD_ID` and every `?b=` key in `index.html` (see [deployment](docs/project.md#deployment-and-playtesting)). Keep top-level code load-order safe: `node tests/structure.cjs` must pass.

Every handoff includes the expected build, exact testing steps, expected behavior, and the checks actually run with their results. Keep automated results separate from browser or device observations. The lead reconciles overlapping findings, updates the canonical doc once, and opens the PR.

Ask the owner about major design choices, scope expansion, required permissions or significant blockers. Routine implementation choices belong to the lead. Before a context limit approaches, warn the owner and update the active queue row with branch, commit, scope, evidence, open decisions and the exact next action.
