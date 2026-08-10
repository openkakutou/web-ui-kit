import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./index.css";

/**
 * Semantic color token pairs (background, foreground) whose contrast must
 * meet WCAG AA for normal text (4.5:1) in both themes. Every token that is
 * ever used as real rendered text in a component (see
 * `.vibe/modules/components.md`) must have its actual on-screen background(s)
 * listed here — backlog item 005 (accessibility baseline) added the
 * `text-secondary` pair, which was previously used by components but never
 * formally verified. `--wuik-color-danger` is deliberately NOT listed as text
 * here: measured against `--wuik-color-surface` in the light theme it falls
 * short (4.39:1) of the 4.5:1 text threshold, so components use
 * `--wuik-color-text` for invalid-state message text instead and keep
 * `--wuik-color-danger` only for its verified uses — solid fills paired with
 * `--wuik-color-text-on-danger`, and borders/outlines (non-text, 3:1 rule).
 * See `.vibe/decisions/009-error-text-uses-text-token-not-danger.md`.
 */
const CONTRAST_PAIRS: Array<[background: string, foreground: string]> = [
  ["--wuik-color-bg", "--wuik-color-text"],
  ["--wuik-color-surface", "--wuik-color-text"],
  ["--wuik-color-bg", "--wuik-color-text-secondary"],
  ["--wuik-color-surface", "--wuik-color-text-secondary"],
  ["--wuik-color-accent", "--wuik-color-text-on-accent"],
  ["--wuik-color-danger", "--wuik-color-text-on-danger"],
];

/**
 * Semantic color token pairs whose contrast must meet WCAG AA for non-text
 * UI components (3:1 — WCAG 1.4.11), used here for the focus indicator
 * against every ambient surface it can visibly render against. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md` for why
 * the focus ring only ever sits against `--wuik-color-bg`/`--wuik-color-surface`
 * (inset rings sit inside a transparent-background control; outset rings sit
 * just outside it) and never against a solid accent/danger fill.
 */
const NON_TEXT_CONTRAST_PAIRS: Array<[background: string, foreground: string]> =
  [
    ["--wuik-color-bg", "--wuik-color-focus-ring"],
    ["--wuik-color-surface", "--wuik-color-focus-ring"],
  ];

const SEMANTIC_COLOR_TOKENS = [
  "--wuik-color-bg",
  "--wuik-color-surface",
  "--wuik-color-border",
  "--wuik-color-text",
  "--wuik-color-text-secondary",
  "--wuik-color-accent",
  "--wuik-color-text-on-accent",
  "--wuik-color-danger",
  "--wuik-color-text-on-danger",
  "--wuik-color-success",
  "--wuik-color-warning",
  "--wuik-color-focus-ring",
];

const SPACING_TOKENS = [
  "--wuik-space-0",
  "--wuik-space-1",
  "--wuik-space-2",
  "--wuik-space-3",
  "--wuik-space-4",
  "--wuik-space-5",
  "--wuik-space-6",
  "--wuik-space-7",
  "--wuik-space-8",
];

const TYPOGRAPHY_TOKENS = [
  "--wuik-font-family-base",
  "--wuik-font-family-mono",
  "--wuik-font-size-xs",
  "--wuik-font-size-sm",
  "--wuik-font-size-base",
  "--wuik-font-size-lg",
  "--wuik-font-size-xl",
  "--wuik-font-weight-regular",
  "--wuik-font-weight-medium",
  "--wuik-font-weight-bold",
  "--wuik-line-height-tight",
  "--wuik-line-height-base",
];

function readToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/** WCAG relative luminance + contrast ratio, computed from a `#rrggbb` hex string. */
function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const n = Number.parseInt(hex.replace("#", ""), 16);
    const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [lA, lB] = [luminance(hexA), luminance(hexB)];
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("design tokens — light theme (default, no data-theme attribute)", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("resolves every documented semantic color token to a non-empty value", () => {
    for (const token of SEMANTIC_COLOR_TOKENS) {
      expect(readToken(token), `${token} should be defined`).not.toBe("");
    }
  });

  it("resolves every documented spacing token to a non-empty value", () => {
    for (const token of SPACING_TOKENS) {
      expect(readToken(token), `${token} should be defined`).not.toBe("");
    }
  });

  it("resolves every documented typography token to a non-empty value", () => {
    for (const token of TYPOGRAPHY_TOKENS) {
      expect(readToken(token), `${token} should be defined`).not.toBe("");
    }
  });

  it("uses the documented light background value", () => {
    expect(readToken("--wuik-color-bg")).toBe("#ffffff");
  });

  it("meets WCAG AA contrast (4.5:1) for every semantic pair", () => {
    for (const [bg, fg] of CONTRAST_PAIRS) {
      const ratio = contrastRatio(readToken(bg), readToken(fg));
      expect(
        ratio,
        `${bg}/${fg} should be >= 4.5:1, was ${ratio.toFixed(2)}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("meets WCAG non-text contrast (3:1) for the focus ring against every surface it renders on", () => {
    for (const [bg, fg] of NON_TEXT_CONTRAST_PAIRS) {
      const ratio = contrastRatio(readToken(bg), readToken(fg));
      expect(
        ratio,
        `${bg}/${fg} should be >= 3:1, was ${ratio.toFixed(2)}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('design tokens — dark theme (data-theme="dark")', () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("switches the background token to the documented dark value", () => {
    expect(readToken("--wuik-color-bg")).toBe("#09090b");
  });

  it("switches text and accent tokens away from their light values", () => {
    expect(readToken("--wuik-color-text")).not.toBe("#18181b");
    expect(readToken("--wuik-color-accent")).not.toBe("#2563eb");
  });

  it("meets WCAG AA contrast (4.5:1) for every semantic pair", () => {
    for (const [bg, fg] of CONTRAST_PAIRS) {
      const ratio = contrastRatio(readToken(bg), readToken(fg));
      expect(
        ratio,
        `${bg}/${fg} should be >= 4.5:1, was ${ratio.toFixed(2)}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("meets WCAG non-text contrast (3:1) for the focus ring against every surface it renders on", () => {
    for (const [bg, fg] of NON_TEXT_CONTRAST_PAIRS) {
      const ratio = contrastRatio(readToken(bg), readToken(fg));
      expect(
        ratio,
        `${bg}/${fg} should be >= 3:1, was ${ratio.toFixed(2)}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("leaves spacing and typography tokens unchanged (theme-independent)", () => {
    expect(readToken("--wuik-space-4")).toBe("1rem");
    expect(readToken("--wuik-font-size-base")).toBe("1rem");
  });
});

describe('design tokens — explicit data-theme="light"', () => {
  it("resolves to the same values as the default (no attribute)", () => {
    document.documentElement.setAttribute("data-theme", "light");
    try {
      expect(readToken("--wuik-color-bg")).toBe("#ffffff");
      expect(readToken("--wuik-color-text")).toBe("#18181b");
    } finally {
      document.documentElement.removeAttribute("data-theme");
    }
  });
});

describe("design tokens — invalid data-theme value", () => {
  it("degrades to the light theme instead of crashing or resolving empty", () => {
    document.documentElement.setAttribute("data-theme", "not-a-real-theme");
    try {
      expect(readToken("--wuik-color-bg")).toBe("#ffffff");
      expect(readToken("--wuik-color-text")).toBe("#18181b");
    } finally {
      document.documentElement.removeAttribute("data-theme");
    }
  });
});
