---
status: done
---
# Audit the select component against real app usage

## Description
<wuik-select> exists but the apps still use bare native <select>. Audit it against the usages found in the six viewer/editor apps: missing features (placeholder, grouped options, long lists), accessibility baseline, invalid and disabled states, visual-regression coverage, and fix the gaps so apps can adopt it.

## Acceptance Criteria
- [x] Every native <select> usage in the apps is listed with the kit gap, if any, that prevented adopting <wuik-select>
- [x] Gaps fixed or split into their own items
- [x] Visual snapshots cover default, disabled, invalid and long-list states (baseline generation split into item 036)

## Audit (2026-11-09)
| App | Usage | Kit gap |
|---|---|---|
| character-viewer-web | animation player animation picker (no visible label, `aria-label`) | no accessible name without `label` — fixed: `aria-label` forwarded |
| stage-editor | BG element type select | none |
| stage-editor | BG element layer select | none |
| stage-editor | sprite picker (disabled "Loading…" option, empty-value placeholder, long list) | long option text could overflow — fixed: width capped |
| stage-editor | batch sprite picker (sentinel placeholder, hundreds of options) | none beyond the overflow fix |
| lifebar-editor | sprite picker (empty-value "— none —" placeholder, long list) | none beyond the overflow fix |

Prototypes under `character-editor/.ux/prototypes/` are throwaway HTML, not app code. Already covered by the kit: placeholder as an empty-value light-DOM option, `<optgroup>`, disabled, invalid (`error`), required; a bound value matching no option leaves the value empty (`selectedIndex` -1), same as native, so apps keep an explicit placeholder option.
