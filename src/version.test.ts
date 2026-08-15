import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };
import { version } from "./version.ts";

describe("version", () => {
  it("is a non-empty semantic version string", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches package.json's version field", () => {
    expect(version).toBe(packageJson.version);
  });

  // Regression guard for the bug that broke the real v0.4.0 release (backlog
  // item 008): version.ts's literal drifted out of sync with package.json
  // because it was a second, hand-maintained copy of the version string. The
  // test above alone doesn't prevent that from recurring — a "fix" that just
  // hardcodes the current package.json version into version.ts would also
  // pass it today, then drift again on the next release. Asserting the
  // source never contains a bare semver literal rules that specific wrong
  // fix out structurally, the same source-text-assertion approach already
  // used by release-workflow.test.ts in this repo.
  it("derives from package.json rather than a hardcoded literal", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/version.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/["']\d+\.\d+\.\d+["']/);
  });
});
