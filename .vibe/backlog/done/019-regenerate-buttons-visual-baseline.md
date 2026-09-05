---
status: done
depends_on: [015]
---
# Regenerate Buttons Visual Baseline

## Description
Backlog item 015 added four `pressed`-state example buttons inside `dev-preview/main.js`'s `#section-buttons`, growing that section's rendered height. Per `.vibe/decisions/017-flaky-buttons-baseline-was-a-stale-baseline-not-a-race.md`, this is expected to make the committed `section-buttons` baseline (and possibly the baselines of sections rendered below it, if their required scroll offset shifts) stale. This repo's own sandbox Chromium cannot be used to regenerate a trustworthy baseline (its rendering is confirmed to differ from the real `ubuntu-24.04` GitHub Actions runner used for every committed baseline), so this needs the dedicated real-runner regeneration technique from decision `015`/`017` rather than a local `npm run test:visual:update`.

## Acceptance Criteria
- [x] `section-buttons`'s baseline screenshot reflects the current `dev-preview/main.js` (including the four new `pressed`-state buttons), captured on the real `ubuntu-24.04` GitHub Actions runner
- [x] Any other section baseline that shifted as a byproduct (per decision 017's documented risk) is identified by running the full visual suite on that same runner, and regenerated too if it changed
- [x] `npm run test:visual` passes against the freshly regenerated baseline(s) in CI (`release.yml`'s existing step)

## Notes
This is routine baseline maintenance triggered by backlog item 015's dev-preview changes, not a product bug — mirrors exactly the situation investigated in backlog item `018`/decision `017` after backlog item `014`.

## Resolution (2026-09-05)
Regenerated `section-buttons`'s baseline via the established throwaway `workflow_dispatch` technique (`.vibe/decisions/015`/`017`) on the real `ubuntu-24.04` runner. Byte-for-byte comparison of all 13 committed section baselines against a fresh full-suite regeneration found only `section-buttons` had changed — no other section shifted as a byproduct this time. A follow-up real-runner job then ran `npm run test:visual` (no update flag) against the new baseline set and it passed cleanly, confirming the third acceptance criterion ahead of the next release. No product or component code changed.
