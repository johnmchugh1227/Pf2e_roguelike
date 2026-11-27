# PF2e Roguelike development

The lead owns scope, integration and the review branch. Start from the active row in [the roadmap and queue](docs/work.md). Use [the project guide](docs/project.md) for design, art, balance and test entry points. Keep instructions here, decisions in the guide and work status in the queue. Link any existing issue or PR instead of copying its discussion.

## Delegation

Handle routine edits, lookups and cheap test runs directly. Delegate a bounded task when it needs specialist judgment, an independent check, or parallel work that shortens the critical path. Use the smallest useful number of specialists. Only the lead may spawn them, with at most two open at once. Specialists return findings to the lead and never delegate.

Use game_developer for mechanics and saves, art_asset_designer for sprites and terrain, ui_ux_designer for interaction and layout, balance_analyst for math and run outcomes, or qa_testing_engineer for reproducibility and regression coverage. Give each the queue ID, question, relevant symbols, write scope, acceptance check and stopping point. Keep one writer per file at a time. Since gameplay, CSS and artwork share index.html, a second specialist can inspect the baseline or work on a separate test. Avoid handing both agents the entire game to reread. Search by symbol and skip base64 payloads. Reuse a specialist's findings when following up.

## Integration

Claim a queue item before concurrent work. Preserve mobile play, saved runs, embedded assets and PF2e math within the task scope. Use a review branch. Run checks that exercise the change and record actual results in the handoff. The lead reconciles overlapping findings, updates the canonical document once, and presents the branch for review. Ask the owner about major design choices, required permissions or significant blockers. Routine implementation choices belong to the lead.
