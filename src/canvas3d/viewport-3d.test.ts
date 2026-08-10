import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import { WuikViewport3DElement } from "./viewport-3d.ts";

function mountViewport3D(
  attributes: Record<string, string> = {},
): WuikViewport3DElement {
  // Constructed via `new` rather than `document.createElement("wuik-viewport-3d")`
  // — see "Constructing a component imported from another module" in
  // docs/testing.md: under this project's Vitest/jsdom/esbuild combination,
  // an element built through the CustomElementRegistry construction path
  // loses access to its own methods/accessors when its class is imported
  // from a separate module. `new` sidesteps it; connectedCallback/
  // attributeChangedCallback still fire normally once inserted/attributed.
  const viewport = new WuikViewport3DElement();
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

function resetButtonOf(viewport: Element): HTMLButtonElement {
  return viewport.shadowRoot?.querySelector(
    ".reset-button",
  ) as HTMLButtonElement;
}

function hintOf(viewport: Element): HTMLElement {
  return viewport.shadowRoot?.querySelector(".hint") as HTMLElement;
}

function unsupportedPanelOf(viewport: Element): HTMLElement {
  return viewport.shadowRoot?.querySelector(
    ".unsupported-panel",
  ) as HTMLElement;
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

describe("wuik-viewport-3d", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("when WebGL is supported", () => {
    beforeEach(() => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        // biome-ignore lint/suspicious/noExplicitAny: stubbing a browser API jsdom does not implement
        ((type: string) => (type === "webgl2" ? {} : null)) as any,
      );
    });

    it("starts at the documented default camera with the default accessible label", () => {
      const viewport = mountViewport3D();
      const camera = viewport.getCamera();
      expect(camera.target).toEqual({ x: 0, y: 0, z: 0 });
      expect(camera.distance).toBe(10);
      expect(camera.azimuth).toBe(0);
      expect(camera.elevation).toBeCloseTo(Math.PI / 3);
      expect(stageOf(viewport).getAttribute("aria-label")).toBe(
        "Orbit, pan, and zoom 3D viewport",
      );
    });

    it("orbits around the target when dragging the primary button without a modifier", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 1,
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 1,
        clientX: 150,
        clientY: 80,
      });

      const camera = viewport.getCamera();
      expect(camera.azimuth).toBeCloseTo(2 * Math.PI - 0.5);
      expect(camera.elevation).toBeCloseTo(Math.PI / 3 + 0.2);
      expect(stage.classList.contains("is-orbiting")).toBe(true);
    });

    it("pans instead of orbiting when dragging the primary button with Shift held", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 2,
        button: 0,
        shiftKey: true,
        clientX: 0,
        clientY: 0,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 2,
        clientX: 10,
        clientY: 0,
      });

      const camera = viewport.getCamera();
      expect(camera.target.x).toBeCloseTo(-0.2);
      expect(camera.target.y).toBeCloseTo(0);
      expect(camera.target.z).toBeCloseTo(0);
      expect(camera.azimuth).toBe(0);
      expect(stage.classList.contains("is-panning")).toBe(true);
    });

    it("pans when dragging with the secondary (right) button, without needing Shift (edge case)", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 3,
        button: 2,
        clientX: 0,
        clientY: 0,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 3,
        clientX: 0,
        clientY: 10,
      });

      const camera = viewport.getCamera();
      expect(camera.target.x).toBeCloseTo(0);
      expect(camera.target.y).toBeCloseTo(0.17320508);
      expect(camera.target.z).toBeCloseTo(-0.1);
    });

    it("ignores a drag started with a non-primary, non-secondary pointer button (error path)", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 4,
        button: 1,
        clientX: 0,
        clientY: 0,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 4,
        clientX: 90,
        clientY: 90,
      });

      expect(viewport.getCamera().target).toEqual({ x: 0, y: 0, z: 0 });
    });

    it("suppresses the context menu on right-click so right-drag panning works", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      const event = new Event("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      stage.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it("zooms toward the target when the wheel fires while focused", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      stage.focus();
      const changeHandler = vi.fn();
      viewport.addEventListener("wuik-viewport3d-change", changeHandler);

      const event = new WheelEvent("wheel", {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      });
      stage.dispatchEvent(event);

      expect(changeHandler).toHaveBeenCalledOnce();
      expect(viewport.getCamera().distance).toBeCloseTo(10 / 1.1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("ignores the wheel event so it never hijacks page scroll while unfocused (edge case)", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      const changeHandler = vi.fn();
      viewport.addEventListener("wuik-viewport3d-change", changeHandler);

      const event = new WheelEvent("wheel", {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      });
      stage.dispatchEvent(event);

      expect(changeHandler).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      expect(viewport.getCamera().distance).toBe(10);
    });

    it("dismisses the visible hint after the first interaction", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      expect(hintOf(viewport).classList.contains("is-dismissed")).toBe(false);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 5,
        button: 0,
        clientX: 0,
        clientY: 0,
      });
      expect(hintOf(viewport).classList.contains("is-dismissed")).toBe(true);
    });

    it("resets to the default view via the built-in reset button, reachable without the keyboard (edge case)", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 6,
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 6,
        clientX: 150,
        clientY: 150,
      });

      resetButtonOf(viewport).dispatchEvent(
        new Event("click", { bubbles: true }),
      );

      expect(viewport.getCamera()).toMatchObject({
        target: { x: 0, y: 0, z: 0 },
        distance: 10,
        azimuth: 0,
      });
      expect(statusOf(viewport).textContent).toBe("View reset.");
    });

    describe("keyboard operation", () => {
      it("orbits with arrow keys", () => {
        const viewport = mountViewport3D();
        const stage = stageOf(viewport);
        stage.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowRight",
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(viewport.getCamera().azimuth).toBeCloseTo(0.05);
      });

      it("pans instead of orbiting with Shift plus arrow keys", () => {
        const viewport = mountViewport3D();
        const stage = stageOf(viewport);
        stage.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowRight",
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        const camera = viewport.getCamera();
        expect(camera.azimuth).toBe(0);
        expect(camera.target.x).toBeCloseTo(-0.4);
      });

      it("zooms in and back out with + and -", () => {
        const viewport = mountViewport3D();
        const stage = stageOf(viewport);
        stage.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "+",
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(viewport.getCamera().distance).toBeCloseTo(10 / 1.1);
        stage.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "-",
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(viewport.getCamera().distance).toBeCloseTo(10);
      });

      it("resets to the default view with 0 or Home", () => {
        const viewport = mountViewport3D();
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
        expect(viewport.getCamera().distance).toBe(10);
      });

      it("announces that the maximum zoom was reached instead of silently doing nothing (edge case)", () => {
        const viewport = mountViewport3D({ "max-distance": "10" });
        const stage = stageOf(viewport);
        stage.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "-",
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(viewport.getCamera().distance).toBe(10);
        expect(statusOf(viewport).textContent).toBe("Maximum zoom reached.");
      });

      it("ignores a Ctrl/Cmd-modified +/- so the browser's own page-zoom shortcut still works (error path)", () => {
        const viewport = mountViewport3D();
        const stage = stageOf(viewport);
        const event = new KeyboardEvent("keydown", {
          key: "+",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        stage.dispatchEvent(event);
        expect(viewport.getCamera().distance).toBe(10);
        expect(event.defaultPrevented).toBe(false);
      });
    });

    describe("invalid configuration", () => {
      it("falls back to defaults and shows a visible invalid indicator when min-distance >= max-distance (error path)", () => {
        const viewport = mountViewport3D({
          "min-distance": "50",
          "max-distance": "20",
        });
        const stage = stageOf(viewport);
        expect(stage.classList.contains("is-invalid")).toBe(true);
        expect(stage.getAttribute("aria-invalid")).toBe("true");
        const banner = viewport.shadowRoot?.querySelector(
          ".invalid-banner",
        ) as HTMLElement;
        expect(banner.textContent?.length).toBeGreaterThan(0);
      });

      it("shows no invalid indicator for well-formed configuration", () => {
        const viewport = mountViewport3D({
          "min-distance": "2",
          "max-distance": "50",
        });
        const stage = stageOf(viewport);
        expect(stage.classList.contains("is-invalid")).toBe(false);
        expect(stage.getAttribute("aria-invalid")).toBe("false");
      });
    });

    describe("token-based styling (verified structurally — see decision 006)", () => {
      it("references the focus ring token", () => {
        const viewport = mountViewport3D();
        const css =
          viewport.shadowRoot?.querySelector("style")?.textContent ?? "";
        expect(css).toContain("--wuik-color-focus-ring");
      });

      it("never hardcodes a literal color", () => {
        const viewport = mountViewport3D();
        const css =
          viewport.shadowRoot?.querySelector("style")?.textContent ?? "";
        expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
      });
    });
  });

  describe("when WebGL is not supported (error path)", () => {
    // No stubbing needed: jsdom implements no WebGL context at all, so the
    // component's own real feature detection naturally reports "unsupported"
    // here — same real-environment behavior verified directly in
    // orbit-camera.test.ts's "against a real jsdom canvas" case.

    it("shows a clear, non-broken fallback state instead of a broken interactive area", () => {
      const viewport = mountViewport3D();
      expect(viewport.classList.contains("is-unsupported")).toBe(true);
      const panel = unsupportedPanelOf(viewport);
      expect(panel.getAttribute("role")).toBe("status");
      expect(panel.textContent).toContain("3D preview unavailable");
      expect(panel.textContent?.length).toBeGreaterThan(
        "3D preview unavailable".length,
      );
    });

    it("does not orbit, pan, or zoom while in the unsupported state", () => {
      const viewport = mountViewport3D();
      const stage = stageOf(viewport);
      stage.focus();
      dispatchPointerEvent(stage, "pointerdown", {
        pointerId: 9,
        button: 0,
        clientX: 0,
        clientY: 0,
      });
      dispatchPointerEvent(stage, "pointermove", {
        pointerId: 9,
        clientX: 100,
        clientY: 100,
      });
      stage.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        }),
      );
      stage.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );

      const camera = viewport.getCamera();
      expect(camera.target).toEqual({ x: 0, y: 0, z: 0 });
      expect(camera.distance).toBe(10);
      expect(camera.azimuth).toBe(0);
      expect(camera.elevation).toBe(Math.PI / 3);
      expect(camera.position.x).toBeCloseTo(0);
      expect(camera.position.y).toBeCloseTo(5);
      expect(camera.position.z).toBeCloseTo(8.660254);
    });
  });
});
