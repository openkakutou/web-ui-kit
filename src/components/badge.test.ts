import { afterEach, describe, expect, it } from "vitest";
import "../tokens/index.css";
import "./badge.ts";

function mountBadge(attributes: Record<string, string> = {}): HTMLElement {
  const badge = document.createElement("wuik-badge");
  for (const [name, value] of Object.entries(attributes)) {
    badge.setAttribute(name, value);
  }
  document.body.appendChild(badge);
  return badge;
}

function part(host: Element, selector: string): HTMLElement {
  return host.shadowRoot?.querySelector(selector) as HTMLElement;
}

describe("wuik-badge", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows the count and defaults to the neutral variant", () => {
    const host = mountBadge({ count: "3" });
    expect(part(host, ".count").textContent).toBe("3");
    expect(part(host, ".badge").classList.contains("neutral")).toBe(true);
  });

  it("hides the visible glyphs from assistive technology and exposes the label instead", () => {
    const host = mountBadge({
      count: "2",
      label: "2 errors",
      variant: "error",
    });
    expect(part(host, ".badge").getAttribute("aria-hidden")).toBe("true");
    expect(part(host, ".sr").textContent).toBe("2 errors");
  });

  it("falls back to the count as accessible text when no label is given", () => {
    const host = mountBadge({ count: "7" });
    expect(part(host, ".sr").textContent).toBe("7");
  });

  it("adds a non-colour shape cue for warning and success", () => {
    expect(
      part(mountBadge({ variant: "warning", count: "1" }), ".mark").textContent,
    ).toBe("!");
    expect(
      part(mountBadge({ variant: "success", count: "1" }), ".mark").textContent,
    ).toBe("✓");
    expect(
      part(mountBadge({ variant: "error", count: "1" }), ".mark").textContent,
    ).toBe("");
  });

  it("falls back to neutral for an unrecognized variant (error path)", () => {
    const host = mountBadge({ variant: "purple", count: "1" });
    expect(part(host, ".badge").classList.contains("neutral")).toBe(true);
  });

  it("updates in place when attributes change at runtime", () => {
    const host = mountBadge({ count: "1", variant: "error" });
    host.setAttribute("count", "4");
    host.setAttribute("variant", "warning");
    expect(part(host, ".count").textContent).toBe("4");
    expect(part(host, ".badge").classList.contains("warning")).toBe(true);
  });

  it("takes its colours from tokens, never literals", () => {
    const css =
      mountBadge().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(css).toContain("--wuik-color-error");
    expect(css).toContain("--wuik-color-warning");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
