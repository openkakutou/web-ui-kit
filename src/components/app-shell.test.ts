import { afterEach, describe, expect, it } from "vitest";
import "./app-shell.ts";

/**
 * Same jsdom limitations as `panel.test.ts` apply here — see
 * `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`.
 * Empty-slot collapse is checked via the class the component itself
 * toggles; token usage and the responsive rule are checked against the
 * component's own shadow stylesheet text.
 */
function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mountShell(innerHTML: string): HTMLElement {
  const shell = document.createElement("wuik-app-shell");
  shell.innerHTML = innerHTML;
  document.body.appendChild(shell);
  return shell;
}

function namedSlot(shell: Element, name: string): HTMLSlotElement {
  return shell.shadowRoot?.querySelector(
    `slot[name="${name}"]`,
  ) as HTMLSlotElement;
}

function defaultSlot(shell: Element): HTMLSlotElement {
  return shell.shadowRoot?.querySelector("slot:not([name])") as HTMLSlotElement;
}

describe("wuik-app-shell", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("places toolbar/sidebar/main content into their own regions (nominal)", () => {
    const shell = mountShell(
      '<span slot="toolbar">Toolbar</span><span slot="sidebar">Sidebar</span><p>Main content</p>',
    );

    expect(namedSlot(shell, "toolbar").assignedElements()[0]?.textContent).toBe(
      "Toolbar",
    );
    expect(namedSlot(shell, "sidebar").assignedElements()[0]?.textContent).toBe(
      "Sidebar",
    );
    expect(defaultSlot(shell).assignedElements()[0]?.textContent).toBe(
      "Main content",
    );
  });

  it("collapses the toolbar region when nothing is slotted into it (edge case)", () => {
    const shell = mountShell('<span slot="sidebar">Sidebar</span><p>Main</p>');
    expect(namedSlot(shell, "toolbar").classList.contains("empty")).toBe(true);
    expect(namedSlot(shell, "sidebar").classList.contains("empty")).toBe(false);
  });

  it("collapses the sidebar region when nothing is slotted into it (edge case)", () => {
    const shell = mountShell('<span slot="toolbar">Toolbar</span><p>Main</p>');
    expect(namedSlot(shell, "sidebar").classList.contains("empty")).toBe(true);
    expect(namedSlot(shell, "toolbar").classList.contains("empty")).toBe(false);
  });

  it("un-collapses a region once content is slotted into it dynamically", async () => {
    const shell = mountShell("<p>Main</p>");
    expect(namedSlot(shell, "sidebar").classList.contains("empty")).toBe(true);

    const sidebarContent = document.createElement("span");
    sidebarContent.slot = "sidebar";
    sidebarContent.textContent = "Sidebar";
    shell.appendChild(sidebarContent);
    await flushMicrotasks();

    expect(namedSlot(shell, "sidebar").classList.contains("empty")).toBe(false);
  });

  it("does not throw and collapses both optional regions when mounted completely empty (error/edge case)", () => {
    expect(() => mountShell("")).not.toThrow();
    const shell = document.querySelector("wuik-app-shell") as HTMLElement;
    expect(namedSlot(shell, "toolbar").classList.contains("empty")).toBe(true);
    expect(namedSlot(shell, "sidebar").classList.contains("empty")).toBe(true);
  });

  describe("token-based styling (no consumer CSS required, verified structurally — see decision 006)", () => {
    it("references the background and text color tokens on the host", () => {
      const shell = mountShell("<p>Main</p>");
      const css = hostStyleText(shell);
      expect(css).toContain("var(--wuik-color-bg)");
      expect(css).toContain("var(--wuik-color-text)");
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const shell = mountShell("<p>Main</p>");
      const css = hostStyleText(shell);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("ships a narrow-viewport rule that restacks regions instead of leaving it undefined (decision 005)", () => {
      const shell = mountShell("<p>Main</p>");
      const css = hostStyleText(shell);
      expect(css).toMatch(/@media[^{]*max-width/);
    });

    it("has no shared gap between grid tracks, so an empty region leaves no seam (decision 005)", () => {
      const shell = mountShell("<p>Main</p>");
      const css = hostStyleText(shell);
      expect(css).not.toMatch(/\bgap:/);
    });

    it("forces each named slot to display:block so it (not its transparent default) is the actual grid item", () => {
      const shell = mountShell("<p>Main</p>");
      const css = hostStyleText(shell);
      const rules = css.split("}");
      for (const name of ["toolbar", "sidebar"]) {
        const rule = rules.find(
          (r) => r.includes(`slot[name="${name}"]`) && !r.includes("empty"),
        );
        expect(rule, `slot[name="${name}"] rule should exist`).toBeDefined();
        expect(rule).toMatch(/display:\s*block/);
      }
    });
  });
});
