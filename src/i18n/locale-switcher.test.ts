import type { i18n as I18nInstance } from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { initI18n } from "./i18n.ts";
import { WuikLocaleSwitcherElement } from "./locale-switcher.ts";

async function makeInstance(namespace = "demo-app"): Promise<I18nInstance> {
  return initI18n({
    namespace,
    resources: { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } },
  });
}

describe("<wuik-locale-switcher>", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists every supported locale by its endonym and selects the active one", async () => {
    const instance = await makeInstance();
    const switcher = new WuikLocaleSwitcherElement();
    switcher.i18n = instance;

    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => ({
      value: o.value,
      label: o.textContent,
    }));

    expect(options).toEqual([
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ]);
    expect(select.value).toBe(instance.resolvedLanguage);
  });

  it("changes the instance's language and fires wuik-change when the user picks a different option", async () => {
    const instance = await makeInstance();
    await instance.changeLanguage("en");
    const switcher = new WuikLocaleSwitcherElement();
    switcher.i18n = instance;
    document.body.appendChild(switcher);

    const events: string[] = [];
    switcher.addEventListener("wuik-change", (event) => {
      events.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;
    select.value = "fr";
    select.dispatchEvent(new Event("change"));
    // changeLanguage() is async — flush its microtask before asserting.
    await Promise.resolve();
    await Promise.resolve();

    expect(events).toEqual(["fr"]);
    expect(instance.resolvedLanguage).toBe("fr");

    document.body.removeChild(switcher);
  });

  it("reflects a locale change made elsewhere (not through the switcher) without rebuilding the option list", async () => {
    const instance = await makeInstance();
    await instance.changeLanguage("en");
    const switcher = new WuikLocaleSwitcherElement();
    switcher.i18n = instance;
    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;
    const optionCountBefore = select.options.length;

    await instance.changeLanguage("fr");

    expect(select.value).toBe("fr");
    expect(select.options.length).toBe(optionCountBefore);
  });

  it("forwards the label attribute to the select's accessible name, and fabricates none when omitted", async () => {
    const switcher = new WuikLocaleSwitcherElement();
    document.body.appendChild(switcher);
    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;

    expect(select.hasAttribute("aria-label")).toBe(false);

    switcher.setAttribute("label", "Language");
    expect(select.getAttribute("aria-label")).toBe("Language");

    document.body.removeChild(switcher);
  });

  it("disables the select when the disabled attribute is set", async () => {
    const switcher = new WuikLocaleSwitcherElement();
    document.body.appendChild(switcher);
    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;

    switcher.setAttribute("disabled", "");
    expect(select.disabled).toBe(true);

    document.body.removeChild(switcher);
  });

  it("renders no options and does not throw when no instance is assigned", () => {
    const switcher = new WuikLocaleSwitcherElement();
    document.body.appendChild(switcher);
    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;

    expect(select.options.length).toBe(0);
    expect(() => switcher.setAttribute("label", "Language")).not.toThrow();

    document.body.removeChild(switcher);
  });

  it("stops reacting to a previous instance's language changes once reassigned to a new one", async () => {
    const first = await makeInstance("app-a");
    const second = await makeInstance("app-b");
    await first.changeLanguage("en");
    await second.changeLanguage("en");

    const switcher = new WuikLocaleSwitcherElement();
    switcher.i18n = first;
    switcher.i18n = second;

    await first.changeLanguage("fr");

    const select = switcher.shadowRoot?.querySelector(
      "select",
    ) as HTMLSelectElement;
    expect(select.value).toBe("en");
  });
});
