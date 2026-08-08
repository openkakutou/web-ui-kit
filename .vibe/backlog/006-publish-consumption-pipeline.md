---
status: todo
---
# Publish/Consumption Pipeline (ESM Package Consumable By Vite Apps)

## Description
A build + publish pipeline producing a plain ESM package (no bundler-specific magic) that any of the org's Vite apps can add as a dependency and import directly, plus a versioned release process mirroring `character`'s tag-triggered release workflow.

## Acceptance Criteria
- [ ] A fresh Vite app can install and import a component with zero extra build configuration beyond a normal ESM dependency
- [ ] A GitHub Actions workflow publishes a versioned build artifact on tag, mirroring the pattern in `character/.github/workflows/release.yml`

## Notes
Should land once items 001-003 have real content to publish — sequencing note, not a hard blocker.
