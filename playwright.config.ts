import { defineConfig, devices } from "@playwright/test";
import { createVisualProjectConfig } from "./src/testing/visual-preset.ts";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  ...createVisualProjectConfig({
    testDir: "./tests/visual",
    outputDir: "./test-results",
    use: { baseURL: "http://localhost:4173" },
  }),
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev-preview",
    url: "http://localhost:4173",
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
