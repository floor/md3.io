---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Loading indicator

A loading indicator shows a short wait, between 200ms and 5 seconds, for content that is
loading or refreshing. Its shape morphs through seven Material shapes as it turns. For longer
waits, or work whose progress is worth watching, use a
[progress indicator](/docs/components/progress/). See the
[M3 loading indicator guidelines](https://m3.material.io/components/loading-indicator/overview).

## Usage

It animates from the start. `ariaLabel` says what is loading.

```example
loading-indicator:
  ariaLabel: Loading articles
```

## Examples

### Contained

Over content such as an image or a map, `contained` puts it on a `primary-container` circle
for contrast.

```example
loading-indicator:
  contained: true
  ariaLabel: Loading map
```

### Size

48px by default, from 24 to 240; the shape keeps its proportions.

```example
loading-indicator:
  size: 96
  ariaLabel: Loading album
```

### Determinate

A `value` from 0 to 1 makes it determinate: the shape morphs from a circle to a soft burst,
and turns, as the value grows. It follows the value you set, without animating between them;
`null` makes it loop again.

```example
loading-indicator:
  value: 0.2
  ariaLabel: Uploading photo
  action advance:
    set value: 0.6
```

`stop()` freezes it on its current frame, and `start()` runs it again. Recipes such as a
button that shows it while its action runs are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-loading-indicator>'s spec in a later step. Until
then these tables are hand-written: keep them in line with the code, and add no prose restating
them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `48` | Its width and height in pixels, from 24 to 240 |
| `contained` | `boolean` | `false` | On a `primary-container` circle |
| `value` | `number \| null` | `null` | From 0 to 1, determinate; `null` loops |
| `ariaLabel` | `string` | `'Loading'` | What is loading |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` / `setValue(value)` | `value: number \| null` | `number \| null` / `LoadingIndicatorComponent` | The value, from 0 to 1, or `null` |
| `getSize()` / `setSize(size)` | `size: number` | `number` / `LoadingIndicatorComponent` | The size in pixels, from 24 to 240 |
| `setLabel(label)` | `label: string` | `LoadingIndicatorComponent` | The accessible name |
| `start()` / `stop()` | none | `LoadingIndicatorComponent` | Runs or freezes the animation |
| `isRunning()` | none | `boolean` | Whether it is running |
| `destroy()` | none | `void` | Stops it and removes it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root, a `progressbar` |
| `canvas` | `HTMLCanvasElement` | The canvas it draws on |

A loading indicator has no events. The web component's attributes are `size`, `contained`,
`value` and `aria-label`, and `start()` and `stop()` are its methods.

## Accessibility

- A `progressbar`, named by `ariaLabel`: say what is loading. The canvas is hidden.
- Determinate, it has `aria-valuemin`, `aria-valuemax` and `aria-valuenow` from 0 to 100;
  looping, none of them.
- Under `prefers-reduced-motion` it shows the shapes in turn, without morphing or turning.
- It is not focusable; don't move focus to it.

## Styling

The shape is drawn in the element's `color`, so CSS can recolor the factory's indicator, for
instance inside a filled button:

```css
.mtrl-loading-indicator, .mtrl-loading-indicator--contained, .mtrl-loading-indicator--determinate { }
.mtrl-loading-indicator__canvas { }

.mtrl-button--filled .mtrl-loading-indicator {
  color: var(--mtrl-sys-color-on-primary);
}
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | 48dp |
| Active indicator | 38dp, `primary` |
| Contained | A `primary-container` circle, the indicator `on-primary-container` |
| Size | 24dp to 240dp, in proportion |
| Motion | A morph to the next shape every 650ms, on a spring (damping 0.6, stiffness 200), with a quarter turn; a full turn every 4666ms besides |
