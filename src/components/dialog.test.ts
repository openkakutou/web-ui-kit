import { afterEach, describe, expect, it, vi } from "vitest";
import "./dialog.ts";

/**
 * jsdom does not implement `HTMLDialogElement.prototype.showModal` at all
 * (confirmed: `typeof dialog.showModal === "undefined"`), so every test here
 * exercises the component's own hand-rolled open/close, focus-trap, Esc and
 * backdrop-click logic — the same logic that runs in a real browser as the
 * actual behavior, with native `showModal()`/`close()` layered on top only
 * as a rendering enhancement. See
 * `.vibe/decisions/019-dialog-manual-behavior-over-native-showmodal.md`.
 */

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountDialog(innerHTML: string): HTMLElement {
  const dialog = document.createElement("wuik-dialog");
  dialog.innerHTML = innerHTML;
  document.body.appendChild(dialog);
  return dialog;
}

function internalDialog(dialog: Element): HTMLDialogElement {
  return dialog.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
}

function closeButton(dialog: Element): HTMLButtonElement {
  return dialog.shadowRoot?.querySelector("button.close") as HTMLButtonElement;
}

const WITH_HEADING_AND_FIELD = `
  <span slot="heading">Preferences</span>
  <input id="field-a" />
  <input id="field-b" />
`;

describe("wuik-dialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens via showModal(), rendering the internal dialog open (nominal)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD);
    (dialog as HTMLDialogElement & { showModal(): void }).showModal();

    expect(dialog.hasAttribute("open")).toBe(true);
    expect(internalDialog(dialog).hasAttribute("open")).toBe(true);
  });

  it("closes via close(), removing the open attribute", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void; close(): void };
    dialog.showModal();

    dialog.close();

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(internalDialog(dialog).hasAttribute("open")).toBe(false);
  });

  it("also opens when the open attribute is set directly (attribute/method equivalence)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD);
    dialog.setAttribute("open", "");
    expect(internalDialog(dialog).hasAttribute("open")).toBe(true);

    dialog.removeAttribute("open");
    expect(internalDialog(dialog).hasAttribute("open")).toBe(false);
  });

  it("carries role=dialog, aria-modal=true, and aria-labelledby pointing at the slotted heading", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD);
    const inner = internalDialog(dialog);
    const heading = dialog.querySelector('[slot="heading"]') as HTMLElement;

    expect(inner.getAttribute("role")).toBe("dialog");
    expect(inner.getAttribute("aria-modal")).toBe("true");
    expect(inner.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.id).not.toBe("");
  });

  it("warns and has no aria-labelledby when no heading is slotted (error/edge case)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dialog = mountDialog("<p>No heading here.</p>");

    expect(internalDialog(dialog).hasAttribute("aria-labelledby")).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("moves focus to the first focusable slotted element on open (nominal)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    const fieldA = dialog.querySelector("#field-a") as HTMLElement;

    dialog.showModal();

    expect(document.activeElement).toBe(fieldA);
  });

  it("focuses the built-in close button when there is no other focusable content (edge case)", () => {
    const dialog = mountDialog(
      '<span slot="heading">Confirm</span><p>Are you sure?</p>',
    ) as HTMLDialogElement & HTMLElement & { showModal(): void };

    dialog.showModal();

    expect(dialog.shadowRoot?.activeElement).toBe(closeButton(dialog));
  });

  it("traps Tab: wraps from the close button (last) back to the first slotted field", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    const fieldA = dialog.querySelector("#field-a") as HTMLElement;
    dialog.showModal();
    closeButton(dialog).focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );

    expect(document.activeElement).toBe(fieldA);
  });

  it("traps Shift+Tab: wraps from the first slotted field to the close button (last)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    const fieldA = dialog.querySelector("#field-a") as HTMLElement;
    dialog.showModal();
    fieldA.focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
      }),
    );

    expect(dialog.shadowRoot?.activeElement).toBe(closeButton(dialog));
  });

  it("closes on Escape and dispatches wuik-close with reason 'escape'", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    dialog.showModal();
    const closeListener = vi.fn();
    dialog.addEventListener("wuik-close", closeListener);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(closeListener).toHaveBeenCalledTimes(1);
    expect(closeListener.mock.calls[0][0].detail).toEqual({
      reason: "escape",
    });
  });

  it("closes when the built-in close button is clicked, with reason 'close-button'", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    dialog.showModal();
    const closeListener = vi.fn();
    dialog.addEventListener("wuik-close", closeListener);

    closeButton(dialog).click();

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(closeListener.mock.calls[0][0].detail).toEqual({
      reason: "close-button",
    });
  });

  it("closes on a genuine backdrop click (mousedown and click both on the backdrop), with reason 'backdrop'", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    dialog.showModal();
    const inner = internalDialog(dialog);
    const closeListener = vi.fn();
    dialog.addEventListener("wuik-close", closeListener);

    inner.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    inner.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(closeListener.mock.calls[0][0].detail).toEqual({
      reason: "backdrop",
    });
  });

  it("does not close when a drag starts inside the content and is released on the backdrop (edge case)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    dialog.showModal();
    const inner = internalDialog(dialog);
    const content = dialog.shadowRoot?.querySelector(".content") as HTMLElement;

    content.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    inner.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("does not close when clicking inside the content itself", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void };
    dialog.showModal();
    const content = dialog.shadowRoot?.querySelector(".content") as HTMLElement;

    content.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    content.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("returns focus to the element that triggered the open, on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void; close(): void };

    dialog.showModal();
    dialog.close();

    expect(document.activeElement).toBe(trigger);
  });

  it("does not throw and leaves focus alone when the trigger was removed before close (error/edge case)", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void; close(): void };
    dialog.showModal();
    trigger.remove();

    expect(() => dialog.close()).not.toThrow();
  });

  it("is a no-op to call showModal() again while already open (does not reset the stored trigger)", () => {
    const triggerA = document.createElement("button");
    const triggerB = document.createElement("button");
    document.body.append(triggerA, triggerB);
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void; close(): void };

    triggerA.focus();
    dialog.showModal();
    triggerB.focus();
    dialog.showModal();
    dialog.close();

    expect(document.activeElement).toBe(triggerA);
  });

  it("is a no-op to call close() while already closed (no duplicate wuik-close event)", () => {
    const dialog = mountDialog(WITH_HEADING_AND_FIELD) as HTMLDialogElement &
      HTMLElement & { showModal(): void; close(): void };
    const closeListener = vi.fn();
    dialog.addEventListener("wuik-close", closeListener);

    expect(() => dialog.close()).not.toThrow();
    expect(closeListener).not.toHaveBeenCalled();
  });

  describe("token-based styling (no consumer CSS required, verified structurally — see decision 006)", () => {
    it("references the surface, border, text and focus-ring tokens", () => {
      const dialog = mountDialog(WITH_HEADING_AND_FIELD);
      const css = hostStyleText(dialog);
      expect(css).toContain("var(--wuik-color-surface)");
      expect(css).toContain("var(--wuik-color-border)");
      expect(css).toContain("var(--wuik-color-text)");
      expect(css).toContain("var(--wuik-color-focus-ring)");
    });

    it("never hardcodes a literal color, so it follows the active theme automatically", () => {
      const dialog = mountDialog(WITH_HEADING_AND_FIELD);
      const css = hostStyleText(dialog);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });
  });
});
