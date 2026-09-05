import "../src/tokens/index.css";
import "../src/components/panel.ts";
import "../src/components/toolbar.ts";
import "../src/components/tabs.ts";
import "../src/components/app-shell.ts";
import "../src/components/file-drop-zone.ts";
import "../src/components/radio-group.ts";
import "../src/components/slider.ts";
import "../src/components/color-picker.ts";
import "../src/components/button.ts";
import "../src/components/dialog.ts";
import "../src/canvas/viewport.ts";
import "../src/canvas3d/viewport-3d.ts";
import "../src/shortcuts/shortcut-panel.ts";
import "../src/i18n/locale-switcher.ts";
import { initI18n } from "../src/i18n/i18n.ts";
import { ShortcutManager } from "../src/shortcuts/shortcut-manager.ts";

document.querySelector("#theme-toggle").addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark",
  );
});

const app = document.querySelector("#app");

app.insertAdjacentHTML(
  "beforeend",
  `
  <h2>App shells</h2>
  <div id="section-app-shells">
    <div style="height: 300px; border: 1px dashed gray;">
      <wuik-app-shell id="shell-full">
        <wuik-toolbar slot="toolbar">
          <button type="button">New</button>
          <button type="button">Save</button>
        </wuik-toolbar>
        <wuik-panel slot="sidebar">
          <span slot="header">Navigation</span>
          <p>Sidebar content</p>
        </wuik-panel>
        <wuik-tabs>
          <wuik-tab-panel label="Details">Main details content</wuik-tab-panel>
          <wuik-tab-panel label="History">Main history content</wuik-tab-panel>
        </wuik-tabs>
      </wuik-app-shell>
    </div>

    <div style="height: 150px; border: 1px dashed gray;">
      <wuik-app-shell id="shell-empty-slots">
        <p>Main content only, no toolbar or sidebar slotted.</p>
      </wuik-app-shell>
    </div>
  </div>

  <h2>Toolbar (narrow, many buttons — should scroll, not clip)</h2>
  <div id="section-toolbar" style="max-width: 300px;">
    <wuik-toolbar id="toolbar-narrow">
      <button type="button">New</button>
      <button type="button">Open</button>
      <button type="button">Save</button>
      <button type="button">Save As</button>
      <button type="button">Export</button>
      <button type="button">Print</button>
    </wuik-toolbar>
  </div>

  <h2>Tabs</h2>
  <div id="section-tabs">
    <wuik-tabs id="tabs-demo">
      <wuik-tab-panel label="Details">Details content</wuik-tab-panel>
      <wuik-tab-panel label="History">History content</wuik-tab-panel>
      <wuik-tab-panel label="Settings">Settings content</wuik-tab-panel>
    </wuik-tabs>
  </div>

  <h2>Panels</h2>
  <div id="section-panels">
    <wuik-panel id="panel-with-header">
      <span slot="header">Settings</span>
      <p>This panel has a header and some body text.</p>
    </wuik-panel>

    <wuik-panel id="panel-without-header">
      <p>This panel has no header slotted — there should be no empty header row or seam above this text.</p>
    </wuik-panel>
  </div>

  <h2>File drop-zones</h2>
  <div id="section-drop-zones">
    <wuik-file-drop-zone id="drop-zone-default" style="max-width: 400px;"></wuik-file-drop-zone>
    <p id="drop-zone-default-result"></p>

    <wuik-file-drop-zone id="drop-zone-images" accept=".png,.jpg" multiple style="max-width: 400px;">
      Drop image files here (PNG or JPG only)
    </wuik-file-drop-zone>
    <p id="drop-zone-images-result"></p>

    <wuik-file-drop-zone id="drop-zone-disabled" disabled style="max-width: 400px;"></wuik-file-drop-zone>
  </div>

  <h2>Radio groups</h2>
  <div id="section-radio-groups">
    <wuik-radio-group id="radio-group-default" label="Which file is the lifebar?" value="fight.def" style="max-width: 400px;">
      <wuik-radio-option value="fight.def">fight.def</wuik-radio-option>
      <wuik-radio-option value="fight2.def">fight2.def</wuik-radio-option>
      <wuik-radio-option value="fight3.def">fight3.def</wuik-radio-option>
    </wuik-radio-group>
    <p id="radio-group-default-result"></p>

    <wuik-radio-group id="radio-group-invalid" label="Duplicate values demo" style="max-width: 400px;">
      <wuik-radio-option value="a">Option A</wuik-radio-option>
      <wuik-radio-option value="a">Option A (duplicate)</wuik-radio-option>
    </wuik-radio-group>

    <wuik-radio-group id="radio-group-disabled" label="Disabled demo" value="b" disabled style="max-width: 400px;">
      <wuik-radio-option value="a">Option A</wuik-radio-option>
      <wuik-radio-option value="b">Option B</wuik-radio-option>
    </wuik-radio-group>
  </div>

  <h2>Sliders</h2>
  <div id="section-sliders">
    <wuik-slider id="slider-default" style="max-width: 400px;"></wuik-slider>
    <p id="slider-default-result"></p>

    <wuik-slider id="slider-custom" min="10" max="20" step="2" value="14" style="max-width: 400px;"></wuik-slider>
    <wuik-slider id="slider-invalid" min="10" max="5" style="max-width: 400px;"></wuik-slider>
    <wuik-slider id="slider-disabled" disabled value="30" style="max-width: 400px;"></wuik-slider>
  </div>

  <h2>Color pickers</h2>
  <div id="section-color-pickers">
    <wuik-color-picker id="color-picker-default" value="#2563eb" palette="#dc2626,#16a34a,#2563eb,#d97706"></wuik-color-picker>
    <p id="color-picker-result"></p>

    <wuik-color-picker id="color-picker-invalid" value="not-a-color"></wuik-color-picker>
    <wuik-color-picker id="color-picker-disabled" disabled value="#2563eb" palette="#dc2626"></wuik-color-picker>
  </div>

  <h2>Buttons (variants)</h2>
  <div id="section-buttons">
    <wuik-button id="button-primary" variant="primary">Primary</wuik-button>
    <wuik-button id="button-secondary" variant="secondary">Secondary</wuik-button>
    <wuik-button id="button-danger" variant="danger">Delete</wuik-button>
    <wuik-button id="button-disabled" disabled>Disabled</wuik-button>
    <wuik-button id="button-empty"></wuik-button>
    <wuik-button id="button-pressed-primary" pressed>Bold</wuik-button>
    <wuik-button id="button-pressed-secondary" variant="secondary" pressed>Italic</wuik-button>
    <wuik-button id="button-pressed-danger" variant="danger" pressed>Mute</wuik-button>
    <wuik-button id="button-pressed-disabled" pressed disabled>Bold</wuik-button>
    <p id="button-click-result"></p>
  </div>

  <h2>Dialogs</h2>
  <div id="section-dialogs">
    <button type="button" id="dialog-trigger-default">Open dialog</button>
    <wuik-dialog id="dialog-default">
      <span slot="heading">Preferences</span>
      <p>Some preferences content.</p>
      <label>Name <input id="dialog-default-input" /></label>
      <button type="button" id="dialog-default-save">Save</button>
    </wuik-dialog>

    <button type="button" id="dialog-trigger-no-heading">Open dialog without heading (should warn)</button>
    <wuik-dialog id="dialog-no-heading">
      <p>This dialog has no slotted heading — it should log a console warning and have no aria-labelledby.</p>
    </wuik-dialog>

    <button type="button" id="dialog-trigger-confirm">Open confirmation dialog (no other focusable content)</button>
    <wuik-dialog id="dialog-confirm">
      <span slot="heading">Delete item?</span>
      <p>This cannot be undone.</p>
    </wuik-dialog>
    <p id="dialog-result"></p>
  </div>

  <h2>Viewport (2D zoom/pan control)</h2>
  <div id="section-viewport" style="width: 300px; height: 200px; border: 1px dashed gray;">
    <wuik-viewport id="viewport-demo" label="Sprite preview" style="width: 100%; height: 100%;">
      <div style="width: 200px; height: 150px; background: linear-gradient(135deg, #2563eb, #16a34a);"></div>
    </wuik-viewport>
  </div>

  <h2>Viewport 3D (orbit/pan/zoom control)</h2>
  <div id="section-viewport-3d" style="width: 300px; height: 200px; border: 1px dashed gray;">
    <wuik-viewport-3d id="viewport-3d-demo" label="3D model preview" style="width: 100%; height: 100%;"></wuik-viewport-3d>
  </div>

  <h2>Shortcuts panel</h2>
  <div id="section-shortcuts">
    <wuik-shortcuts-panel id="shortcuts-demo"></wuik-shortcuts-panel>
  </div>

  <h2>Locale switcher</h2>
  <div id="section-locale">
    <wuik-locale-switcher id="locale-demo"></wuik-locale-switcher>
  </div>
  `,
);

document.querySelector("#button-primary").addEventListener("click", () => {
  document.querySelector("#button-click-result").textContent =
    "Primary button clicked";
});

document
  .querySelector("#color-picker-default")
  .addEventListener("wuik-change", (event) => {
    document.querySelector("#color-picker-result").textContent =
      `Selected: ${event.detail.value}`;
  });

document
  .querySelector("#radio-group-default")
  .addEventListener("wuik-change", (event) => {
    document.querySelector("#radio-group-default-result").textContent =
      `Selected: ${event.detail.value}`;
  });

document
  .querySelector("#slider-default")
  .addEventListener("wuik-input", (event) => {
    document.querySelector("#slider-default-result").textContent =
      `Live value: ${event.detail.value}`;
  });

document
  .querySelector("#drop-zone-default")
  .addEventListener("wuik-files-selected", (event) => {
    document.querySelector("#drop-zone-default-result").textContent =
      `Selected: ${event.detail.files.map((file) => file.name).join(", ")}`;
  });

document
  .querySelector("#drop-zone-images")
  .addEventListener("wuik-files-selected", (event) => {
    document.querySelector("#drop-zone-images-result").textContent =
      `Selected: ${event.detail.files.map((file) => file.name).join(", ")}`;
  });

document
  .querySelector("#dialog-trigger-default")
  .addEventListener("click", () => {
    document.querySelector("#dialog-default").showModal();
  });
document
  .querySelector("#dialog-trigger-no-heading")
  .addEventListener("click", () => {
    document.querySelector("#dialog-no-heading").showModal();
  });
document
  .querySelector("#dialog-trigger-confirm")
  .addEventListener("click", () => {
    document.querySelector("#dialog-confirm").showModal();
  });
document.querySelector("#dialog-default-save").addEventListener("click", () => {
  document.querySelector("#dialog-default").close();
});
for (const id of ["dialog-default", "dialog-no-heading", "dialog-confirm"]) {
  document.querySelector(`#${id}`).addEventListener("wuik-close", (event) => {
    document.querySelector("#dialog-result").textContent =
      `${id} closed: ${event.detail.reason}`;
  });
}

const shortcutManager = new ShortcutManager({
  storageKey: "dev-preview-shortcuts",
});
shortcutManager.register({ id: "save", label: "Save", defaultKey: "Ctrl+S" });
shortcutManager.register({ id: "undo", label: "Undo", defaultKey: "Ctrl+Z" });
shortcutManager.register({ id: "redo", label: "Redo", defaultKey: "Ctrl+Y" });
document.querySelector("#shortcuts-demo").manager = shortcutManager;

initI18n({
  namespace: "devpreview",
  resources: {
    en: { devpreview: {} },
    fr: { devpreview: {} },
  },
}).then((instance) => {
  document.querySelector("#locale-demo").i18n = instance;
});
