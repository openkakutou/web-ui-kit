import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Same rationale as release-workflow.test.ts: a full YAML parse isn't worth
// a dependency here, this is a lightweight regression guard against the
// structural pieces breaking silently. Resolved from the working directory
// (vitest runs from the repo root) rather than import.meta.url.
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/verify.yml"),
  "utf8",
);

describe("verify workflow", () => {
  it("is a reusable workflow, callable by other workflows in this repo", () => {
    expect(workflow).toMatch(/on:\s*\n\s*workflow_call:/);
  });

  it("is not directly triggered by push or pull_request itself", () => {
    // It must only ever run as a called job of ci.yml/release.yml — a
    // direct trigger here would mean it runs a third time on its own,
    // redundant with both callers.
    expect(workflow).not.toMatch(/^\s*push:/m);
    expect(workflow).not.toMatch(/^\s*pull_request:/m);
  });

  it("runs on the same pinned real runner as the release workflow", () => {
    expect(workflow).toMatch(/runs-on:\s*ubuntu-24\.04\s*$/m);
  });

  it("runs the unit test suite, lint, and the visual regression suite, in that order", () => {
    const testIndex = workflow.indexOf("run: npm test");
    const lintIndex = workflow.indexOf("run: npx biome check .");
    const visualIndex = workflow.indexOf("run: npm run test:visual");
    expect(testIndex).toBeGreaterThan(-1);
    expect(lintIndex).toBeGreaterThan(-1);
    expect(visualIndex).toBeGreaterThan(-1);
    expect(testIndex).toBeLessThan(visualIndex);
    expect(lintIndex).toBeLessThan(visualIndex);
  });

  it("uploads the visual regression diff as an artifact on failure", () => {
    const visualIndex = workflow.indexOf("run: npm run test:visual");
    const uploadIndex = workflow.indexOf("actions/upload-artifact");
    expect(uploadIndex).toBeGreaterThan(visualIndex);
    expect(workflow).toMatch(
      /if:\s*failure\(\)\s*\n\s*uses:\s*actions\/upload-artifact/,
    );
  });

  it("pins every external action to a commit SHA, not a floating tag", () => {
    const usesLines = workflow.match(/uses:\s*\S+/g) ?? [];
    expect(usesLines.length).toBeGreaterThan(0);
    for (const line of usesLines) {
      expect(line).toMatch(/uses:\s*[^@]+@[0-9a-f]{40}/);
    }
  });
});
