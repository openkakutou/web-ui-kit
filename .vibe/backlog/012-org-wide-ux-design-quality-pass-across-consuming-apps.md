---
status: todo
---
# Org-Wide UX/Design Quality Pass Across Consuming Apps

## Description
The Product Owner's assessment of `lifebar-viewer-web`'s real UI (2026-08-31): "vraiment moche et inutilisable" (really ugly and unusable). This is a design-system-adoption problem, not (only) a `web-ui-kit` gap — `lifebar-viewer-web` already has real evidence, below, of falling back to bare native HTML controls in most of its interactive UI instead of this kit's own equivalents, even though it already imports `wuik-app-shell`/`wuik-toolbar`/`wuik-panel` for its coarse layout. The concern applies to the whole family of consuming apps (`character-viewer-web`, `character-editor`, `stage-viewer-web`, `stage-editor`, `lifebar-viewer-web`, `lifebar-editor`, `mode-quick-versus`), since they share this kit and likely share the same drift pattern to varying degrees.

## Acceptance Criteria
- [ ] Each consuming app is audited (screenshot + component-usage grep, the same way this item's own evidence was gathered) for where it uses raw native elements (`<button>`, `<input type="radio">`, plain `<div>`s) in places this kit already offers a styled equivalent (`wuik-button`, `wuik-slider`, `wuik-file-drop-zone`, `wuik-color-picker`, …), and the findings are written down (this item's own notes, or one sub-item per app if the audit reveals enough work to warrant splitting)
- [ ] Any interaction pattern a real screen needs but this kit doesn't yet offer a component for (found during the audit) is captured as its own new `web-ui-kit` backlog item, not silently worked around per-app
- [ ] At least `lifebar-viewer-web` (already has concrete evidence, see Notes) is brought to full adoption — its folder-input controls, candidate-selection radios, and simulation sliders use this kit's own form components instead of bare native elements — as the first proof that "full adoption" actually reads as polished, not just technically compliant
- [ ] A short before/after comparison (screenshots) demonstrates the visual difference on at least one real screen

## Notes
Concrete evidence (2026-08-31) from `lifebar-viewer-web`: its folder-picker screen renders as plain unstyled browser-default buttons and radio inputs with no spacing/visual hierarchy, despite this kit already shipping `wuik-button`, `wuik-slider`, and other form components (see `src/components/`) that would style these exact controls automatically via design tokens. Only the outer shell (`wuik-app-shell`, `wuik-toolbar`) and the elements list (`wuik-panel`) are wired up — the folder-input view, the multi-candidate picker, and (per backlog item 005 there) the simulation sliders are all built from raw `document.createElement("button"/"input")` instead.

This item is deliberately scoped as an **audit + first-app fix**, not a blanket "redesign everything" — the goal is to establish whether this is really a per-app adoption gap (most likely, given the evidence) versus an actual missing-capability gap in the kit itself, and to fix the clearest example first before deciding whether the remaining apps need their own dedicated items.
