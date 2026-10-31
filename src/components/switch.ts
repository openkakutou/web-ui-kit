/** `<wuik-switch>`; rejects `indeterminate`. Behaviour in `toggle-base.ts`. */

import { WuikToggleElement } from "./toggle-base.ts";

export class WuikSwitchElement extends WuikToggleElement {
  protected readonly kind = "switch" as const;

  protected override supportsIndeterminate(): boolean {
    return false;
  }
}

if (!customElements.get("wuik-switch")) {
  customElements.define("wuik-switch", WuikSwitchElement);
}
