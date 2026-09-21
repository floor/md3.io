# Extended FAB Component

An extended FAB is a floating action button that says what it does. It holds an
icon and a label in a rounded container 56, 80 or 96dp high, and it is for the primary
action on a screen where an icon alone would be a guess: "Create", "Add to
cart", "Compose". Where the icon is unambiguous, use the plain
[FAB](./fab.md) instead.

## Overview

It is a single `<button>` containing an icon element and a text element. The
things that vary:

- **variant** — the colour styles of the [FAB](./fab.md): `primary-container`
  (the default), `secondary-container` and `tertiary-container`, and the tone
  styles `primary`, `secondary` and `tertiary`. `surface` is deprecated.
- **size** — `small` (56dp, the default), `medium` (80dp) and `large` (96dp),
  each with its own icon, spacing and label type style.
- **width** — `fixed` sizes the button to its content; `fluid` stretches it to
  the full width of its container, which suits a bottom sheet or a narrow
  column.
- **position** — the four corners. Setting `position` makes the element
  `position: fixed`, pinned 16dp from both edges. Leave it unset to place the
  button yourself.
- **collapse** — an extended FAB can shrink to the FAB of its size, hiding its label,
  and expand again. Do it yourself with `collapse()` and `expand()`, or hand it
  to `collapseOnScroll`.

Elevation works as it does on the FAB: level 3 at rest, 4 on hover, 3 focused and
pressed, and `lower()` / `raise()` switch to and from the lowered ladder.

## Import

```javascript
import { createExtendedFab } from 'mtrl';
```

## Basic Usage

```javascript
const fab = createExtendedFab({
  icon: addIcon,
  text: 'Create',
  ariaLabel: 'Create new item',
  position: 'bottom-right'
});

fab.on('click', () => createItem());
document.body.appendChild(fab.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | — | The label |
| `icon` | `string` | — | Icon as an HTML string, usually an SVG |
| `variant` | `'primary-container' \| 'secondary-container' \| 'tertiary-container' \| 'primary' \| 'secondary' \| 'tertiary' \| 'surface'` | `'primary-container'` | Colour style; `surface` is deprecated |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | Height, icon, spacing and label type style |
| `width` | `'fixed' \| 'fluid'` | `'fixed'` | Sized by its content, or by its container |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | — | Fixes it to a corner of the viewport |
| `collapseOnScroll` | `boolean` | `false` | Collapses on scroll down, expands on scroll up and at the top |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Puts the icon before or after the label |
| `ariaLabel` | `string` | the `text` | Accessible name |
| `disabled` | `boolean` | `false` | Creates it disabled |
| `iconSize` | `string` | — | Adds an `mtrl-icon--<value>` class to the icon element. You supply the rule |
| `animate` | `boolean` | `false` | Scales the button in when it is added to the page |
| `ripple` | `boolean` | `true` | Ripple on press |
| `rippleConfig` | `{ duration, timing, opacity }` | — | Ripple tuning |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The button's `type` attribute |
| `value` | `string` | — | The button's `value` attribute, for form use |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'extended-fab'` | Name used in class generation |

`iconPosition: 'end'` places the label before the icon in the DOM, so the icon
follows it in reading order as well as on screen, and adds
`mtrl-extended-fab--icon-end` to the root. `iconSize` is a hook rather than
behaviour: it appends `mtrl-icon--<value>` and nothing more.

## Component API

### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(text)` | `text: string` | `ExtendedFabComponent` | Replaces the label |
| `getText()` | — | `string` | The current label |
| `setIcon(icon)` | `icon: string` | `ExtendedFabComponent` | Replaces the icon HTML |
| `getIcon()` | — | `string` | The current icon HTML |

### Shape and placement

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `collapse()` | — | `ExtendedFabComponent` | Shrinks to the FAB of its size and dispatches a `collapse` DOM event on the element |
| `expand()` | — | `ExtendedFabComponent` | Reveals the label again and dispatches `expand` the same way |
| `setPosition(position)` | `position: string` | `ExtendedFabComponent` | Moves it to another corner |
| `getPosition()` | — | `string \| null` | The current corner, or `null` when unpositioned |
| `lower()` | — | `ExtendedFabComponent` | Moves it to the lowered elevation ladder |
| `raise()` | — | `ExtendedFabComponent` | Restores the normal elevation ladder |

### State and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | — | `ExtendedFabComponent` | Makes it interactive again |
| `disable()` | — | `ExtendedFabComponent` | Disables it |
| `setValue(value)` | `value: string` | `ExtendedFabComponent` | Sets the `value` attribute |
| `getValue()` | — | `string` | Reads it |
| `addClass(...classes)` | `classes: string[]` | `ExtendedFabComponent` | Adds classes to the element |
| `getClass(name)` | `name: string` | `string` | Prefixes a name |
| `on(event, handler)` | `event: string, handler: Function` | `ExtendedFabComponent` | Subscribes to a forwarded event (`click`, `focus`, `blur`) |
| `off(event, handler)` | `event: string, handler: Function` | `ExtendedFabComponent` | Removes one |
| `destroy()` | — | `void` | Removes the element, its listeners and any scroll handler |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button |
| `icon` | `{ setIcon, getIcon, getElement }` | The icon manager |
| `text` | `{ setText, getText, getElement }` | The text manager |
| `disabled` | `{ enable, disable, isDisabled }` | The disabled-state manager; `isDisabled()` lives here |
| `lifecycle` | `{ destroy }` | The lifecycle manager |

## Events

Three native events are forwarded to `on()` — `click`, `focus` and `blur`. Any
other name is accepted by `on()` and never fires. The handler is not given the
DOM event: it receives `{ event, element, originalEvent }`, where `event` and
`originalEvent` are both the native event.

`collapse()` and `expand()` dispatch bubbling `CustomEvent`s of those names on
the element. They are DOM events and do not reach `on()`, which is a separate
emitter — listen for them with `element.addEventListener` only.

| Event | Reached by | Payload | Description |
|-------|------------|---------|-------------|
| `click` | `on()` | `{ event, element, originalEvent }` | Pressed. Suppressed while disabled |
| `focus` | `on()` | `{ event, element, originalEvent }` | Took focus |
| `blur` | `on()` | `{ event, element, originalEvent }` | Lost focus |
| `collapse` | `addEventListener` | `CustomEvent` | The label was hidden |
| `expand` | `addEventListener` | `CustomEvent` | The label came back |

## Examples

### Fixed and fluid width

The showcase puts both in a 400px box to make the difference visible: the fixed
one is as wide as its label, the fluid one fills the box.

```javascript
const fixed = createExtendedFab({
  icon: addIcon,
  text: 'Fixed Width Example',
  width: 'fixed'
});

const fluid = createExtendedFab({
  icon: addIcon,
  text: 'Fluid Width Example',
  width: 'fluid'
});
```

### Collapsing on scroll

With `collapseOnScroll`, the component watches `window.scrollY` and collapses
once the page moves more than 10px down, expands on the way up, and always
expands at the top of the page.

```javascript
const fab = createExtendedFab({
  icon: addIcon,
  text: 'Create',
  ariaLabel: 'Create new item',
  collapseOnScroll: true
});
```

Because it listens on `window`, a demo inside its own scrolling box (as the
showcase's is) will not react to that box's scrolling; drive it with
`collapse()` and `expand()` there instead.

### Driving it by hand

```javascript
const fab = createExtendedFab({ icon: addIcon, text: 'Compose' });

list.on('scroll-down', () => fab.collapse());
list.on('scroll-up', () => fab.expand());

fab.element.addEventListener('collapse', () => track('fab-collapsed'));
```

## Accessibility

- `ariaLabel` falls back to `text`, so a labelled extended FAB is already
  readable. Set it explicitly when the label is short enough to be ambiguous
  out of context — "Add" alone, say.
- **When it collapses, the label disappears visually but the accessible name
  does not change.** That is the behaviour you want, and it is a reason to keep
  `ariaLabel` accurate rather than relying on the visible text alone.
- The element is a real `<button>`: Tab reaches it, Space and Enter activate it,
  and `disabled` takes it out of the tab order.
- Focus shows as a 2dp `outline` ring offset 2dp from the edge.
- The label is a single line that ellipsises past 280dp. Keep it to one or two
  words so it never gets there.

## Styling

```css
.mtrl-extended-fab { }
.mtrl-extended-fab--primary-container { }
.mtrl-extended-fab--secondary-container { }
.mtrl-extended-fab--tertiary-container { }
.mtrl-extended-fab--primary { }
.mtrl-extended-fab--secondary { }
.mtrl-extended-fab--tertiary { }
.mtrl-extended-fab--surface { }
.mtrl-extended-fab--small { }
.mtrl-extended-fab--medium { }
.mtrl-extended-fab--large { }
.mtrl-extended-fab--icon-end { }
.mtrl-extended-fab--fixed { }
.mtrl-extended-fab--fluid { }
.mtrl-extended-fab--collapsed { }
.mtrl-extended-fab--collapsible { }
.mtrl-extended-fab--lowered { }
.mtrl-extended-fab--disabled { }
.mtrl-extended-fab--animate-enter { }

/* the corners */
.mtrl-extended-fab--bottom-right { }

/* inside */
.mtrl-extended-fab-icon { }
.mtrl-extended-fab-text { }
```

Colours come from the theme, not from component properties: each style is the
role it is named after on its `on-` role, and `surface` takes a `primary` icon
and label. The state layer uses the label colour.

## Measurements

Values follow the Compose M3 token files named in the source column; the label
type styles come from Android, where Compose leaves them as a TODO.

| Attribute | Value | Source |
|-----------|-------|--------|
| Height, small / medium / large | 56 / 80 / 96dp | `ExtendedFabSmallTokens`, `ExtendedFabMediumTokens`, `ExtendedFabLargeTokens` |
| Minimum width | the height | `_extended-fab.scss` |
| Leading and trailing space | 16 / 26 / 28dp | the same token files |
| Icon to label | 8 / 16 / 20dp | the same token files; Android says 8 / 12 / 16 |
| Corner | 16 / 20 / 28dp (`large`, `large-increased`, `extra-large`) | the token files; medium from Android `efab_tokens.xml` |
| Icon | 24 / 28 / 32dp | the token files; Android says 36dp at large |
| Label typography | `title-medium` / `title-large` / `headline-small` | Android `efab_tokens.xml` |
| Label maximum width | 280dp | `max-width` on the text element |
| Collapsed size | the FAB of the same size, 56 / 80 / 96dp | `_extended-fab.scss` |
| Elevation, rest / hover / focus / pressed | levels 3 / 4 / 3 / 3 | `ExtendedFabPrimaryTokens` |
| Lowered elevation, rest / hover / focus / pressed | levels 1 / 2 / 1 / 1 | `ExtendedFabPrimaryTokens` |
| Offset from the corner | 16dp | the position rules in `_extended-fab.scss` |
| Collapse and expand | 0.3s and 0.25s | the transitions on the text element |
| Entrance animation | 0.3s, emphasized decelerate | the `extended-fab-enter` keyframes |

`EXTENDED_FAB_ANIMATIONS` in `constants.ts` gives 250ms and 200ms for the
entrance and the collapse, but nothing reads it; the stylesheet's durations
above are what run.
