import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./spinner.ts";

/**
 * jsdom does not apply Shadow DOM `<style>` rules to computed styles, and
 * separately does not resolve `var()` into computed properties at all — see
 * `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`. So
 * size is checked via the class the component itself toggles on its ring
 * element, and token/animation usage is checked by looking for the exact
 * `--wuik-*` names and `@keyframes`/`animation` (and the absence of any
 * literal hex color) in the component's own stylesheet text. Real
 * rendered/computed correctness is confirmed by the runtime smoke check in a
 * real browser.
 */
function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountSpinner(attributes: Record<string, string> = {}): HTMLElement {
  const spinner = document.createElement("wuik-spinner");
  for (const [name, value] of Object.entries(attributes)) {
    spinner.setAttribute(name, value);
  }
  document.body.appendChild(spinner);
  return spinner;
}

function ringElement(spinner: Element): HTMLElement {
  return spinner.shadowRoot?.querySelector(".ring") as HTMLElement;
}

describe("wuik-spinner", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts and renders an animated ring with no attributes set, without throwing", () => {
    expect(() => mountSpinner()).not.toThrow();
    const spinner = document.querySelector("wuik-spinner") as HTMLElement;
    expect(ringElement(spinner)).not.toBeNull();
  });

  describe("accessible label", () => {
    it("is aria-hidden by default when no label attribute is set", () => {
      const spinner = mountSpinner();
      expect(spinner.getAttribute("aria-hidden")).toBe("true");
      expect(spinner.hasAttribute("aria-label")).toBe(false);
    });

    it("exposes aria-label and removes aria-hidden when label is set", () => {
      const spinner = mountSpinner({ label: "Loading characters" });
      expect(spinner.hasAttribute("aria-hidden")).toBe(false);
      expect(spinner.getAttribute("aria-label")).toBe("Loading characters");
    });

    it("stays decorative when label is an empty string (edge case)", () => {
      const spinner = mountSpinner({ label: "" });
      expect(spinner.getAttribute("aria-hidden")).toBe("true");
      expect(spinner.hasAttribute("aria-label")).toBe(false);
    });

    it("stays decorative when label is whitespace-only (edge case)", () => {
      const spinner = mountSpinner({ label: "   " });
      expect(spinner.getAttribute("aria-hidden")).toBe("true");
      expect(spinner.hasAttribute("aria-label")).toBe(false);
    });

    it("restores aria-hidden and drops aria-label when label is removed after being set (edge case)", () => {
      const spinner = mountSpinner({ label: "Loading" });
      spinner.removeAttribute("label");
      expect(spinner.getAttribute("aria-hidden")).toBe("true");
      expect(spinner.hasAttribute("aria-label")).toBe(false);
    });
  });

  describe("size", () => {
    it("defaults to md with no size attribute set", () => {
      const spinner = mountSpinner();
      expect(ringElement(spinner).classList.contains("md")).toBe(true);
    });

    it('applies the sm size class when size="sm"', () => {
      const spinner = mountSpinner({ size: "sm" });
      expect(ringElement(spinner).classList.contains("sm")).toBe(true);
    });

    it('applies the lg size class when size="lg"', () => {
      const spinner = mountSpinner({ size: "lg" });
      expect(ringElement(spinner).classList.contains("lg")).toBe(true);
    });

    it("falls back to md without throwing when size is an invalid value (error case)", () => {
      expect(() => mountSpinner({ size: "xl" })).not.toThrow();
      const spinner = document.querySelector("wuik-spinner") as HTMLElement;
      expect(ringElement(spinner).classList.contains("md")).toBe(true);
      expect(ringElement(spinner).classList.contains("xl")).toBe(false);
    });
  });

  describe("token-based styling and motion (verified structurally — see decision 006)", () => {
    it("references semantic color tokens for the ring track and spinning arc", () => {
      const spinner = mountSpinner();
      const css = hostStyleText(spinner);
      expect(css).toContain("var(--wuik-color-border)");
      expect(css).toContain("var(--wuik-color-accent)");
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const spinner = mountSpinner();
      const css = hostStyleText(spinner);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("defines a rotation keyframe animation applied to the ring", () => {
      const spinner = mountSpinner();
      const css = hostStyleText(spinner);
      expect(css).toMatch(/@keyframes/);
      expect(css).toMatch(/animation:/);
    });

    it("slows the animation under prefers-reduced-motion instead of leaving it unchanged", () => {
      const spinner = mountSpinner();
      const css = hostStyleText(spinner);
      expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    });
  });
});
