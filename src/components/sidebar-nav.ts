/**
 * `<wuik-sidebar-nav>` + `<wuik-nav-group>` + `<wuik-nav-item>` — the
 * left navigation of an editor: sections in labelled groups, one current at
 * a time.
 *
 * Semantics: a `<nav>` landmark (named by `label`) of groups; each item is
 * a native button, never a tab or menu role, so screen readers keep link and
 * button behaviour. The current item gets `aria-current="page"`. Tab order
 * follows document order; there is no roving tabindex.
 *
 * Items report intent with a bubbling, cancelable `wuik-navigate` event
 * (`detail.value`); unless it is `preventDefault()`ed the nav moves
 * `current` to that item. The `collapsed` attribute folds the nav to an icon
 * rail: labels stay in the accessible name and become a native tooltip.
 *
 * Badges: `badge-error` / `badge-warning` counts render `<wuik-badge>`s, and
 * `badge-label` carries the consumer-localized phrase ("2 errors, 1
 * warning") read as part of the item's name, so a badge is never
 * colour-only.
 */

import "./badge.ts";

const SR_ONLY = `
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const NAV_TEMPLATE = document.createElement("template");
NAV_TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }
  </style>
  <nav><slot></slot></nav>
`;

export class WuikSidebarNavElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "collapsed"];
  }

  readonly #nav: HTMLElement;
  readonly #observer: MutationObserver;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(NAV_TEMPLATE.content.cloneNode(true));
    this.#nav = shadow.querySelector("nav") as HTMLElement;
    this.#observer = new MutationObserver(() => this.#propagateCollapsed());
    this.addEventListener("wuik-navigate", this.#handleNavigate);
  }

  connectedCallback(): void {
    this.#observer.observe(this, { childList: true, subtree: true });
    this.#render();
  }

  disconnectedCallback(): void {
    this.#observer.disconnect();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  /** The `value` of the current item, or `null` when none is current. */
  get current(): string | null {
    return (
      this.#items()
        .find((item) => item.hasAttribute("current"))
        ?.getAttribute("value") ?? null
    );
  }

  set current(value: string | null) {
    for (const item of this.#items()) {
      item.toggleAttribute(
        "current",
        value !== null && item.getAttribute("value") === value,
      );
    }
  }

  #items(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>("wuik-nav-item"));
  }

  #render(): void {
    const label = this.getAttribute("label");
    if (label) {
      this.#nav.setAttribute("aria-label", label);
    } else {
      this.#nav.removeAttribute("aria-label");
    }
    this.#propagateCollapsed();
  }

  /** Light-DOM children cannot read the host's state through the shadow
   * boundary, so the nav mirrors `collapsed` onto them as an attribute. */
  #propagateCollapsed(): void {
    const collapsed = this.hasAttribute("collapsed");
    for (const el of this.querySelectorAll("wuik-nav-item, wuik-nav-group")) {
      if (el.hasAttribute("collapsed") !== collapsed) {
        el.toggleAttribute("collapsed", collapsed);
      }
    }
  }

  readonly #handleNavigate = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail?.value;
    queueMicrotask(() => {
      if (!event.defaultPrevented && value !== undefined) {
        this.current = value;
      }
    });
  };
}

if (!customElements.get("wuik-sidebar-nav")) {
  customElements.define("wuik-sidebar-nav", WuikSidebarNavElement);
}

const GROUP_TEMPLATE = document.createElement("template");
GROUP_TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      margin-top: var(--wuik-space-3);
    }

    .title {
      padding: var(--wuik-space-2) var(--wuik-space-3);
      font-size: var(--wuik-font-size-xs);
      font-weight: var(--wuik-font-weight-bold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--wuik-color-text-muted);
    }

    :host([collapsed]) .title {
      ${SR_ONLY}
    }

    :host([collapsed]) {
      border-top: var(--wuik-border-width) solid var(--wuik-color-border);
      padding-top: var(--wuik-space-2);
    }

    .items {
      display: grid;
      gap: var(--wuik-space-1);
    }
  </style>
  <div class="title"></div>
  <div class="items" role="group"><slot></slot></div>
`;

let nextGroupId = 0;

export class WuikNavGroupElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label"];
  }

  readonly #title: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(GROUP_TEMPLATE.content.cloneNode(true));
    this.#title = shadow.querySelector(".title") as HTMLElement;
    this.#title.id = `wuik-nav-group-${nextGroupId++}`;
    (shadow.querySelector(".items") as HTMLElement).setAttribute(
      "aria-labelledby",
      this.#title.id,
    );
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    this.#title.textContent = this.getAttribute("label") ?? "";
  }
}

if (!customElements.get("wuik-nav-group")) {
  customElements.define("wuik-nav-group", WuikNavGroupElement);
}

const ITEM_TEMPLATE = document.createElement("template");
ITEM_TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
    }

    button {
      appearance: none;
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--wuik-space-3);
      width: 100%;
      min-height: var(--wuik-control-height);
      padding: 0 var(--wuik-space-3);
      border: none;
      border-radius: var(--wuik-radius-control);
      background: transparent;
      color: var(--wuik-color-text);
      font: inherit;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
      transition: background var(--wuik-motion-fast) var(--wuik-motion-ease);
    }

    button:hover {
      background: var(--wuik-color-surface-raised);
    }

    button[aria-current="page"] {
      background: var(--wuik-color-surface-raised);
      font-weight: var(--wuik-font-weight-medium);
    }

    button[aria-current="page"]::before {
      content: "";
      position: absolute;
      left: 0;
      top: var(--wuik-space-2);
      bottom: var(--wuik-space-2);
      width: 2px;
      border-radius: 2px;
      background: var(--wuik-color-primary);
    }

    button:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: calc(-1 * var(--wuik-focus-ring-width));
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      display: contents;
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badges {
      display: inline-flex;
      gap: var(--wuik-space-1);
    }

    .badge-sr {
      ${SR_ONLY}
    }

    kbd {
      font-family: var(--wuik-font-family-mono);
      font-size: var(--wuik-font-size-xs);
      color: var(--wuik-color-text-muted);
    }

    kbd:empty {
      display: none;
    }

    :host([collapsed]) button {
      justify-content: center;
      padding: 0;
    }

    :host([collapsed]) .label {
      ${SR_ONLY}
    }

    :host([collapsed]) kbd {
      display: none;
    }

    :host([collapsed]) .badges {
      position: absolute;
      top: 0;
      right: 0;
      transform: scale(0.7);
      transform-origin: top right;
    }
  </style>
  <button type="button">
    <span class="icon"><slot name="icon"></slot></span>
    <span class="label"><slot></slot></span>
    <span class="badges">
      <wuik-badge class="error" variant="error" hidden></wuik-badge>
      <wuik-badge class="warning" variant="warning" hidden></wuik-badge>
    </span>
    <span class="badge-sr"></span>
    <kbd aria-hidden="true"></kbd>
  </button>
`;

export class WuikNavItemElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      "value",
      "current",
      "disabled",
      "shortcut",
      "badge-error",
      "badge-warning",
      "badge-label",
      "collapsed",
    ];
  }

  readonly #button: HTMLButtonElement;
  readonly #errorBadge: HTMLElement;
  readonly #warningBadge: HTMLElement;
  readonly #badgeSr: HTMLElement;
  readonly #shortcut: HTMLElement;
  readonly #labelSlot: HTMLSlotElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(ITEM_TEMPLATE.content.cloneNode(true));
    this.#button = shadow.querySelector("button") as HTMLButtonElement;
    this.#errorBadge = shadow.querySelector("wuik-badge.error") as HTMLElement;
    this.#warningBadge = shadow.querySelector(
      "wuik-badge.warning",
    ) as HTMLElement;
    this.#badgeSr = shadow.querySelector(".badge-sr") as HTMLElement;
    this.#shortcut = shadow.querySelector("kbd") as HTMLElement;
    this.#labelSlot = shadow.querySelector(".label slot") as HTMLSlotElement;
    this.#labelSlot.addEventListener("slotchange", () => this.#render());
    this.#button.addEventListener("click", this.#handleClick);
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #labelText(): string {
    return this.#labelSlot
      .assignedNodes()
      .map((node) => node.textContent ?? "")
      .join("")
      .trim();
  }

  #count(attribute: string): number {
    const value = Number(this.getAttribute(attribute));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  #render(): void {
    this.#button.disabled = this.hasAttribute("disabled");
    if (this.hasAttribute("current")) {
      this.#button.setAttribute("aria-current", "page");
    } else {
      this.#button.removeAttribute("aria-current");
    }

    const errors = this.#count("badge-error");
    const warnings = this.#count("badge-warning");
    this.#errorBadge.hidden = errors === 0;
    this.#errorBadge.setAttribute("count", String(errors));
    this.#warningBadge.hidden = warnings === 0;
    this.#warningBadge.setAttribute("count", String(warnings));
    // The nav item speaks for its badges, so the badges themselves stay silent.
    this.#errorBadge.setAttribute("label", "");
    this.#warningBadge.setAttribute("label", "");
    const hasBadges = errors > 0 || warnings > 0;
    this.#badgeSr.textContent = hasBadges
      ? `, ${this.getAttribute("badge-label") ?? [errors, warnings].filter(Boolean).join(", ")}`
      : "";

    const shortcut = this.getAttribute("shortcut") ?? "";
    this.#shortcut.textContent = shortcut;
    if (shortcut) {
      this.#button.setAttribute("aria-keyshortcuts", `Alt+${shortcut}`);
    } else {
      this.#button.removeAttribute("aria-keyshortcuts");
    }

    const label = this.#labelText();
    if (this.hasAttribute("collapsed") && label) {
      this.#button.title = shortcut ? `${label} (Alt+${shortcut})` : label;
    } else {
      this.#button.removeAttribute("title");
    }
  }

  readonly #handleClick = (): void => {
    this.dispatchEvent(
      new CustomEvent("wuik-navigate", {
        detail: { value: this.getAttribute("value") ?? this.#labelText() },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
  };
}

if (!customElements.get("wuik-nav-item")) {
  customElements.define("wuik-nav-item", WuikNavItemElement);
}
