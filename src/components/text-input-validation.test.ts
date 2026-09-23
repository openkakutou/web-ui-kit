import { describe, expect, it } from "vitest";
import { resolveTextInputValidity } from "./text-input-validation.ts";

describe("resolveTextInputValidity", () => {
  it("is valid when not required, untouched, and empty (nominal, pristine field)", () => {
    const result = resolveTextInputValidity({
      required: false,
      value: "",
      error: null,
      touched: false,
    });
    expect(result).toEqual({ invalid: false, reason: null });
  });

  it("is valid when required but not yet touched, even if empty (no shouting on first paint)", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "",
      error: null,
      touched: false,
    });
    expect(result).toEqual({ invalid: false, reason: null });
  });

  it("is invalid with reason 'required' when required, touched, and empty", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "",
      error: null,
      touched: true,
    });
    expect(result).toEqual({ invalid: true, reason: "required" });
  });

  it("is invalid with reason 'required' when the touched value is whitespace-only", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "   ",
      error: null,
      touched: true,
    });
    expect(result).toEqual({ invalid: true, reason: "required" });
  });

  it("is valid when required, touched, and the value has real content", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "Ryu",
      error: null,
      touched: true,
    });
    expect(result).toEqual({ invalid: false, reason: null });
  });

  it("is invalid with reason 'custom' when an explicit error is set, even if not required", () => {
    const result = resolveTextInputValidity({
      required: false,
      value: "anything",
      error: "Name already taken.",
      touched: false,
    });
    expect(result).toEqual({ invalid: true, reason: "custom" });
  });

  it("prioritizes the explicit error over the built-in required check", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "",
      error: "Name already taken.",
      touched: true,
    });
    expect(result).toEqual({ invalid: true, reason: "custom" });
  });

  it("treats a blank/whitespace-only error string as no explicit error", () => {
    const result = resolveTextInputValidity({
      required: true,
      value: "",
      error: "   ",
      touched: true,
    });
    expect(result).toEqual({ invalid: true, reason: "required" });
  });
});
