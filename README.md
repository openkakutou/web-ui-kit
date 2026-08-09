# web-ui-kit

A shared, framework-agnostic design system for every [OpenKakutou](https://github.com/openkakutou) viewer/editor/mode web app — native Web Components plus CSS custom-property design tokens, published as a plain ESM package so any of the org's TypeScript/Vite apps can adopt it without a UI framework.

<!-- vibe:begin:features -->
This project is in early-stage development. Available now:

- Design tokens: a color palette with matching light and dark values, a spacing scale, and a typography scale, delivered as CSS custom properties from a single stylesheet. Dark mode is switched by setting `data-theme="dark"` on the page; every color pairing meets WCAG AA contrast in both themes.
- Published to the public npm registry on every tagged release — any Vite app can add it as a normal dependency with a standard semver range, no extra build configuration needed.

Planned:

- A shared layout shell: app frame, side panels, tabs, toolbar
- Core form/input components: file drop-zone, sliders, color/palette picker, buttons
- Reusable canvas/viewport controls: zoom/pan for every sprite/stage/animation preview
- Reusable 3D viewport controls: orbit/pan/zoom camera for Ikemen GO 3D model-based stage previews
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

In a consuming app, add the package as a normal dependency:

```sh
npm install @openkakutou/web-ui-kit
```

Then import the design tokens once (e.g. in your app's entrypoint):

```js
import "@openkakutou/web-ui-kit/tokens.css";
```

Every token is a CSS custom property, e.g. `var(--wuik-color-bg)`, `var(--wuik-space-4)`, `var(--wuik-font-size-base)`. To switch to dark mode, set `data-theme="dark"` on `<html>` (or any ancestor element):

```html
<html data-theme="dark">
```
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
- [docs/api.md](docs/api.md) — the package's public exports and the full design token reference (names, values, theme switching)
- [docs/releasing.md](docs/releasing.md) — how a version tag turns into a published npm release, and the safety checks that run before publishing
- [docs/testing.md](docs/testing.md) — how the test suite is organized and run, including how CSS custom-property tokens are verified
<!-- vibe:end:docs-index -->
