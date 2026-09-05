/**
 * Pure option-list resolution for `<wuik-radio-group>`, kept separate from
 * DOM/event glue (`radio-group.ts`) so the rules can be tested directly. An
 * individual malformed option (missing/blank `value`) is dropped silently,
 * mirroring `wuik-color-picker`'s per-entry palette handling
 * (`color-picker-color.ts`). A duplicate `value` across options is instead a
 * *group* configuration error — flagged `invalid` so the component can show
 * a visible indicator, keeping only the first occurrence so the group still
 * renders something selectable. See
 * `.vibe/decisions/016-radio-group-options-as-light-dom-children.md`.
 */

export interface RadioGroupOption {
  readonly value: string;
  readonly label: string;
}

export interface RawRadioGroupOption {
  readonly value: string | null;
  readonly label: string;
}

export interface ResolvedRadioGroupOptions {
  readonly options: RadioGroupOption[];
  readonly invalid: boolean;
  readonly duplicateValue?: string;
}

export function resolveRadioGroupOptions(
  raw: RawRadioGroupOption[],
): ResolvedRadioGroupOptions {
  const seen = new Set<string>();
  const options: RadioGroupOption[] = [];
  let duplicateValue: string | undefined;

  for (const entry of raw) {
    const value = entry.value?.trim();
    if (!value) {
      continue;
    }
    if (seen.has(value)) {
      duplicateValue ??= value;
      continue;
    }
    seen.add(value);
    options.push({ value, label: entry.label });
  }

  return { options, invalid: duplicateValue !== undefined, duplicateValue };
}
