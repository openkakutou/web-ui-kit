---
status: todo
---
# Generate the visual baseline for the selects section

## Description
Item 029 added the `section-selects` entry to the visual-regression spec and the matching dev-preview section, but no baseline image exists yet: per decision 015, baselines are only trusted when generated on the real `ubuntu-24.04` runner. Until it is generated and committed, the push/PR `ci.yml` check fails on this section.

## Acceptance Criteria
- [ ] The `section-selects` baseline is generated on the real runner and committed
- [ ] `ci.yml` is green for the commit that adds it
- [ ] The baseline shows default, aria-label-only, disabled, invalid, placeholder, grouped and long-list states in the expected look

## Notes
Same procedure as item 035: take `section-selects-actual.png` from the failed CI run's `visual-regression-diff` artifact of the commit that added the section.
