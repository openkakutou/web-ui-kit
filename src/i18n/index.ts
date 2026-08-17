/**
 * Barrel: importing this module registers the `<wuik-locale-switcher>`
 * custom element (self-registers via `customElements.define` on import)
 * and re-exports the shared i18next integration layer it's driven by.
 */
export {
  DEFAULT_LOCALE,
  DEFAULT_STORAGE_KEY,
  WUIK_NAMESPACE,
  getI18n,
  getSupportedLocales,
  initI18n,
  onLocaleChange,
  t,
} from "./i18n.ts";
export type {
  InitI18nOptions,
  LocaleCatalog,
  LocaleCatalogs,
} from "./i18n.ts";
export { localeDisplayName } from "./locale-names.ts";
export { WuikLocaleSwitcherElement } from "./locale-switcher.ts";
