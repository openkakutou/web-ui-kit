import { beforeEach, describe, expect, it } from "vitest";
import { ShortcutManager } from "./shortcut-manager.ts";

/** A minimal in-memory Storage stand-in, isolated per test (real
 * localStorage is shared/global under jsdom across tests in the same
 * file, which would make persistence tests interfere with each other). */
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

describe("ShortcutManager", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeMemoryStorage();
  });

  it("registers an action with its default key binding", () => {
    const manager = new ShortcutManager({ storage });

    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });

    expect(manager.getBinding("save")).toBe("Ctrl+S");
    expect(manager.list()).toEqual([
      { id: "save", label: "Save", key: "Ctrl+S", isDefault: true },
    ]);
  });

  it("rebinds an action to a free key", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });

    const result = manager.rebind("save", "Ctrl+Shift+S");

    expect(result).toEqual({ ok: true });
    expect(manager.getBinding("save")).toBe("Ctrl+Shift+S");
    expect(manager.list()[0]?.isDefault).toBe(false);
  });

  it("persists a rebind across a new manager instance sharing the same storage", () => {
    const first = new ShortcutManager({ storage });
    first.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    first.rebind("save", "Ctrl+Shift+S");

    const second = new ShortcutManager({ storage });
    second.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });

    expect(second.getBinding("save")).toBe("Ctrl+Shift+S");
  });

  it("reports a conflict instead of silently overwriting another action's key", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    manager.register({ id: "export", label: "Export", defaultKey: "Ctrl+E" });

    const result = manager.rebind("export", "Ctrl+S");

    expect(result).toEqual({
      ok: false,
      reason: "conflict",
      conflictWith: "save",
    });
    // Neither binding actually changed.
    expect(manager.getBinding("save")).toBe("Ctrl+S");
    expect(manager.getBinding("export")).toBe("Ctrl+E");
  });

  it("swaps two actions' keys when a conflicting rebind is retried with swap", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    manager.register({ id: "export", label: "Export", defaultKey: "Ctrl+E" });

    const result = manager.rebind("export", "Ctrl+S", { swap: true });

    expect(result).toEqual({ ok: true });
    expect(manager.getBinding("export")).toBe("Ctrl+S");
    expect(manager.getBinding("save")).toBe("Ctrl+E");
  });

  it("resetToDefault reverts a rebound action back to its registered default", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    manager.rebind("save", "Ctrl+Shift+S");

    const result = manager.resetToDefault("save");

    expect(result).toEqual({ ok: true });
    expect(manager.getBinding("save")).toBe("Ctrl+S");
    expect(manager.list()[0]?.isDefault).toBe(true);
  });

  it("returns unknown-action for rebind/getBinding on an unregistered id", () => {
    const manager = new ShortcutManager({ storage });

    expect(manager.getBinding("ghost")).toBe(undefined);
    expect(manager.rebind("ghost", "Ctrl+G")).toEqual({
      ok: false,
      reason: "unknown-action",
    });
  });

  it("dispatches a change event with the action id and new key on a successful rebind", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    const events: Array<{ id: string; key: string }> = [];
    manager.addEventListener("change", (event) => {
      events.push((event as CustomEvent).detail);
    });

    manager.rebind("save", "Ctrl+Shift+S");

    expect(events).toEqual([{ id: "save", key: "Ctrl+Shift+S" }]);
  });

  it("does not dispatch a change event when a rebind fails", () => {
    const manager = new ShortcutManager({ storage });
    manager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
    manager.register({ id: "export", label: "Export", defaultKey: "Ctrl+E" });
    let calls = 0;
    manager.addEventListener("change", () => {
      calls++;
    });

    manager.rebind("export", "Ctrl+S");

    expect(calls).toBe(0);
  });
});
