/**
 * `<wuik-button>` — a standalone button wrapping a native `<button>`.
 * Usable on its own, with no dependency on the layout shell or any other
 * component (backlog item 003).
 *
 * Variants: `primary` (one per view), `secondary`, `ghost` (toolbar actions)
 * and `danger`. An unrecognized `variant` falls back to `primary`. A button mounted with
 * no slotted content and no `aria-label` does not get fabricated
 * placeholder label text — that would give it a false accessible name,
 * which is worse than an honest empty state. Instead it shows a visible
 * (non-labelling) empty-state indicator and logs a development-time
 * warning. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 *
 * The boolean `pressed` attribute layers a visually distinct, token-driven
 * "pressed"/"selected" style on top of the current `variant` and sets
 * `aria-pressed="true"` on the native button. When absent, `aria-pressed`
 * is removed entirely (never `"false"`) so a plain, non-toggle button never
 * gains toggle semantics — see
 * `.vibe/decisions/018-button-pressed-state-design.md`.
 */

const VARIANTS = new Set(["primary", "secondary", "ghost", "danger"]);
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
      font-weight: var(--wuik-font-weight-medium);
      border: var(--wuik-border-width) solid transparent;
      border-radius: var(--wuik-radius-button);
      min-height: var(--wuik-control-height);
      padding: 0 var(--wuik-space-4);
      cursor: pointer;
      box-sizing: border-box;
      transition: background var(--wuik-motion-fast) var(--wuik-motion-ease),
        border-color var(--wuik-motion-fast) var(--wuik-motion-ease);
    }

    button:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: var(--wuik-focus-ring-offset);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    button.primary {
      background: var(--wuik-color-primary);
      color: var(--wuik-color-on-primary);
      border-color: var(--wuik-color-primary);
    }

    button.secondary {
      background: var(--wuik-color-surface-raised);
      color: var(--wuik-color-text);
      border-color: var(--wuik-color-border-control);
    }

    button.ghost {
      background: transparent;
      color: var(--wuik-color-text);
    }

    button.danger {
      background: var(--wuik-color-error);
      color: var(--wuik-color-on-error);
      border-color: var(--wuik-color-error);
    }

    button.primary:hover {
      background: color-mix(in srgb, var(--wuik-color-primary) 88%, var(--wuik-color-text));
    }

    button.secondary:hover,
    button.ghost:hover {
      background: color-mix(in srgb, var(--wuik-color-surface-raised) 85%, var(--wuik-color-text));
    }

    button.danger:hover {
      background: color-mix(in srgb, var(--wuik-color-error) 88%, var(--wuik-color-text));
    }

    button.is-pressed {
      box-shadow: inset 0 1px 3px
        color-mix(in srgb, var(--wuik-color-text) 35%, transparent);
    }

    button.primary.is-pressed {
      background: color-mix(in srgb, var(--wuik-color-primary) 85%, var(--wuik-color-text));
    }

    button.secondary.is-pressed,
    button.ghost.is-pressed {
      background: color-mix(in srgb, var(--wuik-color-surface-raised) 85%, var(--wuik-color-text));
    }

    button.danger.is-pressed {
      background: color-mix(in srgb, var(--wuik-color-error) 85%, var(--wuik-color-text));
    }

    button.is-empty {
      border: 1px dashed var(--wuik-color-error);
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
    return ["variant", "disabled", "type", "pressed"];
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

    const pressed = this.hasAttribute("pressed");
    this.#button.classList.toggle("is-pressed", pressed);
    if (pressed) {
      this.#button.setAttribute("aria-pressed", "true");
    } else {
      this.#button.removeAttribute("aria-pressed");
    }
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
