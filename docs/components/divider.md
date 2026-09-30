# Divider

A divider is a thin line that groups content in lists and containers: between sections of a
list, or between a card's body and its actions. Use one where spacing alone doesn't show the
grouping. See the [M3 divider guidelines](https://m3.material.io/components/divider/overview).

## Usage

```example
divider:
```

## Examples

### Inset

`inset` starts the line 16px in, and `middle-inset` insets both ends by 16px. `insetStart` and
`insetEnd` change the insets, here to line up with a list's text after a 40dp avatar.

```example
divider:
  variant: inset
  insetStart: 72
```

### Vertical

A vertical divider stretches with its flex or grid row, which needs a height of its own.

```example
divider:
  orientation: vertical
  variant: middle-inset
  insetStart: 8
  insetEnd: 8
```

### Thickness and color

An action changes the line: its thickness in pixels, and any CSS color. `setColor('')` goes
back to the theme's color.

```example
divider:
  thickness: 1
  action emphasize:
    set thickness: 2
    set color: var(--mtrl-sys-color-primary)
```

## API

<!-- API: generated from mtrl's types and <m-divider>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | The direction of the line |
| `variant` | `'full-width' \| 'inset' \| 'middle-inset'` | `'full-width'` | Which ends are inset |
| `insetStart` | `number` | `16` | The start inset in pixels, for the inset variants: left when horizontal, top when vertical |
| `insetEnd` | `number` | `0` for `inset`, `16` for `middle-inset` | The end inset in pixels, for the inset variants: right when horizontal, bottom when vertical |
| `thickness` | `number` | `1` | The line's thickness in pixels |
| `color` | `string` | `undefined` | Any CSS color; the theme's `outline-variant` without one |
| `class` | `string \| string[]` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getOrientation()` / `setOrientation(orientation)` | `orientation: 'horizontal' \| 'vertical'` | `string` / `DividerComponent` | The orientation |
| `getVariant()` / `setVariant(variant)` | `variant: 'full-width' \| 'inset' \| 'middle-inset'` | `string` / `DividerComponent` | The variant |
| `setInset(insetStart?, insetEnd?)` | `insetStart?: number, insetEnd?: number` | `DividerComponent` | The insets; an omitted one is kept. They apply while the variant is an inset one |
| `setThickness(thickness)` | `thickness: number` | `DividerComponent` | The thickness in pixels |
| `setColor(color)` | `color: string` | `DividerComponent` | A CSS color; `''` goes back to the theme's |
| `destroy()` | none | `void` | Removes the divider |

The web component's attributes are `orientation`, `variant`, `inset-start`, `inset-end`,
`thickness` and `color`.

## Accessibility

- An `<hr>`, which is a separator to assistive tech; a vertical one has
  `aria-orientation="vertical"`.
- A divider is not focusable and has no name. Keep the spacing or headings that show the groups,
  so the line is not the only cue.

## Styling

The thickness, the length and the insets are inline styles the divider writes; the color is its
`background-color`.

```css
.mtrl-divider { }
.mtrl-divider--horizontal, .mtrl-divider--vertical { }
.mtrl-divider--full-width, .mtrl-divider--inset, .mtrl-divider--middle-inset { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Thickness | 1dp |
| Color | `outline-variant` |
| Inset | 16dp |
