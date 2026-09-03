/** The exact set of files `npm publish` is expected to ship — the built
 * output plus the metadata files npm always includes, nothing from
 * source or tests. Kept in sync by hand with package.json's `files`
 * field; a mismatch here is exactly the kind of mistake that would
 * otherwise burn a version number permanently once published. */
const EXPECTED_FILES = [
  "LICENSE",
  "README.md",
  "dist/visual-preset.js",
  "dist/web-ui-kit.css",
  "dist/web-ui-kit.js",
  "package.json",
] as const;

/** Validates that a packed tarball's file list is exactly the expected
 * set — no unexpected extra file (e.g. leaked source/test files), and
 * nothing missing. Returns a descriptive error message, or `null` if
 * the file list is valid. */
export function validatePackFileList(files: readonly string[]): string | null {
  const actual = new Set(files);
  const expected = new Set<string>(EXPECTED_FILES);

  const unexpected = files.filter((file) => !expected.has(file));
  if (unexpected.length > 0) {
    return `Unexpected file(s) in package: ${unexpected.join(", ")}`;
  }

  const missing = EXPECTED_FILES.filter((file) => !actual.has(file));
  if (missing.length > 0) {
    return `Missing expected file(s) in package: ${missing.join(", ")}`;
  }

  return null;
}
