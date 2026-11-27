# Alpha 0.1 roadmap and task queue

The repository is the project record. This queue sets order and ownership. The [project guide](project.md) records what ships today, its evidence and design constraints. **BOSS-3 is ready for a human room-ten playtest on the build 2 review branch.**

## Release goals

| Goal | Evidence still needed for release |
| --- | --- |
| A complete, replayable first floor across Burial Crypt, Flooded Warrens and Ruined Watchfort | The seeded ten-room routes exist. Validate repeat expeditions, encounter variety, stability and all three endings. |
| Nine playable builds and three mechanically distinct bosses | Nine builds are wired into the draft. Validate varied compositions. All three bosses have dedicated mechanics on the build 2 review branch. Playtest the Watchfort encounter. |
| Meaningful advancement, equipment decisions and tactical combat | Systems are integrated. Observe whether players understand tradeoffs and experience meaningful resource pressure. |
| Approximately 3–5 hours across 6–10 expeditions | Record human session duration, expedition count and repeated content. Pacing remains unmeasured here. |
| Fully playable on iPhone and iPad, with a consistent Slate & Iron pixel-art identity | Complete device playthroughs and visual review of all environments, controls, icons and boss warnings at game scale. |

## Ordered queue

| ID | Owner | State | Deliverable and acceptance |
| --- | --- | --- | --- |
| WF-1 | Lead | Approved and merged | Five specialists, two-child cap, lead-only delegation and handoff conventions. [Setup PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/2) |
| 1 · ROAD-1 | Lead | Merged | Reconciled the roadmap with the implemented game. [Roadmap PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/3) |
| 2 · ART-1 | Art and Asset Designer → lead | Completed, approved and merged | Shared Watchfort hobgoblin sprite integrated and checked on desktop and phone-sized boards. [Merged PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/4) |
| 3 · BOSS-3 | Game Developer → lead | In review · human playtest pending on `codex/boss-3-watchfort` | Verify the Warlord's signaled volley, terrain cover and one-action standard interaction, then playtest room ten. |
| 4 · BAL-1 | Balance Analyst | Queued | Validate both Wardens and the finished Warlord, encounter pressure and resource attrition across varied parties. Report paired seeded evidence and human observations separately. Seek owner approval before adopting a first-floor target. |
| 5 · ENC-1 | Game Developer | Queued | Identify repeated or unstable encounters from seeds and journals, prioritize observed problems, and verify fixes against reproductions. |
| 6 · UI-1 | UI/UX Designer | Queued | Audit all six integrated surfaces in the project guide, including boss telegraphs. Finish outstanding Slate & Iron presentation and touch flows identified in play. Defer movement, attack and healing animations to polish. |
| 7 · QA-1 | QA and Testing Engineer | Queued | Play on iPhone and iPad. Record device, OS/browser, orientation, seed, party, touch targets, scroll behavior and save/reload. Cover draft through boss, reward and journal. Run relevant regressions and log blockers. |
| 8 · REL-1 | Lead | Queued | Review release evidence for all goals, including human pacing, device usability and boss difficulty. Resolve release blockers and present Alpha 0.1 for owner approval. |

**Evidence vocabulary.** Implemented means a reachable code path exists. Tested names a check and its scope. Playtested requires a human observation with its source. Approved records an owner decision. Queued, ready and in review describe work state. Passing a harness alone cannot close a playtest or release gate.

## Handoff

**ROAD-1 · Lead → reviewer.** Baseline `f6fe856` on merged main. Compared the game, embedded art, tests and commit history with the owner’s Alpha notes. Ran all 15 focused regressions from the root with `node tests/<name>.cjs`: alpha-environments, alpha-ui, boss, combat-feedback, drowned-warden, fundamentals, hide, mastermind, quick-draw, resources, sprites, telemetry, trinkets-tactics, weapon-comparison and weapon-transfer. All passed. The four balance harnesses were inspected as simulation infrastructure. No new human sessions, balance benchmark or artwork trial were conducted for this migration.

**ART-1 · Art and Asset Designer → lead → reviewer.** Seed 34, Ruined Watchfort room 6, reproduced the glyph-only archer at H2 and soldier at E3.

- **Generation.** The specialist checked 34 base sprites, 41 supplemental assets, the aliases and tracked source art. The human archer and shieldbearer depict specific equipment, and the Iron Warlord has a dedicated boss silhouette. One ImageGen call produced a weapon-neutral hobgoblin with helmet, long ears and an oxblood surcoat.
- **Transfer.** The specialist sized the artwork to the shieldbearer’s 48×48 footprint and handed off [the transparent PNG](../assets/hobgoblin.png) under the existing hobgoblin key.
- **Integration.** The lead embedded the PNG in the base sprite dictionary. The sprite regression compares the image in each target cell against the source and checks the A/B tokens. It passed for seed 34 and the 12 opening boards. The alpha-environments and alpha-ui checks passed with 505 and 121 assertions.
- **Rendered check.** In Chrome at 1280×900, both sprites occupied about 61 px inside 68 px cells. At a 390×844 emulated phone viewport, each occupied about 34 px inside a 39 px cell. Both screenshots showed the A/B badges, the selected archer’s outline and separate target names. Physical-device play remains scheduled under QA-1.

**Playtest build handoff.** Open the review branch's root `index.html` in a private browser window. The Expedition draft header should show `Alpha 0.1 build 1` beside the seed above the first hero choice. After merge, repeat on GitHub Pages. A fresh-draft render check confirmed the build and seed 34, and `node tests/alpha-ui.cjs` passed all 121 assertions.

**BOSS-3 · Game Developer and QA → lead → reviewer.** The owner approved the optional I3 standard and permanent cancellation. Build 2 on `codex/boss-3-watchfort` opens with the volley so even a short fight presents the terrain decision. See [the boss guide](project.md#bosses) for targeting and cover rules.

**Human playtest.** Open the review branch's root `index.html` in a private window and confirm `Alpha 0.1 build 2` in the draft. Select any three heroes, choose Ruined Watchfort and enter room ten, The Warlord's Hall. After the first volley warning, move one hero off the marked row and leave another behind a weapon rack. The first should avoid the volley and the second should receive cover against a shot through the rack. On a subsequent volley warning, move a hero to H3 or another square beside I3 and choose **Lower standard**. Expect one action spent, the volley warning cleared and only close sweeps thereafter. Reload and confirm the standard stays lowered.

**Checks run on build 2.** All 16 focused scripts passed with `node tests/<name>.cjs`: the 15 listed in the ROAD-1 handoff plus `iron-warlord` (35 assertions). The new regression uses seed 34 to exercise telegraph geometry, rack cover, pillar shadow, lowering, subsequent sweeps and loading an older room-ten save. In a Chrome room-ten fixture at 1280×900 and 390×844, the 45-cell board fit the viewport, the volley warning appeared, and clicking Lower standard spent one action and survived reload. `node tests/balance.cjs index.html 3 2 34` cleared all ten rooms on seeds 34–36 without a stall. Room ten averaged four rounds.

**Next action.** Record a human room-ten playtest with build, party, seed, device and whether the warning gave enough information to choose between cover and flanking. BAL-1 follows encounter review.

Before a context limit approaches, warn the owner and update the active row with branch/commit, scope, evidence, unresolved decisions and the exact next action. A fresh chat starts here. Follow [repository delegation rules](../AGENTS.md): one writer per file, up to two specialists, no nested delegation. Escalate major design choices, permissions and unresolved blockers.
