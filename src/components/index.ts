/**
 * Barrel: importing this module registers every layout-shell custom element
 * (each source module self-registers via `customElements.define` on
 * import) and re-exports their classes for consumers that want the types.
 */
export { WuikAppShellElement } from "./app-shell.ts";
export { WuikPanelElement } from "./panel.ts";
export { WuikTabPanelElement, WuikTabsElement } from "./tabs.ts";
export { WuikToolbarElement } from "./toolbar.ts";
