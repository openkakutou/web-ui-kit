---
status: todo
---
# Numeric Input Component

## Description
`wuik-text-input` is text-only. `character-editor` renders numbers (durations, offsets, box sizes) with it and validates by hand, losing spinner semantics and mobile numeric keyboards.

## Acceptance Criteria
- [ ] A numeric input (or a `type=number` mode on `wuik-text-input`) with min, max, step and an invalid state
- [ ] Exposes `inputmode`, a correct role and keyboard stepping with arrow keys

## Notes
Reported by `character-editor` flow 003 (editor polish pass, 2026-10-11).
