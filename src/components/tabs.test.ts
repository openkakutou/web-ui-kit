import { afterEach, describe, expect, it } from "vitest";
import "./tabs.ts";

/**
 * Same jsdom limitations as `panel.test.ts` apply here — see
 * `.vibe/decisions/006-token-css-tested-structurally-not-computed.md`.
 * Token usage is checked structurally against the component's own shadow
 * stylesheet text, not via computed style.
 */
function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

/** slotchange fires as a queued microtask; flush it before asserting on dynamic child changes. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mountTabs(innerHTML: string): HTMLElement {
  const tabs = document.createElement("wuik-tabs");
  tabs.innerHTML = innerHTML;
  document.body.appendChild(tabs);
  return tabs;
}

function tabButtons(tabs: HTMLElement): HTMLButtonElement[] {
  return Array.from(tabs.shadowRoot?.querySelectorAll('[role="tab"]') ?? []);
}

const TWO_TABS = `
  <wuik-tab-panel label="Details">Details content</wuik-tab-panel>
  <wuik-tab-panel label="History">History content</wuik-tab-panel>
`;

const THREE_TABS = `
  <wuik-tab-panel label="One">One content</wuik-tab-panel>
  <wuik-tab-panel label="Two">Two content</wuik-tab-panel>
  <wuik-tab-panel label="Three">Three content</wuik-tab-panel>
`;

describe("wuik-tabs + wuik-tab-panel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("builds a tab strip and shows only the first panel by default (nominal)", () => {
    const tabs = mountTabs(TWO_TABS);
    const buttons = tabButtons(tabs);
    const panels = tabs.querySelectorAll("wuik-tab-panel");

    expect(buttons.map((b) => b.textContent)).toEqual(["Details", "History"]);
    expect((panels[0] as HTMLElement).hidden).toBe(false);
    expect((panels[1] as HTMLElement).hidden).toBe(true);
  });

  it("wires ARIA roles and the tab/panel relationship", () => {
    const tabs = mountTabs(TWO_TABS);
    const tablist = tabs.shadowRoot?.querySelector('[role="tablist"]');
    const buttons = tabButtons(tabs);
    const panels = Array.from(tabs.querySelectorAll("wuik-tab-panel"));

    expect(tablist).not.toBeNull();
    panels.forEach((panel, index) => {
      expect(panel.getAttribute("role")).toBe("tabpanel");
      expect(buttons[index].getAttribute("aria-controls")).toBe(panel.id);
      expect(panel.getAttribute("aria-labelledby")).toBe(buttons[index].id);
    });
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");
    expect(buttons[1].getAttribute("aria-selected")).toBe("false");
  });

  it("maintains a roving tabindex: only the selected tab is in the page tab order", () => {
    const tabs = mountTabs(TWO_TABS);
    const buttons = tabButtons(tabs);
    expect(buttons[0].tabIndex).toBe(0);
    expect(buttons[1].tabIndex).toBe(-1);
  });

  it("selects a tab on click, updating selection, visibility and tabindex", () => {
    const tabs = mountTabs(TWO_TABS);
    const buttons = tabButtons(tabs);
    const panels = tabs.querySelectorAll("wuik-tab-panel");

    buttons[1].click();

    expect(buttons[1].getAttribute("aria-selected")).toBe("true");
    expect(buttons[0].getAttribute("aria-selected")).toBe("false");
    expect(buttons[1].tabIndex).toBe(0);
    expect(buttons[0].tabIndex).toBe(-1);
    expect((panels[0] as HTMLElement).hidden).toBe(true);
    expect((panels[1] as HTMLElement).hidden).toBe(false);
  });

  it("moves selection with ArrowRight/ArrowLeft and wraps around at the ends (automatic activation, decision 004)", () => {
    const tabs = mountTabs(THREE_TABS);
    const buttons = tabButtons(tabs);

    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(buttons[1].getAttribute("aria-selected")).toBe("true");

    buttons[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(buttons[2].getAttribute("aria-selected")).toBe("true");

    buttons[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");

    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(buttons[2].getAttribute("aria-selected")).toBe("true");
  });

  it("jumps to the first/last tab with Home/End", () => {
    const tabs = mountTabs(THREE_TABS);
    const buttons = tabButtons(tabs);

    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(buttons[2].getAttribute("aria-selected")).toBe("true");

    buttons[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");
  });

  it("moves focus to the newly selected tab when the previously focused tab is navigated away from", () => {
    const tabs = mountTabs(THREE_TABS);
    const buttons = tabButtons(tabs);
    buttons[0].focus();

    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(tabs.shadowRoot?.activeElement).toBe(buttons[1]);
  });

  it("moves focus out of a panel to the new tab when selection changes while focus is inside the hidden panel (edge case)", () => {
    const tabs = mountTabs(
      '<wuik-tab-panel label="One"><button id="inside">Inside</button></wuik-tab-panel><wuik-tab-panel label="Two">Two</wuik-tab-panel>',
    );
    const buttons = tabButtons(tabs);
    const insideButton = tabs.querySelector("#inside") as HTMLButtonElement;
    insideButton.focus();
    expect(document.activeElement).toBe(insideButton);

    buttons[1].click();

    expect(tabs.shadowRoot?.activeElement).toBe(buttons[1]);
  });

  it("rebuilds the tab strip when a tab-panel is added dynamically (edge case)", async () => {
    const tabs = mountTabs(TWO_TABS);
    const extra = document.createElement("wuik-tab-panel");
    extra.setAttribute("label", "Extra");
    extra.textContent = "Extra content";
    tabs.appendChild(extra);
    await flushMicrotasks();

    const buttons = tabButtons(tabs);
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Details",
      "History",
      "Extra",
    ]);
  });

  it("clamps the selection when the selected tab-panel is removed (edge case)", async () => {
    const tabs = mountTabs(THREE_TABS);
    const buttons = tabButtons(tabs);
    buttons[2].click();
    expect(buttons[2].getAttribute("aria-selected")).toBe("true");

    tabs.querySelectorAll("wuik-tab-panel")[2].remove();
    await flushMicrotasks();

    const remainingButtons = tabButtons(tabs);
    expect(remainingButtons).toHaveLength(2);
    expect(remainingButtons[1].getAttribute("aria-selected")).toBe("true");
  });

  it("does not throw and shows no tabs when mounted with no tab-panel children at all (error/edge case)", () => {
    expect(() => mountTabs("")).not.toThrow();
    const tabs = document.querySelector("wuik-tabs") as HTMLElement;
    expect(tabButtons(tabs)).toHaveLength(0);
  });

  describe("vertical orientation (backlog item 017)", () => {
    it("sets aria-orientation on the tablist and moves selection with ArrowDown/ArrowUp, wrapping at the ends (nominal)", () => {
      const tabs = mountTabs(THREE_TABS);
      tabs.setAttribute("orientation", "vertical");
      const tablist = tabs.shadowRoot?.querySelector('[role="tablist"]');
      const buttons = tabButtons(tabs);

      expect(tablist?.getAttribute("aria-orientation")).toBe("vertical");

      buttons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(buttons[1].getAttribute("aria-selected")).toBe("true");

      buttons[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(buttons[2].getAttribute("aria-selected")).toBe("true");

      buttons[2].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(buttons[0].getAttribute("aria-selected")).toBe("true");

      buttons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );
      expect(buttons[2].getAttribute("aria-selected")).toBe("true");
    });

    it("still jumps to the first/last tab with Home/End in vertical orientation (edge case)", () => {
      const tabs = mountTabs(THREE_TABS);
      tabs.setAttribute("orientation", "vertical");
      const buttons = tabButtons(tabs);

      buttons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      );
      expect(buttons[2].getAttribute("aria-selected")).toBe("true");

      buttons[2].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
      );
      expect(buttons[0].getAttribute("aria-selected")).toBe("true");
    });

    it("ignores ArrowLeft/ArrowRight in vertical orientation and ignores ArrowUp/ArrowDown in horizontal orientation (edge case)", () => {
      const verticalTabs = mountTabs(THREE_TABS);
      verticalTabs.setAttribute("orientation", "vertical");
      const verticalButtons = tabButtons(verticalTabs);
      verticalButtons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      expect(verticalButtons[0].getAttribute("aria-selected")).toBe("true");

      const horizontalTabs = mountTabs(THREE_TABS);
      const horizontalButtons = tabButtons(horizontalTabs);
      horizontalButtons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(horizontalButtons[0].getAttribute("aria-selected")).toBe("true");
    });

    it("falls back to horizontal layout and keyboard behavior for an invalid orientation value (error case)", () => {
      const tabs = mountTabs(THREE_TABS);
      tabs.setAttribute("orientation", "diagonal");
      const tablist = tabs.shadowRoot?.querySelector('[role="tablist"]');
      const buttons = tabButtons(tabs);

      expect(tablist?.hasAttribute("aria-orientation")).toBe(false);

      buttons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      expect(buttons[1].getAttribute("aria-selected")).toBe("true");

      buttons[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(buttons[1].getAttribute("aria-selected")).toBe("true");
    });

    it("does not set aria-orientation by default (horizontal)", () => {
      const tabs = mountTabs(TWO_TABS);
      const tablist = tabs.shadowRoot?.querySelector('[role="tablist"]');
      expect(tablist?.hasAttribute("aria-orientation")).toBe(false);
    });
  });

  describe("token-based styling (no consumer CSS required, verified structurally — see decision 006)", () => {
    it("references the accent, text-secondary and focus-ring tokens", () => {
      const tabs = mountTabs(TWO_TABS);
      const css = hostStyleText(tabs);
      expect(css).toContain("var(--wuik-color-accent)");
      expect(css).toContain("var(--wuik-color-text-secondary)");
      expect(css).toContain("var(--wuik-color-focus-ring)");
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const tabs = mountTabs(TWO_TABS);
      const css = hostStyleText(tabs);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });
  });
});
