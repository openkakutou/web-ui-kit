---
status: done
---
# Undo/Redo Command-Stack Primitive

## Description
Add a reusable undo/redo command-stack primitive to the shared design system: a do/undo/redo history (with coalescing of rapid successive edits) exposed as a plain TypeScript API and/or a Web Component, that every editor app (`character-editor`, `stage-editor`, `lifebar-editor`) can plug its own domain-specific commands into instead of re-implementing history management independently in each app. Motivated by a well-documented Fighter Factory Ultimate pain point: undo/redo was missing or inconsistent across its various file editors for years, only unified in a later major release — a gap the org's editors should avoid from the start.

## Acceptance Criteria
- [ ] A consuming app can register a command (do/undo pair) and push it onto a shared history stack
- [ ] Undo and redo replay the correct do/undo functions in order, including after multiple consecutive operations
- [ ] Rapid successive edits of the same kind (e.g. dragging a value) coalesce into a single history entry instead of one per intermediate step
- [ ] History size is bounded (configurable limit) so memory usage doesn't grow unbounded during a long editing session

## Notes
Framework-agnostic per this repo's conventions — no dependency on any specific app's state management. Each editor app maps its own domain operations (e.g. stage-editor's BG element edits, character-editor's animation edits) onto this primitive; this item only covers the shared primitive itself, not any app's adoption of it (tracked separately per app).
