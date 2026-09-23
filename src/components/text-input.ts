/**
 * `<wuik-text-input>` — a standalone text-input/form-field Web Component
 * wrapping a native `<input type="text">`, with a real visible `<label>`
 * (unlike `wuik-slider`/`wuik-color-picker`, which only forward an
 * `aria-label` since they have no visible text of their own to attach a
 * label to). Usable on its own, with no dependency on the layout shell or
 * any other component (backlog item 024).
 *
 * A required field is never shown as invalid before the user has left it
 * (blurred it) at least once while empty — validating an untouched,
 * freshly-rendered field would paint a brand-new form as already broken.
 * Once touched, the field re-validates live on every keystroke. A
 * consumer-supplied `error` attribute/property always takes priority over
 * the built-in required check, and shows immediately regardless of touched
 * state — the escape hatch for validation this component can't know about
 * on its own (a format check, a server-side rejection). See
 * `.vibe/decisions/024-text-input-visible-label-and-blur-validation.md` and
 * the shared `.vibe/decisions/007-form-input-components-shared-conventions.md`
 * invalid-state contract.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";
import {
  type TextInputValidityReason,
  resolveTextInputValidity,
} from "./text-input-validation.ts";

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

    .required-marker {
      color: var(--wuik-color-text);
    }

    input[type="text"] {
      font: inherit;
      color: var(--wuik-color-text);
      background: var(--wuik-color-surface);
      border: 1px solid var(--wuik-color-border);
      padding: var(--wuik-space-2);
      box-sizing: border-box;
    }

    input[type="text"]:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: -2px;
    }

    input[type="text"]:disabled {
      cursor: not-allowed;
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .wrapper.is-invalid input[type="text"] {
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
    <label hidden>
      <span class="label-text"></span><span class="required-marker" aria-hidden="true" hidden> *</span>
    </label>
    <input type="text" />
  </div>
  <span class="error" role="status"></span>
`;

export class WuikTextInputElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "placeholder", "required", "value", "disabled", "error"];
  }

  readonly #wrapper: HTMLElement;
  readonly #label: HTMLLabelElement;
  readonly #labelText: HTMLElement;
  readonly #requiredMarker: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #error: HTMLElement;
  #touched = false;
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
    this.#input = shadow.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;

    const id = `wuik-text-input-${nextInstanceId++}`;
    this.#input.id = id;
    this.#label.htmlFor = id;
    this.#error.id = `${id}-error`;

    this.#input.addEventListener("input", this.#handleInput);
    this.#input.addEventListener("change", this.#handleChange);
    this.#input.addEventListener("blur", this.#handleBlur);
  }

  connectedCallback(): void {
    this.#syncValueFromAttribute();
    this.#renderStatic();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#renderStatic());
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.#syncValueFromAttribute();
    }
    this.#renderStatic();
  }

  get value(): string {
    return this.#input.value;
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /**
   * Applies the `value` attribute to the native input's live value, only
   * ever called on mount or when the `value` attribute itself changes —
   * never from the general attribute-driven render, so an unrelated
   * attribute change (e.g. toggling `disabled`) can never overwrite what
   * the user is actively typing.
   */
  #syncValueFromAttribute(): void {
    this.#input.value = this.getAttribute("value") ?? "";
    this.#touched = false;
    this.#updateValidity();
  }

  /**
   * Renders every attribute-driven aspect of the component except the
   * input's live value (see `#syncValueFromAttribute`) — label text,
   * placeholder, required/disabled state, and (if currently invalid) the
   * error message text, so a locale change can refresh translated text
   * without ever touching what the user has typed.
   */
  #renderStatic(): void {
    const label = this.getAttribute("label") ?? "";
    this.#label.hidden = label === "";
    this.#labelText.textContent = label;

    const placeholder = this.getAttribute("placeholder");
    if (placeholder) {
      this.#input.placeholder = placeholder;
    } else {
      this.#input.removeAttribute("placeholder");
    }

    const required = this.hasAttribute("required");
    this.#input.required = required;
    if (required) {
      this.#input.setAttribute("aria-required", "true");
    } else {
      this.#input.removeAttribute("aria-required");
    }
    this.#requiredMarker.hidden = !required;

    const disabled = this.hasAttribute("disabled");
    this.#wrapper.classList.toggle("is-disabled", disabled);
    this.#input.disabled = disabled;

    this.#updateValidity();
  }

  /**
   * Toggles the invalid state in place (class, `aria-invalid`,
   * `aria-describedby`, and the error message text) without rebuilding any
   * DOM node — so it is always safe to call from an `input`/`blur` handler
   * mid-interaction. A disabled field never shows as invalid, whatever the
   * underlying value: it can't currently be fixed by the user, and an
   * alarming red state would be misleading rather than helpful.
   */
  #updateValidity(): void {
    if (this.hasAttribute("disabled")) {
      this.#applyValidity({ invalid: false, reason: null });
      return;
    }

    const validity = resolveTextInputValidity({
      required: this.hasAttribute("required"),
      value: this.#input.value,
      error: this.getAttribute("error"),
      touched: this.#touched,
    });
    this.#applyValidity(validity);
  }

  #applyValidity(validity: {
    invalid: boolean;
    reason: TextInputValidityReason;
  }): void {
    this.#wrapper.classList.toggle("is-invalid", validity.invalid);
    if (validity.invalid) {
      this.#input.setAttribute("aria-invalid", "true");
      this.#input.setAttribute("aria-describedby", this.#error.id);
    } else {
      this.#input.removeAttribute("aria-invalid");
      this.#input.removeAttribute("aria-describedby");
    }
    this.#error.textContent = this.#messageFor(validity.reason);
  }

  #messageFor(reason: TextInputValidityReason): string {
    if (reason === "custom") {
      return this.getAttribute("error") ?? "";
    }
    if (reason === "required") {
      return t("forms.textInputRequired", "This field is required.");
    }
    return "";
  }

  readonly #handleInput = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    if (this.#touched) {
      this.#updateValidity();
    }
    this.dispatchEvent(
      new CustomEvent("wuik-input", {
        detail: { value: this.#input.value },
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
        detail: { value: this.#input.value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  readonly #handleBlur = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    this.#touched = true;
    this.#updateValidity();
  };
}

if (!customElements.get("wuik-text-input")) {
  customElements.define("wuik-text-input", WuikTextInputElement);
}
