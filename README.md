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
- A reusable 3D orbit/pan/zoom camera control for wrapping any 3D-rendering preview (first built for Ikemen GO 3D model-based stage previews): drag to orbit around the model, Shift-drag or right-drag to pan, mouse wheel to zoom, and a built-in reset button, all fully usable from the keyboard alone. Shows a clear message instead of a broken view when the browser doesn't support WebGL, and never hijacks the page's own scroll.
- A reusable undo/redo history primitive: register an action's do/undo pair, then undo or redo it, including a long chain of consecutive actions in the right order. Rapid repeated edits of the same kind (like dragging a value) merge into a single undo step instead of one per intermediate change, and the history size is capped so it can't grow without bound during a long editing session.
- A remappable keyboard shortcut manager and a shared panel: register named actions with a default key, and let users rebind any of them through the panel, remembered across visits. Reusing a key another action already owns never silently overwrites it — the panel names the other action and offers to swap the two keys instead. A modifier pressed alone, or a combo the browser reserves for itself, is rejected with a clear message. A reset control brings a changed action back to its default key.
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

Wrap any 3D-rendering preview (e.g. a `<canvas>` running three.js) in `<wuik-viewport-3d>` to get drag-to-orbit, pan, and zoom for free — it never touches your renderer, it only tracks the camera and hands you the numbers:

```html
<wuik-viewport-3d style="width: 400px; height: 300px;">
  <canvas width="400" height="300"></canvas>
</wuik-viewport-3d>
```

```js
const viewport3d = document.querySelector("wuik-viewport-3d");
viewport3d.addEventListener("wuik-viewport3d-change", (e) => {
  const { target, distance, azimuth, elevation, position } = e.detail;
  // apply position/target to your own 3D camera
});
```

Drag the primary button to orbit, Shift-drag or drag with the right button to pan, and scroll to zoom once focused. A built-in "Reset view" button and a one-time on-screen hint are included, and a clear message is shown instead of a broken view when the browser doesn't support WebGL. Fully keyboard-operable once focused: arrow keys orbit, Shift+arrow keys pan, `+`/`-` zoom, `0`/`Home` resets to the default view. See [docs/api.md](docs/api.md) for the full attribute/method/event/keyboard reference.

Use `CommandStack` to give your app undo/redo: register a `do`/`undo` pair for each action, and let the stack track history for you.

```js
import { CommandStack } from "@openkakutou/web-ui-kit";

const history = new CommandStack();

history.push({
  do: () => (model.name = "New name"),
  undo: () => (model.name = "Old name"),
});

history.undo(); // reverts to "Old name"
history.redo(); // re-applies "New name"
```

Pass a `coalesceKey` to merge rapid repeated edits (like dragging a slider) into a single undo step, so `undo()` reverts back to before the whole gesture instead of one intermediate value at a time:

```js
history.push({ coalesceKey: "drag", do: () => (model.x = 10), undo: () => (model.x = 0) });
history.push({ coalesceKey: "drag", do: () => (model.x = 20), undo: () => (model.x = 0) });
history.undo(); // model.x is back to 0, not 10
```

See [docs/api.md](docs/api.md) for the full API, including the configurable history size limit and coalesce time window.

Use `ShortcutManager` together with `<wuik-shortcuts-panel>` to give your app remappable keyboard shortcuts:

```js
import { ShortcutManager } from "@openkakutou/web-ui-kit";

const shortcuts = new ShortcutManager({ storageKey: "my-app-shortcuts" });
shortcuts.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
shortcuts.register({ id: "export", label: "Export", defaultKey: "Ctrl+E" });

shortcuts.addEventListener("change", (e) => console.log(e.detail)); // { id, key }
```

```html
<wuik-shortcuts-panel id="shortcuts-panel"></wuik-shortcuts-panel>
```

```js
document.getElementById("shortcuts-panel").manager = shortcuts;
```

The panel lists every registered action and lets the user rebind it: click Rebind, then press the new key combination (or Escape to cancel). Rebound keys persist automatically (via `localStorage`, under the `storageKey` you pass — use a different key per app if more than one app shares an origin) and are restored the next time the manager is created. If a key is already used by another action, the panel names it and offers to swap the two bindings instead of silently overwriting one; a modifier pressed alone or a browser-reserved combo is rejected with a message instead of being accepted. A "Reset" control appears next to any action that no longer matches its default. See [docs/api.md](docs/api.md) for the full API.
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
- [docs/api.md](docs/api.md) — the package's public exports, the layout components and form/input components (slots, attributes, events, keyboard behavior), and the full design token reference (names, values, theme switching)
- [docs/releasing.md](docs/releasing.md) — how a version tag turns into a published npm release, and the safety checks that run before publishing
- [docs/testing.md](docs/testing.md) — how the test suite is organized and run, including how CSS custom-property tokens are verified
<!-- vibe:end:docs-index -->
