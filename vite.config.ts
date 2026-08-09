import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "web-ui-kit",
    },
  },
  test: {
    environment: "jsdom",
    css: true,
  },
});
