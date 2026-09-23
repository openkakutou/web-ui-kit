---
date: 2026-09-23
status: accepted
---
# `<wuik-text-input>`: visible `<label>`, blur-triggered required validation, consumer `error` override

**Context:** Backlog item 024 adds the org's first generic text-input/form-field
Web Component. `character-editor`'s stopgap (its `.vibe/decisions/003`) already
proves the shape a consumer needs: a visible `<label for>`, a required-field
check that flags a blank value inline, and an `is-invalid`/`aria-invalid`
danger-bordered state. `vibe:expert-ui-ux` and `vibe:expert-frontend-design`
were consulted on the plan; both independently converged on the same three
points below before implementation.

**Decision:**
- **A real visible `<label for="...">`, not `aria-label`-only** like
  `wuik-slider`/`wuik-color-picker` use. A generic text field's label is
  normally visible prose next to/above the field, unlike a slider or color
  swatch which has no visible text of its own to begin with. Each instance
  gets a stable, unique id (a module-level incrementing counter) so
  `label`/`for` and the error message's `aria-describedby` always match.
- **Required-and-empty validation is built into the component**, not left to
  every consumer to reimplement, but it never marks the field invalid before
  the user has interacted with it: the internal "touched" flag flips to true
  on the field's first `blur`, and only a touched-and-empty required field
  shows the built-in invalid state. An untouched, freshly-rendered empty
  required field stays visually neutral — starting a brand-new form already
  covered in errors is a known anti-pattern both experts flagged
  independently. Once touched, the field re-validates live on every `input`
  event, so fixing the value clears the error immediately without needing a
  second blur.
- **A generic `error` attribute/property always wins** over the built-in
  required check, and shows immediately regardless of touched state. This is
  the escape hatch for anything the component can't know on its own — a
  format check, a server-side rejection — and is what keeps the component
  "generic" rather than only-ever-required-aware. Setting it to an empty
  string clears it and falls back to the built-in check.
- **`aria-describedby` links the input to its error message** — the shared
  `is-invalid`/`aria-invalid="true"`/danger-colored border contract
  (`.vibe/decisions/007`) already covers a non-verbal cue and a state flag,
  but neither one actually delivers the error *text* to a screen-reader user
  who is already focused on the field; `aria-describedby` is what does.
- **The required-field asterisk is visual-only**, wrapped in its own
  `aria-hidden="true"` span so it is never read aloud as "star"/"asterisk" —
  the native `required` attribute (mapped to `aria-required="true"` for
  clarity under this project's jsdom test environment) is what actually
  announces "required" to assistive tech. The asterisk itself renders in
  `--wuik-color-text`, not `--wuik-color-danger`: `--wuik-color-danger` is
  verified for borders (3:1) and solid fills, never as small foreground text
  (`.vibe/decisions/009`), and the asterisk is exactly that.
- **Disabled overrides invalid**: a `disabled` field never shows the invalid
  border, `aria-invalid`, or error text, even if its value would otherwise
  fail the required check — consistent with the shared disabled convention
  (`.vibe/decisions/007`) and avoids presenting an alarming, unfixable-looking
  red state on a field the user cannot currently edit.
- **Setting the `value` attribute resets "touched"** back to false, treated
  as the same signal a form-level reset would send — otherwise a
  programmatically-cleared field could keep showing a stale invalid state
  from before the reset.

**Reason:** Both consulted experts flagged the same three risks
independently — a form that looks pre-broken on first paint, an asterisk
misread by assistive tech, and a danger-colored text failing the project's
own already-measured contrast pair — before any code was written, which is
cheaper to fix once here than after `character-editor` and future consumers
have already built against a first version.

**Rejected alternatives:**
- **`aria-label`-only, mirroring `wuik-slider`/`wuik-color-picker` exactly**
  — rejected: those two controls have no visible text of their own to attach
  a label to; a text field does, and hiding it would regress every consumer
  currently rendering a visible label in the stopgap.
- **Validate required-and-empty immediately on mount/render** — rejected:
  paints an untouched, brand-new form as already broken, the literal
  anti-pattern both experts named.
- **No built-in required validation at all, `error` as the only mechanism**
  — rejected: every consumer would reimplement the identical blank-check
  `character-editor`'s stopgap already has today, the exact duplication this
  backlog item exists to remove.
- **Asterisk colored with `--wuik-color-danger`** — rejected on the same
  contrast grounds as decision `009`; the token is not verified as small
  foreground text.
