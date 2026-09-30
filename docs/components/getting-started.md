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

```bash
npm install mtrl
```

It works the same with `bun add mtrl`, `pnpm add mtrl` or `yarn add mtrl`. React, Vue, Svelte
and SolidJS are optional peer dependencies: mtrl uses the one your app already has, and installs
none of them itself.

## Choose how to use it

| Way | Import from | Good for |
|-----|-------------|----------|
| [Vanilla](../vanilla/) | `mtrl` | The smallest bundles, full control, any stack |
| [Web Components](../web-components/) | `mtrl/elements` | Plain HTML, server templates, any framework |
| [React](../react/) | `mtrl/react` | React 18 and 19, Next.js |
| [Vue](../vue/) | `mtrl/vue` | Vue 3, Nuxt |
| [Svelte](../svelte/) | `mtrl/svelte` | Svelte 5, SvelteKit |
| [SolidJS](../solid/) | `mtrl/solid` | SolidJS, SolidStart |

The web components are built on the factories, and the framework components render the web
components, so they all look and behave alike.

## Add the styles

Every app imports the base stylesheet once: the colour, type and shape tokens, and the
ripple.

```typescript
import 'mtrl/styles/base';
```

With the **Vanilla** factories, also import each component's stylesheet:

```typescript
import 'mtrl/styles/button';
```

The **web components** and the **framework components** carry their own styles in their
shadow roots, so the base stylesheet is all they need. With web components, register them once:

```typescript
import 'mtrl/elements/css';
import { defineAll } from 'mtrl/elements';

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
import 'mtrl/themes/vibrant';

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
