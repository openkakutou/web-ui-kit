/**
 * `<wuik-viewport-3d>` — reusable orbit/pan/zoom camera controls for
 * wrapping any 3D-rendering consumer (typically a `<canvas>` running
 * three.js/WebGL, but the component never touches it — see
 * `.vibe/decisions/010-3d-viewport-controls-integration-contract.md`).
 * 3D sibling of `<wuik-viewport>` (2D pan/zoom, decision `008`); first
 * consumed by `stage-viewer-web`/`stage-editor` for Ikemen GO 3D
 * model-based stage previews (backlog item `007`, roadmap decision `014`).
 *
 * Integration contract: the component tracks a camera as spherical
 * coordinates (azimuth/elevation/distance around a target point) — pure
 * math, in `orbit-camera.ts` — and exposes it via `getCamera()` and the
 * `wuik-viewport3d-change` event. It never creates a WebGL context, a
 * renderer, or reads the consumer's scene; applying the camera to an
 * actual 3D renderer is entirely the consumer's job. The host has no
 * intrinsic size, like the 2D sibling: a consumer sizes it via CSS.
 *
 * Interaction: primary-button drag orbits; a Shift-held primary drag or a
 * secondary (right) button drag pans (the context menu is suppressed so
 * right-drag works cleanly); the wheel dollies toward the target, only
 * once the component holds focus, so it never traps page scroll (same
 * rule as the 2D sibling). A dismissible on-screen hint and an
 * always-visible "Reset view" button are built in — see decision `010`
 * for why (getting lost via pan has no bounded recovery other than
 * reset, so reset must be trivially reachable by mouse, not just
 * keyboard).
 *
 * Keyboard: arrow keys orbit; Shift+arrow keys pan; `+`/`-` zoom; `0`/
 * `Home` resets to the default view. A malformed `min-distance`/
 * `max-distance`/`zoom-step` configuration falls back to sane defaults
 * and shows a visible invalid indicator, matching
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 *
 * A host environment/browser with no WebGL support gets a distinct,
 * visibly-flagged fallback state (neutral, not the danger-adjacent
 * invalid-configuration styling — decision `010`) instead of a silently
 * broken or blank interactive area; no orbit/pan/zoom controls are
 * rendered in that state, since there is nothing for them to act on.
 */

import {
  type CameraSnapshot,
  type OrbitCameraConfig,
  type OrbitCameraState,
  clampDistance,
  defaultOrbitCameraState,
  detectWebglSupport,
  orbitBy as orbitState,
  panBy as panState,
  resolveOrbitCameraConfig,
  sphericalToCartesian,
  zoomBy as zoomState,
} from "./orbit-camera.ts";

const DEFAULT_LABEL = "Orbit, pan, and zoom 3D viewport";
const ORBIT_SPEED_PER_PIXEL = 0.01;
const ORBIT_KEY_STEP = 0.05;
const PAN_KEY_STEP = 20;
const HINT_TEXT =
  "Drag to orbit • Shift+drag or right-drag to pan • Scroll to zoom";

type DragMode = "orbit" | "pan";

interface DragState {
  readonly pointerId: number;
  readonly mode: DragMode;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly startState: OrbitCameraState;
}

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

    .stage.is-orbiting {
      cursor: grabbing;
      user-select: none;
    }

    .stage.is-panning {
      cursor: move;
      user-select: none;
    }

    .overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .overlay ::slotted(*) {
      pointer-events: auto;
    }

    .hint {
      position: absolute;
      left: var(--wuik-space-2);
      bottom: var(--wuik-space-2);
      padding: var(--wuik-space-1) var(--wuik-space-2);
      background: var(--wuik-color-surface);
      color: var(--wuik-color-text);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-xs);
      border: 1px solid var(--wuik-color-border);
      border-radius: 4px;
      pointer-events: none;
    }

    .hint.is-dismissed {
      display: none;
    }

    .reset-button {
      position: absolute;
      top: var(--wuik-space-2);
      right: var(--wuik-space-2);
      padding: var(--wuik-space-1) var(--wuik-space-2);
      background: var(--wuik-color-surface);
      color: var(--wuik-color-text);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-xs);
      border: 1px solid var(--wuik-color-border);
      border-radius: 4px;
      cursor: pointer;
    }

    .reset-button:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
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

    .unsupported-panel {
      display: none;
      position: absolute;
      inset: 0;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--wuik-space-2);
      background: var(--wuik-color-surface);
      border: 1px solid var(--wuik-color-border);
      text-align: center;
      padding: var(--wuik-space-4);
      box-sizing: border-box;
    }

    :host(.is-unsupported) .stage {
      display: none;
    }

    :host(.is-unsupported) .unsupported-panel {
      display: flex;
    }

    .unsupported-heading {
      margin: 0;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-lg);
      font-weight: var(--wuik-font-weight-bold);
      color: var(--wuik-color-text);
    }

    .unsupported-body {
      margin: 0;
      max-width: 42ch;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-sm);
      color: var(--wuik-color-text-secondary);
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
    aria-roledescription="orbit, pan, and zoom 3D viewport"
    tabindex="0"
    aria-describedby="instructions"
  >
    <slot></slot>
    <div class="overlay">
      <slot name="overlay"></slot>
    </div>
    <div class="hint">${HINT_TEXT}</div>
    <button type="button" class="reset-button">Reset view</button>
    <div class="invalid-banner"></div>
  </div>
  <div class="unsupported-panel" role="status">
    <p class="unsupported-heading">3D preview unavailable</p>
    <p class="unsupported-body">
      This browser or environment does not support WebGL. Try updating your
      browser or enabling hardware acceleration.
    </p>
  </div>
  <p id="instructions" class="visually-hidden">
    Use arrow keys to rotate the view, Shift plus arrow keys to pan, plus and
    minus keys to zoom, and 0 or Home to reset to the default view.
  </p>
  <div class="status visually-hidden" role="status" aria-live="polite"></div>
`;

export class WuikViewport3DElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["min-distance", "max-distance", "zoom-step", "label"];
  }

  readonly #stage: HTMLElement;
  readonly #hint: HTMLElement;
  readonly #resetButton: HTMLButtonElement;
  readonly #invalidBanner: HTMLElement;
  readonly #status: HTMLElement;

  #config: OrbitCameraConfig;
  #state: OrbitCameraState = defaultOrbitCameraState();
  #dragState: DragState | null = null;
  #hintDismissed = false;
  #supported = true;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#stage = shadow.querySelector(".stage") as HTMLElement;
    this.#hint = shadow.querySelector(".hint") as HTMLElement;
    this.#resetButton = shadow.querySelector(
      ".reset-button",
    ) as HTMLButtonElement;
    this.#invalidBanner = shadow.querySelector(
      ".invalid-banner",
    ) as HTMLElement;
    this.#status = shadow.querySelector(".status") as HTMLElement;

    this.#config = resolveOrbitCameraConfig({
      minDistance: null,
      maxDistance: null,
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
    this.#stage.addEventListener("contextmenu", (event) =>
      event.preventDefault(),
    );
    this.#resetButton.addEventListener("click", () => this.resetToDefault());
  }

  connectedCallback(): void {
    this.#supported = detectWebglSupport();
    this.classList.toggle("is-unsupported", !this.#supported);
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  /** The current camera as a read-only snapshot, including its derived world-space position. */
  getCamera(): CameraSnapshot {
    return { ...this.#state, position: sphericalToCartesian(this.#state) };
  }

  /** Orbits by the given azimuth/elevation deltas (radians), clamped away from the poles. */
  orbitBy(deltaAzimuth: number, deltaElevation: number): void {
    this.#setState(orbitState(this.#state, deltaAzimuth, deltaElevation));
  }

  /** Pans the target by (`dx`, `dy`), scaled by the camera's current distance. */
  panBy(dx: number, dy: number): void {
    this.#setState(panState(this.#state, dx, dy));
  }

  /** Dollies by `factor` (> 1 zooms in toward the target, < 1 zooms out). */
  zoomBy(factor: number): void {
    const previousDistance = this.#state.distance;
    const next = zoomState(this.#state, this.#config, factor);
    this.#setState(next);
    this.#announceZoom(previousDistance, next.distance);
  }

  /** Resets the camera to the documented default view (target, distance, azimuth, elevation). */
  resetToDefault(): void {
    this.#setState(defaultOrbitCameraState());
    this.#announce("View reset.");
  }

  #setState(next: OrbitCameraState): void {
    this.#state = next;
    this.dispatchEvent(
      new CustomEvent("wuik-viewport3d-change", {
        detail: this.getCamera(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  #dismissHint(): void {
    if (this.#hintDismissed) {
      return;
    }
    this.#hintDismissed = true;
    this.#hint.classList.add("is-dismissed");
  }

  #render(): void {
    this.#config = resolveOrbitCameraConfig({
      minDistance: this.getAttribute("min-distance"),
      maxDistance: this.getAttribute("max-distance"),
      zoomStep: this.getAttribute("zoom-step"),
    });

    const clampedDistance = clampDistance(this.#state.distance, this.#config);
    if (clampedDistance !== this.#state.distance) {
      this.#setState({ ...this.#state, distance: clampedDistance });
    }

    this.#stage.classList.toggle("is-invalid", this.#config.invalid);
    this.#stage.setAttribute("aria-invalid", String(this.#config.invalid));
    this.#invalidBanner.textContent = this.#config.invalid
      ? "Invalid viewport configuration — showing default distance range instead."
      : "";

    this.#stage.setAttribute(
      "aria-label",
      this.getAttribute("label") ?? DEFAULT_LABEL,
    );
  }

  #announce(message: string): void {
    this.#status.textContent = message;
  }

  #announceZoom(previousDistance: number, nextDistance: number): void {
    if (nextDistance === previousDistance) {
      this.#announce(
        nextDistance >= this.#config.maxDistance
          ? "Maximum zoom reached."
          : "Minimum zoom reached.",
      );
      return;
    }
    this.#announce(
      nextDistance < previousDistance ? "Zoomed in." : "Zoomed out.",
    );
  }

  readonly #handleWheel = (event: WheelEvent): void => {
    if (!this.#supported) {
      return;
    }
    if (document.activeElement !== this) {
      // Not focused: leave the wheel event alone so the page can scroll
      // normally instead of this component hijacking it — same rule as
      // the 2D sibling (decision 008).
      return;
    }
    event.preventDefault();
    this.#dismissHint();
    const factor =
      event.deltaY < 0
        ? 1 + this.#config.zoomStep
        : 1 / (1 + this.#config.zoomStep);
    this.zoomBy(factor);
  };

  readonly #handlePointerDown = (event: PointerEvent): void => {
    if (!this.#supported) {
      return;
    }
    if (event.button !== 0 && event.button !== 2) {
      return;
    }
    event.preventDefault();
    this.#stage.focus();
    this.#stage.setPointerCapture?.(event.pointerId);
    const mode: DragMode =
      event.button === 2 || event.shiftKey ? "pan" : "orbit";
    this.#dragState = {
      pointerId: event.pointerId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startState: this.#state,
    };
    this.#stage.classList.add(mode === "orbit" ? "is-orbiting" : "is-panning");
    this.#dismissHint();
  };

  readonly #handlePointerMove = (event: PointerEvent): void => {
    if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
      return;
    }
    const { startClientX, startClientY, startState, mode } = this.#dragState;
    const deltaX = event.clientX - startClientX;
    const deltaY = event.clientY - startClientY;
    const next =
      mode === "orbit"
        ? orbitState(
            startState,
            -deltaX * ORBIT_SPEED_PER_PIXEL,
            -deltaY * ORBIT_SPEED_PER_PIXEL,
          )
        : panState(startState, deltaX, deltaY);
    this.#setState(next);
  };

  readonly #handlePointerUp = (event: PointerEvent): void => {
    if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
      return;
    }
    this.#stage.releasePointerCapture?.(event.pointerId);
    this.#stage.classList.remove("is-orbiting", "is-panning");
    this.#dragState = null;
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (!this.#supported) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.#dismissHint();
        event.shiftKey
          ? this.panBy(0, PAN_KEY_STEP)
          : this.orbitBy(0, -ORBIT_KEY_STEP);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.#dismissHint();
        event.shiftKey
          ? this.panBy(0, -PAN_KEY_STEP)
          : this.orbitBy(0, ORBIT_KEY_STEP);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.#dismissHint();
        event.shiftKey
          ? this.panBy(-PAN_KEY_STEP, 0)
          : this.orbitBy(-ORBIT_KEY_STEP, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        this.#dismissHint();
        event.shiftKey
          ? this.panBy(PAN_KEY_STEP, 0)
          : this.orbitBy(ORBIT_KEY_STEP, 0);
        break;
      case "+":
      case "=":
        event.preventDefault();
        this.#dismissHint();
        this.zoomBy(1 + this.#config.zoomStep);
        break;
      case "-":
      case "_":
        event.preventDefault();
        this.#dismissHint();
        this.zoomBy(1 / (1 + this.#config.zoomStep));
        break;
      case "0":
      case "Home":
        event.preventDefault();
        this.resetToDefault();
        break;
      default:
        break;
    }
  };
}

if (!customElements.get("wuik-viewport-3d")) {
  customElements.define("wuik-viewport-3d", WuikViewport3DElement);
}
