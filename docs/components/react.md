---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# React

`mtrl/react` has a React component for every element: `Switch` renders `<m-switch>`, `Tabs`
renders `<m-tabs>`. The element does the work, so everything in the [Web Components
guide](../web-components/) holds here: the forms, the styling, the top layer. [Getting
started](../getting-started/) covers the install and the base stylesheet; this page covers what
the React components add.

## Components and props

Import the components by name. `mtrl/react` loads the elements' CSS, and each component
registers its element the first time it mounts, so there is no `defineAll()` to call.

```tsx
import { Switch, Textfield } from 'mtrl/react';

export function Settings() {
  return (
    <form>
      <Textfield name="city" label="City" supportingText="Where you live" variant="outlined" />
      <Switch name="wifi" defaultChecked>Wi-Fi</Switch>
    </form>
  );
}
```

The props are the element's attributes and properties in camelCase, typed from the element:
`supportingText` is the `supporting-text` attribute. Form controls take `name`. Any other prop,
such as `id`, `style`, `aria-*`, `data-*` or a React event like `onClick`, goes to the host
element. `className` works on React 18 and 19 alike: the component passes it on as `class`.

To render another tag prefix, call `configure` once, before the first render:

```tsx
import { configure } from 'mtrl/react';

configure({ prefix: 'md' });
```

## Events

Each element event is an `on` prop: `change` is `onChange`, `select` is `onSelect`. The handler
receives the element's `CustomEvent`, with the payload in `event.detail`, typed for each
component. They replace React's own handlers of the same name, and keep the element's meaning:
a `Textfield`'s `onChange` follows the native `change`, when the edit is committed, not React's
per-keystroke `onChange`. Use `onInput` for every keystroke; both carry `{ value }`.

The component attaches its listeners once and always calls your latest handler, so an inline
arrow function costs nothing.

## Controlled and uncontrolled

The components follow React's inputs. Give the value prop (`checked`, `value`) and it is
**controlled**: the component writes it to the element after every render, and if your handler
doesn't change it, puts it back, as React does for `<input checked>`.

```tsx
import { useState } from 'react';
import { Switch } from 'mtrl/react';

export function WifiSetting() {
  const [wifi, setWifi] = useState(false);
  return (
    <Switch checked={wifi} onChange={(event) => setWifi(event.detail.checked)}>
      Wi-Fi
    </Switch>
  );
}
```

Give `defaultChecked` or `defaultValue` instead, or nothing, and it is **uncontrolled**: that
prop is the element's default attribute, the element keeps its own state, and a form reset
returns to the default. Read the value from `onChange`, from a ref, or from the form.

The props that work this way are the element's live state: `checked` on a switch or a checkbox,
`value` on a text field, select, slider, tabs or radio group, and a few more. The other props are
settings, which the element follows on every render.

## Forms

The form controls are form-associated elements, so a plain `<form>` sees them: they submit under
their `name`, and `new FormData(form)` reads them. That makes uncontrolled components a good fit
for React 19's form actions, which receive the `FormData`:

```tsx
import { Button, Switch, Textfield } from 'mtrl/react';

export function Booking() {
  return (
    <form action={(data) => submitForm(data)}>
      <Textfield name="city" label="City" required />
      <Switch name="newsletter" value="yes">Send me offers</Switch>
      <Button type="submit">Book</Button>
    </form>
  );
}
```

A `required` field that is empty blocks the submit, as a native input does, and the form's reset
after an action returns each control to its default.

## Refs

`ref` gives you the element, with its properties and methods typed. The element types come from
`mtrl/elements`:

```tsx
import { useRef } from 'react';
import { Button, Textfield } from 'mtrl/react';
import type { TextfieldElement } from 'mtrl/elements';

export function Rename() {
  const field = useRef<TextfieldElement>(null);
  return (
    <>
      <Textfield ref={field} label="Name" defaultValue="Untitled" />
      <Button onClick={() => field.current?.select()}>Select all</Button>
    </>
  );
}
```

Methods such as `select()`, `toggle()`, `show()` and `close()` are the element's, as the
component pages list them. `focus()` is the host's, and moves focus to the control inside.

## Children and slots

Children go into the element, as in HTML. Text is the label of a button, switch or checkbox.
A composite's items are declaration components, named as their tags: `Tab` for `<m-tab>`,
`MenuItem`, `SelectOption`, `Radio`. A named slot is any child with a `slot` attribute.

```tsx
import { useState } from 'react';
import { Button, Dialog, Tab, Tabs } from 'mtrl/react';

export function Library() {
  const [tab, setTab] = useState<string | null>('songs');
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Tabs value={tab} onChange={(event) => setTab(event.detail.value)}>
        <Tab value="songs">Songs</Tab>
        <Tab value="albums">Albums</Tab>
      </Tabs>
      <Dialog headline="Discard draft?" open={confirming} onClose={() => setConfirming(false)}>
        Your changes will be lost.
        <div slot="actions">
          <Button variant="text" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      </Dialog>
    </>
  );
}
```

## React 18 and 19

The components behave the same on both, and the adapter is checked on both. They set
properties and attach listeners themselves, rather than relying on React 19's support for custom
elements, and they use `forwardRef`, so refs work on 18 too. There is nothing to change when you
upgrade.

## Next.js and server rendering

`mtrl/react` starts with `"use client"`, so you can import the components from Server
Components: they are client components, which Next.js still renders on the server. Event
handlers and refs need a client component of your own, as with any client component. The server
HTML is the element's tag with its attributes: the string, number and boolean props, a
controlled value as its default attribute, and the children. Objects, functions and listeners
wait for hydration. The element is registered in the browser on first mount, never at import.

Until then, the server's `<m-switch>` has no shadow root. Import the pre-upgrade stylesheet
once, in the root layout, so each element has its final box from the first paint and nothing
shifts when it upgrades:

```tsx
import type { ReactNode } from 'react';
import 'mtrl/styles/base';
import 'mtrl/elements/preupgrade.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Bundle size

`mtrl/react` is one entry: importing any component brings every element and its CSS into your
bundle. For an app that uses a few components and cares about every kilobyte, the
[Vanilla](../vanilla/) factories are the smallest.
