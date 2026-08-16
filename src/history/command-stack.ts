/**
 * A do/undo pair a consumer registers with a {@link CommandStack}. `do` is
 * invoked immediately when the command is pushed — the stack never delays
 * applying the change, it only records how to reverse and replay it later.
 */
export interface Command {
  /** Applies the change. Called once, synchronously, by `push`. */
  do(): void;
  /** Reverses the change applied by `do`. Called by `undo`. */
  undo(): void;
  /**
   * When set, a push sharing this same key with the current top-of-history
   * entry, within the configured coalesce window, merges into that entry
   * instead of creating a new one. Omit for a command that should always
   * become its own history entry.
   */
  coalesceKey?: string;
}

export interface CommandStackOptions {
  /**
   * Maximum number of entries kept in the undo history. Once exceeded, the
   * oldest entry is dropped — it becomes permanently unreachable via undo.
   * @default 100
   */
  maxSize?: number;
  /**
   * Time window, in milliseconds, during which a push sharing the previous
   * push's `coalesceKey` merges into the same history entry instead of
   * creating a new one.
   * @default 500
   */
  coalesceWindowMs?: number;
}

/** An entry recorded on the undo stack after a push. */
interface HistoryEntry {
  /** Reverts back to the state before this entry's group started. */
  undo(): void;
  /** Replays this entry's latest applied change. */
  redo(): void;
  coalesceKey: string | undefined;
  /** Timestamp (ms) of the last push coalesced into this entry. */
  lastPushedAt: number;
}

const DEFAULT_MAX_SIZE = 100;
const DEFAULT_COALESCE_WINDOW_MS = 500;

/**
 * A framework-agnostic undo/redo history. A consumer pushes commands (a
 * do/undo pair); the stack tracks what to reverse and replay, coalesces
 * rapid same-kind pushes into a single history step, and bounds its own
 * size so a long editing session cannot grow it unbounded.
 */
export class CommandStack {
  #maxSize: number;
  #coalesceWindowMs: number;
  #undoStack: HistoryEntry[] = [];
  #redoStack: HistoryEntry[] = [];

  constructor(options: CommandStackOptions = {}) {
    this.#maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.#coalesceWindowMs =
      options.coalesceWindowMs ?? DEFAULT_COALESCE_WINDOW_MS;
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  /**
   * Applies `command.do()` immediately, then records it. Clears the redo
   * stack, unless this push coalesces into the current top entry.
   */
  push(command: Command): void {
    const top = this.#undoStack.at(-1);
    const now = Date.now();
    const canCoalesce =
      top !== undefined &&
      command.coalesceKey !== undefined &&
      command.coalesceKey === top.coalesceKey &&
      now - top.lastPushedAt <= this.#coalesceWindowMs;

    command.do();

    if (canCoalesce && top !== undefined) {
      // Keep the group's original `undo` (state before the whole group);
      // only the replay target moves forward. See .vibe/decisions/011.
      top.redo = command.do.bind(command);
      top.lastPushedAt = now;
      // A coalesced push doesn't newly invalidate redo — a prior redo
      // stack already can't coexist with it (any push clears redo, and
      // coalescing only continues an existing top entry).
      return;
    }

    this.#redoStack = [];
    this.#undoStack.push({
      undo: command.undo.bind(command),
      redo: command.do.bind(command),
      coalesceKey: command.coalesceKey,
      lastPushedAt: now,
    });

    if (this.#undoStack.length > this.#maxSize) {
      this.#undoStack.shift();
    }
  }

  /** Reverts the most recent history entry. Returns false if there is none. */
  undo(): boolean {
    const entry = this.#undoStack.pop();
    if (entry === undefined) {
      return false;
    }
    entry.undo();
    this.#redoStack.push(entry);
    return true;
  }

  /** Replays the most recently undone entry. Returns false if there is none. */
  redo(): boolean {
    const entry = this.#redoStack.pop();
    if (entry === undefined) {
      return false;
    }
    entry.redo();
    this.#undoStack.push(entry);
    return true;
  }

  /** Empties both the undo and redo history. */
  clear(): void {
    this.#undoStack = [];
    this.#redoStack = [];
  }
}
