---
status: todo
---
# Remappable Keyboard Shortcut Manager

## Description
Add a shared keyboard-shortcut manager to the design system: apps register named actions with default key bindings, and end users can rebind them through a shared shortcuts configuration UI, with bindings persisted locally (e.g. localStorage) per app. Motivated by a recurring Fighter Factory Ultimate complaint — users could not remap shortcuts (e.g. Ctrl+S for saving a sprite) and had no way to adapt bindings to their own habits or avoid OS/browser key conflicts.

## Acceptance Criteria
- [ ] An app can register a named action with a default key binding
- [ ] A shared shortcuts panel/dialog component lists all registered actions and lets the user rebind each one
- [ ] Rebound bindings persist across page reloads for that app
- [ ] Attempting to bind a key already assigned to another action surfaces a conflict instead of silently overwriting it

## Notes
None.
