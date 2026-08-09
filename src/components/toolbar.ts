/**
 * `<wuik-toolbar>` — a standalone horizontal container for buttons or other
 * controls. Usable on its own, with no dependency on the layout shell or
 * any other component (backlog item 002).
 *
 * All visual styling comes from `--wuik-*` design tokens applied directly on
 * `:host`, so a consumer never needs to write CSS for it to look correct.
 * Content that overflows the available width scrolls horizontally instead
 * of being silently clipped.
 */

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: flex;
      align-items: center;
      gap: var(--wuik-space-2);
      padding: var(--wuik-space-2) var(--wuik-space-3);
      background: var(--wuik-color-surface);
      border-bottom: 1px solid var(--wuik-color-border);
      color: var(--wuik-color-text);
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      box-sizing: border-box;
      overflow-x: auto;
    }
  </style>
  <slot></slot>
`;

export class WuikToolbarElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
  }
}

if (!customElements.get("wuik-toolbar")) {
  customElements.define("wuik-toolbar", WuikToolbarElement);
}
