/**
 * Pure validity-resolution logic for `<wuik-text-input>` (`text-input.ts`),
 * kept separate from the component's DOM/event glue — mirrors the existing
 * split for the other form/input components (`slider-config.ts`,
 * `color-picker-color.ts`, `radio-group-options.ts`).
 *
 * See `.vibe/decisions/024-text-input-visible-label-and-blur-validation.md`
 * for why validation only starts after the field has been touched, and why
 * an explicit `error` always wins over the built-in required check.
 */

export interface TextInputValidityInput {
  /** Whether the field is marked required. */
  required: boolean;
  /** The field's current value. */
  value: string;
  /** A consumer-supplied validation message, or `null`/blank for none. */
  error: string | null;
  /** Whether the field has been blurred at least once. */
  touched: boolean;
}

export type TextInputValidityReason = "custom" | "required" | null;

export interface TextInputValidity {
  invalid: boolean;
  reason: TextInputValidityReason;
}

/**
 * Resolves whether `<wuik-text-input>` should show its built-in invalid
 * state, and why. An explicit, non-blank `error` always takes priority over
 * the required-and-empty check; the required check itself never fires
 * before `touched` is true, so a freshly-rendered empty required field
 * stays visually neutral until the user has actually left it blank.
 */
export function resolveTextInputValidity(
  input: TextInputValidityInput,
): TextInputValidity {
  const hasExplicitError = input.error !== null && input.error.trim() !== "";
  if (hasExplicitError) {
    return { invalid: true, reason: "custom" };
  }

  const isBlank = input.value.trim() === "";
  if (input.required && input.touched && isBlank) {
    return { invalid: true, reason: "required" };
  }

  return { invalid: false, reason: null };
}
