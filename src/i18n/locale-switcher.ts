/**
 * `<wuik-locale-switcher>` — a small toolbar-style control listing every
 * locale available on an initialized i18next instance and switching the
 * active one when the user picks a different one.
 *
 * Takes its instance through a JS property (`switcher.i18n = instance`),
 * not an attribute — an i18next instance cannot be serialized into one,
 * same reasoning as `<wuik-shortcuts-panel>.manager`. A plain native
 * `<select>` in shadow DOM, mirroring `<wuik-slider>`/`<wuik-color-picker>`
 * wrapping a native control rather than reimplementing listbox keyboard
 * behavior — a locale list has no styling need that would justify that
 * cost. Locale names are shown as endonyms ("Français", not "French") so a
 * user recognizes their own language regardless of the UI's current one.
 */

import type { i18n as I18nInstance } from "i18next";
import { getSupportedLocales } from "./i18n.ts";
import { localeDisplayName } from "./locale-names.ts";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--wuik-font-family-base);
      font-size: var(--wuik-font-size-base);
      color: var(--wuik-color-text);
      /* The dropdown *panel* is OS-drawn and outside this kit's CSS reach
         (shadow DOM cannot style it) — color-scheme is set on :root
         (tokens/colors.css) keyed off the same data-theme attribute as
         every other token, and inherits down into this shadow tree, so
         that OS chrome doesn't render mismatched against the active
         theme. Nothing to redeclare here. */
    }

    select {
      min-width: 6rem;
      max-width: 12rem;
      font: inherit;
      color: var(--wuik-color-text);
      background: var(--wuik-color-surface);
      border: 1px solid var(--wuik-color-border);
      border-radius: 4px;
      padding: var(--wuik-space-1) var(--wuik-space-2);
      cursor: pointer;
    }

    select:focus-visible {
      outline: 2px solid var(--wuik-color-focus-ring);
      outline-offset: 2px;
    }

    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
  <select></select>
`;

export class WuikLocaleSwitcherElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "disabled"];
  }

  readonly #select: HTMLSelectElement;
  #i18n: I18nInstance | undefined;

  readonly #handleLanguageChanged = (): void => {
    this.#renderSelection();
  };

  readonly #handleChange = (): void => {
    const value = this.#select.value;
    void this.#i18n?.changeLanguage(value);
    this.dispatchEvent(
      new CustomEvent("wuik-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#select = shadow.querySelector("select") as HTMLSelectElement;
    this.#select.addEventListener("change", this.#handleChange);
  }

  connectedCallback(): void {
    this.#renderAttributes();
  }

  attributeChangedCallback(): void {
    this.#renderAttributes();
  }

  disconnectedCallback(): void {
    this.#i18n?.off("languageChanged", this.#handleLanguageChanged);
  }

  get i18n(): I18nInstance | undefined {
    return this.#i18n;
  }

  set i18n(next: I18nInstance | undefined) {
    this.#i18n?.off("languageChanged", this.#handleLanguageChanged);
    this.#i18n = next;
    this.#i18n?.on("languageChanged", this.#handleLanguageChanged);
    this.#renderOptions();
  }

  #renderAttributes(): void {
    const label = this.getAttribute("label");
    if (label) {
      this.#select.setAttribute("aria-label", label);
    } else {
      this.#select.removeAttribute("aria-label");
    }
    this.#select.disabled = this.hasAttribute("disabled");
  }

  #renderOptions(): void {
    this.#select.innerHTML = "";
    if (this.#i18n === undefined) {
      return;
    }
    for (const code of getSupportedLocales(this.#i18n).sort()) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = localeDisplayName(code);
      this.#select.appendChild(option);
    }
    this.#renderSelection();
  }

  #renderSelection(): void {
    if (this.#i18n === undefined) {
      return;
    }
    this.#select.value = this.#i18n.resolvedLanguage ?? this.#i18n.language;
  }
}

if (!customElements.get("wuik-locale-switcher")) {
  customElements.define("wuik-locale-switcher", WuikLocaleSwitcherElement);
}
