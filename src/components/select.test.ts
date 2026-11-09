import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./select.ts";

function mountSelect(
  attributes: Record<string, string> = {},
  options = '<option value="en">English</option><option value="fr">Français</option>',
): HTMLElement {
  const select = document.createElement("wuik-select");
  select.innerHTML = options;
  for (const [name, value] of Object.entries(attributes)) {
    select.setAttribute(name, value);
  }
  document.body.appendChild(select);
  return select;
}

const native = (host: Element) =>
  host.shadowRoot?.querySelector("select") as HTMLSelectElement;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("wuik-select", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mirrors the light-DOM options into a native select", () => {
    const host = mountSelect();
    expect(Array.from(native(host).options).map((o) => o.value)).toEqual([
      "en",
      "fr",
    ]);
    expect(native(host).options[1].textContent).toBe("Français");
  });

  it("ties a visible label to the native select", () => {
    const host = mountSelect({ label: "Language" });
    const label = host.shadowRoot?.querySelector("label") as HTMLLabelElement;
    expect(label.hidden).toBe(false);
    expect(label.htmlFor).toBe(native(host).id);
    expect(label.textContent).toContain("Language");
  });

  it("applies the value attribute and exposes the value property", () => {
    const host = mountSelect({ value: "fr" }) as HTMLElement & {
      value: string;
    };
    expect(host.value).toBe("fr");
    host.value = "en";
    expect(native(host).value).toBe("en");
  });

  it("emits wuik-change with the new value when the user picks an option", () => {
    const host = mountSelect();
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).value = "fr";
    native(host).dispatchEvent(new Event("change"));
    expect(handler.mock.calls[0][0].detail).toEqual({ value: "fr" });
  });

  it("re-mirrors options added at runtime (edge case)", async () => {
    const host = mountSelect();
    const option = document.createElement("option");
    option.value = "ja";
    option.textContent = "日本語";
    host.appendChild(option);
    await flush();
    expect(Array.from(native(host).options).map((o) => o.value)).toContain(
      "ja",
    );
  });

  it("links a consumer error to the control and marks it invalid", () => {
    const host = mountSelect({ error: "Choose a language." });
    expect(native(host).getAttribute("aria-invalid")).toBe("true");
    const error = host.shadowRoot?.querySelector(".error") as HTMLElement;
    expect(error.textContent).toBe("Choose a language.");
    expect(native(host).getAttribute("aria-describedby")).toBe(error.id);
    host.removeAttribute("error");
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
  });

  it("disables the control and suppresses change events and errors when disabled (error path)", () => {
    const host = mountSelect({ disabled: "", error: "Nope" });
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).dispatchEvent(new Event("change"));
    expect(native(host).disabled).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    expect(native(host).hasAttribute("aria-invalid")).toBe(false);
  });

  it("forwards aria-label to the native select when there is no visible label", () => {
    const host = mountSelect({ "aria-label": "Animation" });
    expect(native(host).getAttribute("aria-label")).toBe("Animation");
    host.setAttribute("aria-label", "Clip");
    expect(native(host).getAttribute("aria-label")).toBe("Clip");
  });

  it("removes the native aria-label live when the attribute is removed (edge case)", () => {
    const host = mountSelect({ "aria-label": "Animation" });
    host.removeAttribute("aria-label");
    expect(native(host).hasAttribute("aria-label")).toBe(false);
  });

  it("lets a visible label take precedence over aria-label (edge case)", () => {
    const host = mountSelect({ label: "Language", "aria-label": "Other" });
    expect(native(host).hasAttribute("aria-label")).toBe(false);
  });

  it("never exposes an empty aria-label (error path)", () => {
    const host = mountSelect({ "aria-label": "   " });
    expect(native(host).hasAttribute("aria-label")).toBe(false);
  });

  it("selects nothing when the value matches no option (edge case)", () => {
    const host = mountSelect({ value: "zz" }) as HTMLElement & {
      value: string;
    };
    expect(host.value).toBe("");
    expect(native(host).selectedIndex).toBe(-1);
  });

  it("supports an empty-value option as a placeholder", () => {
    const host = mountSelect(
      {},
      '<option value="">— none —</option><option value="a">A</option>',
    );
    expect((host as HTMLElement & { value: string }).value).toBe("");
    expect(native(host).selectedIndex).toBe(0);
    const handler = vi.fn();
    host.addEventListener("wuik-change", handler);
    native(host).value = "a";
    native(host).dispatchEvent(new Event("change"));
    expect(handler.mock.calls[0][0].detail).toEqual({ value: "a" });
  });

  it("keeps the inner select within its host width", () => {
    const css = native(mountSelect())
      .ownerDocument.querySelector("wuik-select")
      ?.shadowRoot?.querySelector("style")?.textContent;
    expect(css).toMatch(/select\s*{[^}]*min-width:\s*0/);
    expect(css).toMatch(/select\s*{[^}]*max-width:\s*100%/);
  });

  it("flags a required field for assistive technology", () => {
    const host = mountSelect({ required: "", label: "Language" });
    expect(native(host).getAttribute("aria-required")).toBe("true");
  });
});
