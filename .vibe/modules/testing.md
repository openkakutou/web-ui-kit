# Module: testing
**Role:** The shared visual-regression testing preset (`.vibe/decisions/015`) every consuming app's own Playwright config extends — a fixed viewport/locale/diff-threshold config builder and a pre-screenshot readiness helper. Published as its own package entry/export, separate from the main component bundle.
**Files:** `src/testing/visual-preset.ts`, `src/testing/visual-preset.test.ts`
**Exports:** `createVisualProjectConfig(overrides?: VisualProjectConfig): VisualProjectConfig`, `waitForVisualReady(page: VisualPage): Promise<void>`, `DEFAULT_VISUAL_VIEWPORT`, `DEFAULT_VISUAL_LOCALE`, `DEFAULT_VISUAL_DIFF_OPTIONS`
**Depends on:** nothing else in this package — deliberately duck-typed against Playwright's own shapes rather than importing `@playwright/test` (see `.vibe/decisions/015`)
