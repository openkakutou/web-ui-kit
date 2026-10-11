---
status: todo
---
# aria-describedby Through wuik-text-input

## Description
The control lives in the shadow root of `wuik-text-input`, so a consumer cannot link an external error or help element with `aria-describedby`.

## Acceptance Criteria
- [ ] The component accepts a described-by reference (slot, or an `error`/`hint` part wired internally) that screen readers announce with the field
- [ ] Documented with the invalid state example

## Notes
Reported by `character-editor` flow 003 (editor polish pass, 2026-10-11).
