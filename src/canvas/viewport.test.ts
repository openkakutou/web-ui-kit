import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import { WuikViewportElement } from "./viewport.ts";

function mountViewport(
  attributes: Record<string, string> = {},
): WuikViewportElement {
  // Constructed via `new` rather than `document.createElement("wuik-viewport")`
  // — see the "Constructing components imported from another module" note in
  // docs/testing.md: under this project's Vitest/jsdom/esbuild combination,
  // an element built through the CustomElementRegistry construction path
  // (createElement, or parser upgrade) loses access to its own methods and
  // accessors when its class is imported from a separate module, a Vitest
  // transform-boundary artifact that does not reproduce in a real browser.
  // `new` sidesteps it while exercising the identical constructor;
  // connectedCallback/attributeChangedCallback still fire normally once the
  // element is inserted/attributed below.
  const viewport = new WuikViewportElement();
  for (const [name, value] of Object.entries(attributes)) {
    viewport.setAttribute(name, value);
  }
  document.body.appendChild(viewport);
  return viewport;
}

function stageOf(viewport: Element): HTMLElement {
  return viewport.shadowRoot?.querySelector(".stage") as HTMLElement;
}

function statusOf(viewport: Element): HTMLElement {
  return viewport.shadowRoot?.querySelector(".status") as HTMLElement;
}

function stubBox(element: HTMLElement, width: number, height: number): void {
  Object.defineProperty(element, "clientWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(element, "clientHeight", {
    value: height,
    configurable: true,
  });
  Object.defineProperty(element, "offsetWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(element, "offsetHeight", {
    value: height,
    configurable: true,
  });
  Object.defineProperty(element, "getBoundingClientRect", {
    value: () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON() {},
    }),
    configurable: true,
  });
}

function dispatchPointerEvent(
  target: EventTarget,
  type: string,
  props: Record<string, unknown>,
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: 1,
    button: 0,
    clientX: 0,
    clientY: 0,
    ...props,
  });
  target.dispatchEvent(event);
  return event;
}

describe("wuik-viewport", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("starts with an identity transform and the default accessible label", () => {
    const viewport = mountViewport();
    expect(viewport.getTransform()).toEqual({ scale: 1, x: 0, y: 0 });
    expect(stageOf(viewport).getAttribute("aria-label")).toBe(
      "Zoom and pan viewport",
    );
  });

  it("zooms centered on the pointer when the wheel fires while focused", () => {
    const viewport = mountViewport();
    const stage = stageOf(viewport);
    stubBox(stage, 200, 100);
    stage.focus();
    const changeHandler = vi.fn();
    viewport.addEventListener("wuik-viewport-change", changeHandler);

    const event = new WheelEvent("wheel", {
      deltaY: -100,
      clientX: 50,
      clientY: 30,
      bubbles: true,
      cancelable: true,
    });
    stage.dispatchEvent(event);

    expect(changeHandler).toHaveBeenCalledOnce();
    const detail = (changeHandler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.scale).toBeCloseTo(1.1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores the wheel event so it never hijacks page scroll while unfocused (edge case)", () => {
    const viewport = mountViewport();
    const stage = stageOf(viewport);
    const changeHandler = vi.fn();
    viewport.addEventListener("wuik-viewport-change", changeHandler);

    const event = new WheelEvent("wheel", {
      deltaY: -100,
      clientX: 50,
      clientY: 30,
      bubbles: true,
      cancelable: true,
    });
    stage.dispatchEvent(event);

    expect(changeHandler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(viewport.getTransform()).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("pans by the exact pointer drag distance", () => {
    const viewport = mountViewport();
    const stage = stageOf(viewport);
    dispatchPointerEvent(stage, "pointerdown", {
      pointerId: 7,
      clientX: 10,
      clientY: 10,
    });
    dispatchPointerEvent(stage, "pointermove", {
      pointerId: 7,
      clientX: 40,
      clientY: 25,
    });
    dispatchPointerEvent(stage, "pointerup", {
      pointerId: 7,
      clientX: 40,
      clientY: 25,
    });

    expect(viewport.getTransform()).toEqual({ scale: 1, x: 30, y: 15 });
    expect(stage.classList.contains("is-panning")).toBe(false);
  });

  it("ignores a drag started with a non-primary pointer button (error path)", () => {
    const viewport = mountViewport();
    const stage = stageOf(viewport);
    dispatchPointerEvent(stage, "pointerdown", {
      pointerId: 3,
      button: 2,
      clientX: 10,
      clientY: 10,
    });
    dispatchPointerEvent(stage, "pointermove", {
      pointerId: 3,
      clientX: 90,
      clientY: 90,
    });

    expect(viewport.getTransform()).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("fits and centers the slotted content on resetToFit()", () => {
    const viewport = mountViewport();
    const stage = stageOf(viewport);
    stubBox(stage, 200, 100);
    const content = document.createElement("canvas");
    Object.defineProperty(content, "offsetWidth", {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(content, "offsetHeight", {
      value: 100,
      configurable: true,
    });
    viewport.appendChild(content);

    viewport.resetToFit();

    expect(viewport.getTransform()).toEqual({ scale: 1, x: 50, y: 0 });
    expect(statusOf(viewport).textContent).toContain("100%");
  });

  it("falls back to an identity transform when resetToFit() has no slotted content (edge case)", () => {
    const viewport = mountViewport();
    expect(() => viewport.resetToFit()).not.toThrow();
    expect(viewport.getTransform()).toEqual({ scale: 1, x: 0, y: 0 });
  });

  describe("keyboard operation", () => {
    it("pans with arrow keys", () => {
      const viewport = mountViewport();
      const stage = stageOf(viewport);
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(viewport.getTransform()).toEqual({ scale: 1, x: -20, y: 0 });
    });

    it("zooms in and back out with + and -", () => {
      const viewport = mountViewport();
      const stage = stageOf(viewport);
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "+",
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(viewport.getTransform().scale).toBeCloseTo(1.1);
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "-",
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(viewport.getTransform().scale).toBeCloseTo(1);
    });

    it("resets to fit with 0 or Home", () => {
      const viewport = mountViewport();
      const stage = stageOf(viewport);
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "+",
          bubbles: true,
          cancelable: true,
        }),
      );
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Home",
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(viewport.getTransform()).toEqual({ scale: 1, x: 0, y: 0 });
    });

    it("announces that the maximum zoom was reached instead of silently doing nothing (edge case)", () => {
      const viewport = mountViewport({ "max-scale": "1" });
      const stage = stageOf(viewport);
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "+",
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(viewport.getTransform().scale).toBe(1);
      expect(statusOf(viewport).textContent).toBe("Maximum zoom reached.");
    });

    it("ignores a Ctrl/Cmd-modified +/- so the browser's own page-zoom shortcut still works (error path)", () => {
      const viewport = mountViewport();
      const stage = stageOf(viewport);
      const event = new KeyboardEvent("keydown", {
        key: "+",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      stage.dispatchEvent(event);
      expect(viewport.getTransform().scale).toBe(1);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("invalid configuration", () => {
    it("falls back to defaults and shows a visible invalid indicator when min-scale >= max-scale (error path)", () => {
      const viewport = mountViewport({ "min-scale": "5", "max-scale": "2" });
      const stage = stageOf(viewport);
      expect(stage.classList.contains("is-invalid")).toBe(true);
      expect(stage.getAttribute("aria-invalid")).toBe("true");
      const banner = viewport.shadowRoot?.querySelector(
        ".invalid-banner",
      ) as HTMLElement;
      expect(banner.textContent?.length).toBeGreaterThan(0);
    });

    it("shows no invalid indicator for well-formed configuration", () => {
      const viewport = mountViewport({ "min-scale": "0.5", "max-scale": "4" });
      const stage = stageOf(viewport);
      expect(stage.classList.contains("is-invalid")).toBe(false);
      expect(stage.getAttribute("aria-invalid")).toBe("false");
    });
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the focus ring token", () => {
      const viewport = mountViewport();
      const css =
        viewport.shadowRoot?.querySelector("style")?.textContent ?? "";
      expect(css).toContain("--wuik-color-focus-ring");
    });

    it("never hardcodes a literal color", () => {
      const viewport = mountViewport();
      const css =
        viewport.shadowRoot?.querySelector("style")?.textContent ?? "";
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });
  });
});
