/**
 * Pure hex-color parsing/validation for `<wuik-color-picker>`, kept
 * separate from DOM/event glue (`color-picker.ts`) so the rules can be
 * tested directly. A malformed `value` falls back to the default color and
 * is flagged `invalid` so the component can show a visible indicator
 * rather than silently substituting a value — see
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 */

const HEX_3 = /^#([0-9a-f]{3})$/i;
const HEX_6 = /^#([0-9a-f]{6})$/i;

export const DEFAULT_COLOR = "#000000";

export interface NormalizedColor {
  readonly value: string;
  readonly invalid: boolean;
}

/** Expands `#abc` to `#aabbcc` and lowercases; `#rrggbb` is lowercased as-is. */
export function normalizeHexColor(raw: string | null): NormalizedColor {
  if (raw === null) {
    return { value: DEFAULT_COLOR, invalid: false };
  }
  if (HEX_6.test(raw)) {
    return { value: raw.toLowerCase(), invalid: false };
  }
  const shortMatch = raw.match(HEX_3);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].toLowerCase().split("");
    return { value: `#${r}${r}${g}${g}${b}${b}`, invalid: false };
  }
  return { value: DEFAULT_COLOR, invalid: true };
}

/** Parses a comma-separated palette list, silently dropping malformed entries. */
export function parsePalette(raw: string | null): string[] {
  if (raw === null) {
    return [];
  }
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => HEX_3.test(entry) || HEX_6.test(entry))
    .map((entry) => normalizeHexColor(entry).value);
}
