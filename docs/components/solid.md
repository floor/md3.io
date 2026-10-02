---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# SolidJS

`material/solid` has a SolidJS component for every mtrl web component, for Solid 1.8 or later and
SolidStart. Each one renders its `<m-*>` element, so it looks and behaves exactly as the element
does. This page covers only what is particular to Solid; [Getting started](../getting-started/)
has the install and the base stylesheet, and each component page has its options and events.

## Components and props

The components are named after the element: `Button`, `Switch`, `Tabs`, `TextField`. Import
them where you use them. A component's props are its element's attributes, in camelCase:
`supportingText` for `supporting-text`, `ariaLabel` for `aria-label`.

```tsx
import { Button, Slider, TextField } from 'material/solid';

export function Profile() {
  return (
    <>
      <TextField label="Email" type="email" supportingText="We never share it" required />
      <Slider ariaLabel="Volume" min={0} max={100} step={5} />
      <Button variant="filled">Save</Button>
    </>
  );
}
```

A component registers its element the first time it mounts, and importing `material/solid` loads
the elements' styles, so the base stylesheet is the only CSS you add.

Props stay reactive: pass a signal's value and the element follows it. On the server they are
rendered as attributes, so the markup carries them. In the browser, Solid sets a custom
element's props as properties; every mtrl element, and every child like `<Tab>`, has a property
for each attribute, so both reach the same place. `false` removes a boolean attribute. Anything
else you pass, such as `class`, `id` or `data-*`, lands on the element.

## Events

Element events are `on` props in PascalCase: `onChange`, `onInput`, `onOpen`, `onClose`,
`onSelect`. The handler receives the element's `CustomEvent`, with the data in `detail`; every
component page lists its events and their fields.

```tsx
import { Switch, TextField } from 'material/solid';

function search(query: string) {
  console.log('Searching for', query);
}

export function Settings() {
  return (
    <>
      <Switch onChange={(event) => console.log('Wi-Fi', event.detail.checked)}>Wi-Fi</Switch>
      <TextField label="Search" onInput={(event) => search(event.detail.value)} />
    </>
  );
}
```

The events are typed, so `event.detail` is checked in your editor. Native events such as
`onClick` or `onFocus` are not the component's own: Solid handles them as on any tag, with the
browser's event.

## Signals, controlled and uncontrolled

Solid has no two-way binding, so a value is controlled as in React: pass the signal's value to
the live property (`checked`, `value`, `selected`) and set the signal from the event. The
component writes the property to the element whenever the signal changes.

```tsx
import { createSignal } from 'solid-js';
import { Switch, Tabs, Tab } from 'material/solid';

export function Library() {
  const [wifi, setWifi] = createSignal(true);
  const [tab, setTab] = createSignal<string | null>('songs');
  return (
    <>
      <Switch checked={wifi()} onChange={(event) => setWifi(event.detail.checked)}>Wi-Fi</Switch>
      <Tabs value={tab()} onChange={(event) => setTab(event.detail.value)}>
        <Tab value="songs">Songs</Tab>
        <Tab value="albums">Albums</Tab>
      </Tabs>
      <p>Wi-Fi is {wifi() ? 'on' : 'off'}, showing {tab()}.</p>
    </>
  );
}
```

A controlled prop without its event doesn't hold the element: as with a native input,
`checked={false}` alone lets the user turn the switch on, and the signal falls out of step.

To leave the state to the element, don't pass the live property. Its attribute is the
element's default, as `checked` is on a native checkbox, and takes the `default` prefix:
`defaultChecked`, `defaultValue`. Read the value from the event when you need it:

```tsx
import { Switch } from 'material/solid';

export function Notifications() {
  return (
    <Switch name="notifications" defaultChecked onChange={(event) => console.log('Notifications', event.detail.checked)}>
      Notifications
    </Switch>
  );
}
```

A dialog, a sheet or a menu opens from its `open` attribute. Pass a signal, and set it back when
the user closes it:

```tsx
import { createSignal } from 'solid-js';
import { Button, Dialog } from 'material/solid';

export function DeleteDraft() {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>
      <Dialog
        open={open()}
        headline="Delete draft?"
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="text" onClick={() => setOpen(false)}>Delete</Button>
          </>
        }
        onClose={() => setOpen(false)}
      >
        <p>The draft will be deleted for good.</p>
      </Dialog>
    </>
  );
}
```

## Refs

`ref` gives the `<m-*>` element itself, with its properties and methods, once it is created.
Type it with the element's type from `material/elements`, and use it in `onMount` or an event
handler. A callback, `ref={(element) => …}`, works too.

```tsx
import { Button, TextField } from 'material/solid';
import type { TextFieldElement } from 'material/elements';

export function Name() {
  let field: TextFieldElement | undefined;
  return (
    <>
      <TextField ref={field} label="Name" defaultValue="Ada Lovelace" />
      <Button onClick={() => field?.select()}>Select the name</Button>
    </>
  );
}
```

## Children

A component's children become the element's content: a button's label, a dialog's or a card's
text. A component's named regions, such as a dialog's `headline` and `actions` or a top app
bar's `leading` and `trailing`, are the element's named slots: pass them as props of those names
taking JSX, as the dialog above does (a dashed slot is camelCased: `headerAction`). `headline`
takes text for the attribute or JSX for the slot.

Lists of items are declared with child components: `Tab`, `Radio`, `Chip`, `ListItem`,
`MenuItem`, `SelectOption`, `SearchSuggestion`, `NavigationRailItem`, `DrawerItem`,
`ButtonGroupItem` and `CarouselItem`. They render nothing themselves; their parent reads them.
Keep them direct children of their parent, with no element in between. `<For>` and `<Show>` are
fine: the parent reads them again when they change.

```tsx
import { createSignal, For } from 'solid-js';
import { Radios, Radio } from 'material/solid';

const sizes = [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }, { value: 'l', label: 'Large' }];

export function Size() {
  const [size, setSize] = createSignal<string | null>('m');
  return (
    <Radios value={size()} onChange={(event) => setSize(event.detail.value)} ariaLabel="Size">
      <For each={sizes}>{(option) => <Radio value={option.value}>{option.label}</Radio>}</For>
    </Radios>
  );
}
```

Solid sets a child's props as properties, often before mtrl has defined the elements. mtrl
keeps them from 0.10.0-next.2 on; with an earlier version, a `<Tab>` rendered in the browser
lost its `value`.

## Bare tags in JSX

To write the elements themselves (`<m-switch checked>`), with Solid's `prop:` and `on:` forms,
import the tag types once, in any file TypeScript sees:

```tsx
import type {} from 'material/solid/jsx';

export const Wifi = () => <m-switch checked supporting-text="Saves battery">Wi-Fi</m-switch>;
```

It is types only; the element still needs `defineAll()` or its `define` function.

## SolidStart and server rendering

The components render on the server. SolidStart's HTML has each element's tag, its attributes
and its children, and a controlled value as its attribute: a switch whose signal is on renders
`<m-switch checked>`. Every module imports safely without a DOM, and the element registers in
`onMount`, so it upgrades as the page hydrates. SolidStart adds the hydration script Solid
needs; a hand-made server render puts `generateHydrationScript()` in the page's head. You don't
need `clientOnly` for these components, and a `ref` is only set in the browser.

Until an element upgrades, it has no shadow root and so none of its styles. The pre-upgrade
stylesheet gives each element its final size and look meanwhile, so the page doesn't shift when
the script arrives. Import it once in `src/app.tsx`:

```typescript
import 'material/elements/preupgrade.css';
```

[Server rendering](../server-rendering/) explains what the server sends and how the upgrade
happens, for every framework.
