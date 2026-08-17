import { describe, expect, it } from "vitest";
import { isReservedCombo, normalizeKeyCombo } from "./shortcut-key.ts";

function makeEvent(overrides: Partial<KeyboardEvent>) {
  return {
    key: "a",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe("normalizeKeyCombo", () => {
  it("builds a combo string from a modifier plus a letter key", () => {
    expect(normalizeKeyCombo(makeEvent({ key: "s", ctrlKey: true }))).toBe(
      "Ctrl+S",
    );
  });

  it("combines multiple modifiers in a stable order", () => {
    expect(
      normalizeKeyCombo(makeEvent({ key: "s", ctrlKey: true, shiftKey: true })),
    ).toBe("Ctrl+Shift+S");
  });

  it("keeps a non-letter key name as-is (e.g. a function key)", () => {
    expect(normalizeKeyCombo(makeEvent({ key: "F5" }))).toBe("F5");
  });

  it("returns undefined for a modifier key pressed alone", () => {
    expect(normalizeKeyCombo(makeEvent({ key: "Shift", shiftKey: true }))).toBe(
      undefined,
    );
    expect(
      normalizeKeyCombo(makeEvent({ key: "Control", ctrlKey: true })),
    ).toBe(undefined);
  });
});

describe("isReservedCombo", () => {
  it("flags a well-known browser-reserved combo", () => {
    expect(isReservedCombo("Ctrl+W")).toBe(true);
  });

  it("does not flag an ordinary, unreserved combo", () => {
    expect(isReservedCombo("Ctrl+S")).toBe(false);
  });
});
