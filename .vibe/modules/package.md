# Module: package
**Role:** The package's public entrypoint — re-exports the library's public API surface (the version constant, every layout/form component, the 2D/3D canvas/viewport controls, the undo/redo history primitive, the keyboard shortcut manager, and the localization layer) and side-effect-imports the design tokens CSS so `vite build` emits it alongside the JS bundle.
**Files:** `src/index.ts`, `src/version.ts`
**Exports:** `version: string`, plus everything re-exported from `modules/components.md`, `modules/canvas.md`, `modules/canvas3d.md`, `modules/history.md`, `modules/i18n.md`, and `modules/shortcuts.md`
**Depends on:** `modules/tokens.md`, `modules/components.md`, `modules/canvas.md`, `modules/canvas3d.md`, `modules/history.md`, `modules/i18n.md`, `modules/shortcuts.md`
