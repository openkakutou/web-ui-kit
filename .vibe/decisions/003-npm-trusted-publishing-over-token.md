---
date: 2026-08-09
status: accepted
---
# Authenticate `npm publish` via Trusted Publishing (OIDC), not an `NPM_TOKEN` secret

**Context:** `web-ui-kit#006`'s release workflow originally authenticated `npm publish` with a classic `NPM_TOKEN` repository secret (per `roadmap`'s `.vibe/decisions/013`, which settled on npmjs.org as the registry but not the exact auth mechanism). In practice this token repeatedly failed with `EOTP` (one-time-password required) depending on the exact token type/permissions generated on npmjs.org — classic tokens and even some Granular Access Token configurations still require an interactive 2FA code that a CI job can never provide.

**Decision:** Use npm's Trusted Publishing instead: the package is configured on npmjs.org to trust this exact GitHub repository + workflow file (`release.yml`). The workflow authenticates via its own GitHub Actions OIDC identity (`id-token: write`, already granted for provenance) — npm exchanges that identity for a short-lived publish grant scoped to that one run. No `NPM_TOKEN` secret exists in the repo at all; the one that was configured has been deleted from GitHub Actions secrets.

**Reason:** This eliminates the entire class of failure the token approach kept hitting — there is no token type to get wrong, nothing to leak, and nothing to rotate. It's strictly more secure than any bypass-2FA token: the grant is scoped to a single run instead of being a standing credential sitting in repository secrets. The account's npmjs.org "Publishing access" setting was correspondingly tightened to disallow any 2FA-bypass token entirely, since none is needed anymore.

**Rejected alternatives:**
- *Keep chasing the right `NPM_TOKEN` type (Automation / Granular with bypass-2FA explicitly enabled)* — rejected: works, but leaves a standing long-lived secret in the repo for no benefit once Trusted Publishing is available, and reintroduces the exact "which token type" foot-gun that caused the `EOTP` failures.
- *Require an `--otp` flag piped from a secondary secret* — rejected: there is no stable, non-time-sensitive OTP value that could be stored as a secret; TOTP codes expire in seconds and can't be pre-provisioned for an unattended CI run.
