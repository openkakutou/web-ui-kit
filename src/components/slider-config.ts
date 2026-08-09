/**
 * Pure attribute-resolution logic for `<wuik-slider>`, kept separate from
 * DOM/event glue (`slider.ts`) so the validation rules can be tested
 * directly. A malformed *configuration* (non-numeric min/max/step, or
 * min >= max) falls back to sane defaults and is flagged `invalid` so the
 * component can show a visible indicator — see
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`. A
 * well-formed `value` that merely sits outside [min, max] is just clamped,
 * matching native `<input type="range">` behavior — that is not an error.
 */

export interface SliderConfig {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly invalid: boolean;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;

function parseFiniteNumber(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveSliderConfig(attributes: {
  min: string | null;
  max: string | null;
  step: string | null;
  value: string | null;
}): SliderConfig {
  let invalid = false;

  const rawMin = parseFiniteNumber(attributes.min);
  const rawMax = parseFiniteNumber(attributes.max);
  if (attributes.min !== null && rawMin === undefined) {
    invalid = true;
  }
  if (attributes.max !== null && rawMax === undefined) {
    invalid = true;
  }

  let min = rawMin ?? DEFAULT_MIN;
  let max = rawMax ?? DEFAULT_MAX;
  if (min >= max) {
    invalid = true;
    min = DEFAULT_MIN;
    max = DEFAULT_MAX;
  }

  const rawStep = parseFiniteNumber(attributes.step);
  if (attributes.step !== null && rawStep === undefined) {
    invalid = true;
  }
  const step = rawStep !== undefined && rawStep > 0 ? rawStep : DEFAULT_STEP;
  if (rawStep !== undefined && rawStep <= 0) {
    invalid = true;
  }

  const rawValue = parseFiniteNumber(attributes.value);
  if (attributes.value !== null && rawValue === undefined) {
    invalid = true;
  }
  const unclampedValue = rawValue ?? min;
  const value = Math.min(max, Math.max(min, unclampedValue));

  return { min, max, step, value, invalid };
}
