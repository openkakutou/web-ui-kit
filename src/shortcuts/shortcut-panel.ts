/**
 * `<wuik-shortcuts-panel>` — a shared, in-page (not modal — no dialog
 * primitive exists yet in this kit) panel listing every action registered
 * on a `ShortcutManager` and letting the user rebind each one.
 *
 * Takes its manager through a JS property (`panel.manager = ...`), not an
 * attribute — a `ShortcutManager` instance cannot be serialized into one.
 * See `.vibe/decisions/012-shortcut-conflict-resolution-and-panel-contract.md`.
 */

import { onLocaleChange, t } from "../i18n/i18n.ts";
import { isReservedCombo, normalizeKeyCombo } from "./shortcut-key.ts";
import type { ShortcutManager } from "./shortcut-manager.ts";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
    }

    .rows {
      display: flex;
      flex-direction: column;
      gap: var(--wuik-space-2);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--wuik-space-3);
      padding: var(--wuik-space-2) var(--wuik-space-3);
      border: 1px solid var(--wuik-color-border);
      border-radius: 4px;
    }

    .label {
      flex: 1 1 auto;
    }

    .key {
      font-family: var(--wuik-font-family-mono);
      color: var(--wuik-color-text-secondary);
      background: var(--wuik-color-surface);
      padding: var(--wuik-space-1) var(--wuik-space-2);
      border-radius: 4px;
    }

    button {
      appearance: none;
      border: 1px solid var(--wuik-color-border);
      background: var(--wuik-color-surface);
      color: var(--wuik-color-text);
      font: inherit;
      padding: var(--wuik-space-1) var(--wuik-space-2);
      border-radius: 4px;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }

    .row.is-listening .rebind {
      border-color: var(--wuik-color-accent);
      color: var(--wuik-color-accent);
    }

    .conflict-actions {
      display: flex;
      gap: var(--wuik-space-1);
    }

    .status {
      margin-top: var(--wuik-space-2);
      color: var(--wuik-color-text-secondary);
      font-size: var(--wuik-font-size-sm);
      min-height: 1.2em;
    }
  </style>
  <div class="rows"></div>
  <div class="status" role="status"></div>
`;

interface PendingConflict {
  actionId: string;
  key: string;
  conflictWith: string;
}

export class WuikShortcutsPanelElement extends HTMLElement {
  readonly #rows: HTMLElement;
  readonly #status: HTMLElement;
  #manager: ShortcutManager | undefined;
  #listeningActionId: string | null = null;
  #pendingConflict: PendingConflict | null = null;
  readonly #handleManagerChange = (): void => {
    this.#renderRowsIfIdle();
  };

  // Same "ignore while mid-interaction" reasoning as #handleManagerChange —
  // a locale switch mid-rebind-capture must not rebuild the row DOM out
  // from under the button that currently holds focus/listeners.
  readonly #handleLocaleChange = (): void => {
    this.#renderRowsIfIdle();
  };

  #unsubscribeLocaleChange: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#rows = shadow.querySelector(".rows") as HTMLElement;
    this.#status = shadow.querySelector(".status") as HTMLElement;
  }

  connectedCallback(): void {
    this.#unsubscribeLocaleChange = onLocaleChange(this.#handleLocaleChange);
  }

  disconnectedCallback(): void {
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = undefined;
  }

  get manager(): ShortcutManager | undefined {
    return this.#manager;
  }

  set manager(next: ShortcutManager | undefined) {
    this.#manager?.removeEventListener("change", this.#handleManagerChange);
    this.#manager = next;
    this.#manager?.addEventListener("change", this.#handleManagerChange);
    this.#listeningActionId = null;
    this.#pendingConflict = null;
    this.#status.textContent = "";
    this.#renderRows();
  }

  #renderRowsIfIdle(): void {
    // Ignore external changes while the user is mid-interaction here —
    // the next definitive local action re-reads fresh state anyway.
    if (this.#listeningActionId === null && this.#pendingConflict === null) {
      this.#renderRows();
    }
  }

  #renderRows(): void {
    this.#rows.innerHTML = "";
    if (this.#manager === undefined) {
      return;
    }

    for (const binding of this.#manager.list()) {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.actionId = binding.id;

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = binding.label;

      const key = document.createElement("span");
      key.className = "key";
      key.textContent = binding.key;

      const rebindButton = document.createElement("button");
      rebindButton.type = "button";
      rebindButton.className = "rebind";
      rebindButton.textContent = t("shortcuts.rebind", "Rebind");
      rebindButton.setAttribute(
        "aria-label",
        t("shortcuts.rebindAriaLabel", "Rebind {{label}}", {
          label: binding.label,
        }),
      );
      rebindButton.addEventListener("click", () =>
        this.#startListening(binding.id, binding.label),
      );

      let resetButton: HTMLButtonElement | null = null;
      if (!binding.isDefault) {
        resetButton = document.createElement("button");
        resetButton.type = "button";
        resetButton.className = "reset";
        resetButton.textContent = t("shortcuts.reset", "Reset");
        resetButton.setAttribute(
          "aria-label",
          t("shortcuts.resetAriaLabel", "Reset {{label}} to default", {
            label: binding.label,
          }),
        );
        resetButton.addEventListener("click", () =>
          this.#resetToDefault(binding.id, binding.label),
        );
      }

      const conflictActions = document.createElement("span");
      conflictActions.className = "conflict-actions";
      const isPendingHere = this.#pendingConflict?.actionId === binding.id;
      conflictActions.hidden = !isPendingHere;

      const swapButton = document.createElement("button");
      swapButton.type = "button";
      swapButton.className = "swap";
      swapButton.textContent = t("shortcuts.swap", "Swap");
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "cancel-conflict";
      cancelButton.textContent = t("shortcuts.cancel", "Cancel");

      if (isPendingHere && this.#pendingConflict) {
        const pending = this.#pendingConflict;
        const conflictLabel =
          this.#labelFor(pending.conflictWith) ?? pending.conflictWith;
        swapButton.setAttribute(
          "aria-label",
          t(
            "shortcuts.swapAriaLabel",
            "Swap keys between {{label}} and {{otherLabel}}",
            { label: binding.label, otherLabel: conflictLabel },
          ),
        );
        cancelButton.setAttribute(
          "aria-label",
          t("shortcuts.cancelAriaLabel", "Cancel rebinding {{label}}", {
            label: binding.label,
          }),
        );
        swapButton.addEventListener("click", () => this.#confirmSwap(pending));
        cancelButton.addEventListener("click", () => this.#cancelConflict());
      }

      conflictActions.append(swapButton, cancelButton);
      row.append(label, key, rebindButton);
      if (resetButton !== null) {
        row.append(resetButton);
      }
      row.append(conflictActions);
      this.#rows.appendChild(row);
    }
  }

  #startListening(actionId: string, label: string): void {
    if (this.#manager === undefined) {
      return;
    }
    // Clicking Rebind on another row while one is already listening/pending
    // cancels the previous attempt first — only one capture at a time.
    this.#cancelListening();
    this.#cancelConflict();

    this.#listeningActionId = actionId;
    const button = this.#rebindButtonFor(actionId);
    if (button === null) {
      return;
    }
    button.classList.add("is-listening");
    button.closest(".row")?.classList.add("is-listening");
    button.textContent = t("shortcuts.pressAKey", "Press a key…");
    button.focus();
    button.addEventListener("keydown", this.#handleListeningKeydown);
    button.addEventListener("focusout", this.#handleListeningFocusOut);
    this.#status.textContent = t(
      "shortcuts.listeningStatus",
      "Listening for a key for {{label}}… press Escape to cancel.",
      { label },
    );
  }

  readonly #handleListeningKeydown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const actionId = this.#listeningActionId;
    if (this.#manager === undefined || actionId === null) {
      return;
    }
    keyboardEvent.preventDefault();

    if (keyboardEvent.key === "Escape") {
      this.#cancelListening();
      return;
    }

    const combo = normalizeKeyCombo(keyboardEvent);
    const label = this.#labelFor(actionId);

    if (combo === undefined) {
      this.#status.textContent = t(
        "shortcuts.invalidKeyStatus",
        "{{key}} is not a valid shortcut on its own — press another key.",
        { key: keyboardEvent.key },
      );
      return;
    }
    if (isReservedCombo(combo)) {
      this.#status.textContent = t(
        "shortcuts.reservedKeyStatus",
        "{{combo}} is reserved by the browser — choose another key.",
        { combo },
      );
      return;
    }

    const result = this.#manager.rebind(actionId, combo);
    this.#stopListening();

    if (result.ok) {
      this.#status.textContent = t(
        "shortcuts.boundStatus",
        "{{label}} bound to {{combo}}.",
        { label: label ?? "", combo },
      );
      this.#renderRows();
      return;
    }
    if (result.reason === "conflict") {
      const conflictLabel =
        this.#labelFor(result.conflictWith) ?? result.conflictWith;
      this.#pendingConflict = {
        actionId,
        key: combo,
        conflictWith: result.conflictWith,
      };
      this.#status.textContent = t(
        "shortcuts.conflictStatus",
        "{{combo}} is already used by {{conflictLabel}}. Swap the two keys, or cancel.",
        { combo, conflictLabel },
      );
      this.#renderRows();
    }
  };

  readonly #handleListeningFocusOut = (event: Event): void => {
    const focusEvent = event as FocusEvent;
    const actionId = this.#listeningActionId;
    if (actionId === null) {
      return;
    }
    const row = this.#rebindButtonFor(actionId)?.closest(".row");
    const related = focusEvent.relatedTarget as Node | null;
    if (related !== null && row?.contains(related)) {
      return;
    }
    this.#cancelListening();
  };

  #cancelListening(): void {
    if (this.#listeningActionId === null) {
      return;
    }
    this.#stopListening();
    this.#status.textContent = "";
  }

  #stopListening(): void {
    const actionId = this.#listeningActionId;
    if (actionId === null) {
      return;
    }
    const button = this.#rebindButtonFor(actionId);
    button?.removeEventListener("keydown", this.#handleListeningKeydown);
    button?.removeEventListener("focusout", this.#handleListeningFocusOut);
    button?.classList.remove("is-listening");
    button?.closest(".row")?.classList.remove("is-listening");
    if (button !== null) {
      button.textContent = "Rebind";
    }
    this.#listeningActionId = null;
  }

  #confirmSwap(pending: PendingConflict): void {
    if (this.#manager === undefined) {
      return;
    }
    const result = this.#manager.rebind(pending.actionId, pending.key, {
      swap: true,
    });
    const label = this.#labelFor(pending.actionId);
    const otherLabel = this.#labelFor(pending.conflictWith);
    this.#pendingConflict = null;
    if (result.ok) {
      this.#status.textContent = t(
        "shortcuts.swappedStatus",
        "{{label}} and {{otherLabel}} swapped keys.",
        { label: label ?? "", otherLabel: otherLabel ?? "" },
      );
    }
    this.#renderRows();
  }

  #cancelConflict(): void {
    if (this.#pendingConflict === null) {
      return;
    }
    this.#pendingConflict = null;
    this.#status.textContent = "";
    this.#renderRows();
  }

  #resetToDefault(actionId: string, label: string): void {
    if (this.#manager === undefined) {
      return;
    }
    const result = this.#manager.resetToDefault(actionId);
    if (result.ok) {
      this.#status.textContent = t(
        "shortcuts.resetStatus",
        "{{label}} reset to its default key.",
        { label },
      );
      this.#renderRows();
    } else if (result.reason === "conflict") {
      const conflictLabel =
        this.#labelFor(result.conflictWith) ?? result.conflictWith;
      this.#pendingConflict = {
        actionId,
        key: this.#manager.list().find((b) => b.id === actionId)?.key ?? "",
        conflictWith: result.conflictWith,
      };
      this.#status.textContent = t(
        "shortcuts.resetConflictStatus",
        "Can't reset {{label}}: its default key is used by {{conflictLabel}}. Swap, or cancel.",
        { label, conflictLabel },
      );
      this.#renderRows();
    }
  }

  #rebindButtonFor(actionId: string): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector(
      `[data-action-id="${actionId}"] .rebind`,
    ) as HTMLButtonElement | null;
  }

  #labelFor(actionId: string): string | undefined {
    return this.#manager?.list().find((b) => b.id === actionId)?.label;
  }
}

if (!customElements.get("wuik-shortcuts-panel")) {
  customElements.define("wuik-shortcuts-panel", WuikShortcutsPanelElement);
}
