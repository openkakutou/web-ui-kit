---
date: 2026-08-17
status: accepted
---
# Shortcut conflicts resolve by swap, the panel takes its manager as a JS property
**Context:** The remappable keyboard shortcut manager (backlog item 010) must let a user rebind an action's key without silently overwriting another action already using that key, and without leaving the user stuck once a conflict is found (per UI/UX plan consultation on this item).
**Decision:** A conflicting rebind attempt offers a "swap" resolution — the two actions trade key bindings — instead of only "cancel". The `<wuik-shortcuts-panel>` component receives its `ShortcutManager` instance through a JS property (`panel.manager = ...`), not an HTML attribute, since a class instance cannot be serialized into one; this mirrors how the panel has no other way to reach a specific manager instance. The panel is a plain in-page component, not a modal `<dialog>` — no modal/dialog primitive exists yet in this kit, and the acceptance criteria do not require modality.
**Reason:** A cancel-only conflict response reproduces the exact "no way to adapt bindings" complaint that motivated this feature (per the Fighter Factory Ultimate reference in the backlog item). A swap keeps both actions bound to distinct, user-chosen keys with zero information loss.
**Rejected alternatives:** Forcing the user to first unbind the other action in a separate step was rejected — it is the same outcome as swap but with more clicks and a moment where an action has no binding at all. Passing the manager via an attribute (e.g. a lookup key into a global registry) was rejected as needless indirection for a same-page JS API.
