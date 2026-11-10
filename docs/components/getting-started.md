---
created: 2026-09-30
updated: 2026-11-10
status: published
---

# Getting started

`material` is a Material Design 3 component library for the web, with no dependencies. The same
components work as plain JavaScript factories, as web components, and as React, Vue, Svelte and
SolidJS components. This page takes you from install to a first component; the switch at the
top shows every example in the way you use it.

For coverage, measured sizes, browser support and the current limits, see [Why material](why-material.md).

## Install

```install
material
```

React, Vue, Svelte and SolidJS are optional peer dependencies: `material` uses the one your app already
has, and installs none of them itself.

## Choose how to use it

| Way | Import from | Good for |
|-----|-------------|----------|
| [Vanilla](../vanilla/) | `material` | The smallest bundles, full control, any stack |
| [Web Components](../web-components/) | `material/elements` | Plain HTML, server templates, any framework |
| [React](../react/) | `material/react` | React 18 and 19, Next.js |
| [Vue](../vue/) | `material/vue` | Vue 3, Nuxt |
| [Svelte](../svelte/) | `material/svelte` | Svelte 5, SvelteKit |
| [SolidJS](../solid/) | `material/solid` | SolidJS, SolidStart |

The web components are built on the factories, and the framework components render the web
components, so they all look and behave alike.

Each web component styles its own shadow root, which costs more on a first render than the same
component as a factory: 1,000 text fields mount in about 290 ms as elements against about
150 ms as factories, and with the CPU slowed four times in about 1.4 s against about 0.63 s
(`material` 3.0.0-next.0, Chromium 153, medians of 15 runs). A form or a page has far fewer. For hundreds of instances at once, such as a long editable table, use the Vanilla
factories. See [Web Components](../web-components/#many-instances).

## Add the styles

Every app loads one base stylesheet. For factories, use the full base; add
`material/styles/typography` for the type scale:

```typescript
import 'material/styles/base';
import 'material/styles/typography';
```

For element and framework applications, choose the base that fits the page:

| Entry | Includes |
|-------|----------|
| `material/styles/base` | Theme, tokens, reset, system contrast and global ripple rules; needed for factories and page-level `data-ripple` |
| `material/styles/base-elements` | Baseline light/dark theme, colour/shape/typeface tokens, reset, cascade order and system contrast (`prefers-contrast: more`); no global ripple rules |
| `material/styles/base-lite` | Theme, tokens, body theme and reduced-motion switch; no reset, ripple or contrast modes |

Elements carry ripple CSS in their shadow roots, so bundled `base-elements` CSS saves 293 B gzip (970 B raw)
against `base`. Explicit `data-theme-contrast` still needs `material/styles/contrast`.
The typography JavaScript entry brings in the full base; [Theming](../theming/#the-baseline)
explains loading typography CSS separately when keeping the smaller base.

With the **Vanilla** factories, also import each component's stylesheet:

```typescript
import 'material/styles/button';
```

The **web components** and the **framework components** carry their own styles in their
shadow roots, so no page-level component stylesheets are needed. With web components, register them once:

```typescript
import 'material/elements/css';
import { defineAll } from 'material/elements';

defineAll();
```

The React, Vue, Svelte and SolidJS components register the element they render the first time
it mounts.

## A first component

A filled button that saves when it is clicked:

```example
button:
  text: Save
  variant: filled
  on click: save()
```

Every component page has the same kind of example, and a playground to try the options.

## Themes and dark mode

The base stylesheet has the baseline theme. Another theme is one more import, and it applies to
the element that names it, usually the whole page:

```typescript
import 'material/themes/vibrant';

document.documentElement.dataset.theme = 'vibrant';
document.documentElement.dataset.themeMode = 'dark';
```

Browse the themes and every colour role in [Styles › Color](/styles/color/), and see
[Theming](../theming/) to make your own.

## Next steps

- [Components](/components/): every component in a playground, with the code for your
  framework.
- The guide for [your framework](#choose-how-to-use-it), for its events, forms and
  server rendering.
- [Architecture](../architecture/): how `material` is built.
- [Examples](/examples/): whole screens in all six flavours.
