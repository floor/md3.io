# Icon Button Component

An icon button is a button whose whole label is its icon. Reach for one when the action is recognisable without words and space is tight: a toolbar, an app bar, a card's corner, a row of media controls. It also has a mode a plain button does not, the toggle, where the button holds a binary state — favourited, bookmarked, muted — and swaps its icon to show which way the state is set. Because there is no text, an icon button is only as clear as its `ariaLabel`, which is the one option you should never leave out.

## Import

```javascript
import { createIconButton } from 'mtrl';
```

## Basic Usage

```javascript
const menu = createIconButton({
  icon: '<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
  ariaLabel: 'Open menu'
});

menu.on('click', () => openMenu());

document.querySelector('.toolbar').appendChild(menu.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `icon` | `string` | `undefined` | The icon, as an HTML string |
| `ariaLabel` | `string` | `undefined` | Accessible name; describes the action, not the icon |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'standard'` | `'standard'` | Visual style, in descending order of emphasis |
| `size` | `'xs' \| 's' \| 'm' \| 'l' \| 'xl'` | `'s'` | Container size |
| `shape` | `'round' \| 'square'` | `'round'` | Resting corner shape |
| `width` | `'narrow' \| 'default' \| 'wide'` | `'default'` | Width relative to the size's container |
| `toggle` | `boolean` | `false` | Turns on toggle mode; required for `select()`, `deselect()` and the `toggle` event |
| `selectedIcon` | `string` | `undefined` | Icon shown while selected, in toggle mode |
| `selected` | `boolean` | `false` | Whether the button starts selected; only read when `toggle` is true |
| `disabled` | `boolean` | `false` | Whether the button starts disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The underlying button's type attribute |
| `value` | `string` | `undefined` | Value attribute, for use in a form |
| `ripple` | `boolean` | `true` | Whether to run the ripple effect on press |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Overrides for the ripple's duration, easing and start/end opacity |
| `class` | `string` | `undefined` | Additional CSS classes |
| `tooltip` | `boolean` | `true` | Accepted but not applied. The option is declared and defaulted, but nothing in the component reads it and no tooltip is rendered. Use the `tooltip` component beside the button if you need one |

`selectedIcon` on its own does not turn on toggle mode. Set `toggle: true` as well, or the button behaves like any other and the second icon is never shown.

## Component API

### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setIcon(icon)` | `icon: string` | `IconButtonComponent` | Replaces the icon |
| `getIcon()` | none | `string` | The icon's HTML |
| `setSelectedIcon(icon)` | `icon: string` | `IconButtonComponent` | Replaces the selected-state icon |
| `getSelectedIcon()` | none | `string` | The selected-state icon's HTML, or an empty string |
| `setAriaLabel(label)` | `label: string` | `IconButtonComponent` | Sets the accessible name |
| `setValue(value)` | `value: string` | `IconButtonComponent` | Sets the value attribute |
| `getValue()` | none | `string` | The value attribute |

### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` | `variant: string` | `IconButtonComponent` | Swaps the variant |
| `getVariant()` | none | `string` | The current variant |
| `setSize(size)` | `size: string` | `IconButtonComponent` | Swaps the size |
| `getSize()` | none | `string` | The current size |
| `setShape(shape)` | `shape: string` | `IconButtonComponent` | Swaps the shape |
| `getShape()` | none | `string` | The current shape |
| `setWidth(width)` | `width: string` | `IconButtonComponent` | Swaps the width |
| `getWidth()` | none | `string` | The current width |

### State

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `select()` | none | `IconButtonComponent` | Selects the button, in toggle mode |
| `deselect()` | none | `IconButtonComponent` | Deselects it |
| `toggleSelected()` | none | `IconButtonComponent` | Flips the selected state |
| `isSelected()` | none | `boolean` | Whether it is selected |
| `isToggle()` | none | `boolean` | Whether toggle mode is on |
| `enable()` | none | `IconButtonComponent` | Enables the button |
| `disable()` | none | `IconButtonComponent` | Disables it |

### Events, styles and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string`, `handler: Function` | `IconButtonComponent` | Adds an event listener |
| `off(event, handler)` | `event: string`, `handler: Function` | `IconButtonComponent` | Removes one |
| `addClass(...classes)` | `classes: string[]` | `IconButtonComponent` | Adds CSS classes |
| `removeClass(...classes)` | `classes: string[]` | `IconButtonComponent` | Removes CSS classes |
| `destroy()` | none | `void` | Takes it off the page and releases its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLButtonElement` | The button element |
| `icon` | `IconAPI` | Direct access to the icon slot: `setIcon`, `getIcon`, `getElement` |
| `disabled` | `object` | The disabled feature: `enable`, `disable`, `isDisabled` |
| `lifecycle` | `object` | The lifecycle feature: `destroy` |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | the DOM event | The button was activated; not fired while disabled |
| `toggle` | `{ selected }` on `event.detail` | The selected state changed, in toggle mode only. **Not delivered through `on()`** — see below |
| `focus` | the DOM event | The button took focus |
| `blur` | the DOM event | It lost focus |

`click`, `focus` and `blur` are forwarded into the component's own event system, so `on()` and `off()` handle them.

`toggle` is not. It is a native `CustomEvent` dispatched straight onto the DOM element, and `on()` subscribes to a separate internal emitter that nothing ever publishes `toggle` to. Registering it with `on('toggle', ...)` silently does nothing. Listen on the element instead:

```javascript
button.element.addEventListener('toggle', (event) => {
  console.log(event.detail.selected);
});
```

It bubbles, so a container above the button can listen for it too.

## Examples

### The four variants

```javascript
// Descending emphasis: reserve filled for the one action that matters most
const save = createIconButton({ icon: saveIcon, variant: 'filled', ariaLabel: 'Save' });
const edit = createIconButton({ icon: editIcon, variant: 'tonal', ariaLabel: 'Edit' });
const share = createIconButton({ icon: shareIcon, variant: 'outlined', ariaLabel: 'Share' });
const more = createIconButton({ icon: moreIcon, ariaLabel: 'More options' });
```

### A toggle button

```javascript
const favorite = createIconButton({
  icon: heartOutlineIcon,
  selectedIcon: heartFilledIcon,
  toggle: true,
  ariaLabel: 'Add to favorites'
});

// `toggle` is a DOM CustomEvent, not one of the events `on()` carries
favorite.element.addEventListener('toggle', (event) => {
  if (event.detail.selected) addToFavorites(itemId);
  else removeFromFavorites(itemId);
});

// Reflect state loaded from elsewhere
if (isFavorited) favorite.select();
```

The unselected icon should be outlined and the selected one filled, so the state reads at a glance rather than only from the colour.

### Sizes and shapes

```javascript
// A round button morphs to a square while selected, and a square one to a circle
const dense = createIconButton({ icon, size: 'xs', ariaLabel: 'Filter' });
const hero = createIconButton({ icon, size: 'xl', variant: 'filled', ariaLabel: 'Record' });
const square = createIconButton({ icon, shape: 'square', variant: 'tonal', ariaLabel: 'Grid view' });
```

### Changing a button after it is built

```javascript
const button = createIconButton({ icon, ariaLabel: 'Play' });

button
  .setVariant('filled')
  .setSize('m')
  .setIcon(pauseIcon)
  .setAriaLabel('Pause');
```

## Accessibility

- `ariaLabel` becomes the `aria-label` attribute and is the button's only name. Describe the action, not the picture: "Add to favorites", not "Heart"
- In toggle mode the component writes `aria-pressed` and keeps it in step with the selected state. Do not set it yourself
- Mark the icon's own SVG `aria-hidden="true"`, so a screen reader announces the label once
- Tab moves focus to the button; Space and Enter activate it
- Both `xs` (32dp) and `s` (40dp) fall under the 48dp minimum target. The stylesheet declares a 48×48 pseudo-element at `xs` only, and the base rule's `overflow: hidden` clips it back to the container, so in practice neither size gets a larger hit area than its own box. Pad around small icon buttons yourself on touch surfaces
- A disabled button uses the native `disabled` attribute, so it is skipped by the tab order without any extra work

```html
<button class="mtrl-icon-button mtrl-icon-button--toggle" aria-label="Add to favorites" aria-pressed="false">
  <span class="mtrl-icon mtrl-icon-button-icon"><svg aria-hidden="true">…</svg></span>
</button>
```

## Styling

```css
/* Base */
.mtrl-icon-button { /* ... */ }
.mtrl-icon { /* ... */ }                  /* the icon span, shared with every component */
.mtrl-icon-button-icon { /* ... */ }      /* the same span, scoped to this component */

/* Variants */
.mtrl-icon-button--filled { /* ... */ }
.mtrl-icon-button--tonal { /* ... */ }
.mtrl-icon-button--outlined { /* ... */ }
.mtrl-icon-button--standard { /* ... */ }

/* Sizes; 's' is the default and adds no class */
.mtrl-icon-button--xs { /* ... */ }
.mtrl-icon-button--m { /* ... */ }
.mtrl-icon-button--l { /* ... */ }
.mtrl-icon-button--xl { /* ... */ }

/* Shape; 'round' is the default and adds no class */
.mtrl-icon-button--square { /* ... */ }

/* Width; 'default' adds no class */
.mtrl-icon-button--narrow { /* ... */ }
.mtrl-icon-button--wide { /* ... */ }

/* States */
.mtrl-icon-button--toggle { /* ... */ }
.mtrl-icon-button--selected { /* ... */ }
.mtrl-icon-button--disabled { /* ... */ }
```

The press morph is driven by `:active` rather than a class, so there is no state class to hook for it.

### CSS Custom Properties

Three properties override the corner radius at each of the three shapes the button passes through. They are shared with the button, so setting one on a container affects both. `--mtrl-button-shape` is the fallback for the resting radius of every shape, so setting it also overrides a round button's 50%.

```css
.mtrl-icon-button {
  --mtrl-button-shape: 12px;          /* the resting radius, round and square alike */
  --mtrl-button-shape-pressed: 8px;   /* while pressed */
  --mtrl-button-shape-selected: 12px; /* while selected, in toggle mode */
}
```

Colours come from the theme's `primary`, `secondary-container`, `surface-container` and `outline` roles, so an icon button follows whatever the theme says.

## Measurements

Every value below is in the component's own source: the dp tables in `src/components/icon-button/constants.ts` and the `$sizes` and `$widths` maps in `src/styles/components/_icon-button.scss`, which agree. Neither names an M3 token for any individual value, so none is quoted here.

| Size | Container | Icon | Square radius | Pressed radius | Narrow width | Wide width |
|------|-----------|------|---------------|----------------|--------------|------------|
| xs | 32 | 18 | 12 | 8 | 28 | 36 |
| s | 40 | 24 | 12 | 8 | 32 | 48 |
| m | 56 | 24 | 16 | 12 | 48 | 64 |
| l | 96 | 36 | 28 | 16 | 80 | 112 |
| xl | 136 | 48 | 28 | 16 | 112 | 160 |

The default width at each size equals the container, so the middle column of the width scale is 32, 40, 56, 96 and 136. A round button's radius is always half its height; the square radius column applies only to `shape: 'square'`, and the pressed radius to both shapes while the button is held down.

## Best Practices

- Only use an icon whose meaning is already understood. If the action needs explaining, use a button with text
- Keep one filled icon button at most in a group; the rest should be standard or outlined, or the emphasis means nothing
- Use toggle mode for a state the button owns, not for navigation or for a choice among several options
- Keep sizes consistent inside a toolbar, and let variant rather than size carry the emphasis
- Call `destroy()` when you remove a button, so its listeners and ripple go with it
