---
created: 2026-09-21
updated: 2026-09-29
status: published
---

# Slider

A slider lets people choose a value, or a range of values, along a track: a volume, a
brightness, a price range. M3 has three: **standard**, **centered** (from a midpoint, for
values either side of zero) and **range** (two handles). See the
[M3 sliders guidelines](https://m3.material.io/components/sliders/overview).

## Usage

`input` fires while the value moves, `change` once the interaction ends.

```example
slider:
  label: Volume
  value: 40
  on change: setSystemVolume(value)
```

## Examples

### Discrete steps

With `step`, the handle snaps to the steps; `ticks` marks each one on the track.

```example
slider:
  label: Brightness
  min: 0
  max: 10
  step: 1
  ticks: true
  value: 6
```

### A range

`range` adds a second handle, whose value is `secondValue`. The handles never cross.

```example
slider:
  label: Price
  range: true
  min: 0
  max: 1000
  step: 10
  value: 100
  secondValue: 500
  on change: setPriceRange(value, secondValue)
```

### Setting the value

An action sets the value; out of bounds, it is clamped to `min` or `max`.

```example
slider:
  label: Volume
  value: 40
  action mute:
    set value: 0
```

`centered: true` fills the track from its midpoint. `orientation: 'vertical'` stands it up,
taking its length from its CSS height; `insetIcon` puts an icon inside the track of a standard
slider at size `M`, `L` or `XL`. Recipes such as a photo filter, an equalizer or a settings
form are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-slider>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | `number` | `0` | Minimum value of the slider |
| `max` | `number` | `100` | Maximum value of the slider |
| `value` | `number` | `0` | Initial value of the slider |
| `secondValue` | `number` | `undefined` | Secondary value for range sliders |
| `step` | `number` | `1` | Step size for discrete sliders |
| `disabled` | `boolean` | `false` | Whether the slider is initially disabled |
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'error'` | `'primary'` | Color variant of the slider |
| `size` | `'XS' \| 'S' \| 'M' \| 'L' \| 'XL' \| number` | `'XS'` | Size variant (XS=16px, S=24px, M=40px, L=56px, XL=96px, or custom pixels) |
| `ticks` | `boolean` | `false` | Whether to show tick marks |
| `tickLabels` | `string[] \| Record<number, string>` | `undefined` | Custom labels for ticks |
| `valueFormatter` | `function` | `(value) => value.toString()` | Formats the value shown in the label |
| `showValue` | `boolean` | `true` | Whether to show the current value while dragging |
| `snapToSteps` | `boolean` | `true` | Whether to snap to steps while dragging |
| `range` | `boolean` | `false` | Whether the slider is a range slider (two handles) |
| `centered` | `boolean` | `false` | Whether the slider is centered (active track from center) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | A vertical slider takes its length from its CSS height |
| `topToBottom` | `boolean` | `false` | A vertical slider's minimum at the top instead of the bottom |
| `insetIcon` | `string` | `undefined` | SVG markup for an icon inside the track: standard sliders at M, L and XL |
| `insetIconAtMin` | `string` | `undefined` | The inset icon shown at the minimum value, such as mute for volume |
| `label` | `string` | `undefined` | Label text for the slider |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Position of the label |
| `icon` | `string` | `undefined` | Icon to display with the slider |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Position of the icon |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

#### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `number` | Gets the current slider value |
| `setValue(value, triggerEvent?)` | `value: number, triggerEvent?: boolean` | `SliderComponent` | Sets the slider value |
| `getSecondValue()` | none | `number \| null` | Gets the secondary slider value (range sliders only) |
| `setSecondValue(value, triggerEvent?)` | `value: number, triggerEvent?: boolean` | `SliderComponent` | Sets the secondary slider value |

#### Range Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getMin()` | none | `number` | Gets the minimum slider value |
| `setMin(min)` | `min: number` | `SliderComponent` | Sets the minimum slider value |
| `getMax()` | none | `number` | Gets the maximum slider value |
| `setMax(max)` | `max: number` | `SliderComponent` | Sets the maximum slider value |
| `getStep()` | none | `number` | Gets the slider step size |
| `setStep(step)` | `step: number` | `SliderComponent` | Sets the slider step size |

#### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `SliderComponent` | Enables the slider |
| `disable()` | none | `SliderComponent` | Disables the slider |
| `isDisabled()` | none | `boolean` | Checks if the slider is disabled |

#### Appearance Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setColor(color)` | `color: 'primary' \| 'secondary' \| 'tertiary' \| 'error'` | `SliderComponent` | Sets the slider color |
| `getColor()` | none | `string` | Gets the current slider color |
| `setSize(size)` | `size: 'XS' \| 'S' \| 'M' \| 'L' \| 'XL' \| number` | `SliderComponent` | Sets the slider size |
| `getSize()` | none | `SliderSize` | Gets the size as it was set: a size name, or a track height in pixels |
| `showTicks(show)` | `show: boolean` | `SliderComponent` | Shows or hides tick marks |
| `showCurrentValue(show)` | `show: boolean` | `SliderComponent` | Shows or hides value bubble during interaction |

#### Label and Icon Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` | `text: string` | `SliderComponent` | Sets the label text |
| `getLabel()` | none | `string` | Gets the label text |
| `setInsetIcon(icon, atMin?)` | `icon: string, atMin?: string` | `SliderComponent` | Sets the inset icon, and optionally the one at the minimum; `''` removes it |
| `setIcon(iconHtml)` | `iconHtml: string` | `SliderComponent` | Sets the icon HTML |
| `getIcon()` | none | `string` | Gets the icon HTML |

#### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `SliderComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SliderComponent` | Removes an event listener |

#### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the slider component and cleans up resources |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | Fires when slider value changes and interaction completes | `{ value: number, secondValue: number \| null }` |
| `input` | Fires during dragging as value changes | `{ value: number, secondValue: number \| null }` |
| `focus` | Fires when slider handle receives focus | `{ value: number, secondValue: number \| null }` |
| `blur` | Fires when slider handle loses focus | `{ value: number, secondValue: number \| null }` |
| `start` | Fires when interaction starts (mouse down, touch start) | `{ value: number, secondValue: number \| null }` |
| `end` | Fires when interaction ends (mouse up, touch end) | `{ value: number, secondValue: number \| null }` |

Every slider event carries the same object: `{ slider, value, secondValue, originalEvent,
preventDefault, defaultPrevented }`. The web component's `input` and `change` carry
`{ value }`, and `secondValue` on a range.

## Accessibility

- Each handle has `role="slider"`, with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`,
  `aria-orientation`, and `aria-valuetext` when a `valueFormatter` is set.
- The handles are named by `label`; the web component's `aria-label` names them instead. On a
  range, each handle's limit is the other handle's value.
- Disabled, the handles have `aria-disabled` and leave the tab order.

| Keys | Action |
|------|--------|
| Arrows along the track | One step in the direction of the track as drawn: `Right` raises, except in right-to-left layouts; `Up` raises on a vertical slider, except with `topToBottom` |
| Arrows across the track | `Up` / `Right` raise, `Down` / `Left` lower |
| `Shift` + arrows | Ten steps |
| `Page Up` / `Page Down` | A tenth of the steps, between one and ten of them |
| `Home` / `End` | The minimum / maximum, or the other handle on a range slider |
| `Tab` | Moves between the handles of a range slider |

## Styling

The custom properties set one slider's colors, in the factory and the web component alike; the
classes are the factory's, inside the web component's shadow root.

```css
.volume {
  --mtrl-slider-color: #006a6a;            /* active track, handle, stops */
  --mtrl-slider-container-color: #cce8e7;  /* inactive track, ticks on the active track */
  --mtrl-slider-on-color: #ffffff;         /* ticks on the active track only */
}

.mtrl-slider { }
.mtrl-slider__label, .mtrl-slider__icon, .mtrl-slider__container, .mtrl-slider__track { }
.mtrl-slider__segment, .mtrl-slider__segment--active, .mtrl-slider__ticks, .mtrl-slider__dot { }
.mtrl-slider__handle, .mtrl-slider__handle--focused, .mtrl-slider__value, .mtrl-slider__inset-icon { }
.mtrl-slider--range, .mtrl-slider--vertical, .mtrl-slider--discrete, .mtrl-slider--disabled { }
.mtrl-slider--dragging, .mtrl-slider--settling { }
```

## Measurements

| Size | Track | Handle | Outer corners |
|------|-------|--------|---------------|
| `XS` (default) | 16dp | 44dp | 8dp |
| `S` | 24dp | 44dp | 8dp |
| `M` | 40dp | 52dp | 12dp |
| `L` | 56dp | 68dp | 16dp |
| `XL` | 96dp | 108dp | 28dp |

The handle is 4dp wide, 2dp while pressed or focused, with a 6dp gap to the track; inside
corners are 2dp. The value indicator is 48×44dp, 12dp beyond the handle. A value change that
does not follow the pointer settles on the M3 Expressive default spatial spring.
