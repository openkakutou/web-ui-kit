/** `npm pack --dry-run --json`'s top-level shape changed across major npm
 * versions: npm <12 returns an array of one entry; npm >=12 returns an
 * object keyed by package name, same entry shape as its value. Handling
 * both means CI (which always installs npm@latest) doesn't silently
 * break the pack-content guard the moment npm ships another major. */
export function extractPackedFilePaths(parsed: unknown): string[] {
  const entry = Array.isArray(parsed)
    ? parsed[0]
    : parsed !== null && typeof parsed === "object"
      ? Object.values(parsed)[0]
      : undefined;

  if (
    entry === undefined ||
    entry === null ||
    typeof entry !== "object" ||
    !("files" in entry) ||
    !Array.isArray((entry as { files: unknown }).files)
  ) {
    throw new Error(
      "extractPackedFilePaths: unrecognized `npm pack --json` output shape",
    );
  }

  return (entry as { files: { path: string }[] }).files.map(
    (file) => file.path,
  );
}
