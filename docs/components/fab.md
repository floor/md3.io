---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# FAB

A floating action button (FAB) carries the one action a screen is for: compose, add, start. It
floats above the content, holds an icon and no label, and there is at most one in view. When
the action needs a word, use the [extended FAB](/docs/components/extended-fab/). See the
[M3 FAB guidelines](https://m3.material.io/components/floating-action-button/overview).

## Usage

`ariaLabel` is required: a FAB has no visible text.

```example
fab:
  icon: addIcon
  ariaLabel: Create new item
  on click: createItem()
```

## Examples

### Color and size

`variant` is one of the container styles `primary-container` (the default),
`secondary-container` and `tertiary-container`, or the tone styles `primary`, `secondary` and
`tertiary`; each takes its color and the matching `on-` color from the theme. `size` is
`default`, `medium` or `large`, and the icon grows with it, so one SVG serves every size.
`small` and `surface` are deprecated.

```example
fab:
  icon: editIcon
  ariaLabel: Edit
  variant: tertiary
  size: large
```

### In a corner

`position` fixes the FAB to a corner of the viewport, 16dp from both edges. Leave it unset to
place the FAB yourself, as in a card, a sheet or a
[bottom app bar](/docs/components/bottom-app-bar/).

```example
fab:
  icon: addIcon
  ariaLabel: Create new item
  position: bottom-right
```

A FAB rests at elevation level 3 and rises to 4 on hover; `lower()` moves it to the lowered
levels, 1 and 2, and `raise()` restores them. `animate: true` scales it in when it is added to
the page.

## API

<!-- API: generated from mtrl's types and <m-fab>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `icon` | `string` | `undefined` | Icon as an HTML string, usually an SVG |
| `ariaLabel` | `string` | required | Accessible name |
| `variant` | `'primary-container' \| 'secondary-container' \| 'tertiary-container' \| 'primary' \| 'secondary' \| 'tertiary' \| 'surface'` | `'primary-container'` | Color style; `surface` is deprecated |
| `size` | `'small' \| 'default' \| 'medium' \| 'large'` | `'default'` | Container, icon and corner; `small` is deprecated |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `undefined` | Fixes the FAB to a corner of the viewport |
| `disabled` | `boolean` | `false` | Creates it disabled |
| `iconSize` | `string` | `undefined` | Adds an `mtrl-icon--<value>` class to the icon, for your own CSS; the stylesheet has no rules for it |
| `animate` | `boolean` | `false` | Scales the FAB in when it is added to the page |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Only `duration` applies: how long, in ms, a released wave lingers before it is removed. `timing` and `opacity` are accepted and not applied |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The button's `type` attribute |
| `value` | `string` | `undefined` | The button's `value` attribute, for forms |
| `class` | `string` | `undefined` | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setIcon(icon)` / `getIcon()` | `icon: string` | `FabComponent` / `string` | The icon HTML |
| `setPosition(position)` | `position: string` | `FabComponent` | Moves it to another corner |
| `getPosition()` | none | `string \| null` | The current corner, or `null` when unpositioned |
| `lower()` / `raise()` | none | `FabComponent` | The lowered or the normal elevation levels |
| `enable()` / `disable()` | none | `FabComponent` | The disabled state |
| `setValue(value)` / `getValue()` | `value: string` | `FabComponent` / `string` | The `value` attribute |
| `addClass(...classes)` | `...classes: string[]` | `FabComponent` | Adds classes to the element |
| `getClass(name)` | `name: string` | `string` | Prefixes a name: `'fab'` gives `'mtrl-fab'` |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `FabComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the element and its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button |
| `icon` | `{ setIcon, getIcon, getElement }` | The icon manager |
| `disabled` | `{ enable, disable, isDisabled }` | The disabled-state manager |
| `lifecycle` | `{ destroy }` | The lifecycle manager |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | Pressed; not fired while disabled | `{ event, element, originalEvent }` |
| `focus` / `blur` | Took or lost focus | `{ event, element, originalEvent }` |

`event` and `originalEvent` are the same DOM event; `element` is the button.

## Accessibility

- A native `<button>`, named only by `ariaLabel`. When the icon changes, change the label with
  it.
- `Tab` focuses it; `Space` and `Enter` activate it. Disabled, it leaves the tab order.
- Focus shows as a 2dp `outline` ring, 2dp from the edge.
- A fixed FAB covers the content under it: leave room at the end of a scrolling view.

## Styling

Colors are the theme's roles: each style is the role it is named after, on its `on-` role, and
the state layer takes the icon color.

```css
.mtrl-fab { }
.mtrl-fab--primary-container, .mtrl-fab--secondary-container, .mtrl-fab--tertiary-container { }
.mtrl-fab--primary, .mtrl-fab--secondary, .mtrl-fab--tertiary, .mtrl-fab--surface { }
.mtrl-fab--small, .mtrl-fab--default, .mtrl-fab--medium, .mtrl-fab--large { }
.mtrl-fab--lowered, .mtrl-fab--disabled, .mtrl-fab--animate-enter { }
.mtrl-fab--top-left, .mtrl-fab--top-right, .mtrl-fab--bottom-left, .mtrl-fab--bottom-right { }
.mtrl-fab__icon { }
```

## Measurements

From the Compose M3 token files named in the last column.

| Attribute | Value | Source |
|-----------|-------|--------|
| Container, default | 56dp | `FabBaselineTokens` |
| Container, medium | 80dp | `FabMediumTokens` |
| Container, large | 96dp | `FabLargeTokens` |
| Container, small (deprecated) | 40dp | `FabSmallTokens` |
| Corner, default | 16dp (`large`) | `FabBaselineTokens` |
| Corner, medium | 20dp (`large-increased`) | Android `fab_tokens.xml` |
| Corner, large | 28dp (`extra-large`) | `FabLargeTokens` |
| Corner, small | 12dp (`medium`) | `FabSmallTokens` |
| Icon, default and small | 24dp | `FabBaselineTokens`, `FabSmallTokens` |
| Icon, medium | 28dp | `FabMediumTokens` |
| Icon, large | 32dp | `FabLargeTokens`; Android says 36dp |
| Elevation, rest / hover / focus / pressed | levels 3 / 4 / 3 / 3 | `FabPrimaryContainerTokens` |
| Lowered, rest / hover / focus / pressed | levels 1 / 2 / 1 / 1 | `ExtendedFabPrimaryTokens` |
| Disabled | `on-surface` at 12% container and 38% icon, level 0 | library policy; the FAB tokens define no disabled state |
| Offset from the corner | 16dp | the position rules in `_fab.scss` |
| Entrance | 0.3s, emphasized decelerate | the `fab-enter` keyframes in `_fab.scss` |
