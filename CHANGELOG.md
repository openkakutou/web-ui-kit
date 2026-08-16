# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A reusable undo/redo history primitive that any editor app can plug its own actions into: register an action's do/undo pair, then undo or redo it, including a long chain of consecutive actions in the right order. Rapid repeated edits of the same kind (like dragging a value) merge into a single undo step instead of one per intermediate change, and the history size is capped so it can't grow without bound during a long editing session.

## [0.5.0] - 2026-08-16

### Added

- A reusable 3D orbit/pan/zoom camera control (`<wuik-viewport-3d>`) for wrapping any 3D-rendering preview — first built for previewing Ikemen GO 3D model-based stages: drag to orbit around the model, Shift-drag or right-drag to pan, mouse wheel to zoom toward the model, and a built-in "Reset view" button, all fully usable from the keyboard alone (arrow keys to orbit, Shift+arrow keys to pan, plus/minus to zoom, `0`/`Home` to reset). A visible one-time hint explains the controls, and the camera can never flip upside-down while orbiting. Shows a clear "3D preview unavailable" message instead of a broken view when the browser doesn't support WebGL. Works with any wrapped content — the control never touches its pixels — and never hijacks the page's own scroll: wheel-zoom only engages once the viewport has been focused.
- A reusable zoom/pan viewport control (`<wuik-viewport>`) for wrapping any canvas-based preview (sprite viewers, stage backgrounds, animation playback): mouse wheel zoom centered on the cursor, drag-to-pan, and a reset-to-fit action, all fully usable from the keyboard alone (arrow keys to pan, plus/minus to zoom, `0`/`Home` to reset), with a screen-reader announcement of zoom-level changes. Works with any wrapped content — the control never touches its pixels — and never hijacks the page's own scroll: wheel-zoom only engages once the viewport has been focused.
- An accessibility baseline pass confirming and permanently guarding every component's keyboard operability, visible focus indicator, and text color contrast (light and dark themes verified against WCAG AA). The color picker now accepts an optional `label` attribute for an accessible name, matching the slider.

### Fixed

- The invalid-configuration message shown by the slider and color picker was slightly too low-contrast to read comfortably in the light theme; it now uses the same easy-to-read text color as the rest of the component, while the red outline still clearly flags the error.
- Fixed a stale package version that had blocked the last release from actually publishing to npm; the version is now always read directly from the package's own metadata, so this can't happen again.

## [0.4.0] - 2026-08-09

### Added

- Four framework-free form/input components, usable on their own with no CSS required: a keyboard-operable drag-and-drop file drop-zone, a slider with a live value readout, a color picker with an optional preset swatch palette, and a button with primary/secondary/danger variants. Each shows a clearly visible error state for invalid input (a rejected file, a malformed color, a broken slider range) instead of failing silently, and each follows the light/dark theme automatically.

## [0.3.0] - 2026-08-09

### Added

- Four framework-free layout components, usable together or on their own with no CSS required: a titled panel, a toolbar, a keyboard-accessible tab strip, and a root app shell (toolbar + sidebar + main content) that any of the other three can be slotted into. All four follow the light/dark theme automatically.

## [0.2.0] - 2026-08-09

### Added

- The package is now published to the public npmjs.org registry on every tagged release, so any Vite app can add it as a normal dependency (`npm install @openkakutou/web-ui-kit`) and resolve it via a standard semver range — no extra build configuration needed.

## [0.1.0] - 2026-08-09

### Added

- Design tokens for color (with a light/dark pair), spacing, and typography, importable from the package's single CSS entrypoint. Dark mode is switched by setting `data-theme="dark"` on the page.

[Unreleased]: https://github.com/openkakutou/web-ui-kit/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.5.0
[0.4.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.4.0
[0.3.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.3.0
[0.2.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.1.0
