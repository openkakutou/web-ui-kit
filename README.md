# web-ui-kit

A shared, framework-agnostic design system for every [OpenKakutou](https://github.com/openkakutou) viewer/editor/mode web app — native Web Components plus CSS custom-property design tokens, published as a plain ESM package so any of the org's TypeScript/Vite apps can adopt it without a UI framework.

<!-- vibe:begin:features -->
This project is in early-stage development. Available now:

- Design tokens: a color palette with matching light and dark values, a spacing scale, and a typography scale, delivered as CSS custom properties from a single stylesheet. Dark mode is switched by setting `data-theme="dark"` on the page; every color pairing meets WCAG AA contrast in both themes.
- Published to the public npm registry on every tagged release — any Vite app can add it as a normal dependency with a standard semver range, no extra build configuration needed.
- A shared layout shell: a titled panel, a toolbar, a keyboard-accessible tab strip, and a root app frame (toolbar + sidebar + main content) that any of the other three can be placed into — usable together or on their own, with no CSS of your own required. All follow the light/dark theme automatically.
- Core form/input components: a keyboard-operable drag-and-drop file drop-zone, a slider with a live value readout, a color picker with an optional preset swatch palette, and a button with primary/secondary/danger variants. Each shows a clearly visible error state for invalid input (a rejected file, a malformed color, a broken slider range) instead of failing silently.
- A reusable zoom/pan viewport control for wrapping any canvas-based preview (sprite viewers, stage backgrounds, animation playback): mouse wheel zoom, drag-to-pan, and a reset-to-fit action, all fully usable from the keyboard alone with screen-reader feedback on zoom changes. Never hijacks the page's own scroll, and works with any wrapped content since it never touches its pixels.
- An accessibility baseline verified and locked in across every component: full keyboard operability, an always-visible focus indicator readable in both themes, and text colors checked for comfortable reading contrast. The color picker also gained an optional accessible label, matching the slider.

Planned:

- Reusable 3D viewport controls: orbit/pan/zoom camera for Ikemen GO 3D model-based stage previews
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

Import the layout components once to register them as custom elements, then use them declaratively in your markup:

```js
import "@openkakutou/web-ui-kit";
import "@openkakutou/web-ui-kit/tokens.css";
```

```html
<wuik-app-shell>
  <wuik-toolbar slot="toolbar">
    <button type="button">Save</button>
  </wuik-toolbar>
  <wuik-panel slot="sidebar">
    <span slot="header">Navigation</span>
    ...
  </wuik-panel>
  <wuik-tabs>
    <wuik-tab-panel label="Details">...</wuik-tab-panel>
    <wuik-tab-panel label="History">...</wuik-tab-panel>
  </wuik-tabs>
</wuik-app-shell>
```

Each of `<wuik-panel>`, `<wuik-toolbar>`, and `<wuik-tabs>` also works standalone, without `<wuik-app-shell>` or each other. See [docs/api.md](docs/api.md) for the full slot/attribute reference of every component.

The form/input components work standalone too, and each emits a typed `CustomEvent` instead of relying on native form events:

```html
<wuik-file-drop-zone accept=".png,.jpg" multiple>Drop images here</wuik-file-drop-zone>
<wuik-slider min="0" max="100" value="50" label="Volume"></wuik-slider>
<wuik-color-picker value="#2563eb" palette="#dc2626,#16a34a,#2563eb" label="Highlight color"></wuik-color-picker>
<wuik-button variant="primary">Save</wuik-button>
```

```js
dropZone.addEventListener("wuik-files-selected", (e) => console.log(e.detail.files));
slider.addEventListener("wuik-change", (e) => console.log(e.detail.value)); // also emits wuik-input live, during drag
colorPicker.addEventListener("wuik-change", (e) => console.log(e.detail.value));
```

See [docs/api.md](docs/api.md) for the full event/attribute contract, including how each component shows an invalid/empty input state.

Wrap any canvas-based preview in `<wuik-viewport>` to get mouse wheel zoom, drag-to-pan, and a reset-to-fit action for free — it never reads or draws your canvas's pixels, it just applies a CSS transform around whatever you slot into it:

```html
<wuik-viewport style="width: 400px; height: 300px;">
  <canvas width="200" height="150"></canvas>
</wuik-viewport>
```

```js
const viewport = document.querySelector("wuik-viewport");
window.addEventListener("load", () => viewport.resetToFit());
viewport.addEventListener("wuik-viewport-change", (e) => console.log(e.detail)); // { scale, x, y }
```

Fully keyboard-operable once focused: arrow keys pan, `+`/`-` zoom, `0`/`Home` resets to fit. See [docs/api.md](docs/api.md) for the full attribute/method/event/keyboard reference.
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
- [docs/api.md](docs/api.md) — the package's public exports, the layout components and form/input components (slots, attributes, events, keyboard behavior), and the full design token reference (names, values, theme switching)
- [docs/releasing.md](docs/releasing.md) — how a version tag turns into a published npm release, and the safety checks that run before publishing
- [docs/testing.md](docs/testing.md) — how the test suite is organized and run, including how CSS custom-property tokens are verified
<!-- vibe:end:docs-index -->
