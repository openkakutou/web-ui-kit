import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VISUAL_DIFF_OPTIONS,
  DEFAULT_VISUAL_LOCALE,
  DEFAULT_VISUAL_VIEWPORT,
  createVisualProjectConfig,
  waitForVisualReady,
} from "./visual-preset.ts";

describe("createVisualProjectConfig", () => {
  it("returns the shared defaults when called with no overrides", () => {
    const config = createVisualProjectConfig();

    expect(config.use?.viewport).toEqual(DEFAULT_VISUAL_VIEWPORT);
    expect(config.use?.locale).toBe(DEFAULT_VISUAL_LOCALE);
    expect(config.expect?.toHaveScreenshot).toEqual(
      DEFAULT_VISUAL_DIFF_OPTIONS,
    );
  });

  it("lets an override pin a different locale than the shared default", () => {
    const config = createVisualProjectConfig({ use: { locale: "fr-FR" } });

    expect(config.use?.locale).toBe("fr-FR");
  });

  it("merges an app-specific `use` field alongside the shared defaults", () => {
    const config = createVisualProjectConfig({
      use: { baseURL: "http://localhost:4173" },
    });

    // The app's own field is present...
    expect(config.use?.baseURL).toBe("http://localhost:4173");
    // ...without silently dropping the shared viewport default.
    expect(config.use?.viewport).toEqual(DEFAULT_VISUAL_VIEWPORT);
  });

  it("lets an override fully replace the default viewport", () => {
    const config = createVisualProjectConfig({
      use: { viewport: { width: 640, height: 480 } },
    });

    expect(config.use?.viewport).toEqual({ width: 640, height: 480 });
  });

  it("lets an override replace the default diff threshold", () => {
    const config = createVisualProjectConfig({
      expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.1 } },
    });

    expect(config.expect?.toHaveScreenshot).toEqual({
      maxDiffPixelRatio: 0.1,
    });
  });
});

describe("waitForVisualReady", () => {
  it("disables animations/transitions and waits for fonts to be ready", async () => {
    const addStyleTag = vi.fn().mockResolvedValue(undefined);
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = { addStyleTag, evaluate };

    await waitForVisualReady(page);

    expect(addStyleTag).toHaveBeenCalledTimes(1);
    const injectedCss = addStyleTag.mock.calls[0][0].content as string;
    expect(injectedCss).toContain("animation-duration: 0s");
    expect(injectedCss).toContain("transition-duration: 0s");
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it("waits for the style tag before checking fonts, so the diff-off rule is already applied", async () => {
    const order: string[] = [];
    const addStyleTag = vi.fn().mockImplementation(async () => {
      order.push("style");
    });
    const evaluate = vi.fn().mockImplementation(async () => {
      order.push("fonts");
    });

    await waitForVisualReady({ addStyleTag, evaluate });

    expect(order).toEqual(["style", "fonts"]);
  });
});
