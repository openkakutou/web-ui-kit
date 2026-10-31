---
status: done
---
# Checkbox and toggle switch components

## Description
Boolean options (show hitboxes, loop, mute) are currently bare native inputs in the apps. Add <wuik-checkbox> and <wuik-switch> with proper roles, focus ring, indeterminate state for the checkbox, and form-association.

## Acceptance Criteria
- [x] Both components are keyboard operable with correct role/aria-checked
- [x] Checkbox supports indeterminate; disabled and invalid states styled with tokens
- [x] Visual snapshots and tests added

## Notes
The visual snapshot section (`section-toggles`) is in the visual spec and the dev preview, but its baseline image must be generated on the real CI runner (decision 015): tracked as item 035.
