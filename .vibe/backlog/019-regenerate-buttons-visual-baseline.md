---
status: in_progress
depends_on: [015]
---
# Regenerate Buttons Visual Baseline

## Description
Backlog item 015 added four `pressed`-state example buttons inside `dev-preview/main.js`'s `#section-buttons`, growing that section's rendered height. Per `.vibe/decisions/017-flaky-buttons-baseline-was-a-stale-baseline-not-a-race.md`, this is expected to make the committed `section-buttons` baseline (and possibly the baselines of sections rendered below it, if their required scroll offset shifts) stale. This repo's own sandbox Chromium cannot be used to regenerate a trustworthy baseline (its rendering is confirmed to differ from the real `ubuntu-24.04` GitHub Actions runner used for every committed baseline), so this needs the dedicated real-runner regeneration technique from decision `015`/`017` rather than a local `npm run test:visual:update`.

## Acceptance Criteria
- [ ] `section-buttons`'s baseline screenshot reflects the current `dev-preview/main.js` (including the four new `pressed`-state buttons), captured on the real `ubuntu-24.04` GitHub Actions runner
- [ ] Any other section baseline that shifted as a byproduct (per decision 017's documented risk) is identified by running the full visual suite on that same runner, and regenerated too if it changed
- [ ] `npm run test:visual` passes against the freshly regenerated baseline(s) in CI (`release.yml`'s existing step)

## Notes
This is routine baseline maintenance triggered by backlog item 015's dev-preview changes, not a product bug — mirrors exactly the situation investigated in backlog item `018`/decision `017` after backlog item `014`.
