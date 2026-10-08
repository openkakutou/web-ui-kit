import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./toast.ts";
import type { WuikToastRegionElement } from "./toast.ts";

function mountRegion(): WuikToastRegionElement {
  const region = document.createElement(
    "wuik-toast-region",
  ) as WuikToastRegionElement;
  document.body.appendChild(region);
  return region;
}

describe("wuik-toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("is announced as a status for non-error variants and as an alert for errors", () => {
    const region = mountRegion();
    expect(
      region
        .show({ message: "Saved", variant: "success" })
        .getAttribute("role"),
    ).toBe("status");
    expect(
      region.show({ message: "Failed", variant: "error" }).getAttribute("role"),
    ).toBe("alert");
  });

  it("auto-dismisses after the default duration", () => {
    const region = mountRegion();
    region.show({ message: "Saved" });
    vi.advanceTimersByTime(4999);
    expect(region.children).toHaveLength(1);
    vi.advanceTimersByTime(2);
    expect(region.children).toHaveLength(0);
  });

  it("keeps errors on screen until dismissed (edge case)", () => {
    const region = mountRegion();
    region.show({ message: "Export failed", variant: "error" });
    vi.advanceTimersByTime(60_000);
    expect(region.children).toHaveLength(1);
  });

  it("keeps a toast whose duration is 0 and honours an explicit duration on errors", () => {
    const region = mountRegion();
    region.show({ message: "Sticky", duration: 0 });
    region.show({ message: "Brief error", variant: "error", duration: 1000 });
    vi.advanceTimersByTime(1001);
    expect(region.children).toHaveLength(1);
    expect(region.textContent).toContain("Sticky");
  });

  it("pauses the timer while hovered and resumes on leave", () => {
    const region = mountRegion();
    const toast = region.show({ message: "Saved", duration: 1000 });
    toast.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(5000);
    expect(region.children).toHaveLength(1);
    toast.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(1001);
    expect(region.children).toHaveLength(0);
  });

  it("dismisses with the button and emits wuik-dismiss", () => {
    const region = mountRegion();
    const toast = region.show({ message: "Saved", duration: 0 });
    const handler = vi.fn();
    region.addEventListener("wuik-dismiss", handler);
    (toast.shadowRoot?.querySelector("button") as HTMLButtonElement).click();
    expect(handler).toHaveBeenCalledOnce();
    expect(region.children).toHaveLength(0);
  });

  it("gives the dismiss button an accessible name", () => {
    const toast = mountRegion().show({ message: "Saved" });
    expect(
      toast.shadowRoot?.querySelector("button")?.getAttribute("aria-label"),
    ).toBe("Dismiss");
  });

  it("falls back to info for an unrecognized variant (error path)", () => {
    const toast = mountRegion().show({ message: "Hi" });
    toast.setAttribute("variant", "neon");
    expect(
      toast.shadowRoot?.querySelector(".toast")?.classList.contains("info"),
    ).toBe(true);
  });

  it("treats a malformed duration as no auto-dismiss (error path)", () => {
    const region = mountRegion();
    const toast = region.show({ message: "Saved" });
    toast.setAttribute("duration", "soon");
    vi.advanceTimersByTime(60_000);
    expect(region.children).toHaveLength(1);
  });
});
