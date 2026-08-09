# Module: package
**Role:** The package's public entrypoint — re-exports the library's public API surface (the version constant and every layout component; canvas controls will be exported here as they land) and side-effect-imports the design tokens CSS so `vite build` emits it alongside the JS bundle.
**Files:** `src/index.ts`, `src/version.ts`
**Exports:** `version: string`, plus everything re-exported from `modules/components.md`
**Depends on:** `modules/tokens.md`, `modules/components.md`
