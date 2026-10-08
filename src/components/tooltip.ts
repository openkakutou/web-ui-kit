/**
 * `<wuik-tooltip text="…">` — a short text label for the element it wraps
 * (typically an icon-only button). Shown on hover and on keyboard focus,
 * dismissible with Escape, and kept open while the pointer is over the
 * tooltip itself (WCAG 1.4.13).
 *
 * The first slotted element also receives `aria-description` with the same
 * text: an `aria-describedby` reference cannot cross the shadow boundary, so
 * the description is set directly on the light-DOM trigger.
 */

let nextTooltipId = 0;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--wuik-font-family-base);
    }

    .tip {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: calc(100% + var(--wuik-space-1));
      z-index: 1000;
      max-width: 16rem;
      width: max-content;
      padding: var(--wuik-space-1) var(--wuik-space-2);
      border-radius: var(--wuik-radius-control);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      background: var(--wuik-color-surface-raised);
      color: var(--wuik-color-text);
      font-size: var(--wuik-font-size-sm);
      line-height: var(--wuik-line-height-base);
      box-shadow: var(--wuik-shadow-overlay);
      pointer-events: auto;
    }

    :host([placement="bottom"]) .tip {
      bottom: auto;
      top: calc(100% + var(--wuik-space-1));
    }

    :host([placement="right"]) .tip {
      left: calc(100% + var(--wuik-space-1));
      bottom: auto;
      top: 50%;
      transform: translateY(-50%);
    }

    .tip[hidden] {
      display: none;
    }
  </style>
  <slot></slot>
  <span class="tip" role="tooltip" hidden></span>
`;

export class WuikTooltipElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["text"];
  }

  readonly #slot: HTMLSlotElement;
  readonly #tip: HTMLElement;
  #described: Element | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#slot = shadow.querySelector("slot") as HTMLSlotElement;
    this.#tip = shadow.querySelector(".tip") as HTMLElement;
    this.#tip.id = `wuik-tooltip-${nextTooltipId++}`;
    this.#slot.addEventListener("slotchange", () => this.#syncDescription());
    this.addEventListener("pointerenter", this.#show);
    this.addEventListener("pointerleave", this.#hide);
    this.addEventListener("focusin", this.#show);
    this.addEventListener("focusout", this.#hide);
  }

  connectedCallback(): void {
    this.#syncText();
    this.#syncDescription();
  }

  disconnectedCallback(): void {
    document.removeEventListener("keydown", this.#handleKeydown);
  }

  attributeChangedCallback(): void {
    this.#syncText();
    this.#syncDescription();
  }

  get open(): boolean {
    return !this.#tip.hidden;
  }

  #text(): string {
    return this.getAttribute("text") ?? "";
  }

  #syncText(): void {
    this.#tip.textContent = this.#text();
  }

  #syncDescription(): void {
    const target = this.#slot.assignedElements()[0];
    if (this.#described && this.#described !== target) {
      this.#described.removeAttribute("aria-description");
    }
    this.#described = target;
    if (!target) {
      return;
    }
    if (this.#text()) {
      target.setAttribute("aria-description", this.#text());
    } else {
      target.removeAttribute("aria-description");
    }
  }

  readonly #show = (): void => {
    if (!this.#text()) {
      return;
    }
    this.#tip.hidden = false;
    document.addEventListener("keydown", this.#handleKeydown);
  };

  readonly #hide = (): void => {
    this.#tip.hidden = true;
    document.removeEventListener("keydown", this.#handleKeydown);
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.#hide();
    }
  };
}

if (!customElements.get("wuik-tooltip")) {
  customElements.define("wuik-tooltip", WuikTooltipElement);
}
