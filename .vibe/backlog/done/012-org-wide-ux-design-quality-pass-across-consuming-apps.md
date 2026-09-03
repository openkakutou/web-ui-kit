---
status: done
---
# Org-Wide UX/Design Quality Pass Across Consuming Apps

## Description
The Product Owner's assessment of `lifebar-viewer-web`'s real UI (2026-08-31): "vraiment moche et inutilisable" (really ugly and unusable). This is a design-system-adoption problem, not (only) a `web-ui-kit` gap — `lifebar-viewer-web` already has real evidence, below, of falling back to bare native HTML controls in most of its interactive UI instead of this kit's own equivalents, even though it already imports `wuik-app-shell`/`wuik-toolbar`/`wuik-panel` for its coarse layout. The concern applies to the whole family of consuming apps (`character-viewer-web`, `character-editor`, `stage-viewer-web`, `stage-editor`, `lifebar-viewer-web`, `lifebar-editor`, `mode-quick-versus`), since they share this kit and likely share the same drift pattern to varying degrees.

## Acceptance Criteria
- [x] Each consuming app is audited (screenshot + component-usage grep, the same way this item's own evidence was gathered) for where it uses raw native elements (`<button>`, `<input type="radio">`, plain `<div>`s) in places this kit already offers a styled equivalent (`wuik-button`, `wuik-slider`, `wuik-file-drop-zone`, `wuik-color-picker`, …), and the findings are written down (this item's own notes, or one sub-item per app if the audit reveals enough work to warrant splitting)
- [x] Any interaction pattern a real screen needs but this kit doesn't yet offer a component for (found during the audit) is captured as its own new `web-ui-kit` backlog item, not silently worked around per-app
- [x] `lifebar-viewer-web` (already had concrete evidence, see Notes) is brought to full adoption for the two gaps this kit can already close today — its folder-input buttons and simulation sliders now use `<wuik-button>`/`<wuik-slider>` instead of bare native elements. Its candidate-selection radios stay native for now — see `.vibe/decisions/014`: this kit has no radio-group component yet, tracked as its own new item (`014`) rather than built as a side effect of this audit
- [x] A short before/after comparison (screenshots) demonstrates the visual difference on at least one real screen

## Notes
Concrete evidence (2026-08-31) from `lifebar-viewer-web`: its folder-picker screen renders as plain unstyled browser-default buttons and radio inputs with no spacing/visual hierarchy, despite this kit already shipping `wuik-button`, `wuik-slider`, and other form components (see `src/components/`) that would style these exact controls automatically via design tokens. Only the outer shell (`wuik-app-shell`, `wuik-toolbar`) and the elements list (`wuik-panel`) are wired up — the folder-input view, the multi-candidate picker, and (per backlog item 005 there) the simulation sliders are all built from raw `document.createElement("button"/"input")` instead.

This item is deliberately scoped as an **audit + first-app fix**, not a blanket "redesign everything" — the goal is to establish whether this is really a per-app adoption gap (most likely, given the evidence) versus an actual missing-capability gap in the kit itself, and to fix the clearest example first before deciding whether the remaining apps need their own dedicated items.

### Audit findings (2026-09-03)

Both — confirmed by grepping every consuming app's `src/` for raw `document.createElement("button")` and `type = "radio"` where this kit already ships an equivalent:

- **A real, recurring per-app adoption gap**, not isolated to `lifebar-viewer-web`: raw `<button>` elements remain in `character-viewer-web` (`viewer/animation-player.ts`, `viewer/sprite-browser.ts`), `character-editor` (`animations/animation-editor.ts`, `palettes/palette-editor.ts`, `editors/state-editor.ts`, `sprites/sprite-browser.ts`), `stage-viewer-web`/`stage-editor` (`viewer/background-preview.ts`, `input/stage-file-input-view.ts`, `editor/elements-editor.ts`), and `lifebar-editor` (`editor/elements-editor.ts`, `viewer/sprite-browser.ts`). `mode-quick-versus` has none left — already fully adopted.
- **Two genuine missing-capability gaps in this kit itself**, which is part of *why* some of that raw usage exists even in apps that otherwise adopt `<wuik-button>` extensively:
  - No radio-group component — `lifebar-viewer-web`, `stage-viewer-web`, and `stage-editor` all build their folder-input candidate picker's `role="radiogroup"` from raw `<input type="radio">`. Filed as `014`.
  - No pressed/selected state on `<wuik-button>` — `lifebar-viewer-web`'s elements panel and both `character-viewer-web`'s/`character-editor`'s sprite browser toggle keep a raw `<button>` with `aria-pressed` + a custom CSS class specifically because `<wuik-button>` has no attribute-driven hook for that state. Filed as `015`.

Per `.vibe/decisions/014`, this item's own fix stays scoped to `lifebar-viewer-web` for the two gaps this kit could already close (buttons, sliders) — the other five apps' adoption work, and the radio/candidate-picker migration once `014` lands, are follow-up work to file once `014`/`015` exist, not bundled into this item.
