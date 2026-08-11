---
status: todo
---
# Fix version constant drift from package.json

## Description
`src/version.ts`'s exported `version` constant (`0.3.0`) has fallen out of sync with `package.json`'s `version` field (`0.4.0`), causing a pre-existing failure in `src/publish/package-metadata.test.ts` ("stays in sync with the src/version.ts version constant"). This was discovered as a pre-existing failure during backlog item 004's baseline check — unrelated to and not caused by that work. Beyond the immediate fix, the release pipeline should be checked so this drift can't silently reoccur on a future release.

## Acceptance Criteria
- [ ] `src/version.ts`'s `version` constant matches `package.json`'s `version` field
- [ ] `src/publish/package-metadata.test.ts` passes
- [ ] The release process (`/vibe:release` or the publish pipeline) is confirmed to keep both in sync going forward, or a gap is documented if one remains

## Notes
Confirmed to have broken the real `v0.4.0` release: the tag-triggered `Release` GitHub Actions run for `v0.4.0` (2026-08-09, run `31333481520`) failed on exactly this pre-existing `package-metadata.test.ts` assertion (`expected '0.4.0' to be '0.3.0'`), so the npm publish step never ran — `npm view @openkakutou/web-ui-kit versions` still tops out at `0.3.0` even though `v0.4.0`'s Web Components (`<wuik-viewport>`, `<wuik-viewport-3d>`) exist in the tagged source and on GitHub. Any consumer pinned to `^0.4.0` (or newer) cannot actually install it from npm until this is fixed and a new patch/release re-runs the pipeline successfully. Discovered again 2026-08-11 while `character-viewer-web`'s sprite browser (item 005) was evaluating `<wuik-viewport>` — that item is proceeding with a raw `<canvas>` for now rather than block on this.
