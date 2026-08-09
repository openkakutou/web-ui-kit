/**
 * `<wuik-panel>` — a standalone container: an optional titled header region
 * plus a body slot. Usable on its own, with no dependency on the layout
 * shell or any other component (backlog item 002).
 *
 * All visual styling comes from `--wuik-*` design tokens applied directly on
 * `:host`, so a consumer never needs to write CSS for it to look correct.
 */

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      background: var(--wuik-color-surface);
      border: 1px solid var(--wuik-color-border);
      color: var(--wuik-color-text);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      line-height: var(--wuik-line-height-base);
      padding: var(--wuik-space-4);
      box-sizing: border-box;
    }

    .header {
      display: none;
      padding-bottom: var(--wuik-space-2);
      margin-bottom: var(--wuik-space-2);
      border-bottom: 1px solid var(--wuik-color-border);
      font-weight: var(--wuik-font-weight-medium);
    }

    .header.has-content {
      display: block;
    }
  </style>
  <div class="header">
    <slot name="header"></slot>
  </div>
  <slot></slot>
`;

export class WuikPanelElement extends HTMLElement {
  readonly #headerWrapper: HTMLElement;
  readonly #headerSlot: HTMLSlotElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#headerWrapper = shadow.querySelector(".header") as HTMLElement;
    this.#headerSlot = shadow.querySelector(
      'slot[name="header"]',
    ) as HTMLSlotElement;
    this.#headerSlot.addEventListener("slotchange", () =>
      this.#syncHeaderVisibility(),
    );
  }

  connectedCallback(): void {
    this.#syncHeaderVisibility();
  }

  #syncHeaderVisibility(): void {
    const hasHeaderContent = this.#headerSlot.assignedElements().length > 0;
    this.#headerWrapper.classList.toggle("has-content", hasHeaderContent);
  }
}

if (!customElements.get("wuik-panel")) {
  customElements.define("wuik-panel", WuikPanelElement);
}
