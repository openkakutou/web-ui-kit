# Ubiquitous Language

## Design token
A single named, reusable design decision (a color, a spacing value, a font size, …) exposed as a CSS custom property with a `--wuik-` prefix, so every consuming app and future component reads the same value instead of hardcoding it. Tokens are grouped into color, spacing, and typography. Color tokens are further split into semantic tokens (`--wuik-color-bg`, `--wuik-color-text`, …) that carry meaning independent of any specific hue — components reference these, never a raw value.
**Do not confuse with:** a component (a token has no behavior or markup of its own; it is a value other code consumes).
_Sources: `src/tokens/colors.css`, `src/tokens/spacing.css`, `src/tokens/typography.css`, `src/tokens/index.css`_

## Theme
The active light/dark mode of the design tokens, selected by setting a `data-theme` attribute (`"light"` or `"dark"`) on an ancestor element. Absence of the attribute, or an unrecognized value, resolves to light.
**Do not confuse with:** a color token itself — a theme selects *which* set of color token values is active.
_Sources: `src/tokens/colors.css`_

## Panel
A standalone container with a body and an optional titled header region, the header shown only when content is slotted into it (no reserved empty space otherwise).
**Do not confuse with:** App shell — a panel is generic content grouping usable anywhere; the app shell is specifically a page's root layout frame.
_Sources: `src/components/panel.ts`_

## Toolbar
A horizontal container for actions (typically buttons) whose content scrolls horizontally rather than being clipped when it overflows the available width.
_Sources: `src/components/toolbar.ts`_

## Tab strip
The keyboard-navigable row of tab buttons that `<wuik-tabs>` builds from its `<wuik-tab-panel>` children, one button per panel. Activation is automatic: moving focus to a tab with the keyboard selects it and shows its panel immediately.
**Do not confuse with:** a tab panel — the tab strip is the row of controls; a tab panel is the content one control reveals.
_Sources: `src/components/tabs.ts`_

## App shell
The root layout component providing a page's toolbar, sidebar, and main content regions as plain slots, without instantiating any of the other layout components itself. A region with nothing slotted into it collapses to zero size instead of leaving empty space.
**Do not confuse with:** Panel — a panel is generic reusable content grouping; the app shell is specifically the page's outermost structural frame.
_Sources: `src/components/app-shell.ts`_

## File drop-zone
A keyboard-operable-first drag-and-drop + click-to-browse file input area. It is a real interactive element in its own right (not just a drop target), so opening the file picker never requires a mouse. Files that do not match its accepted types are rejected individually and shown in a visible status message rather than silently discarded; a new selection or drop always replaces the previous one.
**Do not confuse with:** a native `<input type="file">` — the drop-zone wraps one internally but adds drag-and-drop, visible accept/reject feedback, and a keyboard-operable surface around it.
_Sources: `src/components/file-drop-zone.ts`, `src/components/file-drop-zone-accept.ts`_

## Slider
A control for choosing a numeric value within a range, wrapping a native range input with a live value readout. Distinguishes a live, continuously-updating value (while the user is still adjusting it) from a committed value (once the change is final), each surfaced as its own event. A malformed range configuration falls back to a default range and is shown as a visible invalid state, whereas a valid value merely outside the range is clamped silently, matching how a native range input behaves.
**Do not confuse with:** the invalid-configuration state, which is about the slider's own `min`/`max`/`step` setup being broken — not about the value the end user has chosen.
_Sources: `src/components/slider.ts`, `src/components/slider-config.ts`_

## Color/palette picker
A control for choosing a color, combining a native color picker with an optional row of preset swatch buttons (the palette) for one-click selection of commonly-used colors. A malformed color value falls back to a default color and is shown as a visible invalid state; a malformed entry in the palette is dropped individually rather than invalidating the whole palette.
**Do not confuse with:** the palette itself, which is just the list of preset swatch colors — not the currently selected value.
_Sources: `src/components/color-picker.ts`, `src/components/color-picker-color.ts`_

## Radio group
A control for choosing exactly one option from a labelled list, wrapping one native radio input per option. Options are declared individually (a value plus a display label) rather than configured as a single attribute, since a label is arbitrary end-user-visible text (e.g. a file name). A value that matches no option just leaves nothing selected, like a slider value merely outside its range; two options sharing the same value is instead treated as a broken configuration and shown as a visible invalid state, keeping only the first of the colliding options so the group stays usable.
**Do not confuse with:** the malformed-option case, which drops one bad option silently — the invalid state is reserved for the group-level ambiguity of a duplicated value, not for an individual missing one.
_Sources: `src/components/radio-group.ts`, `src/components/radio-group-options.ts`_

## Viewport
A control that lets the user zoom, pan, and reset-to-fit a wrapped piece of content — typically a `<canvas>`-based preview (a sprite, a stage background, an animation frame) — without knowing or touching how that content renders its own pixels. Distinguishes the current transform's scale from its pan offset, both exposed together as a single read value and change event.
**Do not confuse with:** the wrapped content itself — the viewport only ever moves/scales it as an opaque box; drawing the content is entirely the wrapped element's own responsibility.
_Sources: `src/canvas/viewport.ts`, `src/canvas/viewport-transform.ts`_

## 3D orbit camera
A control that lets the user orbit (rotate around a target point), pan, and zoom a 3D camera to preview 3D content — typically a model rendered by a `<canvas>`-based 3D renderer — without knowing or touching how that content renders its own pixels. Tracked as spherical coordinates (an azimuth and elevation angle plus a distance around a target point), exposed together with the derived camera position as a single read value and change event. Elevation is hard-clamped away from the poles so the camera can never flip past top/bottom-dead-center.
**Do not confuse with:** Viewport — the 2D control pans/zooms a flat CSS transform; the 3D orbit camera instead tracks an angular position around a target point, since a 3D scene has no single "transform" to apply to slotted content.
_Sources: `src/canvas3d/viewport-3d.ts`, `src/canvas3d/orbit-camera.ts`_

## Command stack
An undo/redo history: a consumer registers a command (a do/undo pair) by pushing it, and the stack tracks how to reverse (`undo`) or replay (`redo`) it later. Framework-agnostic, not a Web Component — any consuming app plugs its own domain actions into a shared stack instead of re-implementing history management itself.
**Do not confuse with:** a component's own internal state — the command stack only ever holds the do/undo functions a consumer gives it; it never inspects or mutates anything itself.
_Sources: `src/history/command-stack.ts`_

## Coalescing
Merging a rapid sequence of pushed commands sharing the same coalesce key (within a configurable time window) into a single history entry, so one `undo()` reverts all the way back to before the whole sequence — not one step per intermediate value. Typical use: dragging a value continuously should produce one undo step, not one per pixel of movement.
**Do not confuse with:** Command stack's bounded size — coalescing reduces how many entries a *related* sequence of pushes produces; the size bound instead discards old, *unrelated* entries once the history grows too long.
_Sources: `src/history/command-stack.ts`_

## Shortcut action
A named operation an app registers with the shortcut manager (an id, a display label, and a default key combo). The manager tracks one active binding per action — the default, or a user-chosen override — and never lets two actions share the same binding silently.
**Do not confuse with:** the binding itself — an action is the fixed identity ("Save"); its binding (which key triggers it) is the one thing that can change.
_Sources: `src/shortcuts/shortcut-manager.ts`_

## Shortcut conflict
The state where a user tries to rebind an action to a key already bound to a different action. Never resolved by silently overwriting the other action — the conflict is surfaced by name, with a swap (trading the two actions' keys) offered as the resolution instead of a dead end.
**Do not confuse with:** an unassignable key (a modifier pressed alone, or a browser-reserved combo) — that is rejected outright, before any other action is even considered, and has no other action to swap with.
_Sources: `src/shortcuts/shortcut-manager.ts`, `src/shortcuts/shortcut-panel.ts`_

## Button
A standard clickable action control with a primary/secondary/danger variant, wrapping a native button. Deliberately never synthesizes visible label text for an empty slot — an honest, visibly-flagged empty state is preferred over giving the control a false accessible name.
**Do not confuse with:** a native `<button>` — the component always wraps one internally but adds the variant styling and the empty-label safeguard.
_Sources: `src/components/button.ts`_

## Dialog
A modal overlay surface (a confirmation, a preferences panel, or any content that must be addressed before returning to the page) that captures focus while open, closes on Escape/backdrop click/its own close control, and returns focus to whatever opened it. Reports why it closed (cancelled vs. an explicit close) so a consumer can react differently to each.
**Do not confuse with:** Panel — a panel is inline page content with no focus-capturing or backdrop behavior; a dialog interrupts the page until addressed.
_Sources: `src/components/dialog.ts`_

## Locale switcher
A control that lists every language a consuming app (plus this kit's own translated text) is available in and switches the active one when the user picks a different option, with no page reload. The active selection always reflects a previously persisted manual choice over the browser's own auto-detected language, and stays in sync with a switch made anywhere else (another switcher instance, or the app itself) without rebuilding its own option list.
**Do not confuse with:** the underlying localization setup a consuming app performs once — the switcher is only the UI on top of it; a consuming app never needs one to have working translated text.
_Sources: `src/i18n/locale-switcher.ts`_
