---
created: 2026-09-30
updated: 2026-11-10
status: published
---

# Theming

A theme in `material` is a set of CSS custom properties: one per Material 3 colour role, named
`--mtrl-sys-color-<role>`. `primary`, `on-primary`, `primary-container`, the surfaces, the
outlines and the rest are the roles M3 defines, and the components take their colours from
them. Changing a theme changes those properties and nothing else, so it needs no
JavaScript and no rebuild, and it reaches the web components too, since custom properties
inherit into shadow roots.

The baseline declares M3's 45 roles, light and dark, and each theme sets them for its own
palette. [Styles › Color](/styles/color/) shows them all, in every shipped theme.

## The baseline

The base stylesheet, loaded once per page, holds M3's baseline theme (primary
`#6750A4`) on `:root`, with the shape and state tokens. The type scale is
`material/styles/typography`:

```typescript
import 'material/styles/base';
import 'material/styles/typography';
```

With nothing else, the whole page uses the baseline, light or dark as the system prefers.

Choose one base entry for the application:

| Entry | Use when |
|-------|----------|
| `material/styles/base` | Using factories or page-level `data-ripple`; includes the global light-DOM ripple rules |
| `material/styles/base-elements` | Using elements or framework adapters, keeping the reset and system contrast response without global ripple rules |
| `material/styles/base-lite` | Using element pages that omit the reset and contrast modes |

`base-elements` keeps the baseline light/dark theme, colour, shape and typeface tokens, reset,
cascade layer order and `prefers-contrast: more` response. Each custom element already carries
its ripple rules inside its shadow root. In a Bun-minified bundle (gzip level 9), its CSS is
293 B gzip (970 B raw) smaller than `base`. Explicit `data-theme-contrast` attributes still need `material/styles/contrast`.
`base-lite` keeps the theme, tokens, body theme and reduced-motion switch, but no contrast modes.

The base holds only the three body-medium tokens the page's text reads
(`--mtrl-sys-typescale-body-medium-font`, `-font-size` and `-line-height`). Import the
typography stylesheet when the page uses the type classes or the text utilities, relies on
the heading and paragraph styles, or reads a `--mtrl-sys-typescale-*` token in its own CSS.
Without it a `.mtrl-headline-small` element keeps the body's font size, and a
`var(--mtrl-sys-typescale-*)` with no fallback is invalid at computed-value time.

The typography stylesheet has to load after the base: both style `h1` to `h6` and `p`, and the
later one wins. The import takes care of it, because the module imports the base first. If
your bundler splits the two into different chunks, make sure the base's CSS loads first: an
import order is not a CSS order in every bundler. With `<link>` tags, put
`dist/styles/typography.css` after `dist/styles/base.css`.

The `material/styles/typography` JavaScript entry imports the full base, so it removes the
`base-elements` saving. To retain the smaller base with typography, serve the standalone
`dist/styles/typography.css` after your chosen base CSS instead.

## Another theme

A theme is one more import, and it applies wherever an element names it with `data-theme`.
`data-theme-mode="dark"` on the same element switches it to its dark roles:

```typescript
import 'material/themes/ocean';

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

The baseline follows the system: `material/styles/base` sets its dark roles on `:root` under
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

Each theme is its own entry, `material/themes/<name>`, so an app only loads the one it uses.

- **M3's scheme variants.** `neutral`, `vibrant`, `expressive`, `fidelity`, `content`,
  `monochrome`, `rainbow` and `fruit-salad` are M3's dynamic-scheme variants, generated with
  Google's colour library from the baseline seed. The baseline is the ninth, Tonal Spot. They
  exist only as their own entries, never in the full stylesheet.
- **`material`'s own themes.** `ocean`, `forest`, `spring`, `sunset` and `autumn` are set by hand;
  `desert`, `summer`, `brownbeige`, `sageivory` and `tealcaramel` are generated from a seed and
  keep a second colour of their own as the secondary, with every text pair at 4.5:1 or more.
- **High contrast.** `highcontrast` is M3's high-contrast scheme from the baseline seed, with
  7:1 or more on every text pair. The base stylesheet and each theme also follow the
  operating system's `prefers-contrast: more`. To set contrast explicitly, with
  `data-theme-contrast="medium"` or `"high"`, import `material/styles/contrast` and
  `material/themes/<name>-contrast` beside the theme.

The full stylesheet, `material/styles`, already contains the baseline, `material`'s own themes and
high contrast, so with it only the scheme variants need an import. Explicit contrast is still
the separate `contrast` and `<name>-contrast` stylesheets.

### Theme origins

`material/core/theme` exports `BASELINE_SEED` (`'#6750a4'`), `THEME_ORIGINS`, `BuiltInThemeName`
and the readonly origin types (`ThemeOrigin`, `GeneratedThemeOrigin`, `BaselineThemeOrigin`,
`AuthoredThemeOrigin`, `ThemeOriginVariant`) describing how the standard palette of each of the 20
built-in themes came to be:

```typescript
import { BASELINE_SEED, THEME_ORIGINS, type BuiltInThemeName } from 'material/core/theme';

const origin = THEME_ORIGINS['desert' as BuiltInThemeName];
// { kind: 'generated', seed: '#9a7a3e', variant: 'tonal-spot', contrast: 0, secondary: '#4a87c4' }
```

Each record uses one of three shapes:

- **`generated`:** carries `seed`, `variant`, the generator's nominal `contrast` input (`0` for
  standard, `1` for `highcontrast`), and any extra `secondary` or `tertiary` seed.
- **`baseline`:** `{ kind: 'baseline', seed: '#6750a4', variant: 'tonal-spot', contrast: 0 }` —
  records its documented seed association while its standard palette is maintained as published
  tokens.
- **`authored`:** carries its documented source `seed` where recorded (`forest`, `ocean`, `spring`,
  `sunset`) and `null` where none is recorded (`autumn`), with `variant: null` and `contrast: null`
  rather than inventing an unverified recipe.

Existing palette values and theme selection are unchanged, and user contrast preferences do not
mutate these records. This is provenance data, not an active-theme detector or a promise that every
palette can be regenerated from its record. The constants live on `material/core/theme` (not root or
`material/core`), and `THEME_ORIGINS` and its records are frozen and tree-shakeable when unused.

## Contrast

Every theme supports three contrast levels. `data-theme-contrast="standard"`, `"medium"` or
`"high"` goes on the same element as `data-theme` and `data-theme-mode`:

```html
<html data-theme="desert" data-theme-mode="dark" data-theme-contrast="high">
```

The attribute is opt-in. The full stylesheet includes it; selective styles add
`material/styles/contrast` for the baseline, and `material/themes/<name>-contrast` beside
each theme. Without that import the attribute changes no colour. The operating system's
preference needs no import.

```typescript
import 'material/styles/base';
import 'material/styles/contrast';
import 'material/themes/desert';
import 'material/themes/desert-contrast';
```

How a level is chosen:

- **Without the attribute,** `prefers-contrast: more` selects high contrast, on every themed
  element independently.
- **An explicit `standard` opts out** on that element; `medium` overrides the preference too.
- **The setting does not inherit across a nested theme.** Put `data-theme-contrast` on the
  same element as each `data-theme`, nested sections included. Opting out on the root does not
  opt out a nested theme that has no `data-theme-contrast="standard"` of its own.
- **It is read where the theme is.** That is the element that carries `data-theme`, or the
  root when the page has no `data-theme`. On any other element it does nothing: that element
  inherits its themed ancestor's level.

The default baseline supports the setting without `data-theme`. On that unthemed root, both
standard and higher contrast follow the system's colour scheme and `.dark-theme`, and ignore
`data-theme-mode`.

How the levels are derived:

- Medium and high use M3's contrast levels 0.5 and 1.0.
- Hand-authored themes derive them with Tonal Spot from their documented seed, falling back
  to their light primary, and keep their light secondary and tertiary hues and chroma.
- Neutral palettes come from the seed, while standard colours stay unchanged.
- Success, warning and info are harmonised to the theme's primary, with M3 custom-colour
  contrast curves; their text pairs reach at least 4.5:1 at standard and medium contrast and
  7:1 at high contrast. See [Status colours](#status-colours) for the fixed baseline-light override.
- The `highcontrast` theme is a theme in its own right and supports all three settings.

Import `material/styles/contrast` after `material/styles/base`, as with the typography
stylesheet: the opt-in sheets share the base cascade layer, so their order inside it matters.
The contrast colours do not depend on it. An explicit level is a more specific selector than
the standard rule, and `prefers-contrast: more` is guarded by `:not([data-theme-contrast])`,
so either load order resolves the same colours.

### Status colours

The shipped themes and runtime schemes harmonise `success`, `warning` and `info` toward the
theme's primary colour. They resolve each status and its `on-*` colour with M3
[custom-colour](https://m3.material.io/styles/color/advanced/define-new-colors) contrast curves. These text pairs reach at least **4.5:1** at standard and medium contrast,
and at least **7:1** at high contrast, in both light and dark modes.

For an app fixed to the `baseline` light scheme, these overrides after the theme styles keep
the previous un-harmonised status values:

```css
:root {
  --mtrl-sys-color-success: rgb(0, 108, 78);
  --mtrl-sys-color-warning: rgb(151, 72, 0);
  --mtrl-sys-color-info: rgb(0, 97, 164);
}
```

## Runtime colour

For colour chosen while the app is running, use `material/theme`. It generates a scheme from a
seed and writes the same colour-role custom properties as the theme stylesheets. This is the
runtime counterpart to the [Material colour system](https://m3.material.io/styles/color/system/overview).
It needs no additional colour-library dependency.

```typescript
import { createScheme, applyScheme } from 'material/theme';

const runtimeScheme = createScheme('#006a6a');
applyScheme(runtimeScheme);
```

`createScheme(seed, options)` accepts a hex string, an ARGB integer or an `Hct` instance. The
options are:

| Option | Values | Default |
|--------|--------|---------|
| `variant` | A scheme factory from the table below | `tonalSpot` |
| `mode` | `'light'` or `'dark'` | `'light'` |
| `contrast` | A continuous number from `-1` (reduced) to `1` (high); `0` is standard and `0.5` is medium | `0` |

`applyScheme(scheme, target, { prefix })` writes the generated roles, including the harmonised
status colours, inline on `target`. It defaults to `document.documentElement` and the `mtrl`
prefix. Pass a section or another container as `target` to scope the scheme to its subtree;
custom properties reach the web components' shadow roots too. For a custom Sass prefix, pass
the same value as `{ prefix: 'your-prefix' }`.

### Variant factories and names

The seven factories are individual exports from `material/theme`, so unused factories can be
tree-shaken. Pass one as `variant`, for example `createScheme('#984061', { variant: expressive })`
after importing `expressive` from that entry.

| Factory | String name |
|---------|-------------|
| `tonalSpot` | `'tonal-spot'` |
| `vibrant` | `'vibrant'` |
| `expressive` | `'expressive'` |
| `fidelity` | `'fidelity'` |
| `content` | `'content'` |
| `neutral` | `'neutral'` |
| `monochrome` | `'monochrome'` |

When a control supplies a name instead of a factory, `material/theme/variants` provides
`createSchemeByName` with the same seed, mode and contrast options:

```typescript
import { createSchemeByName } from 'material/theme/variants';

const namedScheme = createSchemeByName('#6750a4', {
  variant: 'vibrant',
  mode: 'dark',
  contrast: 0.5,
});
applyScheme(namedScheme);
```

### Colour from an image

`sourceColorFromImage` is a separate import from `material/theme/image`. It returns
`Promise<Hct>` after quantising and scoring the image's colours. Pass it an image that has
loaded or finished `decode()`, with pixels the browser can read through a canvas:

```typescript
import { sourceColorFromImage } from 'material/theme/image';

async function applyImageTheme(image: HTMLImageElement, target: Element) {
  const imageSeed = await sourceColorFromImage(image);
  applyScheme(createScheme(imageSeed), target);
}
```

The image-processing code is only loaded when the app imports that entry.

### Opt into the 2025 colour specification

`material/theme` keeps the 2021 colour specification. For the 2025 implementation, import
`material/theme/2025` and pass `spec: '2025'` to its `createScheme`:

```typescript
import * as theme2025 from 'material/theme/2025';

const updatedScheme = theme2025.createScheme('#6750a4', {
  variant: theme2025.expressive,
  mode: 'dark',
  spec: '2025',
});
theme2025.applyScheme(updatedScheme);
```

The entry accepts `spec: '2021' | '2025'` on both `createScheme` and `createSchemeByName`.
Omitting `spec`, or passing `'2021'`, retains 2021 colours; the import alone changes no colours.
Four variants support 2025: `tonalSpot`, `vibrant`, `expressive` and `neutral`. `fidelity`,
`content` and `monochrome` fall back to 2021, even when `'2025'` is requested.

The 2025 implementation stays behind its separate entry: it adds **0 B** to an app that imports
only `material/theme`.

## Your own theme

### From a seed colour

For browser-time colour generation, use [Runtime colour](#runtime-colour) above. The lower-level
route here is useful when generating a named theme stylesheet at build time.

M3 builds a whole scheme from one colour. Google's
[material-color-utilities](https://github.com/material-foundation/material-color-utilities) does
the colour science, and `schemeToTokens` from `material/core/theme` turns a light and a dark scheme
into `material`'s custom properties. It is the function `material`'s own themes are generated with, so a
theme you make this way declares exactly what a shipped one does. It takes the role names
kebab-case or camelCase, and throws if a role is missing or isn't a `#rrggbb` colour.

A function that installs a theme under a name you pick:

```typescript
import { schemeToTokens, type SchemeRoles } from 'material/core/theme';

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

This build-time sketch uses `@material/material-color-utilities` as your app's own dependency
(`npm install @material/material-color-utilities`). The runtime `material/theme` API above needs
no additional package:

```typescript fragment
import { argbFromHex, hexFromArgb, Hct, SchemeTonalSpot, type DynamicScheme } from '@material/material-color-utilities';
import { THEME_ROLES } from 'material/core/theme';

// A scheme's colour for each role material sets; the library names them in camelCase
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

A tinted or translucent role is `color-mix`, as `material`'s own styles do it:

```css
.selected-row {
  background: color-mix(in srgb, var(--mtrl-sys-color-primary) 12%, transparent);
}
```

The `--mtrl-sys-color-<role>-rgb` twins, written for `rgba(var(…), a)`, were removed in 0.10.
`rgba(var(--mtrl-sys-color-primary-rgb), 0.12)` becomes the rule above, the alpha as a
percentage.

## The other tokens

`material/styles/typography`, imported with the base, puts the type scale on `:root`. The base
keeps shape and state, and body-medium's size tokens:

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

The components read the typefaces and the corner steps too, with M3's values as the fallback,
so a brand face or rounder corners set on `:root`, or on one part of the page, reach every
component there: factories and web components alike.

```css
.compact-app {
  --mtrl-ref-typeface-plain: "Inter", sans-serif;
  --mtrl-sys-shape-corner-medium: 6px;
}
```

In the prebuilt stylesheets, component type sizes, weights and state-layer opacities stay fixed to
M3's values, and a few components still draw their own corners (a dialog, a tooltip, a menu).
[Styles › Typography](/styles/typography/) shows the whole type scale.

### Typography role fallbacks

An application that compiles `material`'s Sass sources can opt into `$typescale-tokens: true` so
component text consumes the `--mtrl-sys-typescale-<role>-*` custom properties for `font`,
`font-size`, `line-height`, `letter-spacing` and `font-weight`. Each property retains its existing
value as fallback, and role fonts fall back through `--mtrl-ref-typeface-brand` or
`--mtrl-ref-typeface-plain` to the compiled family:

```scss
@use "material/src/styles/config" with ($typescale-tokens: true);
@use "material/src/styles/main";
```

Compile the application stylesheet with Dart Sass and `node_modules` on the load path:

```sh
sass --load-path=node_modules app.scss app.css
```

Override only the role properties the application wants to customize:

```css
.application {
  --mtrl-sys-typescale-label-large-font-size: 18px;
  --mtrl-sys-typescale-label-large-font-weight: 600;
}
```

- **Default profile preserved:** `$typescale-tokens` defaults to `false`; omitting it or passing
  `false` preserves the existing CSS, and there is no duplicate prebuilt stylesheet family.
  Prebuilt styles, normal framework adapter entries and default inline server rendering keep their
  current profile.
- **Partial overrides and CSS cascade:** no complete token sheet is required. Missing properties use
  their fallbacks, while values of the wrong CSS type follow normal CSS invalid-value behavior. A
  role font inherited after resolving on an ancestor keeps that ancestor's value — set the role
  font on the intended scope when changing its reference face.
- **Component details:** badge text consumes its size, line-height and weight properties while
  hidden text and dots keep zero font size; button-group pre-upgrade items use the same size role
  as their upgraded buttons.
- **Custom elements:** compile matching pre-upgrade CSS (`material/src/styles/preupgrade`) and
  shadow style keys (experimental `material/src/styles/element-styles`); see
  [Web Components](../web-components/#application-compiled-element-styles).

## Sass configuration

`material/src/styles/config` is a shared configuration gateway that emits zero CSS. Configure it
once before any Material Sass import in a compilation (`themes/*`, `main`, `elements`,
`preupgrade`, `element-styles`, or selective sheets); subsequent entries inherit the choices via
plain `@use` without another `with (...)` clause:

```scss
@use "material/src/styles/config" with (
  $contrast-emit: preference,
  $tag-prefix: "app",
  $direction-arms: true
);
@use "material/src/styles/themes/ocean";
@use "material/src/styles/main";
@use "material/src/styles/elements";
```

| Switch | Default | Documented behavior |
|--------|---------|---------------------|
| `$contrast-emit` | `all` | Selects `all`, `explicit`, `preference` or `none` contrast-rule emission. |
| `$tag-prefix` | `"m"` | Sets the tag prefix for undefined custom-element rules. |
| `$direction-arms` | `false` | When truthy, emits physical direction arms for a bundler's CSS pipeline. |
| `$typescale-tokens` | `false` | Enables the application typography profile above. |
| `$spring-tokens` | `false` | Stores a boolean configuration value only; spring emission is not delivered by the gateway itself. |

Omitting configuration preserves existing output, and loading the gateway alone adds no CSS. Both
token flags are boolean; token maps are not a supported public configuration surface (use CSS
custom properties for token values). Configuring after a dependency has loaded, or configuring both
the gateway and a later entry with `with (...)`, produces Sass's standard already-loaded error.
Standalone direct contrast (`material/src/styles/themes` or `material/src/styles/main`) and
tag-prefix (`material/src/styles/elements`) configuration remains supported when used
independently.

## Token catalogue

`material/tokens/catalogue.json` and `material/tokens/catalogue.schema.json` (packed at
`dist/tokens/catalogue.json` and `dist/tokens/catalogue.schema.json`) provide optional static JSON
describing the installed build's custom-property mappings and verification state. Resolve the
public package entries in build tooling rather than deep-importing `dist`:

```typescript fragment
import { readFileSync } from 'node:fs';

const path = Bun.resolveSync('material/tokens/catalogue.json', process.cwd());
const catalogue = JSON.parse(readFileSync(path, 'utf8'));
const verified = catalogue.tokens.filter((row: { verification: string }) => row.verification === 'verified');
```

The packed document uses schema version **2** (`schemaVersion: 2`) and records `catalogueRevision`,
`packageVersion`, `sourceCommit`, `inputsDigest`, `emissionsDigest`, the root `reasons` legend, the
retained `sources` ledger, `tokens` rows and `gaps`. Each token row carries its `cssName`,
Material's `m3Id` where evidenced, `family`, `group`, `verification` state, `reason` code and
`source` reference:

```json
{
  "cssName": "--mtrl-sys-shape-corner-large",
  "m3Id": null,
  "family": "system",
  "group": "shape",
  "verification": "verified",
  "reason": "shape-step-dp",
  "source": "m3-shape-scale"
}
```

- **Build-tool data only:** no runtime code or stylesheet imports the catalogue, so it adds `0 B`
  to any JavaScript or CSS import unless an application explicitly bundles it.
- **Verification states:** `verified` requires retained Material source evidence, matching emitted
  CSS across every emission context, and passing browser assertions; `unverified` retains its
  reason code resolved through the root `reasons` legend; `not-applicable` identifies
  library-internal properties; `gaps` list candidates deliberately not emitted. None of these
  states is a blanket component-conformance certificate, and exact colour values are not
  universally verified merely because semantic role context is recorded.
- **Lean public projection:** detailed emission contexts, complete consumer attribution and
  assertion citations are generated as CI review artifacts and not shipped in the public package.
  Prefer reading counts from the document over hardcoding integration counts.

## Density

`--mtrl-density` is an inherited integer custom property. Set it on a container, from `0`
(the default) down to `-5`, to compact the components inside it, including web components:

```css
.dense-panel {
  --mtrl-density: -2;
}
```

The classes `.mtrl-density--1` through `.mtrl-density--5` are shortcuts for those negative
values. For example, `class="mtrl-density--2"` sets `--mtrl-density: -2` on the element.

Each negative step reduces participating container heights by **4px**, until the component's
own floor. Buttons, icon buttons, button groups, lists, drawers, text fields and selects follow
the scale. Type and icon sizes stay unchanged, and touch targets keep their **48px** floor even
when the visible container is smaller.

Fixed surfaces pin `--mtrl-density: 0` on their own root: menus, dialogs, snackbars, date and time
pickers, and bottom and side sheets. A page-wide density therefore does not shrink the controls
inside them. Cards, tooltips and FABs do not read the density property.
