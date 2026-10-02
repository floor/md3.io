---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Getting started

mtrl is a Material Design 3 component library for the web, with no dependencies. The same
components work as plain JavaScript factories, as web components, and as React, Vue, Svelte and
SolidJS components. This page takes you from install to a first component; the switch at the
top shows every example in the way you use it.

## Install

```install
material
```

React, Vue, Svelte and SolidJS are optional peer dependencies: mtrl uses the one your app already
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
component as a factory: 1,000 text fields take about twice as long to style (roughly 300 ms
against 150 ms on a slow phone's CPU), comparable to Material Web's. That is invisible for a form
or a page, but for hundreds of instances at once, such as a long editable table, the Vanilla
factories are the faster choice. See [Web Components](../web-components/#many-instances).

## Add the styles

Every app imports the base stylesheet once: the colour, shape and state tokens, and the
ripple. The type scale is a second import, `material/styles/typography`.

```typescript
import 'material/styles/base';
import 'material/styles/typography';
```

With the **Vanilla** factories, also import each component's stylesheet:

```typescript
import 'material/styles/button';
```

The **web components** and the **framework components** carry their own styles in their
shadow roots, so the base stylesheet is all they need. With web components, register them once:

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
- [Architecture](../architecture/): how mtrl is built.
- [Examples](/examples/): whole screens in all six flavours.
