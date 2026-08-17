---
status: todo
---
# i18n Integration Layer and Locale Switcher

## Description
Add `i18next` (+ `i18next-browser-languagedetector`) as a dependency and provide a shared integration layer other apps configure once and reuse: a centralized i18next setup (init, a per-repo namespace convention so each consuming app's catalog doesn't collide with another's or with `web-ui-kit`'s own strings, browser-language detection with a localStorage-persisted manual override) plus a `<wuik-locale-switcher>` Web Component that lists available locales and switches the active one. Mirrors the existing pairing of a headless primitive with a Web Component UI (`ShortcutManager` + `<wuik-shortcuts-panel>`). Also add `web-ui-kit`'s own English and French message catalogs for its own user-facing strings (e.g. the shortcuts panel, invalid-state error text), so the design system itself is the first proof the mechanism works end-to-end. See roadmap decision `023-localization-approach-for-web-ui.md` for the approach and rationale.

## Acceptance Criteria
- [ ] A consuming app can initialize the shared i18next configuration with its own namespace and locale catalogs in a few lines
- [ ] `<wuik-locale-switcher>` lists the active app's available locales and switches the current locale when one is selected
- [ ] The active locale is detected from the browser by default and persists a manual override across page reloads (localStorage), consistent with the persistence pattern already used by `ShortcutManager`
- [ ] `web-ui-kit`'s own user-facing strings (shortcuts panel, invalid-state messages) are translated via English and French catalogs and switch correctly through `<wuik-locale-switcher>`
- [ ] A missing translation key falls back to the default locale (English) instead of rendering a blank string or crashing

## Notes
None.
