# Divider Component

The Divider component draws a thin line that separates content into groups. Use
it where the separation is not already obvious from spacing or a heading: between
sections of a list, between a card's body and its actions, or between two blocks
of controls in a row. A divider carries no meaning on its own, so if the groups
need names, give them headings and skip the line.

## Import

```javascript
import { createDivider } from 'mtrl';

import {
  DIVIDER_ORIENTATIONS,
  DIVIDER_VARIANTS
} from 'mtrl/components/divider/constants';
```

## Basic Usage

```javascript
const divider = createDivider();

listElement.appendChild(divider.element);
```

The component renders an `<hr>` element, so it is a separator to assistive
technology without any extra attributes.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Horizontal draws a full-width line; vertical draws a full-height one and switches the element to `inline-block` |
| `variant` | `'full-width' \| 'inset' \| 'middle-inset'` | `'full-width'` | How the line is inset within its container |
| `insetStart` | `number` | `16` for the inset variants | Start inset in pixels: left for horizontal, top for vertical |
| `insetEnd` | `number` | `0` for `inset`, `16` for `middle-inset` | End inset in pixels: right for horizontal, bottom for vertical |
| `thickness` | `number` | `1` | Thickness in pixels: height for horizontal, width for vertical |
| `color` | `string` | theme `outline-variant` | Any CSS colour value |
| `class` | `string \| string[]` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

The inset options only take effect for the `inset` and `middle-inset` variants;
setting them on a `full-width` divider does nothing.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getOrientation()` | none | `'horizontal' \| 'vertical'` | The orientation passed at construction. `setOrientation` does not update it |
| `setOrientation(orientation)` | `orientation: 'horizontal' \| 'vertical'` | `DividerComponent` | Swaps the orientation class and reapplies the dimension constraints. Safe to call once: it does not record the new value, so a second call removes the wrong class and `getOrientation` keeps reporting the original |
| `getVariant()` | none | `'full-width' \| 'inset' \| 'middle-inset'` | The variant passed at construction. `setVariant` does not update it |
| `setVariant(variant)` | `variant: 'full-width' \| 'inset' \| 'middle-inset'` | `DividerComponent` | Swaps the variant class and recomputes the inset margins. Like `setOrientation`, it does not record the new value, so a second call removes the wrong class |
| `setInset(insetStart?, insetEnd?)` | `insetStart?: number, insetEnd?: number` | `DividerComponent` | Overrides the margins; ignored while the variant is `full-width`. It picks its axis from `getOrientation()`, so after a `setOrientation` it writes to the old axis |
| `setThickness(thickness)` | `thickness: number` | `DividerComponent` | Sets the thickness in pixels along the divider's cross axis, chosen from `getOrientation()` — so it too follows the construction-time orientation |
| `setColor(color)` | `color: string` | `DividerComponent` | Sets a custom colour, replacing the themed default |

All setters return the component, so they chain. `setOrientation` and
`setVariant` change the DOM but not the component's own record of its state, so
treat orientation and variant as set once at construction: build a new divider
rather than reorienting one twice.

## Examples

### List dividers

A list divider is normally inset so it starts under the text rather than under
the leading icon or avatar.

```javascript
const divider = createDivider({
  variant: 'inset',
  insetStart: 72
});
```

### A vertical separator in a toolbar

```javascript
const separator = createDivider({
  orientation: 'vertical',
  variant: 'middle-inset',
  insetStart: 8,
  insetEnd: 8
});

toolbar.insertBefore(separator.element, overflowButton.element);
```

A vertical divider takes its height from its parent, so the parent needs a
resolved height: a flex row with `align-items: stretch` is the usual arrangement.

### Changing a divider after creation

```javascript
const divider = createDivider();

// Emphasise it while a section is selected
divider.setThickness(2).setColor('var(--mtrl-sys-color-primary)');

// Back to the default weight and theme colour
divider.setThickness(1).setColor('');
```

## Accessibility

- The element is an `<hr>`, which maps to the `separator` role, so screen readers
  announce the break without any ARIA of your own.
- A divider is decorative when the grouping is already conveyed some other way.
  In that case hide it: `divider.element.setAttribute('aria-hidden', 'true')`.
- Colour alone should not be the only thing separating two groups. Keep the
  spacing that makes the grouping visible even when the line does not render.

## Styling

```css
.mtrl-divider { }
.mtrl-divider--horizontal { }
.mtrl-divider--vertical { }
.mtrl-divider--full-width { }
.mtrl-divider--inset { }
.mtrl-divider--middle-inset { }
```

The inset margins and the thickness are written as inline styles by the
component, so a stylesheet that wants to override them needs `!important` or a
different pair of properties. The colour is a plain `background-color` and is
easy to override from CSS.

Dividers nested inside a list or a card pick up an 8px vertical margin from
`_divider.scss`, which keeps them off the content above and below without any
configuration.

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Line colour | theme outline variant | `outline-variant`, named in `_divider.scss` and in the `setColor` documentation |

`constants.ts` declares `DEFAULT_DIVIDER_THICKNESS` (1) and `DEFAULT_INSET_VALUE`
(16) and cites the Material Design 3 guidelines for the first, without naming a
token — but nothing imports either one. The defaults that actually apply are the
literal `1` in `config.ts` and the literal `16` in `features.ts`, which happen to
agree with them.
