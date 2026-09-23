import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initI18n } from "../i18n/i18n.ts";
import "../tokens/index.css";
import "./text-input.ts";

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountTextInput(attributes: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("wuik-text-input");
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  document.body.appendChild(el);
  return el;
}

function nativeInput(el: Element): HTMLInputElement {
  return el.shadowRoot?.querySelector("input[type='text']") as HTMLInputElement;
}

function labelEl(el: Element): HTMLLabelElement | null {
  return el.shadowRoot?.querySelector("label") ?? null;
}

function errorEl(el: Element): HTMLElement {
  return el.shadowRoot?.querySelector(".error") as HTMLElement;
}

function wrapperEl(el: Element): HTMLElement {
  return el.shadowRoot?.querySelector(".wrapper") as HTMLElement;
}

describe("wuik-text-input", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts with no attributes and renders an empty, non-required, non-invalid field (nominal)", () => {
    const el = mountTextInput();
    const input = nativeInput(el);
    expect(input.value).toBe("");
    expect(input.required).toBe(false);
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
  });

  it("reflects label, placeholder, required, and value attributes onto the native input", () => {
    const el = mountTextInput({
      label: "Name",
      placeholder: "e.g. Ryu",
      required: "",
      value: "Ken",
    });
    const input = nativeInput(el);
    expect(input.placeholder).toBe("e.g. Ryu");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.value).toBe("Ken");
    const label = labelEl(el) as HTMLLabelElement;
    expect(label.textContent).toContain("Name");
    expect(label.getAttribute("for")).toBe(input.id);
  });

  it("renders a required marker that is hidden from assistive tech (edge case)", () => {
    const el = mountTextInput({ label: "Name", required: "" });
    const marker = el.shadowRoot?.querySelector(
      ".required-marker",
    ) as HTMLElement;
    expect(marker).toBeTruthy();
    expect(marker.getAttribute("aria-hidden")).toBe("true");
  });

  it("hides the label element when no label attribute is given (edge case)", () => {
    const el = mountTextInput();
    const label = labelEl(el) as HTMLLabelElement;
    expect(label.hidden).toBe(true);
  });

  it("does not show the invalid state for a pristine, untouched, empty required field (edge case)", () => {
    const el = mountTextInput({ label: "Name", required: "" });
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
    expect(nativeInput(el).hasAttribute("aria-invalid")).toBe(false);
    expect(errorEl(el).textContent).toBe("");
  });

  it("shows the built-in invalid state once a required field is blurred while empty (error path)", () => {
    const el = mountTextInput({ label: "Name", required: "" });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));

    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(errorEl(el).textContent?.length).toBeGreaterThan(0);
    expect(input.getAttribute("aria-describedby")).toBe(errorEl(el).id);
  });

  it("clears the built-in invalid state live once the user types a non-blank value (edge case)", () => {
    const el = mountTextInput({ label: "Name", required: "" });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(true);

    input.value = "Ryu";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("shows an explicit error attribute immediately, even before the field is touched (error path)", () => {
    const el = mountTextInput({
      label: "Name",
      value: "Ryu",
      error: "Name already taken.",
    });
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(true);
    expect(errorEl(el).textContent).toBe("Name already taken.");
  });

  it("prioritizes the explicit error message over the built-in required message", () => {
    const el = mountTextInput({
      label: "Name",
      required: "",
      error: "Server rejected this value.",
    });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));
    expect(errorEl(el).textContent).toBe("Server rejected this value.");
  });

  it("never shows the invalid state while disabled, even if required and empty (error path)", () => {
    const el = mountTextInput({ label: "Name", required: "", disabled: "" });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));

    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(errorEl(el).textContent).toBe("");
    expect(input.disabled).toBe(true);
  });

  it("resets the touched state when the value attribute is set externally (edge case)", () => {
    const el = mountTextInput({ label: "Name", required: "" });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(true);

    el.setAttribute("value", "");
    expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
  });

  it("fires wuik-input on every keystroke and wuik-change on commit", () => {
    const el = mountTextInput();
    const input = nativeInput(el);
    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    el.addEventListener("wuik-input", inputHandler);
    el.addEventListener("wuik-change", changeHandler);

    input.value = "R";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.value = "Ryu";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(inputHandler).toHaveBeenCalledTimes(2);
    expect((inputHandler.mock.calls[1][0] as CustomEvent).detail.value).toBe(
      "Ryu",
    );
    expect(changeHandler).not.toHaveBeenCalled();

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(changeHandler).toHaveBeenCalledOnce();
    expect((changeHandler.mock.calls[0][0] as CustomEvent).detail.value).toBe(
      "Ryu",
    );
  });

  it("exposes value via a get/set property, reflecting through the value attribute", () => {
    const el = mountTextInput() as HTMLElement & { value: string };
    el.value = "Chun-Li";
    expect(nativeInput(el).value).toBe("Chun-Li");
    expect(el.value).toBe("Chun-Li");
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the danger color token for the invalid border", () => {
      const el = mountTextInput();
      expect(hostStyleText(el)).toContain("--wuik-color-danger");
    });

    it("references the focus ring token", () => {
      const el = mountTextInput();
      expect(hostStyleText(el)).toContain("--wuik-color-focus-ring");
    });

    it("never hardcodes a literal color", () => {
      const el = mountTextInput();
      expect(hostStyleText(el)).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("colors the invalid-state message text with the always-accessible text token, not danger (see decision 009)", () => {
      const el = mountTextInput();
      const css = hostStyleText(el);
      const errorRule = css.match(/\.error\s*{[^}]*}/)?.[0] ?? "";
      expect(errorRule).toContain("var(--wuik-color-text)");
      expect(errorRule).not.toContain("var(--wuik-color-danger)");
    });

    it("never colors the required marker with the danger token (see decision 024)", () => {
      const el = mountTextInput();
      const css = hostStyleText(el);
      const markerRule = css.match(/\.required-marker\s*{[^}]*}/)?.[0] ?? "";
      expect(markerRule).not.toContain("var(--wuik-color-danger)");
    });
  });
});

// Appended after every English-hardcoded-text test above, and each test
// below calls initI18n itself first — see the equivalent note in
// slider.test.ts/shortcut-panel.test.ts for why that's safe against the
// i18n module's module-scoped active-instance singleton.
describe("wuik-text-input — localization", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the built-in required message in the active locale, live on a locale switch", async () => {
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");

    const el = mountTextInput({ label: "Name", required: "" });
    const input = nativeInput(el);
    input.dispatchEvent(new Event("blur"));

    expect(errorEl(el).textContent).toBe("This field is required.");

    await instance.changeLanguage("fr");

    expect(errorEl(el).textContent).toBe("Ce champ est obligatoire.");
  });
});
