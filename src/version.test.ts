import { describe, expect, it } from "vitest";
import { version } from "./version.ts";

describe("version", () => {
  it("is a non-empty semantic version string", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
