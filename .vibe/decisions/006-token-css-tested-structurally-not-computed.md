---
date: 2026-08-09
status: accepted
---
# Shadow DOM styling is tested structurally, not via computed style

**Context:** Building the first Web Components (`wuik-panel`, and every component after it in backlog item `002`), each styling itself with a `<style>` element inside its own Shadow DOM, referencing `var(--wuik-*)` design tokens. The natural first instinct is to assert the *rendered* result in a test, e.g. `getComputedStyle(shadowInternalElement).display === "none"` or `.backgroundColor === "rgb(244, 244, 245)"`. Under Vitest + jsdom (this repo's test environment, `test.css: true`), this fails even for a correct implementation — verified with three minimal reproductions, isolating the cause:
1. A `<style>` element placed inside a Shadow DOM is not applied to computed styles at all by jsdom's `getComputedStyle` — confirmed with a plain, hardcoded (no `var()`) class-selector rule toggling `display: none`/`block`; the shadow-internal element always reports the host-language default instead.
2. Independently, `var()` substitution into computed shorthand/longhand properties (`backgroundColor`, `color`, `fontFamily`, …) does not happen even for a **light-DOM** element with no Shadow DOM involved at all.
3. A plain, hardcoded class-selector rule in **light DOM** *does* apply correctly (`getComputedStyle` reflects it) — confirming jsdom's CSS engine works for ordinary light-DOM cascades; the two failure modes above are specific to (1) Shadow DOM scoping and (2) `var()` resolution.

Reading a raw custom-property value via `getPropertyValue("--x")` on `document.documentElement` (as `src/tokens/index.test.ts` already does) is unaffected — that lookup never goes through the Shadow DOM or `var()` machinery.

**Decision:** Component unit tests never assert a computed style read from inside a Shadow DOM, and never assert a `var()`-derived computed value anywhere. Instead:
- Whether a shadow-internal element is meant to be shown/hidden is tested via the class/attribute the component's own code toggles (e.g. `classList.contains("has-content")`), not via `getComputedStyle(...).display` — this still exercises the component's real conditional logic, just not the CSS rule that consumes the resulting class.
- Whether a component uses the right design tokens for its visuals is tested by asserting the component's own shadow stylesheet **text** contains the expected `var(--wuik-*)` names and contains no literal hex color (`#rrggbb`/`#rgb`) anywhere.

Real rendered appearance — including that hiding/showing and light/dark theme switching actually show up on screen — is confirmed once per component by the Step 4b runtime smoke check in a real browser (`run` skill), not by the unit test suite.

**Reason:** The structural checks still catch the realistic bugs a wrong implementation would introduce (the toggle logic never fires, or fires on the wrong condition; the wrong token name is referenced; a value is hardcoded instead of tokenized) without requiring a real browser engine in the test run. They accept that they cannot catch "the CSS is syntactically fine but a browser would render it wrong" — that class of bug is out of jsdom's reach regardless of test phrasing, and is exactly what the mandatory runtime smoke step exists to catch instead.

**Rejected alternatives:**
- *Switch the test environment to a real browser (Playwright/`@vitest/browser`)* — rejected as disproportionate for this decision: it would fix this one gap at the cost of a slower, heavier suite for every test in the repo, and Step 4b's runtime smoke check already covers real-rendering verification once per component.
- *Assert only that the raw custom property resolves to a non-empty value on `:root`* — rejected: that only re-tests the tokens module (already covered by `src/tokens/index.test.ts`), not that *this* component actually wired that specific token, or that specific conditional class, into its own behavior.
