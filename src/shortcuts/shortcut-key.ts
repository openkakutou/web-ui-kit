/**
 * Pure keyboard-combo normalization and reserved-combo detection for the
 * shortcut manager, kept separate from DOM/event glue (`shortcut-panel.ts`)
 * so the rules can be tested directly without dispatching real key events.
 */

const MODIFIER_KEY_NAMES = new Set(["Shift", "Control", "Alt", "Meta"]);

interface ComboSourceEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Builds a stable combo string (e.g. `"Ctrl+Shift+S"`) from a keyboard
 * event. Modifier order is always Ctrl, Meta, Alt, Shift. Returns
 * `undefined` when the event is a modifier key pressed on its own — that
 * is not a usable shortcut, just a step toward one.
 */
export function normalizeKeyCombo(event: ComboSourceEvent): string | undefined {
  if (MODIFIER_KEY_NAMES.has(event.key)) {
    return undefined;
  }

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  parts.push(key);
  return parts.join("+");
}

/**
 * A conservative, non-exhaustive list of combos that browsers or the OS
 * reserve for themselves — even with `preventDefault()`, several of these
 * never actually reach page JavaScript in at least one major browser.
 * Consumers targeting a specific platform should still verify their own
 * shortcuts there; this list exists to give users an honest rejection
 * instead of a binding that silently never fires.
 */
const RESERVED_COMBOS = new Set([
  "Ctrl+W",
  "Ctrl+Tab",
  "Ctrl+N",
  "Ctrl+T",
  "Ctrl+Shift+Tab",
  "Alt+F4",
  "Meta+Q",
  "Meta+W",
  "F5",
  "F11",
  "F12",
]);

export function isReservedCombo(combo: string): boolean {
  return RESERVED_COMBOS.has(combo);
}
