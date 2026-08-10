import { describe, expect, it } from "vitest";
import {
  clampDistance,
  clampElevation,
  defaultOrbitCameraState,
  detectWebglSupport,
  normalizeAzimuth,
  orbitBy,
  panBy,
  resolveOrbitCameraConfig,
  sphericalToCartesian,
  zoomBy,
} from "./orbit-camera.ts";

describe("resolveOrbitCameraConfig", () => {
  it("resolves well-formed attributes to their exact numeric values", () => {
    const config = resolveOrbitCameraConfig({
      minDistance: "2",
      maxDistance: "50",
      zoomStep: "0.25",
    });
    expect(config).toEqual({
      minDistance: 2,
      maxDistance: 50,
      zoomStep: 0.25,
      invalid: false,
    });
  });

  it("falls back to documented defaults when attributes are absent", () => {
    const config = resolveOrbitCameraConfig({
      minDistance: null,
      maxDistance: null,
      zoomStep: null,
    });
    expect(config).toEqual({
      minDistance: 1,
      maxDistance: 100,
      zoomStep: 0.1,
      invalid: false,
    });
  });

  it("falls back only min-distance and flags invalid when min-distance is non-numeric (error path)", () => {
    const config = resolveOrbitCameraConfig({
      minDistance: "not-a-number",
      maxDistance: "50",
      zoomStep: "0.1",
    });
    expect(config.invalid).toBe(true);
    expect(config.minDistance).toBe(1);
    expect(config.maxDistance).toBe(50);
  });

  it("falls back to defaults and flags invalid when min-distance >= max-distance (error path)", () => {
    const config = resolveOrbitCameraConfig({
      minDistance: "10",
      maxDistance: "5",
      zoomStep: "0.1",
    });
    expect(config.invalid).toBe(true);
    expect(config.minDistance).toBe(1);
    expect(config.maxDistance).toBe(100);
  });

  it("falls back only the zoom step and flags invalid when zoom-step is non-positive (edge case)", () => {
    const config = resolveOrbitCameraConfig({
      minDistance: "2",
      maxDistance: "50",
      zoomStep: "0",
    });
    expect(config.invalid).toBe(true);
    expect(config.minDistance).toBe(2);
    expect(config.maxDistance).toBe(50);
    expect(config.zoomStep).toBe(0.1);
  });
});

describe("defaultOrbitCameraState", () => {
  it("returns the documented default target, distance, azimuth and elevation", () => {
    expect(defaultOrbitCameraState()).toEqual({
      target: { x: 0, y: 0, z: 0 },
      distance: 10,
      azimuth: 0,
      elevation: Math.PI / 3,
    });
  });
});

describe("clampDistance", () => {
  const config = {
    minDistance: 1,
    maxDistance: 100,
    zoomStep: 0.1,
    invalid: false,
  };

  it("passes through a value already within bounds", () => {
    expect(clampDistance(50, config)).toBe(50);
  });

  it("clamps a value below the minimum (edge case)", () => {
    expect(clampDistance(0.2, config)).toBe(1);
  });

  it("clamps a value above the maximum (edge case)", () => {
    expect(clampDistance(500, config)).toBe(100);
  });
});

describe("clampElevation", () => {
  it("passes through a mid-range value", () => {
    expect(clampElevation(Math.PI / 2)).toBe(Math.PI / 2);
  });

  it("clamps away from the top pole so the camera can never flip past it (edge case)", () => {
    expect(clampElevation(0)).toBeCloseTo(0.05);
  });

  it("clamps away from the bottom pole so the camera can never flip past it (edge case)", () => {
    expect(clampElevation(Math.PI)).toBeCloseTo(Math.PI - 0.05);
  });
});

describe("normalizeAzimuth", () => {
  it("wraps a value past a full turn back into [0, 2π) (edge case)", () => {
    expect(normalizeAzimuth(2 * Math.PI + 0.1)).toBeCloseTo(0.1);
  });

  it("wraps a negative value into [0, 2π) (edge case)", () => {
    expect(normalizeAzimuth(-0.1)).toBeCloseTo(2 * Math.PI - 0.1);
  });

  it("passes through a value already within range", () => {
    expect(normalizeAzimuth(1)).toBeCloseTo(1);
  });
});

describe("orbitBy", () => {
  const state = {
    target: { x: 0, y: 0, z: 0 },
    distance: 10,
    azimuth: 0,
    elevation: Math.PI / 3,
  };

  it("adds the azimuth delta and the elevation delta", () => {
    const next = orbitBy(state, 0.5, 0.2);
    expect(next.azimuth).toBeCloseTo(0.5);
    expect(next.elevation).toBeCloseTo(Math.PI / 3 + 0.2);
    expect(next.distance).toBe(10);
    expect(next.target).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("clamps elevation at the pole instead of flipping past it when the delta overshoots (edge case)", () => {
    const next = orbitBy(state, 0, -10);
    expect(next.elevation).toBeCloseTo(0.05);
  });

  it("wraps azimuth past a full turn instead of growing unbounded (edge case)", () => {
    const next = orbitBy(state, 2 * Math.PI + 0.3, 0);
    expect(next.azimuth).toBeCloseTo(0.3);
  });
});

describe("zoomBy", () => {
  const config = {
    minDistance: 1,
    maxDistance: 100,
    zoomStep: 0.1,
    invalid: false,
  };
  const state = {
    target: { x: 0, y: 0, z: 0 },
    distance: 10,
    azimuth: 0,
    elevation: Math.PI / 3,
  };

  it("divides distance by the zoom factor (factor > 1 zooms in)", () => {
    expect(zoomBy(state, config, 2).distance).toBe(5);
  });

  it("increases distance for a factor below 1 (zoom out)", () => {
    expect(zoomBy(state, config, 0.5).distance).toBe(20);
  });

  it("clamps at the minimum distance instead of overshooting past it (edge case)", () => {
    const near = { ...state, distance: 1 };
    expect(zoomBy(near, config, 2).distance).toBe(1);
  });

  it("clamps at the maximum distance instead of overshooting past it (edge case)", () => {
    const far = { ...state, distance: 100 };
    expect(zoomBy(far, config, 0.5).distance).toBe(100);
  });
});

describe("sphericalToCartesian", () => {
  it("places the camera on the +Z axis at the equator, facing the target", () => {
    const position = sphericalToCartesian({
      target: { x: 1, y: 2, z: 3 },
      distance: 5,
      azimuth: 0,
      elevation: Math.PI / 2,
    });
    expect(position.x).toBeCloseTo(1);
    expect(position.y).toBeCloseTo(2);
    expect(position.z).toBeCloseTo(8);
  });

  it("places the camera on the +X axis at the equator when azimuth is a quarter turn (edge case)", () => {
    const position = sphericalToCartesian({
      target: { x: 0, y: 0, z: 0 },
      distance: 5,
      azimuth: Math.PI / 2,
      elevation: Math.PI / 2,
    });
    expect(position.x).toBeCloseTo(5);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });
});

describe("panBy", () => {
  // At azimuth 0, elevation PI/2, the camera sits on +Z looking at the
  // origin, so its right vector is +X and its up vector is +Y — independently
  // derived from the camera basis (forward × world-up), not copied from the
  // implementation, so a sign or axis-swap bug in panBy would fail these.
  const state = {
    target: { x: 0, y: 0, z: 0 },
    distance: 10,
    azimuth: 0,
    elevation: Math.PI / 2,
  };

  it("moves the target along the camera's right vector, scaled by distance", () => {
    const next = panBy(state, 1, 0);
    expect(next.target.x).toBeCloseTo(-0.02);
    expect(next.target.y).toBeCloseTo(0);
    expect(next.target.z).toBeCloseTo(0);
  });

  it("moves the target along the camera's up vector, scaled by distance (edge case)", () => {
    const next = panBy(state, 0, 1);
    expect(next.target.x).toBeCloseTo(0);
    expect(next.target.y).toBeCloseTo(0.02);
    expect(next.target.z).toBeCloseTo(0);
  });

  it("leaves distance, azimuth and elevation untouched (edge case)", () => {
    const next = panBy(state, 1, 1);
    expect(next.distance).toBe(10);
    expect(next.azimuth).toBe(0);
    expect(next.elevation).toBe(Math.PI / 2);
  });
});

describe("detectWebglSupport", () => {
  it("returns true when the canvas yields a WebGL2 context", () => {
    const canvas = {
      getContext: (type: string) => (type === "webgl2" ? {} : null),
    };
    expect(detectWebglSupport(() => canvas)).toBe(true);
  });

  it("returns true when only the legacy WebGL context is available (edge case)", () => {
    const canvas = {
      getContext: (type: string) => (type === "webgl" ? {} : null),
    };
    expect(detectWebglSupport(() => canvas)).toBe(true);
  });

  it("returns false when neither context is available (error path)", () => {
    const canvas = { getContext: () => null };
    expect(detectWebglSupport(() => canvas)).toBe(false);
  });

  it("returns false instead of throwing when getContext itself throws (error path)", () => {
    const canvas = {
      getContext: () => {
        throw new Error("boom");
      },
    };
    expect(() => detectWebglSupport(() => canvas)).not.toThrow();
    expect(detectWebglSupport(() => canvas)).toBe(false);
  });

  it("returns false against a real jsdom canvas, since jsdom implements no WebGL context", () => {
    expect(detectWebglSupport()).toBe(false);
  });
});
