---
date: 2026-09-09
status: accepted
---
# Spinner: empty-string `label` is treated as absent

**Context:** `<wuik-spinner>`'s `label` attribute is optional; when present it removes the host's default `aria-hidden="true"` and sets `aria-label` for standalone use.

**Decision:** `label=""` (empty or whitespace-only after trimming) is treated the same as no `label` attribute at all — the host stays `aria-hidden="true"` with no `aria-label` set.

**Reason:** An empty `aria-label` is a known accessibility anti-pattern (an element exposed to assistive tech with a blank accessible name), and mirrors `wuik-button`'s existing principle of never fabricating or exposing an empty/false accessible name.

**Rejected alternatives:** Treating any presence of the attribute (including empty string) as "provided" — matches the literal wording ("when `label` is provided") but would let an accidentally-empty attribute silently break accessibility for that instance.
