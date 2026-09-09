/**
 * `<wuik-spinner>` — a visual loading indicator: a CSS-animated rotating
 * ring. Decorative by default (`aria-hidden="true"`), meant to be dropped
 * inside a consumer's own existing `role="status"` live region without
 * causing a duplicate screen-reader announcement. When an accessible
 * `label` is provided, the host loses `aria-hidden` and exposes
 * `aria-label` instead, for standalone use with no surrounding live region
 * of its own — the consumer is still responsible for announcing state
 * changes (e.g. loading -> done) if it needs that.
 *
 * `size` is an enum (`sm` | `md` | `lg`); an unrecognized value falls back
 * to `md`, mirroring `wuik-button`'s `variant` fallback (no warning logged
 * — an out-of-range decorative default is not a misuse case worth
 * flagging).
 *
 * An empty or whitespace-only `label` is treated the same as no `label` at
 * all (stays decorative) rather than exposing a blank accessible name — see
 * `.vibe/decisions/022-spinner-empty-label-treated-as-absent.md`.
 *
 * The ring's rotation slows under `prefers-reduced-motion: reduce` instead
 * of freezing outright, so it keeps signalling "loading" for motion-
 * sensitive users instead of looking stuck — see
 * `.vibe/decisions/023-spinner-reduced-motion-slows-not-freezes.md`.
 *
 * All visual styling comes from `--wuik-*` design tokens, so a consumer
 * never needs to write CSS for it to look correct in either theme.
 */

const SIZES = new Set(["sm", "md", "lg"]);
const DEFAULT_SIZE = "md";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-block;
      line-height: 0;
    }

    .ring {
      display: inline-block;
      box-sizing: border-box;
      border-radius: 50%;
      border-style: solid;
      border-color: var(--wuik-color-border);
      border-top-color: var(--wuik-color-accent);
      animation: wuik-spinner-rotate 0.8s linear infinite;
    }

    .ring.sm {
      width: 1rem;
      height: 1rem;
      border-width: 2px;
    }

    .ring.md {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 3px;
    }

    .ring.lg {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 4px;
    }

    @keyframes wuik-spinner-rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ring {
        animation-duration: 3s;
      }
    }
  </style>
  <span class="ring" aria-hidden="true"></span>
`;

export class WuikSpinnerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["size", "label"];
  }

  readonly #ring: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this.#ring = shadow.querySelector(".ring") as HTMLElement;
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    const requestedSize = this.getAttribute("size") ?? DEFAULT_SIZE;
    const size = SIZES.has(requestedSize) ? requestedSize : DEFAULT_SIZE;
    this.#ring.classList.remove(...SIZES);
    this.#ring.classList.add(size);

    const label = this.getAttribute("label")?.trim() ?? "";
    if (label.length > 0) {
      this.removeAttribute("aria-hidden");
      this.setAttribute("aria-label", label);
    } else {
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }
}

if (!customElements.get("wuik-spinner")) {
  customElements.define("wuik-spinner", WuikSpinnerElement);
}
