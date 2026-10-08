---
date: 2026-10-08
status: accepted
---
# Application-shell components for the editors (kit 0.16)

**Context:** The validated `character-editor` flow 001 (application shell: sidebar of eight sections, one section at a time, section header cards, badges, contextual help, toasts) needs components the kit lacked (see that repo's `.ux/flows/001-application-shell.md` and `.ux/decisions/002-application-shell.md`). The editor's own rule is no ad-hoc UI: missing primitives belong in the kit.

**Decision:** Add `<wuik-sidebar-nav>` (+ `<wuik-nav-group>`, `<wuik-nav-item>`), `<wuik-section-header>`, `<wuik-list-row>`, `<wuik-badge>`, `<wuik-tooltip>`, `<wuik-help-hint>`, `<wuik-toast>` (+ `<wuik-toast-region>`), `<wuik-select>`, and localize `<wuik-file-drop-zone>` with a visible selection status.

**Choices that matter:**
- **Navigation is a `<nav>` of native buttons**, current item `aria-current="page"` — not `role="tablist"`/`menu`, which would switch screen readers into application mode and demand arrow-key handling. `<wuik-tabs orientation="vertical">` stays for real tab panels.
- **Badges never rely on colour**: error is a filled pill, warning an outlined pill with "!", success with "✓"; the glyphs are `aria-hidden` and a consumer-localized `label` is read as part of the nav item's name. Plurals stay in the app's i18n (the kit's `t()` takes string vars only), so the kit has no "N errors" keys.
- **Collapsed rail keeps the name**: labels become visually hidden, not removed, and a native `title` shows name and shortcut. `collapsed` is mirrored from the nav onto its items because light-DOM children cannot read the host's state across the shadow boundary.
- **`aria-description` instead of `aria-describedby` on the tooltip trigger**, because an id reference cannot cross the shadow boundary into the tooltip bubble; the bubble itself is `role="tooltip"`, hoverable and Escape-dismissible (WCAG 1.4.13). `<wuik-help-hint>` keeps button and popover in one shadow root, so `aria-describedby` works there.
- **Toasts are for transient confirmations only**; errors use `role="alert"` and never auto-dismiss unless a duration is set; hover and focus pause the timer. Persistent outcomes (saved status after export) stay inline in the app.
- **`<wuik-section-header>` heading is `role="heading"` with `tabindex="-1"`** and a `focusHeading()` method so the app moves focus there after navigation.
- **Alt+digit shortcuts are the app's concern**: the nav only advertises them (`shortcut`, `aria-keyshortcuts`) because browsers and AZERTY layouts make them unreliable as the only route.

**Consequences:** Editors can build the validated shell with kit components only. The sidebar's fold button, the drawer below 1024 px and the global "Export" status remain app code (they depend on app state). Visual baselines for the two new `dev-preview` sections are local and provisional until the real-runner CI validates them (decisions 015 and 021).
