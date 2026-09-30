---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Vanilla

The factories are mtrl itself: one function per component, which builds its DOM and returns an
object to drive it. There is no framework, no custom element and no shadow root, so the
component's markup is in your page, styled by one stylesheet you import. The web components
and the framework components are built on these factories. [Getting started](../getting-started/)
covers the install and the base stylesheet; this page covers what is specific to the factories.

## Create a component

Each component has a `create*` factory that takes one config object. Every option is optional,
and each component page lists them.

```typescript
import { createSwitch } from 'mtrl';

const wifi = createSwitch({ label: 'Wi-Fi', checked: true });
document.querySelector('#settings')!.append(wifi.element);
```

The factory returns the component: `element`, its root DOM element, and the methods that change
it. The element is not in the page yet: put it wherever it belongs, as you would any element you
created.

The overlays are the exception. A menu, a tooltip and a dialog put their surface on
`document.body` themselves (the dialog and the menu take a `container` to go elsewhere), because
they must float above the page. See [the top layer](#overlays-and-the-top-layer) for the option
that keeps them in place.

## Listen to events

`on(event, handler)` adds a listener and `off(event, handler)` removes it. Both return the
component, so they chain. The handler receives a plain object, not a DOM `Event`: the switch's
`change` carries `{ checked, value }`, a text field's `input` carries `{ value, isEmpty }`. Each
component page's Events table lists its events and their fields.

```typescript continued
wifi.on('change', ({ checked }) => setWifi(checked));
```

To remove a listener, keep the function you added:

```typescript
import createTextfield from 'mtrl/components/textfield';
import type { TextfieldEvents } from 'mtrl/components/textfield';

const query = createTextfield({ label: 'Search' });
const onInput: TextfieldEvents['input'] = ({ value }) => runSearch(value);

query.on('input', onInput);
query.off('input', onInput);
```

Setters are not all silent. `check()` on a switch emits `change`, as a click does, while a text
field's `setValue()` emits nothing. Don't use a listener to tell the user's changes from your
own; keep that in your code.

## Setters and methods

A component's state changes through its methods, never through its classes or attributes:
`check()`, `disable()`, a text field's `setValue('Paris')`. Getters read it back:
`isChecked()`, `getValue()`. Most setters return the component, so calls chain.

```typescript
const airplane = createSwitch({ label: 'Airplane mode', checked: true });
airplane.uncheck().disable();
```

The methods keep the component's parts in step: `disable()` on a switch disables its inner
input and sets the root's `--disabled` class together. Changing the DOM directly skips that, and
the next method call may undo it.

## Destroy what you remove

`destroy()` removes the component's element from the page, removes its listeners, and releases
what it holds outside its element: listeners on `document` or `window`, observers, timers. A
menu, for instance, listens on the document for outside clicks and on the window for resizes.
Removing only the element leaves all of that running, and it keeps the component in memory.

```typescript
const bluetooth = createSwitch({ label: 'Bluetooth' });
document.body.append(bluetooth.element);

// When the view goes away
bluetooth.destroy();
```

Call it whenever a view that created components goes away. After `destroy()`, the component is
done: create a new one to show it again.

## Styles

Import the base stylesheet once, then one stylesheet per component you use:

```typescript
import 'mtrl/styles/base';
import 'mtrl/styles/switch';
import 'mtrl/styles/select';
```

A component's stylesheet brings those it depends on: `mtrl/styles/select` also loads the text
field's and the menu's. The alternative is `mtrl/styles`, one file with every component and the
bundled themes. It is simpler, and several times larger than a page with a few components needs.
Other themes are their own imports (`mtrl/themes/<name>`), as [Getting
started](../getting-started/#themes-and-dark-mode) shows.

The classes are BEM, with the `mtrl-` prefix (`mtrl-switch__track`), and the colours, type and
shapes come from `--mtrl-sys-*` custom properties. Each component page's Styling section lists
the classes and properties meant to be overridden.

## Import paths and tree-shaking

The package is free of side effects apart from its stylesheets, so a bundler keeps only what you
import. Two paths reach a factory, and both tree-shake:

```typescript
import { createButton, createMenu } from 'mtrl';
import createChips from 'mtrl/components/chips';
```

The root entry has every factory and its main types. `mtrl/components/<name>` has one component,
its factory as the default export, with its types and constants. The constants are only
there: `import { BUTTON_VARIANTS } from 'mtrl/components/button/constants'`. The composition
utilities are in `mtrl/core`; [Architecture](../architecture/) shows how to build on them.

Some features load on demand: a menu's submenus are a separate chunk, fetched only by a menu that
has nested items. Your bundler splits them out on its own.

## Overlays and the top layer

By default, the overlays live on `document.body` and stack by `z-index`. The `layer: "top"`
option renders them in place, beside their opener or in their `container`, and shows them in the
browser's top layer: above every `z-index`, outside any `overflow: hidden` parent, and inside the
opener's shadow root if it has one. Menus, tooltips and snackbars open as popovers; dialogs,
modal sheets and the modal drawer with `showModal()`, which makes the rest of the page inert and
turns the scrim into the dialog's `::backdrop`.

```typescript
const sort = createButton({ text: 'Sort' });
document.querySelector('#toolbar')!.append(sort.element);

const menu = createMenu({
  opener: sort,
  items: [
    { id: 'name', text: 'Name' },
    { id: 'date', text: 'Date' },
  ],
  layer: 'top',
});
menu.on('select', ({ itemId }) => showView(itemId));
```

The option exists on the menu, select, split button, tooltip, snackbar, dialog, bottom and side
sheets, and drawer. It is off by default, and where the browser has no popover or `showModal()`
support it does nothing. The web components use it for every overlay.

## When to choose Vanilla

Choose the factories for the smallest bundles and full control: no element layer, no shadow root,
no framework runtime. They suit a page without a framework, a framework mtrl has no components
for, or a component you drive from your own state code. Each component page shows, beside its
name, what the component adds to an app, minified and gzipped: with Vanilla selected in the
switch at the top, that is the factory's size, and with any other choice, the web component's.
The difference is the element layer the other flavours share.

Choose the [web components](../web-components/) when your markup is HTML, or
[React](../react/) and the other adapters when your app is written in one.
