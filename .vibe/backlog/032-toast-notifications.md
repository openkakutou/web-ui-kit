---
status: todo
---
# Toast / notification component

## Description
Apps need non-blocking feedback (saved, export done, load failed) instead of ad-hoc banners. Add a toast region with queueing, auto-dismiss, polite/assertive live regions and an action slot.

## Acceptance Criteria
- [ ] Toast API (show/dismiss) with severity variants
- [ ] Announced via aria-live; pauses auto-dismiss on hover/focus
- [ ] Respects prefers-reduced-motion
- [ ] Tests and visual snapshot
