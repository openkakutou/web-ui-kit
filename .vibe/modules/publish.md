# Module: publish
**Role:** The pack-content and metadata guards that gate the tag-triggered npm publish pipeline (`.github/workflows/release.yml`), plus the `smoke/` fixture app the pipeline builds against before publishing for real.
**Files:** `src/publish/validate-pack-file-list.ts`, `src/publish/parse-pack-output.ts`, `src/publish/verify-pack.mjs`, `src/publish/package-metadata.test.ts`, `src/publish/release-workflow.test.ts`, `src/publish/validate-pack-file-list.test.ts`, `src/publish/parse-pack-output.test.ts`, `smoke/package.json`, `smoke/index.html`, `smoke/main.js`
**Exports:** `validatePackFileList(files: readonly string[]): string | null`, `extractPackedFilePaths(parsed: unknown): string[]`
**Depends on:** `modules/package.md` (package.json metadata), `.vibe/decisions/002-publish-pipeline-safety-gates.md`
