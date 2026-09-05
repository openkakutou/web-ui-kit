/**
 * `<wuik-radio-group>` — a standalone single-choice control wrapping one
 * native `<input type="radio">` per option. Usable on its own, with no
 * dependency on the layout shell or any other component (backlog item 014,
 * org-wide UX audit backlog item 012).
 *
 * Options are declared as light-DOM `<wuik-radio-option value="…">Label
 * text</wuik-radio-option>` children, read reactively via `slotchange` —
 * mirroring `<wuik-tabs>`/`<wuik-tab-panel>` rather than a JSON `options`
 * attribute. See
 * `.vibe/decisions/016-radio-group-options-as-light-dom-children.md`.
 *
 * Arrow-key movement is handled by a custom keydown handler (roving
 * tabindex over the real native radios) rather than relying on native
 * shadow-DOM radio-group arrow navigation, for deterministic, testable
 * behavior — the same choice `<wuik-tabs>` made for its own tab strip. A
 * duplicate option `value` is a malformed *group* configuration (decision
 * 007): flagged with the shared `is-invalid` state, keeping only the first
 * occurrence. A `value` attribute matching no option just leaves nothing
 * checked, like a well-formed-but-out-of-range slider value.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";
import { resolveRadioGroupOptions } from "./radio-group-options.ts";

/**
 * `<wuik-radio-option>` — the data source for one `<wuik-radio-group>`
 * option (a `value` attribute plus its text content as the display label).
 * Never rendered itself: the group reads it once per render and builds its
 * own styled native radio in shadow DOM.
 */
export class WuikRadioOptionElement extends HTMLElement {}

if (!customElements.get("wuik-radio-option")) {
  customElements.define("wuik-radio-option", WuikRadioOptionElement);
}

let nextGroupId = 0;

const ARROW_KEY_DIRECTION: Record<string, 1 | -1> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    /* The slotted <wuik-radio-option> elements are a data source only —
       the group renders its own native radios below, so the slot itself
       is never shown, only watched for slotchange. */
    slot {
      display: none;
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: var(--wuik-space-1);
    }

    .group.is-invalid {
      outline: 2px solid var(--wuik-color-danger);
      outline-offset: 2px;
    }

    .group.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    label.option {
      display: flex;
      align-items: flex-start;
      gap: var(--wuik-space-2);
      padding: var(--wuik-space-2) var(--wuik-space-3);
      min-height: 2.75rem;
      box-sizing: border-box;
      cursor: pointer;
    }

    label.option.is-selected {
      font-weight: var(--wuik-font-weight-medium);
    }

    input[type="radio"] {
      flex-shrink: 0;
      margin-top: 0.2em;
      accent-color: var(--wuik-color-accent);
    }

    input[type="radio"]:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }

    input[type="radio"]:disabled {
      cursor: not-allowed;
    }

    .error {
      display: none;
      color: var(--wuik-color-text);
      font-size: var(--wuik-font-size-sm);
    }

    .group.is-invalid ~ .error {
      display: block;
    }
  </style>
  <div class="group" role="radiogroup"></div>
  <span class="error" role="status"></span>
  <slot></slot>
`;

export class WuikRadioGroupElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["value", "disabled", "label"];
  }

  readonly #group: HTMLElement;
  readonly #error: HTMLElement;
  readonly #slot: HTMLSlotElement;
  readonly #groupName = `wuik-radio-group-${nextGroupId++}`;
  #radios: HTMLInputElement[] = [];
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#group = shadow.querySelector('[role="radiogroup"]') as HTMLElement;
    this.#error = shadow.querySelector('[role="status"]') as HTMLElement;
    this.#slot = shadow.querySelector("slot") as HTMLSlotElement;

    this.#slot.addEventListener("slotchange", () => this.#render());
    this.#group.addEventListener("keydown", this.#handleKeydown);
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

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  #readRawOptions(): { value: string | null; label: string }[] {
    return this.#slot
      .assignedElements()
      .filter(
        (el): el is WuikRadioOptionElement =>
          el.tagName.toLowerCase() === "wuik-radio-option",
      )
      .map((el) => ({
        value: el.getAttribute("value"),
        label: (el.textContent ?? "").trim(),
      }));
  }

  #render(): void {
    const disabled = this.hasAttribute("disabled");
    const { options, invalid, duplicateValue } = resolveRadioGroupOptions(
      this.#readRawOptions(),
    );
    const currentValue = this.getAttribute("value");
    const checkedIndex = options.findIndex((o) => o.value === currentValue);
    const tabStopIndex = options.length === 0 ? -1 : Math.max(checkedIndex, 0);

    const label = this.getAttribute("label");
    if (label) {
      this.#group.setAttribute("aria-label", label);
    } else {
      this.#group.removeAttribute("aria-label");
    }

    this.#group.innerHTML = "";
    this.#radios = options.map((option, index) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = "option";
      optionLabel.classList.toggle("is-selected", index === checkedIndex);

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = this.#groupName;
      radio.value = option.value;
      radio.checked = index === checkedIndex;
      radio.tabIndex = !disabled && index === tabStopIndex ? 0 : -1;
      radio.disabled = disabled;
      radio.addEventListener("click", () => this.#selectIndex(index));

      const text = document.createElement("span");
      text.textContent = option.label;

      optionLabel.append(radio, text);
      this.#group.appendChild(optionLabel);
      return radio;
    });

    this.#group.classList.toggle("is-invalid", invalid);
    this.#group.classList.toggle("is-disabled", disabled);
    this.#group.setAttribute("aria-invalid", String(invalid));
    this.#error.textContent = invalid
      ? t(
          "forms.radioGroupInvalidOptions",
          'Duplicate option value "{{value}}" — showing only the first match.',
          { value: duplicateValue ?? "" },
        )
      : "";
  }

  readonly #handleKeydown = (event: Event): void => {
    if (this.hasAttribute("disabled") || this.#radios.length === 0) {
      return;
    }
    const keyboardEvent = event as KeyboardEvent;
    const direction = ARROW_KEY_DIRECTION[keyboardEvent.key];
    if (!direction) {
      return;
    }
    const currentIndex = this.#radios.indexOf(
      keyboardEvent.target as HTMLInputElement,
    );
    const baseIndex = currentIndex === -1 ? 0 : currentIndex;
    const length = this.#radios.length;
    const nextIndex = (((baseIndex + direction) % length) + length) % length;

    keyboardEvent.preventDefault();
    this.#selectIndex(nextIndex, { focus: true });
  };

  #selectIndex(index: number, options?: { focus?: boolean }): void {
    if (this.hasAttribute("disabled")) {
      return;
    }
    const radio = this.#radios[index];
    if (!radio) {
      return;
    }
    const changed = radio.value !== this.getAttribute("value");
    this.setAttribute("value", radio.value);
    if (options?.focus) {
      this.#radios[index]?.focus();
    }
    if (changed) {
      this.#emitChange(radio.value);
    }
  }

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

if (!customElements.get("wuik-radio-group")) {
  customElements.define("wuik-radio-group", WuikRadioGroupElement);
}
