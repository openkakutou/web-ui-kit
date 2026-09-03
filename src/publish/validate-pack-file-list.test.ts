import { describe, expect, it } from "vitest";
import { validatePackFileList } from "./validate-pack-file-list.ts";

const EXACT_EXPECTED_FILES = [
  "LICENSE",
  "README.md",
  "dist/visual-preset.js",
  "dist/web-ui-kit.css",
  "dist/web-ui-kit.js",
  "package.json",
];

describe("validatePackFileList", () => {
  it("accepts the exact expected published file list", () => {
    expect(validatePackFileList(EXACT_EXPECTED_FILES)).toBeNull();
  });

  it("rejects a file list containing an unexpected extra file", () => {
    const result = validatePackFileList([
      ...EXACT_EXPECTED_FILES,
      "src/index.ts",
    ]);
    expect(result).not.toBeNull();
    expect(result).toContain("src/index.ts");
  });

  it("rejects a file list missing an expected file", () => {
    const withoutPackageJson = EXACT_EXPECTED_FILES.filter(
      (f) => f !== "package.json",
    );
    const result = validatePackFileList(withoutPackageJson);
    expect(result).not.toBeNull();
    expect(result).toContain("package.json");
  });

  it("rejects an empty file list", () => {
    const result = validatePackFileList([]);
    expect(result).not.toBeNull();
    expect(result).toContain("LICENSE");
    expect(result).toContain("README.md");
    expect(result).toContain("dist/visual-preset.js");
    expect(result).toContain("dist/web-ui-kit.css");
    expect(result).toContain("dist/web-ui-kit.js");
    expect(result).toContain("package.json");
  });
});
