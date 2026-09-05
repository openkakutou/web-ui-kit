import { describe, expect, it } from "vitest";
import { resolveRadioGroupOptions } from "./radio-group-options.ts";

describe("resolveRadioGroupOptions", () => {
  it("keeps every well-formed option in order", () => {
    const result = resolveRadioGroupOptions([
      { value: "fight.def", label: "fight.def" },
      { value: "fight2.def", label: "fight2.def" },
    ]);

    expect(result).toEqual({
      options: [
        { value: "fight.def", label: "fight.def" },
        { value: "fight2.def", label: "fight2.def" },
      ],
      invalid: false,
      duplicateValue: undefined,
    });
  });

  it("drops an option with a missing value attribute, keeping the rest", () => {
    const result = resolveRadioGroupOptions([
      { value: "a", label: "A" },
      { value: null, label: "Untitled" },
      { value: "b", label: "B" },
    ]);

    expect(result.options).toEqual([
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ]);
    expect(result.invalid).toBe(false);
  });

  it("drops an option with a blank (whitespace-only) value attribute", () => {
    const result = resolveRadioGroupOptions([
      { value: "a", label: "A" },
      { value: "   ", label: "Blank" },
    ]);

    expect(result.options).toEqual([{ value: "a", label: "A" }]);
    expect(result.invalid).toBe(false);
  });

  it("flags a duplicate option value as invalid and keeps only the first occurrence", () => {
    const result = resolveRadioGroupOptions([
      { value: "a", label: "First A" },
      { value: "b", label: "B" },
      { value: "a", label: "Second A" },
    ]);

    expect(result.options).toEqual([
      { value: "a", label: "First A" },
      { value: "b", label: "B" },
    ]);
    expect(result.invalid).toBe(true);
    expect(result.duplicateValue).toBe("a");
  });

  it("returns an empty, valid result when given no options at all", () => {
    const result = resolveRadioGroupOptions([]);

    expect(result).toEqual({
      options: [],
      invalid: false,
      duplicateValue: undefined,
    });
  });
});
