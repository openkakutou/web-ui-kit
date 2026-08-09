import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./file-drop-zone.ts";

function hostStyleText(element: Element): string {
  return element.shadowRoot?.querySelector("style")?.textContent ?? "";
}

function mountDropZone(attributes: Record<string, string> = {}): HTMLElement {
  const zone = document.createElement("wuik-file-drop-zone");
  for (const [name, value] of Object.entries(attributes)) {
    zone.setAttribute(name, value);
  }
  document.body.appendChild(zone);
  return zone;
}

function makeFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

/** jsdom's DragEvent does not implement DataTransfer, so it is stubbed directly. */
function dispatchDrop(zone: Element, files: File[]): void {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: { files },
  });
  zone.shadowRoot?.querySelector('[role="button"]')?.dispatchEvent(event);
}

describe("wuik-file-drop-zone", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("is keyboard-operable: focusing it and pressing Enter opens the file picker with no drag involved", () => {
    const zone = mountDropZone();
    const zoneButton = zone.shadowRoot?.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    const input = zone.shadowRoot?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    zoneButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("opens the file picker on Space as well as Enter", () => {
    const zone = mountDropZone();
    const zoneButton = zone.shadowRoot?.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    const input = zone.shadowRoot?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    zoneButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );

    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("emits wuik-files-selected with the accepted files when a matching file is dropped", () => {
    const zone = mountDropZone({ accept: ".png" });
    const handler = vi.fn();
    zone.addEventListener("wuik-files-selected", handler);

    dispatchDrop(zone, [makeFile("photo.png", "image/png")]);

    expect(handler).toHaveBeenCalledOnce();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.files).toHaveLength(1);
    expect(detail.files[0].name).toBe("photo.png");
  });

  it("shows a visible rejected state and does not emit an event when the dropped file does not match accept (edge case)", () => {
    const zone = mountDropZone({ accept: ".png" });
    const handler = vi.fn();
    zone.addEventListener("wuik-files-selected", handler);

    dispatchDrop(zone, [makeFile("document.pdf", "application/pdf")]);

    expect(handler).not.toHaveBeenCalled();
    const wrapper = zone.shadowRoot?.querySelector(".zone") as HTMLElement;
    expect(wrapper.classList.contains("is-rejected")).toBe(true);
    const status = zone.shadowRoot?.querySelector(
      '[role="status"]',
    ) as HTMLElement;
    expect(status.textContent).toMatch(/rejected/i);
  });

  it("keeps only the first file when multiple is not set, and emits it (edge case)", () => {
    const zone = mountDropZone();
    const handler = vi.fn();
    zone.addEventListener("wuik-files-selected", handler);

    dispatchDrop(zone, [
      makeFile("one.txt", "text/plain"),
      makeFile("two.txt", "text/plain"),
    ]);

    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.files).toHaveLength(1);
    expect(detail.files[0].name).toBe("one.txt");
  });

  it("keeps every accepted file when multiple is set", () => {
    const zone = mountDropZone({ multiple: "" });
    const handler = vi.fn();
    zone.addEventListener("wuik-files-selected", handler);

    dispatchDrop(zone, [
      makeFile("one.txt", "text/plain"),
      makeFile("two.txt", "text/plain"),
    ]);

    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.files).toHaveLength(2);
  });

  it("does not throw when a drop carries no files at all (error path)", () => {
    const zone = mountDropZone();
    expect(() => dispatchDrop(zone, [])).not.toThrow();
  });

  it("ignores drops and keyboard activation entirely while disabled (error path)", () => {
    const zone = mountDropZone({ disabled: "" });
    const handler = vi.fn();
    zone.addEventListener("wuik-files-selected", handler);
    const zoneButton = zone.shadowRoot?.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    const input = zone.shadowRoot?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    expect(zoneButton.getAttribute("tabindex")).toBe("-1");
    expect(zoneButton.getAttribute("aria-disabled")).toBe("true");

    zoneButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    dispatchDrop(zone, [makeFile("photo.png", "image/png")]);

    expect(clickSpy).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("is a focusable, real interactive element by default", () => {
    const zone = mountDropZone();
    const zoneButton = zone.shadowRoot?.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    expect(zoneButton.getAttribute("tabindex")).toBe("0");
  });

  describe("token-based styling (verified structurally — see decision 006)", () => {
    it("references the danger color token for the rejected state", () => {
      const zone = mountDropZone();
      const css = hostStyleText(zone);
      expect(css).toContain("--wuik-color-danger");
    });

    it("references the accent color token for the drag-over state", () => {
      const zone = mountDropZone();
      const css = hostStyleText(zone);
      expect(css).toContain("--wuik-color-accent");
    });

    it("references the focus ring token", () => {
      const zone = mountDropZone();
      const css = hostStyleText(zone);
      expect(css).toContain("--wuik-color-focus-ring");
    });

    it("never hardcodes a literal color", () => {
      const zone = mountDropZone();
      const css = hostStyleText(zone);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    });
  });
});
