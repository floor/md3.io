---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Progress

A progress indicator shows how far a process has come, such as an upload, or that one is
running when its length is unknown. It is **linear** or **circular**, **determinate** or
**indeterminate**, and its active indicator is **flat** or **wavy**. See the
[M3 progress indicators guidelines](https://m3.material.io/components/progress-indicators/overview).

## Usage

`ariaLabel` says what is in progress.

```example
progress:
  value: 40
  ariaLabel: Uploading photo
```

## Examples

### Circular, indeterminate

`indeterminate` shows activity without a value. A circular indicator is 40px across, 48px when
wavy; `size` sets it, from 24 to 240.

```example
progress:
  variant: circular
  indeterminate: true
  ariaLabel: Loading messages
```

### Wavy and thick

`shape: 'wavy'` draws the active indicator as a wave, which flattens near the start and the
end. `thickness` is `thin` (4px), `thick` (8px) or a number of pixels.

```example
progress:
  shape: wavy
  thickness: thick
  value: 60
  ariaLabel: Installing update
```

### Setting the value

An action sets the value, which animates to it over 500ms; `setValue(value, false)` jumps. A
value out of range is clamped to `0` or `max`, and that is the value drawn, announced,
labelled and emitted.

```example
progress:
  value: 30
  buffer: 60
  ariaLabel: Streaming video
  action advance:
    set value: 75
```

`buffer` draws how much is ready ahead of a linear value, as for streaming media. `showLabel`
shows the percentage beside the indicator, and `labelFormatter` writes it differently. Recipes
such as an upload with progress are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-progress>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'linear' \| 'circular'` | `'linear'` | The form of the indicator |
| `value` | `number` | `0` | The value, from 0 to `max` |
| `max` | `number` | `100` | The value at completion |
| `buffer` | `number` | `0` | The buffered value of a linear indicator |
| `indeterminate` | `boolean` | `false` | Activity without a value |
| `shape` | `'flat' \| 'wavy'` | `'flat'` | A flat or a wavy active indicator |
| `thickness` | `'thin' \| 'thick' \| number` | `'thin'` | 4px, 8px, or a number of pixels |
| `size` | `number` | `40`, `48` when wavy | The diameter of a circular indicator, from 24 to 240 |
| `showStopIndicator` | `boolean` | `true` | The dot at the end of a determinate linear track |
| `showLabel` | `boolean` | `false` | Shows the value as a label |
| `labelFormatter` | `(value, max) => string` | a percentage | Writes the label |
| `ariaLabel` | `string` | `'Loading'` | What is in progress |
| `disabled` | `boolean` | `false` | Whether it starts disabled |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` / `setValue(value, animate?)` | `value: number, animate?: boolean` | `number` / `ProgressComponent` | The value; `animate` is `true` by default |
| `getMax()` | none | `number` | The maximum |
| `getBuffer()` / `setBuffer(value)` | `value: number` | `number` / `ProgressComponent` | The buffered value |
| `isIndeterminate()` / `setIndeterminate(indeterminate)` | `indeterminate: boolean` | `boolean` / `ProgressComponent` | Whether it is indeterminate |
| `getShape()` / `setShape(shape)` | `shape: 'flat' \| 'wavy'` | `string` / `ProgressComponent` | The shape |
| `getThickness()` / `setThickness(thickness)` | `thickness: 'thin' \| 'thick' \| number` | `number` / `ProgressComponent` | The thickness, read in pixels |
| `getSize()` / `setSize(size)` | `size: number` | `number \| undefined` / `ProgressComponent` | A circular indicator's diameter |
| `showLabel()` / `hideLabel()` | none | `ProgressComponent` | The label |
| `setLabelFormatter(formatter)` | `formatter: (value, max) => string` | `ProgressComponent` | How the label is written |
| `show()` / `hide()` / `isVisible()` | none | `ProgressComponent` / `boolean` | Shows or hides it; hidden, it stops animating |
| `enable()` / `disable()` / `isDisabled()` | none | `ProgressComponent` / `boolean` | The disabled state, with `aria-disabled`, set the same way at creation |
| `painted()` | none | `Promise<void>` | Resolves once it has been drawn |
| `on(event, handler)` / `off(event, handler)` | `event: 'change' \| 'complete', handler: Function` | `ProgressComponent` | Adds or removes a listener |
| `addClass(...classes)` | `...classes: string[]` | `ProgressComponent` | Adds CSS classes |
| `destroy()` | none | `void` | Stops its animations and removes it |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The value was set | `{ value, max }` |
| `complete` | The value reached `max`: after the animation, or at once without one | `{ value, max }` |

The web component dispatches no events: its `value` and `indeterminate` properties are the
live state, and its attributes the first one.

## Accessibility

- A `progressbar` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`; indeterminate, it
  has no `aria-valuenow`. The canvas it draws on is hidden.
- `ariaLabel` names it, `'Loading'` without one: say what is loading, such as "Loading news
  article".
- The stop indicator is needed unless the track has a 3:1 contrast with what is around it.
- A linear indicator is mirrored in a right-to-left layout. Under `prefers-reduced-motion`
  nothing moves: it draws a still frame.

## Styling

The indicator is drawn on a canvas, in the theme's colors: the active and stop indicators in
`--mtrl-sys-color-primary`, the track in `--mtrl-sys-color-secondary-container`. They are read
again when the theme changes.

```css
.mtrl-progress, .mtrl-progress--linear, .mtrl-progress--circular { }
.mtrl-progress--indeterminate, .mtrl-progress--disabled { }
.mtrl-progress__canvas, .mtrl-progress__label { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Track | 4dp thin, 8dp thick; `secondary-container` |
| Active indicator | `primary`, round caps |
| Gap between the indicator and the track | 4dp |
| Stop indicator | 4dp, `primary` |
| Circular | 40dp, 48dp when wavy |
| Wave | 3dp amplitude and 40dp wavelength on a linear indicator (20dp indeterminate); 1.6dp and 15dp on a 40dp circle, scaled with its size |
| Value change | 500ms, linear |
| Label | Label Medium, `on-surface-variant` |
