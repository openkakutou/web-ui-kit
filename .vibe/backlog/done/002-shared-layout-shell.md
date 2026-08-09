---
status: done
depends_on: [001]
---
# Shared Layout Shell (App Frame, Panels, Tabs, Toolbar)

## Description
A reusable app-frame Web Component (root layout, side panels, tab strip, toolbar) that every consuming viewer/editor adopts as its root structure instead of building its own.

## Acceptance Criteria
- [x] The shell renders with no consumer-supplied CSS beyond slotted content
- [x] Panels/tabs/toolbar are individually reusable, not only as a fixed bundle
- [x] Keyboard navigation between tabs works

## Notes
Depends on item 001 for tokens.
