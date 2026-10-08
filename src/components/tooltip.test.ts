import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./tooltip.ts";

function mountTooltip(text: string | null, withChild = true): HTMLElement {
  const tooltip = document.createElement("wuik-tooltip");
  if (text !== null) {
    tooltip.setAttribute("text", text);
  }
  if (withChild) {
    tooltip.innerHTML = '<button type="button" aria-label="Undo">↶</button>';
  }
  document.body.appendChild(tooltip);
  return tooltip;
}

function tip(host: Element): HTMLElement {
  return host.shadowRoot?.querySelector(".tip") as HTMLElement;
}

describe("wuik-tooltip", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is hidden until the pointer enters, and has the tooltip role", () => {
    const host = mountTooltip("Undo (Ctrl+Z)");
    expect(tip(host).hidden).toBe(true);
    expect(tip(host).getAttribute("role")).toBe("tooltip");
    host.dispatchEvent(new Event("pointerenter"));
    expect(tip(host).hidden).toBe(false);
    expect(tip(host).textContent).toBe("Undo (Ctrl+Z)");
  });

  it("shows on keyboard focus and hides when focus leaves", () => {
    const host = mountTooltip("Undo");
    host.dispatchEvent(new Event("focusin"));
    expect(tip(host).hidden).toBe(false);
    host.dispatchEvent(new Event("focusout"));
    expect(tip(host).hidden).toBe(true);
  });

  it("closes on Escape without moving focus", () => {
    const host = mountTooltip("Undo");
    host.dispatchEvent(new Event("focusin"));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(tip(host).hidden).toBe(true);
  });

  it("describes the slotted trigger with aria-description", () => {
    const host = mountTooltip("Undo (Ctrl+Z)");
    expect(host.querySelector("button")?.getAttribute("aria-description")).toBe(
      "Undo (Ctrl+Z)",
    );
    host.setAttribute("text", "Undo");
    expect(host.querySelector("button")?.getAttribute("aria-description")).toBe(
      "Undo",
    );
  });

  it("never shows an empty tooltip (edge case: no text)", () => {
    const host = mountTooltip(null);
    host.dispatchEvent(new Event("pointerenter"));
    expect(tip(host).hidden).toBe(true);
    expect(host.querySelector("button")?.hasAttribute("aria-description")).toBe(
      false,
    );
  });

  it("works with no slotted child (error path: nothing to describe)", () => {
    const host = mountTooltip("Alone", false);
    expect(() => host.dispatchEvent(new Event("pointerenter"))).not.toThrow();
  });
});
