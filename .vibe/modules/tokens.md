# Module: tokens
**Role:** Design tokens (color, spacing, typography) as CSS custom properties — the foundation layer every future component will consume instead of hardcoding values.
**Files:** `src/tokens/index.css`, `src/tokens/colors.css`, `src/tokens/spacing.css`, `src/tokens/typography.css`
**Exports:** No JS exports — a CSS entrypoint. `src/tokens/index.css` `@import`s the other three files and is re-exported to consumers via the package's `./tokens.css` subpath (`package.json` `exports`), built to `dist/web-ui-kit.css`.
**Public contract:** `--wuik-*`-prefixed custom properties (see `docs/api.md` for the full token reference). Color tokens are semantic only (`--wuik-color-bg`, `--wuik-color-text`, etc.), defined on `:root` for light and overridden under `:root[data-theme="dark"]` for dark — see `.vibe/decisions/001-design-token-theme-switch-mechanism.md` for why there is no `prefers-color-scheme` fallback. Spacing and typography tokens are theme-independent.
**Depends on:** none
