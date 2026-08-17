# Module: shortcuts
**Role:** A framework-agnostic keyboard-shortcut manager (`ShortcutManager`, headless — not a Web Component) plus the shared `<wuik-shortcuts-panel>` Web Component that drives it: an app registers named actions with a default key, the manager tracks/persists overrides and rejects silent key conflicts, and the panel is the UI a user rebinds through.
**Files:** `src/shortcuts/shortcut-manager.ts`, `src/shortcuts/shortcut-key.ts`, `src/shortcuts/shortcut-panel.ts`, `src/shortcuts/index.ts`
**Exports:** `ShortcutManager` (class: `register`, `list`, `getBinding`, `rebind`, `resetToDefault`, dispatches `"change"`), `WuikShortcutsPanelElement` (`<wuik-shortcuts-panel>`), `ShortcutAction`/`ShortcutBinding`/`RebindOptions`/`RebindResult`/`ShortcutChangeDetail`/`ShortcutManagerOptions` (types)
**Depends on:** `modules/tokens.md`
