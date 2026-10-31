import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import { WuikSwitchElement } from "./switch.ts";

function mount(attributes: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("wuik-switch");
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  document.body.appendChild(el);
  return el;
}

const native = (host: Element) =>
  host.shadowRoot?.querySelector("input") as HTMLInputElement;
type Toggle = HTMLElement & { checked: boolean };

describe("wuik-switch", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("exposes role=switch on the native control and data-kind=switch", () => {
    const host = mount({ label: "Sound" });
    expect(native(host).getAttribute("role")).toBe("switch");
    expect(host.getAttribute("data-kind")).toBe("switch");
  });

  it("is form-associated", () => {
    expect(WuikSwitchElement.formAssociated).toBe(true);
  });

  it("keeps indeterminate false when set through the property", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount({ label: "Sound" }) as Toggle & {
      indeterminate: boolean;
    };
    host.indeterminate = true;
    expect(host.indeterminate).toBe(false);
    expect(native(host).indeterminate).toBe(false);
  });

  it("is disabled by the form and ignores changes until re-enabled", () => {
    const host = document.createElement("wuik-switch") as Toggle & {
      formDisabledCallback(d: boolean): void;
    };
    host.setAttribute("label", "Sound");
    document.body.appendChild(host);
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    host.formDisabledCallback(true);
    native(host).dispatchEvent(new Event("change"));
    expect(native(host).disabled).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    host.formDisabledCallback(false);
    expect(native(host).disabled).toBe(false);
  });

  it("toggles on click and emits wuik-change with the new state", () => {
    const host = mount({ label: "Sound" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    expect(host.checked).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      checked: true,
      indeterminate: false,
    });
  });

  it("toggles when the label text is clicked", () => {
    const host = mount({ label: "Sound" }) as Toggle;
    (host.shadowRoot?.querySelector(".label-text") as HTMLElement).click();
    expect(host.checked).toBe(true);
  });

  it("rejects indeterminate with a warning and stays determinate", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount({ label: "Sound", indeterminate: "" });
    expect(native(host).indeterminate).toBe(false);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain("indeterminate");
  });

  it("ignores events when disabled and checked", () => {
    const host = mount({ label: "Sound", disabled: "", checked: "" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    expect(host.checked).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("turns off on click even when the indeterminate attribute is present", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount({
      label: "Sound",
      checked: "",
      indeterminate: "",
    }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    expect(host.checked).toBe(false);
    expect(handler.mock.calls[0][0].detail).toEqual({
      checked: false,
      indeterminate: false,
    });
  });

  it("reports indeterminate as false", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount({ label: "Sound", indeterminate: "" }) as Toggle & {
      indeterminate: boolean;
    };
    expect(host.indeterminate).toBe(false);
  });

  it("ignores a change event on the inner input of a disabled host", () => {
    const host = mount({ label: "Sound", disabled: "" });
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).dispatchEvent(new Event("change"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("warns when unnamed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount();
    expect(String(warn.mock.calls[0][0])).toContain("accessible name");
  });
});
