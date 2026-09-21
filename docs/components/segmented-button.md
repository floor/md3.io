# Segmented Button Component

A segmented button is a single container split into two to five segments, each
one an option: a view switcher, a sort order, a set of filters. Selecting a
segment marks it with a checkmark rather than moving it, so the row keeps its
shape while the choice changes.

## Overview

**Material 3 expressive deprecates the segmented button.** Its replacement is
the connected [button group](./button-group.md), which does the same job with
`kind: 'connected'` and `selection: 'single'` or `'multi'`, and which follows
the current spec for shape, size and state. Reach for that in new work.

The component still ships and still behaves as documented here, so existing code
keeps working. Everything below describes what it actually does today.

Migrating is mostly a rename:

```javascript
// segmented button
createSegmentedButton({
  mode: 'single',
  segments: [{ text: 'List', value: 'list', selected: true }, { text: 'Grid', value: 'grid' }]
});

// the connected button group that replaces it
createButtonGroup({
  kind: 'connected',
  selection: 'single',
  buttons: [{ text: 'List', value: 'list', selected: true }, { text: 'Grid', value: 'grid' }]
});
```

## Import

```javascript
import { createSegmentedButton } from 'mtrl';
```

The source declares `SelectionMode` and `Density` as string enums, but neither
is reachable from an application: the package exports only `mtrl` and
`mtrl/styles`, so `mtrl/components/segmented-button` does not resolve, and the
package root re-exports the component's types but not those two runtime values.
Pass the strings instead — `'single'`, `'multi'`, and `'default'`,
`'comfortable'`, `'compact'` — which is what the enums hold. Every example
below does.

## Basic Usage

```javascript
const view = createSegmentedButton({
  mode: 'single',
  segments: [
    { text: 'List', value: 'list', selected: true },
    { text: 'Grid', value: 'grid' },
    { text: 'Map', value: 'map' }
  ]
});

view.on('change', ({ value }) => showView(value[0]));
document.querySelector('.toolbar').appendChild(view.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `segments` | `SegmentConfig[]` | — | The segments, in order |
| `mode` | `SelectionMode \| 'single' \| 'multi'` | `'single'` | One selection at a time, or several |
| `density` | `Density \| string` | `'default'` | `'default'`, `'comfortable'` or `'compact'` |
| `disabled` | `boolean` | `false` | Disables every segment |
| `ripple` | `boolean` | `true` | Ripple on the segments |
| `rippleConfig` | `{ duration, timing, opacity }` | — | Ripple tuning, passed to each segment |
| `class` | `string` | — | Extra classes on the container |
| `on` | `{ change }` | — | **Accepted but not applied.** Nothing reads it; register handlers with `.on()` after creation |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'segmented-button'` | Name used in class generation |

### Each segment

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | — | Label |
| `icon` | `string` | — | Icon as an HTML string |
| `value` | `string` | the text | Identifies the segment in the API and events |
| `selected` | `boolean` | `false` | Initially selected |
| `disabled` | `boolean` | `false` | Disables this segment only |
| `checkmarkIcon` | `string` | a filled check | Replaces the selected-state checkmark |
| `class` | `string` | — | Extra classes on this segment |

In single-select mode, if no segment is configured as `selected`, the first
segment that is not disabled is selected when the component is created.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSelected()` | — | `Segment[]` | The selected segments |
| `getValue()` | — | `string[]` | Their values |
| `select(value)` | `value: string` | `SegmentedButtonComponent` | Selects that segment; in single mode it deselects the others |
| `deselect(value)` | `value: string` | `SegmentedButtonComponent` | Deselects it. In single mode it refuses when that would leave nothing selected |
| `enable()` | — | `SegmentedButtonComponent` | Enables every segment that was not individually disabled |
| `disable()` | — | `SegmentedButtonComponent` | Disables all of them |
| `enableSegment(value)` | `value: string` | `SegmentedButtonComponent` | One segment, by value |
| `disableSegment(value)` | `value: string` | `SegmentedButtonComponent` | One segment, by value |
| `setDensity(density)` | `density: Density \| string` | `SegmentedButtonComponent` | Swaps the density class, which sets height and padding |
| `getDensity()` | — | `string` | Current density |
| `on(event, handler)` | `event: 'change', handler: Function` | `SegmentedButtonComponent` | Adds a listener |
| `off(event, handler)` | `event: 'change', handler: Function` | `SegmentedButtonComponent` | Removes one |
| `destroy()` | — | `void` | Destroys every segment and releases the container |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The `role="group"` container |
| `segments` | `Segment[]` | The segments, in order |

Each `Segment` exposes `element`, `value`, `isSelected()`, `setSelected()`,
`isDisabled()`, `setDisabled()` and `destroy()`. Setting a segment's state
directly changes the appearance without emitting `change`, so prefer the
component's `select()` and `deselect()`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ selected, value, oldValue }` | The selection changed |

`selected` is the array of selected `Segment` objects, `value` their values, and
`oldValue` the values before the change. The event is emitted only when the
selection really differs, whether the change came from a click or from
`select()` / `deselect()`.

The exported `SegmentedButtonEvent` type declares exactly these three fields.
Before 0.8.0-next.49 it described a richer payload than the component sent. When
migrating to the [button group](./button-group.md), note that its change event
names the values `values`.

## Examples

### Single-select view switcher

The showcase drives its view switcher this way, reading `event.value[0]`:

```javascript
const views = createSegmentedButton({
  mode: 'single',
  segments: [
    { text: 'List', value: 'list', selected: true },
    { text: 'Grid', value: 'grid' },
    { text: 'Map', value: 'map' }
  ]
});

views.on('change', (event) => {
  render(event.value[0]);
});

// programmatic selection, which emits change too
document.querySelector('#grid').onclick = () => views.select('grid');
```

### Multi-select filters

```javascript
const price = createSegmentedButton({
  mode: 'multi',
  segments: [
    { text: '$', value: 'low' },
    { text: '$$', value: 'medium' },
    { text: '$$$', value: 'high' }
  ]
});

price.on('change', ({ value }) => filterByPrice(value));
```

Multi-select allows an empty selection; single-select does not.

### Icons and the checkmark

How a segment shows selection depends on what it contains:

- **text only** — a checkmark appears before the label
- **icon and text** — the icon is replaced by the checkmark
- **icon only** — nothing is swapped; the icon stays as it is

```javascript
const transport = createSegmentedButton({
  mode: 'single',
  segments: [
    { icon: walkIcon, text: 'Walk', value: 'walk', selected: true },
    { icon: bikeIcon, text: 'Bike', value: 'bike' },
    { icon: carIcon, text: 'Drive', value: 'drive' }
  ]
});
```

Pass `checkmarkIcon` on a segment to use something other than the default filled
check.

## Accessibility

- The container is a `role="group"` labelled `"Segmented button"`. That label is
  fixed; if the group needs a better name, set `aria-label` on `element`
  yourself after creating it.
- Each segment is a real `<button>` carrying `aria-pressed`, updated on every
  selection change.
- A segment falls back to its `text`, or failing that its `value`, as its
  accessible name, so an icon-only segment gets its name from `value` — give it
  one that reads as a label.
- Tab reaches every segment and Space or Enter activates the focused one. The
  component adds no arrow-key roving focus.
- Focus is visible as a 2dp `secondary` outline drawn inside the segment, so it
  is not clipped by the container's rounded ends.

## Styling

```css
/* the container */
.mtrl-segmented-button { }
.mtrl-segmented-button--comfortable { }
.mtrl-segmented-button--compact { }
.mtrl-segmented-button--disabled { }

/* the segments, which are buttons */
.mtrl-segmented-button-segment { }
.mtrl-segment--selected { }
.mtrl-segment--disabled { }
.mtrl-segment-checkmark { }
```

The container also carries `data-mode` and `data-density` attributes, which are
convenient selectors when you want to style one configuration only.

Sizing runs through custom properties that the stylesheet declares per density
class; the component writes none of them inline, so the class decides:

```css
.mtrl-segmented-button {
  --segment-height: 40px;
  --segment-padding-x: 24px;
  --segment-padding-icon-only: 12px;
  --segment-padding-icon-text-left: 12px;
  --segment-padding-icon-text-right: 16px;
  --segment-border-radius: 20px;
}
```

Corner shape is handed to each segment through the button's own shape hooks
(`--mtrl-button-shape`, `--mtrl-button-shape-pressed`,
`--mtrl-button-shape-selected`) rather than by overriding `border-radius`, so a
segment keeps the right corners in every state. Only the first and last segments
round off; a lone segment rounds on both ends.

## Measurements

Heights follow M3: `OutlinedSegmentedButtonTokens` gives a 40dp container, and
the segmented button specs take 4dp off per density step. The rest are this
library's values, and the source column points at the declaration.

| Attribute | Value | Source |
|-----------|-------|--------|
| Container height, default density | 40dp | `--segment-height` in the SCSS; `OutlinedSegmentedButtonTokens` |
| Container height, comfortable | 36dp | `--comfortable` in the SCSS |
| Container height, compact | 32dp | `--compact` in the SCSS |
| Container corner | half the height: 20, 18 and 16dp | `calc(var(--segment-height) / 2)` by default, `--segment-border-radius` in the two density rules |
| Minimum segment width | 48dp | `min-width` on the segment in the SCSS |
| Horizontal padding, default density | 24dp | `--segment-padding-x` in the SCSS |
| Hover state layer | 8% `on-surface` | commented as the MD3 state layer in the SCSS |
| Pressed state layer | 12% `on-surface` | commented as the MD3 state layer in the SCSS |

Until 0.8.0-next.49 the component wrote 36, 32 and 28dp heights inline, which
overrode these rules, so segmented buttons measured 4dp shorter than they do
now.
