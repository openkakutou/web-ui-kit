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

## Viewport
A control that lets the user zoom, pan, and reset-to-fit a wrapped piece of content — typically a `<canvas>`-based preview (a sprite, a stage background, an animation frame) — without knowing or touching how that content renders its own pixels. Distinguishes the current transform's scale from its pan offset, both exposed together as a single read value and change event.
**Do not confuse with:** the wrapped content itself — the viewport only ever moves/scales it as an opaque box; drawing the content is entirely the wrapped element's own responsibility.
_Sources: `src/canvas/viewport.ts`, `src/canvas/viewport-transform.ts`_

## Button
A standard clickable action control with a primary/secondary/danger variant, wrapping a native button. Deliberately never synthesizes visible label text for an empty slot — an honest, visibly-flagged empty state is preferred over giving the control a false accessible name.
**Do not confuse with:** a native `<button>` — the component always wraps one internally but adds the variant styling and the empty-label safeguard.
_Sources: `src/components/button.ts`_
