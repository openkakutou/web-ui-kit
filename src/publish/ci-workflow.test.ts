import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Same rationale as release-workflow.test.ts: a full YAML parse isn't worth
// a dependency here, this is a lightweight regression guard against the
// structural pieces breaking silently.
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/ci.yml"),
  "utf8",
);

describe("CI workflow", () => {
  it("triggers on every push to any branch", () => {
    expect(workflow).toMatch(
      /on:[\s\S]*push:\s*\n\s*branches:\s*\n\s*-\s*'\*\*'/,
    );
  });

  it("triggers on every pull request", () => {
    expect(workflow).toMatch(/on:[\s\S]*pull_request:/);
  });

  it("does not also trigger on a tag push (release.yml already covers that)", () => {
    expect(workflow).not.toMatch(/tags:/);
  });

  it("calls the shared verify reusable workflow, not a duplicated copy of its steps", () => {
    expect(workflow).toContain("uses: ./.github/workflows/verify.yml");
    // These must not be reintroduced here — they belong solely in
    // verify.yml, so ci.yml and release.yml can never drift apart.
    expect(workflow).not.toContain("run: npm test");
    expect(workflow).not.toContain("run: npm run test:visual");
  });

  it("grants no broader permissions than reading repo contents", () => {
    const permissionLines =
      workflow.match(/^\s*\w[\w-]*:\s*(read|write)\s*$/gm) ?? [];
    expect(permissionLines.length).toBeGreaterThan(0);
    for (const line of permissionLines) {
      expect(line.trim()).toBe("contents: read");
    }
  });
});
