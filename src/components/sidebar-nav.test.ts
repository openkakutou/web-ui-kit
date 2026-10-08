import { afterEach, describe, expect, it, vi } from "vitest";
import "../tokens/index.css";
import "./sidebar-nav.ts";
import type { WuikSidebarNavElement } from "./sidebar-nav.ts";

function mountNav(
  attributes: Record<string, string> = {},
): WuikSidebarNavElement {
  const nav = document.createElement(
    "wuik-sidebar-nav",
  ) as WuikSidebarNavElement;
  nav.setAttribute("label", "Sections");
  nav.innerHTML = `
    <wuik-nav-group label="Character">
      <wuik-nav-item value="identity" shortcut="1" current>Identity</wuik-nav-item>
    </wuik-nav-group>
    <wuik-nav-group label="Logic">
      <wuik-nav-item value="states" shortcut="5">States</wuik-nav-item>
      <wuik-nav-item value="commands" shortcut="6" badge-error="2" badge-warning="1" badge-label="2 errors, 1 warning">Commands</wuik-nav-item>
    </wuik-nav-group>`;
  for (const [name, value] of Object.entries(attributes)) {
    nav.setAttribute(name, value);
  }
  document.body.appendChild(nav);
  return nav;
}

const item = (nav: Element, value: string) =>
  nav.querySelector(`wuik-nav-item[value="${value}"]`) as HTMLElement;
const button = (el: Element) =>
  el.shadowRoot?.querySelector("button") as HTMLButtonElement;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("wuik-sidebar-nav", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is a nav landmark named by its label", () => {
    const nav = mountNav();
    const landmark = nav.shadowRoot?.querySelector("nav") as HTMLElement;
    expect(landmark.getAttribute("aria-label")).toBe("Sections");
  });

  it("marks only the current item with aria-current=page", () => {
    const nav = mountNav();
    expect(button(item(nav, "identity")).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(button(item(nav, "states")).hasAttribute("aria-current")).toBe(
      false,
    );
  });

  it("labels each group and exposes it as a named group", () => {
    const nav = mountNav();
    const group = nav.querySelector("wuik-nav-group") as HTMLElement;
    const title = group.shadowRoot?.querySelector(".title") as HTMLElement;
    const items = group.shadowRoot?.querySelector(".items") as HTMLElement;
    expect(title.textContent).toBe("Character");
    expect(items.getAttribute("role")).toBe("group");
    expect(items.getAttribute("aria-labelledby")).toBe(title.id);
  });

  it("emits a cancelable wuik-navigate with the item value and moves current", async () => {
    const nav = mountNav();
    const handler = vi.fn();
    nav.addEventListener("wuik-navigate", handler);
    button(item(nav, "states")).click();
    await tick();
    expect(handler.mock.calls[0][0].detail).toEqual({ value: "states" });
    expect(nav.current).toBe("states");
    expect(item(nav, "identity").hasAttribute("current")).toBe(false);
  });

  it("leaves current untouched when wuik-navigate is cancelled (edge case)", async () => {
    const nav = mountNav();
    nav.addEventListener("wuik-navigate", (event) => event.preventDefault());
    button(item(nav, "states")).click();
    await tick();
    expect(nav.current).toBe("identity");
  });

  it("sets current programmatically and clears it with null", () => {
    const nav = mountNav();
    nav.current = "commands";
    expect(item(nav, "commands").hasAttribute("current")).toBe(true);
    nav.current = null;
    expect(nav.current).toBeNull();
  });

  it("shows error and warning badges and speaks them as part of the item name", () => {
    const nav = mountNav();
    const commands = item(nav, "commands");
    const sr = commands.shadowRoot?.querySelector(".badge-sr") as HTMLElement;
    expect(sr.textContent).toBe(", 2 errors, 1 warning");
    const badges = commands.shadowRoot?.querySelectorAll(
      "wuik-badge",
    ) as NodeListOf<HTMLElement>;
    expect(badges[0].hidden).toBe(false);
    expect(badges[0].getAttribute("count")).toBe("2");
    expect(badges[1].getAttribute("count")).toBe("1");
  });

  it("shows no badge and no spoken suffix when counts are zero or malformed (edge/error case)", () => {
    const nav = mountNav();
    const states = item(nav, "states");
    states.setAttribute("badge-error", "0");
    states.setAttribute("badge-warning", "many");
    const badges = states.shadowRoot?.querySelectorAll(
      "wuik-badge",
    ) as NodeListOf<HTMLElement>;
    expect(badges[0].hidden).toBe(true);
    expect(badges[1].hidden).toBe(true);
    expect(states.shadowRoot?.querySelector(".badge-sr")?.textContent).toBe("");
  });

  it("advertises the Alt+digit shortcut for assistive technology", () => {
    const nav = mountNav();
    expect(button(item(nav, "states")).getAttribute("aria-keyshortcuts")).toBe(
      "Alt+5",
    );
  });

  it("collapses to a rail: propagates collapsed to items and keeps the name as a tooltip", async () => {
    const nav = mountNav();
    nav.setAttribute("collapsed", "");
    await tick();
    expect(item(nav, "states").hasAttribute("collapsed")).toBe(true);
    expect(button(item(nav, "states")).title).toBe("States (Alt+5)");
    nav.removeAttribute("collapsed");
    await tick();
    expect(item(nav, "states").hasAttribute("collapsed")).toBe(false);
    expect(button(item(nav, "states")).hasAttribute("title")).toBe(false);
  });

  it("does not navigate from a disabled item (error path)", () => {
    const nav = mountNav();
    const handler = vi.fn();
    nav.addEventListener("wuik-navigate", handler);
    item(nav, "states").setAttribute("disabled", "");
    button(item(nav, "states")).click();
    expect(handler).not.toHaveBeenCalled();
  });
});
