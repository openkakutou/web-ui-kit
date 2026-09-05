---
status: todo
---
# Investigate Flaky Buttons Visual Baseline

## Description
The committed visual-regression baseline for the buttons demo section (`section-buttons`) does not reproduce consistently even when regenerated on the real `ubuntu-24.04` CI runner via the established `workflow_dispatch` technique (`.vibe/decisions/015`). A run on 2026-09-05 produced a screenshot where the empty `<wuik-button>`'s dashed invalid-state border is missing, while the currently committed baseline (generated the same way, a day earlier) shows that border present. Likely a rendering/paint-timing race specific to that button's empty-state indicator rather than a real product regression, but unconfirmed. Discovered incidentally while adding `<wuik-radio-group>`'s own baseline (backlog item 014); left untouched there since it is unrelated and pre-existing.

## Acceptance Criteria
- [ ] The flakiness is reproduced reliably (e.g. by running the real-runner regeneration workflow a few times in a row) or shown not to reproduce, with the evidence recorded
- [ ] A root cause is identified (e.g. a CSS transition/paint-timing race in `<wuik-button>`'s empty-state indicator, versus a `waitForVisualReady`/test-setup timing gap)
- [ ] The `section-buttons` baseline test passes consistently across repeated real-runner regenerations, or the accepted nondeterminism is documented as a decision if it cannot be fully eliminated

## Notes
Not a regression introduced by backlog item 014 — the buttons section's own code was not touched by that work. Reproduce via the same throwaway `workflow_dispatch` workflow pattern used in `.vibe/decisions/015` (add it back temporarily, trigger a few runs, compare artifacts) rather than trusting a local sandbox run, which is already known not to match the real runner closely enough for this suite.
