/**
 * `<wuik-tabs>` + `<wuik-tab-panel>` — a keyboard-accessible tab strip.
 * `<wuik-tabs>` reads its light-DOM `<wuik-tab-panel label="…">` children
 * reactively (via `slotchange`, so adding/removing panels at runtime is a
 * first-class case) and builds the actual tab buttons itself. Activation is
 * automatic: moving focus with the arrow keys immediately selects the
 * corresponding panel — see `.vibe/decisions/004-tabs-automatic-activation.md`.
 *
 * An `orientation="vertical"` attribute lays the tab strip out as a column
 * (for a sidebar tab list) and swaps the active arrow-key pair to
 * ArrowUp/ArrowDown, per the ARIA APG; any other value (including omitted)
 * falls back to the default horizontal layout and ArrowLeft/ArrowRight, both
 * visually and behaviorally — see
 * `.vibe/decisions/020-tabs-vertical-orientation-and-baseline-shift-avoidance.md`.
 * Home/End are orientation-independent in both modes.
 */

let nextPanelId = 0;

export class WuikTabPanelElement extends HTMLElement {
  connectedCallback(): void {
    this.setAttribute("role", "tabpanel");
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
    if (!this.id) {
      this.id = `wuik-tab-panel-${nextPanelId++}`;
    }
  }
}

if (!customElements.get("wuik-tab-panel")) {
  customElements.define("wuik-tab-panel", WuikTabPanelElement);
}

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    [role="tablist"] {
      display: flex;
      gap: var(--wuik-space-1);
      overflow-x: auto;
      border-bottom: 1px solid var(--wuik-color-border);
    }

    :host([orientation="vertical"]) [role="tablist"] {
      flex-direction: column;
      overflow-x: visible;
      overflow-y: auto;
      border-bottom: none;
      border-right: 1px solid var(--wuik-color-border);
    }

    [role="tab"] {
      appearance: none;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: var(--wuik-space-2) var(--wuik-space-3);
      font: inherit;
      color: var(--wuik-color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
    }

    :host([orientation="vertical"]) [role="tab"] {
      border-bottom: none;
      border-right: 2px solid transparent;
      text-align: left;
      white-space: normal;
      word-break: break-word;
    }

    [role="tab"][aria-selected="true"] {
      color: var(--wuik-color-text);
      border-bottom-color: var(--wuik-color-accent);
      font-weight: var(--wuik-font-weight-medium);
    }

    :host([orientation="vertical"]) [role="tab"][aria-selected="true"] {
      border-bottom-color: transparent;
      border-right-color: var(--wuik-color-accent);
    }

    [role="tab"]:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: -2px;
    }
  </style>
  <div role="tablist"></div>
  <slot></slot>
`;

export class WuikTabsElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["orientation"];
  }

  readonly #tablist: HTMLElement;
  readonly #slot: HTMLSlotElement;
  #panels: WuikTabPanelElement[] = [];
  #tabButtons: HTMLButtonElement[] = [];
  #selectedIndex = 0;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#tablist = shadow.querySelector('[role="tablist"]') as HTMLElement;
    this.#slot = shadow.querySelector("slot") as HTMLSlotElement;
    this.#slot.addEventListener("slotchange", this.#handleSlotChange);
    this.#tablist.addEventListener("keydown", this.#handleKeydown);
    this.#tablist.addEventListener("click", this.#handleClick);
  }

  connectedCallback(): void {
    this.#syncOrientationAria();
    this.#handleSlotChange();
  }

  attributeChangedCallback(): void {
    this.#syncOrientationAria();
  }

  /**
   * Any attribute value other than the literal "vertical" (including
   * omitted or malformed values) resolves to "horizontal" — the same value
   * both the CSS attribute selectors and the keydown handler read, so
   * layout and keyboard behavior can never disagree on a fallback.
   */
  #isVertical(): boolean {
    return this.getAttribute("orientation") === "vertical";
  }

  #syncOrientationAria(): void {
    if (this.#isVertical()) {
      this.#tablist.setAttribute("aria-orientation", "vertical");
    } else {
      this.#tablist.removeAttribute("aria-orientation");
    }
  }

  readonly #handleSlotChange = (): void => {
    const assigned = this.#slot
      .assignedElements()
      .filter(
        (el): el is WuikTabPanelElement =>
          el.tagName.toLowerCase() === "wuik-tab-panel",
      );

    this.#panels = assigned;
    if (this.#selectedIndex >= assigned.length) {
      this.#selectedIndex = Math.max(0, assigned.length - 1);
    }

    this.#tablist.innerHTML = "";
    this.#tabButtons = assigned.map((panel, index) => {
      // Assigned here rather than left to WuikTabPanelElement's own
      // connectedCallback: the tabs host's connectedCallback runs before its
      // children's (custom element reactions fire in tree order, parent
      // first), so a panel's own id may not exist yet at this point.
      if (!panel.id) {
        panel.id = `wuik-tab-panel-${nextPanelId++}`;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.id = `${panel.id}-tab`;
      button.setAttribute("aria-controls", panel.id);
      button.textContent = panel.getAttribute("label") ?? `Tab ${index + 1}`;
      this.#tablist.appendChild(button);
      return button;
    });

    this.#render();
  };

  readonly #handleKeydown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "tab") {
      return;
    }
    const vertical = this.#isVertical();
    switch (keyboardEvent.key) {
      case "ArrowRight":
        if (!vertical) {
          this.#selectIndex(this.#selectedIndex + 1);
          keyboardEvent.preventDefault();
        }
        break;
      case "ArrowLeft":
        if (!vertical) {
          this.#selectIndex(this.#selectedIndex - 1);
          keyboardEvent.preventDefault();
        }
        break;
      case "ArrowDown":
        if (vertical) {
          this.#selectIndex(this.#selectedIndex + 1);
          keyboardEvent.preventDefault();
        }
        break;
      case "ArrowUp":
        if (vertical) {
          this.#selectIndex(this.#selectedIndex - 1);
          keyboardEvent.preventDefault();
        }
        break;
      case "Home":
        this.#selectIndex(0);
        keyboardEvent.preventDefault();
        break;
      case "End":
        this.#selectIndex(this.#panels.length - 1);
        keyboardEvent.preventDefault();
        break;
      default:
        break;
    }
  };

  readonly #handleClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest('[role="tab"]');
    if (!button) {
      return;
    }
    const index = this.#tabButtons.indexOf(button as HTMLButtonElement);
    if (index !== -1) {
      this.#selectIndex(index);
    }
  };

  #selectIndex(rawIndex: number): void {
    const length = this.#panels.length;
    if (length === 0) {
      return;
    }
    const previousIndex = this.#selectedIndex;
    const newIndex = ((rawIndex % length) + length) % length;
    const activeElement =
      this.shadowRoot?.activeElement ?? document.activeElement;
    const shouldFollowFocus =
      activeElement === this.#tabButtons[previousIndex] ||
      (this.#panels[previousIndex]?.contains(activeElement) ?? false);

    this.#selectedIndex = newIndex;
    this.#render();

    if (shouldFollowFocus) {
      this.#tabButtons[newIndex]?.focus();
    }
  }

  #render(): void {
    this.#panels.forEach((panel, index) => {
      const isSelected = index === this.#selectedIndex;
      const button = this.#tabButtons[index];
      button.setAttribute("aria-selected", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
      panel.hidden = !isSelected;
      panel.setAttribute("aria-labelledby", button.id);
    });
  }
}

if (!customElements.get("wuik-tabs")) {
  customElements.define("wuik-tabs", WuikTabsElement);
}
