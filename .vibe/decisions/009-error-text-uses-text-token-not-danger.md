---
date: 2026-08-10
status: accepted
---
# Inline error/invalid-state messages use `--wuik-color-text`, not `--wuik-color-danger`, for their text color

**Context:** Backlog item 005 (accessibility baseline) added a formal WCAG AA
contrast check for every semantic color token used as real rendered text,
extending the existing (background, foreground) pair suite in
`src/tokens/index.test.ts`. `wuik-slider` and `wuik-color-picker` each style
their inline invalid-configuration message (`.error { color:
var(--wuik-color-danger); }`) directly with the danger token as foreground
text. Measured against the actual token values, `--wuik-color-danger` as text
on `--wuik-color-surface` in the light theme measures 4.39:1 — just under the
4.5:1 AA threshold for normal text. It passes against `--wuik-color-bg` and
in the dark theme, but since these components carry no opinion about which
ambient surface they're placed on, the pair must hold for both.

**Decision:** Inline error/invalid-state message text uses `--wuik-color-text`
(already contrast-verified against both `--wuik-color-bg` and
`--wuik-color-surface`, in both themes) instead of `--wuik-color-danger`. The
invalid state itself keeps signaling non-verbally through `--wuik-color-danger`
via the existing border/outline (`.wrapper.is-invalid input { outline: 2px
solid var(--wuik-color-danger); }`) plus `aria-invalid="true"` — consistent
with `.vibe/decisions/007-form-input-components-shared-conventions.md`'s
existing rule that invalid state is "never color alone." Only the message
*text itself* moves off the danger token; the visual "something is wrong"
signal is unchanged.

**Reason:** This is the minimal fix that doesn't touch the published
`--wuik-color-danger` token value itself, which remains correctly
contrast-verified for its actual verified use (solid fills paired with
`--wuik-color-text-on-danger`, e.g. the viewport's invalid banner) and is
depended on elsewhere (drop-zone `color-mix` tinting). Changing the shared
token to satisfy one small-text use case would risk shifting the design
system's whole red hue for every consumer already relying on the current
value, for a problem confined to two inline text nodes.

**Rejected alternatives:**
- Darkening `--wuik-color-danger` itself to clear 4.5:1 as text-on-surface —
  rejected: cascades to every other verified/consumed use of the token
  (viewport invalid banner background, drop-zone tinted backgrounds), a much
  larger blast radius than the actual defect.
- A new dedicated `--wuik-color-danger-text` token calibrated for small text —
  rejected as unnecessary token surface area for two call sites; revisit if a
  third component needs danger-colored inline text.
- Enlarging the error text to qualify for the "large text" 3:1 threshold
  instead of 4.5:1 — rejected: the actual token math already clears 3:1
  comfortably, so this would be gaming the threshold rather than fixing
  contrast, and would visually mismatch the deliberately small
  (`--wuik-font-size-sm`) size used for inline help/error text elsewhere.
