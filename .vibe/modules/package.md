# Module: package
**Role:** The package's public entrypoint — re-exports the library's public API surface (the version constant, every layout/form component, and the canvas/viewport controls; 3D viewport controls will be exported here as they land) and side-effect-imports the design tokens CSS so `vite build` emits it alongside the JS bundle.
**Files:** `src/index.ts`, `src/version.ts`
**Exports:** `version: string`, plus everything re-exported from `modules/components.md` and `modules/canvas.md`
**Depends on:** `modules/tokens.md`, `modules/components.md`, `modules/canvas.md`
