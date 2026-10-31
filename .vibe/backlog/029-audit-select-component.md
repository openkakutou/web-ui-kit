---
status: todo
---
# Audit the select component against real app usage

## Description
<wuik-select> exists but the apps still use bare native <select>. Audit it against the usages found in the six viewer/editor apps: missing features (placeholder, grouped options, long lists), accessibility baseline, invalid and disabled states, visual-regression coverage, and fix the gaps so apps can adopt it.

## Acceptance Criteria
- [ ] Every native <select> usage in the apps is listed with the kit gap, if any, that prevented adopting <wuik-select>|Gaps fixed or split into their own items|Visual snapshots cover default, disabled, invalid and long-list states
- [ ] 
- [ ] 
