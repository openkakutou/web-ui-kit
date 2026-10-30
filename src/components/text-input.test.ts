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
  return el.shadowRoot?.querySelector("input") as HTMLInputElement;
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
      expect(hostStyleText(el)).toContain("--wuik-color-error");
    });

    it("references the focus ring token", () => {
      const el = mountTextInput();
      expect(hostStyleText(el)).toContain("--wuik-color-focus");
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
      expect(errorRule).not.toContain("var(--wuik-color-error)");
    });

    it("never colors the required marker with the danger token (see decision 024)", () => {
      const el = mountTextInput();
      const css = hostStyleText(el);
      const markerRule = css.match(/\.required-marker\s*{[^}]*}/)?.[0] ?? "";
      expect(markerRule).not.toContain("var(--wuik-color-error)");
    });
  });

  describe("type=number", () => {
    function blur(el: Element): void {
      nativeInput(el).dispatchEvent(new Event("blur"));
    }

    it("renders a native number input and forwards min, max and step", () => {
      const el = mountTextInput({
        type: "number",
        min: "1",
        max: "9",
        step: "2",
      });
      const input = nativeInput(el);
      expect(input.type).toBe("number");
      expect(input.getAttribute("min")).toBe("1");
      expect(input.getAttribute("max")).toBe("9");
      expect(input.getAttribute("step")).toBe("2");
    });

    it("defaults inputmode to numeric for integer or absent step, decimal otherwise", () => {
      expect(
        nativeInput(mountTextInput({ type: "number" })).getAttribute(
          "inputmode",
        ),
      ).toBe("numeric");
      expect(
        nativeInput(mountTextInput({ type: "number", step: "5" })).getAttribute(
          "inputmode",
        ),
      ).toBe("numeric");
      expect(
        nativeInput(
          mountTextInput({ type: "number", step: "0.1" }),
        ).getAttribute("inputmode"),
      ).toBe("decimal");
      expect(
        nativeInput(
          mountTextInput({ type: "number", step: "any" }),
        ).getAttribute("inputmode"),
      ).toBe("decimal");
    });

    it("forwards a consumer inputmode and sets none in text mode", () => {
      expect(
        nativeInput(
          mountTextInput({ type: "number", inputmode: "text" }),
        ).getAttribute("inputmode"),
      ).toBe("text");
      expect(
        nativeInput(mountTextInput({ inputmode: "email" })).getAttribute(
          "inputmode",
        ),
      ).toBe("email");
      expect(nativeInput(mountTextInput()).hasAttribute("inputmode")).toBe(
        false,
      );
    });

    it("falls back to a text input for an unknown type, without min/max/step", () => {
      const el = mountTextInput({ type: "range", min: "1" });
      expect(nativeInput(el).type).toBe("text");
      expect(nativeInput(el).hasAttribute("min")).toBe(false);
    });

    it("shows the invalid state with a range message after blur when out of range", () => {
      const el = mountTextInput({ type: "number", min: "1", max: "9" });
      const input = nativeInput(el);
      input.value = "12";
      input.dispatchEvent(new Event("input"));
      expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
      blur(el);
      expect(wrapperEl(el).classList.contains("is-invalid")).toBe(true);
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(errorEl(el).textContent).toBe("Enter a number between 1 and 9.");
      input.value = "5";
      input.dispatchEvent(new Event("input"));
      expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
    });

    it("uses a min-only and a max-only message", () => {
      const lo = mountTextInput({ type: "number", min: "3" });
      nativeInput(lo).value = "1";
      blur(lo);
      expect(errorEl(lo).textContent).toBe("Enter a number of at least 3.");
      const hi = mountTextInput({ type: "number", max: "3" });
      nativeInput(hi).value = "8";
      blur(hi);
      expect(errorEl(hi).textContent).toBe("Enter a number of at most 3.");
    });

    it("keeps an empty non-required number field valid after blur", () => {
      const el = mountTextInput({ type: "number", min: "1" });
      blur(el);
      expect(wrapperEl(el).classList.contains("is-invalid")).toBe(false);
    });

    it("lets a custom error win over the range message", () => {
      const el = mountTextInput({ type: "number", max: "3", error: "Taken" });
      nativeInput(el).value = "8";
      blur(el);
      expect(errorEl(el).textContent).toBe("Taken");
    });

    it("keeps the typed value when type is switched live", () => {
      const el = mountTextInput();
      nativeInput(el).value = "42";
      el.setAttribute("type", "number");
      expect(nativeInput(el).type).toBe("number");
      expect(nativeInput(el).value).toBe("42");
      el.setAttribute("type", "text");
      expect(nativeInput(el).type).toBe("text");
      expect(nativeInput(el).value).toBe("42");
    });

    it("emits wuik-input with a string value", () => {
      const el = mountTextInput({ type: "number" });
      const handler = vi.fn();
      el.addEventListener("wuik-input", handler);
      nativeInput(el).value = "7";
      nativeInput(el).dispatchEvent(new Event("input"));
      expect(handler.mock.calls[0][0].detail).toEqual({ value: "7" });
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

  describe("hint", () => {
    function hintEl(el: Element): HTMLElement {
      return el.shadowRoot?.querySelector(".hint") as HTMLElement;
    }

    function describedByIds(el: Element): string[] {
      return (nativeInput(el).getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter(Boolean);
    }

    it("shows the hint text and links it to the input with aria-describedby (nominal)", () => {
      const el = mountTextInput({
        label: "Name",
        hint: "Up to 20 characters.",
      });

      expect(hintEl(el).textContent).toBe("Up to 20 characters.");
      expect(hintEl(el).hidden).toBe(false);
      expect(describedByIds(el)).toEqual([hintEl(el).id]);
    });

    it("sets no aria-describedby and hides the hint when there is no hint (edge case)", () => {
      const el = mountTextInput({ label: "Name" });

      expect(hintEl(el).hidden).toBe(true);
      expect(nativeInput(el).hasAttribute("aria-describedby")).toBe(false);
    });

    it("treats a blank hint like no hint (edge case)", () => {
      const el = mountTextInput({ label: "Name", hint: "   " });

      expect(hintEl(el).hidden).toBe(true);
      expect(nativeInput(el).hasAttribute("aria-describedby")).toBe(false);
    });

    it("announces the hint and the error together while invalid, then the hint alone once valid (error path)", () => {
      const el = mountTextInput({
        label: "Name",
        hint: "Up to 20 characters.",
        required: "",
      });
      const input = nativeInput(el);

      input.dispatchEvent(new Event("blur"));
      expect(describedByIds(el)).toEqual([hintEl(el).id, errorEl(el).id]);

      input.value = "Ryu";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      expect(describedByIds(el)).toEqual([hintEl(el).id]);
    });

    it("keeps announcing the error alone when the hint is removed while invalid (edge case)", () => {
      const el = mountTextInput({
        label: "Name",
        hint: "Up to 20 characters.",
        error: "Already taken.",
      });
      el.removeAttribute("hint");

      expect(describedByIds(el)).toEqual([errorEl(el).id]);
    });

    it("updates the hint without overwriting what the user typed (edge case)", () => {
      const el = mountTextInput({ label: "Name", hint: "Old." });
      const input = nativeInput(el);
      input.value = "Ryu";
      el.setAttribute("hint", "New.");

      expect(input.value).toBe("Ryu");
      expect(hintEl(el).textContent).toBe("New.");
    });

    it("never announces a hint on a disabled field's error state (edge case)", () => {
      const el = mountTextInput({
        label: "Name",
        hint: "Up to 20 characters.",
        error: "Already taken.",
        disabled: "",
      });

      expect(describedByIds(el)).toEqual([hintEl(el).id]);
    });
  });
});
