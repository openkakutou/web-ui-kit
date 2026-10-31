/**
 * Shared base of `<wuik-checkbox>` and `<wuik-switch>` (decision 028).
 * The `checked` attribute is the default state; the property is the current
 * state and, once set (or toggled by the user), the attribute stops driving it
 * until form reset. Only user toggles fire `wuik-change`.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";

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
      align-items: flex-start;
      gap: var(--wuik-space-2);
      min-height: var(--wuik-target-min);
      cursor: pointer;
    }

    .control {
      position: relative;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--wuik-target-min);
      height: var(--wuik-target-min);
    }

    input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }

    .visual {
      position: relative;
      box-sizing: border-box;
      width: 1.125rem;
      height: 1.125rem;
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      border-radius: var(--wuik-radius-control);
      background: var(--wuik-color-bg);
      color: var(--wuik-color-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .glyph {
      display: none;
      font-size: var(--wuik-font-size-sm);
      line-height: 1;
      font-weight: bold;
    }

    input:checked + .visual,
    input:indeterminate + .visual {
      background: var(--wuik-color-primary);
      border-color: var(--wuik-color-primary);
    }

    input:checked + .visual .glyph-check,
    input:indeterminate + .visual .glyph-dash {
      display: block;
    }

    input:indeterminate + .visual .glyph-check {
      display: none;
    }

    /* Switch: track + thumb; state is the thumb position, not colour alone. */
    :host([data-kind="switch"]) .control {
      --wuik-thumb: calc(var(--wuik-target-min) - 2 * var(--wuik-space-1) - 2 * var(--wuik-border-width));
      width: calc(var(--wuik-target-min) * 2);
    }

    :host([data-kind="switch"]) .visual {
      width: calc(var(--wuik-target-min) * 1.75);
      height: var(--wuik-target-min);
      border-radius: var(--wuik-radius-pill);
      justify-content: flex-start;
    }

    :host([data-kind="switch"]) .visual::after {
      content: "";
      position: absolute;
      top: 50%;
      left: var(--wuik-space-1);
      width: var(--wuik-thumb);
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--wuik-color-text);
      transform: translateY(-50%);
      transition: left var(--wuik-motion-fast) var(--wuik-motion-ease);
    }

    :host([data-kind="switch"]) input:checked + .visual::after {
      left: calc(100% - var(--wuik-space-1) - var(--wuik-thumb) - 2 * var(--wuik-border-width));
      background: var(--wuik-color-on-primary);
    }

    :host([data-kind="switch"]) .glyph {
      display: none !important;
    }

    input:focus-visible + .visual {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: var(--wuik-focus-ring-offset);
    }

    .text {
      padding-block: calc((var(--wuik-target-min) - 1lh) / 2);
      overflow-wrap: anywhere;
    }

    .text.is-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      padding: 0;
    }

    .wrapper.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .wrapper.is-invalid .visual {
      border-color: var(--wuik-color-error);
      border-width: calc(var(--wuik-border-width) * 2);
    }

    .error {
      display: none;
      color: var(--wuik-color-text);
      font-size: var(--wuik-font-size-sm);
    }

    .wrapper.is-invalid ~ .error {
      display: block;
    }

    @media (forced-colors: active) {
      .visual {
        background: Canvas;
        border-color: ButtonText;
        color: ButtonText;
      }
      input:checked + .visual,
      input:indeterminate + .visual {
        background: Highlight;
        border-color: Highlight;
        color: HighlightText;
      }
      :host([data-kind="switch"]) .visual::after {
        background: ButtonText;
      }
      :host([data-kind="switch"]) input:checked + .visual::after {
        background: HighlightText;
      }
      input:focus-visible + .visual {
        outline-color: Highlight;
      }
    }
  </style>
  <label class="wrapper">
    <span class="control">
      <input type="checkbox" />
      <span class="visual" aria-hidden="true">
        <span class="glyph glyph-check">&#10003;</span>
        <span class="glyph glyph-dash">&#8722;</span>
      </span>
    </span>
    <span class="text"><span class="label-text"></span><span class="required-marker" aria-hidden="true" hidden> *</span></span>
  </label>
  <span class="error" role="status"></span>
`;

export abstract class WuikToggleElement extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes(): string[] {
    return [
      "label",
      "hide-label",
      "aria-label",
      "checked",
      "indeterminate",
      "disabled",
      "required",
      "error",
      "value",
    ];
  }

  /** `"checkbox"` or `"switch"`; selects the visual and the ARIA role. */
  protected abstract readonly kind: "checkbox" | "switch";

  readonly #internals: ElementInternals | undefined;
  readonly #wrapper: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #labelBlock: HTMLElement;
  readonly #labelText: HTMLElement;
  readonly #requiredMarker: HTMLElement;
  readonly #error: HTMLElement;
  #touched = false;
  #dirty = false;
  #formDisabled = false;
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#wrapper = shadow.querySelector(".wrapper") as HTMLElement;
    this.#input = shadow.querySelector("input") as HTMLInputElement;
    this.#labelBlock = shadow.querySelector(".text") as HTMLElement;
    this.#labelText = shadow.querySelector(".label-text") as HTMLElement;
    this.#requiredMarker = shadow.querySelector(
      ".required-marker",
    ) as HTMLElement;
    this.#error = shadow.querySelector(".error") as HTMLElement;
    // jsdom's ElementInternals lacks setFormValue: feature-detect.
    const internals =
      typeof this.attachInternals === "function"
        ? this.attachInternals()
        : undefined;
    this.#internals =
      typeof internals?.setFormValue === "function" ? internals : undefined;

    const id = `wuik-toggle-${nextInstanceId++}`;
    this.#error.id = `${id}-error`;

    this.#input.addEventListener("change", this.#handleChange);
    this.#input.addEventListener("blur", this.#markTouched);
    this.addEventListener("click", this.#handleHostClick);
    this.addEventListener("invalid", this.#markTouched);
  }

  connectedCallback(): void {
    this.setAttribute("data-kind", this.kind);
    this.#input.setAttribute("role", this.kind);
    if (!this.#dirty) {
      this.#input.checked = this.hasAttribute("checked");
    }
    this.#render();
    this.#warnIfUnnamed();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#render());
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === "checked" && !this.#dirty) {
      this.#input.checked = this.hasAttribute("checked");
    }
    this.#render();
  }

  get checked(): boolean {
    return this.#input.checked;
  }

  set checked(next: boolean) {
    this.#dirty = true;
    this.#input.checked = next;
    this.#render();
  }

  get indeterminate(): boolean {
    return this.#effectiveIndeterminate();
  }

  set indeterminate(next: boolean) {
    this.toggleAttribute("indeterminate", next);
  }

  /** Subclass hook: may veto `indeterminate` (the switch does). */
  protected supportsIndeterminate(): boolean {
    return true;
  }

  formResetCallback(): void {
    this.#touched = false;
    this.#dirty = false;
    this.#input.checked = this.hasAttribute("checked");
    this.#render();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.#dirty = true;
    this.#input.checked = state !== null;
    this.#render();
  }

  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.#render();
  }

  #effectiveIndeterminate(): boolean {
    return this.hasAttribute("indeterminate") && this.supportsIndeterminate();
  }

  #errorMessage(missing: boolean, disabled: boolean): string {
    if (disabled) {
      return "";
    }
    const custom = (this.getAttribute("error") ?? "").trim();
    if (custom !== "") {
      return custom;
    }
    return missing && this.#touched ? this.#requiredMessage() : "";
  }

  #requiredMessage(): string {
    return t("forms.toggleRequired", "This option is required.");
  }

  #isDisabled(): boolean {
    return (
      this.hasAttribute("disabled") ||
      this.#formDisabled ||
      this.matches(":disabled")
    );
  }

  #warnIfUnnamed(): void {
    const hasName =
      (this.getAttribute("label") ?? "") !== "" ||
      (this.getAttribute("aria-label") ?? "") !== "";
    if (!hasName) {
      console.warn(
        `<wuik-${this.kind}> has no accessible name: set \`label\` or \`aria-label\`.`,
      );
    }
  }

  #render(): void {
    const label = this.getAttribute("label") ?? "";
    this.#labelText.textContent = label;
    this.#labelBlock.hidden = label === "";
    this.#labelBlock.classList.toggle(
      "is-hidden",
      this.hasAttribute("hide-label"),
    );

    const ariaLabel = this.getAttribute("aria-label");
    if (label === "" && ariaLabel) {
      this.#input.setAttribute("aria-label", ariaLabel);
    } else {
      this.#input.removeAttribute("aria-label");
    }

    const required = this.hasAttribute("required");
    this.#input.required = required;
    this.#requiredMarker.hidden = !required;

    if (this.hasAttribute("indeterminate") && !this.supportsIndeterminate()) {
      console.warn(`<wuik-${this.kind}> does not support \`indeterminate\`.`);
    }
    this.#input.indeterminate = this.#effectiveIndeterminate();

    const disabled = this.#isDisabled();
    this.#input.disabled = disabled;
    this.#wrapper.classList.toggle("is-disabled", disabled);

    const checked = this.#input.checked;
    this.#internals?.setFormValue(
      checked ? (this.getAttribute("value") ?? "on") : null,
    );
    const missing = required && !checked;
    if (missing) {
      this.#internals?.setValidity(
        { valueMissing: true },
        this.#requiredMessage(),
        this.#input,
      );
    } else {
      this.#internals?.setValidity({});
    }

    const message = this.#errorMessage(missing, disabled);
    const invalid = message !== "";
    this.#wrapper.classList.toggle("is-invalid", invalid);
    this.#error.textContent = message;
    if (invalid) {
      this.#input.setAttribute("aria-invalid", "true");
      this.#input.setAttribute("aria-describedby", this.#error.id);
    } else {
      this.#input.removeAttribute("aria-invalid");
      this.#input.removeAttribute("aria-describedby");
    }
  }

  readonly #handleChange = (event: Event): void => {
    event.stopPropagation();
    if (this.#isDisabled()) {
      return;
    }
    this.#dirty = true;
    if (this.#effectiveIndeterminate()) {
      // A user toggle resolves indeterminate to checked.
      this.#input.checked = true;
      this.removeAttribute("indeterminate");
    }
    this.#touched = true;
    this.#render();
    this.dispatchEvent(
      new CustomEvent("wuik-change", {
        detail: {
          checked: this.#input.checked,
          indeterminate: this.#input.indeterminate,
        },
        bubbles: true,
        composed: true,
      }),
    );
  };

  readonly #markTouched = (): void => {
    this.#touched = true;
    this.#render();
  };

  // A click on the host itself (e.g. from an external `<label for>`) toggles.
  readonly #handleHostClick = (event: MouseEvent): void => {
    if (event.composedPath()[0] === this && !this.#isDisabled()) {
      this.#input.click();
    }
  };
}
