/**
 * Shared i18next integration layer (roadmap decision
 * `023-localization-approach-for-web-ui.md`; see this repo's
 * `.vibe/decisions/013-i18n-integration-layer-architecture.md` for the
 * mechanism this file implements). A consuming app calls `initI18n` once
 * with its own namespace and locale catalogs; `web-ui-kit`'s own catalog
 * (the shortcuts panel, slider/color-picker invalid-state text) is always
 * merged in under the reserved `WUIK_NAMESPACE`, so it works everywhere
 * with no extra configuration.
 *
 * Not a Web Component — see `locale-switcher.ts` for the shared UI driven
 * by the instance this returns.
 */

import i18next, { type i18n as I18nInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  type LocaleCatalogs,
  WUIK_NAMESPACE,
  buildResources,
} from "./i18n-resources.ts";
import enWuik from "./locales/en.json" with { type: "json" };
import frWuik from "./locales/fr.json" with { type: "json" };

export { WUIK_NAMESPACE } from "./i18n-resources.ts";
export type { LocaleCatalog, LocaleCatalogs } from "./i18n-resources.ts";

export const DEFAULT_LOCALE = "en";

/** `localStorage` key the manual locale override is read/written under.
 * Override per consuming app if several OpenKakutou apps could ever share
 * an origin — sharing this key would also share their persisted override,
 * the same reasoning `ShortcutManager`'s own `storageKey` option documents. */
export const DEFAULT_STORAGE_KEY = "wuik-locale";

const wuikResources: LocaleCatalogs = { en: enWuik, fr: frWuik };

export interface InitI18nOptions {
  /** This app's own namespace — must not be `WUIK_NAMESPACE` ("wuik"),
   * reserved for this kit's own catalog. */
  namespace: string;
  /** This app's own locale catalogs, keyed by locale code. */
  resources: LocaleCatalogs;
  /** @default DEFAULT_STORAGE_KEY */
  storageKey?: string;
}

const localeChangeBus = new EventTarget();
let activeInstance: I18nInstance | undefined;

/**
 * Creates and initializes a fresh i18next instance for this app: the
 * browser locale is auto-detected on first load, a previously persisted
 * manual override (`localStorage`) always wins over that detection on
 * later loads, and an unsupported/undetectable locale falls back to
 * `DEFAULT_LOCALE`. Every subsequent `t()` call and every mounted
 * `<wuik-locale-switcher>`/standalone component picks up this instance.
 */
export async function initI18n(
  options: InitI18nOptions,
): Promise<I18nInstance> {
  const resources = buildResources(
    options.namespace,
    options.resources,
    wuikResources,
  );
  const instance = i18next.createInstance();
  await instance.use(LanguageDetector).init({
    ns: [WUIK_NAMESPACE, options.namespace],
    defaultNS: options.namespace,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: Object.keys(resources),
    resources,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: options.storageKey ?? DEFAULT_STORAGE_KEY,
    },
  });

  activeInstance = instance;
  instance.on("languageChanged", () => {
    localeChangeBus.dispatchEvent(new Event("change"));
  });
  // Components mounted before this app ever called initI18n only knew
  // their hardcoded English defaults — let them pick up the resolved
  // locale (which may already be non-English) right away.
  localeChangeBus.dispatchEvent(new Event("change"));

  return instance;
}

/** The instance the last `initI18n` call produced, or `undefined` if no
 * app in this page has called it yet. */
export function getI18n(): I18nInstance | undefined {
  return activeInstance;
}

/**
 * Translates a `web-ui-kit`-own string, interpolating `{{var}}` placeholders
 * from `vars` (i18next's own interpolation syntax, applied consistently
 * whether or not a real translation is available). Returns `defaultValue`
 * (interpolated) verbatim — never a raw i18next key, never blank — whenever
 * no app has called `initI18n` yet, or the key is missing from every
 * catalog. This is what keeps standalone components
 * (`<wuik-shortcuts-panel>`, `<wuik-slider>`, `<wuik-color-picker>`)
 * working unchanged for a consumer that never sets up i18n at all.
 */
export function t(
  key: string,
  defaultValue: string,
  vars?: Record<string, string>,
): string {
  if (activeInstance === undefined || !activeInstance.isInitialized) {
    return interpolate(defaultValue, vars);
  }
  return activeInstance.t(key, { ns: WUIK_NAMESPACE, defaultValue, ...vars });
}

function interpolate(
  template: string,
  vars: Record<string, string> = {},
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? vars[name] : match,
  );
}

/**
 * Subscribes to every locale change on whichever instance is active at the
 * time of the change (not just the one active when subscribing — see
 * `.vibe/decisions/013-...md`). Returns an unsubscribe function.
 */
export function onLocaleChange(callback: () => void): () => void {
  localeChangeBus.addEventListener("change", callback);
  return () => localeChangeBus.removeEventListener("change", callback);
}

/** Every locale code available on `instance` (the union of the app's own
 * catalog and `web-ui-kit`'s own), for `<wuik-locale-switcher>` to list. */
export function getSupportedLocales(instance: I18nInstance): string[] {
  return Object.keys(instance.options.resources ?? {});
}
