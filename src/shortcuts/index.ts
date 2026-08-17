/**
 * Barrel: importing this module registers the `<wuik-shortcuts-panel>`
 * custom element (self-registers via `customElements.define` on import)
 * and re-exports the headless `ShortcutManager` it's driven by.
 */
export { ShortcutManager } from "./shortcut-manager.ts";
export type {
  RebindOptions,
  RebindResult,
  ShortcutAction,
  ShortcutBinding,
  ShortcutChangeDetail,
  ShortcutManagerOptions,
} from "./shortcut-manager.ts";
export { WuikShortcutsPanelElement } from "./shortcut-panel.ts";
