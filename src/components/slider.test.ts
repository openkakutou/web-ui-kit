import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./slider.ts";

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountSlider(attributes: Record<string, string> = {}): HTMLElement {
  const slider = document.createElement("wuik-slider");
  for (const [name, value] of Object.entries(attributes)) {
    slider.setAttribute(name, value);
  }
  document.body.appendChild(slider);
  return slider;
}

function nativeInput(slider: Element): HTMLInputElement {
  return slider.shadowRoot?.querySelector(
    'input[type="range"]',
  ) as HTMLInputElement;
}

describe("wuik-slider", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects min/max/step/value attributes onto the native range input", () => {
    const slider = mountSlider({ min: "0", max: "50", step: "5", value: "20" });
    const input = nativeInput(slider);
    expect(input.min).toBe("0");
    expect(input.max).toBe("50");
    expect(input.step).toBe("5");
    expect(input.value).toBe("20");
  });

  it("fires wuik-input continuously as the value changes, and wuik-change once on commit", () => {
    const slider = mountSlider({ min: "0", max: "10" });
    const input = nativeInput(slider);
    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    slider.addEventListener("wuik-input", inputHandler);
    slider.addEventListener("wuik-change", changeHandler);

    input.value = "3";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.value = "7";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(inputHandler).toHaveBeenCalledTimes(2);
    expect((inputHandler.mock.calls[1][0] as CustomEvent).detail.value).toBe(7);
    expect(changeHandler).not.toHaveBeenCalled();

    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changeHandler).toHaveBeenCalledOnce();
    expect((changeHandler.mock.calls[0][0] as CustomEvent).detail.value).toBe(
      7,
    );
  });

  it("uses documented defaults when no attributes are set (edge case)", () => {
    const slider = mountSlider();
    const input = nativeInput(slider);
    expect(input.min).toBe("0");
    expect(input.max).toBe("100");
    expect(input.step).toBe("1");
  });

  it("clamps a well-formed out-of-range value without showing an invalid state (edge case)", () => {
    const slider = mountSlider({ min: "0", max: "10", value: "999" });
    const input = nativeInput(slider);
    expect(input.value).toBe("10");
    expect(
      slider.shadowRoot
        ?.querySelector(".wrapper")
        ?.classList.contains("is-invalid"),
    ).toBe(false);
  });

  it("falls back to defaults and shows a visible invalid state when min >= max (error path)", () => {
    const slider = mountSlider({ min: "10", max: "5" });
    const input = nativeInput(slider);
    expect(input.min).toBe("0");
    expect(input.max).toBe("100");
    const wrapper = slider.shadowRoot?.querySelector(".wrapper") as HTMLElement;
    expect(wrapper.classList.contains("is-invalid")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const error = slider.shadowRoot?.querySelector(".error") as HTMLElement;
    expect(error.textContent?.length).toBeGreaterThan(0);
  });

  it("forwards a label attribute to the native input's accessible name", () => {
    const slider = mountSlider({ label: "Brush size" });
    expect(nativeInput(slider).getAttribute("aria-label")).toBe("Brush size");
  });

  it("does not fabricate an accessible name when no label is given (edge case)", () => {
    const slider = mountSlider();
    expect(nativeInput(slider).hasAttribute("aria-label")).toBe(false);
  });

  it("disables the native input and stops emitting events while disabled (error path)", () => {
    const slider = mountSlider({ disabled: "" });
    const input = nativeInput(slider);
    expect(input.disabled).toBe(true);
    const changeHandler = vi.fn();
    slider.addEventListener("wuik-change", changeHandler);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(changeHandler).not.toHaveBeenCalled();
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the danger color token for the invalid state", () => {
      const slider = mountSlider();
      const css = hostStyleText(slider);
      expect(css).toContain("--wuik-color-danger");
    });

    it("references the focus ring token", () => {
      const slider = mountSlider();
      const css = hostStyleText(slider);
      expect(css).toContain("--wuik-color-focus-ring");
    });

    it("never hardcodes a literal color", () => {
      const slider = mountSlider();
      const css = hostStyleText(slider);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("colors the invalid-state message text with the always-accessible text token, not danger (see decision 009)", () => {
      const slider = mountSlider();
      const css = hostStyleText(slider);
      const errorRule = css.match(/\.error\s*{[^}]*}/)?.[0] ?? "";
      expect(errorRule).toContain("var(--wuik-color-text)");
      expect(errorRule).not.toContain("var(--wuik-color-danger)");
    });
  });
});
