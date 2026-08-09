import { describe, expect, it } from "vitest";
import { normalizeHexColor, parsePalette } from "./color-picker-color.ts";

describe("normalizeHexColor", () => {
  it("lowercases and keeps a well-formed 6-digit hex color", () => {
    expect(normalizeHexColor("#FF00AA")).toEqual({
      value: "#ff00aa",
      invalid: false,
    });
  });

  it("falls back to black when no value is given (edge case)", () => {
    expect(normalizeHexColor(null)).toEqual({
      value: "#000000",
      invalid: false,
    });
  });

  it("expands a 3-digit shorthand hex color to its 6-digit form (edge case)", () => {
    expect(normalizeHexColor("#0F0")).toEqual({
      value: "#00ff00",
      invalid: false,
    });
  });

  it("falls back to black and flags invalid for a malformed color string (error path)", () => {
    expect(normalizeHexColor("not-a-color")).toEqual({
      value: "#000000",
      invalid: true,
    });
  });

  it("falls back to black and flags invalid for a hex string of the wrong length (error path)", () => {
    expect(normalizeHexColor("#1234")).toEqual({
      value: "#000000",
      invalid: true,
    });
  });
});

describe("parsePalette", () => {
  it("parses a comma-separated list of well-formed hex colors", () => {
    expect(parsePalette("#ff0000, #00ff00, #0000ff")).toEqual([
      "#ff0000",
      "#00ff00",
      "#0000ff",
    ]);
  });

  it("returns an empty list when no palette attribute is given (edge case)", () => {
    expect(parsePalette(null)).toEqual([]);
  });

  it("silently drops malformed entries rather than failing the whole list (error path)", () => {
    expect(parsePalette("#ff0000, not-a-color, #0000ff")).toEqual([
      "#ff0000",
      "#0000ff",
    ]);
  });
});
