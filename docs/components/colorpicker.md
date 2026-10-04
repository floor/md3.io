---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Color picker

A color picker lets people choose a color: in an area of saturation and brightness, on a hue
slider, by hex value, from swatches or with an eyedropper. M3 has no color picker component;
this one is built from M3 parts (a [text field](/docs/components/text-field/), an
[icon button](/docs/components/icon-button/)) and the
[M3 color system](https://m3.material.io/styles/color/system/overview).

From **material-addons**, checked against 3.0.0. material-addons has no web components: the
examples are the vanilla factory, which works in any framework.

## Usage

`change` gives the hex value once a choice is made; `input` gives it while the pointer drags.

```example
colorpicker:
  value: "#6750a4"
  swatches: ["#6750a4", "#625b71", "#7d5260", "#b3261e"]
```

```javascript continued
picker.on('change', (color) => saveColor(String(color)));
```

## Examples

### Opacity

`showOpacity` adds an opacity slider; `getOpacity()` reads it, from 0 to 1. The hex value
stays opaque.

```example
colorpicker:
  value: "#006a6a"
  showOpacity: true
  opacity: 0.8
```

### Compact

`size` is `s`, `m` or `l` (200, 280 or 360px wide), and `density: 'compact'` removes the gaps.

```example
colorpicker:
  value: "#7d5260"
  size: s
  density: compact
  showInput: false
  showPreview: false
```

### Swatches only

```example
colorpicker:
  value: "#b3261e"
  showArea: false
  showHue: false
  showInput: false
  showPreview: false
  swatches: ["#b3261e", "#7d5260", "#625b71", "#6750a4", "#006a6a"]
```

`variant: 'dropdown'` or `'dialog'` opens the picker from a `trigger` element, and closes it on
`Escape`, a click outside, or the choice of a swatch unless `closeOnSelect: false`. The
eyedropper uses the browser's EyeDropper, or samples `imageSource`; `pickColor()` starts it.
Recipes such as a theme color setting are planned for [Examples](/examples/).

## API

<!-- API: generated from material-addons' types in a later step. Until then these tables are
hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | `'#ff0000'` | The color, in hex |
| `variant` | `'inline' \| 'dropdown' \| 'dialog'` | `'inline'` | In the page, or opened from `trigger` |
| `trigger` | `HTMLElement` | `undefined` | What opens a dropdown or dialog picker |
| `closeOnSelect` | `boolean` | `true` | Whether choosing a swatch closes a dropdown or dialog picker |
| `showArea` / `showHue` | `boolean` | `true` | The saturation and brightness area, the hue slider |
| `showOpacity` | `boolean` | `false` | The opacity slider |
| `opacity` | `number` | `1` | The opacity, from 0 to 1 |
| `showInput` / `showPreview` / `showSwatches` | `boolean` | `true` | The hex field, the preview, the swatches |
| `inputLabel` | `string` | `'Hex'` | The hex field's label |
| `swatches` | `string[] \| ColorSwatch[]` | `[]` | Colors to choose from; a `ColorSwatch` is `{ color, label?, selected? }` |
| `maxSwatches` | `number` | `8` | How many swatches it keeps |
| `swatchSize` | `number` | `32` | A swatch's size in pixels; 24, 32 and 40 are the presets |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | 200, 280 or 360px wide |
| `density` | `'default' \| 'compact'` | `'default'` | The gaps between its parts |
| `showPipette` | `boolean` | where supported | The eyedropper, shown by default with the browser's EyeDropper or an `imageSource` |
| `imageSource` | `HTMLImageElement \| string \| null` | `undefined` | An image to sample without the EyeDropper |
| `disabled` | `boolean` | `false` | Whether it starts disabled |
| `onChange` / `onInput` | `(color: string) => void` | `undefined` | Called with the hex value |
| `onPipetteStart` / `onPipetteEnd` | `() => void` / `(color: string \| null) => void` | `undefined` | Called as the eyedropper starts and ends |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` / `setValue(color)` | `color: string` | `string` / `ColorPickerComponent` | The color, in hex |
| `getHSV()` / `setHSV(hsv)` | `hsv: { h, s, v }` | `HSVColor` / `ColorPickerComponent` | The color in HSV: hue 0 to 360, the others 0 to 100 |
| `getRGB()` / `setRGB(rgb)` | `rgb: { r, g, b }` | `RGBColor` / `ColorPickerComponent` | The color in RGB, 0 to 255 |
| `getOpacity()` / `setOpacity(opacity)` | `opacity: number` | `number` / `ColorPickerComponent` | The opacity, from 0 to 1 |
| `getSwatches()` / `setSwatches(swatches)` | `swatches: string[] \| ColorSwatch[]` | `ColorSwatch[]` / `ColorPickerComponent` | The swatches |
| `addSwatch(color, label?)` / `removeSwatch(color)` / `clearSwatches()` | `color: string, label?: string` | `ColorPickerComponent` | Changes the swatches |
| `open()` / `close()` / `toggle()` / `isOpen()` | none | `ColorPickerComponent` / `boolean` | A dropdown or dialog picker's state; an inline one is always open |
| `pickColor()` | none | `Promise<string \| null>` | Starts the eyedropper; `null` when it was cancelled |
| `setImageSource(source)` / `isSampling()` | `source: HTMLImageElement \| string \| null` | `ColorPickerComponent` / `boolean` | The image to sample, whether it is sampling |
| `enable()` / `disable()` / `isDisabled()` | none | `ColorPickerComponent` / `boolean` | The disabled state |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `ColorPickerComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes it |

The conversions (`hexToRgb`, `rgbToHex`, `hexToHsv`, `hsvToHex`, `hsvToRgb`, `rgbToHsv`,
`isValidHex`, `normalizeHex`, `getContrastColor`) are exported from `material-addons` too.

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | A color was chosen | the hex value |
| `input` | The color changes while the pointer drags | the hex value |
| `swatchSelect` | A swatch was chosen | its color |
| `swatchesChange` | The swatches changed | `ColorSwatch[]` |
| `open` / `close` | A dropdown or dialog picker opened or closed | none |

## Accessibility

- The hue and opacity sliders are `slider`s, named "Hue" and "Opacity". `Tab` focuses them;
  the arrows move them by one, ten with `Shift`, and `Home` and `End` to either end.
- The saturation and brightness area takes the pointer only: the hex field is the keyboard's
  way to a color.
- Swatches are buttons, named by their `label` as a tooltip; give each swatch a label.
- `Escape` closes a dropdown or dialog picker, and cancels the eyedropper.

## Styling

```css
.mtrl-colorpicker, .mtrl-colorpicker--inline, .mtrl-colorpicker--dropdown, .mtrl-colorpicker--dialog { }
.mtrl-colorpicker--compact, .mtrl-colorpicker--disabled, .mtrl-colorpicker--dragging, .mtrl-colorpicker--open { }
.mtrl-colorpicker__area, .mtrl-colorpicker__area-handle { }
.mtrl-colorpicker__hue, .mtrl-colorpicker__hue-handle { }
.mtrl-colorpicker__swatches, .mtrl-colorpicker__swatch, .mtrl-colorpicker__swatch--selected { }
.mtrl-colorpicker__value, .mtrl-colorpicker__preview { }
```
