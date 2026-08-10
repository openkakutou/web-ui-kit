---
status: done
---
# 3D Viewport Controls (Orbit/Pan/Zoom Camera, Reusable For 3D Previews)

## Description
Reusable 3D camera controls for previewing/editing a model-based 3D scene — first needed by `stage-viewer-web` and `stage-editor` for Ikemen GO 3D model-based stages (see the roadmap's `.vibe/decisions/014`), consumed by both from day one the same way the existing 2D canvas/viewport control (item `004`) already is. The underlying 3D rendering approach/library (three.js, raw WebGL, etc.) is left to be chosen during implementation.

## Acceptance Criteria
- [ ] Works with any 3D-rendering consumer via a documented integration contract, mirroring item `004`'s contract shape for 2D
- [ ] Supports orbit (drag to rotate around a target), mouse wheel zoom, pan, and a reset-to-fit/reset-to-default-view action
- [ ] Usable via keyboard alone (accessibility), matching item `004`'s and item `005`'s existing accessibility bar
- [ ] Degrades to a clear, non-broken state when the host environment lacks WebGL support, rather than failing silently

## Notes
Companion to item `004` (2D canvas/viewport controls) — kept as a separate component rather than folded into it, since the interaction model (orbit + 3D camera) and rendering backend are genuinely different from 2D pan/zoom.
