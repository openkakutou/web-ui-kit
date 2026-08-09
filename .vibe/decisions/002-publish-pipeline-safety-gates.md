---
date: 2026-08-09
status: accepted
---
# Publish pipeline: pre-publish content/version guards, no manual approval gate

**Context:** `web-ui-kit#006` adds a tag-triggered GitHub Actions workflow that runs `npm publish` against the public npmjs.org registry (distribution mechanism itself decided in `roadmap`'s `.vibe/decisions/013`). Publishing a version to npm is a one-way door: even within the 72-hour unpublish window, the exact same version number can never be republished afterward. Two implementation questions needed a decision: how much to verify before that irreversible step, and whether a human must approve each release.

**Decision:**
1. Before `npm publish` runs, the workflow verifies (a) the packed tarball contains exactly the expected files (built output + package.json + README + LICENSE, nothing from source or tests) and (b) the git tag's version exactly matches `package.json`'s version — either failing the job before publish, not after.
2. A packed-tarball smoke build (installing the just-packed tarball into a minimal Vite fixture and running a real build) proves the "zero extra build configuration" acceptance criterion end-to-end, not just by inspecting `package.json`'s `exports`/`files` fields.
3. No required-reviewer/manual-approval gate on the publish job for now — the repo currently has a single maintainer with push access, so a tag push already requires the same authorization a manual approval click would.

**Reason:** Given publishing is irreversible per version number, the guards must run *before* the irreversible step, not as a post-hoc check — catching a bad tarball or a version mismatch costs nothing; catching it after `npm publish` costs a permanently burned version number. The manual-approval gate is deliberately deferred rather than rejected outright: it adds real friction (a click on every release) for no benefit while only one person can push a release tag; it becomes worth adding the moment a second maintainer with tag-push rights joins.

**Rejected alternatives:**
- *Verify tarball content and version only after publishing, as a post-publish check* — rejected: by definition too late to prevent the exact failure mode being guarded against.
- *Require a GitHub Environment with mandatory reviewers on every release* — deferred, not rejected: correct once the repo has more than one maintainer able to push tags; premature friction today.
