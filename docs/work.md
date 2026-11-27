# Alpha 0.1 roadmap and task queue

The repository is the project record. This queue sets order and ownership. The [project guide](project.md) records what ships today, its evidence and design constraints. **Active review: ROAD-1. Next assignment: ART-1. Next gameplay milestone: BOSS-3.**

## Release goals

| Goal | Evidence still needed for release |
| --- | --- |
| A complete, replayable first floor across Burial Crypt, Flooded Warrens and Ruined Watchfort | The seeded ten-room routes exist. Validate repeat expeditions, encounter variety, stability and all three endings. |
| Nine playable builds and three mechanically distinct bosses | Nine builds are wired into the draft. Validate varied compositions. Two bosses have dedicated mechanics. Finish the Watchfort encounter. |
| Meaningful advancement, equipment decisions and tactical combat | Systems are integrated. Observe whether players understand tradeoffs and experience meaningful resource pressure. |
| Approximately 3–5 hours across 6–10 expeditions | Record human session duration, expedition count and repeated content. Pacing remains unmeasured here. |
| Fully playable on iPhone and iPad, with a consistent Slate & Iron pixel-art identity | Complete device playthroughs and visual review of all environments, controls, icons and boss warnings at game scale. |

## Ordered queue

| ID | Owner | State | Deliverable and acceptance |
| --- | --- | --- | --- |
| WF-1 | Lead | Approved and merged | Five specialists, two-child cap, lead-only delegation and handoff conventions. [Setup PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/2) |
| 1 · ROAD-1 | Lead | In review | Reconcile the migrated claims against merged main, record focused test results and leave the next assignment reproducible. |
| 2 · ART-1 | Art and Asset Designer → lead | Ready | Reproduce the Watchfort hobgoblin sprite gap. Check both embedded dictionaries, aliases and available source art for a suitable match. If genuinely missing, generate one small asset, hand the PNG and integration details to the lead, then verify the integrated sprite in game and on a phone-sized board. Record generation, transfer and integration separately. |
| 3 · BOSS-3 | Game Developer | Queued | Review the existing Warlord arena, sweep, reaction, artwork and unused war standard. Propose distinct Watchfort counterplay using its terrain. Obtain owner input on the major encounter design, then implement, test and playtest. |
| 4 · BAL-1 | Balance Analyst | Queued | Validate both Wardens and the finished Warlord, encounter pressure and resource attrition across varied parties. Report paired seeded evidence and human observations separately. Seek owner approval before adopting a first-floor target. |
| 5 · ENC-1 | Game Developer | Queued | Identify repeated or unstable encounters from seeds and journals, prioritize observed problems, and verify fixes against reproductions. |
| 6 · UI-1 | UI/UX Designer | Queued | Audit all six integrated surfaces in the project guide, including boss telegraphs. Finish outstanding Slate & Iron presentation and touch flows identified in play. Defer movement, attack and healing animations to polish. |
| 7 · QA-1 | QA and Testing Engineer | Queued | Play on iPhone and iPad. Record device, OS/browser, orientation, seed, party, touch targets, scroll behavior and save/reload. Cover draft through boss, reward and journal. Run relevant regressions and log blockers. |
| 8 · REL-1 | Lead | Queued | Review release evidence for all goals, including human pacing, device usability and boss difficulty. Resolve release blockers and present Alpha 0.1 for owner approval. |

**Evidence vocabulary.** Implemented means a reachable code path exists. Tested names a check and its scope. Playtested requires a human observation with its source. Approved records an owner decision. Queued, ready and in review describe work state. Passing a harness alone cannot close a playtest or release gate.

## Handoff

**ROAD-1 · Lead → reviewer.** Baseline `f6fe856` on merged main. Compared the game, embedded art, tests and commit history with the owner’s Alpha notes. Ran all 15 focused regressions from the root with `node tests/<name>.cjs`: alpha-environments, alpha-ui, boss, combat-feedback, drowned-warden, fundamentals, hide, mastermind, quick-draw, resources, sprites, telemetry, trinkets-tactics, weapon-comparison and weapon-transfer. All passed. The four balance harnesses were inspected as simulation infrastructure. No new human sessions, balance benchmark or artwork trial were conducted for this migration.

**Next handoff · ART-1.** At seed 34, Watchfort (floor index 2), room 6, the archer and soldier both resolve to `hobgoblin`. `spriteImage` returns an empty string. Reproduce using `enemySpecs`, `spriteKey` and `spriteImage`; compare both variants with existing source art. If reuse resolves this gap, record that outcome and choose another verified missing asset for the generation trial. Deliver a source PNG, proposed key and visual reference. The lead owns integration in `index.html` and records a rendered board check plus sprite regression. The earlier child-tool probe established tool visibility only.

Before a context limit approaches, warn the owner and update the active row with branch/commit, scope, evidence, unresolved decisions and the exact next action. A fresh chat starts here. Follow [repository delegation rules](../AGENTS.md): one writer per file, up to two specialists, no nested delegation. Escalate major design choices, permissions and unresolved blockers.
