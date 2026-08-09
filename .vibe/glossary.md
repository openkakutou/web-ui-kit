# Ubiquitous Language

## Design token
A single named, reusable design decision (a color, a spacing value, a font size, …) exposed as a CSS custom property with a `--wuik-` prefix, so every consuming app and future component reads the same value instead of hardcoding it. Tokens are grouped into color, spacing, and typography. Color tokens are further split into semantic tokens (`--wuik-color-bg`, `--wuik-color-text`, …) that carry meaning independent of any specific hue — components reference these, never a raw value.
**Do not confuse with:** a component (a token has no behavior or markup of its own; it is a value other code consumes).
_Sources: `src/tokens/colors.css`, `src/tokens/spacing.css`, `src/tokens/typography.css`, `src/tokens/index.css`_

## Theme
The active light/dark mode of the design tokens, selected by setting a `data-theme` attribute (`"light"` or `"dark"`) on an ancestor element. Absence of the attribute, or an unrecognized value, resolves to light.
**Do not confuse with:** a color token itself — a theme selects *which* set of color token values is active.
_Sources: `src/tokens/colors.css`_
