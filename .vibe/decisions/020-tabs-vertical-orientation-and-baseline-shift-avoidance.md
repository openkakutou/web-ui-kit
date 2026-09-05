---
date: 2026-09-05
status: accepted
---
# `<wuik-tabs>` vertical orientation: attribute design and dev-preview placement

**Context:** Backlog item `017` adds an `orientation="vertical"` mode to `<wuik-tabs>` for a left-hand sidebar tab list, per the ARIA APG (Up/Down roving tabindex instead of Left/Right). Two prior features (`015`, `016`) each grew `dev-preview/main.js` and, as a side effect documented in `.vibe/decisions/017-flaky-buttons-baseline-was-a-stale-baseline-not-a-race.md`, silently shifted the scroll offset (and therefore the committed visual-regression baseline) of an unrelated section further down the page.

**Decision:**
- `orientation` is a plain enum attribute (`"horizontal"` default, `"vertical"`); any other value falls back to horizontal both visually (CSS keys off the literal attribute value) and behaviorally (the keydown handler reads the same value), so the two can never disagree.
- The keyboard model is a full swap, not an addition: in vertical orientation ArrowUp/ArrowDown move and select, ArrowLeft/ArrowRight are fully inert; in horizontal orientation (default) it stays exactly as today. Home/End remain orientation-independent in both, matching the ARIA APG.
- `aria-orientation="vertical"` is set on the internal `role="tablist"` element only when vertical, and removed (not written as `"false"`) otherwise — mirroring the existing asymmetric-forwarding pattern for `<wuik-button>`'s `aria-pressed` (`.vibe/decisions/018`), since the ARIA default for `tablist` is already `"horizontal"`.
- The selection indicator keeps the existing "always reserve the border, only change its color" technique (`border-right: 2px solid transparent`, colored on selection) so switching orientation never introduces a layout jiggle from the border appearing/disappearing.
- The new dev-preview demo section for vertical orientation is appended as the **very last** section on the page (after "Locale switcher"), not inserted next to the existing horizontal tabs demo. A Playwright element screenshot only depends on that element's own position/size, never on content added *after* it in the page — appending at the true end is therefore structurally guaranteed not to change any existing section's scroll offset or baseline, closing off the exact failure mode `.vibe/decisions/017` documents, instead of relying on discipline or a follow-up regeneration pass. The corresponding `section-tabs-vertical` case is appended last in `tests/visual/dev-preview.visual.spec.ts`'s `SECTIONS` array to match.
- The new section's own baseline is generated locally as a first draft (this sandbox has Playwright's Chromium installed) and committed, but per `.vibe/decisions/015` it is treated as provisional — only the real `ubuntu-24.04` GitHub Actions runner is trusted to confirm it; this is flagged in the feature report for the release pipeline.

**Reason:** A full keyboard-model swap (rather than merging both arrow-key pairs into "next/previous" like `<wuik-radio-group>` does) is what the ARIA APG specifies for a tabs widget's orientation and what the acceptance criteria states explicitly. Appending the new demo section at the true end of the page is a structural fix, not a process reminder — it removes the possibility of the `017` failure mode recurring for this feature by construction.

**Rejected alternatives:**
- *Merge ArrowUp/Down and ArrowLeft/Right into one "next/previous" pair active in both orientations* (the `<wuik-radio-group>` approach) — rejected: the acceptance criteria explicitly requires Left/Right to do nothing in vertical orientation, which a merged pair would violate.
- *Insert the vertical demo next to the existing horizontal "Tabs" section* — rejected: every section below it in `dev-preview/main.js` would need its scroll-dependent baseline re-verified (and likely regenerated) as a byproduct, exactly the failure `.vibe/decisions/017` traces back to item `014`. Appending at the end avoids the byproduct entirely.
- *Skip a dev-preview demo section for this feature* — rejected: the component's other orientation-affecting behavior (layout, indicator, keyboard) has no other real-browser runtime check available, and every other layout-shell component has one.
