import { describe, expect, it } from "vitest";
import {
  clampScale,
  computeFitTransform,
  panBy,
  resolveViewportConfig,
  zoomAtPoint,
} from "./viewport-transform.ts";

describe("resolveViewportConfig", () => {
  it("uses documented defaults when no attributes are set", () => {
    const config = resolveViewportConfig({
      minScale: null,
      maxScale: null,
      zoomStep: null,
    });
    expect(config).toEqual({
      minScale: 0.1,
      maxScale: 8,
      zoomStep: 0.1,
      invalid: false,
    });
  });

  it("parses well-formed numeric attributes", () => {
    const config = resolveViewportConfig({
      minScale: "0.5",
      maxScale: "4",
      zoomStep: "0.25",
    });
    expect(config).toEqual({
      minScale: 0.5,
      maxScale: 4,
      zoomStep: 0.25,
      invalid: false,
    });
  });

  it("falls back to defaults and flags invalid when minScale >= maxScale (error path)", () => {
    const config = resolveViewportConfig({
      minScale: "5",
      maxScale: "2",
      zoomStep: null,
    });
    expect(config.minScale).toBe(0.1);
    expect(config.maxScale).toBe(8);
    expect(config.invalid).toBe(true);
  });

  it("falls back to the default zoom step and flags invalid for a non-numeric zoomStep (error path)", () => {
    const config = resolveViewportConfig({
      minScale: null,
      maxScale: null,
      zoomStep: "not-a-number",
    });
    expect(config.zoomStep).toBe(0.1);
    expect(config.invalid).toBe(true);
  });

  it("falls back to defaults and flags invalid when minScale is zero or negative (edge case)", () => {
    const config = resolveViewportConfig({
      minScale: "0",
      maxScale: "4",
      zoomStep: null,
    });
    expect(config.minScale).toBe(0.1);
    expect(config.maxScale).toBe(8);
    expect(config.invalid).toBe(true);
  });
});

describe("clampScale", () => {
  const config = resolveViewportConfig({
    minScale: "0.5",
    maxScale: "4",
    zoomStep: null,
  });

  it("passes through a value already within range", () => {
    expect(clampScale(2, config)).toBe(2);
  });

  it("clamps a value above the configured maximum (edge case)", () => {
    expect(clampScale(100, config)).toBe(4);
  });

  it("clamps a value below the configured minimum (edge case)", () => {
    expect(clampScale(0.01, config)).toBe(0.5);
  });
});

describe("zoomAtPoint", () => {
  const config = resolveViewportConfig({
    minScale: "0.1",
    maxScale: "8",
    zoomStep: null,
  });

  it("keeps the point under the zoom origin fixed in content space (fixed-point invariant)", () => {
    const transform = { scale: 1, x: 10, y: 20 };
    const originX = 50;
    const originY = 30;
    // Independently-derived invariant (not the production formula): the
    // content-space coordinate under the cursor before the zoom must equal
    // the content-space coordinate under the cursor after the zoom.
    const contentXBefore = (originX - transform.x) / transform.scale;
    const contentYBefore = (originY - transform.y) / transform.scale;

    const after = zoomAtPoint(transform, config, 3, originX, originY);

    const contentXAfter = (originX - after.x) / after.scale;
    const contentYAfter = (originY - after.y) / after.scale;
    expect(contentXAfter).toBeCloseTo(contentXBefore);
    expect(contentYAfter).toBeCloseTo(contentYBefore);
    expect(after.scale).toBe(3);
  });

  it("clamps to the configured maximum when zooming in past it (edge case)", () => {
    const transform = { scale: 6, x: 0, y: 0 };
    const after = zoomAtPoint(transform, config, 10, 0, 0);
    expect(after.scale).toBe(8);
  });

  it("clamps to the configured minimum when zooming out past it (edge case)", () => {
    const transform = { scale: 0.2, x: 0, y: 0 };
    const after = zoomAtPoint(transform, config, 0.01, 0, 0);
    expect(after.scale).toBe(0.1);
  });

  it("leaves position unchanged when already at the limit and the zoom is a no-op (error path)", () => {
    const transform = { scale: 8, x: 5, y: 7 };
    const after = zoomAtPoint(transform, config, 2, 100, 100);
    expect(after).toEqual({ scale: 8, x: 5, y: 7 });
  });
});

describe("panBy", () => {
  it("moves x/y by the given delta without touching scale", () => {
    const transform = { scale: 2, x: 5, y: 5 };
    expect(panBy(transform, 3, -4)).toEqual({ scale: 2, x: 8, y: 1 });
  });

  it("returns the same coordinates for a zero delta (edge case)", () => {
    const transform = { scale: 2, x: 5, y: 5 };
    expect(panBy(transform, 0, 0)).toEqual({ scale: 2, x: 5, y: 5 });
  });
});

describe("computeFitTransform", () => {
  const config = resolveViewportConfig({
    minScale: null,
    maxScale: null,
    zoomStep: null,
  });

  it("scales down and centers content that is wider than the container", () => {
    const result = computeFitTransform(
      { width: 200, height: 100 },
      { width: 100, height: 100 },
      config,
    );
    expect(result).toEqual({ scale: 1, x: 50, y: 0 });
  });

  it("scales down and centers content that is larger than the container in both dimensions (edge case)", () => {
    const result = computeFitTransform(
      { width: 100, height: 100 },
      { width: 400, height: 200 },
      config,
    );
    expect(result).toEqual({ scale: 0.25, x: 0, y: 25 });
  });

  it("clamps the fit scale to the configured maximum (edge case)", () => {
    const result = computeFitTransform(
      { width: 2000, height: 2000 },
      { width: 10, height: 10 },
      resolveViewportConfig({ minScale: null, maxScale: "8", zoomStep: null }),
    );
    expect(result).toEqual({ scale: 8, x: 960, y: 960 });
  });

  it("falls back to an identity transform when content has zero size (error path)", () => {
    const result = computeFitTransform(
      { width: 300, height: 200 },
      { width: 0, height: 0 },
      config,
    );
    expect(result).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("falls back to an identity transform when the container has zero size (error path)", () => {
    const result = computeFitTransform(
      { width: 0, height: 0 },
      { width: 100, height: 100 },
      config,
    );
    expect(result).toEqual({ scale: 1, x: 0, y: 0 });
  });
});
