---
date: 2026-09-05
status: accepted
---
# Radio group options are light-DOM children, not a JSON attribute

**Context:** Backlog item 014 adds `<wuik-radio-group>`. Every other simple
form/input component in this kit (`wuik-slider`, `wuik-color-picker`)
configures itself through plain string attributes, but a radio group needs a
*list* of value/label pairs — the same shape problem `<wuik-tabs>` already
solved for its list of panels via light-DOM children
(`<wuik-tab-panel label="…">`) read reactively through `slotchange`.
`vibe:expert-ui-ux` and `vibe:expert-frontend-design` were consulted on the
plan before implementation.

**Decision:** Options are modeled as light-DOM child elements,
`<wuik-radio-option value="…">Display label</wuik-radio-option>`, read
through the same hidden-`<slot>` + `slotchange` pattern `<wuik-tabs>` uses
for `<wuik-tab-panel>`. The radio group renders its own native
`<input type="radio">` per option into shadow DOM; the slotted
`<wuik-radio-option>` elements are never displayed themselves (the shadow
`<slot>` they land in is `display: none`) — they exist purely as the data
source, read once per render (element `value` attribute + trimmed text
content). A malformed individual option (missing/empty `value`) is dropped
silently, matching `wuik-color-picker`'s per-entry palette handling. A
duplicate `value` across options is a configuration error, not a per-option
one: it triggers the shared `is-invalid` state (decision 007) naming the
duplicated value, keeping only the first occurrence so the group still
renders something selectable.

**Reason:** A JSON-string `options` attribute was the main alternative and
was rejected because option labels are arbitrary end-user-visible text (the
motivating use case is literally file names picked out of a folder, which
can contain quotes, commas, or non-ASCII characters) — round-tripping that
through a hand-serialized JSON attribute is exactly the kind of string
formatting a Web Component's declarative HTML shape should not need.
Light-DOM children are also how this kit already solved the identical
"list of labelled things" shape for `<wuik-tabs>`, so this keeps one
convention for lists instead of introducing a second one JSON-attribute
components would need to justify separately later.

**Rejected alternatives:**
- A JSON `options` attribute (`options='[{"value":"a","label":"A"}]'`) —
  rejected: fragile to serialize/escape for arbitrary label text, and a
  second, inconsistent convention next to `<wuik-tabs>`'s existing
  light-DOM-children pattern for the same "list of labelled things" shape.
- Relying on native shadow-DOM radio-group arrow-key navigation instead of
  a custom keydown handler — rejected: cross-browser/jsdom behavior for
  arrow-driven radio-group navigation is not reliably testable or
  guaranteed (this kit has no jsdom coverage proving it), whereas
  `<wuik-tabs>` already established the pattern of a custom keydown handler
  with roving tabindex over real native controls for deterministic,
  testable behavior.
