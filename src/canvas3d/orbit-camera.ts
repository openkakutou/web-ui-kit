/**
 * Pure orbit-camera math for `<wuik-viewport-3d>` (`viewport-3d.ts`), kept
 * separate from DOM/event glue so it can be tested directly — same split
 * this repo already uses for `viewport-transform.ts` (`src/canvas/`) and
 * the form/input components' own validation modules.
 *
 * This module never touches a WebGL context, a renderer, or any consumer
 * scene: it only tracks a camera as spherical coordinates (azimuth,
 * elevation, distance) around a target point and derives a Cartesian
 * position from them — see
 * `.vibe/decisions/010-3d-viewport-controls-integration-contract.md` for
 * why the component built on top of it never owns rendering.
 *
 * A malformed *configuration* (non-numeric `min-distance`/`max-distance`/
 * `zoom-step`, a non-positive distance bound, or `minDistance >=
 * maxDistance`) falls back to sane defaults and is flagged `invalid` so the
 * component can show a visible indicator — same shared convention as
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 */

export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface OrbitCameraConfig {
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly zoomStep: number;
  readonly invalid: boolean;
}

export interface OrbitCameraState {
  readonly target: Vector3;
  readonly distance: number;
  readonly azimuth: number;
  readonly elevation: number;
}

export interface CameraSnapshot extends OrbitCameraState {
  readonly position: Vector3;
}

const DEFAULT_MIN_DISTANCE = 1;
const DEFAULT_MAX_DISTANCE = 100;
const DEFAULT_ZOOM_STEP = 0.1;
const DEFAULT_DISTANCE = 10;
const DEFAULT_AZIMUTH = 0;
const DEFAULT_ELEVATION = Math.PI / 3;

/**
 * Fixed margin (radians) kept away from the poles (elevation 0 or π) so the
 * camera can never pass exactly overhead/underneath and flip its apparent
 * rotation direction — see decision `010`. Not configurable: the entire
 * point is preventing that disorientation, which a wide or near-zero
 * configured margin would defeat.
 */
const ELEVATION_EPSILON = 0.05;

/**
 * How fast `panBy` moves the target per unit of drag input, scaled by the
 * camera's current distance so a pan feels proportional whether zoomed in
 * or out (matching the standard orbit-camera convention).
 */
const PAN_SPEED_FACTOR = 0.002;

const WORLD_UP: Vector3 = { x: 0, y: 1, z: 0 };
const TWO_PI = 2 * Math.PI;

function parseFiniteNumber(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveOrbitCameraConfig(attributes: {
  minDistance: string | null;
  maxDistance: string | null;
  zoomStep: string | null;
}): OrbitCameraConfig {
  let invalid = false;

  const rawMinDistance = parseFiniteNumber(attributes.minDistance);
  if (attributes.minDistance !== null && rawMinDistance === undefined) {
    invalid = true;
  }
  const rawMaxDistance = parseFiniteNumber(attributes.maxDistance);
  if (attributes.maxDistance !== null && rawMaxDistance === undefined) {
    invalid = true;
  }

  let minDistance = rawMinDistance ?? DEFAULT_MIN_DISTANCE;
  let maxDistance = rawMaxDistance ?? DEFAULT_MAX_DISTANCE;
  if (minDistance <= 0 || maxDistance <= 0 || minDistance >= maxDistance) {
    invalid = true;
    minDistance = DEFAULT_MIN_DISTANCE;
    maxDistance = DEFAULT_MAX_DISTANCE;
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

  return { minDistance, maxDistance, zoomStep, invalid };
}

/** The documented default view: looking at the world origin from a 3/4 angle. */
export function defaultOrbitCameraState(): OrbitCameraState {
  return {
    target: { x: 0, y: 0, z: 0 },
    distance: DEFAULT_DISTANCE,
    azimuth: DEFAULT_AZIMUTH,
    elevation: DEFAULT_ELEVATION,
  };
}

export function clampDistance(
  distance: number,
  config: OrbitCameraConfig,
): number {
  return Math.min(config.maxDistance, Math.max(config.minDistance, distance));
}

export function clampElevation(elevation: number): number {
  return Math.min(
    Math.PI - ELEVATION_EPSILON,
    Math.max(ELEVATION_EPSILON, elevation),
  );
}

/** Wraps an angle into `[0, 2π)` so repeated orbiting never grows unbounded. */
export function normalizeAzimuth(azimuth: number): number {
  return ((azimuth % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Orbits by the given azimuth/elevation deltas. Azimuth wraps freely;
 * elevation is hard-clamped away from the poles (see `ELEVATION_EPSILON`)
 * so the camera can never flip past top/bottom-dead-center.
 */
export function orbitBy(
  state: OrbitCameraState,
  deltaAzimuth: number,
  deltaElevation: number,
): OrbitCameraState {
  return {
    target: state.target,
    distance: state.distance,
    azimuth: normalizeAzimuth(state.azimuth + deltaAzimuth),
    elevation: clampElevation(state.elevation + deltaElevation),
  };
}

/**
 * Dollies the camera toward (`factor` > 1) or away from (`factor` < 1) the
 * target point. Always target-relative, never cursor-relative — see
 * decision `010` for why: cursor-relative zoom would need to unproject the
 * cursor into the consumer's 3D scene, which this render-agnostic
 * component deliberately has no knowledge of.
 */
export function zoomBy(
  state: OrbitCameraState,
  config: OrbitCameraConfig,
  factor: number,
): OrbitCameraState {
  return {
    ...state,
    distance: clampDistance(state.distance / factor, config),
  };
}

function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function length(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v: Vector3): Vector3 {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** The camera's position in world space, derived from its spherical coordinates around `target`. */
export function sphericalToCartesian(state: OrbitCameraState): Vector3 {
  const sinElevation = Math.sin(state.elevation);
  return {
    x: state.target.x + state.distance * sinElevation * Math.sin(state.azimuth),
    y: state.target.y + state.distance * Math.cos(state.elevation),
    z: state.target.z + state.distance * sinElevation * Math.cos(state.azimuth),
  };
}

/**
 * Pans by moving the target along the camera's own right/up basis vectors
 * (derived from its current position, looking at its current target),
 * scaled by the camera's distance so a pan feels proportional at any zoom
 * level — the standard orbit-camera convention. Deliberately unbounded:
 * see decision `010` for why pan distance is not clamped to a radius
 * (the component has no notion of the consumer's actual scene scale), and
 * why an always-visible reset action is the intended way back instead.
 */
export function panBy(
  state: OrbitCameraState,
  dx: number,
  dy: number,
): OrbitCameraState {
  const position = sphericalToCartesian(state);
  const forward = normalize(subtract(state.target, position));
  const right = normalize(cross(forward, WORLD_UP));
  const up = cross(right, forward);
  const scale = state.distance * PAN_SPEED_FACTOR;

  return {
    ...state,
    target: {
      x: state.target.x - right.x * dx * scale + up.x * dy * scale,
      y: state.target.y - right.y * dx * scale + up.y * dy * scale,
      z: state.target.z - right.z * dx * scale + up.z * dy * scale,
    },
  };
}

/**
 * Feature-detects WebGL support by attempting to obtain a WebGL2 or WebGL
 * rendering context from a canvas. `createCanvas` is injectable for tests;
 * it defaults to a real `<canvas>`, which under this project's `jsdom`
 * test environment always yields `null` (jsdom implements no WebGL
 * context), so the default path itself already exercises the
 * "unsupported" branch for real — see `docs/testing.md`.
 */
export function detectWebglSupport(
  createCanvas: () => { getContext(type: string): unknown } = () =>
    document.createElement("canvas"),
): boolean {
  try {
    const canvas = createCanvas();
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
