---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Segmented button

A segmented button is one container split into two to five segments, each an option: a view
switcher, a sort order, a set of filters. A selected segment shows a checkmark, so the row
keeps its shape while the choice changes. See the
[M3 segmented buttons guidelines](https://m3.material.io/components/segmented-buttons/overview).

**M3 Expressive deprecates the segmented button** for the connected
[button group](/docs/components/button-group/), and so does mtrl. It still ships and behaves as
described here. To migrate, use `kind: 'connected'`, rename `segments` to `buttons` and `mode`
to `selection`, and add `required: true` to a single group with its first button `selected`;
`getValue()` becomes `getSelected()`, and `change` reports `values`. There is no web
component.

## Usage

In single mode, the first enabled segment is selected when none is.

```example
segmented-button:
  mode: single
  segments:
    - { text: List, value: list, selected: true }
    - { text: Grid, value: grid }
    - { text: Map, value: map }
```

## Examples

### Multiple selection

`mode: 'multi'` allows several segments, or none. `change` carries the selected values as an
array, and fires only when the selection differs, from a click or from `select()` and
`deselect()`.

```example
segmented-button:
  mode: multi
  segments:
    - { text: $, value: low }
    - { text: $$, value: medium }
    - { text: $$$, value: high }
  on change: filterByPrice(value)
```

### Icons and the checkmark

With text only, the checkmark appears before the label; with an icon and text, it replaces the
icon; an icon-only segment keeps its icon. A segment's `checkmarkIcon` replaces the check.

```example
segmented-button:
  mode: single
  segments:
    - { icon: walkIcon, text: Walk, value: walk, selected: true }
    - { icon: bikeIcon, text: Bike, value: bike }
    - { icon: carIcon, text: Drive, value: drive }
```

## API

<!-- API: generated from mtrl's types in a later step. Until then these tables are
hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `segments` | `SegmentConfig[]` | `undefined` | The segments, in order |
| `mode` | `SelectionMode \| 'single' \| 'multi'` | `'single'` | One selection at a time, or several |
| `density` | `Density \| string` | `'default'` | `'default'`, `'comfortable'` or `'compact'` |
| `disabled` | `boolean` | `false` | Disables every segment |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Only `duration` applies: how long, in ms, a released wave lingers before it is removed. `timing` and `opacity` are accepted and not applied |
| `class` | `string` | `undefined` | Extra classes on the container |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `on` | `{ change? }` | `undefined` | Accepted but not applied: register handlers with `on()` |

`SelectionMode` and `Density` are string enums exported by `mtrl/components/segmented-button`.

#### Each segment

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | Label |
| `icon` | `string` | `undefined` | Icon as an HTML string |
| `value` | `string` | the text | Identifies the segment in the methods and events |
| `selected` | `boolean` | `false` | Initially selected |
| `disabled` | `boolean` | `false` | Disables this segment only |
| `checkmarkIcon` | `string` | a filled check | Replaces the selected-state checkmark |
| `class` | `string` | `undefined` | Extra classes on this segment |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSelected()` | none | `Segment[]` | The selected segments |
| `getValue()` | none | `string[]` | Their values |
| `select(value)` | `value: string` | `SegmentedButtonComponent` | Selects that segment, disabled or not; in single mode it deselects the others. An unknown value clears the selection |
| `deselect(value)` | `value: string` | `SegmentedButtonComponent` | Deselects it; in single mode, not the last selected one |
| `enable()` / `disable()` | none | `SegmentedButtonComponent` | Every segment; `enable()` leaves the individually disabled ones |
| `enableSegment(value)` / `disableSegment(value)` | `value: string` | `SegmentedButtonComponent` | One segment, by value |
| `setDensity(density)` / `getDensity()` | `density: Density \| string` | `SegmentedButtonComponent` / `string` | The density class, which sets height and padding |
| `on(event, handler)` / `off(event, handler)` | `event: 'change', handler: Function` | `SegmentedButtonComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Destroys every segment and releases the container |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The `role="group"` container |
| `segments` | `Segment[]` | The segments, in order: `element`, `value`, `isSelected()`, `setSelected()`, `isDisabled()`, `setDisabled()`, `destroy()`. Their setters emit no `change` |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The selection changed | `{ selected, value, oldValue }` |

`selected` holds the selected `Segment`s, `value` their values, `oldValue` the values before.

## Accessibility

- The container is a `role="group"` named `"Segmented button"`; to name it better, set
  `aria-label` on `element`.
- Each segment is a native `<button>` with `aria-pressed`. Its name is its text, or its `value`:
  give an icon-only segment a `value` that reads as a label.
- `Tab` reaches every segment; `Space` and `Enter` activate it. There is no arrow-key
  navigation.
- Focus shows as a 2dp `secondary` outline inside the segment, which the rounded ends don't
  clip.

## Styling

The container carries `data-mode` and `data-density`. The stylesheet sets the sizes as custom
properties per density class, and hands each segment its corners through the button's
`--mtrl-button-shape` properties: only the first and last segments round off.

```css
.mtrl-segmented-button { }
.mtrl-segmented-button--comfortable, .mtrl-segmented-button--compact,
.mtrl-segmented-button--disabled { }
.mtrl-segmented-button__segment, .mtrl-segment--selected, .mtrl-segment-checkmark { }

.filters .mtrl-segmented-button {
  --segment-height: 40px;
  --segment-padding-x: 24px;
  --segment-padding-icon-only: 12px;
  --segment-padding-icon-text-left: 12px;
  --segment-padding-icon-text-right: 16px;
  --segment-border-radius: 20px;
}
```

## Measurements

| Attribute | Value | Source |
|-----------|-------|--------|
| Height, default / comfortable / compact | 40 / 36 / 32dp | `OutlinedSegmentedButtonTokens`, less 4dp per density step |
| Container corner | half the height | `--segment-border-radius` |
| Minimum segment width | 48dp | `min-width` on the segment |
| Horizontal padding | 24dp | `--segment-padding-x` |
| Hover and pressed state layers | 8% and 12% `on-surface` | the M3 state layers |
