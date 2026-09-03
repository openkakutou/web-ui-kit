---
date: 2026-09-03
status: accepted
---
# UX/design audit (item 012) scoped to one first-app fix, not an org-wide rollout

**Context:** Item `012`'s audit confirmed the reported problem (`lifebar-viewer-web`'s folder-picker reading as unstyled native controls) is a real, recurring per-app adoption gap, not isolated to that one app: raw `<button>` and native radio inputs turn up in `character-viewer-web`, `character-editor`, `stage-viewer-web`, `stage-editor`, and `lifebar-editor` too. The audit also surfaced two genuine capability gaps in this kit itself — no styled radio-group equivalent, and no attribute-driven pressed/selected state for `<wuik-button>` — which is why some of that raw usage exists even in apps that otherwise adopt this kit's buttons extensively.

**Decision:** Fix `lifebar-viewer-web` fully for the two gaps this kit can already close today (folder-input's buttons → `<wuik-button>`, simulation sliders → `<wuik-slider>`), file the two missing-capability gaps as their own new backlog items (`014`, `015`) rather than building them opportunistically mid-audit, and record the audit's per-app findings as this item's own notes rather than opening five more cross-repo backlog items right now for the remaining apps' adoption work.

**Reason:** The candidate-selection radios in `lifebar-viewer-web` can't be migrated today without a `wuik-radio-group` component that doesn't exist yet — building one as a side effect of an audit item would blur an audit-scoped task into an unplanned component-design task. Filing the other five apps' adoption work as backlog items now, before `014`/`015` exist, would create items partially blocked on gaps that aren't even scoped yet. This item's own Notes already capture exactly which files and patterns need revisiting, which is enough for those items to be filed cheaply once `014`/`015` land and the adoption work can actually start.

**Rejected alternatives:**
- **Build `wuik-radio-group` now, inline in this item:** rejected — turns an audit item into an unplanned component-design task with its own full test/a11y bar, and delays closing the audit finding that motivated this work in the first place.
- **File all five remaining apps' adoption items right now:** rejected — several would immediately depend on `014`/`015` (not yet built), and the exact scope of each app's own item is better derived once those components' real API exists, not guessed ahead of it.
