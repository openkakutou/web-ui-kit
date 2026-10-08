import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./list-row.ts";

function mountRow(attributes: Record<string, string> = {}): HTMLElement {
  const row = document.createElement("wuik-list-row");
  row.innerHTML = 'StateDef 200<span slot="end">5</span>';
  for (const [name, value] of Object.entries(attributes)) {
    row.setAttribute(name, value);
  }
  document.body.appendChild(row);
  return row;
}

const inner = (host: Element) =>
  host.shadowRoot?.querySelector("button") as HTMLButtonElement;

describe("wuik-list-row", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a plain button with no disclosure semantics by default", () => {
    const host = mountRow();
    expect(inner(host).type).toBe("button");
    expect(inner(host).hasAttribute("aria-expanded")).toBe(false);
    expect(inner(host).hasAttribute("aria-current")).toBe(false);
  });

  it("marks the selected row with aria-current", () => {
    const host = mountRow({ selected: "" });
    expect(inner(host).getAttribute("aria-current")).toBe("true");
    host.removeAttribute("selected");
    expect(inner(host).hasAttribute("aria-current")).toBe(false);
  });

  it("is a disclosure when expandable, toggling expanded and aria-expanded on click", () => {
    const host = mountRow({ expandable: "" });
    const handler = vi.fn();
    host.addEventListener("wuik-toggle", handler);
    expect(inner(host).getAttribute("aria-expanded")).toBe("false");
    inner(host).click();
    expect(host.hasAttribute("expanded")).toBe(true);
    expect(inner(host).getAttribute("aria-expanded")).toBe("true");
    expect(handler.mock.calls[0][0].detail).toEqual({ expanded: true });
    inner(host).click();
    expect(host.hasAttribute("expanded")).toBe(false);
    expect(handler.mock.calls[1][0].detail).toEqual({ expanded: false });
  });

  it("starts expanded when the expanded attribute is present", () => {
    const host = mountRow({ expandable: "", expanded: "" });
    expect(inner(host).getAttribute("aria-expanded")).toBe("true");
  });

  it("does not toggle or emit wuik-toggle when not expandable (edge case)", () => {
    const host = mountRow();
    const handler = vi.fn();
    host.addEventListener("wuik-toggle", handler);
    inner(host).click();
    expect(handler).not.toHaveBeenCalled();
    expect(host.hasAttribute("expanded")).toBe(false);
  });

  it("disables the native button (error path: disabled row ignores clicks)", () => {
    const host = mountRow({ expandable: "", disabled: "" });
    const handler = vi.fn();
    host.addEventListener("wuik-toggle", handler);
    inner(host).click();
    expect(inner(host).disabled).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("projects the main and end slots", () => {
    const host = mountRow();
    expect(host.shadowRoot?.querySelector('slot[name="end"]')).not.toBeNull();
  });
});
