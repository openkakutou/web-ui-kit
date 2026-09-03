---
status: todo
---
# Dialog/Popup Component

## Description
Add a modal dialog/popup Web Component (`<wuik-dialog>` or similar), built on the native `<dialog>` element's `showModal()` semantics rather than a hand-rolled positioned `<div>`, so consumers get a real focus trap, `::backdrop`, and Esc-to-close for free. No dialog/modal/popup primitive exists anywhere in this kit today — every consuming app currently has no shared way to build a preferences panel, a confirmation, or any overlay surface without reimplementing one from scratch. First concrete need: `character-viewer-web`'s workspace redesign (`.ux/flows/001-character-inspection-workspace.md`, `.ux/decisions/001-workspace-navigation-model.md`) wants a "Load a different character" popup and a "Preferences" popup, both needing the same contract.

## Acceptance Criteria
- [ ] `<wuik-dialog>` opens via `showModal()` (or an equivalent method/attribute toggle) and renders over the page with a dimmed, inert backdrop — the rest of the page becomes unclickable and unreachable by Tab while open
- [ ] Focus moves to the first focusable element inside on open, is trapped within the dialog while open (Tab/Shift+Tab never escapes it), and returns to whatever element triggered the open on close
- [ ] Esc closes the dialog; an explicit close control and backdrop click also close it
- [ ] Carries `role="dialog"`, `aria-modal="true"`, and is labelled via `aria-labelledby` pointing at a slotted heading — matching the accessibility contract already required of every other interactive component in this kit
- [ ] Styled entirely with `--wuik-*` tokens (no literal color/spacing), correct in both light and dark themes

## Notes
Source: `character-viewer-web`'s `/ux:design` pass for its workspace redesign (see that repo's `.ux/decisions/001-workspace-navigation-model.md` for the two consuming screens — `load-character-popup` and `preferences-popup` — and why a popup was chosen over inline navigation). Likely to be reused by other viewer/editor apps sharing this kit once it exists (same org-wide UX debt as backlog item `012`). This item is design-only sourced — implementation, including whether to lean on `<dialog>`'s native `::backdrop` styling vs. a custom overlay layer, is open for whoever picks it up.
