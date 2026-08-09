---
status: done
---
# Publish/Consumption Pipeline (ESM Package Consumable By Vite Apps)

## Description
A build + publish pipeline producing a plain ESM package (no bundler-specific magic) that any of the org's Vite apps can add as a dependency and import directly, plus a versioned release process mirroring `character`'s tag-triggered release workflow.

## Acceptance Criteria
- [ ] A fresh Vite app can install and import a component with zero extra build configuration beyond a normal `npm install @openkakutou/web-ui-kit`
- [ ] A GitHub Actions workflow, triggered on a version tag (mirroring the pattern in `character/.github/workflows/release.yml`), builds the package and runs `npm publish` against the public npmjs.org registry, authenticated via an `NPM_TOKEN` repository secret
- [ ] The published package resolves via normal semver ranges (e.g. `^0.1.0`) in a consumer's `package.json`

## Notes
Should land once items 001-003 have real content to publish — sequencing note, not a hard blocker.

Distribution mechanism decided: public npmjs.org registry, not GitHub Packages or a direct git dependency — see `roadmap`'s `.vibe/decisions/013`.
