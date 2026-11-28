# Alpha 0.1 project guide

Open [index.html](../index.html) in a browser. It is a short shell that loads [css/style.css](../css/style.css) and the game scripts in [js/](../js/), in the order listed under [Code layout](#code-layout). A seed feeds `fresh` and `dealDraft`; three picks enter one of three ten-room environments. Follow `newRoom` and `kit` into combat, `field` for the board, `battleClick` for actions and `lootPanel` for rewards. Active runs and the journal persist in localStorage. Preserve old saves and seed reproducibility. See [the roadmap](work.md) for release goals, owners and audit results.

## Code layout

ARCH-1 (build 5) split the former single-file game into plain files with no build step. Every file is a classic `<script>`, so all files share one global scope and `index.html` still opens directly from disk. Load order matters only for code that runs at load time: a file's top-level statements may use only earlier files. Functions may call any file at run time. `ui.js` loads last because it boots the game. `node tests/structure.cjs` loads each file separately in browser order and fails if a file depends on a later one.

| File | Contents | Owner |
| --- | --- | --- |
| `index.html` | Shell, `BUILD_ID`, script order and `?b=` cache keys | Lead |
| `css/style.css` | All styling, including embedded terrain tile images | UI/UX Designer (Art for tile images) |
| `js/art.js` | `alphaArt`, `tileAssets`, `spriteAssets`, `spriteAliases` and art lookup helpers | Art and Asset Designer |
| `js/data.js` | Heroes, rooms, feats, bestiary, XP budgets, loot, hazards, spells and boss tables | Game Developer (Balance Analyst for tuning values) |
| `js/run.js` | Seeded run creation, draft, save/load and persistence | Game Developer |
| `js/journal.js` | Local run journal and telemetry | QA and Testing Engineer |
| `js/progression.js` | Feats, attributes, fundamental runes, weapon statistics and level-up panels | Game Developer |
| `js/encounters.js` | Room layouts, enemy specs, creature scaling and encounter budgets | Game Developer |
| `js/items.js` | Loot, equipment, transfers, Quick Draw, supplies, potions and recovery | Game Developer |
| `js/combat.js` | Dice, enemies, hazards, strikes, degrees of success, conditions, reactions, movement and line of sight | Game Developer |
| `js/abilities.js` | Forced movement, maneuvers, cantrips, focus, skills, Recall Knowledge, areas, summons and charges | Game Developer |
| `js/bosses.js` | Warden, Drowned Warden and Warlord intents, phases and telegraphs | Game Developer |
| `js/ai.js` | Enemy turns, movement and target selection | Game Developer |
| `js/ui.js` | Board, panels, combat feedback, `render`, input handlers and boot | UI/UX Designer |

The split moved whole top-level statements without changing their text. On the same seeds, all 17 focused regressions and the balance, boss-balance, fundamental-balance and knowledge-balance harnesses produced byte-identical output before and after. Some `*Panel` markup functions still sit next to their rules in gameplay files. Move them to `ui.js` only when a task touches them.

## Deployment and playtesting

GitHub Pages serves the root `index.html`, `css/` and `js/` from `main`. Review and playtest a branch locally by opening its `index.html` in a browser. Use a private window for a fresh draft when a saved battle resumes.

1. For each review build that changes what a player sees or plays, increment the number in `BUILD_ID` in `index.html` and set every `?b=` cache key in that file to the same number, so phones do not mix cached files from two builds. `node tests/structure.cjs` checks that they match. Check the latest `main` before merge so two playable builds never share a number. Documentation-only and test-only edits keep the current identifier.
2. In the handoff, give the expected menu label, the steps to reach the change (including seed, party or environment when relevant), and what the tester should observe. List automated commands and results separately from observations on a browser or device.
3. After the approved branch merges to `main`, check [Actions](https://github.com/johnmchugh1227/Pf2e_roguelike/actions) for a successful Pages deployment of the merge commit. The publishing source and live URL are listed in [Pages settings](https://github.com/johnmchugh1227/Pf2e_roguelike/settings/pages).
4. Open the [hosted game](https://johnmchugh1227.github.io/Pf2e_roguelike/) and compare the small build label beside the seed in the Expedition draft header with the handoff. If it shows an older build, verify the deployed commit and reload in a fresh private window. This also lets you keep a saved expedition in your regular window.
5. Follow the handoff steps and report the displayed build, seed, device/browser, actions, expected behavior and actual result. Include the party and room for encounter reports.

## Implemented systems at merged main

| System | Implementation and verification |
| --- | --- |
| Three actions and PF2e degrees of success | Hero turns grant three actions; `payAction` spends them. `outcome` uses ±10 thresholds and natural 20/1 degree adjustments. Multiple attack penalties live in `penalty`. Preserve these foundations where practical. |
| Draft, nine builds and class-specific feats | `roster` and `dealDraft` offer Shield and Reach Fighters, Bodyguard Guardian, Justice and Liberation Champions, Healing Cloistered Cleric and Harmful Warpriest, Thief and Mastermind Rogues. Three picks form a party. Advancement panels apply build choices and level boosts; alpha-environments exercises levels 2–5. |
| Rogue Quick Draw | Implemented for both Rogue builds. quick-draw exercises Thief and Mastermind. |
| Enemy AI, positioning, taunts and defensive reactions | `enemyTurn`, terrain/line-of-sight checks, `applyTaunt`, `tauntPenalty`, movement reactions and `defend` affect legal actions and damage. hide and boss cover specific positioning and reaction cases. AI quality remains a playtest question. |
| Recall Knowledge, hazards, summoning and destructible objectives | `recallMonster` and `recallHazard` track discoveries; `summonSkeleton` places reinforcements. Crypt wardstones can be attacked and destroyed. mastermind, alpha-environments and boss exercise knowledge, terrain cues and wardstone counterplay. |
| Loot, weapons, trinkets and magical equipment | `lootItems`, reward claims, gear and supplies feed combat; trinkets-tactics and resources exercise effects, healing and recovery. |
| Cone, line, burst, emanation and splash | `areaCells`, `areaTargets` and `resolveArea` determine affected squares and targets. Bomb splash uses `splashTargets`. Verified in source; the audit did not separately play each shape. |
| Transfers and damage comparisons | Compatible looted weapons move between heroes after encounters. Previews compare damage for the recipient. weapon-transfer and weapon-comparison cover ownership, compatibility, runes and riders. |
| Combat recaps, damage/healing indicators and wardstone absorption | The board shows action feedback, actual HP deltas and a prominent ward absorption message. combat-feedback covers feedback values and transitions. The owner reports the ward feedback change followed playtesting. |
| Local run journal and seeded testing | `journalRecord` and export preserve run outcomes, room snapshots and retry metadata. telemetry covers record handling. Four Node balance harnesses provide reproducible automated comparisons. |
| Slate & Iron advancement | `alphaAdvancement` is in the live levels 2–5 flow. alpha-environments checks choices and confirmation. Device usability remains open. |

## Progression and difficulty

Fundamentals are guaranteed to every hero at the party's attained level. `fundamentalRunes` supplies weapon potency, damage dice, armor and resilient saves independent of a particular weapon. Replacing or transferring a weapon preserves the baseline. Magical weapons, properties and trinkets should change interesting tactical choices. The first floor advances through level 5. Later entries describe the implemented schedule.

| Fundamental | Upgrade levels and resulting bonus |
| --- | --- |
| Weapon potency | 2 (+1), 10 (+2), 16 (+3) |
| Striking | 4 (2 damage dice), 12 (3), 19 (4) |
| Armor potency | 5 (+1), 11 (+2), 18 (+3) |
| Resilient | 8 (+1 saves), 14 (+2), 20 (+3) |

Commit `1e8574d` introduced universal progression. `a052b96` adjusted first-floor creature durability and offense; `d572806` retained an 18-expedition smoke harness. fundamentals checks the level 1–20 table and first-floor unlocks. The initial stat pass is implemented. Difficulty validation remains open.

**Approximately 50% is the eventual full-run win-rate target. The first-floor clear-rate target remains undecided** pending testing and owner approval. Define the cohort and full-run endpoint before measuring wins per eligible start. Record build, environment, seeds, party, retries, abandonments, sample size and uncertainty. The journal’s `floor_clear` and `cleanClear` refer to room ten. A terminal-only journal misses some starts.

Earlier automated expeditions reportedly had unusually high clear rates. Treat that as historical heuristic evidence. Human win rate and pacing need human sessions. Compare identical seeds and policies across revisions and report resource consumption, downs, party mix and where decisions or enemy mechanics were hard to read. For a small heuristic sample use `node tests/balance.cjs index.html 8 0 1`. Use knowledge-balance for a knowledge-limited pilot, boss-balance for Warden counterplay and fundamental-balance for the fixed-party smoke matrix.

### BAL-1 results on build 2

**Drafted expeditions.** On merged commit `874869a`, the pilot started seeds 1–36 once in each environment and played through room ten. Every seed used the same draft, party and decision policy across all three routes. The 36 matched triples covered 22 distinct three-build compositions and all nine builds. Twenty triples included a Healing Cloistered Cleric. There were 108 clears from 108 starts, with zero retries, abandonments or harness stalls.

| Route | Clears | Mean boss rounds | Mean party HP, boss entry → finish | Mean potions used before boss | Mean potions carried into boss | Heroes down at room end, rooms 1–9 / 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Burial Crypt | 36/36 | 5.61 | 97% → 72% | 4.14 | 5.81 | 3 / 1 |
| Flooded Warrens | 36/36 | 5.19 | 98% → 79% | 4.39 | 5.17 | 3 / 0 |
| Ruined Watchfort | 36/36 | 4.67 | 96% → 80% | 6.06 | 3.78 | 6 / 0 |

Watchfort used the most potions on the approach. All six room-end downs there occurred in rooms 7–9, including three in room 8, where parties finished at 74% HP on average. On seed 9, the same Reach Fighter, Thief and Mastermind ended room 8 at 57/162 HP in Crypt, 133/162 in Warrens and 71/162 in Watchfort. Against the Warlord, 23 of the 36 parties finished faster than against the Sepulcher Warden, five tied and eight took longer. Compared with the Drowned Warden, 18 finished faster, 11 tied and seven took longer.

HP is measured before post-combat recovery and includes in-combat healing. Downs count heroes at zero HP when a room ends. Potion spending includes between-room recovery up to boss entry. The pilots drank three further potions in Crypt boss fights across all 36 runs, and zero in the other boss fights. The standard harness's expedition-total potion field also counts healing after room ten. The per-room counters exclude that final recovery.

**Fixed-party check.** The independent 18-run smoke matrix cleared all routes. The Warlord was the shortest or tied boss fight for all six party/seed pairs. These parties were assigned directly, and each had only one seed. Use the drafted cohort above for examples reachable through the normal draft.

**Does responding to a warning help?** A separate pilot played five fixed parties on seeds 1–8 under two policies. Both made the same decisions before room ten. In the boss fight, one continued its normal attacks. The other sometimes moved off warned squares, attacked or disabled active Crypt wardstones, and lowered the Watchfort standard if already within reach. Each pair entered the boss with identical HP. The table gives normal → responsive results. Targets count hero inclusions across logged attack resolutions per boss start. A hero can appear more than once, and an inclusion can miss. Watchfort logs the volley for this measure.

| Boss | Boss starts per policy | Boss wins | Mean logged targets | Mean rounds | Mean finish HP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sepulcher Warden | 40 | 39 → 40 | 8.00 → 0.88 | 6.93 → 7.78 | 59% → 68% |
| Drowned Warden | 40 | 40 → 40 | 5.00 → 1.25 | 5.08 → 6.18 | 77% → 79% |
| Iron Warlord | 39 | 39 → 39 | 0.64 → 0.00 | 4.64 → 4.44 | 78% → 81% |

The responsive pilot lowered the standard in 8/39 Warlord fights. In the other 31 it also avoided every logged volley target. The comparison measures the combined policy, so it cannot isolate the value of lowering the standard. The same fixed Mastermind/Thief/Harmful Warpriest party lost in Watchfort room 8 on seed 4 under both policies, before it could face the Warlord. On Crypt seed 3 that party lost to the boss under the normal policy and won under the responsive one. All 240 policy runs terminated without a stall.

**Human evidence.** The owner is playtesting. The current estimates describe deterministic pilots on consecutive seeds, with shared seeds across routes. They do not establish a human clear rate or a population confidence interval. Keep the first-floor target open until the owner reviews playtest evidence. The journal fields to compare are build, seed, party, room reached, retries and resource use. For Watchfort, also record whether room 8 depleted supplies and which response the party chose at the first volley.

**Reproduce.** For each environment (`0` Crypt, `1` Warrens, `2` Watchfort), run `node tests/balance.cjs index.html 36 <environment> 1 --runs`. Match records by seed and picks. Within each run, `stats[9]` gives the boss entry, finish, and cumulative resources through combat. For the policy comparison, run `node tests/boss-balance.cjs index.html <environment>`, match party and seed, and filter on `entered` for boss measures. Run `node tests/fundamental-balance.cjs index.html` for the fixed-party smoke check.

### ENC-1 encounter variety and stability

Build 3 revises general-creature draws for new Warrens and Watchfort expeditions. Where consecutive rooms have the same supporting enemies, a draw that would repeat the lineup gets a second deterministic pick from the same pool, excluding that creature. In Warrens room 4 this also breaks up the fixed spiders in rooms 3 and 5. Existing expeditions, retries and **Replay seed** retain their original encounter version. A new draft uses the current version. Terminal journal exports include `encounterVersion`; build 2 records without the field use the original draws.

| Consecutive rooms with identical enemy names, summed across seeds 1–128 | Build 2 | Build 3 fresh draft |
| --- | ---: | ---: |
| Burial Crypt | 23 | 23 |
| Flooded Warrens | 67 | 0 |
| Ruined Watchfort | 36 | 0 |

Each pair counts once, so three identical fights in succession count twice. Crypt rooms 2 and 3 can field the same named guards. The third room raises the party level, scales creature levels and adds bone hazards. The Warrens seed-5 triple instead put the same lone spider ability set in three successive fights. Build 3 fields a Giant spider, Archer and Giant spider there.

**Stability evidence.** Across 3,840 room starts on seeds 1–128, initial creature footprints fit open terrain without overlaps and every starting enemy had a reachable melee approach. In 108 drafted expeditions per build (seeds 1–36 across all three routes), all parties cleared without retry. Automated terminal journal snapshots confirmed 17 adjacent Warrens repeats and 12 Watchfort repeats in the build 2 sample, and zero in either route in build 3. The fixed BAL-1 seed-4 Mastermind/Thief/Harmful Warpriest defeat reproduced on both builds in Watchfort room 8 against an Assassin and Hobgoblin soldier after five rounds. That fixture ended in a combat defeat with zero party HP. Difficulty remains a BAL-1 playtest question. Human journal exports were unavailable for this audit.

**Reproduce.** Run `node tests/encounters.cjs` for the version comparison, starting-square checks, melee approaches, and save/replay regression. For full expeditions use `node tests/balance.cjs index.html 36 1 1 --runs` for Warrens or replace environment 1 with 2 for Watchfort. To reproduce the controlled defeat, run `node tests/balance.cjs index.html 1 2 4 mastermind,thief,harmful --runs`.

## Bosses

| Boss | Current encounter | Remaining evidence or development |
| --- | --- | --- |
| Sepulcher Warden · Burial Crypt | Dedicated phases, wardstones, absorbed damage, fixed warnings and telegraphed attacks. `e30b410` introduced the encounter and `00da4ce` improved feedback. boss and combat-feedback pass. | Validate difficulty and legibility across parties. Prior human feedback concerns absorption; overall difficulty signoff is open. |
| Drowned Warden · Flooded Warrens | `939b63d` implements phased flooding, currents, push/pull, Drowned Grasp immobilization and telegraphed attacks. `15751ca` corrected the Fortitude save key. drowned-warden checks warned cells, phase triggers, movement, immobilization and safe squares across eight seeds. | Live playtest, difficulty validation and visual verification on the flooded board. |
| Iron Warlord · Ruined Watchfort | Build 2 opens with a volley signaled from I3, then alternates with a close sweep. The volley marks the row with the most visible heroes, taking the topmost row on a tie. Only visible floor squares are threatened. Racks grant cover and pillars block shots. Any hero within one square of I3 can spend one action to lower the standard, cancel a pending volley and end volleys for the fight. The Warlord remains vulnerable and retains his movement reaction. | `iron-warlord` covers the warning, cover, action and saved state. Human review of warning legibility and the cost of flanking is pending. |

## Slate & Iron art and interface

`spriteAssets` has 35 entries covering nine heroes and 26 creature/boss sprites, including dedicated Crypt enemies. `alphaArt` contains the additional 41 named PNGs embedded by `88df09c`. The package covers both later boss sprites, Warrens and Watchfort terrain, environmental props, three wardstone states, treasure chests, sanctuary shrine, war standard, equipment icons and combat action icons. Commit `3a566e6` integrated five revised seamless terrain tiles.

Build 2 renders the existing `war-standard` at I3 while raised. That brings the audited package entries with identified JS or CSS consumers to 35 of 41. The remaining six are `war-banner`, `rubble`, `floodgate`, `drain-grate`, `protection` and `upgrades`. Check `spriteAssets`, `spriteAliases`, `alphaArt`, CSS backgrounds and `terrainCell` before commissioning art. The Watchfort hobgoblin soldier and archer share a weapon-neutral sprite. Its [source PNG](../assets/hobgoblin.png) is embedded under their existing species key.

| Interface area | Live integration to inspect on device |
| --- | --- |
| Combat HUD and tactical indicators | `field` renders the 45-cell board, inspector, unit sprites and action/target highlights. |
| Boss mechanics and telegraphs | Danger cells and warnings convey Warden intent; assess visibility under sprites and water overlays. |
| Rewards | `lootPanel` supports inspection before assignment and claim. alpha-ui verifies preview leaves resources and RNG intact. |
| Equipment management | `equipmentPanel` displays live stats, comparisons and eligible between-room transfers. |
| Advancement | Portrait tabs, choices and confirmation are live for levels 2–5. |
| Combat feedback | Action recaps, HP changes and ward warnings are visible in the combat flow. |

Preserve pixelated silhouettes, readable footing, dark terrain, parchment panels, warm selection outlines, serif headings, fallback glyphs and keyboard focus. On iPhone and iPad test portrait and landscape with touch: inspect a tile, move or target, read a warning, compare and equip a reward, and advance with minimal navigation. At the 640 px card breakpoint check stacking and control reachability. Keep board scrolling contained. Check large sprites against adjacent cells and verify text and telegraphs at actual game scale. Movement, attack and healing animations are future polish.

### UI-1 interface audit on build 4

| Surface | Interaction verified in Chrome |
| --- | --- |
| Combat HUD | Read tiles makes all 45 squares available for inspection. Tap a square or use the arrow keys to read its coordinates, occupant and terrain cues. Escape returns focus to Read tiles. Inspection preserves actions, target, RNG and legal movement buttons. Inspect target jumps between the board and inspector. |
| Boss warnings | Warned squares on all three boss boards expose danger in their accessible names and display an exclamation mark above the sprite. The marker has its own element so flooded squares can retain the water glyph. Lower standard remains reachable during the Warlord's volley. |
| Rewards | Preview preserves focus on the selected offer until the player claims it. At widths up to 640 px the three recipient comparisons stack vertically. |
| Equipment | Equipping a weapon preserves the open equipment sections. If the equipped choice becomes disabled, focus returns to the section summary. |
| Advancement | Switching heroes preserves focus on the selected tab. When a feat choice advances to another hero, focus follows that hero. Returning to the first hero shows the selected feat. |
| Combat feedback | The board's Latest action link reaches the current recap, including the actual HP change. The inspector has a return link to the board. |

Run `node tests/browser/interface.cjs` with a local Chromium browser. Set `CHROME_PATH` if the executable is outside the detected locations. The runner creates an isolated temporary browser profile. Build 4 passed at 320×568, 390×844, 640×900, 641×900, 844×390, 768×1024, 1024×768 and 1280×900. All six surfaces fit the page at these sizes. A separate 390 px visual inspection covered occupied volley squares, reward cards and advancement tabs. Physical Safari touch behavior and assistive-technology use remain for device review.

## Verification and evidence

Run `node tests/<name>.cjs` from the repository root. Use the [existing scripts](../tests/) for mechanics, sprites, feedback, equipment, telemetry and balance. Most load the game scripts through [tests/lib/source.cjs](../tests/lib/source.cjs) and run them with stubbed browser services. Run `node tests/structure.cjs` after any change to file layout or load order. Record the exact test, seed, environment and result alongside any separate human or device observations. The [migration handoff](work.md#handoff) lists checks run against the audited snapshot.
