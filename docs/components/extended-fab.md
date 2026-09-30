# Extended FAB

An extended FAB is a floating action button with a label: for a screen's primary action where
an icon alone would be a guess, such as "Compose" or "Add to cart". Where the icon is
unambiguous, use the [FAB](/docs/components/fab/). See the
[M3 extended FAB guidelines](https://m3.material.io/components/extended-fab/overview).

## Usage

The label names the button; `ariaLabel` replaces it when it would be ambiguous out of context.

```example
extended-fab:
  icon: editIcon
  text: Compose
  on click: createItem()
```

## Examples

### Color, size and width

`variant` takes the [FAB](/docs/components/fab/)'s color styles. `size` is `small` (56dp, the
default), `medium` or `large`, each with its own icon, spacing and label type. `width: 'fluid'`
stretches it to its container, as in a bottom sheet; `fixed` sizes it to its content.

```example
extended-fab:
  icon: addIcon
  text: Add to cart
  variant: secondary-container
  size: medium
  width: fluid
```

### The icon after the label

`iconPosition: 'end'` puts the icon after the label, in reading order as on screen.

```example
extended-fab:
  icon: shareIcon
  text: Share
  iconPosition: end
```

### Collapsing on scroll

An extended FAB can shrink to the FAB of its size, hiding its label, and expand again. With
`collapseOnScroll`, it collapses when the window scrolls more than 10px down, and expands on
the way up and at the top. In a scrolling box of your own, call `collapse()` and `expand()`.

```example
extended-fab:
  icon: editIcon
  text: Compose
  position: bottom-right
  collapseOnScroll: true
```

`position` fixes it to a corner, 16dp from both edges. Elevation works as on the FAB, with
`lower()` and `raise()`. Driving the collapse from a list's scrolling is planned for
[Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-extended-fab>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | The label |
| `icon` | `string` | `undefined` | Icon as an HTML string, usually an SVG |
| `variant` | `'primary-container' \| 'secondary-container' \| 'tertiary-container' \| 'primary' \| 'secondary' \| 'tertiary' \| 'surface'` | `'primary-container'` | Color style; `surface` is deprecated |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | Height, icon, spacing and label type style |
| `width` | `'fixed' \| 'fluid'` | `'fixed'` | Sized by its content, or by its container |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `undefined` | Fixes it to a corner of the viewport |
| `collapseOnScroll` | `boolean` | `false` | Collapses on scroll down, expands on scroll up and at the top |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Puts the icon before or after the label |
| `ariaLabel` | `string` | `undefined` | Accessible name, in place of the label |
| `disabled` | `boolean` | `false` | Creates it disabled |
| `iconSize` | `string` | `undefined` | Adds an `mtrl-icon--<value>` class to the icon, for your own CSS; the stylesheet has no rules for it |
| `animate` | `boolean` | `false` | Scales it in when it is added to the page |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Only `duration` applies: how long, in ms, a released wave lingers before it is removed. `timing` and `opacity` are accepted and not applied |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The button's `type` attribute |
| `value` | `string` | `undefined` | The button's `value` attribute, for forms |
| `class` | `string` | `undefined` | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(text)` / `getText()` | `text: string` | `ExtendedFabComponent` / `string` | The label |
| `setIcon(icon)` / `getIcon()` | `icon: string` | `ExtendedFabComponent` / `string` | The icon HTML |
| `collapse()` / `expand()` | none | `ExtendedFabComponent` | Hides or shows the label, and dispatches a `collapse` or `expand` DOM event on the element |
| `setPosition(position)` | `position: string` | `ExtendedFabComponent` | Moves it to another corner |
| `getPosition()` | none | `string \| null` | The current corner, or `null` when unpositioned |
| `lower()` / `raise()` | none | `ExtendedFabComponent` | The lowered or the normal elevation levels |
| `enable()` / `disable()` | none | `ExtendedFabComponent` | The disabled state |
| `setValue(value)` / `getValue()` | `value: string` | `ExtendedFabComponent` / `string` | The `value` attribute |
| `addClass(...classes)` | `...classes: string[]` | `ExtendedFabComponent` | Adds classes to the element |
| `getClass(name)` | `name: string` | `string` | Prefixes a name |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `ExtendedFabComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the element, its listeners and any scroll handler |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button |
| `icon` | `{ setIcon, getIcon, getElement }` | The icon manager |
| `text` | `{ setText, getText, getElement }` | The text manager |
| `disabled` | `{ enable, disable, isDisabled }` | The disabled-state manager |
| `lifecycle` | `{ destroy }` | The lifecycle manager |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | Pressed; not fired while disabled | `{ event, element, originalEvent }` |
| `focus` / `blur` | Took or lost focus | `{ event, element, originalEvent }` |
| `collapse` / `expand` | A DOM `CustomEvent` on `element`, not through `on()`: the label was hidden or shown | none |

## Accessibility

- A native `<button>`, named by its label, or by `ariaLabel`. Collapsed, the label is hidden
  from view and still names the button.
- `Tab` focuses it; `Space` and `Enter` activate it. Disabled, it leaves the tab order.
- Focus shows as a 2dp `outline` ring, 2dp from the edge.
- The label is one line, cut off with an ellipsis past 280dp: keep it to one or two words.

## Styling

Colors are the theme's roles, as on the FAB; the state layer takes the label color.

```css
.mtrl-extended-fab { }
.mtrl-extended-fab--primary-container, .mtrl-extended-fab--secondary-container,
.mtrl-extended-fab--tertiary-container, .mtrl-extended-fab--primary,
.mtrl-extended-fab--secondary, .mtrl-extended-fab--tertiary, .mtrl-extended-fab--surface { }
.mtrl-extended-fab--small, .mtrl-extended-fab--medium, .mtrl-extended-fab--large { }
.mtrl-extended-fab--fixed, .mtrl-extended-fab--fluid, .mtrl-extended-fab--icon-end { }
.mtrl-extended-fab--collapsed, .mtrl-extended-fab--collapsible { }
.mtrl-extended-fab--lowered, .mtrl-extended-fab--disabled, .mtrl-extended-fab--animate-enter { }
.mtrl-extended-fab--bottom-right { }
.mtrl-extended-fab__icon, .mtrl-extended-fab__text { }
```

## Measurements

From the Compose M3 token files named in the last column; the label type styles come from
Android, where Compose leaves them as a TODO.

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
| Lowered, rest / hover / focus / pressed | levels 1 / 2 / 1 / 1 | `ExtendedFabPrimaryTokens` |
| Offset from the corner | 16dp | the position rules in `_extended-fab.scss` |
| Collapse and expand | 0.3s and 0.25s | the transitions on the text element |
| Entrance | 0.3s, emphasized decelerate | the `extended-fab-enter` keyframes |
