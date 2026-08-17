/**
 * `<wuik-slider>` — a standalone slider wrapping a native
 * `<input type="range">`. Usable on its own, with no dependency on the
 * layout shell or any other component (backlog item 003).
 *
 * Fires two events, matching native range input semantics: `wuik-input`
 * continuously as the value changes (live preview), and `wuik-change` once
 * when the change is committed. A malformed configuration (non-numeric
 * min/max/step, or min >= max) falls back to sane defaults and shows a
 * visible invalid indicator rather than silently defaulting — a
 * well-formed value merely outside [min, max] is just clamped, like a
 * native range input. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";
import { resolveSliderConfig } from "./slider-config.ts";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    .wrapper {
      display: flex;
      align-items: center;
      gap: var(--wuik-space-2);
    }

    input[type="range"] {
      flex: 1;
      accent-color: var(--wuik-color-accent);
    }

    input[type="range"]:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: -2px;
    }

    input[type="range"]:disabled {
      cursor: not-allowed;
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .readout {
      min-width: 3ch;
      text-align: right;
      color: var(--wuik-color-text-secondary);
    }

    .wrapper.is-invalid input[type="range"] {
      outline: 2px solid var(--wuik-color-danger);
      outline-offset: 2px;
    }

    .error {
      display: none;
      color: var(--wuik-color-text);
      font-size: var(--wuik-font-size-sm);
    }

    .wrapper.is-invalid ~ .error {
      display: block;
    }
  </style>
  <div class="wrapper">
    <input type="range" />
    <span class="readout"></span>
  </div>
  <span class="error" role="status"></span>
`;

export class WuikSliderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["min", "max", "step", "value", "disabled", "label"];
  }

  readonly #wrapper: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #readout: HTMLElement;
  readonly #error: HTMLElement;
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#wrapper = shadow.querySelector(".wrapper") as HTMLElement;
    this.#input = shadow.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    this.#readout = shadow.querySelector(".readout") as HTMLElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;

    this.#input.addEventListener("input", this.#handleInput);
    this.#input.addEventListener("change", this.#handleChange);
  }

  connectedCallback(): void {
    this.#render();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#render());
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  get value(): number {
    return Number(this.#input.value);
  }

  set value(next: number) {
    this.setAttribute("value", String(next));
  }

  #render(): void {
    const config = resolveSliderConfig({
      min: this.getAttribute("min"),
      max: this.getAttribute("max"),
      step: this.getAttribute("step"),
      value: this.getAttribute("value"),
    });

    this.#input.min = String(config.min);
    this.#input.max = String(config.max);
    this.#input.step = String(config.step);
    this.#input.value = String(config.value);
    this.#readout.textContent = String(config.value);

    const label = this.getAttribute("label");
    if (label) {
      this.#input.setAttribute("aria-label", label);
    } else {
      this.#input.removeAttribute("aria-label");
    }

    this.#wrapper.classList.toggle("is-invalid", config.invalid);
    this.#input.setAttribute("aria-invalid", String(config.invalid));
    this.#error.textContent = config.invalid
      ? t(
          "forms.sliderInvalidConfig",
          "Invalid slider configuration — showing default range instead.",
        )
      : "";

    const disabled = this.hasAttribute("disabled");
    this.#wrapper.classList.toggle("is-disabled", disabled);
    this.#input.disabled = disabled;
  }

  readonly #handleInput = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    this.#readout.textContent = this.#input.value;
    this.dispatchEvent(
      new CustomEvent("wuik-input", {
        detail: { value: Number(this.#input.value) },
        bubbles: true,
        composed: true,
      }),
    );
  };

  readonly #handleChange = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("wuik-change", {
        detail: { value: Number(this.#input.value) },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

if (!customElements.get("wuik-slider")) {
  customElements.define("wuik-slider", WuikSliderElement);
}
