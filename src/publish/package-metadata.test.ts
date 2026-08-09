import { describe, expect, it } from "vitest";
import packageJson from "../../package.json" with { type: "json" };
import { version } from "../version.ts";

describe("package.json publish metadata", () => {
  it("declares public access for the scoped package", () => {
    expect(packageJson.publishConfig?.access).toBe("public");
  });

  it("keeps the published package name under the openkakutou scope", () => {
    expect(packageJson.name).toBe("@openkakutou/web-ui-kit");
  });

  it("stays in sync with the src/version.ts version constant", () => {
    expect(packageJson.version).toBe(version);
  });
});
