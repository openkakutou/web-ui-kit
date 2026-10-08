/**
 * `<wuik-file-drop-zone>` — a standalone drag-and-drop + click-to-browse
 * file input area. Usable on its own, with no dependency on the layout
 * shell or any other component (backlog item 003).
 *
 * Keyboard-operable first: the zone itself is a real interactive element
 * (`role="button"`, `tabindex="0"`) so Enter/Space opens the native file
 * picker with no mouse or drag involved. Drag-and-drop is a layered
 * addition on top of that, never the only path in. See
 * `.vibe/decisions/007-form-input-components-shared-conventions.md`.
 *
 * Files that don't match `accept` are rejected rather than silently
 * dropped: the zone shows a visible rejected state and an `aria-live`
 * status message, and only accepted files (if any) are emitted via
 * `wuik-files-selected`. A new selection/drop always replaces the
 * previous one, matching native `<input type="file">` semantics.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";
import { matchesAccept } from "./file-drop-zone-accept.ts";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--wuik-space-2);
      padding: var(--wuik-space-6);
      background: var(--wuik-color-surface);
      border: var(--wuik-border-width-strong) dashed var(--wuik-color-border-control);
      border-radius: var(--wuik-radius-card);
      transition: border-color var(--wuik-motion-fast) var(--wuik-motion-ease),
        background var(--wuik-motion-fast) var(--wuik-motion-ease);
      box-sizing: border-box;
      text-align: center;
      cursor: pointer;
    }

    .zone:focus-visible {
      outline: var(--wuik-focus-ring-width) solid var(--wuik-color-focus);
      outline-offset: calc(-1 * var(--wuik-focus-ring-width));
    }

    .zone.is-dragover {
      border-color: var(--wuik-color-primary);
      background: color-mix(in srgb, var(--wuik-color-primary) 8%, var(--wuik-color-bg));
    }

    .zone.is-accepted {
      border-color: var(--wuik-color-success);
      background: color-mix(in srgb, var(--wuik-color-success) 8%, var(--wuik-color-bg));
    }

    .zone.is-rejected {
      border-color: var(--wuik-color-error);
      background: color-mix(in srgb, var(--wuik-color-error) 8%, var(--wuik-color-bg));
    }

    .zone.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .prompt {
      color: var(--wuik-color-text-muted);
    }

    .status {
      min-height: 1.2em;
    }

    input[type="file"] {
      display: none;
    }
  </style>
  <div class="zone" role="button" tabindex="0">
    <span class="prompt"><slot><span class="default-prompt"></span></slot></span>
    <span class="status" role="status" aria-live="polite"></span>
  </div>
  <input type="file" tabindex="-1" />
`;

export class WuikFileDropZoneElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled"];
  }

  readonly #zone: HTMLElement;
  readonly #status: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #defaultPrompt: HTMLElement;
  #unsubscribeLocaleChange: (() => void) | undefined;
  #lastResult: { accepted: string[]; rejected: string[] } | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#zone = shadow.querySelector(".zone") as HTMLElement;
    this.#status = shadow.querySelector(".status") as HTMLElement;
    this.#input = shadow.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    this.#defaultPrompt = shadow.querySelector(
      ".default-prompt",
    ) as HTMLElement;

    this.#zone.addEventListener("click", this.#handleOpen);
    this.#zone.addEventListener("keydown", this.#handleKeydown);
    this.#zone.addEventListener("dragenter", this.#handleDragEnter);
    this.#zone.addEventListener("dragover", this.#handleDragOver);
    this.#zone.addEventListener("dragleave", this.#handleDragLeave);
    this.#zone.addEventListener("drop", this.#handleDrop);
    this.#input.addEventListener("change", this.#handleInputChange);
  }

  connectedCallback(): void {
    this.#renderStatic();
    this.#unsubscribeLocaleChange = onLocaleChange(() => this.#renderStatic());
    this.#syncDisabled();
    if (this.hasAttribute("multiple")) {
      this.#input.setAttribute("multiple", "");
    }
    if (this.hasAttribute("accept")) {
      this.#input.setAttribute("accept", this.getAttribute("accept") ?? "");
    }
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  /** Re-resolves every localized string without touching the selection state. */
  #renderStatic(): void {
    this.#defaultPrompt.textContent = t(
      "fileDropZone.prompt",
      "Drag and drop files here, or click to browse",
    );
    this.#renderStatus();
  }

  #renderStatus(): void {
    const result = this.#lastResult;
    if (!result) {
      this.#status.textContent = "";
      return;
    }
    const parts: string[] = [];
    if (result.rejected.length > 0) {
      parts.push(
        t("fileDropZone.rejected", "Rejected, type not accepted: {{names}}", {
          names: result.rejected.join(", "),
        }),
      );
    }
    if (result.accepted.length > 0) {
      parts.push(
        t("fileDropZone.selected", "Selected: {{names}}", {
          names: result.accepted.join(", "),
        }),
      );
    }
    this.#status.textContent = parts.join(" ");
  }

  attributeChangedCallback(name: string): void {
    if (name === "disabled") {
      this.#syncDisabled();
    }
  }

  #syncDisabled(): void {
    const disabled = this.hasAttribute("disabled");
    this.#zone.classList.toggle("is-disabled", disabled);
    this.#zone.setAttribute("tabindex", disabled ? "-1" : "0");
    this.#zone.setAttribute("aria-disabled", String(disabled));
    this.#input.disabled = disabled;
  }

  readonly #handleOpen = (): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    this.#input.click();
  };

  readonly #handleKeydown = (event: Event): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      this.#input.click();
    }
  };

  readonly #handleDragEnter = (event: Event): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    event.preventDefault();
    this.#zone.classList.add("is-dragover");
  };

  readonly #handleDragOver = (event: Event): void => {
    if (this.hasAttribute("disabled")) {
      return;
    }
    event.preventDefault();
  };

  readonly #handleDragLeave = (): void => {
    this.#zone.classList.remove("is-dragover");
  };

  readonly #handleDrop = (event: Event): void => {
    this.#zone.classList.remove("is-dragover");
    if (this.hasAttribute("disabled")) {
      return;
    }
    event.preventDefault();
    const dataTransfer = (event as DragEvent).dataTransfer as {
      files?: ArrayLike<File>;
    } | null;
    this.#processFiles(
      dataTransfer?.files ? Array.from(dataTransfer.files) : [],
    );
  };

  readonly #handleInputChange = (): void => {
    this.#processFiles(this.#input.files ? Array.from(this.#input.files) : []);
  };

  #processFiles(files: File[]): void {
    this.#zone.classList.remove("is-accepted", "is-rejected");
    if (files.length === 0) {
      this.#lastResult = undefined;
      this.#renderStatus();
      return;
    }

    const accept = this.getAttribute("accept");
    const accepted: File[] = [];
    const rejected: File[] = [];
    for (const file of files) {
      (matchesAccept(file, accept) ? accepted : rejected).push(file);
    }

    const finalAccepted = this.hasAttribute("multiple")
      ? accepted
      : accepted.slice(0, 1);

    if (rejected.length > 0) {
      this.#zone.classList.add("is-rejected");
    }
    this.#lastResult = {
      accepted: finalAccepted.map((file) => file.name),
      rejected: rejected.map((file) => file.name),
    };
    this.#renderStatus();

    if (finalAccepted.length > 0) {
      this.#zone.classList.add("is-accepted");
      this.dispatchEvent(
        new CustomEvent("wuik-files-selected", {
          detail: { files: finalAccepted },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

if (!customElements.get("wuik-file-drop-zone")) {
  customElements.define("wuik-file-drop-zone", WuikFileDropZoneElement);
}
