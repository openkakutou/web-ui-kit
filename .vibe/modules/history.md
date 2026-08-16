# Module: history
**Role:** A framework-agnostic undo/redo command-stack primitive — not a Web Component — that any consuming app plugs its own do/undo actions into, coalescing rapid same-kind pushes into a single history step and bounding its own size.
**Files:** `src/history/command-stack.ts`, `src/history/index.ts`
**Exports:** `CommandStack` (class: `push`, `undo`, `redo`, `clear`, `canUndo`, `canRedo`), `Command` (type), `CommandStackOptions` (type)
**Depends on:** (none)
