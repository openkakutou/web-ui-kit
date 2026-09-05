import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./radio-group.ts";
import { WuikRadioGroupElement } from "./radio-group.ts";

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeOption(value: string, label: string): HTMLElement {
  const option = document.createElement("wuik-radio-option");
  option.setAttribute("value", value);
  option.textContent = label;
  return option;
}

function mountRadioGroup(
  options: Array<{ value: string; label: string }>,
  attributes: Record<string, string> = {},
): WuikRadioGroupElement {
  const element = new WuikRadioGroupElement();
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  for (const option of options) {
    element.appendChild(makeOption(option.value, option.label));
  }
  document.body.appendChild(element);
  return element;
}

function radios(element: WuikRadioGroupElement): HTMLInputElement[] {
  return Array.from(
    element.shadowRoot?.querySelectorAll('input[type="radio"]') ?? [],
  );
}

describe("<wuik-radio-group>", () => {
  let element: WuikRadioGroupElement | undefined;

  beforeEach(async () => {
    element = undefined;
    await tick();
  });

  afterEach(() => {
    element?.remove();
  });

  it("renders one labelled radio per option and exposes the selected value", async () => {
    element = mountRadioGroup(
      [
        { value: "fight.def", label: "fight.def" },
        { value: "fight2.def", label: "fight2.def" },
      ],
      { value: "fight.def" },
    );
    await tick();

    const inputs = radios(element);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].closest("label")?.textContent).toContain("fight.def");
    expect(inputs[1].closest("label")?.textContent).toContain("fight2.def");
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
    expect(element.value).toBe("fight.def");
  });

  it("selecting a new option deselects the previous one and fires wuik-change", async () => {
    element = mountRadioGroup(
      [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      { value: "a" },
    );
    await tick();

    const events: string[] = [];
    element.addEventListener("wuik-change", (event) => {
      events.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    const inputs = radios(element);
    inputs[1].click();

    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
    expect(element.value).toBe("b");
    expect(events).toEqual(["b"]);
  });

  it("ArrowDown moves and commits selection to the next option, wrapping past the last", async () => {
    element = mountRadioGroup(
      [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
        { value: "c", label: "C" },
      ],
      { value: "c" },
    );
    await tick();

    const events: string[] = [];
    element.addEventListener("wuik-change", (event) => {
      events.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    const lastRadio = radios(element)[2];
    lastRadio.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );

    expect(element.value).toBe("a");
    expect(events).toEqual(["a"]);
    expect(radios(element)[0].checked).toBe(true);
  });

  it("defaults the roving tab-stop to the first option when value matches none", async () => {
    element = mountRadioGroup(
      [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      { value: "does-not-exist" },
    );
    await tick();

    const inputs = radios(element);
    expect(inputs.every((input) => !input.checked)).toBe(true);
    expect(inputs[0].tabIndex).toBe(0);
    expect(inputs[1].tabIndex).toBe(-1);
  });

  it("drops an option with no value attribute while still rendering the rest", async () => {
    element = mountRadioGroup([{ value: "a", label: "A" }]);
    element.appendChild(makeOption("", "No value"));
    element.appendChild(makeOption("b", "B"));
    document.body.appendChild(element);
    await tick();

    const inputs = radios(element);
    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.value)).toEqual(["a", "b"]);
  });

  it("shows a visible invalid state naming the duplicated value when two options share it", async () => {
    element = mountRadioGroup([
      { value: "a", label: "First" },
      { value: "a", label: "Second" },
    ]);
    await tick();

    const group = element.shadowRoot?.querySelector(
      '[role="radiogroup"]',
    ) as HTMLElement;
    expect(group.classList.contains("is-invalid")).toBe(true);
    expect(group.getAttribute("aria-invalid")).toBe("true");
    const error = element.shadowRoot?.querySelector(
      '[role="status"]',
    ) as HTMLElement;
    expect(error.textContent).toContain("a");
    expect(radios(element)).toHaveLength(1);
  });

  it("disabled group forwards disabled to every radio, removes them from the tab order, and ignores clicks/keys", async () => {
    element = mountRadioGroup(
      [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      { value: "a", disabled: "" },
    );
    await tick();

    const inputs = radios(element);
    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(inputs.every((input) => input.tabIndex === -1)).toBe(true);

    const events: string[] = [];
    element.addEventListener("wuik-change", (event) => {
      events.push((event as CustomEvent<{ value: string }>).detail.value);
    });
    inputs[1].click();
    inputs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );

    expect(element.value).toBe("a");
    expect(events).toEqual([]);
  });
});
