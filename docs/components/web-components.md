---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Web Components

`material/elements` has every component as a custom element: `<m-switch>`, `<m-tabs>`, `<m-dialog>`.
Each element builds its factory inside its own shadow root, so it works in plain HTML, server
templates and any framework. [Getting started](../getting-started/) covers the install and the
styles; this page covers what is specific to the elements.

## Register the elements

Importing `material/elements` registers nothing and touches no DOM, so it is safe on a server.
`defineAll()` registers every element; to ship less, register those you use, each with its CSS:

```typescript
import 'material/elements/css/switch';
import { defineSwitch } from 'material/elements';

defineSwitch();
```

Without its CSS, a `define*` function warns and names the import. Registering twice is
harmless, so two bundles on one page, or a hot reload, don't throw. The tags start with `m-`;
pass a prefix to use your own:

```typescript
import 'material/elements/css';
import { defineAll } from 'material/elements';

defineAll({ prefix: 'md' });
```

The page then uses `<md-switch>`, `<md-tabs>`, and so on.

## Attributes and properties

Attributes have a property of the same name, in camelCase (`supporting-text` is
`supportingText`), and setting one sets the other; the `label` fallback of a slotted label is,
for now, an attribute only. Rich values, such as a menu's anchor element, are properties only.

The value is the exception, as on a native `<input>`. A switch's `checked` attribute, or a text
field's `value`, is the **default**: it sets the state, and moves it when it changes, until the
user or a script changes the state. From then on the property holds it, the attribute stays as
it was, and a form reset returns to it.

```typescript
import type { SwitchElement } from 'material/elements';

const wifi = document.querySelector('m-switch') as SwitchElement;
wifi.checked = false;         // the live state
wifi.hasAttribute('checked'); // the default, unchanged
```

Interaction never writes a default, so a framework that owns the attributes never sees them
change under it. Only what opens and closes is reflected: the overlays' `open` and a rail's
`expanded`, as `open` is on `<dialog>`.

Most attributes update the component in place. A few, such as a button's `icon`, are read at
creation: changing one rebuilds the component inside, keeping its state. Methods are forwarded:
`wifi.toggle()`, `dialog.show()`. A property set before the element is defined is kept.

## Events

An element dispatches its factory's events from the host, under the same names, as
`CustomEvent`s that bubble and cross shadow roots. The payload is in `detail`: `{ checked, value, valueAttribute }`
for a switch's `change`, where `value` is the boolean and `valueAttribute` is the input's `value` attribute. Each component page lists them.

```typescript continued
wifi.addEventListener('change', (event) => {
  const { checked } = (event as CustomEvent<{ checked: boolean }>).detail;
  setWifi(checked);
});
```

The inner controls' native `change` and `input` stay inside, so you receive only the host's.
Events report the user's changes and those of a method (`toggle()`), never a property you set or
an attribute that changed. A dialog's `cancel`, on Escape, can be refused with
`preventDefault()`.

## Children, declarations and slots

A composite reads its items from children that render nothing: `<m-tab>` in `<m-tabs>`,
`<m-radio>` in `<m-radios>`, `<m-menu-item>` in `<m-menu>`, `<m-select-option>` in `<m-select>`,
and so on. Their text is the label, unless they have a `label` attribute. The parent watches
them, so adding, removing or editing one updates it.

```html
<m-tabs value="songs">
  <m-tab value="songs">Songs</m-tab>
  <m-tab value="albums">Albums</m-tab>
</m-tabs>
```

Other content goes into slots. A button's, switch's or checkbox's children are its label, with
the `label` attribute as the fallback. A dialog has a `headline` slot, a default slot for its
content, and an `actions` slot.

```html
<m-dialog headline="Discard draft?">
  Your changes will be lost.
  <div slot="actions">
    <m-button variant="text">Cancel</m-button>
    <m-button variant="text">Discard</m-button>
  </div>
</m-dialog>
```

An element has no `destroy()`. Removing it destroys its factory; moving it (a keyed reorder)
keeps it; one that comes back is built again from its attributes.

## Forms

The switch, checkbox, radios, slider, text field, select, search, date picker and time picker are
form-associated, as native controls are.

- **Value:** the element submits under its `name`, and `new FormData(form)` reads it. A switch or
  a checkbox submits its `value` (or `on`) when checked, and nothing otherwise.
- **Reset:** `form.reset()` returns each control to its attributes.
- **Validity:** `required`, and a text field's `pattern`, set the element's validity: an invalid
  control blocks the submit and matches `:invalid`.
- **Restore:** when the browser restores a form (a back navigation, an autofill), each control
  gets its value back.
- **Labels:** a `<label for>` pointing at the element activates it: it toggles a switch, focuses
  a text field. A disabled `<fieldset>` disables the controls in it.

`<m-button type="submit">` submits its form, and `type="reset"` resets it.

```html
<form>
  <label for="city">Where to?</label>
  <m-text-field id="city" name="city" label="City" required></m-text-field>
  <m-switch name="newsletter" value="yes">Send me offers</m-switch>
  <m-button type="submit">Book</m-button>
</form>
```

## Styling from outside

The shadow root keeps the page's CSS out, except what inherits. The base stylesheet and themes
stay in the page: the `--mtrl-sys-*` colour, type and shape tokens are custom properties, which
inherit, so a `data-theme` on an ancestor themes every element in it. A component's own custom
properties work the same way:

```css
m-button {
  --mtrl-button-shape: 8px;
}
```

The host is the box you lay out: `inline-block` unless the component is a block, such as a
card. A text field fills the width you give it. Selectors can't reach inside, and the elements
expose no `::part` yet: the custom properties are the styling surface.

## Server-rendered HTML

Until its script defines it, an element is the markup the server sent, unstyled. The pre-upgrade
stylesheet gives each element its final box meanwhile, so nothing jumps when it upgrades: labels
in their final type style, declaration children hidden with their room kept, overlays hidden.
An element's own CSS does not include them. For server-rendered pages, put
them in the `<head>` so they apply from the first paint:

```html
<link rel="stylesheet" href="/css/mtrl-preupgrade.css">
```

The file is `material/elements/preupgrade.css`: serve a copy, or import it where your bundler handles
CSS. It is built for `m-`; for another prefix, build the rules on the server and inline them:

```typescript
import { preupgradeStyles } from 'material/elements/preupgrade';

const css = preupgradeStyles('md');
```

## The top layer

Menus, selects, split buttons, tooltips, snackbars, dialogs, modal sheets, the modal drawer and
rail, search's view and the pickers open in the browser's top layer from inside their shadow
root: above every `z-index`, outside any `overflow: hidden` parent, with nothing to configure.
The modals use `showModal()`, so the page outside is inert. A menu's `anchor` and a tooltip's
`for` name their target by id, in the element's own root first, then the document:

```html
<m-button id="sort">Sort</m-button>
<m-menu anchor="sort">
  <m-menu-item value="name">Name</m-menu-item>
  <m-menu-item value="date">Date</m-menu-item>
</m-menu>
```

## Many instances

Each element styles its own shadow root, and the first render of many elements costs more than
the same factories in the page. Measured on `material` 3.0.0-next.0 in Chromium 153, 1,000 text
fields mount in about 300 ms as elements against about 150 ms as factories; with the CPU slowed
four times, in about 1.7 s against about 0.7 s. These are medians of 15 runs.

A form or a page has far fewer. For hundreds of instances created at once, a long
editable table for example, use the [Vanilla](../vanilla/) factories there; they mix with the
elements on the same page.

The React, Vue, Svelte and SolidJS components render these elements, so all of this holds there
too; their guides cover what each framework adds.
