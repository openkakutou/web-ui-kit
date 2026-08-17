/**
 * Pure merge logic behind `initI18n` (see `i18n.ts`): combines a consuming
 * app's own locale catalog with `web-ui-kit`'s own catalog into the
 * per-locale, per-namespace shape i18next's `resources` option expects, so
 * both live in one instance without key collisions. Kept separate from
 * `i18n.ts` so the merge itself is testable without touching i18next at all,
 * mirroring the existing pure-logic/glue split (`slider-config.ts`,
 * `color-picker-color.ts`).
 */

/** The namespace `web-ui-kit`'s own catalog is always merged in under.
 * Reserved — a consuming app must not pass this as its own `namespace`. */
export const WUIK_NAMESPACE = "wuik";

/** A key -> translated string catalog for one locale. Values may nest
 * (`{ "shortcuts": { "rebind": "Rebind" } }`, looked up as
 * `"shortcuts.rebind"`) — i18next's own standard resource-bundle shape. */
export type LocaleCatalogValue = string | { [key: string]: LocaleCatalogValue };
export type LocaleCatalog = Record<string, LocaleCatalogValue>;

/** A locale code (`"en"`, `"fr"`, …) -> catalog map. */
export type LocaleCatalogs = Record<string, LocaleCatalog>;

/**
 * Merges `appResources` (under `namespace`) and `wuikResources` (always
 * under `WUIK_NAMESPACE`) into i18next's `{ [locale]: { [ns]: catalog } }`
 * resources shape. A locale present in only one of the two inputs still
 * gets an entry — the missing side becomes an empty catalog rather than
 * being omitted, since i18next's own `fallbackLng` covers a missing key,
 * not a missing namespace bucket.
 */
export function buildResources(
  namespace: string,
  appResources: LocaleCatalogs,
  wuikResources: LocaleCatalogs,
): Record<string, Record<string, LocaleCatalog>> {
  const locales = new Set([
    ...Object.keys(wuikResources),
    ...Object.keys(appResources),
  ]);

  const result: Record<string, Record<string, LocaleCatalog>> = {};
  for (const locale of locales) {
    result[locale] = {
      [WUIK_NAMESPACE]: wuikResources[locale] ?? {},
      [namespace]: appResources[locale] ?? {},
    };
  }
  return result;
}
