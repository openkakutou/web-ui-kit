/**
 * `<wuik-dialog>` — a modal dialog/popup built on a real `<dialog>` element
 * (backlog item `016`), so a consuming app has a shared way to build a
 * confirmation, a preferences panel, or any overlay surface without
 * reimplementing one from a positioned `<div>`.
 *
 * The `open` reflected attribute is the single source of truth; `showModal()`
 * / `close()` and the `open` property are equivalent ways to set it — a
 * consumer may use either the native-`<dialog>`-shaped method API or a plain
 * attribute toggle. Every acceptance behavior (focus move on open, Tab trap,
 * Esc-to-close, backdrop-click-to-close, focus-restore on close) is the
 * component's own JS, not left to the browser's native `showModal()` — jsdom
 * (this repo's test environment) does not implement `showModal()` at all, so
 * relying on it alone would leave the component's core contract unverified
 * by the test suite. Native `showModal()`/`close()` are still called when
 * available, purely as a rendering enhancement (real `::backdrop` paint and
 * top-layer stacking in an actual browser) — see
 * `.vibe/decisions/019-dialog-manual-behavior-over-native-showmodal.md`.
 *
 * The built-in close button is last in DOM/tab order (so a dialog's real
 * content is reached before it), visually pinned to its conventional
 * top-right spot via absolute positioning within `.content`.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";

type CloseReason = "escape" | "backdrop" | "close-button" | "api";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

let nextHeadingId = 0;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      line-height: var(--wuik-line-height-base);
    }

    dialog {
      background: var(--wuik-color-surface);
      color: var(--wuik-color-text);
      border: 1px solid var(--wuik-color-border);
      padding: 0;
      box-sizing: border-box;
    }

    dialog::backdrop {
      background: color-mix(in srgb, var(--wuik-color-text) 50%, transparent);
    }

    .content {
      position: relative;
      padding: var(--wuik-space-4);
    }

    .header {
      padding-right: var(--wuik-space-7);
      margin-bottom: var(--wuik-space-3);
      font-weight: var(--wuik-font-weight-medium);
    }

    .body {
      max-height: 70vh;
      overflow-y: auto;
    }

    .close {
      position: absolute;
      top: var(--wuik-space-2);
      right: var(--wuik-space-2);
      min-width: var(--wuik-space-7);
      min-height: var(--wuik-space-7);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--wuik-space-1);
      color: var(--wuik-color-text-secondary);
      font: inherit;
      font-size: var(--wuik-font-size-lg);
      line-height: 1;
      cursor: pointer;
      box-sizing: border-box;
    }

    .close:hover {
      background: var(--wuik-color-border);
    }

    .close:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }
  </style>
  <dialog>
    <div class="content">
      <div class="header">
        <slot name="heading"></slot>
      </div>
      <div class="body">
        <slot></slot>
      </div>
      <button type="button" class="close"><span aria-hidden="true">&times;</span></button>
    </div>
  </dialog>
`;

export class WuikDialogElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["open"];
  }

  readonly #dialog: HTMLDialogElement;
  readonly #headingSlot: HTMLSlotElement;
  readonly #closeButton: HTMLButtonElement;
  #unsubscribeLocaleChange: (() => void) | undefined;

  #isOpen = false;
  #triggerElement: HTMLElement | null = null;
  #pendingCloseReason: CloseReason = "api";
  #backdropMouseDown = false;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#dialog = shadow.querySelector("dialog") as HTMLDialogElement;
    this.#headingSlot = shadow.querySelector(
      'slot[name="heading"]',
    ) as HTMLSlotElement;
    this.#closeButton = shadow.querySelector(
      "button.close",
    ) as HTMLButtonElement;

    this.#dialog.setAttribute("role", "dialog");
    this.#dialog.setAttribute("aria-modal", "true");

    this.#headingSlot.addEventListener("slotchange", () =>
      this.#syncLabelledBy(),
    );
    this.#closeButton.addEventListener("click", () =>
      this.#closeInternal("close-button"),
    );
    this.#dialog.addEventListener("mousedown", this.#handleBackdropMouseDown);
    this.#dialog.addEventListener("click", this.#handleBackdropClick);
  }

  connectedCallback(): void {
    this.#syncLabelledBy();
    this.#syncCloseLabel();
    this.#unsubscribeLocaleChange = onLocaleChange(() =>
      this.#syncCloseLabel(),
    );
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
    if (this.#isOpen) {
      document.removeEventListener("keydown", this.#handleKeydown, true);
    }
  }

  attributeChangedCallback(name: string): void {
    if (name !== "open") {
      return;
    }
    if (this.hasAttribute("open")) {
      this.#handleOpenRequested();
    } else {
      this.#handleCloseRequested();
    }
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    if (value) {
      this.showModal();
    } else {
      this.close();
    }
  }

  showModal(): void {
    this.setAttribute("open", "");
  }

  close(): void {
    this.#closeInternal("api");
  }

  #closeInternal(reason: CloseReason): void {
    if (!this.#isOpen) {
      return;
    }
    this.#pendingCloseReason = reason;
    this.removeAttribute("open");
  }

  #handleOpenRequested(): void {
    if (this.#isOpen) {
      return;
    }
    this.#isOpen = true;
    this.#triggerElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (typeof this.#dialog.showModal === "function") {
      try {
        this.#dialog.showModal();
      } catch {
        this.#dialog.setAttribute("open", "");
      }
    } else {
      this.#dialog.setAttribute("open", "");
    }

    document.addEventListener("keydown", this.#handleKeydown, true);
    this.#focusFirst();
  }

  #handleCloseRequested(): void {
    if (!this.#isOpen) {
      return;
    }
    this.#isOpen = false;
    document.removeEventListener("keydown", this.#handleKeydown, true);

    if (typeof this.#dialog.close === "function") {
      try {
        this.#dialog.close();
      } catch {
        this.#dialog.removeAttribute("open");
      }
    } else {
      this.#dialog.removeAttribute("open");
    }

    const trigger = this.#triggerElement;
    this.#triggerElement = null;
    if (trigger?.isConnected) {
      trigger.focus();
    }

    const reason = this.#pendingCloseReason;
    this.#pendingCloseReason = "api";
    this.dispatchEvent(
      new CustomEvent("wuik-close", {
        detail: { reason },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #getFocusableElements(): HTMLElement[] {
    const slotted = Array.from(
      this.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hidden);
    return [...slotted, this.#closeButton];
  }

  #focusFirst(): void {
    const [first] = this.#getFocusableElements();
    first?.focus();
  }

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (!this.#isOpen) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.#closeInternal("escape");
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusables = this.#getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    event.preventDefault();

    const current = this.shadowRoot?.activeElement ?? document.activeElement;
    const currentIndex = focusables.indexOf(current as HTMLElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : focusables.length - 1
        : (currentIndex + direction + focusables.length) % focusables.length;
    focusables[nextIndex]?.focus();
  };

  readonly #handleBackdropMouseDown = (event: Event): void => {
    this.#backdropMouseDown = event.target === this.#dialog;
  };

  readonly #handleBackdropClick = (event: Event): void => {
    const isBackdropClick =
      this.#backdropMouseDown && event.target === this.#dialog;
    this.#backdropMouseDown = false;
    if (isBackdropClick) {
      this.#closeInternal("backdrop");
    }
  };

  #syncLabelledBy(): void {
    const [heading] = this.#headingSlot.assignedElements();
    if (!heading) {
      this.#dialog.removeAttribute("aria-labelledby");
      console.warn(
        '<wuik-dialog>: no heading slotted — add a `slot="heading"` element so the dialog has an accessible name.',
      );
      return;
    }
    if (!heading.id) {
      heading.id = `wuik-dialog-heading-${nextHeadingId++}`;
    }
    this.#dialog.setAttribute("aria-labelledby", heading.id);
  }

  #syncCloseLabel(): void {
    this.#closeButton.setAttribute("aria-label", t("dialog.close", "Close"));
  }
}

if (!customElements.get("wuik-dialog")) {
  customElements.define("wuik-dialog", WuikDialogElement);
}
