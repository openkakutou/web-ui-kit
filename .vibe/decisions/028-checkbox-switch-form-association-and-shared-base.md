---
date: 2026-10-31
status: accepted
---
# Checkbox and switch: form-associated, native input inside, one shared base

**Context:** Backlog 030 adds `<wuik-checkbox>` and `<wuik-switch>`. Decision 007 deferred `ElementInternals`/`formAssociated` as speculative; item 030 now asks for form association, so these are the first form-associated components.
**Decision:** Both are `formAssociated` custom elements wrapping a native `<input type="checkbox">` in their shadow root (the switch sets `role="switch"` on it), sharing one base class for checked state, label (visible, or visually hidden with `hide-label`), disabled, `error`/invalid, form value/reset and the `wuik-change` event (`detail: { checked, indeterminate }`, fired for user toggles only). Indeterminate is checkbox-only and programmatic; a user click on an indeterminate checkbox resolves it to checked. The switch rejects `indeterminate` with a `console.warn`. No On/Off text on the switch. Focus ring is the outset ring of decision 007.
**Reason:** A native input keeps keyboard, accessibility tree and label semantics for free; one base avoids two diverging copies of the shared conventions of decisions 007 and 009. Form association is needed for real `<form>` use in the apps.
**Rejected alternatives:** A hand-rolled `div role=checkbox` (re-implements native behaviour); two independent components (drift); On/Off text inside the switch (width and translation cost, product owner chose position and colour only); clicking an indeterminate checkbox to unchecked (product owner chose checked, the usual "select all" behaviour).
