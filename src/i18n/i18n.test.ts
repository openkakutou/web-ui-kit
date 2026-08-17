import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The module holds a module-scoped active-instance singleton (by design —
 * one real app calls `initI18n` once). `vi.resetModules()` + a fresh
 * dynamic import gives each test its own singleton instead of leaking
 * state between tests. */
async function loadModule() {
  vi.resetModules();
  return import("./i18n.ts");
}

/** Overrides both `navigator.language` and `navigator.languages` — the
 * detector's real "navigator" method reads `navigator.languages` first
 * (see `i18next-browser-languagedetector`'s own source), so a stub of
 * `.language` alone is silently ignored under jsdom. */
function setNavigatorLanguage(locale: string): void {
  Object.defineProperty(window.navigator, "language", {
    value: locale,
    configurable: true,
  });
  Object.defineProperty(window.navigator, "languages", {
    value: [locale],
    configurable: true,
  });
}

describe("initI18n / t / onLocaleChange", () => {
  const originalLanguage = window.navigator.language;
  const originalLanguages = window.navigator.languages;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, "language", {
      value: originalLanguage,
      configurable: true,
    });
    Object.defineProperty(window.navigator, "languages", {
      value: originalLanguages,
      configurable: true,
    });
  });

  it("t() returns the given default value before any app has called initI18n", async () => {
    const { t } = await loadModule();

    expect(t("shortcuts.rebind", "Rebind")).toBe("Rebind");
  });

  it("detects the browser locale by default and exposes the app's own catalog", async () => {
    setNavigatorLanguage("en-US");
    const { initI18n } = await loadModule();

    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } },
    });

    expect(instance.resolvedLanguage).toBe("en");
    expect(instance.t("greeting", { ns: "demo-app" })).toBe("Hello");
  });

  it("a persisted localStorage override wins over browser auto-detection", async () => {
    setNavigatorLanguage("en-US");
    window.localStorage.setItem("wuik-locale", "fr");
    const { initI18n } = await loadModule();

    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } },
    });

    expect(instance.resolvedLanguage).toBe("fr");
  });

  it("falls back to the default locale when the browser locale isn't supported", async () => {
    setNavigatorLanguage("es-ES");
    const { initI18n } = await loadModule();

    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } },
    });

    expect(instance.resolvedLanguage).toBe("en");
  });

  it("t() falls back to the given default value for a key missing from every catalog, without throwing", async () => {
    const { initI18n, t } = await loadModule();
    await initI18n({ namespace: "demo-app", resources: { en: {}, fr: {} } });

    expect(t("does.not.exist", "Fallback text")).toBe("Fallback text");
  });

  it("t() interpolates {{vars}} into the default value before any app has called initI18n", async () => {
    const { t } = await loadModule();

    expect(
      t("shortcuts.rebindAriaLabel", "Rebind {{label}}", { label: "Save" }),
    ).toBe("Rebind Save");
  });

  it("t() interpolates {{vars}} into a real translated catalog entry", async () => {
    setNavigatorLanguage("fr-FR");
    const { initI18n, t } = await loadModule();
    await initI18n({ namespace: "demo-app", resources: { en: {}, fr: {} } });

    expect(
      t("shortcuts.rebindAriaLabel", "Rebind {{label}}", { label: "Save" }),
    ).toBe("Réassigner Save");
  });

  it("notifies onLocaleChange subscribers on a real language change, and stops after unsubscribe", async () => {
    const { initI18n, onLocaleChange } = await loadModule();
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    const calls: string[] = [];
    const unsubscribe = onLocaleChange(() => calls.push("changed"));

    await instance.changeLanguage("fr");
    expect(calls).toEqual(["changed"]);

    unsubscribe();
    await instance.changeLanguage("en");
    expect(calls).toEqual(["changed"]);
  });

  it("getSupportedLocales lists every locale present in either catalog", async () => {
    const { initI18n, getSupportedLocales } = await loadModule();
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: { a: "A" }, fr: { a: "A" } },
    });

    expect(getSupportedLocales(instance).sort()).toEqual(["en", "fr"]);
  });
});
