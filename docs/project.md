# Alpha 0.1 project guide

Open [index.html](../index.html) in a browser. It contains the rules, game data, embedded PNGs, rendering and input handlers. A seed feeds `fresh` and `dealDraft`; three picks enter one of three ten-room environments. Follow `newRoom` and `kit` into combat, `field` for the board, `battleClick` for actions and `lootPanel` for rewards. Active runs and the journal persist in localStorage. Preserve old saves and seed reproducibility. See [the roadmap](work.md) for release goals, owners and audit results.

## Deployment and playtesting

GitHub Pages serves the root `index.html` from `main`. The HTML includes the game and its art. Review and playtest a branch locally by opening its `index.html` in a browser. Use a private window for a fresh draft when a saved battle resumes.

1. For each review build that changes what a player sees or plays, increment the number in `BUILD_ID` in `index.html`. Check the latest `main` before merge so two playable builds never share a number. Documentation-only and test-only edits keep the current identifier.
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

## Verification and evidence

Run `node tests/<name>.cjs` from the repository root. Use the [existing scripts](../tests/) for mechanics, sprites, feedback, equipment, telemetry and balance. Most execute the inline game script with stubbed browser services. Record the exact test, seed, environment and result alongside any separate human or device observations. The [migration handoff](work.md#handoff) lists checks run against the audited snapshot.
