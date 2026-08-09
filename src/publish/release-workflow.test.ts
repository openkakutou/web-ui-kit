import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// A full YAML parse isn't worth a new dependency here — the real safety
// net is the workflow's own steps (verify-pack, the smoke build, the
// tag/version guard), which run for real in CI. This is a lightweight
// regression guard against the structural pieces breaking silently.
// Resolved from the working directory (vitest runs from the repo root)
// rather than import.meta.url, since the jsdom test environment doesn't
// give it a real file:// URL.
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/release.yml"),
  "utf8",
);

describe("release workflow", () => {
  it("triggers only on a semantic version tag push", () => {
    expect(workflow).toMatch(
      /tags:\s*\n\s*-\s*'v\[0-9\]\*\.\[0-9\]\*\.\[0-9\]\*'/,
    );
  });

  it("grants id-token write access for provenance, nothing broader", () => {
    expect(workflow).toContain("id-token: write");
    expect(workflow).not.toContain("contents: write");
  });

  it("runs the pack-content and tag/version guards before publishing", () => {
    // Matched against the actual `run:` steps, not just any mention of
    // the words anywhere in the file (e.g. an explanatory comment).
    const verifyPackIndex = workflow.indexOf("run: npm run verify-pack");
    const publishIndex = workflow.indexOf("run: npm publish");
    expect(verifyPackIndex).toBeGreaterThan(-1);
    expect(publishIndex).toBeGreaterThan(-1);
    expect(verifyPackIndex).toBeLessThan(publishIndex);
  });

  it("authenticates via OIDC trusted publishing, never a long-lived token secret", () => {
    expect(workflow).not.toMatch(/secrets\.\w*NPM/i);
    expect(workflow).not.toContain("NODE_AUTH_TOKEN");
  });

  it("never echoes an auth token to the workflow logs", () => {
    expect(workflow).not.toMatch(/echo.*NODE_AUTH_TOKEN/i);
    expect(workflow).not.toMatch(/--loglevel[= ]silly/);
    expect(workflow).not.toContain("ACTIONS_STEP_DEBUG");
  });

  it("pins every action to a commit SHA, not a floating tag", () => {
    const usesLines = workflow.match(/uses:\s*\S+/g) ?? [];
    expect(usesLines.length).toBeGreaterThan(0);
    for (const line of usesLines) {
      expect(line).toMatch(/uses:\s*[^@]+@[0-9a-f]{40}/);
    }
  });
});
