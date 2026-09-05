---
status: done
---
# `<wuik-tabs>` Vertical Orientation

## Description
Add an `orientation="vertical"` mode to `<wuik-tabs>`/`<wuik-tab-panel>`. Today the component only supports a horizontal top strip with Left/Right roving-tabindex keyboard navigation — there is no way to lay it out as a left-hand sidebar list, and Up/Down arrow keys (the correct convention for a vertical tab list per the ARIA APG) aren't handled at all. First concrete need: `character-viewer-web`'s workspace redesign (`.ux/decisions/001-workspace-navigation-model.md`) wants a vertical section list in `<wuik-app-shell>`'s sidebar slot instead of a horizontal strip, specifically so the app reads as a desktop tool rather than competing with the browser's own tab strip.

## Acceptance Criteria
- [x] `<wuik-tabs orientation="vertical">` lays its tab buttons out in a column instead of a row
- [x] In vertical orientation, Up/Down arrow keys move the roving tabindex between tabs (Left/Right do nothing, or are ignored); in the existing horizontal (default) orientation, behavior is unchanged
- [x] `aria-selected`, `role="tab"`, and every other existing accessibility attribute continue to work identically in both orientations
- [x] Visual styling (selected-tab indicator, spacing) reads correctly in a narrow sidebar column, using existing `--wuik-*` tokens only

## Notes
Source: `character-viewer-web`'s `/ux:design` pass (see that repo's `.ux/decisions/001-workspace-navigation-model.md` for why a vertical sidebar was chosen over a horizontal top tab strip). No external programmatic tab-select API exists yet either (noted in that repo's `.ux/inventory.md` as a separate known gap) — worth checking whether it's needed alongside this change, but out of this item's stated scope unless it turns out to block the orientation work itself.
