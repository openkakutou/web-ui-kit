/**
 * `<wuik-section-header heading="…" description="…">` — the card that opens
 * each section of an editor: a heading, one sentence of help, optional
 * contextual help and the section's main action.
 *
 * The heading is a `role="heading"` element (`level` 1–6, default 1) that is
 * programmatically focusable (`tabindex="-1"`): after navigating to a
 * section, call `focusHeading()` so keyboard and screen-reader users land at
 * its start. Slots: `help` (a `<wuik-help-hint>` beside the heading),
 * `actions` (buttons, right-aligned and wrapping), default (replaces the
 * `description` text).
 */

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      line-height: var(--wuik-line-height-base);
      color: var(--wuik-color-text);
    }

    .card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--wuik-space-4);
      flex-wrap: wrap;
      padding: var(--wuik-space-4) var(--wuik-space-5);
      background: var(--wuik-color-surface);
      border: var(--wuik-border-width) solid var(--wuik-color-border);
      border-radius: var(--wuik-radius-card);
      box-shadow: var(--wuik-shadow-card);
      box-sizing: border-box;
    }

    .text {
      flex: 1 1 18rem;
      min-width: 0;
    }

    .title {
      display: flex;
      align-items: center;
      gap: var(--wuik-space-2);
    }

    .heading {
      font-size: var(--wuik-font-size-lg);
      font-weight: var(--wuik-font-weight-bold);
      line-height: var(--wuik-line-height-tight);
      outline: none;
    }

    .heading:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: var(--wuik-focus-ring-offset);
      border-radius: var(--wuik-radius-control);
    }

    .description {
      margin-top: var(--wuik-space-1);
      max-width: 60ch;
      color: var(--wuik-color-text-muted);
    }

    .actions {
      display: flex;
      gap: var(--wuik-space-2);
      flex-wrap: wrap;
      align-items: center;
    }
  </style>
  <div class="card">
    <div class="text">
      <div class="title">
        <div class="heading" role="heading" aria-level="1" tabindex="-1"></div>
        <slot name="help"></slot>
      </div>
      <div class="description"><span class="desc-text"></span><slot></slot></div>
    </div>
    <div class="actions"><slot name="actions"></slot></div>
  </div>
`;

export class WuikSectionHeaderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["heading", "description", "level"];
  }

  readonly #heading: HTMLElement;
  readonly #description: HTMLElement;
  readonly #descriptionText: HTMLElement;
  readonly #defaultSlot: HTMLSlotElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#heading = shadow.querySelector(".heading") as HTMLElement;
    this.#description = shadow.querySelector(".description") as HTMLElement;
    this.#descriptionText = shadow.querySelector(".desc-text") as HTMLElement;
    this.#defaultSlot = shadow.querySelector(
      ".description slot",
    ) as HTMLSlotElement;
    this.#defaultSlot.addEventListener("slotchange", () => this.#render());
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  /** Moves focus to the heading (programmatic only, never in the tab order). */
  focusHeading(): void {
    this.#heading.focus();
  }

  #render(): void {
    this.#heading.textContent = this.getAttribute("heading") ?? "";
    const level = Number(this.getAttribute("level"));
    this.#heading.setAttribute(
      "aria-level",
      String(Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1),
    );
    const hasSlotted = this.#defaultSlot.assignedNodes().length > 0;
    // Slotted content always wins over the attribute text.
    const text = hasSlotted ? "" : (this.getAttribute("description") ?? "");
    this.#descriptionText.textContent = text;
    this.#description.hidden = !hasSlotted && text === "";
  }
}

if (!customElements.get("wuik-section-header")) {
  customElements.define("wuik-section-header", WuikSectionHeaderElement);
}
