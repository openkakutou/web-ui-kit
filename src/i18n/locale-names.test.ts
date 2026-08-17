import { describe, expect, it } from "vitest";
import { localeDisplayName } from "./locale-names.ts";

describe("localeDisplayName", () => {
  it("returns the English endonym for the en locale", () => {
    expect(localeDisplayName("en")).toBe("English");
  });

  it("returns the French endonym for the fr locale", () => {
    expect(localeDisplayName("fr")).toBe("Français");
  });

  it("falls back to the raw code for an unknown locale instead of an empty label", () => {
    expect(localeDisplayName("de")).toBe("de");
  });
});
