/**
 * Display names for `<wuik-locale-switcher>`'s option list. Deliberately
 * endonyms (each locale's name written in its own language — "Français",
 * not "French") so a user can recognize their own language even while the
 * UI is currently showing one they don't read.
 */

const DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
};

/** Falls back to the raw locale code for one this kit doesn't know yet,
 * rather than an empty label. */
export function localeDisplayName(code: string): string {
  return DISPLAY_NAMES[code] ?? code;
}
