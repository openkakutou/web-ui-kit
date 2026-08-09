/**
 * `<wuik-color-picker>` — a standalone color/palette picker wrapping a
 * native `<input type="color">`, with optional preset swatch buttons from
 * a `palette` attribute. Usable on its own, with no dependency on the
 * layout shell or any other component (backlog item 003).
 *
 * A malformed `value` falls back to black and shows a visible invalid
 * indicator rather than silently substituting a value. Malformed palette
 * entries are dropped individually rather than failing the whole list. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 */

import {
  DEFAULT_COLOR,
  normalizeHexColor,
  parsePalette,
} from "./color-picker-color.ts";

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
      flex-direction: column;
      gap: var(--wuik-space-2);
    }

    input[type="color"] {
      width: 2.5rem;
      height: 2rem;
      border: 1px solid var(--wuik-color-border);
      padding: 0;
      background: none;
      cursor: pointer;
    }

    input[type="color"]:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: -2px;
    }

    input[type="color"]:disabled {
      cursor: not-allowed;
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: var(--wuik-space-1);
    }

    .swatch {
      width: 1.5rem;
      height: 1.5rem;
      border: 1px solid var(--wuik-color-border);
      padding: 0;
      cursor: pointer;
    }

    .swatch:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }

    .wrapper.is-invalid input[type="color"] {
      outline: 2px solid var(--wuik-color-danger);
      outline-offset: 2px;
    }

    .error {
      display: none;
      color: var(--wuik-color-danger);
      font-size: var(--wuik-font-size-sm);
    }

    .wrapper.is-invalid .error {
      display: block;
    }
  </style>
  <div class="wrapper">
    <input type="color" />
    <div class="swatches"></div>
    <span class="error" role="status"></span>
  </div>
`;

export class WuikColorPickerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["value", "palette", "disabled"];
  }

  readonly #wrapper: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #swatches: HTMLElement;
  readonly #error: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#wrapper = shadow.querySelector(".wrapper") as HTMLElement;
    this.#input = shadow.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    this.#swatches = shadow.querySelector(".swatches") as HTMLElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;

    this.#input.addEventListener("input", this.#handleInputChange);
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  get value(): string {
    return this.#input.value;
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  #render(): void {
    const disabled = this.hasAttribute("disabled");
    this.#wrapper.classList.toggle("is-disabled", disabled);
    this.#input.disabled = disabled;

    const { value, invalid } = normalizeHexColor(this.getAttribute("value"));
    this.#input.value = value;
    this.#wrapper.classList.toggle("is-invalid", invalid);
    this.#input.setAttribute("aria-invalid", String(invalid));
    this.#error.textContent = invalid
      ? `Invalid color value — showing ${DEFAULT_COLOR} instead.`
      : "";

    this.#renderSwatches();
  }

  #renderSwatches(): void {
    const colors = parsePalette(this.getAttribute("palette"));
    this.#swatches.innerHTML = "";
    for (const color of colors) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "swatch";
      swatch.style.background = color;
      swatch.setAttribute("aria-label", color);
      swatch.addEventListener("click", () => {
        if (this.hasAttribute("disabled")) {
          return;
        }
        this.setAttribute("value", color);
        this.#emitChange(color);
      });
      this.#swatches.appendChild(swatch);
    }
  }

  readonly #handleInputChange = (): void => {
    this.#emitChange(this.#input.value);
  };

  #emitChange(value: string): void {
    this.dispatchEvent(
      new CustomEvent("wuik-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("wuik-color-picker")) {
  customElements.define("wuik-color-picker", WuikColorPickerElement);
}
