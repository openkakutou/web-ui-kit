import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./section-header.ts";

function mountHeader(
  attributes: Record<string, string> = {},
  innerHTML = "",
): HTMLElement {
  const header = document.createElement("wuik-section-header");
  header.innerHTML = innerHTML;
  for (const [name, value] of Object.entries(attributes)) {
    header.setAttribute(name, value);
  }
  document.body.appendChild(header);
  return header;
}

const heading = (host: Element) =>
  host.shadowRoot?.querySelector(".heading") as HTMLElement;
const description = (host: Element) =>
  host.shadowRoot?.querySelector(".description") as HTMLElement;

describe("wuik-section-header", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the heading as a level-1 heading by default", () => {
    const host = mountHeader({ heading: "Animations" });
    expect(heading(host).getAttribute("role")).toBe("heading");
    expect(heading(host).getAttribute("aria-level")).toBe("1");
    expect(heading(host).textContent).toBe("Animations");
  });

  it("honours a valid level and falls back to 1 for an invalid one (error path)", () => {
    expect(
      heading(mountHeader({ heading: "A", level: "2" })).getAttribute(
        "aria-level",
      ),
    ).toBe("2");
    expect(
      heading(mountHeader({ heading: "B", level: "9" })).getAttribute(
        "aria-level",
      ),
    ).toBe("1");
    expect(
      heading(mountHeader({ heading: "C", level: "x" })).getAttribute(
        "aria-level",
      ),
    ).toBe("1");
  });

  it("makes the heading programmatically focusable and focusHeading() moves focus to it", () => {
    const host = mountHeader({ heading: "Sprites" }) as HTMLElement & {
      focusHeading(): void;
    };
    expect(heading(host).getAttribute("tabindex")).toBe("-1");
    host.focusHeading();
    expect(host.shadowRoot?.activeElement).toBe(heading(host));
  });

  it("shows the description attribute text", () => {
    const host = mountHeader({
      heading: "Sons",
      description: "Les sons du personnage.",
    });
    expect(description(host).hidden).toBe(false);
    expect(description(host).textContent).toContain("Les sons du personnage.");
  });

  it("hides the description wrapper when there is neither text nor slotted content (edge case)", () => {
    const host = mountHeader({ heading: "Sons" });
    expect(description(host).hidden).toBe(true);
  });

  it("exposes help and actions slots", () => {
    const host = mountHeader(
      { heading: "États" },
      '<wuik-help-hint slot="help"></wuik-help-hint><button slot="actions">Ajouter</button>',
    );
    expect(host.shadowRoot?.querySelector('slot[name="help"]')).not.toBeNull();
    expect(
      host.shadowRoot?.querySelector('slot[name="actions"]'),
    ).not.toBeNull();
  });

  it("updates in place when the heading changes at runtime", () => {
    const host = mountHeader({ heading: "Old" });
    host.setAttribute("heading", "New");
    expect(heading(host).textContent).toBe("New");
  });
});
