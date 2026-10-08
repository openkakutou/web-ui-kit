import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./help-hint.ts";

function mountHint(attributes: Record<string, string> = {}): HTMLElement {
  const hint = document.createElement("wuik-help-hint");
  hint.textContent =
    "A StateDef describes what the character does in one state.";
  for (const [name, value] of Object.entries(attributes)) {
    hint.setAttribute(name, value);
  }
  document.body.appendChild(hint);
  return hint;
}

const button = (host: Element) =>
  host.shadowRoot?.querySelector("button") as HTMLButtonElement;
const pop = (host: Element) =>
  host.shadowRoot?.querySelector(".pop") as HTMLElement;

describe("wuik-help-hint", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("starts closed with a named button and a described popover", () => {
    const host = mountHint();
    expect(pop(host).hidden).toBe(true);
    expect(button(host).getAttribute("aria-expanded")).toBe("false");
    expect(button(host).getAttribute("aria-label")).toBe("Help");
    expect(button(host).getAttribute("aria-describedby")).toBe(pop(host).id);
  });

  it("uses the label attribute as the accessible name", () => {
    const host = mountHint({ label: "Help: StateDef" });
    expect(button(host).getAttribute("aria-label")).toBe("Help: StateDef");
  });

  it("toggles open and closed on click and reflects aria-expanded", () => {
    const host = mountHint();
    button(host).click();
    expect(pop(host).hidden).toBe(false);
    expect(button(host).getAttribute("aria-expanded")).toBe("true");
    button(host).click();
    expect(pop(host).hidden).toBe(true);
  });

  it("reveals on hover and keyboard focus without pinning it", () => {
    const host = mountHint();
    host.dispatchEvent(new Event("focusin"));
    expect(pop(host).hidden).toBe(false);
    expect(button(host).getAttribute("aria-expanded")).toBe("false");
    host.dispatchEvent(new Event("focusout"));
    expect(pop(host).hidden).toBe(true);
  });

  it("closes on Escape (edge case: pinned open)", () => {
    const host = mountHint();
    button(host).click();
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(pop(host).hidden).toBe(true);
  });

  it("closes a pinned popover on an outside click (edge case)", () => {
    const host = mountHint();
    button(host).click();
    document.body.click();
    expect(pop(host).hidden).toBe(true);
  });

  it("stays open when clicking inside the explanation", () => {
    const host = mountHint();
    button(host).click();
    host.click();
    expect(pop(host).hidden).toBe(false);
  });
});
