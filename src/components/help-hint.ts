/**
 * `<wuik-help-hint>` — the contextual "?" help next to a format term
 * (StateDef, Clsn…). The slotted content is the explanation. A native
 * button toggles it open (click, Enter, Space); hover and keyboard focus
 * also reveal it, Escape and an outside click close it.
 *
 * The button's accessible name is the `label` attribute, defaulting to a
 * localized "Help"; consumers should pass the term ("Help: StateDef") so a
 * screen-reader user knows what the hint is about. The popover is described
 * to the button with `aria-describedby` inside one shadow root, so the
 * reference resolves.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";

let nextHintId = 0;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-sm);
      vertical-align: middle;
    }

    button {
      appearance: none;
      display: inline-grid;
      place-items: center;
      width: var(--wuik-target-min);
      height: var(--wuik-target-min);
      padding: 0;
      border-radius: var(--wuik-radius-pill);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      background: transparent;
      color: var(--wuik-color-text-muted);
      font: inherit;
      font-weight: var(--wuik-font-weight-medium);
      cursor: help;
    }

    button:hover,
    button[aria-expanded="true"] {
      color: var(--wuik-color-text);
      background: var(--wuik-color-surface-raised);
    }

    button:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: var(--wuik-focus-ring-offset);
    }

    .pop {
      position: absolute;
      left: 50%;
      top: calc(100% + var(--wuik-space-1));
      transform: translateX(-50%);
      z-index: 1000;
      width: 16rem;
      max-width: 80vw;
      padding: var(--wuik-space-2) var(--wuik-space-3);
      border-radius: var(--wuik-radius-control);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      background: var(--wuik-color-surface-raised);
      color: var(--wuik-color-text);
      line-height: var(--wuik-line-height-base);
      box-shadow: var(--wuik-shadow-overlay);
    }

    .pop[hidden] {
      display: none;
    }
  </style>
  <button type="button" aria-expanded="false">?</button>
  <div class="pop" role="note" hidden><slot></slot></div>
`;

export class WuikHelpHintElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label"];
  }

  readonly #button: HTMLButtonElement;
  readonly #pop: HTMLElement;
  #pinned = false;
  #transient = false;
  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#button = shadow.querySelector("button") as HTMLButtonElement;
    this.#pop = shadow.querySelector(".pop") as HTMLElement;
    const id = `wuik-help-hint-${nextHintId++}`;
    this.#pop.id = id;
    this.#button.setAttribute("aria-describedby", id);

    this.#button.addEventListener("click", this.#handleClick);
    this.addEventListener("pointerenter", this.#showTransient);
    this.addEventListener("pointerleave", this.#hideTransient);
    this.addEventListener("focusin", this.#showTransient);
    this.addEventListener("focusout", this.#hideTransient);
    this.addEventListener("keydown", this.#handleKeydown);
  }

  connectedCallback(): void {
    this.#renderLabel();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#renderLabel());
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
    document.removeEventListener("click", this.#handleOutsideClick, true);
  }

  attributeChangedCallback(): void {
    this.#renderLabel();
  }

  get open(): boolean {
    return !this.#pop.hidden;
  }

  #renderLabel(): void {
    this.#button.setAttribute(
      "aria-label",
      this.getAttribute("label") ?? t("helpHint.label", "Help"),
    );
  }

  #sync(): void {
    const visible = this.#pinned || this.#transient;
    this.#pop.hidden = !visible;
    this.#button.setAttribute("aria-expanded", String(this.#pinned));
    if (this.#pinned) {
      document.addEventListener("click", this.#handleOutsideClick, true);
    } else {
      document.removeEventListener("click", this.#handleOutsideClick, true);
    }
  }

  readonly #handleClick = (): void => {
    this.#pinned = !this.#pinned;
    this.#sync();
  };

  readonly #showTransient = (): void => {
    this.#transient = true;
    this.#sync();
  };

  readonly #hideTransient = (): void => {
    this.#transient = false;
    this.#sync();
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && (this.#pinned || this.#transient)) {
      this.#pinned = false;
      this.#transient = false;
      this.#sync();
      event.stopPropagation();
    }
  };

  readonly #handleOutsideClick = (event: Event): void => {
    if (!event.composedPath().includes(this)) {
      this.#pinned = false;
      this.#sync();
    }
  };
}

if (!customElements.get("wuik-help-hint")) {
  customElements.define("wuik-help-hint", WuikHelpHintElement);
}
