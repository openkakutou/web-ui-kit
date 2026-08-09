---
date: 2026-08-09
status: accepted
---
# App shell has no grid gap; empty slots collapse via slotchange, not CSS alone

**Context:** `wuik-app-shell` (backlog item `002`) lays out a toolbar, a sidebar, and a main content area with CSS Grid. Two related risks were raised during plan review: an unused slot (no toolbar or no sidebar slotted) must not reserve visible empty space or a visible seam, and each region's visual separation (border/background) must come from *something* since the shell itself must not force a specific bordered look on whatever a consumer slots in.

**Decision:** The shell's grid tracks are sized `auto` (not a fixed token size) and carry no `gap` between them. Each named slot listens for its own `slotchange` event and sets itself `display: none` when it has no assigned elements, letting its `auto`-sized track collapse to zero. Visual separation between regions (borders, background) is left entirely to whatever is slotted in (typically `wuik-toolbar` / `wuik-panel`, which already own that styling) — the shell never draws its own dividers.

**Reason:** A fixed `gap` would leave a visible sliver of empty space even when a track collapses to zero width/height, defeating the "no visible seam when a slot is empty" requirement — removing `gap` entirely and letting slotted components own their own borders sidesteps that without introducing a second place (shell CSS vs. component CSS) where the same border could be drawn inconsistently. Reacting to `slotchange` (rather than only sizing tracks `auto` and hoping an empty slot naturally takes no space) is necessary because an empty `<slot>` element is still a real, present grid item by default and must be explicitly hidden to stop reserving its track.

**Rejected alternatives:**
- *Fixed-size tracks with a shared `gap` token* — rejected: cannot express "zero space when empty, N space when populated" with a single static value.
- *`:has()`-based CSS-only empty detection* (`:host(:has(slot[name="sidebar"]:empty))`) — rejected for now: `:empty`/slot-assignment interaction is not reliably supported across the browser matrix this library targets, whereas `slotchange` is universally supported and already the mechanism `wuik-tabs` uses for its own dynamic children (item `002`), keeping one pattern instead of two.
