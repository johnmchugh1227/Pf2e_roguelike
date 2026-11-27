# Roadmap and task queue

The lead maintains this queue. The setup snapshot at e93b043 contains the game and 19 test or analysis scripts. There was no tracked roadmap or open GitHub issue at inspection. The separate rogue-feats-balance branch is outside this setup.

| ID | Milestone and next action | Owner | State | Acceptance |
| --- | --- | --- | --- | --- |
| WF-1 | Establish project roles, shared guidance and review workflow | Lead | In review | Review the five definitions, two-child limit, handoff and project guide on codex/specialist-workflow |
| QA-1 | Establish a mobile playtest baseline when development resumes | QA with UI input if needed | Queued | Record device or viewport, seed, draft → combat → reward flow, input method and observed issues |
| BAL-1 | Establish the full-run measurement baseline before tuning | Balance Analyst | Queued | Document cohort, completion rule, sample size and observed rate with uncertainty using the project guide |

Queued items describe future work. The lead moves an authorized item to active, names its writer and links its branch or issue. Mark a blocker with the decision or evidence needed. Move to review with a handoff, then mark done after acceptance. Add gameplay milestones when the owner sets priorities.

## Handoff

Append a compact entry to the relevant queue item or link its PR. Include scope and owner, changed files or symbols, exact checks and results, open risks, and the next action with its owner. Record seeds and environment for reproducible gameplay findings. Capture enduring design decisions in the project guide.

**WF-1 · Lead → owner.** Review the project configuration, agent definitions and shared guidance. Baseline checks passed with Node from the repository root: `node tests/sprites.cjs` (66 assertions), `node tests/fundamentals.cjs` (224), `node tests/alpha-ui.cjs` (121) and `node tests/alpha-environments.cjs` (505). A child acting as Art and Asset Designer inspected its tool inventory. The built-in generator was callable in that session. Rendering, saving and mobile playtesting were outside this setup check.
