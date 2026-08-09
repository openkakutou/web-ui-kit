---
date: 2026-08-09
status: accepted
---
# Shared conventions across the four new form/input components

**Context:** Backlog item 003 adds four standalone form/input Web Components
(`wuik-file-drop-zone`, `wuik-slider`, `wuik-color-picker`, `wuik-button`) in
one pass. Each needs an invalid/empty-input state, a disabled state, and
keyboard/focus handling. Built independently, these four would likely drift
into four slightly different conventions for the same underlying concerns.
`vibe:expert-ui-ux` and `vibe:expert-frontend-design` were consulted on the
plan before implementation.

**Decision:**
- **Invalid state:** a shared visual contract — `is-invalid` class + `aria-invalid="true"` +
  a border/icon using `--wuik-color-danger` (never color alone) — applied
  identically by `wuik-slider` (bad `min`/`max`/`step`/`value`) and
  `wuik-color-picker` (malformed `value`). The component still falls back to
  a sane default value so it keeps working, but the fallback is never silent.
- **`--wuik-color-danger` for hard errors, not `--wuik-color-warning`:** both file-drop
  rejection and slider/color-picker invalid-config are "must fix" states, not
  soft/recoverable notices.
- **Tinted large-area backgrounds via `color-mix()`:** the drop-zone's
  drag-over/accepted/rejected background uses `color-mix(in srgb, var(--wuik-color-accent|success|danger) 8%, var(--wuik-color-bg))`
  rather than a solid token fill — a solid `--wuik-color-danger`/`--wuik-color-success`
  fill is contrast-verified for text-on-solid (e.g. a button), not as a
  panel-sized background.
- **Disabled state, one rule for all four:** `opacity: 0.5`, `cursor: not-allowed`,
  `pointer-events: none` on interactive shadow parts, the `disabled` attribute
  forwarded to the wrapped native control, removed from the tab order, and
  drag/drop/click ignored while set.
- **Focus ring, one documented split:** the existing
  `outline: 2px solid var(--wuik-color-focus-ring); outline-offset: -2px;`
  pattern (inset) is reused as-is for large surfaces (drop-zone, slider).
  Small dense targets (palette swatches, `wuik-button` at default size) use
  `outline-offset: 2px` (outset) instead — an inset ring on a small target
  reads as a fill, not a ring. This is an intentional, documented exception,
  not a per-component accident.
- **Slider fires two events, matching native `<input type="range">`:** `wuik-input`
  continuously during drag (live preview value), `wuik-change` once on
  commit/release (final value). Collapsing these into a single
  always-live event would misfire consumers doing expensive work (e.g. canvas
  redraws) on every pixel of drag.
- **Drop-zone is keyboard-operable first, drag-and-drop is a layered addition:**
  the zone itself is a real interactive element (`role="button"`, `tabindex="0"`),
  so Enter/Space opens the file picker with no mouse involved. Drag-and-drop
  is progressive enhancement on top of that, never the only path in. A
  `aria-live="polite"` region announces "N accepted, N rejected: reason" so
  the outcome isn't visual-only.
- **Drop-zone re-selection replaces, it does not append:** matches native
  `<input type="file">` semantics — a new selection/drop replaces the
  previous one, rather than each component inventing its own accumulation
  rule.
- **`wuik-button` does not fabricate placeholder label text for an empty slot:**
  synthesizing visible text like "Button" would give the element a false
  accessible name, which is worse than an honest empty state. Instead: a
  `console.warn` (development-time signal, analogous to a prop-type warning,
  not a debug leftover) plus a visible `is-empty` dashed-outline/icon
  indicator that does not become part of the accessible name. Consumers are
  expected to supply either slotted text or an `aria-label`.
- **Out of scope for this iteration:** native `<form>` participation via
  `ElementInternals`/`formAssociated`. "Usable standalone" (the acceptance
  criterion) is about not depending on the layout shell, not about
  `FormData` participation; adding form-association now would be
  speculative scope beyond what backlog item 003 asks for.

**Reason:** The UI/UX and frontend-design consultations independently flagged
the same underlying risk — four components built in one pass, each
re-deriving disabled/focus/invalid conventions on its own, drifting apart in
ways a user would perceive as inconsistency. Fixing the shared rules once,
before writing any component, is cheaper than reconciling four divergent
implementations after the fact, and is what the acceptance criterion
("each handles an invalid/empty input state visibly") actually asks for
across the family, not per-component.

**Rejected alternatives:**
- Fabricating placeholder text ("Button") for an empty `wuik-button` slot —
  rejected as a false accessible-name violation (UI/UX expert).
- A single `wuik-change` event firing live during slider drag — rejected as
  a footgun for consumers doing expensive work per input event.
- Solid `--wuik-color-danger`/`--wuik-color-success` fills for the drop-zone's
  full-area background — rejected on contrast grounds; token pairs are
  verified for text-on-solid use, not large-area fills.
- Adding `ElementInternals`/`formAssociated` now — rejected as scope beyond
  this backlog item; revisit if a consuming editor actually needs native
  form submission.
