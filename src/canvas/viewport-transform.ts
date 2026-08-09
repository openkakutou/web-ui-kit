/**
 * Pure zoom/pan/fit math for `<wuik-viewport>` (`viewport.ts`), kept
 * separate from DOM/event glue so it can be tested directly — same
 * separation this repo already uses for `slider-config.ts`,
 * `color-picker-color.ts`, and `file-drop-zone-accept.ts`. A malformed
 * *configuration* (non-numeric `min-scale`/`max-scale`/`zoom-step`, a
 * non-positive scale bound, or `minScale >= maxScale`) falls back to sane
 * defaults and is flagged `invalid` so the component can show a visible
 * indicator — see `.vibe/decisions/007-form-input-components-shared-conventions.md`
 * for the shared convention this follows.
 */

export interface ViewportTransform {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

export interface ViewportConfig {
  readonly minScale: number;
  readonly maxScale: number;
  readonly zoomStep: number;
  readonly invalid: boolean;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 8;
const DEFAULT_ZOOM_STEP = 0.1;

function parseFiniteNumber(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveViewportConfig(attributes: {
  minScale: string | null;
  maxScale: string | null;
  zoomStep: string | null;
}): ViewportConfig {
  let invalid = false;

  const rawMinScale = parseFiniteNumber(attributes.minScale);
  if (attributes.minScale !== null && rawMinScale === undefined) {
    invalid = true;
  }
  const rawMaxScale = parseFiniteNumber(attributes.maxScale);
  if (attributes.maxScale !== null && rawMaxScale === undefined) {
    invalid = true;
  }

  let minScale = rawMinScale ?? DEFAULT_MIN_SCALE;
  let maxScale = rawMaxScale ?? DEFAULT_MAX_SCALE;
  if (minScale <= 0 || maxScale <= 0 || minScale >= maxScale) {
    invalid = true;
    minScale = DEFAULT_MIN_SCALE;
    maxScale = DEFAULT_MAX_SCALE;
  }

  const rawZoomStep = parseFiniteNumber(attributes.zoomStep);
  if (attributes.zoomStep !== null && rawZoomStep === undefined) {
    invalid = true;
  }
  const zoomStep =
    rawZoomStep !== undefined && rawZoomStep > 0
      ? rawZoomStep
      : DEFAULT_ZOOM_STEP;
  if (rawZoomStep !== undefined && rawZoomStep <= 0) {
    invalid = true;
  }

  return { minScale, maxScale, zoomStep, invalid };
}

export function clampScale(scale: number, config: ViewportConfig): number {
  return Math.min(config.maxScale, Math.max(config.minScale, scale));
}

/**
 * Zooms by `factor`, keeping the content-space point under
 * (`originX`, `originY`) visually fixed — the standard "zoom at cursor"
 * behavior. The new scale is clamped to `config`'s bounds; if the clamp
 * fully absorbs the zoom (already at a limit), position is left unchanged.
 */
export function zoomAtPoint(
  transform: ViewportTransform,
  config: ViewportConfig,
  factor: number,
  originX: number,
  originY: number,
): ViewportTransform {
  const scale = clampScale(transform.scale * factor, config);
  const ratio = scale / transform.scale;
  return {
    scale,
    x: originX - (originX - transform.x) * ratio,
    y: originY - (originY - transform.y) * ratio,
  };
}

export function panBy(
  transform: ViewportTransform,
  dx: number,
  dy: number,
): ViewportTransform {
  return { scale: transform.scale, x: transform.x + dx, y: transform.y + dy };
}

/**
 * Computes a transform that fits `content` into `container`, centered,
 * preserving aspect ratio (uniform scale — a content aspect ratio that
 * doesn't match the container's letterboxes against the host background,
 * by design). Falls back to an untransformed identity when either size is
 * not yet known (zero width/height), instead of producing `NaN`/`Infinity`.
 */
export function computeFitTransform(
  container: Size,
  content: Size,
  config: ViewportConfig,
): ViewportTransform {
  if (
    container.width <= 0 ||
    container.height <= 0 ||
    content.width <= 0 ||
    content.height <= 0
  ) {
    return { scale: 1, x: 0, y: 0 };
  }

  const fitScale = Math.min(
    container.width / content.width,
    container.height / content.height,
  );
  const scale = clampScale(fitScale, config);
  const x = (container.width - content.width * scale) / 2;
  const y = (container.height - content.height * scale) / 2;
  return { scale, x, y };
}
