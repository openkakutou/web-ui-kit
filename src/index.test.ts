import { describe, expect, it } from "vitest";
import "./index.ts";

describe("package entrypoint (src/index.ts)", () => {
  it("registers every documented custom element as a side effect of import", () => {
    const tags = [
      "wuik-panel",
      "wuik-toolbar",
      "wuik-tabs",
      "wuik-tab-panel",
      "wuik-app-shell",
      "wuik-file-drop-zone",
      "wuik-slider",
      "wuik-color-picker",
      "wuik-button",
      "wuik-viewport",
    ];
    for (const tag of tags) {
      expect(
        customElements.get(tag),
        `expected <${tag}> to be registered by importing the package entrypoint`,
      ).toBeDefined();
    }
  });
});
