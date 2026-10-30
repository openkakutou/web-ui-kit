/**
 * `<wuik-text-input>` — a standalone text-input/form-field Web Component
 * wrapping a native `<input>` (`type="text"`, or `"number"` via the `type` attribute), with a real visible `<label>`
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

    input {
      font: inherit;
      color: var(--wuik-color-text);
      background: var(--wuik-color-bg);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      border-radius: var(--wuik-radius-control);
      min-height: var(--wuik-control-height);
      padding: 0 var(--wuik-space-3);
      box-sizing: border-box;
    }

    input:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: calc(-1 * var(--wuik-focus-ring-width));
    }

    input:disabled {
      cursor: not-allowed;
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .wrapper.is-invalid input {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-error);
      outline-offset: var(--wuik-focus-ring-offset);
    }

    .hint {
      color: var(--wuik-color-text);
      font-size: var(--wuik-font-size-sm);
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
    <span class="hint" hidden></span>
  </div>
  <span class="error" role="status"></span>
`;

export class WuikTextInputElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      "label",
      "hint",
      "placeholder",
      "required",
      "value",
      "disabled",
      "error",
      "type",
      "min",
      "max",
      "step",
      "inputmode",
    ];
  }

  readonly #wrapper: HTMLElement;
  readonly #label: HTMLLabelElement;
  readonly #labelText: HTMLElement;
  readonly #requiredMarker: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #hint: HTMLElement;
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
    this.#input = shadow.querySelector("input") as HTMLInputElement;
    this.#hint = shadow.querySelector(".hint") as HTMLElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;

    const id = `wuik-text-input-${nextInstanceId++}`;
    this.#input.id = id;
    this.#label.htmlFor = id;
    this.#hint.id = `${id}-hint`;
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

    const hint = this.getAttribute("hint")?.trim() ?? "";
    this.#hint.hidden = hint === "";
    this.#hint.textContent = hint;

    const placeholder = this.getAttribute("placeholder");
    if (placeholder) {
      this.#input.placeholder = placeholder;
    } else {
      this.#input.removeAttribute("placeholder");
    }

    this.#renderNumberAttributes();

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

  get #isNumber(): boolean {
    return this.getAttribute("type") === "number";
  }

  #bound(name: "min" | "max"): number | null {
    const raw = this.getAttribute(name);
    if (raw === null || raw.trim() === "") {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Applies `type` (`number`, anything else falls back to `text`) and the
   * number-only `min`/`max`/`step` to the native input, plus `inputmode`:
   * the consumer's value if set, else in number mode `numeric` for an
   * absent or positive-integer step and `decimal` otherwise.
   */
  #renderNumberAttributes(): void {
    const isNumber = this.#isNumber;
    this.#input.type = isNumber ? "number" : "text";
    for (const name of ["min", "max", "step"]) {
      const value = this.getAttribute(name);
      if (isNumber && value !== null) {
        this.#input.setAttribute(name, value);
      } else {
        this.#input.removeAttribute(name);
      }
    }

    let inputMode = this.getAttribute("inputmode");
    if (!inputMode && isNumber) {
      const step = this.getAttribute("step");
      inputMode =
        step === null || /^[1-9]\d*$/.test(step.trim()) ? "numeric" : "decimal";
    }
    if (inputMode) {
      this.#input.setAttribute("inputmode", inputMode);
    } else {
      this.#input.removeAttribute("inputmode");
    }
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
      type: this.#isNumber ? "number" : "text",
      min: this.#bound("min"),
      max: this.#bound("max"),
    });
    this.#applyValidity(validity);
  }

  #applyValidity(validity: {
    invalid: boolean;
    reason: TextInputValidityReason;
  }): void {
    this.#wrapper.classList.toggle("is-invalid", validity.invalid);
    const describedBy = this.#hint.hidden ? [] : [this.#hint.id];
    if (validity.invalid) {
      this.#input.setAttribute("aria-invalid", "true");
      describedBy.push(this.#error.id);
    } else {
      this.#input.removeAttribute("aria-invalid");
    }
    if (describedBy.length > 0) {
      this.#input.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
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
    if (reason === "range") {
      return this.#rangeMessage();
    }
    return "";
  }

  #rangeMessage(): string {
    const min = this.#bound("min");
    const max = this.#bound("max");
    if (min !== null && max !== null) {
      return t(
        "forms.textInputRange",
        "Enter a number between {{min}} and {{max}}.",
        {
          min: String(min),
          max: String(max),
        },
      );
    }
    if (min !== null) {
      return t("forms.textInputMin", "Enter a number of at least {{min}}.", {
        min: String(min),
      });
    }
    if (max !== null) {
      return t("forms.textInputMax", "Enter a number of at most {{max}}.", {
        max: String(max),
      });
    }
    return t("forms.textInputNotNumber", "Enter a valid number.");
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
