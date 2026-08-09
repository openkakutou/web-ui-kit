/**
 * `<wuik-app-shell>` — a CSS-grid root layout with a toolbar row, an
 * optional sidebar column and a main content area, each a plain named slot.
 * It does not instantiate `wuik-toolbar`/`wuik-panel`/`wuik-tabs` itself —
 * any of the four layout-shell components can be used with or without the
 * others (backlog item 002).
 *
 * The toolbar/sidebar regions collapse to zero size when nothing is slotted
 * into them, and there is no gap between grid tracks — see
 * `.vibe/decisions/005-app-shell-empty-slot-collapse.md` for why.
 */

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: grid;
      grid-template-areas: "toolbar toolbar" "sidebar main";
      grid-template-columns: auto 1fr;
      grid-template-rows: auto 1fr;
      min-height: 100%;
      background: var(--wuik-color-bg);
      color: var(--wuik-color-text);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
    }

    /*
     * An unstyled slot element defaults to display:contents in browsers,
     * which would make it transparent to grid layout -- its slotted
     * children would become the actual grid items, positioned by
     * auto-placement instead of the grid-area below. display:block makes
     * the slot itself the grid item.
     */
    slot[name="toolbar"] {
      display: block;
      grid-area: toolbar;
    }

    slot[name="sidebar"] {
      display: block;
      grid-area: sidebar;
    }

    slot:not([name]) {
      display: block;
      grid-area: main;
      overflow: auto;
    }

    slot[name="toolbar"].empty,
    slot[name="sidebar"].empty {
      display: none;
    }

    @media (max-width: 640px) {
      :host {
        grid-template-areas: "toolbar" "main" "sidebar";
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
      }
    }
  </style>
  <slot name="toolbar"></slot>
  <slot name="sidebar"></slot>
  <slot></slot>
`;

export class WuikAppShellElement extends HTMLElement {
  readonly #toolbarSlot: HTMLSlotElement;
  readonly #sidebarSlot: HTMLSlotElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#toolbarSlot = shadow.querySelector(
      'slot[name="toolbar"]',
    ) as HTMLSlotElement;
    this.#sidebarSlot = shadow.querySelector(
      'slot[name="sidebar"]',
    ) as HTMLSlotElement;
    this.#toolbarSlot.addEventListener("slotchange", () =>
      this.#syncEmptyState(this.#toolbarSlot),
    );
    this.#sidebarSlot.addEventListener("slotchange", () =>
      this.#syncEmptyState(this.#sidebarSlot),
    );
  }

  connectedCallback(): void {
    this.#syncEmptyState(this.#toolbarSlot);
    this.#syncEmptyState(this.#sidebarSlot);
  }

  #syncEmptyState(slot: HTMLSlotElement): void {
    slot.classList.toggle("empty", slot.assignedElements().length === 0);
  }
}

if (!customElements.get("wuik-app-shell")) {
  customElements.define("wuik-app-shell", WuikAppShellElement);
}
