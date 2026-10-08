/**
 * `<wuik-select>` — a labelled form field wrapping a native `<select>`, so
 * the platform's listbox keyboard behaviour is kept. Options are declared as
 * light-DOM `<option>` (and `<optgroup>`) children and mirrored into the
 * native control whenever they change.
 *
 * Mirrors `<wuik-text-input>`: a real visible `<label>`, `required`,
 * `disabled`, a consumer-supplied `error` message linked with
 * `aria-describedby`, a `value` property, and a `wuik-change` event.
 */

import { onLocaleChange } from "../i18n/i18n.ts";

let nextInstanceId = 0;

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
      gap: var(--wuik-space-1);
    }

    label {
      font-size: var(--wuik-font-size-sm);
    }

    select {
      font: inherit;
      color: var(--wuik-color-text);
      background: var(--wuik-color-bg);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      border-radius: var(--wuik-radius-control);
      min-height: var(--wuik-control-height);
      padding: 0 var(--wuik-space-3);
      box-sizing: border-box;
      cursor: pointer;
    }

    select:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: calc(-1 * var(--wuik-focus-ring-width));
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .wrapper.is-invalid select {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-error);
      outline-offset: var(--wuik-focus-ring-offset);
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
    <label hidden>
      <span class="label-text"></span><span class="required-marker" aria-hidden="true" hidden> *</span>
    </label>
    <select></select>
  </div>
  <span class="error" role="status"></span>
`;

export class WuikSelectElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "required", "value", "disabled", "error"];
  }

  readonly #wrapper: HTMLElement;
  readonly #label: HTMLLabelElement;
  readonly #labelText: HTMLElement;
  readonly #requiredMarker: HTMLElement;
  readonly #select: HTMLSelectElement;
  readonly #error: HTMLElement;
  readonly #observer: MutationObserver;
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#wrapper = shadow.querySelector(".wrapper") as HTMLElement;
    this.#label = shadow.querySelector("label") as HTMLLabelElement;
    this.#labelText = shadow.querySelector(".label-text") as HTMLElement;
    this.#requiredMarker = shadow.querySelector(
      ".required-marker",
    ) as HTMLElement;
    this.#select = shadow.querySelector("select") as HTMLSelectElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;

    const id = `wuik-select-${nextInstanceId++}`;
    this.#select.id = id;
    this.#label.htmlFor = id;
    this.#error.id = `${id}-error`;

    this.#select.addEventListener("change", this.#handleChange);
    this.#observer = new MutationObserver(() => this.#mirrorOptions());
  }

  connectedCallback(): void {
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["value", "disabled", "label", "selected"],
    });
    this.#mirrorOptions();
    this.#renderStatic();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#renderStatic());
  }

  disconnectedCallback(): void {
    this.#observer.disconnect();
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.#applyValue();
    }
    this.#renderStatic();
  }

  get value(): string {
    return this.#select.value;
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  #mirrorOptions(): void {
    const current = this.#select.value;
    this.#select.replaceChildren(
      ...Array.from(this.children)
        .filter(
          (el) =>
            el instanceof HTMLOptionElement ||
            el instanceof HTMLOptGroupElement,
        )
        .map((el) => el.cloneNode(true)),
    );
    if (this.hasAttribute("value")) {
      this.#applyValue();
    } else if (current !== "") {
      this.#select.value = current;
    }
  }

  #applyValue(): void {
    this.#select.value = this.getAttribute("value") ?? "";
  }

  #renderStatic(): void {
    const label = this.getAttribute("label") ?? "";
    this.#label.hidden = label === "";
    this.#labelText.textContent = label;

    const required = this.hasAttribute("required");
    this.#select.required = required;
    if (required) {
      this.#select.setAttribute("aria-required", "true");
    } else {
      this.#select.removeAttribute("aria-required");
    }
    this.#requiredMarker.hidden = !required;

    const disabled = this.hasAttribute("disabled");
    this.#wrapper.classList.toggle("is-disabled", disabled);
    this.#select.disabled = disabled;

    const message = disabled ? "" : (this.getAttribute("error") ?? "");
    const invalid = message !== "";
    this.#wrapper.classList.toggle("is-invalid", invalid);
    this.#error.textContent = message;
    if (invalid) {
      this.#select.setAttribute("aria-invalid", "true");
      this.#select.setAttribute("aria-describedby", this.#error.id);
    } else {
      this.#select.removeAttribute("aria-invalid");
      this.#select.removeAttribute("aria-describedby");
    }
  }

  readonly #handleChange = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("wuik-change", {
        detail: { value: this.#select.value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

if (!customElements.get("wuik-select")) {
  customElements.define("wuik-select", WuikSelectElement);
}
