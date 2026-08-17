import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initI18n } from "../i18n/i18n.ts";
import { ShortcutManager } from "./shortcut-manager.ts";
import { WuikShortcutsPanelElement } from "./shortcut-panel.ts";

function makeMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
}

function mountPanel(): WuikShortcutsPanelElement {
  // Constructed directly rather than via document.createElement — this
  // project's Vitest+jsdom+esbuild combination loses access to a custom
  // element's own methods when built via document.createElement for a
  // class imported from a separate module. See docs/testing.md.
  const panel = new WuikShortcutsPanelElement();
  document.body.appendChild(panel);
  return panel;
}

function press(
  target: EventTarget,
  init: Partial<KeyboardEvent> & { key: string },
) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      composed: true,
      cancelable: true,
      ...init,
    }),
  );
}

describe("WuikShortcutsPanelElement", () => {
  let manager: ShortcutManager;
  let panel: WuikShortcutsPanelElement;

  beforeEach(() => {
    manager = new ShortcutManager({ storage: makeMemoryStorage() });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    manager.register({ id: "export", label: "Export", defaultKey: "Ctrl+E" });
    panel = mountPanel();
    panel.manager = manager;
  });

  afterEach(() => {
    panel.remove();
  });

  function rebindButton(actionId: string): HTMLButtonElement {
    return panel.shadowRoot?.querySelector(
      `[data-action-id="${actionId}"] .rebind`,
    ) as HTMLButtonElement;
  }

  function resetButton(actionId: string): HTMLButtonElement | null {
    return panel.shadowRoot?.querySelector(
      `[data-action-id="${actionId}"] .reset`,
    ) as HTMLButtonElement | null;
  }

  function keyCell(actionId: string): HTMLElement {
    return panel.shadowRoot?.querySelector(
      `[data-action-id="${actionId}"] .key`,
    ) as HTMLElement;
  }

  function status(): HTMLElement {
    return panel.shadowRoot?.querySelector(".status") as HTMLElement;
  }

  it("renders one row per registered action with its label and current key", () => {
    expect(keyCell("save").textContent).toBe("Ctrl+S");
    expect(keyCell("export").textContent).toBe("Ctrl+E");
    expect(
      panel.shadowRoot?.querySelector('[data-action-id="save"] .label')
        ?.textContent,
    ).toBe("Save");
  });

  it("does not show a reset control for an action still on its default key", () => {
    expect(resetButton("save")).toBeNull();
  });

  it("rebinds an action: click Rebind, press a free key, binding updates", () => {
    rebindButton("save").click();

    press(rebindButton("save"), { key: "s", ctrlKey: true, shiftKey: true });

    expect(keyCell("save").textContent).toBe("Ctrl+Shift+S");
    expect(manager.getBinding("save")).toBe("Ctrl+Shift+S");
  });

  it("shows a reset control once an action differs from its default", () => {
    rebindButton("save").click();
    press(rebindButton("save"), { key: "s", ctrlKey: true, shiftKey: true });

    expect(resetButton("save")).not.toBeNull();
  });

  it("reset restores the default key and hides the reset control again", () => {
    rebindButton("save").click();
    press(rebindButton("save"), { key: "s", ctrlKey: true, shiftKey: true });

    resetButton("save")?.click();

    expect(keyCell("save").textContent).toBe("Ctrl+S");
    expect(resetButton("save")).toBeNull();
  });

  it("pressing Escape while listening cancels without changing the binding", () => {
    rebindButton("save").click();

    press(rebindButton("save"), { key: "Escape" });

    expect(keyCell("save").textContent).toBe("Ctrl+S");
    expect(manager.getBinding("save")).toBe("Ctrl+S");
  });

  it("a modifier pressed alone is rejected and stays in listening state", () => {
    rebindButton("save").click();

    press(rebindButton("save"), { key: "Shift", shiftKey: true });

    expect(status().textContent).toMatch(/not a valid shortcut/i);
    // Still listening: a real key right after is still captured.
    press(rebindButton("save"), { key: "s", ctrlKey: true, shiftKey: true });
    expect(keyCell("save").textContent).toBe("Ctrl+Shift+S");
  });

  it("a browser-reserved combo is rejected with an explicit message", () => {
    rebindButton("save").click();

    press(rebindButton("save"), { key: "w", ctrlKey: true });

    expect(status().textContent).toMatch(/reserved/i);
    expect(manager.getBinding("save")).toBe("Ctrl+S");
  });

  it("a conflicting key shows the other action's label and does not change either binding", () => {
    rebindButton("save").click();

    press(rebindButton("save"), { key: "e", ctrlKey: true });

    expect(status().textContent).toMatch(/Export/);
    expect(manager.getBinding("save")).toBe("Ctrl+S");
    expect(manager.getBinding("export")).toBe("Ctrl+E");
  });

  it("swapping from the conflict prompt trades the two bindings", () => {
    rebindButton("save").click();
    press(rebindButton("save"), { key: "e", ctrlKey: true });

    (
      panel.shadowRoot?.querySelector(
        '[data-action-id="save"] .swap',
      ) as HTMLButtonElement
    ).click();

    expect(keyCell("save").textContent).toBe("Ctrl+E");
    expect(keyCell("export").textContent).toBe("Ctrl+S");
  });

  it("blur (focus leaving the row) cancels listening like Escape", () => {
    rebindButton("save").click();

    rebindButton("save").dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, composed: true }),
    );

    expect(status().textContent).toBe("");
    // A stray keypress elsewhere no longer gets captured as a rebind.
    press(document.body, { key: "z" });
    expect(manager.getBinding("save")).toBe("Ctrl+S");
  });
});

// Appended after every English-hardcoded-text test above, and each test
// below calls initI18n itself before asserting — the i18n module's
// module-scoped active-instance singleton (see i18n.test.ts) is therefore
// always overwritten by the calling test before it matters, with no
// cross-test leakage risk. (Unlike i18n.test.ts / locale-switcher.test.ts,
// this file cannot use vi.resetModules() for isolation: a fresh module
// graph would re-evaluate shortcut-panel.ts's own top-level
// customElements.define call against a class object no longer identical to
// the one already registered under that tag name — jsdom's custom element
// registry is a real DOM API, not part of the JS module cache, so it isn't
// reset alongside it.)
describe("WuikShortcutsPanelElement — localization", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders its own strings in the active locale, and updates them live on a locale switch", async () => {
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");

    const manager = new ShortcutManager({ storage: makeMemoryStorage() });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    const panel = new WuikShortcutsPanelElement();
    document.body.appendChild(panel);
    panel.manager = manager;

    const rebindButton = () =>
      panel.shadowRoot?.querySelector(
        '[data-action-id="save"] .rebind',
      ) as HTMLButtonElement;

    expect(rebindButton().textContent).toBe("Rebind");

    await instance.changeLanguage("fr");

    expect(rebindButton().textContent).toBe("Réassigner");

    panel.remove();
  });

  it("does not rebuild a row mid-rebind-capture when the locale changes, so focus/listening state survives", async () => {
    const instance = await initI18n({
      namespace: "demo-app",
      resources: { en: {}, fr: {} },
    });
    await instance.changeLanguage("en");

    const manager = new ShortcutManager({ storage: makeMemoryStorage() });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    const panel = new WuikShortcutsPanelElement();
    document.body.appendChild(panel);
    panel.manager = manager;

    const rebindButton = () =>
      panel.shadowRoot?.querySelector(
        '[data-action-id="save"] .rebind',
      ) as HTMLButtonElement;

    rebindButton().click(); // enters "listening" / "Press a key…" state
    expect(rebindButton().textContent).toBe("Press a key…");

    await instance.changeLanguage("fr");

    // Row was not torn down and rebuilt: still listening, focus intact, and
    // the transient "Press a key…" label is untouched (not re-rendered into
    // its French translation) until the interaction actually ends.
    expect(rebindButton().classList.contains("is-listening")).toBe(true);
    expect(panel.shadowRoot?.activeElement).toBe(rebindButton());
    expect(rebindButton().textContent).toBe("Press a key…");

    panel.remove();
  });
});
