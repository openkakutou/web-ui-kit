import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./color-picker.ts";

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountColorPicker(
  attributes: Record<string, string> = {},
): HTMLElement {
  const picker = document.createElement("wuik-color-picker");
  for (const [name, value] of Object.entries(attributes)) {
    picker.setAttribute(name, value);
  }
  document.body.appendChild(picker);
  return picker;
}

function nativeInput(picker: Element): HTMLInputElement {
  return picker.shadowRoot?.querySelector(
    'input[type="color"]',
  ) as HTMLInputElement;
}

describe("wuik-color-picker", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects a well-formed value onto the native color input", () => {
    const picker = mountColorPicker({ value: "#ff00aa" });
    expect(nativeInput(picker).value).toBe("#ff00aa");
  });

  it("emits wuik-change with the new value when the native input changes", () => {
    const picker = mountColorPicker({ value: "#000000" });
    const handler = vi.fn();
    picker.addEventListener("wuik-change", handler);
    const input = nativeInput(picker);

    input.value = "#00ff00";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(handler).toHaveBeenCalledOnce();
    expect((handler.mock.calls[0][0] as CustomEvent).detail.value).toBe(
      "#00ff00",
    );
  });

  it("renders a swatch button per palette entry and selecting one emits wuik-change (edge case)", () => {
    const picker = mountColorPicker({
      palette: "#ff0000,#00ff00,#0000ff",
      value: "#000000",
    });
    const handler = vi.fn();
    picker.addEventListener("wuik-change", handler);
    const swatches = picker.shadowRoot?.querySelectorAll(".swatch");
    expect(swatches).toHaveLength(3);

    (swatches?.[1] as HTMLButtonElement).click();

    expect(handler).toHaveBeenCalledOnce();
    expect((handler.mock.calls[0][0] as CustomEvent).detail.value).toBe(
      "#00ff00",
    );
    expect(nativeInput(picker).value).toBe("#00ff00");
  });

  it("defaults to black when no value attribute is given (edge case)", () => {
    const picker = mountColorPicker();
    expect(nativeInput(picker).value).toBe("#000000");
  });

  it("falls back to black and shows a visible invalid state for a malformed value (error path)", () => {
    const picker = mountColorPicker({ value: "not-a-color" });
    expect(nativeInput(picker).value).toBe("#000000");
    const wrapper = picker.shadowRoot?.querySelector(".wrapper") as HTMLElement;
    expect(wrapper.classList.contains("is-invalid")).toBe(true);
    const error = picker.shadowRoot?.querySelector(".error") as HTMLElement;
    expect(error.textContent?.length).toBeGreaterThan(0);
  });

  it("drops malformed palette entries instead of crashing (error path)", () => {
    const picker = mountColorPicker({ palette: "#ff0000,not-a-color" });
    const swatches = picker.shadowRoot?.querySelectorAll(".swatch");
    expect(swatches).toHaveLength(1);
  });

  it("forwards a label attribute to the native input's accessible name", () => {
    const picker = mountColorPicker({ label: "Highlight color" });
    expect(nativeInput(picker).getAttribute("aria-label")).toBe(
      "Highlight color",
    );
  });

  it("does not fabricate an accessible name when no label is given (edge case)", () => {
    const picker = mountColorPicker();
    expect(nativeInput(picker).hasAttribute("aria-label")).toBe(false);
  });

  it("disables the native input and ignores swatch clicks while disabled", () => {
    const picker = mountColorPicker({
      disabled: "",
      palette: "#ff0000",
      value: "#000000",
    });
    const input = nativeInput(picker);
    expect(input.disabled).toBe(true);
    const handler = vi.fn();
    picker.addEventListener("wuik-change", handler);
    (picker.shadowRoot?.querySelector(".swatch") as HTMLButtonElement).click();
    expect(handler).not.toHaveBeenCalled();
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the danger color token for the invalid state", () => {
      const picker = mountColorPicker();
      const css = hostStyleText(picker);
      expect(css).toContain("--wuik-color-danger");
    });

    it("references the focus ring token", () => {
      const picker = mountColorPicker();
      const css = hostStyleText(picker);
      expect(css).toContain("--wuik-color-focus-ring");
    });

    it("colors the invalid-state message text with the always-accessible text token, not danger (see decision 009)", () => {
      const picker = mountColorPicker();
      const css = hostStyleText(picker);
      const errorRule = css.match(/\.error\s*{[^}]*}/)?.[0] ?? "";
      expect(errorRule).toContain("var(--wuik-color-text)");
      expect(errorRule).not.toContain("var(--wuik-color-danger)");
    });
  });
});
