---
status: in_progress
depends_on: [016]
---
# Regenerate Viewport-3D and Shortcuts Visual Baselines

## Description
Backlog item 016 added `<wuik-dialog>` plus a new demo section to `dev-preview/main.js`, growing the page. Per `.vibe/decisions/017-flaky-buttons-baseline-was-a-stale-baseline-not-a-race.md`, this is expected to make the committed baselines of sections rendered below the new content stale, since inserting a section can perturb every section below it, not just the new one. This surfaced as the tag-triggered `v0.10.0` Release workflow's "Visual regression tests" step failing on the real `ubuntu-24.04` runner, before the npm publish step could run:
- `section-viewport-3d`: 1796 pixels / 0.03 ratio different from the committed baseline
- `section-shortcuts`: expected 1264x183, got 1264x182 — a 1px height shift

This repo's own sandbox Chromium cannot be used to regenerate a trustworthy baseline (its rendering is confirmed to differ from the real `ubuntu-24.04` GitHub Actions runner used for every committed baseline), so this needs the dedicated real-runner regeneration technique from decisions `015`/`017` rather than a local `npm run test:visual:update`.

## Acceptance Criteria
- [ ] `section-viewport-3d`'s and `section-shortcuts`' baseline screenshots reflect the current `dev-preview/main.js` (including `<wuik-dialog>`'s new demo section), captured on the real `ubuntu-24.04` GitHub Actions runner
- [ ] Any other section baseline that shifted as a byproduct (per decision 017's documented risk) is identified by running the full visual suite on that same runner, and regenerated too if it changed
- [ ] `npm run test:visual` passes against the freshly regenerated baseline(s) in CI (`release.yml`'s existing step), confirmed via a fresh real-runner job

## Notes
This is routine baseline maintenance triggered by backlog item 016's dev-preview changes, not a product bug — mirrors exactly the situation investigated in backlog item `018`/decision `017` after backlog item `014`, and already fixed once for the buttons section in backlog item `019` after backlog item `015`. Discovered because it broke the real tag-triggered `v0.10.0` Release workflow at the visual-regression step, before npm publish could run — the tag and GitHub release for `v0.10.0` already exist and must not be touched; re-publishing `v0.10.0` once `main` is green again is handled separately, outside this item's scope.
