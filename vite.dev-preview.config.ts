import { defineConfig } from "vite";

/**
 * Serves `dev-preview/` as a real dev server — used for manual runtime
 * smoke checks during development and as the target Playwright's
 * `webServer` boots for the visual-regression suite (`playwright.config.ts`).
 * Separate from `vite.config.ts`, which builds the published library.
 */
export default defineConfig({
  root: "dev-preview",
  server: {
    port: 4173,
    strictPort: true,
  },
});
