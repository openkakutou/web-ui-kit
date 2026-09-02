---
status: todo
---
# Visual Regression: Shared Playwright Config and Component Snapshots

## Description
Provide the shared Playwright screenshot-comparison setup every consuming app (`character-viewer-web`, `character-editor`, `stage-viewer-web`, `stage-editor`, `lifebar-viewer-web`, `lifebar-editor`, `mode-quick-versus`'s web build) will build its own visual test suite on top of — a fixed viewport, animations/transitions forced off, a font-loaded wait, and a default diff threshold — plus this repo's own first suite of component-level screenshots, using the existing `dev-preview/` page (already the manual eyeballing target for real rendered appearance, see `docs/testing.md`) as the real target instead of building a separate harness. See roadmap decision `024-visual-regression-testing-via-playwright-screenshots.md` for the shared approach and rationale.

## Acceptance Criteria
- [ ] A shared, exported Playwright config/fixture (consistent viewport, animations disabled, fonts-loaded wait, default diff threshold) that a consuming app's own Playwright config can extend with a few lines, mirroring how the i18n integration layer is consumed today
- [ ] `dev-preview/`'s components (buttons, panels, canvas/viewport controls, `<wuik-viewport-3d>`, the shortcuts panel, the locale switcher) each get a committed baseline screenshot, generated against Linux/Chromium
- [ ] `npm run test:visual` runs these against the built package in CI as its own job, separate from `npm test`, and fails the build on a diff
- [ ] A real, deliberate visual change to a shared token/component (verified by temporarily changing one and observing the test fail, then reverting) is caught by this suite
- [ ] `docs/testing.md` documents the new suite, folding in the existing "real rendered appearance... confirmed once per component by a runtime smoke check" paragraph rather than leaving it describing an ad hoc, uncommitted practice

## Notes
This is the foundational item every consuming app's own visual-regression backlog item depends on (same shape as `011-i18n-core-primitive-and-locale-switcher`) — land this first.
