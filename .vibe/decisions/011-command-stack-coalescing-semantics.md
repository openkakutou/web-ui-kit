---
date: 2026-08-17
status: accepted
---
# Command-stack coalescing keeps the pre-group undo, replaces the redo
**Context:** The undo/redo command-stack primitive (backlog item 009) must coalesce rapid successive edits of the same kind (e.g. dragging a slider) into a single history entry, per its acceptance criteria.
**Decision:** When a pushed command's `coalesceKey` matches the current top-of-stack entry within the coalesce time window, the new command's `do` still runs immediately, but only the entry's `redo` function is replaced with it; the entry's original `undo` function (from the very first command in the coalesced group) is kept unchanged.
**Reason:** A single `undo()` on a coalesced group must revert all the way back to the state before the group started (e.g. before the drag began), not just one step back through each intermediate value — otherwise coalescing would only save history-list length, not user-facing undo steps.
**Rejected alternatives:** Coalescing by replacing both `undo` and `redo` with the latest command's pair was rejected — it would make `undo()` only revert the last intermediate step instead of the whole gesture, defeating the purpose of coalescing.
