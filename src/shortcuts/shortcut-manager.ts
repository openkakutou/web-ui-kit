/**
 * A framework-agnostic, headless keyboard-shortcut manager. A consuming
 * app registers named actions with a default key binding; the manager
 * tracks the active binding for each (default, or a persisted user
 * override), rejects a rebind that would silently steal another action's
 * key, and persists overrides in `localStorage` (or an injected `Storage`)
 * so they survive a page reload.
 *
 * Not a Web Component — see `shortcut-panel.ts` for the shared UI that
 * drives this class.
 */

export interface ShortcutAction {
  id: string;
  label: string;
  defaultKey: string;
}

export interface ShortcutBinding {
  id: string;
  label: string;
  key: string;
  /** `true` when `key` is still the action's registered default. */
  isDefault: boolean;
}

export type RebindResult =
  | { ok: true }
  | { ok: false; reason: "conflict"; conflictWith: string }
  | { ok: false; reason: "unknown-action" };

export interface RebindOptions {
  /**
   * When the requested key is already bound to another action, swap the
   * two actions' keys instead of reporting a conflict.
   */
  swap?: boolean;
}

export interface ShortcutManagerOptions {
  /** localStorage (or injected Storage) key overrides are read/written under.
   * Override per consuming app — sharing this across apps on the same
   * origin would also share their persisted overrides.
   * @default "wuik-shortcuts"
   */
  storageKey?: string;
  /** @default globalThis.localStorage */
  storage?: Storage;
}

const DEFAULT_STORAGE_KEY = "wuik-shortcuts";

interface RegisteredAction extends ShortcutAction {
  overrideKey: string | undefined;
}

/** Dispatched as `CustomEvent<{ id: string; key: string }>` on any
 * successful binding change (rebind, swap, or reset). */
export type ShortcutChangeDetail = { id: string; key: string };

export class ShortcutManager extends EventTarget {
  readonly #storageKey: string;
  readonly #storage: Storage | undefined;
  readonly #actions = new Map<string, RegisteredAction>();

  constructor(options: ShortcutManagerOptions = {}) {
    super();
    this.#storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.#storage =
      options.storage ??
      (typeof globalThis.localStorage !== "undefined"
        ? globalThis.localStorage
        : undefined);
  }

  register(action: ShortcutAction): void {
    const overrides = this.#readOverrides();
    this.#actions.set(action.id, {
      ...action,
      overrideKey: overrides[action.id],
    });
  }

  list(): ShortcutBinding[] {
    return Array.from(this.#actions.values()).map((action) => ({
      id: action.id,
      label: action.label,
      key: action.overrideKey ?? action.defaultKey,
      isDefault: action.overrideKey === undefined,
    }));
  }

  getBinding(id: string): string | undefined {
    const action = this.#actions.get(id);
    return action === undefined
      ? undefined
      : (action.overrideKey ?? action.defaultKey);
  }

  rebind(id: string, key: string, options: RebindOptions = {}): RebindResult {
    const action = this.#actions.get(id);
    if (action === undefined) {
      return { ok: false, reason: "unknown-action" };
    }

    const holder = this.#findHolder(key, id);
    if (holder !== undefined) {
      if (!options.swap) {
        return { ok: false, reason: "conflict", conflictWith: holder.id };
      }
      const previousKey = action.overrideKey ?? action.defaultKey;
      this.#setBinding(holder, previousKey);
      this.#dispatchChange(holder.id, previousKey);
    }

    this.#setBinding(action, key);
    this.#dispatchChange(id, key);
    return { ok: true };
  }

  resetToDefault(id: string): RebindResult {
    const action = this.#actions.get(id);
    if (action === undefined) {
      return { ok: false, reason: "unknown-action" };
    }
    return this.rebind(id, action.defaultKey);
  }

  #findHolder(key: string, excludingId: string): RegisteredAction | undefined {
    for (const candidate of this.#actions.values()) {
      if (candidate.id === excludingId) {
        continue;
      }
      const candidateKey = candidate.overrideKey ?? candidate.defaultKey;
      if (candidateKey === key) {
        return candidate;
      }
    }
    return undefined;
  }

  #setBinding(action: RegisteredAction, key: string): void {
    action.overrideKey = key === action.defaultKey ? undefined : key;
    this.#writeOverride(action.id, action.overrideKey);
  }

  #dispatchChange(id: string, key: string): void {
    this.dispatchEvent(
      new CustomEvent<ShortcutChangeDetail>("change", { detail: { id, key } }),
    );
  }

  #readOverrides(): Record<string, string> {
    if (this.#storage === undefined) {
      return {};
    }
    const raw = this.#storage.getItem(this.#storageKey);
    if (raw === null) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  #writeOverride(id: string, key: string | undefined): void {
    if (this.#storage === undefined) {
      return;
    }
    const overrides = this.#readOverrides();
    if (key === undefined) {
      delete overrides[id];
    } else {
      overrides[id] = key;
    }
    this.#storage.setItem(this.#storageKey, JSON.stringify(overrides));
  }
}
