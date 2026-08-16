import { describe, expect, it, vi } from "vitest";
import { CommandStack } from "./command-stack.ts";

/**
 * Builds a command that mutates a shared { value } box, so assertions check
 * a real, independently-observable state change rather than mock call counts.
 */
function makeSetCommand(
  box: { value: number },
  next: number,
  coalesceKey?: string,
) {
  const previous = box.value;
  return {
    coalesceKey,
    do: () => {
      box.value = next;
    },
    undo: () => {
      box.value = previous;
    },
  };
}

describe("CommandStack", () => {
  it("executes a command's do function immediately when pushed", () => {
    const box = { value: 0 };
    const stack = new CommandStack();

    stack.push(makeSetCommand(box, 5));

    expect(box.value).toBe(5);
  });

  it("undo replays the undo function of the most recently pushed command", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    stack.push(makeSetCommand(box, 5));

    const undone = stack.undo();

    expect(box.value).toBe(0);
    expect(undone).toBe(true);
  });

  it("redo replays the do function of the most recently undone command", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    stack.push(makeSetCommand(box, 5));
    stack.undo();

    const redone = stack.redo();

    expect(box.value).toBe(5);
    expect(redone).toBe(true);
  });

  it("undo then redo restores the correct value after multiple consecutive operations", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    stack.push(makeSetCommand(box, 1));
    stack.push(makeSetCommand(box, 2));
    stack.push(makeSetCommand(box, 3));

    stack.undo();
    stack.undo();
    expect(box.value).toBe(1);

    stack.redo();
    expect(box.value).toBe(2);

    stack.undo();
    expect(box.value).toBe(1);
  });

  it("rapid successive pushes with the same coalesce key merge into a single history entry, undo reverts to before the group", () => {
    const box = { value: 0 };
    const stack = new CommandStack({ coalesceWindowMs: 500 });

    stack.push(makeSetCommand(box, 1, "drag"));
    stack.push(makeSetCommand(box, 2, "drag"));
    stack.push(makeSetCommand(box, 3, "drag"));
    expect(box.value).toBe(3);

    const undone = stack.undo();

    expect(box.value).toBe(0);
    expect(undone).toBe(true);
    // A second undo must find nothing left — the three drags coalesced into one entry.
    expect(stack.undo()).toBe(false);
  });

  it("redo after a coalesced group replays the group's latest value, not an intermediate one", () => {
    const box = { value: 0 };
    const stack = new CommandStack({ coalesceWindowMs: 500 });
    stack.push(makeSetCommand(box, 1, "drag"));
    stack.push(makeSetCommand(box, 2, "drag"));
    stack.undo();

    stack.redo();

    expect(box.value).toBe(2);
  });

  it("does not coalesce pushes whose coalesce key differs", () => {
    const box = { value: 0 };
    const stack = new CommandStack({ coalesceWindowMs: 500 });
    stack.push(makeSetCommand(box, 1, "drag-a"));
    stack.push(makeSetCommand(box, 2, "drag-b"));

    stack.undo();
    expect(box.value).toBe(1);
    stack.undo();
    expect(box.value).toBe(0);
  });

  it("does not coalesce pushes outside the coalesce time window", () => {
    vi.useFakeTimers();
    try {
      const box = { value: 0 };
      const stack = new CommandStack({ coalesceWindowMs: 100 });
      stack.push(makeSetCommand(box, 1, "drag"));
      vi.advanceTimersByTime(200);
      stack.push(makeSetCommand(box, 2, "drag"));

      stack.undo();
      expect(box.value).toBe(1);
      stack.undo();
      expect(box.value).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bounds history size to the configured limit, dropping the oldest entry", () => {
    const box = { value: 0 };
    const stack = new CommandStack({ maxSize: 2 });
    stack.push(makeSetCommand(box, 1));
    stack.push(makeSetCommand(box, 2));
    stack.push(makeSetCommand(box, 3));

    // Only the last 2 entries survive: undoing 2 times reaches value 1 (the
    // state *after* the dropped first command), not all the way back to 0.
    stack.undo();
    stack.undo();
    expect(box.value).toBe(1);
    expect(stack.undo()).toBe(false);
  });

  it("undo does nothing and returns false when the history is empty", () => {
    const stack = new CommandStack();

    expect(stack.undo()).toBe(false);
  });

  it("redo does nothing and returns false when there is nothing to redo", () => {
    const stack = new CommandStack();

    expect(stack.redo()).toBe(false);
  });

  it("pushing a new command after an undo clears the redo stack", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    stack.push(makeSetCommand(box, 1));
    stack.undo();

    stack.push(makeSetCommand(box, 2));

    expect(stack.redo()).toBe(false);
    expect(box.value).toBe(2);
  });

  it("exposes canUndo/canRedo reflecting the current stack state", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);

    stack.push(makeSetCommand(box, 1));
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);

    stack.undo();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(true);
  });

  it("clear empties both the undo and redo stacks", () => {
    const box = { value: 0 };
    const stack = new CommandStack();
    stack.push(makeSetCommand(box, 1));
    stack.undo();

    stack.clear();

    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });
});
