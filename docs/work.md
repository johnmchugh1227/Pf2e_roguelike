# Alpha 0.1 roadmap and task queue

The repository is the project record. This queue sets order and ownership. The [project guide](project.md) records what ships today, its evidence and design constraints. **Active review: ART-1. Next assignment and gameplay milestone: BOSS-3.**

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
| 1 · ROAD-1 | Lead | Merged | Reconciled the roadmap with the implemented game. [Roadmap PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/3) |
| 2 · ART-1 | Art and Asset Designer → lead | In review | Shared Watchfort hobgoblin sprite integrated and checked on desktop and phone-sized boards. [Review PR](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/4) |
| 3 · BOSS-3 | Game Developer | Queued | Review the existing Warlord arena, sweep, reaction, artwork and unused war standard. Propose distinct Watchfort counterplay using its terrain. Obtain owner input on the major encounter design, then implement, test and playtest. |
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

**Next action.** Owner reviews [ART-1](https://github.com/johnmchugh1227/Pf2e_roguelike/pull/4). BOSS-3 starts with a Watchfort counterplay proposal for owner input.

Before a context limit approaches, warn the owner and update the active row with branch/commit, scope, evidence, unresolved decisions and the exact next action. A fresh chat starts here. Follow [repository delegation rules](../AGENTS.md): one writer per file, up to two specialists, no nested delegation. Escalate major design choices, permissions and unresolved blockers.
