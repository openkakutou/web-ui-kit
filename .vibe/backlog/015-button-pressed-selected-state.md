---
status: todo
---
# Button Pressed/Selected State

## Description
Add a way to show `<wuik-button>` in a visually "pressed"/"selected" state, driven by an attribute (mirroring how `variant`/`disabled` already work) rather than requiring the consumer to reach into the component's shadow styling. Found missing during the org-wide UX/design-quality audit (backlog item `012`): apps with a toggle-style or selectable-list-item button (e.g. `lifebar-viewer-web`'s elements panel, `character-viewer-web`/`character-editor`'s sprite browser expand/collapse toggle) currently keep a raw native `<button>` styled with their own CSS classes (`is-selected`, `is-active`) specifically because `<wuik-button>` has no attribute-driven hook for this state today — its only configurable states are `variant`, `disabled`, and `type`.

## Acceptance Criteria
- [ ] `<wuik-button>` accepts a boolean attribute (e.g. `pressed`) that applies a visually distinct, token-driven "pressed" style on top of its existing `variant`
- [ ] The pressed state also sets `aria-pressed` on the underlying native button automatically, so a consumer no longer needs to set it by hand
- [ ] Toggling the attribute updates the rendered state immediately (`attributeChangedCallback`, same pattern as `variant`/`disabled`)
- [ ] The pressed style is visibly distinct in both light and dark themes and meets the same contrast bar already verified for the rest of the component (`.vibe/decisions/009`)

## Notes
Concrete evidence (audit, backlog item `012`): `lifebar-viewer-web`'s `src/elements/elements-panel.ts` (element list selection), `character-viewer-web`'s `src/viewer/sprite-browser.ts` and `character-editor`'s `src/sprites/sprite-browser.ts` (group expand/collapse toggle) all build a raw `<button>` with `aria-pressed` + a custom CSS class instead of `<wuik-button>`, each re-implementing the same pressed-state styling independently. Once this lands, those are the natural first adopters — tracked as a per-app follow-up once this item is done, not bundled into it.
