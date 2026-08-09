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
