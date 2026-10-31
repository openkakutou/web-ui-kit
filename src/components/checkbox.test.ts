import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initI18n } from "../i18n/i18n.ts";
import "../tokens/index.css";
import { WuikCheckboxElement } from "./checkbox.ts";

function mount(
  attributes: Record<string, string> = {},
  parent: HTMLElement = document.body,
): HTMLElement {
  const el = document.createElement("wuik-checkbox");
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  parent.appendChild(el);
  return el;
}

const native = (host: Element) =>
  host.shadowRoot?.querySelector("input") as HTMLInputElement;
type Toggle = HTMLElement & { checked: boolean; indeterminate: boolean };

describe("wuik-checkbox", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("toggles and emits one wuik-change per user click", () => {
    const host = mount({ label: "Subscribe" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    expect(host.checked).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      checked: true,
      indeterminate: false,
    });
    expect(handler.mock.calls[0][0].bubbles).toBe(true);
    expect(handler.mock.calls[0][0].composed).toBe(true);
    native(host).click();
    expect(host.checked).toBe(false);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("toggles when the visible label text is clicked", () => {
    const host = mount({ label: "Subscribe" }) as Toggle;
    (host.shadowRoot?.querySelector(".label-text") as HTMLElement).click();
    expect(host.checked).toBe(true);
  });

  it("names the native input after the label attribute", () => {
    const host = mount({ label: "Subscribe" });
    const label = native(host).labels?.[0];
    expect(label?.textContent).toContain("Subscribe");
  });

  it("never emits wuik-change for programmatic changes", () => {
    const host = mount({ label: "A" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    host.checked = true;
    host.setAttribute("checked", "");
    host.indeterminate = true;
    expect(handler).not.toHaveBeenCalled();
    expect(native(host).checked).toBe(true);
  });

  it("resolves indeterminate to checked on user click and clears it", () => {
    const host = mount({ label: "All", indeterminate: "" }) as Toggle;
    expect(native(host).indeterminate).toBe(true);
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    expect(host.checked).toBe(true);
    expect(native(host).indeterminate).toBe(false);
    expect(host.hasAttribute("indeterminate")).toBe(false);
    expect(handler.mock.calls[0][0].detail).toEqual({
      checked: true,
      indeterminate: false,
    });
  });

  it("resolves indeterminate to checked even when it was already checked", () => {
    const host = mount({
      label: "All",
      checked: "",
      indeterminate: "",
    }) as Toggle;
    native(host).click();
    expect(host.checked).toBe(true);
  });

  it("ignores clicks when disabled but keeps the checked state visible", () => {
    const host = mount({ label: "A", disabled: "", checked: "" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).click();
    host.click();
    expect(native(host).disabled).toBe(true);
    expect(host.checked).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps an accessible name with hide-label but hides the text visually", () => {
    const host = mount({ label: "Select row 3", "hide-label": "" });
    expect(native(host).labels?.[0].textContent).toContain("Select row 3");
    expect(
      host.shadowRoot?.querySelector(".text")?.classList.contains("is-hidden"),
    ).toBe(true);
  });

  it("uses aria-label as the name and does not warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount({ "aria-label": "Select row" });
    expect(native(host).getAttribute("aria-label")).toBe("Select row");
    expect(warn).not.toHaveBeenCalled();
  });

  it("still warns with only an external label[for], which toggles on click", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const label = document.createElement("label");
    label.htmlFor = "ext";
    label.textContent = "External";
    document.body.appendChild(label);
    const host = mount({ id: "ext" }) as Toggle;
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("accessible name");
    host.click();
    expect(host.checked).toBe(true);
  });

  it("is form-associated", () => {
    expect(WuikCheckboxElement.formAssociated).toBe(true);
  });

  it("exposes role=checkbox and data-kind=checkbox", () => {
    const host = mount({ label: "A" });
    expect(native(host).getAttribute("role")).toBe("checkbox");
    expect(host.getAttribute("data-kind")).toBe("checkbox");
  });

  it("does not treat a whitespace-only error as invalid", () => {
    const host = mount({ label: "A", error: "   " });
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
    expect(
      host.shadowRoot
        ?.querySelector(".wrapper")
        ?.classList.contains("is-invalid"),
    ).toBe(false);
  });

  it("reveals the required error on an invalid event without blur", () => {
    const host = mount({ label: "A", required: "" });
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
    host.dispatchEvent(new Event("invalid"));
    expect(native(host).getAttribute("aria-invalid")).toBe("true");
  });

  it("shows the required marker only while required", () => {
    const host = mount({ label: "A" });
    const marker = host.shadowRoot?.querySelector(
      ".required-marker",
    ) as HTMLElement;
    expect(marker.hidden).toBe(true);
    host.setAttribute("required", "");
    expect(marker.hidden).toBe(false);
    host.removeAttribute("required");
    expect(marker.hidden).toBe(true);
  });

  it("drops aria-label from the input when label is present", () => {
    const host = mount({ label: "Visible", "aria-label": "Other" });
    expect(native(host).hasAttribute("aria-label")).toBe(false);
  });

  it("shows no aria-invalid when disabled even with an error", () => {
    const host = mount({ label: "A", disabled: "", error: "Bad" });
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
  });

  describe("disabled by the form (formDisabledCallback)", () => {
    type FormDisabled = Toggle & { formDisabledCallback(d: boolean): void };

    it("disables the native input and ignores changes", () => {
      const host = mount({ label: "A" }) as FormDisabled;
      const handler = vi.fn();
      host.addEventListener("wuik-change", handler);
      host.formDisabledCallback(true);
      native(host).dispatchEvent(new Event("change"));
      expect(native(host).disabled).toBe(true);
      expect(handler).not.toHaveBeenCalled();
    });

    it("re-enables the native input when the form enables it again", () => {
      const host = mount({ label: "A" }) as FormDisabled;
      host.formDisabledCallback(true);
      host.formDisabledCallback(false);
      expect(native(host).disabled).toBe(false);
    });
  });

  it("warns when there is no label nor aria-label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("accessible name");
  });

  it("links a consumer error to the control and marks it invalid", () => {
    const host = mount({ label: "A", error: "Accept the terms." });
    expect(native(host).getAttribute("aria-invalid")).toBe("true");
    const error = host.shadowRoot?.querySelector(".error") as HTMLElement;
    expect(error.textContent).toBe("Accept the terms.");
    expect(native(host).getAttribute("aria-describedby")).toBe(error.id);
    expect(
      host.shadowRoot
        ?.querySelector(".wrapper")
        ?.classList.contains("is-invalid"),
    ).toBe(true);
    host.removeAttribute("error");
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
  });

  it("shows required-unchecked as invalid only after touched", () => {
    const host = mount({ label: "A", required: "" });
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
    native(host).dispatchEvent(new Event("blur"));
    expect(native(host).getAttribute("aria-invalid")).toBe("true");
    expect(host.shadowRoot?.querySelector(".error")?.textContent).not.toBe("");
    native(host).click();
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
  });

  describe("checked state across connection", () => {
    it("keeps a checked property set before the element is attached", () => {
      const el = document.createElement("wuik-checkbox") as Toggle;
      el.setAttribute("label", "A");
      el.checked = true;
      document.body.appendChild(el);
      expect(el.checked).toBe(true);
    });

    it("keeps the toggled state when the element is moved", () => {
      const host = mount({ label: "A" }) as Toggle;
      native(host).click();
      const other = document.createElement("div");
      document.body.appendChild(other);
      other.appendChild(host);
      expect(host.checked).toBe(true);
    });

    it("keeps a user-unchecked state when moved despite the checked attribute", () => {
      const host = mount({ label: "A", checked: "" }) as Toggle;
      native(host).click();
      document.body.appendChild(host);
      expect(host.checked).toBe(false);
    });

    it("follows a later checked attribute change only while untouched", () => {
      const host = mount({ label: "A" }) as Toggle;
      host.setAttribute("checked", "");
      expect(host.checked).toBe(true);
      native(host).click();
      host.removeAttribute("checked");
      host.setAttribute("checked", "");
      expect(host.checked).toBe(false);
    });

    it("stops following the checked attribute once the property was set", () => {
      const host = mount({ label: "A" }) as Toggle;
      host.checked = false;
      host.setAttribute("checked", "");
      expect(host.checked).toBe(false);
    });

    it("restores the attribute default on reset and follows the attribute again", () => {
      const host = mount({ label: "A", checked: "" }) as Toggle & {
        formResetCallback(): void;
      };
      host.checked = false;
      host.formResetCallback();
      expect(host.checked).toBe(true);
      host.removeAttribute("checked");
      expect(host.checked).toBe(false);
    });
  });

  describe("form association", () => {
    type Internals = {
      setFormValue: ReturnType<typeof vi.fn>;
      setValidity: ReturnType<typeof vi.fn>;
    };
    type FormToggle = Toggle & {
      formResetCallback(): void;
      formStateRestoreCallback(s: string | File | FormData | null): void;
    };
    const proto = HTMLElement.prototype as unknown as {
      attachInternals?: () => unknown;
    };
    const original = Object.getOwnPropertyDescriptor(proto, "attachInternals");
    let internals: Internals;

    beforeEach(() => {
      internals = { setFormValue: vi.fn(), setValidity: vi.fn() };
      Object.defineProperty(proto, "attachInternals", {
        configurable: true,
        writable: true,
        value: () => internals,
      });
    });

    afterEach(() => {
      if (original) {
        Object.defineProperty(proto, "attachInternals", original);
      } else {
        Reflect.deleteProperty(proto, "attachInternals");
      }
    });

    const lastValue = () => internals.setFormValue.mock.lastCall?.[0];

    it('submits "on" when checked and null when unchecked', () => {
      const host = mount({ label: "A" }) as FormToggle;
      expect(lastValue()).toBeNull();
      native(host).click();
      expect(lastValue()).toBe("on");
      native(host).click();
      expect(lastValue()).toBeNull();
    });

    it("submits the custom value attribute when checked", () => {
      mount({ label: "A", checked: "", value: "yes" });
      expect(lastValue()).toBe("yes");
    });

    it("refreshes the submitted value when value changes while checked", () => {
      const host = mount({ label: "A", checked: "", value: "yes" });
      host.setAttribute("value", "maybe");
      expect(lastValue()).toBe("maybe");
    });

    it("flags valueMissing on the inner input while required and unchecked, and clears it when checked", () => {
      const host = mount({ label: "A", required: "" }) as FormToggle;
      expect(internals.setValidity).toHaveBeenLastCalledWith(
        { valueMissing: true },
        "This option is required.",
        native(host),
      );
      native(host).click();
      expect(internals.setValidity).toHaveBeenLastCalledWith({});
    });

    it("restores the checked default on form reset", () => {
      const host = mount({ label: "A", checked: "" }) as FormToggle;
      native(host).click();
      expect(lastValue()).toBeNull();
      host.formResetCallback();
      expect(host.checked).toBe(true);
      expect(lastValue()).toBe("on");
    });

    it("restores checked from browser-saved form state", () => {
      const host = mount({ label: "A" }) as FormToggle;
      host.formStateRestoreCallback("on");
      expect(host.checked).toBe(true);
      expect(lastValue()).toBe("on");
    });

    it("treats a null saved form state as unchecked", () => {
      const host = mount({ label: "A", checked: "" }) as FormToggle;
      host.formStateRestoreCallback(null);
      expect(host.checked).toBe(false);
      expect(lastValue()).toBeNull();
    });

    it("keeps a browser-restored state against a later checked attribute change", () => {
      const host = mount({ label: "A" }) as FormToggle;
      host.formStateRestoreCallback("on");
      host.setAttribute("checked", "");
      host.removeAttribute("checked");
      expect(host.checked).toBe(true);
    });

    it("keeps a browser-restored state when the element is moved", () => {
      const host = mount({ label: "A" }) as FormToggle;
      host.formStateRestoreCallback("on");
      const other = document.createElement("div");
      document.body.appendChild(other);
      other.appendChild(host);
      expect(host.checked).toBe(true);
    });
  });

  it("ignores a change event on the inner input of a disabled host", () => {
    const host = mount({ label: "A", disabled: "" }) as Toggle;
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).dispatchEvent(new Event("change"));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("wuik-checkbox — localization", () => {
  afterEach(async () => {
    document.body.innerHTML = "";
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");
  });

  it("shows the required message in English, then French after a locale switch", async () => {
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");
    const host = mount({ label: "A", required: "" });
    native(host).dispatchEvent(new Event("blur"));
    const error = host.shadowRoot?.querySelector(".error") as HTMLElement;
    expect(error.textContent).toBe("This option is required.");
    await instance.changeLanguage("fr");
    expect(error.textContent).toBe("Cette option est obligatoire.");
  });

  it("stops re-rendering on locale changes once disconnected", async () => {
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");
    const host = mount({ label: "A", required: "" });
    native(host).dispatchEvent(new Event("blur"));
    const error = host.shadowRoot?.querySelector(".error") as HTMLElement;
    host.remove();
    await instance.changeLanguage("fr");
    expect(error.textContent).toBe("This option is required.");
  });
});
