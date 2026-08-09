import { describe, expect, it } from "vitest";
import { extractPackedFilePaths } from "./parse-pack-output.ts";

describe("extractPackedFilePaths", () => {
  it("reads the file list from npm <12's array-shaped output", () => {
    const legacyOutput = [
      {
        name: "@openkakutou/web-ui-kit",
        files: [{ path: "package.json" }, { path: "LICENSE" }],
      },
    ];
    expect(extractPackedFilePaths(legacyOutput)).toEqual([
      "package.json",
      "LICENSE",
    ]);
  });

  it("reads the file list from npm >=12's object-keyed-by-package-name output", () => {
    const modernOutput = {
      "@openkakutou/web-ui-kit": {
        name: "@openkakutou/web-ui-kit",
        files: [{ path: "package.json" }, { path: "LICENSE" }],
      },
    };
    expect(extractPackedFilePaths(modernOutput)).toEqual([
      "package.json",
      "LICENSE",
    ]);
  });

  it("throws a descriptive error when the shape matches neither format", () => {
    expect(() => extractPackedFilePaths({})).toThrow(/unrecognized/i);
    expect(() => extractPackedFilePaths([])).toThrow(/unrecognized/i);
    expect(() => extractPackedFilePaths(null)).toThrow(/unrecognized/i);
  });
});
