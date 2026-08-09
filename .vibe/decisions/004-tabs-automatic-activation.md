---
date: 2026-08-09
status: accepted
---
# Tabs use automatic activation, not manual

**Context:** Implementing the tab strip for the shared layout shell (backlog item `002`). The WAI-ARIA Authoring Practices describe two valid keyboard activation models for a tabs widget: *automatic activation* (moving focus with the arrow keys immediately selects the tab and shows its panel) and *manual activation* (arrow keys only move focus; the user must press Enter/Space to select). Both are accessible; the choice changes the component's behavior and API surface.

**Decision:** `wuik-tabs` uses automatic activation: ArrowLeft/ArrowRight/Home/End both move focus and select the corresponding panel in the same step, with wrap-around at the ends.

**Reason:** Manual activation exists specifically to avoid triggering expensive work (e.g. a network fetch) on every arrow keypress while the user is still navigating. `wuik-tab-panel` selection is a synchronous, cheap visibility toggle (`hidden` attribute) with no data loading involved, so that cost doesn't apply here — automatic activation gives a simpler mental model and a simpler API (no separate "focus" vs. "select" state to track or expose) for the common case this component targets.

**Rejected alternatives:**
- *Manual activation* — rejected: adds a confirmation step (Enter/Space) that has no payoff here since selecting a tab is free; would also force every consumer to learn/implement the distinction between "focused tab" and "selected tab" for no benefit.
- *Leaving the activation model unspecified/consumer-configurable* — rejected: the whole point of a shared component is that every consuming app behaves identically; making this configurable reopens the "every app invents its own tab behavior" problem the shell exists to close.
