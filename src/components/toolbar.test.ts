import { describe, expect, it } from "vitest";
import "./toolbar.ts";

/**
 * Same jsdom limitations as `panel.test.ts` apply here — see
 * `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`.
 * Token usage and overflow handling are checked structurally against the
 * component's own shadow stylesheet text, not via computed style.
 */
function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountToolbar(innerHTML: string): HTMLElement {
  const toolbar = document.createElement("wuik-toolbar");
  toolbar.innerHTML = innerHTML;
  document.body.appendChild(toolbar);
  return toolbar;
}

describe("wuik-toolbar", () => {
  it("projects slotted content through its default slot", () => {
    const toolbar = mountToolbar('<button type="button">Save</button>');
    const slot = toolbar.shadowRoot?.querySelector("slot") as HTMLSlotElement;
    const assigned = slot.assignedElements();
    expect(assigned).toHaveLength(1);
    expect(assigned[0].textContent).toBe("Save");
  });

  it("projects multiple slotted children in document order (edge case)", () => {
    const toolbar = mountToolbar(
      '<button type="button">Save</button><button type="button">Cancel</button>',
    );
    const slot = toolbar.shadowRoot?.querySelector("slot") as HTMLSlotElement;
    const assigned = slot.assignedElements();
    expect(assigned.map((el) => el.textContent)).toEqual(["Save", "Cancel"]);
  });

  it("does not throw when mounted with no children at all (error/edge case)", () => {
    expect(() => mountToolbar("")).not.toThrow();
  });

  describe("token-based styling (no consumer CSS required, verified structurally — see decision 006)", () => {
    it("references the semantic surface/border/text color tokens on the host", () => {
      const toolbar = mountToolbar("");
      const css = hostStyleText(toolbar);
      expect(css).toContain("var(--wuik-color-surface)");
      expect(css).toContain("var(--wuik-color-border)");
      expect(css).toContain("var(--wuik-color-text)");
    });

    it("references the base typography tokens and a spacing token for its gap", () => {
      const toolbar = mountToolbar("");
      const css = hostStyleText(toolbar);
      expect(css).toContain("var(--wuik-font-family-base)");
      expect(css).toMatch(/var\(--wuik-space-\d\)/);
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const toolbar = mountToolbar("");
      const css = hostStyleText(toolbar);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("allows horizontal scrolling instead of silently clipping overflowing content", () => {
      const toolbar = mountToolbar("");
      const css = hostStyleText(toolbar);
      expect(css).toMatch(/overflow-x:\s*auto/);
    });
  });
});
