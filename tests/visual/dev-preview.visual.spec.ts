import { expect, test } from "@playwright/test";
import { waitForVisualReady } from "../../src/testing/visual-preset.ts";

/**
 * Component-level baseline screenshots against `dev-preview/`
 * (`.vibe/decisions/015` — this repo's own first suite for the shared
 * approach in roadmap decision `024`). One default-theme baseline per
 * component group, not every attribute-variant/theme combination shown
 * on the page.
 */

const SECTIONS = [
  "section-app-shells",
  "section-toolbar",
  "section-tabs",
  "section-panels",
  "section-drop-zones",
  "section-radio-groups",
  "section-sliders",
  "section-color-pickers",
  "section-buttons",
  "section-viewport",
  "section-viewport-3d",
  "section-shortcuts",
  "section-locale",
  // Appended last, deliberately: it is the newest section on the page and
  // must never be inserted above an existing one — see
  // .vibe/decisions/020-tabs-vertical-orientation-and-baseline-shift-avoidance.md.
  "section-tabs-vertical",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForVisualReady(page);
});

for (const sectionId of SECTIONS) {
  test(`${sectionId} matches its baseline screenshot`, async ({ page }) => {
    const section = page.locator(`#${sectionId}`);
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot(`${sectionId}.png`);
  });
}
