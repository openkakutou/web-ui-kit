---
status: done
---
# Radio Group Component

## Description
Add a `<wuik-radio-group>` Web Component wrapping a set of native radio inputs, styled with this kit's own tokens and following the same shared conventions as `<wuik-slider>`/`<wuik-color-picker>` (`.vibe/decisions/007`). Found missing during the org-wide UX/design-quality audit (backlog item `012`): every consuming app that needs a single-choice list from several candidates (e.g. `lifebar-viewer-web`, `stage-viewer-web`, `stage-editor`'s folder-input candidate picker, where more than one matching file is found in a selected folder) currently falls back to bare native `<input type="radio">` elements with no design-token styling, because this kit has no equivalent component to offer.

## Acceptance Criteria
- [ ] A `<wuik-radio-group>` component renders a labelled set of options (value + display label) and exposes the currently selected value
- [ ] Exactly one option can be selected at a time; selecting a new option deselects the previous one, matching native radio-group semantics
- [ ] Fully keyboard-operable (arrow keys move selection between options, matching native radio-group behavior) and each option gets a visible focus indicator
- [ ] Fires a change event with the newly selected value, mirroring `wuik-slider`'s `wuik-change` naming convention
- [ ] Styled entirely via `--wuik-*` tokens, following the active light/dark theme automatically like every other component

## Notes
Concrete evidence (audit, backlog item `012`): `lifebar-viewer-web`'s candidate-file picker (`src/input/lifebar-folder-input-view.ts`) and the equivalent picker in both `stage-viewer-web` and `stage-editor` (`src/input/stage-file-input-view.ts` in each) all build a `role="radiogroup"` from raw `document.createElement("input")` with `type = "radio"`, styled with no kit tokens at all. Once this component lands, those three call sites are the natural first adopters — tracked as a per-app follow-up once this item is done, not bundled into it.
