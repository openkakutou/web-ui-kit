import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      // Two independent entries: the main component/token bundle, and the
      // visual-regression preset (`.vibe/decisions/015`) — kept separate so
      // a consuming app's Node-side `playwright.config.ts` can import the
      // preset alone without pulling in the browser component bundle (and
      // its CSS side-effect import) into a Node context.
      entry: {
        "web-ui-kit": "src/index.ts",
        "visual-preset": "src/testing/visual-preset.ts",
      },
      formats: ["es"],
    },
  },
  test: {
    environment: "jsdom",
    css: true,
    // tests/visual/**/*.spec.ts are Playwright specs (npm run test:visual),
    // not Vitest ones — excluded here so `npm test` doesn't try to run
    // them under jsdom, where their `@playwright/test` `page` fixture
    // doesn't exist.
    exclude: [...configDefaults.exclude, "tests/visual/**"],
  },
});
