# FAB Component

A floating action button carries the one action a screen is really for: compose,
add, start. It is a circular button that floats above the content, holds an icon
and no label, and there should be at most one of them in view. If the action
needs a word to be understood, use the [extended FAB](./extended-fab.md)
instead.

## Overview

The FAB is a single `<button>` with an icon inside it. Three things vary:

- **variant** — the three container styles `primary-container` (the default),
  `secondary-container` and `tertiary-container`, and the three tone styles
  `primary`, `secondary` and `tertiary`. Each takes the colour it is named after
  and its matching `on-` colour from the theme. `surface` is deprecated.
- **size** — `default` (56dp), `medium` (80dp) and `large` (96dp). `small`
  (40dp) is deprecated in M3 expressive.
- **position** — the four corners. Setting `position` makes the element
  `position: fixed` and pins it 16dp from both edges. Leave it unset to place
  the FAB yourself, which is what you want inside a card, a sheet or a
  [bottom app bar](./bottom-app-bar.md).

A FAB rests at elevation level 3 in every style, rises to 4 on hover and stays at
3 when focused or pressed. `lower()` moves it to the lowered ladder, 1 at rest and
2 on hover, and `raise()` restores the normal one.

## Import

```javascript
import { createFab } from 'mtrl';
```

## Basic Usage

```javascript
const fab = createFab({
  icon: addIcon,
  ariaLabel: 'Add new item',
  position: 'bottom-right'
});

fab.on('click', () => createItem());
document.body.appendChild(fab.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `icon` | `string` | — | Icon as an HTML string, usually an SVG |
| `variant` | `'primary-container' \| 'secondary-container' \| 'tertiary-container' \| 'primary' \| 'secondary' \| 'tertiary' \| 'surface'` | `'primary-container'` | Colour style; `surface` is deprecated |
| `size` | `'small' \| 'default' \| 'medium' \| 'large'` | `'default'` | Container, icon and corner; `small` is deprecated |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | — | Fixes the FAB to a corner of the viewport |
| `ariaLabel` | `string` | `'action'` when an icon is set | Accessible name. Always set it |
| `disabled` | `boolean` | `false` | Creates it disabled |
| `iconSize` | `string` | — | Adds an `mtrl-icon--<value>` class to the icon element. You supply the rule |
| `animate` | `boolean` | `false` | Scales the FAB in when it is added to the page |
| `ripple` | `boolean` | `true` | Ripple on press |
| `rippleConfig` | `{ duration, timing, opacity }` | — | Ripple tuning |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The button's `type` attribute |
| `value` | `string` | — | The button's `value` attribute, for form use |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'fab'` | Name used in class generation |

`iconSize` is worth reading twice: it does not set a pixel size. It appends
`mtrl-icon--<value>` to the icon span, and the library ships no rules for those
classes, so `iconSize: '32px'` gives you a `mtrl-icon--32px` hook and nothing
else until you write the CSS.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setIcon(icon)` | `icon: string` | `FabComponent` | Replaces the icon HTML |
| `getIcon()` | — | `string` | The current icon HTML |
| `setPosition(position)` | `position: string` | `FabComponent` | Moves it to another corner |
| `getPosition()` | — | `string \| null` | The current corner, or `null` when unpositioned |
| `lower()` | — | `FabComponent` | Moves it to the lowered elevation ladder |
| `raise()` | — | `FabComponent` | Restores the normal elevation ladder |
| `enable()` | — | `FabComponent` | Makes it interactive again |
| `disable()` | — | `FabComponent` | Disables it |
| `setValue(value)` | `value: string` | `FabComponent` | Sets the `value` attribute |
| `getValue()` | — | `string` | Reads it |
| `addClass(...classes)` | `classes: string[]` | `FabComponent` | Adds classes to the element |
| `getClass(name)` | `name: string` | `string` | Prefixes a name, e.g. `'fab'` → `'mtrl-fab'` |
| `on(event, handler)` | `event: string, handler: Function` | `FabComponent` | Subscribes to a forwarded event (`click`, `focus`, `blur`) |
| `off(event, handler)` | `event: string, handler: Function` | `FabComponent` | Removes one |
| `destroy()` | — | `void` | Removes the element and its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button |
| `icon` | `{ setIcon, getIcon, getElement }` | The icon manager, when you need the icon element itself |
| `disabled` | `{ enable, disable, isDisabled }` | The disabled-state manager; `isDisabled()` lives here, not on the component |
| `lifecycle` | `{ destroy }` | The lifecycle manager |

## Events

The FAB forwards exactly three native events to `on()` — `click`, `focus` and
`blur`. Any other name is accepted by `on()` and never fires; reach for
`element.addEventListener` for those.

The handler is not given the DOM event. It receives a wrapper,
`{ event, element, originalEvent }`, in which `event` and `originalEvent` are
both the native event and `element` is the FAB's button.

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `{ event, element, originalEvent }` | Pressed. Suppressed while the button is disabled |
| `focus` | `{ event, element, originalEvent }` | Took focus |
| `blur` | `{ event, element, originalEvent }` | Lost focus |

## Examples

### The colour styles

The showcase renders one FAB per colour style:

```javascript
for (const variant of ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary']) {
  const fab = createFab({
    icon: addIcon,
    variant,
    ariaLabel: `${variant} action`
  });
  container.appendChild(fab.element);
}
```

### Sizes

The stylesheet sizes the icon with the container, 24dp at default, 28dp at
medium and 32dp at large, so one SVG serves every size:

```javascript
const standard = createFab({ icon: addIcon, ariaLabel: 'Add' });
const medium = createFab({ icon: addIcon, size: 'medium', ariaLabel: 'Add' });
const large = createFab({ icon: addIcon, size: 'large', ariaLabel: 'Add' });
```

### Changing it while it is on screen

```javascript
const fab = createFab({ icon: addIcon, ariaLabel: 'Add' });

editMode.on('change', (editing) => {
  fab.setIcon(editing ? editIcon : addIcon);
  fab.element.setAttribute('aria-label', editing ? 'Save changes' : 'Add');
});

save.on('start', () => fab.lower().disable());
save.on('done', () => fab.raise().enable());
```

## Accessibility

- A FAB has no visible text, so `ariaLabel` is doing all the work. It falls back
  to the literal string `"action"` when an icon is set and no label is given —
  useless to a screen reader, so always pass one.
- The element is a real `<button>`: Tab reaches it, Space and Enter activate it,
  and `disabled` removes it from the tab order.
- Focus shows as a 2dp `outline` ring offset 2dp from the edge, so it stays
  visible against the FAB's own colour.
- Update the label whenever you change the icon. The icon and the accessible
  name have to keep saying the same thing.
- A fixed FAB sits above the content, so leave room at the bottom of scrollable
  views for it not to cover the last item.

## Styling

```css
.mtrl-fab { }
.mtrl-fab--primary-container { }
.mtrl-fab--secondary-container { }
.mtrl-fab--tertiary-container { }
.mtrl-fab--primary { }
.mtrl-fab--secondary { }
.mtrl-fab--tertiary { }
.mtrl-fab--surface { }
.mtrl-fab--small { }
.mtrl-fab--default { }
.mtrl-fab--medium { }
.mtrl-fab--large { }
.mtrl-fab--lowered { }
.mtrl-fab--disabled { }
.mtrl-fab--animate-enter { }

/* the corners */
.mtrl-fab--top-left { }
.mtrl-fab--top-right { }
.mtrl-fab--bottom-left { }
.mtrl-fab--bottom-right { }

/* the icon inside */
.mtrl-fab-icon { }
```

Colours are theme colours, not component properties: each style is the role it
is named after on its `on-` role, `primary-container` on `on-primary-container`,
`primary` on `on-primary`, and so on, with `surface` taking a `primary` icon. The
state layer uses the icon colour. Restyle the theme and every FAB follows.

## Measurements

Values follow the Compose M3 token files named in the source column.

| Attribute | Value | Source |
|-----------|-------|--------|
| Container, default | 56dp | `FabBaselineTokens` |
| Container, medium | 80dp | `FabMediumTokens` |
| Container, large | 96dp | `FabLargeTokens` |
| Container, small (deprecated) | 40dp | `FabSmallTokens` |
| Corner, default | `get-shape('large')`, 16dp | `FabBaselineTokens` |
| Corner, medium | `get-shape('large-increased')`, 20dp | Android `fab_tokens.xml`; Compose leaves it as a TODO |
| Corner, large | `get-shape('extra-large')`, 28dp | `FabLargeTokens` |
| Corner, small | `get-shape('medium')`, 12dp | `FabSmallTokens` |
| Icon, default and small | 24dp | `FabBaselineTokens`, `FabSmallTokens` |
| Icon, medium | 28dp | `FabMediumTokens` |
| Icon, large | 32dp | `FabLargeTokens`; Android says 36dp |
| Elevation, rest / hover / focus / pressed | levels 3 / 4 / 3 / 3 | `FabPrimaryContainerTokens` |
| Lowered elevation, rest / hover / focus / pressed | levels 1 / 2 / 1 / 1 | `ExtendedFabPrimaryTokens` |
| Disabled | `on-surface` at 12% container and 38% icon, level 0 | library policy; the FAB tokens define no disabled state |
| Offset from the corner | 16dp | the position rules in `_fab.scss` |
| Entrance animation | 0.3s, emphasized decelerate | the `fab-enter` keyframes in `_fab.scss` |

`FAB_ICON_SIZES` in `constants.ts` lists 20, 24 and 36px, but nothing reads it;
the stylesheet is what ships, and it gives the small FAB a 24dp icon.
