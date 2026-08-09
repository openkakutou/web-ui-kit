import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./panel.ts";

/**
 * jsdom does not apply Shadow DOM `<style>` rules to computed styles, and
 * separately does not resolve `var()` into computed properties at all — see
 * `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`. So
 * visibility is checked via the class the component itself toggles, and
 * token usage is checked by looking for the exact `--wuik-*` names (and the
 * absence of any literal hex color) in the component's own stylesheet text.
 * Real rendered/computed correctness (including theme switching) is
 * confirmed by the Step 4b runtime smoke check in a real browser.
 */
function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountPanel(innerHTML: string): HTMLElement {
  const panel = document.createElement("wuik-panel");
  panel.innerHTML = innerHTML;
  document.body.appendChild(panel);
  return panel;
}

describe("wuik-panel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("projects slotted body content through its default slot", () => {
    const panel = mountPanel("<p>Hello from the panel body</p>");
    const bodySlot = panel.shadowRoot?.querySelector(
      "slot:not([name])",
    ) as HTMLSlotElement;
    const assigned = bodySlot.assignedElements();
    expect(assigned).toHaveLength(1);
    expect(assigned[0].textContent).toBe("Hello from the panel body");
  });

  it("projects slotted header content through its named header slot", () => {
    const panel = mountPanel('<span slot="header">Settings</span><p>Body</p>');
    const headerSlot = panel.shadowRoot?.querySelector(
      'slot[name="header"]',
    ) as HTMLSlotElement;
    const assigned = headerSlot.assignedElements();
    expect(assigned).toHaveLength(1);
    expect(assigned[0].textContent).toBe("Settings");
  });

  it("marks the header region visible once header content is slotted", () => {
    const panel = mountPanel('<span slot="header">Settings</span><p>Body</p>');
    const headerWrapper = panel.shadowRoot?.querySelector(
      ".header",
    ) as HTMLElement;
    expect(headerWrapper.classList.contains("has-content")).toBe(true);
  });

  it("keeps the header region collapsed when no header content is slotted (edge case)", () => {
    const panel = mountPanel("<p>Body only, no header</p>");
    const headerWrapper = panel.shadowRoot?.querySelector(
      ".header",
    ) as HTMLElement;
    expect(headerWrapper.classList.contains("has-content")).toBe(false);
  });

  it("does not throw and stays header-collapsed when mounted with no children at all (error/edge case)", () => {
    expect(() => mountPanel("")).not.toThrow();
    const panel = document.querySelector("wuik-panel") as HTMLElement;
    const headerWrapper = panel.shadowRoot?.querySelector(
      ".header",
    ) as HTMLElement;
    expect(headerWrapper.classList.contains("has-content")).toBe(false);
  });

  describe("token-based styling (no consumer CSS required, verified structurally — see decision 006)", () => {
    it("references the semantic surface/border/text color tokens on the host", () => {
      const panel = mountPanel("<p>Body</p>");
      const css = hostStyleText(panel);
      expect(css).toContain("var(--wuik-color-surface)");
      expect(css).toContain("var(--wuik-color-border)");
      expect(css).toContain("var(--wuik-color-text)");
    });

    it("references the base typography tokens so slotted content inherits sane defaults", () => {
      const panel = mountPanel("<p>Body</p>");
      const css = hostStyleText(panel);
      expect(css).toContain("var(--wuik-font-family-base)");
      expect(css).toContain("var(--wuik-font-size-base)");
      expect(css).toContain("var(--wuik-line-height-base)");
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const panel = mountPanel("<p>Body</p>");
      const css = hostStyleText(panel);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });
  });
});
