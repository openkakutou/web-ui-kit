/** `<wuik-checkbox>`; behaviour in `toggle-base.ts`. */

import { WuikToggleElement } from "./toggle-base.ts";

export class WuikCheckboxElement extends WuikToggleElement {
  protected readonly kind = "checkbox" as const;
}

if (!customElements.get("wuik-checkbox")) {
  customElements.define("wuik-checkbox", WuikCheckboxElement);
}
