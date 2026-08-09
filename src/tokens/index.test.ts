import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./index.css";

/**
 * Semantic color token pairs (background, foreground) whose contrast must
 * meet WCAG AA for normal text (4.5:1) in both themes.
 */
const CONTRAST_PAIRS: Array<[background: string, foreground: string]> = [
  ["--wuik-color-bg", "--wuik-color-text"],
  ["--wuik-color-surface", "--wuik-color-text"],
  ["--wuik-color-accent", "--wuik-color-text-on-accent"],
  ["--wuik-color-danger", "--wuik-color-text-on-danger"],
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
