---
status: done
---
# Generic Text Input Component

## Description
`web-ui-kit` has no generic text-input/form-field Web Component yet. `character-editor`'s characteristics editor (its own item 003) styles plain native `<input>` elements with `web-ui-kit` tokens directly, as a documented stopgap (`character-editor/.vibe/decisions/003`), and `character-viewer-web` has an equivalent precedent for a different control (`<wuik-viewport>`, its own item 016). `character-editor`'s own backlog item `013` is explicitly blocked waiting for this component to exist before it can migrate off the stopgap.

## Acceptance Criteria
- [ ] `web-ui-kit` publishes a text-input/form-field Web Component, styled with the shared tokens, supporting a label, placeholder, and required state
- [ ] The component has a built-in invalid/error state (inline error message, `aria-invalid`, and a non-verbal danger-colored cue — not color alone) matching the accessibility baseline every other `web-ui-kit` component already follows
- [ ] The component is fully keyboard-operable and exposes correct name/role to assistive tech
- [ ] Documented with at least one usage example showing the required and invalid states

## Notes
Cross-repo: unblocks `character-editor` backlog item `013` (Migrate Text Inputs To web-ui-kit Component) — flip that item back to `todo` once this ships. `stage-editor` and `lifebar-editor` weren't found to have the same documented stopgap as of this writing, so no matching migration item was created for them; check whether they'd benefit once this component exists.
