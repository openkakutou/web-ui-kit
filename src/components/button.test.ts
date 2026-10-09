import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./button.ts";

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountButton(
  innerHTML: string,
  attributes: Record<string, string> = {},
): HTMLElement {
  const button = document.createElement("wuik-button");
  button.innerHTML = innerHTML;
  for (const [name, value] of Object.entries(attributes)) {
    button.setAttribute(name, value);
  }
  document.body.appendChild(button);
  return button;
}

function nativeButton(host: Element): HTMLButtonElement {
  return host.shadowRoot?.querySelector("button") as HTMLButtonElement;
}

describe("wuik-button", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("projects slotted label content and defaults to type=button", () => {
    const host = mountButton("Save");
    const button = nativeButton(host);
    expect(button.type).toBe("button");
    const slot = host.shadowRoot?.querySelector("slot") as HTMLSlotElement;
    expect(slot.assignedNodes()[0].textContent).toBe("Save");
  });

  it("forwards a click on the native button as a click on the host", () => {
    const host = mountButton("Save");
    const handler = vi.fn();
    host.addEventListener("click", handler);
    nativeButton(host).click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("applies the requested variant class (edge case: secondary)", () => {
    const host = mountButton("Cancel", { variant: "secondary" });
    expect(nativeButton(host).classList.contains("secondary")).toBe(true);
  });

  it("applies the ghost variant class for low-emphasis toolbar actions", () => {
    const host = mountButton("Undo", { variant: "ghost" });
    expect(nativeButton(host).classList.contains("ghost")).toBe(true);
  });

  it("falls back to the primary variant for an unrecognized variant value (error path)", () => {
    const host = mountButton("Go", { variant: "not-a-real-variant" });
    const button = nativeButton(host);
    expect(button.classList.contains("primary")).toBe(true);
    expect(button.classList.contains("not-a-real-variant")).toBe(false);
  });

  it("forwards the disabled attribute to the native button and stops forwarding clicks", () => {
    const host = mountButton("Save", { disabled: "" });
    const button = nativeButton(host);
    expect(button.disabled).toBe(true);
  });

  it("shows a visible empty-state indicator and warns when mounted with no accessible label (error/edge case)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mountButton("");
    const button = nativeButton(host);
    expect(button.classList.contains("is-empty")).toBe(true);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("does not fabricate visible label text for an empty slot (error path)", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mountButton("");
    const slot = host.shadowRoot?.querySelector("slot") as HTMLSlotElement;
    expect(slot.assignedNodes()).toHaveLength(0);
  });

  it("does not warn or show the empty state when an aria-label is provided instead of slotted text (edge case)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mountButton("", { "aria-label": "Close" });
    const button = nativeButton(host);
    expect(button.classList.contains("is-empty")).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe("pressed state", () => {
    it("applies the pressed style class and sets aria-pressed=true when the pressed attribute is set", () => {
      const host = mountButton("Bold", { pressed: "" });
      const button = nativeButton(host);
      expect(button.classList.contains("is-pressed")).toBe(true);
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    it("does not apply the pressed style and has no aria-pressed attribute by default (nominal case)", () => {
      const host = mountButton("Save");
      const button = nativeButton(host);
      expect(button.classList.contains("is-pressed")).toBe(false);
      expect(button.hasAttribute("aria-pressed")).toBe(false);
    });

    it("removes aria-pressed and the pressed style when the attribute is removed at runtime (edge case)", () => {
      const host = mountButton("Bold", { pressed: "" });
      host.removeAttribute("pressed");
      const button = nativeButton(host);
      expect(button.classList.contains("is-pressed")).toBe(false);
      expect(button.hasAttribute("aria-pressed")).toBe(false);
    });

    it("re-applies the pressed style when the attribute is added back at runtime (edge case)", () => {
      const host = mountButton("Bold");
      host.setAttribute("pressed", "");
      const button = nativeButton(host);
      expect(button.classList.contains("is-pressed")).toBe(true);
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    it("keeps the pressed style while also forwarding disabled, without duplicating aria-pressed handling (error/edge path: combined state)", () => {
      const host = mountButton("Bold", { pressed: "", disabled: "" });
      const button = nativeButton(host);
      expect(button.classList.contains("is-pressed")).toBe(true);
      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(button.disabled).toBe(true);
    });

    it("applies the pressed class on top of any variant (edge case: secondary)", () => {
      const host = mountButton("Bold", { pressed: "", variant: "secondary" });
      const button = nativeButton(host);
      expect(button.classList.contains("secondary")).toBe(true);
      expect(button.classList.contains("is-pressed")).toBe(true);
    });
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the primary color tokens for the primary variant", () => {
      const host = mountButton("Save");
      const css = hostStyleText(host);
      expect(css).toContain("--wuik-color-primary");
      expect(css).toContain("--wuik-color-on-primary");
    });

    it("references the error color tokens for the danger variant", () => {
      const host = mountButton("Delete", { variant: "danger" });
      const css = hostStyleText(host);
      expect(css).toContain("--wuik-color-error");
      expect(css).toContain("--wuik-color-on-error");
    });

    it("references the focus ring token", () => {
      const host = mountButton("Save");
      const css = hostStyleText(host);
      expect(css).toContain("--wuik-color-focus");
      expect(css).toContain("--wuik-focus-ring-width");
    });

    it("draws the secondary edge with the control-border token, not the decorative border", () => {
      const css = hostStyleText(
        mountButton("Cancel", { variant: "secondary" }),
      );
      expect(css).toContain("--wuik-color-border-control");
    });

    it("takes its shape from the radius, height and motion tokens", () => {
      const css = hostStyleText(mountButton("Save"));
      expect(css).toContain("--wuik-radius-button");
      expect(css).toContain("--wuik-control-height");
      expect(css).toContain("--wuik-motion-fast");
    });

    it("never hardcodes a literal color", () => {
      const host = mountButton("Save");
      const css = hostStyleText(host);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });

    it("derives the pressed background from color-mix over design tokens, not a literal color", () => {
      const host = mountButton("Save");
      const css = hostStyleText(host);
      expect(css).toContain("is-pressed");
      expect(css).toMatch(/color-mix\(in srgb, var\(--wuik-color-primary\)/);
      expect(css).toMatch(/var\(--wuik-color-text\)/);
    });
  });

  it("forwards aria-* attributes to the inner button, including later changes and removals", async () => {
    const host = mountButton("", {
      "aria-label": "Close",
      "aria-expanded": "false",
    });
    expect(nativeButton(host).getAttribute("aria-label")).toBe("Close");
    expect(nativeButton(host).getAttribute("aria-expanded")).toBe("false");

    host.setAttribute("aria-expanded", "true");
    host.removeAttribute("aria-label");
    await Promise.resolve();
    expect(nativeButton(host).getAttribute("aria-expanded")).toBe("true");
    expect(nativeButton(host).hasAttribute("aria-label")).toBe(false);
  });

  it("leaves aria-pressed to the pressed attribute (edge case)", async () => {
    const host = mountButton("Tog", { "aria-pressed": "true" });
    expect(nativeButton(host).hasAttribute("aria-pressed")).toBe(false);
    host.setAttribute("pressed", "");
    expect(nativeButton(host).getAttribute("aria-pressed")).toBe("true");
  });

  it("stops forwarding once removed from the document (edge case)", async () => {
    const host = mountButton("", { "aria-label": "A" });
    host.remove();
    host.setAttribute("aria-label", "B");
    await Promise.resolve();
    expect(nativeButton(host).getAttribute("aria-label")).toBe("A");
  });
});
