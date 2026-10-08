/**
 * `<wuik-list-row>` — one row of a dense list (StateDef, Animation, Sprite
 * group…): 28 px tall, hover fill, and a selected state shown by a raised
 * fill plus a 2 px left accent bar.
 *
 * A row is a real button. With the boolean `expandable` attribute it is a
 * disclosure: a click toggles `expanded`, which is mirrored as
 * `aria-expanded`, and a bubbling `wuik-toggle` event reports the new state.
 * `selected` sets `aria-current="true"`. The `end` slot holds trailing
 * content (count, badge). The expanded content itself stays in the consumer's
 * DOM, next to the row.
 */

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    button {
      appearance: none;
      display: flex;
      align-items: center;
      gap: var(--wuik-space-3);
      width: 100%;
      min-height: 1.75rem;
      padding: var(--wuik-space-1) var(--wuik-space-3);
      border: none;
      border-radius: var(--wuik-radius-control);
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
      transition: background var(--wuik-motion-fast) var(--wuik-motion-ease);
    }

    button:hover {
      background: var(--wuik-color-surface-raised);
    }

    button[aria-current="true"],
    button[aria-expanded="true"] {
      background: var(--wuik-color-surface-raised);
    }

    button[aria-current="true"] {
      box-shadow: inset 2px 0 0 var(--wuik-color-primary);
    }

    button:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: calc(-1 * var(--wuik-focus-ring-width));
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .chevron {
      display: none;
      width: 0.5rem;
      height: 0.5rem;
      border-right: 2px solid var(--wuik-color-text-muted);
      border-bottom: 2px solid var(--wuik-color-text-muted);
      transform: rotate(-45deg);
      transition: transform var(--wuik-motion-fast) var(--wuik-motion-ease);
      flex: none;
    }

    :host([expandable]) .chevron {
      display: block;
    }

    button[aria-expanded="true"] .chevron {
      transform: rotate(45deg);
    }

    .main {
      flex: 1;
      min-width: 0;
    }

    .end {
      display: inline-flex;
      align-items: center;
      gap: var(--wuik-space-2);
      color: var(--wuik-color-text-muted);
      font-family: var(--wuik-font-family-mono);
    }
  </style>
  <button type="button">
    <span class="chevron" aria-hidden="true"></span>
    <span class="main"><slot></slot></span>
    <span class="end"><slot name="end"></slot></span>
  </button>
`;

export class WuikListRowElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["selected", "expandable", "expanded", "disabled"];
  }

  readonly #button: HTMLButtonElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#button = shadow.querySelector("button") as HTMLButtonElement;
    this.#button.addEventListener("click", this.#handleClick);
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    this.#button.disabled = this.hasAttribute("disabled");
    if (this.hasAttribute("selected")) {
      this.#button.setAttribute("aria-current", "true");
    } else {
      this.#button.removeAttribute("aria-current");
    }
    if (this.hasAttribute("expandable")) {
      this.#button.setAttribute(
        "aria-expanded",
        String(this.hasAttribute("expanded")),
      );
    } else {
      this.#button.removeAttribute("aria-expanded");
    }
  }

  readonly #handleClick = (): void => {
    if (!this.hasAttribute("expandable")) {
      return;
    }
    this.toggleAttribute("expanded");
    this.dispatchEvent(
      new CustomEvent("wuik-toggle", {
        detail: { expanded: this.hasAttribute("expanded") },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

if (!customElements.get("wuik-list-row")) {
  customElements.define("wuik-list-row", WuikListRowElement);
}
