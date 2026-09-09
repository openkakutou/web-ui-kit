---
date: 2026-09-09
status: accepted
---
# Spinner honors `prefers-reduced-motion` by slowing, not freezing

**Context:** `<wuik-spinner>` is a continuously-rotating CSS animation, the exact pattern vestibular-disorder motion guidance calls out; the brief itself did not mention `prefers-reduced-motion`.

**Decision:** Under `@media (prefers-reduced-motion: reduce)`, the ring's rotation slows down (a longer `animation-duration`) instead of stopping entirely.

**Reason:** A fully frozen "spinner" no longer conveys "loading is happening" and reads as broken/stuck to a reduced-motion user relying on it as a status cue; slowing keeps the signal while removing the fast, disorienting motion.

**Rejected alternatives:** Freezing the animation entirely (simpler, but produces a static ring with no loading affordance) — rejected because it defeats the component's one purpose under exactly the setting meant to make it more usable, not less informative.
