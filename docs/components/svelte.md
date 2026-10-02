---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Svelte

`material/svelte` has a Svelte 5 component for every mtrl web component, for Svelte apps and
SvelteKit. Each one renders its `<m-*>` element, so it looks and behaves exactly as the element
does. This page covers only what is particular to Svelte; [Getting started](../getting-started/)
has the install and the base stylesheet, and each component page has its options and events.

## Components

The components are named after the element: `Button`, `Switch`, `Tabs`, `TextField`. Import
them where you use them:

```svelte
<script lang="ts">
  import { Button, Switch } from 'material/svelte';
</script>

<Switch>Wi-Fi</Switch>
<Button variant="filled">Save</Button>
```

They ship as `.svelte` source files, not compiled JavaScript: the package's `svelte` export
condition points at them, and your build compiles them with your own components. The Svelte
plugin for Vite, which SvelteKit and Vite's Svelte template include, does this without any
setting. They are written with runes, so they need Svelte 5; with Svelte 4, use the
[web components](../web-components/) directly.

A component registers its element the first time it mounts, and importing `material/svelte` loads
the elements' styles, so the base stylesheet is the only CSS you add.

## Props

A component's props are its element's attributes, in camelCase: `supportingText` for
`supporting-text`, `ariaLabel` for `aria-label`. Pass numbers and expressions in braces.

```svelte
<script lang="ts">
  import { Slider, TextField } from 'material/svelte';
</script>

<TextField label="Email" type="email" supportingText="We never share it" required />
<Slider ariaLabel="Volume" min={0} max={100} step={5} />
```

They are rendered as attributes, so server markup carries them. `false` removes a boolean
attribute. Anything else you pass, such as `class`, `id` or `data-*`, lands on the element.

The live state (`checked`, `value`, `selected`) is a prop too, written to the element as a
property. Its attribute is the element's default, as `checked` is on a native checkbox, and
takes the `default` prefix: `defaultChecked`, `defaultValue`.

## Events

Element events are callback props, lowercase as Svelte 5 names them: `onchange`, `oninput`,
`onopen`, `onclose`, `onselect`. The handler receives the element's `CustomEvent`, with the
data in `detail`; every component page lists its events and their fields.

```svelte
<script lang="ts">
  import { Switch, TextField } from 'material/svelte';

  function setWifi(on: boolean) {
    console.log('Wi-Fi', on);
  }
  function search(query: string) {
    console.log('Searching for', query);
  }
</script>

<Switch onchange={(event) => setWifi(event.detail.checked)}>Wi-Fi</Switch>
<TextField label="Search" oninput={(event) => search(event.detail.value)} />
```

The events are typed, so `event.detail` is checked in your editor. Native events such as
`onclick` or `onfocus` are not the component's own: they reach the element as on any tag, with
the browser's event.

## Binding

Every live property is `$bindable`, so `bind:` works on each of them by its own name:
`bind:checked` on a switch or a checkbox, `bind:selected` on a toggle icon button, `bind:index`
on a carousel, and `bind:value` on the text field, slider, select, radios, tabs, chips, list,
search, date and time pickers, navigation rail, drawer and button group. Others, such as a
checkbox's `indeterminate`, bind the same way.

```svelte
<script lang="ts">
  import { Switch, Tabs, Tab } from 'material/svelte';

  let wifi = $state(true);
  let tab = $state<string | null>('songs');
</script>

<Switch bind:checked={wifi}>Wi-Fi</Switch>
<Tabs bind:value={tab}>
  <Tab value="songs">Songs</Tab>
  <Tab value="albums">Albums</Tab>
</Tabs>
<p>Wi-Fi is {wifi ? 'on' : 'off'}, showing {tab}.</p>
```

The binding is written back after each of the element's events, so a text field's
`bind:value` follows every keystroke. A prop without `bind:` doesn't hold the element: as with a
native input, `checked={false}` alone lets the user turn the switch on.

A dialog, a sheet or a menu opens from its `open` attribute. Pass your state, and put it back in
step when the user closes it:

```svelte
<script lang="ts">
  import { Button, Dialog } from 'material/svelte';

  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Delete</Button>
<Dialog {open} headline="Delete draft?" onclose={() => (open = false)}>
  <p>The draft will be deleted for good.</p>
  {#snippet actions()}
    <Button variant="text" onclick={() => (open = false)}>Cancel</Button>
    <Button variant="text" onclick={() => (open = false)}>Delete</Button>
  {/snippet}
</Dialog>
```

## Snippets and children

A component's children are its `children` snippet, which becomes the element's content: a
button's label, a dialog's or a card's text. A component's named regions, such as a dialog's
`headline` and `actions`, a card's `header-action` or a top app bar's `leading` and `trailing`,
are named snippets: `{#snippet actions()}`, as the dialog above does. A dashed name is
camelCase: `{#snippet headerAction()}`. A region that also has a text prop, such as `headline`
or `subhead`, takes either: the prop for plain text, the snippet for markup.

```svelte
<script lang="ts">
  import { Button, Card } from 'material/svelte';
</script>

<Card subhead="Updated today">
  {#snippet headline()}Release <em>notes</em>{/snippet}
  <p>What changed in this version.</p>
  {#snippet actions()}
    <Button variant="text">Read more</Button>
  {/snippet}
</Card>
```

Lists of items are declared with child components: `Tab`, `Radio`, `Chip`, `ListItem`,
`MenuItem`, `SelectOption`, `SearchSuggestion`, `NavigationRailItem`, `DrawerItem`,
`ButtonGroupItem` and `CarouselItem`. They render nothing themselves; their parent reads them.
Keep them direct children of their parent, with no element in between. `{#each}` and `{#if}`
are fine: the parent reads them again when they change.

```svelte
<script lang="ts">
  import { Radios, Radio } from 'material/svelte';

  const sizes = [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }, { value: 'l', label: 'Large' }];
  let size = $state<string | null>('m');
</script>

<Radios bind:value={size} ariaLabel="Size">
  {#each sizes as option (option.value)}
    <Radio value={option.value}>{option.label}</Radio>
  {/each}
</Radios>
```

## Reaching the element

`bind:this` on a component gives the component, whose `element` is the `<m-*>` element, with
its properties and methods. It is `null` until the component mounts. An attachment,
`{@attach}`, gets the element itself when it mounts:

```svelte
<script lang="ts">
  import { Button, TextField } from 'material/svelte';

  let field = $state<ReturnType<typeof TextField>>();
</script>

<TextField bind:this={field} label="Name" defaultValue="Ada Lovelace" {@attach (element) => element.focus()} />
<Button onclick={() => field?.element?.select()}>Select the name</Button>
```

Most of what you would call a method for has a prop or a binding, though: `open` on a dialog,
`bind:checked` rather than `toggle()`.

## SvelteKit and server rendering

The components render on the server. SvelteKit's HTML has each element's tag, its attributes
and its children, and a bound value as its attribute: a bound switch that is on renders
`<m-switch checked>`. Every module imports safely without a DOM, and the element registers
when the component mounts in the browser, so it upgrades as the page hydrates. There is nothing
to turn off for the server.

Until an element upgrades, it has no shadow root and so none of its styles. The pre-upgrade
stylesheet gives each element its final size and look meanwhile, so the page doesn't shift when
the script arrives. Import it once in your root `+layout.svelte`:

```typescript
import 'material/elements/preupgrade.css';
```

[Server rendering](../server-rendering/) explains what the server sends and how the upgrade
happens, for every framework.
