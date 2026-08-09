# Module: components
**Role:** The layout-shell Web Components (panel, toolbar, tabs, app shell) that give consuming apps their first real screen structure, each usable standalone or composed together.
**Files:** `src/components/panel.ts`, `src/components/toolbar.ts`, `src/components/tabs.ts`, `src/components/app-shell.ts`, `src/components/index.ts`
**Exports:** `WuikPanelElement` (`<wuik-panel>`), `WuikToolbarElement` (`<wuik-toolbar>`), `WuikTabsElement`/`WuikTabPanelElement` (`<wuik-tabs>`/`<wuik-tab-panel>`), `WuikAppShellElement` (`<wuik-app-shell>`) — each self-registers via `customElements.define` as a side effect of import; `index.ts` is the barrel re-exporting all four.
**Public contract:** See `docs/api.md` for the full slot/attribute/keyboard reference. Every component styles itself entirely via `--wuik-*` tokens on `:host` (or shadow-internal selectors) — no consumer CSS is required and every color follows the active `data-theme` automatically, since no component hardcodes a literal color.
**Depends on:** `modules/tokens.md`
