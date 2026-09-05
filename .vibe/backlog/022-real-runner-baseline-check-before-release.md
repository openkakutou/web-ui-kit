---
status: todo
---
# Real-Runner Baseline Check Before Release, Not After

## Description
Three consecutive incidents (backlog items 018, 020, 021) each shipped a `dev-preview`-touching feature with a visual-regression baseline that was either stale (an existing section shifted as a byproduct) or only a local/sandbox-generated "provisional" draft — and each was only caught when the tag-triggered `Release` workflow's "Visual regression tests" step failed on the real `ubuntu-24.04` runner, *after* the version was already tagged. `v0.8.0`, `v0.9.0`, `v0.10.0`, and `v0.11.0` all failed to publish to npm for exactly this reason, each requiring a follow-up patch release (`v0.8.1`, `v0.9.1`, `v0.10.1`, `v0.11.1`) to actually become installable. The tag and GitHub release for each failed version are permanent, unpublishable dead ends.

This needs a structural fix so a `dev-preview` change can't reach a git tag with a baseline problem still undiscovered, instead of relying on each feature's implementer to remember the manual real-runner check.

## Acceptance Criteria
- [ ] A `dev-preview`-touching change gets its affected baseline(s) verified against the real `ubuntu-24.04` runner (the established `workflow_dispatch` technique from decisions 015/017, or an equivalent always-on CI check) before it can be considered done or merged — not only discovered by the tag-triggered `Release` workflow after the fact
- [ ] The existing `Release` workflow's own visual-regression step no longer needs to be the first place a stale/provisional baseline is caught
- [ ] The fix is documented (CLAUDE.md and/or a new decision) so a future feature touching `dev-preview` follows the same check without having to be told

## Notes
Non-exhaustive options to weigh: (a) fold real-runner baseline regeneration into `vibe:feature`/`vibe:fix`'s own Definition of Done whenever `dev-preview/` changes, mirroring what items 018/019/020/021 each did after the fact; (b) add a CI check that runs on every push/PR (not just on a pushed tag) so a bad baseline is caught before a release is ever cut; (c) some combination — e.g. (a) as the primary discipline, (b) as a safety net. See `.vibe/decisions/015` and `.vibe/decisions/017` for the existing real-runner-vs-sandbox divergence context this builds on.
