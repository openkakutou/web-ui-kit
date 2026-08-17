import { describe, expect, it } from "vitest";
import { WUIK_NAMESPACE, buildResources } from "./i18n-resources.ts";

describe("buildResources", () => {
  it("merges the app's catalog and wuik's own catalog under their own namespace, per locale", () => {
    const result = buildResources(
      "demo-app",
      { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } },
      { en: { rebind: "Rebind" }, fr: { rebind: "Réassigner" } },
    );

    expect(result).toEqual({
      en: {
        [WUIK_NAMESPACE]: { rebind: "Rebind" },
        "demo-app": { greeting: "Hello" },
      },
      fr: {
        [WUIK_NAMESPACE]: { rebind: "Réassigner" },
        "demo-app": { greeting: "Bonjour" },
      },
    });
  });

  it("still produces an entry for a locale the app provides but wuik does not (empty wuik catalog for it)", () => {
    const result = buildResources(
      "demo-app",
      { de: { greeting: "Hallo" } },
      { en: { rebind: "Rebind" } },
    );

    expect(result.de).toEqual({
      [WUIK_NAMESPACE]: {},
      "demo-app": { greeting: "Hallo" },
    });
  });

  it("still produces an entry for a locale wuik provides but the app does not (empty app catalog for it)", () => {
    const result = buildResources(
      "demo-app",
      { en: { greeting: "Hello" } },
      { en: { rebind: "Rebind" }, fr: { rebind: "Réassigner" } },
    );

    expect(result.fr).toEqual({
      [WUIK_NAMESPACE]: { rebind: "Réassigner" },
      "demo-app": {},
    });
  });

  it("returns an empty object, not a crash, when both inputs are empty", () => {
    expect(buildResources("demo-app", {}, {})).toEqual({});
  });
});
