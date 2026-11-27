# Project guide

## Design and architecture

Open [index.html](../index.html) in a browser. It contains the CSS, game data, embedded PNGs, rules, rendering and input handling. A seeded draft (`fresh`, `dealDraft`) yields a three-hero party. The Burial Crypt, Flooded Warrens and Ruined Watchfort have distinct terrain. Follow `newRoom` and `kit` into combat, `field` for board rendering, `battleClick` for actions and `lootPanel` for rewards. Advancement occurs between rooms. Active runs and journal records persist in localStorage. Preserve compatibility when touching their shapes. Many tests extract the inline script and run it with stubbed browser services.

## Art style and mobile interaction

Use the current board as the reference at actual phone size. The terrain uses dark, desaturated surfaces, warm selection outlines and pixelated sprites. Reference `spriteAssets`, `spriteAliases`, `alphaArt` and `terrainCell` before proposing new art. Match the scale and footing of an existing unit of the same size. Check large sprites against adjacent cells, overlays and targeting markers. Preserve fallback glyphs and embedded PNG references. Sprite and environment tests exercise asset lookup and board output.

Keep the existing parchment cards, serif headings, visible keyboard focus and tap-driven controls. At and below the 640 px card breakpoint, check that cards stack, action controls remain reachable and horizontal board scrolling stays inside its container. Check narrow portrait and landscape layouts in a browser. Exercise selection, inspection and reward confirmation by touch. Static markup assertions cover only part of this experience.

For an authorized art request, first identify the existing reference, intended board size and integration key. The specialist capability probe on 2026-11-27 found `tools.image_gen__imagegen` in a child session. It checked tool exposure only. Recheck in the actual art session, then validate a single requested candidate at game scale before considering batch work. Retain the original asset through review. Artwork generation is on demand.

## Balance targets

Preserve PF2e's four degrees of success, critical thresholds, natural-roll adjustments, action economy and multiple attack penalty where applicable. Start from existing helpers such as `penalty` and `targetAC`. Record the rationale and expected effect of any proposed departure before tuning.

The eventual target is approximately 50% full-run wins. Agree on the target player cohort and what finishes a full run before tuning. For a defined cohort, count unique eligible starts, count wins at the agreed endpoint and report wins/starts with sample size, uncertainty, build, environment, party, retry policy and missing or abandoned starts. A terminal-only journal cannot supply every start. Keep partial records and repeated attempts visible. The current journal's `floor_clear` and `cleanClear` describe the tenth-room floor endpoint. Confirm that endpoint matches the intended full run before treating it as the success measure.

Use fixed seeds and the same policy for before/after comparisons. For a small reproducible heuristic sample run `node tests/balance.cjs index.html 8 0 1` (eight seeds, first environment, starting at seed 1). Inspect knowledge-limited and boss harnesses for narrower questions. Report human playtest and simulated results separately. There is no measured player win-rate baseline in this setup.

## Verification

Run Node scripts directly from the repository root. Start with the smallest relevant check. Use [the tests directory](../tests/) and each script's usage for the wider matrix.

| Change area | Example command or check |
| --- | --- |
| Rules, resources, bosses | `node tests/fundamentals.cjs`, `node tests/resources.cjs`, `node tests/drowned-warden.cjs` |
| Art and board layout | `node tests/sprites.cjs`, `node tests/alpha-environments.cjs`, browser check at phone width |
| UI flows and combat feedback | `node tests/alpha-ui.cjs`, `node tests/combat-feedback.cjs`, touch and keyboard playthrough |
| Local journal and outcome reporting | `node tests/telemetry.cjs` and a save/reload check |
| Balance comparisons | `tests/balance.cjs`, `tests/knowledge-balance.cjs` and `tests/boss-balance.cjs` with recorded inputs |

For setup-only changes, validate the TOML, documentation links and review diff. A gameplay regression warrants a reproducible failing check before a fix.
