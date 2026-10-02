---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Tooltip

A tooltip is a short label for another element, shown on hover and on focus: it names an icon
button, or says what a control does, in a few words. It holds nothing to act on. See the
[M3 tooltips guidelines](https://m3.material.io/components/tooltips/overview).

## Usage

The tooltip describes its `target`: 300ms after the pointer enters it or it takes focus, the
tooltip shows, below it by default. The web component's target is the element its `for`
attribute names.

```example
tooltip:
  text: Add to favorites
  target: { icon: heartOutlineIcon, ariaLabel: Favorite }
```

## Examples

### Position

`position` is `top`, `right`, `bottom` or `left`, each also with `-start` or `-end` to align it
with an edge of the target. It is kept inside the window's width.

```example
tooltip:
  text: Share
  position: top
  target: { icon: shareIcon, ariaLabel: Share }
```

### Timing and triggers

`showDelay` and `hideDelay` are in milliseconds. `showOnHover: false` leaves it to focus, and
`showOnFocus: false` to the pointer; `show()` and `hide()` drive it from script.

```example
tooltip:
  text: Settings
  showDelay: 600
  hideDelay: 0
  showOnHover: false
  target: { icon: settingsIcon, ariaLabel: Settings }
```

`setTarget()` moves a tooltip to another element, so one tooltip can serve a list. `layer:
'top'` shows it in the browser's top layer, above any clipping or stacking; the web component
always is.

## API

<!-- API: generated from mtrl's types and <m-tooltip>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | The label |
| `target` | `HTMLElement` | `undefined` | The element it describes |
| `position` | `TooltipPosition` | `'bottom'` | Where it sits against the target |
| `variant` | `'default' \| 'plain' \| 'rich'` | `'default'` | `default` and `plain` are M3's plain tooltip, on `inverse-surface`; `rich` is M3's rich tooltip, on `surface-container` |
| `visible` | `boolean` | `false` | Whether it shows at once |
| `showDelay` / `hideDelay` | `number` | `300` / `100` | How long before it shows or hides, in ms |
| `showOnHover` / `showOnFocus` | `boolean` | `true` | Whether the pointer, and focus, show it |
| `layer` | `'top'` | `undefined` | Shows it in the top layer, after its target in the target's tree |
| `zIndex` | `number` | `undefined` | Its z-index, outside the top layer |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

The web component takes `for`, `text` (or its own text), `position`, `variant`, `show-delay`,
`hide-delay`, `no-show-on-hover` and `no-show-on-focus`, and a `target` property that wins over
`for`.

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `show(immediate?)` / `hide(immediate?)` | `immediate?: boolean` | `TooltipComponent` | Shows or hides it, at once when `immediate` |
| `isVisible()` | none | `boolean` | Whether it is shown |
| `getText()` / `setText(text)` | `text: string` | `string` / `TooltipComponent` | The label |
| `getPosition()` / `setPosition(position)` | `position: TooltipPosition` | `string` / `TooltipComponent` | Where it sits |
| `setTarget(target)` | `target: HTMLElement` | `TooltipComponent` | Describes another element |
| `updatePosition()` | none | `TooltipComponent` | Places it again against its target |
| `destroy()` | none | `void` | Releases its target and removes it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The tooltip |
| `target` | `HTMLElement \| null` | The element it describes |

A tooltip has no events.

## Accessibility

- A `tooltip`, and its target's `aria-describedby` names it: the label is read as the target's
  description. It does not name the target; an icon button still needs its own `ariaLabel`.
- Focus shows it as the pointer does, and `Escape` hides it without moving focus.
- The pointer can move from the target onto the tooltip without it hiding.
- Hidden, it is `aria-hidden`.

## Styling

```css
.mtrl-tooltip, .mtrl-tooltip--visible { }
.mtrl-tooltip--default, .mtrl-tooltip--plain, .mtrl-tooltip--rich { }
.mtrl-tooltip--top, .mtrl-tooltip--right, .mtrl-tooltip--bottom, .mtrl-tooltip--left { }
.mtrl-tooltip__arrow { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | `inverse-surface`, opaque, no elevation, 4dp corners, 200dp wide at most |
| Text | Body Small, `inverse-on-surface` |
| Padding | 4dp above and below, 8dp at the sides |
| Rich | `surface-container`, 12dp corners, elevation 2, 320dp wide at most; Body Medium, `on-surface-variant`; 12dp above and below, 16dp at the sides |
| Distance from the target | 8dp |
