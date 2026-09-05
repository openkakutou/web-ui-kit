---
status: done
---
# Investigate Flaky Buttons Visual Baseline

## Description
The committed visual-regression baseline for the buttons demo section (`section-buttons`) does not reproduce consistently even when regenerated on the real `ubuntu-24.04` CI runner via the established `workflow_dispatch` technique (`.vibe/decisions/015`). A run on 2026-09-05 produced a screenshot where the empty `<wuik-button>`'s dashed invalid-state border is missing, while the currently committed baseline (generated the same way, a day earlier) shows that border present. Likely a rendering/paint-timing race specific to that button's empty-state indicator rather than a real product regression, but unconfirmed. Discovered incidentally while adding `<wuik-radio-group>`'s own baseline (backlog item 014); left untouched there since it is unrelated and pre-existing.

## Acceptance Criteria
- [x] The flakiness is reproduced reliably (e.g. by running the real-runner regeneration workflow a few times in a row) or shown not to reproduce, with the evidence recorded
- [x] A root cause is identified (e.g. a CSS transition/paint-timing race in `<wuik-button>`'s empty-state indicator, versus a `waitForVisualReady`/test-setup timing gap)
- [x] The `section-buttons` baseline test passes consistently across repeated real-runner regenerations, or the accepted nondeterminism is documented as a decision if it cannot be fully eliminated

## Notes
Not a regression introduced by backlog item 014 — the buttons section's own code was not touched by that work. Reproduce via the same throwaway `workflow_dispatch` workflow pattern used in `.vibe/decisions/015` (add it back temporarily, trigger a few runs, compare artifacts) rather than trusting a local sandbox run, which is already known not to match the real runner closely enough for this suite.

## Resolution (2026-09-05)
Not a rendering race. A throwaway real-runner investigation (36 captures across 8 independent fresh CI jobs) found the current page renders `section-buttons` byte-identically every single time — zero nondeterminism. Replaying the buttons section against the `dev-preview/main.js` from just before item 014 reproduced the committed baseline exactly, byte for byte.

Root cause: item 014 inserted a new "Radio groups" section *above* "Buttons" in `dev-preview/main.js`. The buttons section sits below the fold at the fixed test viewport, so Playwright scrolls it into view before screenshotting it; the new content above changed that scroll offset's fractional (sub-pixel) part, which changes how the browser rasterizes the empty button's 1px dashed border — small enough to sit under the suite's 2% diff threshold (so the `v0.8.0` release gate never flagged it), but visible when two raw baselines are compared side by side. `<wuik-button>` itself was never at fault, and no visual-regression harness code changed.

Fix: the `section-buttons` baseline was regenerated against the current page and recommitted; the full visual suite was then confirmed passing cleanly (zero diff) across 3 separate fresh real-runner CI jobs. Full findings and the reusable lesson (inserting a `dev-preview` section can perturb every section below it, not just the new one) are recorded in `.vibe/decisions/017-flaky-buttons-baseline-was-a-stale-baseline-not-a-race.md`.
