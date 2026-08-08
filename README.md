# web-ui-kit

A shared, framework-agnostic design system for every [OpenKakutou](https://github.com/openkakutou) viewer/editor/mode web app — native Web Components plus CSS custom-property design tokens, published as a plain ESM package so any of the org's TypeScript/Vite apps can adopt it without a UI framework.

<!-- vibe:begin:features -->
This project is in early-stage development — only the project scaffold exists so far, no components yet.

Planned:

- Design tokens: color (light/dark), spacing, and typography as CSS custom properties
- A shared layout shell: app frame, side panels, tabs, toolbar
- Core form/input components: file drop-zone, sliders, color/palette picker, buttons
- Reusable canvas/viewport controls: zoom/pan for every sprite/stage/animation preview
- An accessibility baseline: keyboard navigation, focus states, contrast
<!-- vibe:end:features -->

<!-- vibe:begin:install -->
Requires [Node.js](https://nodejs.org/) `^20.19.0` or `>=22.12.0`.

```sh
npm install
```

Verify the install worked by running the test suite:

```sh
npm test
```
<!-- vibe:end:install -->

<!-- vibe:begin:usage -->
Build the library (ESM output in `dist/`):

```sh
npm run build
```

Rebuild automatically on changes:

```sh
npm run dev
```

Run the test suite:

```sh
npm test
```

Run the linter/formatter (auto-fixes issues in place):

```sh
npm run lint
```
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
No additional documentation yet.
<!-- vibe:end:docs-index -->
