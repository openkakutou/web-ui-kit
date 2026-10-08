/**
 * `<wuik-toast>` + `<wuik-toast-region>` — transient global confirmations
 * ("Saved", "Exported"). Persistent outcomes (the saved status after an
 * export, errors that need a decision) belong inline, not in a toast.
 *
 * A toast announces itself: `role="status"` for info/success/warning,
 * `role="alert"` for errors. Auto-dismiss (`duration` ms, default 5000, `0`
 * = stay) pauses while the pointer or focus is inside it, and errors never
 * auto-dismiss unless a duration is set explicitly. It always carries a
 * dismiss button. The region stacks toasts at the bottom right and offers
 * `show()`.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";

const VARIANTS = new Set(["info", "success", "warning", "error"]);
const DEFAULT_DURATION_MS = 5000;

const TOAST_TEMPLATE = document.createElement("template");
TOAST_TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      line-height: var(--wuik-line-height-base);
      color: var(--wuik-color-text);
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--wuik-space-3);
      min-width: 16rem;
      max-width: 24rem;
      padding: var(--wuik-space-3) var(--wuik-space-4);
      background: var(--wuik-color-surface-raised);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      border-left-width: 4px;
      border-radius: var(--wuik-radius-card);
      box-shadow: var(--wuik-shadow-overlay);
      box-sizing: border-box;
    }

    .toast.success { border-left-color: var(--wuik-color-success); }
    .toast.warning { border-left-color: var(--wuik-color-warning); }
    .toast.error { border-left-color: var(--wuik-color-error); }
    .toast.info { border-left-color: var(--wuik-color-primary); }

    .mark {
      flex: none;
      font-weight: var(--wuik-font-weight-bold);
    }

    .message {
      flex: 1;
      min-width: 0;
    }

    button {
      appearance: none;
      flex: none;
      min-width: var(--wuik-target-min);
      height: var(--wuik-target-min);
      border: none;
      border-radius: var(--wuik-radius-control);
      background: transparent;
      color: var(--wuik-color-text-muted);
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      color: var(--wuik-color-text);
      background: var(--wuik-color-surface);
    }

    button:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: var(--wuik-focus-ring-offset);
    }
  </style>
  <div class="toast">
    <span class="mark" aria-hidden="true"></span>
    <div class="message"><slot></slot></div>
    <button type="button">×</button>
  </div>
`;

const MARKS: Record<string, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "✕",
};

export class WuikToastElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "duration"];
  }

  readonly #toast: HTMLElement;
  readonly #mark: HTMLElement;
  readonly #dismiss: HTMLButtonElement;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TOAST_TEMPLATE.content.cloneNode(true));
    this.#toast = shadow.querySelector(".toast") as HTMLElement;
    this.#mark = shadow.querySelector(".mark") as HTMLElement;
    this.#dismiss = shadow.querySelector("button") as HTMLButtonElement;
    this.#dismiss.addEventListener("click", () => this.dismiss());
    for (const type of ["pointerenter", "focusin"]) {
      this.addEventListener(type, () => this.#clearTimer());
    }
    for (const type of ["pointerleave", "focusout"]) {
      this.addEventListener(type, () => this.#startTimer());
    }
  }

  connectedCallback(): void {
    this.#render();
    this.#startTimer();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#render());
  }

  disconnectedCallback(): void {
    this.#clearTimer();
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  attributeChangedCallback(name: string): void {
    this.#render();
    if (name === "duration") {
      this.#startTimer();
    }
  }

  /** Removes the toast and emits a bubbling `wuik-dismiss` event. */
  dismiss(): void {
    this.#clearTimer();
    this.dispatchEvent(
      new CustomEvent("wuik-dismiss", { bubbles: true, composed: true }),
    );
    this.remove();
  }

  #variant(): string {
    const requested = this.getAttribute("variant") ?? "info";
    return VARIANTS.has(requested) ? requested : "info";
  }

  #durationMs(): number {
    const raw = this.getAttribute("duration");
    if (raw === null) {
      return this.#variant() === "error" ? 0 : DEFAULT_DURATION_MS;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  #render(): void {
    const variant = this.#variant();
    this.#toast.className = `toast ${variant}`;
    this.#mark.textContent = MARKS[variant];
    this.setAttribute("role", variant === "error" ? "alert" : "status");
    this.#dismiss.setAttribute("aria-label", t("toast.dismiss", "Dismiss"));
  }

  #clearTimer(): void {
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  #startTimer(): void {
    this.#clearTimer();
    const duration = this.#durationMs();
    if (duration > 0 && this.isConnected) {
      this.#timer = setTimeout(() => this.dismiss(), duration);
    }
  }
}

if (!customElements.get("wuik-toast")) {
  customElements.define("wuik-toast", WuikToastElement);
}

export interface ToastOptions {
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  /** Milliseconds before auto-dismiss; `0` keeps the toast until dismissed. */
  duration?: number;
}

const REGION_TEMPLATE = document.createElement("template");
REGION_TEMPLATE.innerHTML = `
  <style>
    :host {
      position: fixed;
      right: var(--wuik-space-4);
      bottom: calc(var(--wuik-space-4) + env(safe-area-inset-bottom, 0px));
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: var(--wuik-space-2);
      align-items: flex-end;
      pointer-events: none;
    }

    ::slotted(*) {
      pointer-events: auto;
    }
  </style>
  <slot></slot>
`;

export class WuikToastRegionElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(REGION_TEMPLATE.content.cloneNode(true));
  }

  show(options: ToastOptions): WuikToastElement {
    const toast = document.createElement("wuik-toast") as WuikToastElement;
    toast.textContent = options.message;
    if (options.variant) {
      toast.setAttribute("variant", options.variant);
    }
    if (options.duration !== undefined) {
      toast.setAttribute("duration", String(options.duration));
    }
    this.appendChild(toast);
    return toast;
  }
}

if (!customElements.get("wuik-toast-region")) {
  customElements.define("wuik-toast-region", WuikToastRegionElement);
}
