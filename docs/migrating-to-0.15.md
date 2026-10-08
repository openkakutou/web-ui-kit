# Migrating to 0.15

0.15 is a visual redesign ("Studio", `.vibe/decisions/025-studio-visual-direction-and-token-redesign.md`).
It is breaking for apps that read the kit's tokens. Apps pinned to `^0.13` or
`^0.14` do not receive it automatically; migrate when you choose to bump.

## 1. Rename the color tokens

| Old | New |
|---|---|
| `--wuik-color-accent` | `--wuik-color-primary` |
| `--wuik-color-text-on-accent` | `--wuik-color-on-primary` |
| `--wuik-color-danger` | `--wuik-color-error` |
| `--wuik-color-text-on-danger` | `--wuik-color-on-error` |
| `--wuik-color-text-secondary` | `--wuik-color-text-muted` |
| `--wuik-color-focus-ring` | `--wuik-color-focus` |

`bg`, `surface`, `border`, `text`, `success` and `warning` keep their names.
From the app's root:

```sh
grep -rlE -- '--wuik-color-(accent|text-on-accent|danger|text-on-danger|text-secondary|focus-ring)' src \
  | xargs sed -i -E \
    -e 's/--wuik-color-text-on-accent/--wuik-color-on-primary/g' \
    -e 's/--wuik-color-text-on-danger/--wuik-color-on-error/g' \
    -e 's/--wuik-color-text-secondary/--wuik-color-text-muted/g' \
    -e 's/--wuik-color-accent/--wuik-color-primary/g' \
    -e 's/--wuik-color-danger/--wuik-color-error/g' \
    -e 's/--wuik-color-focus-ring/--wuik-color-focus/g'
```

## 2. Pick the theme explicitly

Dark is now the default. An app that wants light must set
`data-theme="light"` on the root element; one that toggles between the two should
treat "no attribute" as dark.

## 3. Use the new tokens instead of local literals

- Corner radii: `--wuik-radius-control`, `-button`, `-card`, `-pill` (stop reusing
  `--wuik-space-*` as radii).
- Border widths: `--wuik-border-width`, `--wuik-border-width-strong`.
- Control edges (inputs, buttons): `--wuik-color-border-control`, not
  `--wuik-color-border`, which is for dividers.
- Focus ring: `--wuik-focus-ring-width` and `--wuik-focus-ring-offset`.
- Control sizes: `--wuik-control-height-sm`, `--wuik-control-height`, `--wuik-control-height-lg`, `--wuik-target-min` for the minimum
  pointer target.

## 4. Re-check the layout

The body font is now 14 px (was 16 px) and controls are 34 px tall; fixed widths
in `em` and any layout tuned to the old sizes need a visual pass. Regenerate your
visual-regression baselines.
