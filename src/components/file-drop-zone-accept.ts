/**
 * Pure matching logic for `<wuik-file-drop-zone>`'s `accept` attribute,
 * kept separate from DOM/event glue (`file-drop-zone.ts`) so the matching
 * rules can be tested directly without mounting a component or simulating
 * drag events.
 *
 * `accept` is a comma-separated list of patterns, each one of:
 * - a file extension, e.g. `.png` (matched against the file name, case-insensitive)
 * - a MIME type group wildcard, e.g. `image/*` (matched against the file's MIME type prefix)
 * - an exact MIME type, e.g. `image/png`
 */

export interface AcceptableFile {
  readonly name: string;
  readonly type: string;
}

export function matchesAccept(
  file: AcceptableFile,
  accept: string | null | undefined,
): boolean {
  const patterns = (accept ?? "")
    .split(",")
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length > 0);

  if (patterns.length === 0) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return patterns.some((pattern) => {
    const lowerPattern = pattern.toLowerCase();
    if (lowerPattern.startsWith(".")) {
      return fileName.endsWith(lowerPattern);
    }
    if (lowerPattern.endsWith("/*")) {
      return fileType.startsWith(lowerPattern.slice(0, -1));
    }
    return fileType === lowerPattern;
  });
}
