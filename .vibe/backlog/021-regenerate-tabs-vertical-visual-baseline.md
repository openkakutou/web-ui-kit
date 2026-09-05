---
status: in_progress
depends_on: [017]
---
# Regenerate `section-tabs-vertical` Visual Baseline

## Description
Backlog item 017 added a new `orientation="vertical"` demo section (`section-tabs-vertical`) to `dev-preview/main.js`, appended last per `.vibe/decisions/020-tabs-vertical-orientation-and-baseline-shift-avoidance.md` specifically to avoid perturbing any other section's baseline. Per that same decision, its own baseline was only generated locally in this sandbox as a provisional first draft, since this repo's own sandbox Chromium is confirmed to differ from the real `ubuntu-24.04` GitHub Actions runner used for every other committed baseline (`.vibe/decisions/015`). This surfaced as the tag-triggered `v0.11.0` Release workflow's "Visual regression tests" step failing on the real `ubuntu-24.04` runner, before the npm publish step could run:
- `section-tabs-vertical`: expected 200x167 (the committed provisional baseline), got 200x152 — 1597 pixels / 0.05 ratio different

This is the well-known local-vs-real-runner font rendering divergence, not a real product regression — every other baseline passed, and item 017 appended its new section at the true end of the page specifically to rule out any byproduct shift elsewhere.

This repo's own sandbox Chromium cannot be used to regenerate a trustworthy baseline, so this needs the dedicated real-runner regeneration technique from decisions `015`/`017` rather than a local `npm run test:visual:update`.

## Acceptance Criteria
- [ ] `section-tabs-vertical`'s baseline screenshot reflects the current `dev-preview/main.js`, captured on the real `ubuntu-24.04` GitHub Actions runner
- [ ] Any other section baseline that shifted as a byproduct (per decision 017's documented risk) is identified by running the full visual suite on that same runner, and regenerated too if it changed
- [ ] `npm run test:visual` passes against the freshly regenerated baseline(s) in CI (`release.yml`'s existing step), confirmed via a fresh real-runner job

## Notes
This is routine baseline maintenance triggered by backlog item 017's dev-preview changes, not a product bug — mirrors exactly the situation investigated in backlog item `018`/decision `017` after backlog item `014`, and already fixed for the same reason in backlog items `019` (after `015`) and `020` (after `016`). Discovered because it broke the real tag-triggered `v0.11.0` Release workflow at the visual-regression step, before npm publish could run — the tag `v0.11.0` already exists and must not be touched; re-publishing `v0.11.0` once `main` is green again is handled separately, outside this item's scope.
