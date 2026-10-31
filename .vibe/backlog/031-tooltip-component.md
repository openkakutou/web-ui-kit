---
status: todo
---
# Tooltip component

## Description
character-viewer-web added beginner-mode tooltips (item 022) with its own implementation. Provide a shared <wuik-tooltip> (hover, focus, long-press, Escape to dismiss, no content clipping) so every app gets consistent help text.

## Acceptance Criteria
- [ ] Tooltip appears on hover and keyboard focus, dismisses on Escape and blur
- [ ] Referenced via aria-describedby, never the only carrier of essential info
- [ ] Positions flip to stay in the viewport
- [ ] character-viewer-web's custom tooltips can migrate to it
