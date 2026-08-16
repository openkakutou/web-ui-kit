# Module: package
**Role:** The package's public entrypoint — re-exports the library's public API surface (the version constant, every layout/form component, the 2D/3D canvas/viewport controls, and the undo/redo history primitive) and side-effect-imports the design tokens CSS so `vite build` emits it alongside the JS bundle.
**Files:** `src/index.ts`, `src/version.ts`
**Exports:** `version: string`, plus everything re-exported from `modules/components.md`, `modules/canvas.md`, `modules/canvas3d.md`, and `modules/history.md`
**Depends on:** `modules/tokens.md`, `modules/components.md`, `modules/canvas.md`, `modules/canvas3d.md`, `modules/history.md`
