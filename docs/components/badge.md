---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Badge

A badge shows a count or a status on another element: unread messages on an icon, a new
item in a navigation bar. A **large** badge holds up to four characters; a **small** one is a
6dp dot for news without a number. See the
[M3 badges guidelines](https://m3.material.io/components/badges/overview).

## Usage

```example
badge:
  label: 3
```

The factory's `target` wraps an element and puts the badge on its corner, set by `position`.
The web component is the badge alone, placed where it is written. Navigation items and tabs
take a badge of their own, through their `badge` option.

## Examples

### A maximum

Above `max`, a number shows as `{max}+`. A label longer than four characters is shortened:
`12500` to `999+`, text to its first four characters.

```example
badge:
  label: 1200
  max: 999
  color: primary
```

### Hidden at zero

An empty label or `0` hides the badge, and any other label shows it again.

```example
badge:
  label: 5
  action markAllRead:
    set label: 0
```

## API

<!-- API: generated from mtrl's types and <m-badge>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string \| number` | `''` | What a large badge shows |
| `variant` | `'small' \| 'large'` | `'large'` | A dot, or a badge with a label |
| `max` | `number` | `undefined` | Above it, a number shows as `{max}+` |
| `color` | `'error' \| 'primary' \| 'secondary' \| 'tertiary' \| 'success' \| 'warning' \| 'info'` | `'error'` | Its color role |
| `target` | `HTMLElement` | `undefined` | The element it is attached to, which it wraps; it needs a parent |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Which corner of the target |
| `visible` | `boolean` | `true` | Whether it starts shown |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

The web component takes `label` (or its text), `variant`, `color` and `max` as attributes, and
`visible` as a property.

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(label)` / `getLabel()` | `label: string \| number` | `BadgeComponent` / `string` | The label, as shown; setting it hides the badge when it is empty or `0`, and shows it otherwise |
| `setContent(content)` / `getContent()` | `content: string \| number` | `BadgeComponent` / `string` | The same as `setLabel()` and `getLabel()` |
| `setMax(max)` | `max: number` | `BadgeComponent` | The maximum, applied to the label |
| `show()` / `hide()` / `toggle(visible?)` | `visible?: boolean` | `BadgeComponent` | Shows or hides it |
| `isVisible()` | none | `boolean` | Whether it is shown |
| `setVariant(variant)` / `setColor(color)` / `setPosition(position)` | `string` | `BadgeComponent` | The variant, the color, the corner |
| `attachTo(target)` / `detach()` | `target: HTMLElement` | `BadgeComponent` | Wraps a target and moves the badge onto it; detached, it moves to the end of `document.body` |
| `addClass(...classes)` / `removeClass(...classes)` | `...classes: string[]` | `BadgeComponent` | CSS classes |
| `destroy()` | none | `void` | Removes it, and unwraps its target |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The badge |
| `wrapper` | `HTMLElement \| undefined` | The element wrapping the target and the badge |

A badge has no events: it has `on()` and `off()`, and emits nothing.

## Accessibility

- A large badge has `role="status"`, so a change of its label is announced.
- A small badge is `aria-hidden`: name the element it is on with what it says, such as
  "Inbox, new messages".
- A badge is not focusable; the element it is on takes the interaction.

## Styling

```css
.mtrl-badge, .mtrl-badge--small, .mtrl-badge--large { }
.mtrl-badge--error, .mtrl-badge--primary, .mtrl-badge--secondary, .mtrl-badge--tertiary { }
.mtrl-badge--success, .mtrl-badge--warning, .mtrl-badge--info { }
.mtrl-badge--positioned { }            /* on a target */
.mtrl-badge--top-right, .mtrl-badge--top-left, .mtrl-badge--bottom-right, .mtrl-badge--bottom-left { }
.mtrl-badge--invisible, .mtrl-badge--overflow { }
.mtrl-badge__wrapper { }               /* the target's wrapper */
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Small | 6dp dot, 3dp beyond the target's corner |
| Large | 16dp high, at least 16dp wide, 8dp corners, 4dp padding, 8dp beyond the target's corner |
| Large, with a maximum | 34dp wide at most |
| Colors | The role and its `on-` pair: `error` and `on-error` by default |
