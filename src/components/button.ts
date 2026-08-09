/**
 * `<wuik-button>` — a standalone button wrapping a native `<button>`.
 * Usable on its own, with no dependency on the layout shell or any other
 * component (backlog item 003).
 *
 * An unrecognized `variant` falls back to `primary`. A button mounted with
 * no slotted content and no `aria-label` does not get fabricated
 * placeholder label text — that would give it a false accessible name,
 * which is worse than an honest empty state. Instead it shows a visible
 * (non-labelling) empty-state indicator and logs a development-time
 * warning. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 */

const VARIANTS = new Set(["primary", "secondary", "danger"]);
const DEFAULT_VARIANT = "primary";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
    }

    button {
      font: inherit;
      border: none;
      padding: var(--wuik-space-2) var(--wuik-space-4);
      cursor: pointer;
      box-sizing: border-box;
    }

    button:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    button.primary {
      background: var(--wuik-color-accent);
      color: var(--wuik-color-text-on-accent);
    }

    button.secondary {
      background: var(--wuik-color-surface);
      color: var(--wuik-color-text);
      border: 1px solid var(--wuik-color-border);
    }

    button.danger {
      background: var(--wuik-color-danger);
      color: var(--wuik-color-text-on-danger);
    }

    button.is-empty {
      border: 1px dashed var(--wuik-color-danger);
      min-width: 2rem;
      min-height: 1.5rem;
    }

    .empty-indicator {
      display: none;
    }

    button.is-empty .empty-indicator {
      display: inline;
    }
  </style>
  <button type="button">
    <slot></slot><span class="empty-indicator" aria-hidden="true"> ⚠</span>
  </button>
`;

export class WuikButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "disabled", "type"];
  }

  readonly #button: HTMLButtonElement;
  readonly #slot: HTMLSlotElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#button = shadow.querySelector("button") as HTMLButtonElement;
    this.#slot = shadow.querySelector("slot") as HTMLSlotElement;
    this.#slot.addEventListener("slotchange", () => this.#syncEmptyState());
  }

  connectedCallback(): void {
    this.#render();
    this.#syncEmptyState();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    const requestedVariant = this.getAttribute("variant") ?? DEFAULT_VARIANT;
    const variant = VARIANTS.has(requestedVariant)
      ? requestedVariant
      : DEFAULT_VARIANT;
    this.#button.classList.remove(...VARIANTS);
    this.#button.classList.add(variant);

    this.#button.disabled = this.hasAttribute("disabled");
    this.#button.type =
      (this.getAttribute("type") as HTMLButtonElement["type"]) ?? "button";
  }

  #syncEmptyState(): void {
    const hasSlottedContent = this.#slot
      .assignedNodes()
      .some((node) => (node.textContent ?? "").trim().length > 0);
    const hasAccessibleLabel =
      this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
    const isEmpty = !hasSlottedContent && !hasAccessibleLabel;

    this.#button.classList.toggle("is-empty", isEmpty);
    if (isEmpty) {
      console.warn(
        "<wuik-button>: no accessible label — add slotted text content or an aria-label attribute.",
      );
    }
  }
}

if (!customElements.get("wuik-button")) {
  customElements.define("wuik-button", WuikButtonElement);
}
