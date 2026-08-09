/**
 * `<wuik-viewport>` — reusable zoom/pan/reset-to-fit controls wrapping a
 * single default-slotted element (typically a `<canvas>`, but the
 * component never reads or writes its pixels — see
 * `.vibe/decisions/008-viewport-controls-integration-contract.md`).
 * Usable on its own, with no dependency on any other component (backlog
 * item 004).
 *
 * Integration contract: the component applies a CSS
 * `transform: translate() scale()` to its slotted content — that alone
 * delivers working wheel-zoom/drag-pan/reset-to-fit for *any* slotted
 * element, regardless of how it renders itself. Consumers that need the
 * numeric transform (e.g. to redraw a canvas at a different internal
 * resolution when zoomed) read it from the `wuik-viewport-change` event or
 * `getTransform()`. There is no render callback and no size opinion: the
 * host has no intrinsic size, so a consumer sizes it via CSS (width/height
 * or `aspect-ratio`) like any other block box.
 *
 * Wheel-driven zoom only activates once the component holds focus (click
 * or Tab) so an unfocused wheel pass-through never traps page scroll — see
 * the same ADR. A malformed `min-scale`/`max-scale`/`zoom-step`
 * configuration falls back to sane defaults and shows a visible invalid
 * indicator, matching the convention in
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 *
 * Keyboard: arrow keys pan, `+`/`-` zoom (centered on the viewport's
 * center), `0`/`Home` resets to fit. A visually-hidden live region
 * announces zoom-level changes and reset actions for screen reader users,
 * since a chrome-less viewport otherwise gives no non-visual feedback that
 * a keyboard zoom action did anything.
 */

import {
  type Size,
  type ViewportConfig,
  type ViewportTransform,
  clampScale,
  computeFitTransform,
  panBy as panTransformBy,
  resolveViewportConfig,
  zoomAtPoint,
} from "./viewport-transform.ts";

const DEFAULT_LABEL = "Zoom and pan viewport";
const PAN_STEP = 20;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      background: var(--wuik-color-surface);
    }

    .stage {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: grab;
      outline: none;
      touch-action: none;
    }

    .stage:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: -2px;
    }

    .stage.is-panning {
      cursor: grabbing;
      user-select: none;
    }

    .content {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      will-change: transform;
    }

    .overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .overlay ::slotted(*) {
      pointer-events: auto;
    }

    .invalid-banner {
      display: none;
      position: absolute;
      top: var(--wuik-space-2);
      left: var(--wuik-space-2);
      padding: var(--wuik-space-1) var(--wuik-space-2);
      background: var(--wuik-color-danger);
      color: var(--wuik-color-text-on-danger);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-sm);
      border-radius: 2px;
    }

    .stage.is-invalid .invalid-banner {
      display: block;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  </style>
  <div
    class="stage"
    role="application"
    aria-roledescription="zoom and pan viewport"
    tabindex="0"
    aria-describedby="instructions"
  >
    <div class="content">
      <slot></slot>
    </div>
    <div class="overlay">
      <slot name="overlay"></slot>
    </div>
    <div class="invalid-banner"></div>
  </div>
  <p id="instructions" class="visually-hidden">
    Use arrow keys to pan, plus and minus keys to zoom, and 0 or Home to
    reset the view to fit.
  </p>
  <div class="status visually-hidden" role="status" aria-live="polite"></div>
`;

export class WuikViewportElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["min-scale", "max-scale", "zoom-step", "label"];
  }

  readonly #stage: HTMLElement;
  readonly #content: HTMLElement;
  readonly #invalidBanner: HTMLElement;
  readonly #status: HTMLElement;
  readonly #defaultSlot: HTMLSlotElement;

  #config: ViewportConfig;
  #transform: ViewportTransform = { scale: 1, x: 0, y: 0 };
  #dragState: {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startTransform: ViewportTransform;
  } | null = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#stage = shadow.querySelector(".stage") as HTMLElement;
    this.#content = shadow.querySelector(".content") as HTMLElement;
    this.#invalidBanner = shadow.querySelector(
      ".invalid-banner",
    ) as HTMLElement;
    this.#status = shadow.querySelector(".status") as HTMLElement;
    this.#defaultSlot = shadow.querySelector(
      "slot:not([name])",
    ) as HTMLSlotElement;

    this.#config = resolveViewportConfig({
      minScale: null,
      maxScale: null,
      zoomStep: null,
    });

    this.#stage.addEventListener("wheel", this.#handleWheel, {
      passive: false,
    });
    this.#stage.addEventListener("pointerdown", this.#handlePointerDown);
    this.#stage.addEventListener("pointermove", this.#handlePointerMove);
    this.#stage.addEventListener("pointerup", this.#handlePointerUp);
    this.#stage.addEventListener("pointercancel", this.#handlePointerUp);
    this.#stage.addEventListener("keydown", this.#handleKeydown);
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  /** The current transform. Read-only — mutate via `zoomBy`/`panBy`/`resetToFit`. */
  getTransform(): ViewportTransform {
    return this.#transform;
  }

  /**
   * Fits the default-slotted content's natural (unscaled) size into the
   * visible area, centered. A no-op producing an identity transform if the
   * content or the viewport itself has no measurable size yet (e.g. called
   * before layout/image load) — call again once the content is ready.
   */
  resetToFit(): void {
    const container: Size = {
      width: this.#stage.clientWidth,
      height: this.#stage.clientHeight,
    };
    const content = this.#measureContent();
    const next = computeFitTransform(container, content, this.#config);
    this.#setTransform(next);
    this.#announce(`View reset. Zoom ${this.#formatPercent(next.scale)}.`);
  }

  /**
   * Zooms by `factor` (> 1 zooms in, < 1 zooms out), centered on
   * (`originX`, `originY`) in the viewport's own coordinates, defaulting
   * to the viewport's center.
   */
  zoomBy(factor: number, originX?: number, originY?: number): void {
    const origin =
      originX !== undefined && originY !== undefined
        ? { x: originX, y: originY }
        : {
            x: this.#stage.clientWidth / 2,
            y: this.#stage.clientHeight / 2,
          };
    const previousScale = this.#transform.scale;
    const next = zoomAtPoint(
      this.#transform,
      this.#config,
      factor,
      origin.x,
      origin.y,
    );
    this.#setTransform(next);
    this.#announceZoom(previousScale, next.scale);
  }

  /** Pans by (`dx`, `dy`) in the viewport's own coordinates. */
  panBy(dx: number, dy: number): void {
    this.#setTransform(panTransformBy(this.#transform, dx, dy));
  }

  #measureContent(): Size {
    const [target] = this.#defaultSlot.assignedElements();
    if (!(target instanceof HTMLElement)) {
      return { width: 0, height: 0 };
    }
    return { width: target.offsetWidth, height: target.offsetHeight };
  }

  #setTransform(next: ViewportTransform): void {
    this.#transform = next;
    this.#content.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`;
    this.dispatchEvent(
      new CustomEvent("wuik-viewport-change", {
        detail: { ...next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #render(): void {
    this.#config = resolveViewportConfig({
      minScale: this.getAttribute("min-scale"),
      maxScale: this.getAttribute("max-scale"),
      zoomStep: this.getAttribute("zoom-step"),
    });

    if (
      clampScale(this.#transform.scale, this.#config) !== this.#transform.scale
    ) {
      this.#setTransform({
        ...this.#transform,
        scale: clampScale(this.#transform.scale, this.#config),
      });
    }

    this.#stage.classList.toggle("is-invalid", this.#config.invalid);
    this.#stage.setAttribute("aria-invalid", String(this.#config.invalid));
    this.#invalidBanner.textContent = this.#config.invalid
      ? "Invalid viewport configuration — showing default zoom range instead."
      : "";

    this.#stage.setAttribute(
      "aria-label",
      this.getAttribute("label") ?? DEFAULT_LABEL,
    );
  }

  #formatPercent(scale: number): string {
    return `${Math.round(scale * 100)}%`;
  }

  #announce(message: string): void {
    this.#status.textContent = message;
  }

  #announceZoom(previousScale: number, nextScale: number): void {
    if (nextScale === previousScale) {
      this.#announce(
        nextScale >= this.#config.maxScale
          ? "Maximum zoom reached."
          : "Minimum zoom reached.",
      );
      return;
    }
    this.#announce(`Zoom ${this.#formatPercent(nextScale)}.`);
  }

  readonly #handleWheel = (event: WheelEvent): void => {
    if (document.activeElement !== this) {
      // Not focused: leave the wheel event alone so the page can scroll
      // normally instead of this component hijacking it — see decision 008.
      return;
    }
    event.preventDefault();
    const factor =
      event.deltaY < 0
        ? 1 + this.#config.zoomStep
        : 1 / (1 + this.#config.zoomStep);
    const rect = this.#stage.getBoundingClientRect();
    this.zoomBy(factor, event.clientX - rect.left, event.clientY - rect.top);
  };

  readonly #handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.#stage.focus();
    this.#stage.setPointerCapture?.(event.pointerId);
    this.#dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startTransform: this.#transform,
    };
    this.#stage.classList.add("is-panning");
  };

  readonly #handlePointerMove = (event: PointerEvent): void => {
    if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
      return;
    }
    const { startClientX, startClientY, startTransform } = this.#dragState;
    this.#setTransform(
      panTransformBy(
        startTransform,
        event.clientX - startClientX,
        event.clientY - startClientY,
      ),
    );
  };

  readonly #handlePointerUp = (event: PointerEvent): void => {
    if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
      return;
    }
    this.#stage.releasePointerCapture?.(event.pointerId);
    this.#dragState = null;
    this.#stage.classList.remove("is-panning");
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.panBy(0, PAN_STEP);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.panBy(0, -PAN_STEP);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.panBy(PAN_STEP, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        this.panBy(-PAN_STEP, 0);
        break;
      case "+":
      case "=":
        event.preventDefault();
        this.zoomBy(1 + this.#config.zoomStep);
        break;
      case "-":
      case "_":
        event.preventDefault();
        this.zoomBy(1 / (1 + this.#config.zoomStep));
        break;
      case "0":
      case "Home":
        event.preventDefault();
        this.resetToFit();
        break;
      default:
        break;
    }
  };
}

if (!customElements.get("wuik-viewport")) {
  customElements.define("wuik-viewport", WuikViewportElement);
}
