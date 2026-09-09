---
status: done
---
# Add Loading Spinner Component

## Description
Add a new shared `wuik-spinner` Web Component: a visual loading indicator, decorative by default, usable standalone with an accessible label. Several OpenKakutou apps (`stage-viewer-web`, `lifebar-viewer-web`, `stage-editor`) currently show loading state as text only (a `role="status"` message plus a dimmed control), with no visual spinner anywhere in the org's shared component set — this item fills that gap in `web-ui-kit` so every consumer app can adopt the same component instead of building its own.

Mirror `src/components/panel.ts`'s existing structure: `attachShadow` + `TEMPLATE`, idempotent auto-registration (`if (!customElements.get("wuik-spinner")) customElements.define(...)`), all styling via `--wuik-*` design tokens only, never a literal color.

- `src/components/spinner.ts` — `WuikSpinnerElement`:
  - A CSS-animated ring (`@keyframes` rotation), colored via `--wuik-color-*` tokens only.
  - `size` attribute: enum `"sm" | "md" | "lg"`, default `"md"`; an invalid value silently falls back to the default (same pattern as `wuik-button`'s `variant`).
  - Optional `label` attribute: the host is `aria-hidden="true"` by default, since it's meant to be dropped inside a consumer's own existing `role="status"` region and must never cause a duplicate screen-reader announcement. When `label` is provided, remove `aria-hidden` and set `aria-label` to it, for standalone use.
- `src/components/spinner.test.ts` — same conventions as `panel.test.ts`: structural assertions on the shadow `<style>` text (presence of `--wuik-*` tokens and `@keyframes`/`animation`, no literal hex color — jsdom doesn't apply shadow styles to computed style, see `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`), `aria-hidden`/`aria-label` behavior with and without `label`, invalid `size` falls back without throwing, mounts cleanly with no attributes at all.

To modify:
- `src/components/index.ts` — add `export { WuikSpinnerElement } from "./spinner.ts";`
- `CHANGELOG.md` — entry under `[Unreleased] > Added`.

## Acceptance Criteria
- [ ] `<wuik-spinner>` mounts and renders an animated ring with no attributes set, without throwing.
- [ ] The host is `aria-hidden="true"` (no `label`) by default, and exposes `aria-label` equal to `label` when that attribute is set.
- [ ] `size` accepts `"sm"`/`"md"`/`"lg"`, defaults to `"md"`, and an invalid value falls back to `"md"` without throwing.
- [ ] `WuikSpinnerElement` is exported from `src/components/index.ts` and listed in `CHANGELOG.md` under `[Unreleased] > Added`.

## Notes
Cross-repo dependency (not expressible as a `depends_on` number — the dependent lives in a different repo): `stage-viewer-web`'s backlog item "Show a visual loading spinner during stage load and sprite decode" consumes this component and needs it published. `stage-viewer-web` currently pins `@openkakutou/web-ui-kit` at `^0.11.1` (published npm version) — this item should go through a full `/vibe:release` + `/vibe:publish` cycle once implemented so the downstream item can consume a real published version (a local `npm link`/`file:` dependency can unblock earlier dev/testing if needed).
