---
date: 2026-08-09
status: accepted
---
# Design tokens use a single explicit `data-theme` attribute for light/dark, not a dual attribute+media-query mechanism

**Context:** Implementing backlog item 001 (design tokens). The acceptance criteria mention `data-theme` attribute or `prefers-color-scheme` as example mechanisms ("e.g."), not a mandate for both.

**Decision:** Light/dark switching uses only an explicit `data-theme="light"|"dark"` attribute (placed on `:root` or any ancestor element). Absence of the attribute defaults to light. No `prefers-color-scheme` media query is wired into the token CSS.

**Reason:** A dual mechanism (attribute + system media query, with explicit-attribute-wins precedence) is the more "complete" UX on paper, but jsdom (the project's test environment) does not evaluate `prefers-color-scheme` meaningfully, so that path could never be exercised by an automated test — only documented and trusted. It is also a documented, real-world source of drift bugs: two independently maintained rule sets that must stay in sync, with precedence rules that are easy to get wrong silently. A single, fully testable mechanism keeps the contract simple and verifiable now; system-preference support can be added later as a documented enhancement once there's a consuming app driving the requirement.

**Rejected alternatives:**
- Dual mechanism (`data-theme` attribute overriding `prefers-color-scheme` media query as a default): more "automatic" for users who haven't set a preference, but introduces an untestable code path under jsdom and a documented cascade-ordering risk between the two rule sets.
- `prefers-color-scheme` only, no attribute: removes the ability for a consuming app to offer an explicit theme toggle independent of the OS setting, which every consumer here (viewer/editor apps) is expected to want.
