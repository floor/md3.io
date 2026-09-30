---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Icon button

An icon button is a button whose whole label is its icon: for an action people recognize
without words, where space is tight, as in a toolbar, an app bar or media controls. As a
toggle, it holds a binary state, such as favorited or muted, and swaps its icon to show it. See
the [M3 icon buttons guidelines](https://m3.material.io/components/icon-buttons/overview).

## Usage

`ariaLabel` is required: it is the button's only name.

```example
icon-button:
  icon: menuIcon
  ariaLabel: Open menu
  on click: openMenu()
```

## Examples

### Variant, size, shape and width

`variant` sets the emphasis, from `filled`, `tonal` and `outlined` to `standard`; `size` runs
from `xs` to `xl`, `shape` is `round` or `square`, and `width` is `narrow`, `default` or `wide`.

```example
icon-button:
  icon: editIcon
  ariaLabel: Edit
  variant: tonal
  size: m
  shape: square
  width: wide
```

### A toggle

With `toggle`, a click flips the selected state and emits `change`; `selectedIcon` is shown
while selected. Make the unselected icon outlined and the selected one filled, so the state
reads without the color. `selectedIcon` alone does not turn toggle mode on.

```example
icon-button:
  icon: heartOutlineIcon
  selectedIcon: heartFilledIcon
  toggle: true
  selected: false
  ariaLabel: Add to favorites
  on change: setFavorite(selected)
```

The DOM `toggle` event the element also dispatches is deprecated and goes in the next release.

### Changing it

An action changes the icon and the label together.

```example
icon-button:
  icon: playIcon
  ariaLabel: Play
  variant: filled
  on click: playing()
  action playing:
    set icon: pauseIcon
    set ariaLabel: Pause
```

## API

<!-- API: generated from mtrl's types and <m-icon-button>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `icon` | `string` | `undefined` | The icon, as an HTML string |
| `ariaLabel` | `string` | required | Accessible name; describes the action, not the icon |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'standard'` | `'standard'` | Visual style, in descending order of emphasis |
| `size` | `'xs' \| 's' \| 'm' \| 'l' \| 'xl'` | `'s'` | Container size |
| `shape` | `'round' \| 'square'` | `'round'` | Resting corner shape |
| `width` | `'narrow' \| 'default' \| 'wide'` | `'default'` | Width relative to the size's container |
| `toggle` | `boolean` | `false` | Toggle mode: a click selects and deselects, and emits `change` |
| `selectedIcon` | `string` | `undefined` | Icon shown while selected, in toggle mode |
| `selected` | `boolean` | `false` | Whether the button starts selected; only read when `toggle` is true |
| `toggleOnClick` | `boolean` | `true` | Whether a click flips the selected state; `false` when a container, such as a button group, owns the selection |
| `disabled` | `boolean` | `false` | Whether the button starts disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The underlying button's type attribute |
| `value` | `string` | `undefined` | Value attribute, for use in a form |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Only `duration` applies: how long, in ms, a released wave lingers before it is removed. `timing` and `opacity` are accepted and not applied |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `tooltip` | `boolean` | `true` | Accepted but not applied: no tooltip is rendered. Use the tooltip component beside the button |

### Methods

#### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setIcon(icon)` | `icon: string` | `IconButtonComponent` | Replaces the icon |
| `getIcon()` | none | `string` | The icon's HTML |
| `setSelectedIcon(icon)` | `icon: string` | `IconButtonComponent` | Replaces the selected-state icon |
| `getSelectedIcon()` | none | `string` | The selected-state icon's HTML, or an empty string |
| `setAriaLabel(label)` | `label: string` | `IconButtonComponent` | Sets the accessible name |
| `setValue(value)` | `value: string` | `IconButtonComponent` | Sets the value attribute |
| `getValue()` | none | `string` | The value attribute |

#### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` / `getVariant()` | `variant: string` | `IconButtonComponent` / `string` | The variant |
| `setSize(size)` / `getSize()` | `size: string` | `IconButtonComponent` / `string` | The size |
| `setShape(shape)` / `getShape()` | `shape: string` | `IconButtonComponent` / `string` | The shape |
| `setWidth(width)` / `getWidth()` | `width: string` | `IconButtonComponent` / `string` | The width |

#### State

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `select()` / `deselect()` | none | `IconButtonComponent` | Selects or deselects it, in toggle mode, without emitting `change` |
| `toggleSelected()` | none | `IconButtonComponent` | Flips the selected state |
| `isSelected()` | none | `boolean` | Whether it is selected |
| `isToggle()` | none | `boolean` | Whether toggle mode is on |
| `enable()` / `disable()` | none | `IconButtonComponent` | The disabled state |

#### Events, styles and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `IconButtonComponent` | Adds or removes a listener |
| `addClass(...classes)` / `removeClass(...classes)` | `...classes: string[]` | `IconButtonComponent` | Adds or removes CSS classes |
| `destroy()` | none | `void` | Takes it off the page and releases its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button element |
| `icon` | `IconAPI` | The icon slot: `setIcon`, `getIcon`, `getElement` |
| `disabled` | `object` | The disabled feature: `enable`, `disable`, `isDisabled` |
| `lifecycle` | `object` | The lifecycle feature: `destroy` |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | A click changed a toggle button's selected state | `{ selected }` |
| `click` | The button was activated; not fired while disabled | `{ event, element, originalEvent }` |
| `focus` / `blur` | The button took or lost focus | `{ event, element, originalEvent }` |

The web component's `change` carries `{ selected }`.

## Accessibility

- A native `<button>`, named only by `ariaLabel`. Describe the action, not the picture: "Add to
  favorites", not "Heart".
- A toggle has `aria-pressed`, kept in step with the selected state; don't set it yourself.
- Mark the icon's own SVG `aria-hidden="true"`, so the name is announced once.
- `Tab` focuses it; `Enter` and `Space` activate it. Disabled, it leaves the tab order.
- The `xs` and `s` sizes keep a 48dp touch target beyond their container.

## Styling

The press morph is driven by `:active`, so it has no state class. The custom properties are
shared with the button: `--mtrl-button-shape` sets the resting radius of both shapes.

```css
.mtrl-icon-button { }
.mtrl-icon-button__icon { }
.mtrl-icon-button--filled, .mtrl-icon-button--tonal, .mtrl-icon-button--outlined,
.mtrl-icon-button--standard { }
.mtrl-icon-button--xs, .mtrl-icon-button--m, .mtrl-icon-button--l, .mtrl-icon-button--xl { }
.mtrl-icon-button--square, .mtrl-icon-button--narrow, .mtrl-icon-button--wide { }
.mtrl-icon-button--toggle, .mtrl-icon-button--selected, .mtrl-icon-button--disabled { }

.toolbar {
  --mtrl-button-shape: 12px;          /* at rest */
  --mtrl-button-shape-pressed: 8px;   /* while pressed */
  --mtrl-button-shape-selected: 12px; /* while selected */
}
```

## Measurements

In dp. `s` is the default size and `default` width equals the container; a round button's
radius is half its height.

| Size | Container | Icon | Square radius | Pressed radius | Narrow width | Wide width |
|------|-----------|------|---------------|----------------|--------------|------------|
| `xs` | 32 | 20 | 12 | 8 | 28 | 40 |
| `s` | 40 | 24 | 12 | 8 | 32 | 52 |
| `m` | 56 | 24 | 16 | 12 | 48 | 72 |
| `l` | 96 | 32 | 28 | 16 | 64 | 128 |
| `xl` | 136 | 40 | 28 | 16 | 104 | 184 |
