---
created: 2026-09-21
updated: 2026-09-30
status: published
description: How mtrl is built in layers, from features and component factories to web components and the React, Vue, Svelte and SolidJS components.
---

# Architecture

mtrl is built in layers: small features compose into component factories, web components wrap
the factories, and the React, Vue, Svelte and SolidJS components are generated from the web
components. Each layer adds one thing and keeps the one below it intact, so a component looks and
behaves the same whichever layer you use. The library has no runtime dependencies.

```text
core        pipe, events, lifecycle, DOM, state          mtrl/core
  ↓
factories   createButton, createMenu, …                  mtrl
  ↓
elements    <m-button>, <m-menu>, …                      mtrl/elements
  ↓
adapters    <Button>, <MButton>, …                       mtrl/react · vue · svelte · solid

styles      tokens, themes, one stylesheet per component  mtrl/styles · mtrl/themes
```

## Factories: features in a pipe

A factory takes a config and returns a component: an object with its `element` and an API. It
is built by piping a base through features, each a function that takes the component and
returns it with one more capability: events, an element, a ripple, a label, a lifecycle. The
switch, for example, composes events, its element, the native input, a label, a track,
supporting text, checked and disabled states, a lifecycle, and finally its public API.

A feature is only included when a factory uses it, which is what keeps bundles small: md3.io's
component pages show each component's size, measured from the build.

The same pattern extends a component. A feature that adds a title to any button:

```typescript
import { createButton } from 'material';
import type { ButtonConfig, ButtonComponent } from 'material';
import { pipe } from 'material/core/compose';

// A feature takes a component and returns it, enhanced
const withTitle = (title: string) => (component: ButtonComponent) => {
  component.element.title = title;
  return component;
};

const createCustomButton = (config: ButtonConfig) => pipe(
  createButton,
  withTitle('Saves a draft')
)(config);
```

Or builds a new component from the core features:

```typescript
import { pipe, createBase, withEvents, withElement, withLifecycle } from 'material/core/compose';
import type { ElementComponent } from 'material/core/compose';

const withLabel = (label: string) => <C extends ElementComponent>(component: C) => {
  component.element.textContent = label;
  return component;
};

const createCustomComponent = (config: { label: string }) => pipe(
  createBase,
  withEvents(),
  withElement({ tag: 'div', className: 'custom' }),
  withLabel(config.label),
  withLifecycle()
)({ prefix: 'mtrl', componentName: 'custom', ...config });
```

Every factory follows the same contract: `on()` and `off()` for events, setters and getters
for its state, and `destroy()` to remove its element and every listener it added.

## Styles and tokens

Styles are plain CSS, written in Sass and compiled. Classes follow BEM, prefixed `mtrl-`:
`.mtrl-button`, `.mtrl-button--filled`, `.mtrl-button__label`. Every value that M3 names is a
token, a CSS custom property: colour roles (`--mtrl-sys-color-primary`), the type scale
(`--mtrl-sys-typescale-body-large-font-size`), shapes and state layers.

- `material/styles/base` holds the colour, shape and state tokens and the ripple; every app imports it once.
- `material/styles/typography` holds the type scale.
- `material/styles/contrast` and `material/themes/<name>-contrast` are the explicit high-contrast sheets (`data-theme-contrast`). The base and each theme already follow `prefers-contrast`.
- `material/styles/<component>` is one component's stylesheet, for the factories.
- `material/themes/<name>` sets the colour roles for another theme, applied with `data-theme` and
  `data-theme-mode` on any element. Most themes are generated from a seed colour with Google's
  colour library, so their roles follow M3's schemes.

The rules sit in CSS cascade layers (`mtrl.base`, `mtrl.button` …), so an app's own styles win
without fighting specificity. [Styles](/styles/) shows every token as mtrl ships it.

## Web components

Each web component is declared by a spec that maps its attributes and properties to the
factory's config and setters, its events to the factory's, and its child elements (`<m-tab>`,
`<m-menu-item>`) to the factory's items. One element framework turns every spec into a custom
element, so they all behave alike:

- **Shadow DOM.** The element renders its factory inside a shadow root, with the component's
  CSS as a shared, adopted stylesheet (a `<style>` where the browser lacks them), so page styles and mtrl's styles never collide. Tokens
  still reach it, since custom properties inherit.
- **Attributes as defaults.** An attribute gives the initial state; once the user or a script
  changes it, the element's state wins, and a form reset returns to the attribute.
- **Forms.** Inputs are form-associated: they submit a value, reset, restore and report
  validity like native controls, and work with `<label for>`.
- **Before upgrade.** Pre-upgrade rules give each element its final size before its script
  runs, so server-rendered pages don't shift.

## Framework components

The React, Vue, Svelte and SolidJS components are generated from the element specs, never
written by hand. Each renders its `<m-*>` element, passes props as properties or attributes,
maps events to the framework's convention (`onChange`, `@change`, `onchange`), registers the
element the first time it mounts, and loads its CSS. A fix in a factory or an element reaches
every framework at once. The frameworks are optional peer dependencies of the one `material`
package, imported from `material/react`, `material/vue`, `material/svelte` and `material/solid`.

## Overlays and the top layer

Menus, selects, dialogs, sheets, snackbars and tooltips can open in the browser's top layer,
above every stacking context, with the platform's own focus and dismissal. A snackbar shown
while a modal dialog is open appears inside that dialog, so it stays visible and reachable.

## Where to go next

- [Getting started](../getting-started/) to add mtrl to an app.
- The guide for your way of using it: [Vanilla](../vanilla/), [Web Components](../web-components/),
  [React](../react/), [Vue](../vue/), [Svelte](../svelte/) or [SolidJS](../solid/).
- [Theming](../theming/) for tokens and themes, [Server rendering](../server-rendering/) for SSR.
