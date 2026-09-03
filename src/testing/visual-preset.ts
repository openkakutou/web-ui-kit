/**
 * Shared visual-regression testing preset (roadmap decision `024`,
 * `.vibe/decisions/015`). Every consuming app's own Playwright config
 * spreads `createVisualProjectConfig()` into `defineConfig({...})` to pick
 * up the same fixed viewport and diff threshold this repo's own suite
 * uses, then a spec calls `waitForVisualReady(page)` before taking a
 * screenshot.
 *
 * Deliberately duck-typed against Playwright's own shapes rather than
 * importing `@playwright/test` — see `.vibe/decisions/015` for why: this
 * package has no version-locked dependency on it, so each of the 7
 * consuming apps keeps full control of its own installed Playwright
 * version.
 */

/** The subset of a `Page`'s API this preset actually calls. Any real
 * Playwright `Page` satisfies this shape structurally, with no import
 * needed on either side. */
export interface VisualPage {
  addStyleTag(options: { content: string }): Promise<unknown>;
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
}

export interface VisualViewport {
  width: number;
  height: number;
}

export interface VisualScreenshotDiffOptions {
  maxDiffPixelRatio: number;
}

export interface VisualProjectConfig {
  use?: {
    viewport?: VisualViewport;
    [key: string]: unknown;
  };
  expect?: {
    toHaveScreenshot?: VisualScreenshotDiffOptions;
  };
}

/** Fixed viewport every baseline is captured at — a size drift here would
 * invalidate every committed screenshot across every consuming app. */
export const DEFAULT_VISUAL_VIEWPORT: VisualViewport = {
  width: 1280,
  height: 800,
};

/** Fixed browser locale every baseline is captured at. Left unset, a
 * browser's language auto-detects from the host/container's own locale
 * (confirmed to actually differ between environments during this item's
 * own runtime check) — any component rendering locale-dependent text
 * (`<wuik-locale-switcher>`, i18n-aware components) would otherwise
 * produce a different screenshot on a different machine for no real
 * regression. */
export const DEFAULT_VISUAL_LOCALE = "en-US";

/** Default screenshot-comparison diff threshold (roadmap decision `024`'s
 * "the project's default diff threshold"). */
export const DEFAULT_VISUAL_DIFF_OPTIONS: VisualScreenshotDiffOptions = {
  maxDiffPixelRatio: 0.02,
};

/**
 * Builds the shared portion of a Playwright config for visual-regression
 * tests. `overrides.use`/`overrides.expect.toHaveScreenshot`, if given,
 * replace the corresponding shared default wholesale (no deep merge below
 * that level) — an app either wants the shared default or fully owns that
 * field, never a partial mix of the two.
 */
export function createVisualProjectConfig(
  overrides: VisualProjectConfig = {},
): VisualProjectConfig {
  return {
    ...overrides,
    use: {
      viewport: DEFAULT_VISUAL_VIEWPORT,
      locale: DEFAULT_VISUAL_LOCALE,
      ...overrides.use,
    },
    expect: {
      ...overrides.expect,
      toHaveScreenshot:
        overrides.expect?.toHaveScreenshot ?? DEFAULT_VISUAL_DIFF_OPTIONS,
    },
  };
}

/** CSS forcing every animation/transition to complete instantly,
 * regardless of whether a component honors `prefers-reduced-motion`. */
const DISABLE_MOTION_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

/**
 * Prepares a page for a deterministic screenshot: forces animations and
 * transitions off, then waits for web fonts to finish loading. Call this
 * once a component has mounted, right before `toHaveScreenshot()`.
 */
export async function waitForVisualReady(page: VisualPage): Promise<void> {
  await page.addStyleTag({ content: DISABLE_MOTION_CSS });
  await page.evaluate(() => document.fonts.ready);
}
