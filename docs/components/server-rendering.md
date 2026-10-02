---
created: 2026-09-30
updated: 2026-10-02
status: published
---

# Server rendering

`material`'s components are built in the browser: a web component builds its factory inside its
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

Every `material` module imports safely without a DOM, the framework entries included. Importing
`material/elements` registers nothing, and the framework components register their elements only
when they mount, which never happens on a server. So no import needs a guard and `material`'s
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

A page that uses one element can load that element's file instead,
`material/elements/preupgrade/<name>.css`, named as the element is (`text-field`, `select`,
`icon-button`). Each file holds that element's rules, in the same cascade layer:

```typescript fragment
import 'material/elements/preupgrade/button.css';
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
their own cascade layer, `material.preupgrade`, so your CSS wins over them. Load
`material/elements/preupgrade.css` explicitly. The element CSS modules do not apply these rules,
and an element's own CSS does not include them.

`material` measures this in CI: every element, in its common configurations, and a React server
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

The four bridges make a framework's components emit the same roots. Import the one for your
framework in the server bootstrap:

| Framework | Bridge |
|---|---|
| React | `material/ssr/react` |
| Vue | `material/ssr/vue` |
| Svelte | `material/ssr/svelte` |
| Solid | `material/ssr/solid` |

Before upgrade, each toolbar item is its own tab stop; after upgrade, the toolbar is one.

### Styles: inline or linked

**Inline is the default.** Each root carries its whole CSS as a `<style>`, so it is styled at
first paint in every engine with no extra request. That has two costs.

How well it compresses depends on the compressor. gzip cannot see a repeat further back than
its 32 KB window, and a select's root is about 44 KB of style text, so gzip never finds the
previous select. Measured pages:

| Page | gzip | brotli |
|---|---|---|
| 30 selects | 141.0 KB | 5.0 KB |
| 30 buttons (16 KB a root) | 6.4 KB | |
| 30 dialogs | 10.3 KB | |
| Selects, text fields, dialogs and buttons in turn | 83.9 KB | 8.1 KB |

Smaller roots compress well when the same element repeats. Large roots of different types
that alternate compress badly, because the previous copy of each is out of the window. So
serve brotli, or use link mode for pages with many selects, or that mix large roots (text
fields, dialogs) in turn.

Uncompressed, the HTML is large: 0.5 to 0.9 MB for 30 to 44 roots (489 KB for 30 buttons,
671 KB for a list page of 44 roots, 878 KB for the 30 large roots). That matters for anything
that stores or streams the HTML uncompressed.

**Link mode** writes `<link>` tags in place of the style text. Serve `dist/elements/css` at
the base you name:

```typescript fragment
renderElement(tag, attributes, children, { styles: 'link', cssBase: '/css' });
```

The same pages are 15 to 40 KB of HTML, and the stylesheets are fetched once and cached. Its
caveat: WebKit paints the roots unstyled until the stylesheets arrive (about 470 ms with each
stylesheet 300 ms away; a preload in the head does not help), where Chromium and Firefox wait
for them before painting.

Measured on Playwright's engines (Chromium 153, Firefox 155, WebKit 26.6); sizes are of the
HTML `renderElement` returns, gzip at level 9, brotli at its default.

### With the pre-upgrade stylesheet

A framework page that server-renders without a bridge (Next.js, Nuxt, SvelteKit, SolidStart)
does not reserve an element's box between the HTML and hydration: load the pre-upgrade
stylesheet, as above. The link reserves the box from the first paint, before any script.

A page can use both. `renderElement`, and each bridge when it emits a shadow root, writes
`data-mtrl-ssr` on that host. The stylesheet's last rule matches that attribute on a host not
defined yet and sets `all: revert-layer`, at a higher specificity than any pre-upgrade
selector. So the stylesheet does not style a host the server already rendered, its
`::before` and `::after`, or its direct children that are not themselves waiting to upgrade.

- The attribute stays after upgrade, where it does nothing: `:not(:defined)` no longer matches.
- Carousel and the FAB menu opt out of the shadow root and do not carry the attribute: the
  stylesheet still reserves their box.
- A page without a bridge does not write the attribute.
- A Vue menu or split button that opts out of server rendering and has an async child shows
  its raw items until upgrade, when the page also loads the pre-upgrade stylesheet.

### Runtimes

Node and Bun are supported in `material` 3.0.0. Worker and edge runtimes are unsupported.

Each server entry lists the `browser` condition first. A resolver that tries `workerd` or
`worker` before `browser` (Cloudflare Workers does) loads the browser stub. There
`renderElement` throws "material/ssr is server-only", and importing a bridge does nothing, so
the page renders with no declarative roots and no error.

### React: hydration, Suspense

The React bridge suppresses React's hydration warning on a rendered host, because the server
adds `data-mtrl-ssr`. So React does not report a host attribute that differs between server
and client, and a direct text child that differs is kept as the server sent it.

Put a `Suspense` boundary outside the component when its server-rendered shadow root needs
the resolved child. A boundary inside the component contributes its fallback to that root:

- a button with an empty fallback has no label slot, while a text fallback gives it a slot
  and shows the fallback text;
- in tabs, a boundary around a tab leaves the server-rendered root without that tab, with
  either fallback;
- a boundary inside a tab label keeps the tab, with an empty or fallback-text label.

### React and Svelte: context

With `material/ssr/react` and `material/ssr/svelte`, the server-rendered shadow root is built
in a separate render, without the context of providers above the component. The page's own
render, the light DOM, sees the provided value.

Until the component upgrades:

- a child reading context with a default shows that default in the painted shadow root;
- a child requiring its context leaves that component without a declarative shadow root, while
  the page still renders. React and Svelte each log a development-only warning naming the
  element.

Keep context-dependent text outside the components: pass the resolved string as a prop or
attribute, or accept client-rendered text until the upgrade. A fix is planned for a later 3.x
release. The Vue and Solid bridges see the provided value in both the shadow root and light
DOM.

### Markup

Icon and `content` strings are markup, written as HTML on the server as in the browser. The
policy set with `configureHTML` applies to `material/ssr` and the four bridges too.
