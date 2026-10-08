---
date: 2026-10-08
status: accepted
---
# `CommandStack` gains a saved mark and per-command meta

**Context:** The character editor's application shell (UX flow 001) needs "modified" to mean "the history differs from the last export" (undoing back to the exported state clears it) and Undo/Redo to navigate to the section the reverted action touched and announce it. `CommandStack` only exposed `canUndo`/`canRedo`; the editor's own dirty flag (editor decision 012) could not clear on undo, and a parallel stack kept outside could not follow coalescing.

**Decision:** `markSaved()` / `isAtSavedState` compare the identity and revision of the top undo entry with the recorded one; a push that coalesces into the saved entry bumps its revision, so it reads unsaved. If the saved entry falls off `maxSize`, the mark moves to the empty history (the state right after a dropped entry). `Command<M>` carries an optional `meta`; `undoMeta` / `redoMeta` expose the top entries' meta (latest coalesced command wins). `CommandStack` is generic over `M` with an `unknown` default, so existing callers compile unchanged.

**Rejected:** a numeric position counter (breaks with coalescing and the size limit); the app mirroring the stack (same coalescing problem, duplicated state); returning the undone entry from `undo()` (changes a public return type that is `boolean`).
