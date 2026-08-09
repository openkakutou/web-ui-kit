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
None.
