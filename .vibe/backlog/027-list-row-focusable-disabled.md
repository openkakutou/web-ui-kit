---
status: todo
---
# Focusable Disabled State For wuik-list-row

## Description
`wuik-list-row` has no state that stays focusable while unavailable (`aria-disabled`). Consumers cannot explain why a row is unavailable to keyboard users.

## Acceptance Criteria
- [ ] A `aria-disabled` style that keeps focus and ignores activation
- [ ] Visual cue that is not colour alone

## Notes
Reported by `character-editor` flow 003 (editor polish pass, 2026-10-11).
