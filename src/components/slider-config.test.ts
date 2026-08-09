import { describe, expect, it } from "vitest";
import { resolveSliderConfig } from "./slider-config.ts";

describe("resolveSliderConfig", () => {
  it("resolves well-formed attributes to their numeric values", () => {
    const config = resolveSliderConfig({
      min: "0",
      max: "10",
      step: "2",
      value: "6",
    });
    expect(config).toEqual({
      min: 0,
      max: 10,
      step: 2,
      value: 6,
      invalid: false,
    });
  });

  it("falls back to documented defaults when no attributes are given", () => {
    const config = resolveSliderConfig({
      min: null,
      max: null,
      step: null,
      value: null,
    });
    expect(config).toEqual({
      min: 0,
      max: 100,
      step: 1,
      value: 0,
      invalid: false,
    });
  });

  it("clamps a well-formed out-of-range value without flagging invalid (edge case)", () => {
    const config = resolveSliderConfig({
      min: "0",
      max: "100",
      step: null,
      value: "150",
    });
    expect(config.value).toBe(100);
    expect(config.invalid).toBe(false);
  });

  it("clamps a well-formed value below min without flagging invalid (edge case)", () => {
    const config = resolveSliderConfig({
      min: "10",
      max: "20",
      step: null,
      value: "-5",
    });
    expect(config.value).toBe(10);
    expect(config.invalid).toBe(false);
  });

  it("falls back min to its default and flags invalid when min is non-numeric, keeping a still-valid max (error path)", () => {
    const config = resolveSliderConfig({
      min: "not-a-number",
      max: "10",
      step: null,
      value: "5",
    });
    expect(config.min).toBe(0);
    expect(config.max).toBe(10);
    expect(config.invalid).toBe(true);
  });

  it("falls back to defaults and flags invalid when min is greater than or equal to max (error path)", () => {
    const config = resolveSliderConfig({
      min: "10",
      max: "5",
      step: null,
      value: null,
    });
    expect(config.min).toBe(0);
    expect(config.max).toBe(100);
    expect(config.invalid).toBe(true);
  });

  it("falls back to the default step and flags invalid when step is zero or negative (error path)", () => {
    const config = resolveSliderConfig({
      min: "0",
      max: "10",
      step: "-1",
      value: null,
    });
    expect(config.step).toBe(1);
    expect(config.invalid).toBe(true);
  });
});
