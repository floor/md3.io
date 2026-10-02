---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Server rendering

mtrl's components are built in the browser: a web component builds its factory inside its
shadow root when it upgrades, and a factory needs `document`. So the server sends each component
as its element, the host tag with its attributes and light DOM, and the browser upgrades it once
its script defines it. This page covers the first paint and what each framework needs; it holds
for the plain [web components](../web-components/) in a server template too.

## What the server sends

Next.js, Nuxt, SvelteKit and SolidStart render the framework components to their elements. A
switch that is on, with its label, arrives as:

```html
<m-switch checked>Wi-Fi</m-switch>
```

Strings, numbers and booleans become attributes, a bound value becomes its default attribute
(`checked`, `value`), and children stay children. Objects, functions and listeners wait for
the browser, where the component registers its element when it first mounts and the element
upgrades in place. The framework hydrates its own markup; the shadow root is the element's
alone, so the two never disagree.

## Importing on the server

Every mtrl module imports safely without a DOM, the framework entries included. Importing
`material/elements` registers nothing, and the framework components register their elements only
when they mount, which never happens on a server. So no import needs a guard and mtrl's
components need no client-only wrapper. Only calls need the browser: run a factory such as
`createButton()`, or `defineAll()`, in client code or an effect.

## Avoiding layout shift

Until it upgrades, an element has no shadow root, so none of its styles: a button shows as its
bare label, then jumps to its real size when the script arrives.

The pre-upgrade stylesheet fixes the size. Put it in the server-rendered `<head>`, after the
base stylesheet, so it applies from the first paint:

```html
<head>
  <link rel="stylesheet" href="/css/mtrl-base.css">
  <link rel="stylesheet" href="/css/mtrl-preupgrade.css">
</head>
```

The files are `material/styles/base` and `material/elements/preupgrade.css`: serve copies of them, or
import them where your bundler handles CSS, as the framework guides do:

```typescript
import 'material/styles/base';
import 'material/elements/preupgrade.css';
```

The rules are built for the `m-` prefix. With elements registered under another one, build the
same rules on the server and inline them in a `<style>`:

```typescript
import { preupgradeStyles } from 'material/elements/preupgrade';

const head = `<style>${preupgradeStyles('md')}</style>`;
```

### What it does

Every rule is scoped to `:not(:defined)`, so none of them can reach an upgraded element. Until
then, they give each element the box it will have:

- **The host's box:** its display, height, width or minimum width, margins, and corners where
  they shape it. A filled button has its container colour, and a text field its container and
  indicator.
- **Its text in its final style.** A button's label is set in the type style and colour it
  will have; a text field shows its label at rest and its value on the input's line.
- **Declaration children aren't painted.** `<m-tab>`, `<m-chip>`, `<m-list-item>` and the like
  only mean something after upgrade, so they are hidden while their room stays reserved.
- **Overlays render nothing.** A dialog, sheet, menu, tooltip or snackbar opens in the top layer
  and takes no room on the page, so it stays hidden until it upgrades, even with `open`.

The colours come from the theme, so the base stylesheet goes in the head too. The rules sit in
their own cascade layer, `mtrl.preupgrade`, so your CSS wins over them. Load
`material/elements/preupgrade.css` explicitly: an element's own CSS does not include them.

mtrl measures this in CI: every element, in its common configurations, and a React server
render must shift the layout by less than 0.01 (the Cumulative Layout Shift score) between the
first paint and the upgrade.

### Its limits

- **One line of supporting text.** A text field, select or date picker with `supporting-text`
  or `maxlength` reserves one line under the field. Supporting text that wraps onto a second
  line once upgraded still pushes what follows down.
- **An open overlay appears at upgrade.** A dialog rendered with `open` shows when its script
  runs, not at first paint. It moves nothing when it does.
- **Size, not behaviour.** Before upgrade an element looks right but does nothing: it ignores
  clicks, and a form submitted before then doesn't include its value.

## Per framework

Each framework guide has a section on server rendering; in short:

- **[Next.js](../react/#nextjs-and-server-rendering).** `material/react` starts with
  `"use client"`, so Server Components can render its components; handlers and refs need a
  client component of your own. Import both stylesheets in the root layout.
- **[Nuxt](../vue/#nuxt-and-server-rendering).** The components register in `onMounted`, so
  no `<ClientOnly>` is needed. Load the pre-upgrade stylesheet in `app.vue` or in
  `nuxt.config`'s `css`.
- **[SvelteKit](../svelte/#sveltekit-and-server-rendering).** Nothing to turn off for the
  server: import the pre-upgrade stylesheet once in the root `+layout.svelte`.
- **[SolidStart](../solid/#solidstart-and-server-rendering).** SolidStart adds Solid's
  hydration script; a hand-made server render puts `generateHydrationScript()` in the head. No
  `clientOnly` is needed. Import the stylesheet in `src/app.tsx`.

In all four, a ref to the element is only set in the browser, so reach the element in a mount
hook or an event handler.

A server template without a framework registers the elements in its client script:

```typescript
import 'material/elements/css';
import { defineAll } from 'material/elements';

defineAll();
```

## The shadow root from the server

`material/ssr` renders an element with its shadow root, server only. The browser attaches
that root while parsing, before any script runs, so the first paint is the component.
Pages that don't use it keep the pre-upgrade stylesheet as the fallback.

This call is server-only, so the docs check does not run it in the browser:

```typescript fragment
import { renderElement } from 'material/ssr';

renderElement('m-button', { variant: 'filled' }, 'Save');
```
