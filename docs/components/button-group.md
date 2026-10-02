---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Button group

A button group is a row, or a column, of buttons that belong together: a formatting toolbar, a
set of views, a unit picker. **Standard** groups space their buttons apart, each its own
control; **connected** groups join them into one, and are what M3 Expressive uses in place of
the [segmented button](/docs/components/button-group/). See the
[M3 button groups guidelines](https://m3.material.io/components/button-groups/overview).

## Usage

`selection: 'single'` or `'multi'` turns the buttons into toggle buttons; `required` keeps the
last selected one from being deselected.

```example
button-group:
  kind: connected
  selection: single
  required: true
  variant: tonal
  ariaLabel: Period
  buttons:
    - { text: Day, value: day, selected: true }
    - { text: Week, value: week }
    - { text: Month, value: month }
```

`change` reports the selection: the factory's payload has `values`, the selected values in
button order; the web component's detail has `value`, a string in a single group and an array
in a multi group.

## Examples

### Multiple selection

A group has no colors of its own: `variant` goes to every button. In a standard group, a
pressed button widens by `expandedRatio` of its width, taken from its neighbors.

```example
button-group:
  kind: standard
  selection: multi
  variant: outlined
  ariaLabel: Formatting
  buttons:
    - { text: Bold, value: bold, selected: true }
    - { text: Italic, value: italic }
    - { text: Underline, value: underline }
```

### Labels on the selected button

With `labels: 'selected'`, buttons with an icon and text show only the icon until they are
selected. A button with an icon and no text is an icon button, and needs its own `ariaLabel`.

```example
button-group:
  kind: connected
  selection: single
  required: true
  labels: selected
  variant: tonal
  ariaLabel: Mode
  buttons:
    - { icon: searchIcon, text: Explore, value: explore, selected: true }
    - { icon: locationIcon, text: Nearby, value: nearby }
    - { icon: settingsIcon, text: Settings, value: settings }
```

### Size, shape and layout

`size` runs from `xs` to `xl` and sets every button's height; `shape` rounds or squares the
outer ends. `orientation`, `density` and `equalWidth` lay the group out.

```example
button-group:
  kind: connected
  size: m
  shape: square
  equalWidth: true
  ariaLabel: Zoom
  buttons:
    - { text: Fit, value: fit }
    - { text: 100%, value: actual }
    - { text: 200%, value: double }
```

## API

<!-- API: generated from mtrl's types and <m-button-group>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buttons` | `ButtonGroupItemConfig[]` | `[]` | The buttons, in order |
| `kind` | `'standard' \| 'connected'` | `'standard'` | Spaced buttons, or one joined control |
| `selection` | `'none' \| 'single' \| 'multi'` | `'none'` | Plain actions, or toggle buttons |
| `required` | `boolean` | `false` | With a selection, the last selected button cannot be deselected |
| `shape` | `'round' \| 'square'` | `'round'` | Corner style of the outer ends |
| `size` | `'xs' \| 's' \| 'm' \| 'l' \| 'xl'` | `'s'` | Shared by every button |
| `labels` | `'always' \| 'selected'` | `'always'` | `'selected'` keeps buttons icon-only until selected |
| `expandedRatio` | `number` | `0.15` | Standard groups: the share of its width a pressed button gains; `0` turns the motion off |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'elevated' \| 'text'` | `'outlined'` | Applied to every button |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Row or column |
| `density` | `'default' \| 'comfortable' \| 'compact'` | `'default'` | Lowers the height by 4dp per step |
| `disabled` | `boolean` | `false` | Disables the whole group |
| `equalWidth` | `boolean` | `false` | Gives every button the same width |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Only `duration` applies: how long, in ms, a released wave lingers before it is removed. `timing` and `opacity` are accepted and not applied |
| `ariaLabel` | `string` | `'Button group'` | Accessible name of the group |
| `class` | `string` | `undefined` | Extra classes on the container |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `on` | `{ click?, focus?, blur?, change? }` | `undefined` | Accepted but not applied: register handlers with `on()` |

#### Each button

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | Label; a button with an icon and no text is an icon button |
| `icon` | `string` | `undefined` | Icon as an HTML string |
| `selectedIcon` | `string` | `undefined` | Icon shown while selected, on icon-only buttons |
| `value` | `string` | `undefined` | Identifies the button in the selection methods and `change` |
| `id` | `string` | `undefined` | Another identifier; falls back to the index |
| `selected` | `boolean` | `false` | Initially selected, in a selection group |
| `disabled` | `boolean` | `false` | Disables this button only |
| `ariaLabel` | `string` | `undefined` | The name of an icon-only button; nothing checks that it is there |
| `class` | `string` | `undefined` | Extra classes on this button |

### Methods

#### Selection

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSelected()` | none | `string[]` | Values of the selected buttons, in button order |
| `isSelected(value)` | `value: string` | `boolean` | Whether that button is selected |
| `select(value)` | `value: string` | `ButtonGroupComponent` | Selects it, deselecting the others in a single group |
| `deselect(value)` | `value: string` | `ButtonGroupComponent` | Deselects it, unless `required` would leave nothing selected |
| `toggle(value)` | `value: string` | `ButtonGroupComponent` | Flips it |
| `getSelection()` | none | `ButtonGroupSelection` | The selection mode |
| `getKind()` | none | `ButtonGroupKind` | `'standard'` or `'connected'` |

`select()`, `deselect()` and `toggle()` emit `change` when they change something, without
`originalEvent`.

#### Buttons and appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getButton(index)` | `index: number` | `ButtonComponent \| undefined` | The button at that position |
| `getButtonById(id)` | `id: string` | `ButtonComponent \| undefined` | Matched against the button's `id` or its `value` |
| `getVariant()` / `setVariant(variant)` | `variant: ButtonGroupVariant` | `ButtonGroupVariant` / `ButtonGroupComponent` | Restyles every button |
| `getOrientation()` / `setOrientation(orientation)` | `orientation: ButtonGroupOrientation` | `ButtonGroupOrientation` / `ButtonGroupComponent` | Row or column |
| `getDensity()` / `setDensity(density)` | `density: ButtonGroupDensity` | `ButtonGroupDensity` / `ButtonGroupComponent` | Recomputes the height and spacing |

#### State and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` / `disable()` | none | `ButtonGroupComponent` | Every button; `enable()` leaves the individually disabled ones |
| `enableButton(index)` / `disableButton(index)` | `index: number` | `ButtonGroupComponent` | One button, by position |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `ButtonGroupComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Destroys every button and releases the container |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The `role="group"` container |
| `buttons` | `ButtonComponent[]` | The button components, in order |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | An enabled button was activated | `{ buttonGroup, button, index, originalEvent }` |
| `focus` / `blur` | A button took or lost focus | `{ buttonGroup, button, index, originalEvent }` |
| `change` | The selection changed | `{ buttonGroup, values, selected, button?, originalEvent? }` |

`click` fires before `change`, so a press in a selection group emits both. `selected` holds the
selected button components. The web component's `change` carries `{ value }`, and every press
dispatches `action` with `{ value, index }`.

## Accessibility

- The container has `role="group"` and an `aria-label`, `"Button group"` unless you name it.
- In a selection group every button has `aria-pressed`, kept in step whether the selection
  changed by a press or a method.
- Name icon-only buttons with `ariaLabel`; nothing warns when one is missing.
- `Tab` moves through the buttons, native `<button>`s that `Space` and `Enter` activate. The
  group adds no arrow-key navigation.

## Styling

The component writes its measurements as custom properties **inline** on the container, so
only a declaration with `!important`, or one on the element itself, overrides them.

```css
.mtrl-button-group { }
.mtrl-button-group--standard, .mtrl-button-group--connected { }
.mtrl-button-group--tonal { }
.mtrl-button-group--size-s { }
.mtrl-button-group--square, .mtrl-button-group--vertical, .mtrl-button-group--equal-width { }
.mtrl-button-group--selectable, .mtrl-button-group--labels-selected, .mtrl-button-group--disabled { }
.mtrl-button-group__button { }
.mtrl-button-group__button--first, .mtrl-button-group__button--middle,
.mtrl-button-group__button--last, .mtrl-button-group__button--single { }
.mtrl-button-group__button--selected { }

.toolbar .mtrl-button-group {
  --mtrl-button-group-height: 40px !important;
  --mtrl-button-group-icon: 20px !important;
  --mtrl-button-group-gap: 12px !important;
  --mtrl-button-group-inner-corner: 8px !important;
  --mtrl-button-group-pressed-corner: 4px !important;
  --mtrl-button-group-radius: 20px !important;
}
```

## Measurements

From the M3 button group specs, `ButtonGroupSmallTokens` and
`ConnectedButtonGroupSmallTokens` (`BUTTON_GROUP_SIZE_TOKENS` in mtrl).

| Size | Height | Icon | Standard gap | Connected inner corner |
|------|--------|------|--------------|------------------------|
| `xs` | 32dp | 20dp | 18dp | 4dp |
| `s` (default) | 40dp | 20dp | 12dp | 8dp |
| `m` | 56dp | 24dp | 8dp | 8dp |
| `l` | 96dp | 32dp | 8dp | 16dp |
| `xl` | 136dp | 40dp | 8dp | 20dp |

Connected groups have a 2dp gap at every size, a 4dp inner corner while pressed
(`ConnectedButtonGroupSmallTokens.PressedInnerCornerCornerSize`), and a 48dp minimum button
width at `xs` and `s`. The container radius is half its height. The pressed expansion,
`ButtonGroupDefaults.ExpandedRatio`, runs in horizontal standard groups only, and a neighbor
never gives up more than the padding on its facing side.
