import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./index.css";

/**
 * Semantic color token pairs (background, foreground) whose contrast must
 * meet WCAG AA for normal text (4.5:1) in both themes. Every token that is
 * ever used as real rendered text in a component (see
 * `.vibe/modules/components.md`) must have its actual on-screen background(s)
 * listed here. `--wuik-color-error` is deliberately NOT listed as text:
 * components use `--wuik-color-text` for invalid-state message text and keep
 * `--wuik-color-error` for solid fills paired with `--wuik-color-on-error`
 * and for borders/icons (non-text, 3:1 rule). See
 * `.vibe/decisions/009-error-text-uses-text-token-not-danger.md`.
 */
const CONTRAST_PAIRS: Array<[background: string, foreground: string]> = [
  ["--wuik-color-bg", "--wuik-color-text"],
  ["--wuik-color-surface", "--wuik-color-text"],
  ["--wuik-color-surface-raised", "--wuik-color-text"],
  ["--wuik-color-bg", "--wuik-color-text-muted"],
  ["--wuik-color-surface", "--wuik-color-text-muted"],
  ["--wuik-color-surface-raised", "--wuik-color-text-muted"],
  ["--wuik-color-primary", "--wuik-color-on-primary"],
  ["--wuik-color-error", "--wuik-color-on-error"],
  ["--wuik-color-surface", "--wuik-color-primary"],
  ["--wuik-color-surface", "--wuik-color-success"],
  ["--wuik-color-surface", "--wuik-color-warning"],
];

/**
 * Semantic color token pairs whose contrast must meet WCAG AA for non-text
 * UI components (3:1 — WCAG 1.4.11): the focus indicator against every
 * ambient surface it can render against, and the control edge
 * (`border-control`) against the surfaces a control sits on. The decorative
 * `--wuik-color-border` is deliberately not listed: it only draws dividers.
 * See `.vibe/decisions/007-form-input-components-shared-conventions.md` and
 * `.vibe/decisions/025-studio-visual-direction-and-token-redesign.md`.
 */
const NON_TEXT_CONTRAST_PAIRS: Array<[background: string, foreground: string]> =
  [
    ["--wuik-color-bg", "--wuik-color-focus"],
    ["--wuik-color-surface", "--wuik-color-focus"],
    ["--wuik-color-surface-raised", "--wuik-color-focus"],
    ["--wuik-color-bg", "--wuik-color-border-control"],
    ["--wuik-color-surface", "--wuik-color-border-control"],
    ["--wuik-color-surface", "--wuik-color-primary"],
    ["--wuik-color-surface", "--wuik-color-error"],
  ];

const SEMANTIC_COLOR_TOKENS = [
  "--wuik-color-bg",
  "--wuik-color-surface",
  "--wuik-color-surface-raised",
  "--wuik-color-border",
  "--wuik-color-border-control",
  "--wuik-color-text",
  "--wuik-color-text-muted",
  "--wuik-color-primary",
  "--wuik-color-on-primary",
  "--wuik-color-error",
  "--wuik-color-on-error",
  "--wuik-color-success",
  "--wuik-color-warning",
  "--wuik-color-focus",
  "--wuik-color-annotation-1",
  "--wuik-color-annotation-2",
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
  "--wuik-font-size-md",
  "--wuik-font-size-lg",
  "--wuik-font-size-xl",
  "--wuik-font-weight-regular",
  "--wuik-font-weight-medium",
  "--wuik-font-weight-bold",
  "--wuik-line-height-tight",
  "--wuik-line-height-base",
];

const SHAPE_AND_MOTION_TOKENS = [
  "--wuik-radius-control",
  "--wuik-radius-button",
  "--wuik-radius-card",
  "--wuik-radius-pill",
  "--wuik-border-width",
  "--wuik-border-width-strong",
  "--wuik-shadow-card",
  "--wuik-shadow-overlay",
  "--wuik-motion-fast",
  "--wuik-motion-panel",
  "--wuik-motion-ease",
  "--wuik-control-height-sm",
  "--wuik-control-height",
  "--wuik-control-height-lg",
  "--wuik-target-min",
  "--wuik-focus-ring-width",
  "--wuik-focus-ring-offset",
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

function expectContrast(
  pairs: Array<[background: string, foreground: string]>,
  minimum: number,
): void {
  for (const [bg, fg] of pairs) {
    const ratio = contrastRatio(readToken(bg), readToken(fg));
    expect(
      ratio,
      `${bg}/${fg} should be >= ${minimum}:1, was ${ratio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(minimum);
  }
}

describe("design tokens — dark theme (default, no data-theme attribute)", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("resolves every documented token to a non-empty value", () => {
    for (const token of [
      ...SEMANTIC_COLOR_TOKENS,
      ...SPACING_TOKENS,
      ...TYPOGRAPHY_TOKENS,
      ...SHAPE_AND_MOTION_TOKENS,
    ]) {
      expect(readToken(token), `${token} should be defined`).not.toBe("");
    }
  });

  it("uses the documented dark background value", () => {
    expect(readToken("--wuik-color-bg")).toBe("#121214");
  });

  it("declares the dark color-scheme, so OS-drawn chrome (a native <select>'s dropdown panel, scrollbars) matches", () => {
    expect(getComputedStyle(document.documentElement).colorScheme).toBe("dark");
  });

  it("meets WCAG AA contrast (4.5:1) for every semantic text pair", () => {
    expectContrast(CONTRAST_PAIRS, 4.5);
  });

  it("meets WCAG non-text contrast (3:1) for the focus ring and control borders", () => {
    expectContrast(NON_TEXT_CONTRAST_PAIRS, 3);
  });
});

describe('design tokens — light theme (data-theme="light")', () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("switches the background token to the documented light value", () => {
    expect(readToken("--wuik-color-bg")).toBe("#f3f2f0");
  });

  it("is a full twin, not an inversion: text, primary and borders differ from dark", () => {
    expect(readToken("--wuik-color-text")).toBe("#1c1b1a");
    expect(readToken("--wuik-color-primary")).toBe("#b45309");
    expect(readToken("--wuik-color-border-control")).toBe("#85817c");
  });

  it("declares the light color-scheme", () => {
    expect(getComputedStyle(document.documentElement).colorScheme).toBe(
      "light",
    );
  });

  it("meets WCAG AA contrast (4.5:1) for every semantic text pair", () => {
    expectContrast(CONTRAST_PAIRS, 4.5);
  });

  it("meets WCAG non-text contrast (3:1) for the focus ring and control borders", () => {
    expectContrast(NON_TEXT_CONTRAST_PAIRS, 3);
  });

  it("leaves spacing, typography and shape tokens unchanged (theme-independent)", () => {
    expect(readToken("--wuik-space-4")).toBe("1rem");
    expect(readToken("--wuik-font-size-base")).toBe("0.875rem");
    expect(readToken("--wuik-radius-card")).toBe("0.75rem");
  });
});

describe("design tokens — invalid data-theme value", () => {
  it("degrades to the dark theme instead of crashing or resolving empty", () => {
    document.documentElement.setAttribute("data-theme", "not-a-real-theme");
    try {
      expect(readToken("--wuik-color-bg")).toBe("#121214");
      expect(readToken("--wuik-color-text")).toBe("#ececf0");
      expect(getComputedStyle(document.documentElement).colorScheme).toBe(
        "dark",
      );
    } finally {
      document.documentElement.removeAttribute("data-theme");
    }
  });
});

describe("design tokens — elevation", () => {
  it("uses a lighter shadow in the light theme than in the dark one", () => {
    const dark = readToken("--wuik-shadow-card");
    document.documentElement.setAttribute("data-theme", "light");
    try {
      expect(readToken("--wuik-shadow-card")).not.toBe(dark);
    } finally {
      document.documentElement.removeAttribute("data-theme");
    }
  });
});
