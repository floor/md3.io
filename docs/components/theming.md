---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Theming

A theme in mtrl is a set of CSS custom properties: one per Material 3 colour role, named
`--mtrl-sys-color-<role>`. `primary`, `on-primary`, `primary-container`, the surfaces, the
outlines and the rest are the roles M3 defines, and the components take their colours from
them. Changing a theme changes those properties and nothing else, so it needs no
JavaScript and no rebuild, and it reaches the web components too, since custom properties
inherit into shadow roots.

The baseline declares M3's 45 roles, light and dark, and each theme sets them for its own
palette. [Styles › Color](/styles/color/) shows them all, in every shipped theme.

## The baseline

The base stylesheet, which every app imports once, holds M3's baseline theme (primary
`#6750A4`) on `:root`, with the type, shape and state tokens:

```typescript
import 'mtrl/styles/base';
```

With nothing else, the whole page uses the baseline, light or dark as the system prefers.

## Another theme

A theme is one more import, and it applies wherever an element names it with `data-theme`.
`data-theme-mode="dark"` on the same element switches it to its dark roles:

```typescript
import 'mtrl/themes/ocean';

document.documentElement.dataset.theme = 'ocean';
document.documentElement.dataset.themeMode = 'dark';
```

The attributes work on any element, not only `<html>`. The roles are custom properties, so
everything inside the element takes the theme and the rest of the page keeps its own. A preview
panel, a sidebar or a dark header can each have a theme:

```html
<header data-theme="ocean" data-theme-mode="dark">
  <m-button variant="filled">Sign in</m-button>
</header>
<main>…</main>
```

`data-theme-mode` belongs on the element that has `data-theme`: the dark roles are declared for
the two together. The theme files are not in a cascade layer while the base styles are, so a
theme wins over the baseline whatever order the stylesheets load in.

## Dark mode

The baseline follows the system: `mtrl/styles/base` sets its dark roles on `:root` under
`@media (prefers-color-scheme: dark)`. A named theme doesn't. Once `data-theme` is set, its
light roles apply until `data-theme-mode="dark"` asks for the dark ones, and that includes
`data-theme="baseline"`, which is how an app offers a light setting on a dark system. To follow
the system with another theme, keep the attribute in step with the media query:

```typescript
const dark = matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;

const follow = () => { root.dataset.themeMode = dark.matches ? 'dark' : 'light'; };
follow();
dark.addEventListener('change', follow);
```

Removing `data-theme` returns the page to the baseline and to the system's mode.

## The shipped themes

Each theme is its own entry, `mtrl/themes/<name>`, so an app only loads the one it uses.

- **M3's scheme variants.** `neutral`, `vibrant`, `expressive`, `fidelity`, `content`,
  `monochrome`, `rainbow` and `fruit-salad` are M3's dynamic-scheme variants, generated with
  Google's colour library from the baseline seed. The baseline is the ninth, Tonal Spot. They
  exist only as their own entries, never in the full stylesheet.
- **mtrl's own themes.** `ocean`, `forest`, `spring`, `sunset` and `autumn` are set by hand;
  `desert`, `summer`, `brownbeige`, `sageivory` and `tealcaramel` are generated from a seed and
  keep a second colour of their own as the secondary, with every text pair at 4.5:1 or more.
- **High contrast.** `highcontrast` is M3's high-contrast scheme from the baseline seed, with
  7:1 or more on every text pair.
- **Deprecated.** `material`, `winter`, `browngreen` and `legacy` still work in 0.10 and go in
  1.0. Use `baseline` for `material`, `ocean` for `winter` and `brownbeige` for `browngreen`;
  `legacy` has no replacement.

The full stylesheet, `mtrl/styles`, already contains the baseline, mtrl's own themes, high
contrast and the deprecated four, so with it only the scheme variants need an import.

## Your own theme

### From a seed colour

M3 builds a whole scheme from one colour. Google's
[material-color-utilities](https://github.com/material-foundation/material-color-utilities) does
the colour science, and `schemeToTokens` from `mtrl/core/theme` turns a light and a dark scheme
into mtrl's custom properties. It is the function mtrl's own themes are generated with, so a
theme you make this way declares exactly what a shipped one does. It takes the role names
kebab-case or camelCase, and throws if a role is missing or isn't a `#rrggbb` colour.

A function that installs a theme under a name you pick:

```typescript
import { schemeToTokens, type SchemeRoles } from 'mtrl/core/theme';

function installTheme(name: string, light: SchemeRoles, dark: SchemeRoles) {
  const tokens = schemeToTokens({ light, dark });
  const block = (declarations: Record<string, string>) =>
    Object.entries(declarations).map(([property, value]) => `${property}: ${value};`).join(' ');
  const style = document.createElement('style');
  style.textContent = `[data-theme="${name}"] { ${block(tokens.light)} }
[data-theme="${name}"][data-theme-mode="dark"] { ${block(tokens.dark)} }`;
  document.head.append(style);
}
```

The schemes come from the colour library, which is your app's dependency, not mtrl's
(`npm install @material/material-color-utilities`). This block is marked as a sketch because the
docs check doesn't install that library; it type-checks against its 0.4 release:

```typescript fragment
import { argbFromHex, hexFromArgb, Hct, SchemeTonalSpot, type DynamicScheme } from '@material/material-color-utilities';
import { THEME_ROLES } from 'mtrl/core/theme';

// A scheme's colour for each role mtrl sets; the library names them in camelCase
const roles = (scheme: DynamicScheme) => Object.fromEntries(THEME_ROLES.map((role) => {
  const getter = role.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase()) as keyof DynamicScheme;
  return [role, hexFromArgb(scheme[getter] as number)];
}));

const seed = Hct.fromInt(argbFromHex('#0b57d0'));
installTheme('brand', roles(new SchemeTonalSpot(seed, false, 0)), roles(new SchemeTonalSpot(seed, true, 0)));
document.documentElement.dataset.theme = 'brand';
```

`SchemeVibrant`, `SchemeExpressive` and the other variants take the same arguments, and the
last one is the contrast level: `1` gives a high-contrast scheme. The same tokens can be written
to a `.css` file at build time instead.

### By hand

A theme is only CSS, so you can write one. Roles you leave out inherit from the page, so a
brand colour can change just the primary family and keep the baseline's surfaces:

```css
[data-theme="brand"] {
  --mtrl-sys-color-primary: #0b57d0;
  --mtrl-sys-color-on-primary: #ffffff;
  --mtrl-sys-color-primary-container: #d8e2ff;
  --mtrl-sys-color-on-primary-container: #001a41;
}

[data-theme="brand"][data-theme-mode="dark"] {
  --mtrl-sys-color-primary: #adc6ff;
  --mtrl-sys-color-on-primary: #002e69;
  --mtrl-sys-color-primary-container: #004494;
  --mtrl-sys-color-on-primary-container: #d8e2ff;
}
```

Keep each pair's contrast at 4.5:1 or more, as the shipped themes do; picking the tones from a
tonal palette, as the seed route does, gets it for free.

## Colour with transparency

A tinted or translucent role is `color-mix`, as mtrl's own styles do it:

```css
.selected-row {
  background: color-mix(in srgb, var(--mtrl-sys-color-primary) 12%, transparent);
}
```

The `--mtrl-sys-color-<role>-rgb` twins, written for `rgba(var(…), a)`, were removed in 0.10.
`rgba(var(--mtrl-sys-color-primary-rgb), 0.12)` becomes the rule above, the alpha as a
percentage.

## The other tokens

The base stylesheet also puts M3's system tokens on `:root`:

- **Type scale:** `--mtrl-sys-typescale-<role>-font`, `-font-size`, `-line-height`,
  `-letter-spacing` and `-font-weight` for every role from `display-large` to `label-small`.
  The fonts come from two faces, `--mtrl-ref-typeface-brand` (display, headline, title) and
  `--mtrl-ref-typeface-plain` (body, label). The typescale classes (`.mtrl-body-large`) and the
  document's headings and paragraphs read them, so one face set on `:root` reaches all of them.
- **Shape:** `--mtrl-sys-shape-corner-<step>`, from `none` (0) through `small` (8px),
  `medium` (12px) and `extra-large` (28px) to `full`.
- **State layers:** `--mtrl-sys-state-hover-state-layer-opacity` (0.08), and the `focus`,
  `pressed` and `dragged` opacities.

```css
:root {
  --mtrl-ref-typeface-brand: "Google Sans", "Roboto", sans-serif;
}

.promo-card {
  border-radius: var(--mtrl-sys-shape-corner-extra-large);
  font: var(--mtrl-sys-typescale-title-large-font-weight) var(--mtrl-sys-typescale-title-large-font-size) / var(--mtrl-sys-typescale-title-large-line-height) var(--mtrl-sys-typescale-title-large-font);
}
```

The components compile their own type, shape and state values in, so these tokens style your
own CSS and the typescale classes; the components' colours are the part a theme changes.
[Styles › Typography](/styles/typography/) shows the whole type scale.
