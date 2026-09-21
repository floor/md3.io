# Tooltip Component

A tooltip names a control that has no label of its own — an icon button, a compact toolbar item, a truncated cell — in a few words, on hover and on focus. It never holds anything the user has to act on, because it is not reachable by keyboard and it goes away as soon as the pointer leaves. Reach for it to identify; reach for something else to explain.

## Overview

A tooltip is created against a target element and attaches its own listeners to it. From then on it shows 300ms after `mouseenter` or `focus`, hides 100ms after `mouseleave` or `blur`, and repositions itself on scroll and resize while it is up. Those two delays are fixed in the implementation and the triggers cannot be turned off — see the configuration table.

The tooltip mounts itself: it appends its element to `document.body` at creation, which is what keeps an ancestor's `overflow` from clipping it. There is nothing to append, so the examples below do not. An extra `document.body.appendChild(tooltip.element)` is harmless — it moves the element to where it already is — but it is not needed and older code that does it can drop the line.

Placement is computed against the target, then clamped horizontally to the window — never vertically, and the tooltip never flips to the opposite side. A tooltip near the top of the window can be placed off-screen above it.

## Import

```javascript
import { createTooltip } from 'mtrl';
```

## Basic Usage

```javascript
const tooltip = createTooltip({
  text: 'Delete item',
  target: document.querySelector('#delete-button')
});
```

That is the whole integration: the tooltip is already in `document.body`, the target is now described by it, and hover and focus do the rest.

`bottom` is the placement you get. To put a tooltip anywhere else, call `setPosition()` after creation — passing `position` in the config sets the CSS class but not the geometry, so the tooltip would still be placed below its target:

```javascript
tooltip.setPosition('top');
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | The label to show |
| `target` | `HTMLElement` | `undefined` | The element the tooltip describes |
| `position` | `TooltipPosition` | `'bottom'` | **Applied to the CSS class only.** The placement maths ignores it and always computes `bottom`; call `setPosition()` after creation to move the tooltip |
| `variant` | `'default' \| 'rich' \| 'plain'` | `'default'` | Visual style |
| `visible` | `boolean` | `false` | Show immediately on creation |
| `showDelay` | `number` | `300` | **Accepted but not applied.** The delay is hard-coded to 300ms |
| `hideDelay` | `number` | `100` | **Accepted but not applied.** The delay is hard-coded to 100ms |
| `showOnHover` | `boolean` | `true` | **Accepted but not applied.** `mouseenter` / `mouseleave` are always bound on the target |
| `showOnFocus` | `boolean` | `true` | **Accepted but not applied.** `focus` / `blur` are always bound on the target |
| `zIndex` | `number` | `undefined` | Stacking order, set inline on the element |
| `class` | `string` | `undefined` | Extra CSS classes |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'tooltip'` | Component name used in class generation |
| `rich` | `boolean` | `false` | Declared for HTML content; see the note below |

`position` is one of `top`, `right`, `bottom`, `left`, or any of those suffixed `-start` or `-end` for the twelve placements in `TOOLTIP_POSITIONS`.

`rich` is declared and defaulted but nothing currently reads it: `setText()` inserts a text node, so markup passed to it is escaped. Use `variant: 'rich'`, which widens the padding and left-aligns the text, and treat rich HTML content as not yet supported.

Four more options are in the same state, and they are marked in the table above. `showDelay`, `hideDelay`, `showOnHover` and `showOnFocus` are read from the config into the component's defaults and then ignored: the API layer keeps its own copies of all four as constants. `position` is half-read — the class is applied, the geometry is not. Everything else in the table works.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(text)` | `text: string` | `TooltipComponent` | Replaces the label; repositions if visible |
| `getText()` | — | `string` | The current label, without the arrow |
| `setPosition(position)` | `position: TooltipPosition` | `TooltipComponent` | Changes the preferred side |
| `getPosition()` | — | `TooltipPosition` | The preferred side |
| `setTarget(target)` | `target: HTMLElement` | `TooltipComponent` | Moves the tooltip to another element, rebinding its listeners |
| `show(immediate)` | `immediate?: boolean` | `TooltipComponent` | Shows it, skipping `showDelay` when `true` |
| `hide(immediate)` | `immediate?: boolean` | `TooltipComponent` | Hides it, skipping `hideDelay` when `true` |
| `isVisible()` | — | `boolean` | Whether it is on screen |
| `updatePosition()` | — | `TooltipComponent` | Recomputes placement against the target |
| `getClass(name)` | `name: string` | `string` | A class name with the component prefix |
| `destroy()` | — | `void` | Unbinds the target, removes the element, releases listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The tooltip surface |
| `target` | `HTMLElement \| null` | The element it describes |
| `lifecycle` | `{ destroy() }` | Lifecycle handle |

The tooltip does not emit events — it is composed without the event feature, so there is no `on()`. Drive it with `show()` and `hide()` if you need behaviour of your own.

## Examples

### Labelling a row of icon buttons

```javascript
const tooltips = [
  ['#bold', 'Bold'],
  ['#italic', 'Italic'],
  ['#link', 'Insert link']
].map(([selector, text]) => createTooltip({
  text,
  target: document.querySelector(selector)
}));

// Later
tooltips.forEach((tooltip) => tooltip.destroy());
```

### Driving it yourself

`show(true)` and `hide(true)` skip the delays, so a tooltip can be driven on your own terms — for a validation hint, say.

What you cannot do is stop it responding to the target as well: `showOnHover: false` and `showOnFocus: false` are accepted and ignored, so hovering or focusing the input below will also show the hint. Drive a tooltip yourself only where that extra behaviour is harmless; where it is not, the hint belongs in the field's own supporting text.

```javascript
const tooltip = createTooltip({
  text: 'Enter a valid email address',
  target: input
});

tooltip.setPosition('top');

input.addEventListener('input', () => {
  if (input.validity.valid) tooltip.hide(true);
  else tooltip.show(true);
});
```

### Reusing one tooltip across a list

`setTarget()` rebinds the listeners, so a long list does not need a tooltip per row.

```javascript
const tooltip = createTooltip({});
tooltip.setPosition('right');

list.addEventListener('pointerover', (event) => {
  const row = event.target.closest('[data-title]');
  if (!row) return;
  tooltip.setText(row.dataset.title).setTarget(row);
});
```

## Accessibility

- The element is `role="tooltip"` with a generated `id`, and `setTarget()` puts that id in the target's `aria-describedby`. Assistive technology reads the tooltip as a description of the control, not as a separate thing to visit.
- `aria-hidden` flips between `"true"` and `"false"` as it shows and hides, so a hidden tooltip is not announced.
- Focus triggers it as well as hover, which is what makes it usable from a keyboard. This cannot be turned off, so the keyboard path is always there.
- A tooltip is a description, not a name. A control identified only by a tooltip still needs its own `aria-label`; `aria-describedby` supplements a name, it does not supply one.
- The tooltip is not focusable and has `pointer-events: none`, so it cannot be hovered, selected or dismissed — which is why it must not contain links, buttons or text worth copying. Anything of that kind belongs in a popover or a dialog.
- There is no Escape handling, because there is nothing focusable to escape from.

## Styling

```css
.mtrl-tooltip { /* the surface */ }
.mtrl-tooltip--visible { /* while shown */ }
.mtrl-tooltip--default,
.mtrl-tooltip--rich,
.mtrl-tooltip--plain { /* variants */ }
.mtrl-tooltip--top,
.mtrl-tooltip--bottom,
.mtrl-tooltip--left,
.mtrl-tooltip--right { /* placement, including the -start and -end forms */ }
.mtrl-tooltip__arrow { /* the pointer, with its own --top, --bottom, … modifiers */ }
```

The default and rich variants use the inverse surface roles; the plain variant sits on `surface-container-high` with an `outline` border and no shadow.

## Best Practices

- Two or three words. If it needs a sentence, the control needs a label or the page needs help text.
- Never put an action, a link, or anything the user must read to proceed in a tooltip — it cannot be reached.
- Do not repeat a visible label. A tooltip that says what the button already says is noise for a screen reader, which will hear both.
- The delays are fixed at 300ms in and 100ms out, which is what stops tooltips flashing as the pointer crosses a toolbar. Nothing to tune, and nothing to get wrong.
- Leave it in `document.body`, where it puts itself. Moving a tooltip inside a scroll container or an `overflow: hidden` ancestor gets it clipped.
- Call `destroy()` when the target goes away; the tooltip holds listeners on it.

## TypeScript Support

```typescript
import { createTooltip, TooltipConfig, TooltipComponent } from 'mtrl';

const config: TooltipConfig = {
  text: 'Delete item',
  target: deleteButton
};

const tooltip: TooltipComponent = createTooltip(config);
tooltip.setPosition('top-start');

if (!tooltip.isVisible()) tooltip.show(true);
```
