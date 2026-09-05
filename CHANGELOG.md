# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Updated the buttons demo section's visual-regression baseline to reflect the new pressed-state example buttons added in the previous release; the button component itself did not change.

## [0.9.0] - 2026-09-05

### Added

- `<wuik-button>` accepts a `pressed` attribute to show a toggle-style/selectable button in a visually distinct "pressed" state (a token-driven color shift plus a subtle inset shadow, working on top of any variant), automatically exposing `aria-pressed="true"` to assistive technology so consumers no longer need to set it by hand.

## [0.8.1] - 2026-09-05

### Fixed

- Corrected the buttons demo section's visual-regression baseline, which had gone stale after an unrelated page addition shifted its rendering by a hairline; it is not a real product change and the button component itself is unaffected.

## [0.8.0] - 2026-09-05

### Added

- A radio group component for picking exactly one option from a labelled list, keyboard-operable with arrow keys (wrapping past either end) and a visible focus indicator, following the light/dark theme automatically. Two options accidentally sharing the same value show a clear error instead of silently picking the wrong one.

## [0.7.0] - 2026-09-03

### Added

- A shared visual-regression testing setup any consuming app can build its own suite on top of: a fixed viewport, browser locale, and screenshot diff threshold, plus a small helper that forces animations and fonts to settle before a screenshot is taken — so a diff is a real visual change, not machine-to-machine noise. This kit's own components now have a baseline screenshot each, checked automatically before every release; a real visual regression fails the release instead of silently shipping.

## [0.6.0] - 2026-08-17

### Added

- A reusable undo/redo history primitive that any editor app can plug its own actions into: register an action's do/undo pair, then undo or redo it, including a long chain of consecutive actions in the right order. Rapid repeated edits of the same kind (like dragging a value) merge into a single undo step instead of one per intermediate change, and the history size is capped so it can't grow without bound during a long editing session.
- A remappable keyboard shortcut manager and a shared panel to go with it: an app registers its actions with a default key, and users can rebind any of them through the panel, with their choice remembered the next time they visit. Trying to reuse a key another action already has never silently overwrites it — instead the panel names the other action and offers to swap the two keys. A key that's just a modifier on its own, or one already claimed by the browser, is rejected with a clear message instead of being silently accepted. A reset control brings a changed action back to its original key.
- A shared localization (i18n) layer any app can set up in a few lines, with its own English and French message catalogs, plus a `<wuik-locale-switcher>` control that lists the available languages and switches the active one live, with no page reload. The chosen language is detected from the browser by default and remembered across visits once a user picks one manually. This kit's own text — the shortcut panel and the slider/color picker's invalid-value messages — is now translated into English and French as the first proof the mechanism works end-to-end; a missing translation always falls back to English rather than showing a blank or broken label.

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

[Unreleased]: https://github.com/openkakutou/web-ui-kit/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.9.0
[0.8.1]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.8.1
[0.8.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.8.0
[0.7.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.7.0
[0.6.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.6.0
[0.5.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.5.0
[0.4.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.4.0
[0.3.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.3.0
[0.2.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.1.0
