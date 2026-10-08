/**
 * `<wuik-badge>` — a small count/status pill. Shape and symbol carry the
 * meaning, never colour alone: `error` is a filled pill, `warning` an
 * outlined pill led by a "!" mark, `success` leads with a check mark.
 *
 * The visible glyphs are `aria-hidden`; assistive technology reads the
 * `label` attribute instead (a consumer-localized phrase such as "2 errors"),
 * falling back to `count` when no label is given.
 */

const VARIANTS = new Set(["neutral", "error", "warning", "success"]);
const DEFAULT_VARIANT = "neutral";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      font-family: var(--wuik-font-family-mono);
      font-size: var(--wuik-font-size-xs);
      font-weight: var(--wuik-font-weight-medium);
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--wuik-space-1);
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 var(--wuik-space-2);
      box-sizing: border-box;
      border-radius: var(--wuik-radius-pill);
      border: var(--wuik-border-width) solid var(--wuik-color-border-control);
      background: transparent;
      color: var(--wuik-color-text);
    }

    .mark:empty {
      display: none;
    }

    .badge.error {
      background: var(--wuik-color-error);
      border-color: var(--wuik-color-error);
      color: var(--wuik-color-on-error);
    }

    .badge.warning {
      border-color: var(--wuik-color-warning);
    }

    .badge.warning .mark,
    .badge.success .mark {
      font-weight: var(--wuik-font-weight-bold);
    }

    .badge.warning .mark {
      color: var(--wuik-color-warning);
    }

    .badge.success {
      border-color: var(--wuik-color-success);
    }

    .badge.success .mark {
      color: var(--wuik-color-success);
    }

    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  </style>
  <span class="badge" aria-hidden="true"><span class="mark"></span><span class="count"></span></span>
  <span class="sr"></span>
`;

const MARKS: Record<string, string> = { warning: "!", success: "✓" };

export class WuikBadgeElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "count", "label"];
  }

  readonly #badge: HTMLElement;
  readonly #mark: HTMLElement;
  readonly #count: HTMLElement;
  readonly #sr: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#badge = shadow.querySelector(".badge") as HTMLElement;
    this.#mark = shadow.querySelector(".mark") as HTMLElement;
    this.#count = shadow.querySelector(".count") as HTMLElement;
    this.#sr = shadow.querySelector(".sr") as HTMLElement;
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    const requested = this.getAttribute("variant") ?? DEFAULT_VARIANT;
    const variant = VARIANTS.has(requested) ? requested : DEFAULT_VARIANT;
    this.#badge.className = `badge ${variant}`;
    this.#mark.textContent = MARKS[variant] ?? "";
    const count = this.getAttribute("count") ?? "";
    this.#count.textContent = count;
    this.#sr.textContent = this.getAttribute("label") ?? count;
  }
}

if (!customElements.get("wuik-badge")) {
  customElements.define("wuik-badge", WuikBadgeElement);
}
