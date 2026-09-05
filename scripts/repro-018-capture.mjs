// Throwaway reproduction script for backlog item 018 — NOT part of the
// package. Captures the buttons section repeatedly against a running
// dev-preview server and records, per iteration, both the raw screenshot
// and the DOM/computed-style state of the empty button's invalid-state
// indicator, so a pixel difference between runs can be attributed to a
// real class/DOM state change versus a pure paint/font-rendering
// nondeterminism. Deleted once backlog item 018 is resolved.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const ITERATIONS = Number(process.env.REPRO_ITERATIONS ?? 10);
const URL = process.env.REPRO_URL ?? "http://localhost:4173";
const outDir = "repro-018-output";
fs.mkdirSync(outDir, { recursive: true });

const DISABLE_MOTION_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

const browser = await chromium.launch();
const results = [];

for (let i = 0; i < ITERATIONS; i++) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });
  await page.goto(URL);
  await page.addStyleTag({ content: DISABLE_MOTION_CSS });
  await page.evaluate(() => document.fonts.ready);

  const section = page.locator("#section-buttons");
  await section.waitFor({ state: "visible" });

  const diag = await page.evaluate(() => {
    const host = document.querySelector("#button-empty");
    const inner = host.shadowRoot.querySelector("button");
    const slot = host.shadowRoot.querySelector("slot");
    const cs = getComputedStyle(inner);
    return {
      hasIsEmptyClass: inner.classList.contains("is-empty"),
      borderStyle: cs.borderStyle,
      borderWidth: cs.borderWidth,
      borderColor: cs.borderColor,
      assignedNodesLength: slot.assignedNodes().length,
      rect: inner.getBoundingClientRect().toJSON(),
    };
  });
  results.push({ iteration: i, ...diag });

  const screenshotPath = `${outDir}/section-buttons-${String(i).padStart(2, "0")}.png`;
  await section.screenshot({ path: screenshotPath });
  await page.close();
}

await browser.close();
fs.writeFileSync(
  `${outDir}/diagnostics.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
