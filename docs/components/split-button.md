# Split Button Component

The Split Button pairs one action with a button that opens more choices. The leading button does the common thing; the trailing button opens a menu, and its chevron turns over while the menu is open. Both halves are the library's own button, so they share its colours, state layers, focus rings and touch targets.

## Overview

Use a split button when one action is the obvious default and the rest are variations of it:

- Save, with "Save a copy" and "Save as template" behind the chevron
- Watch later, with "Add to queue" and "Save to playlist"
- Send, with "Schedule send"

If the choices are unrelated to each other, use a menu on its own. If they are alternatives of equal weight, use a button group.

The component follows the Material 3 expressive split button specification: five sizes matching the button scale, a 2dp gap, small inner corners that grow when a half is hovered or pressed, and a trailing button whose inner corner becomes a circle while its menu is open.

## Import

```javascript
import { createSplitButton } from 'mtrl';
```

## Basic Usage

```javascript
const button = createSplitButton({
  text: 'Watch later',
  icon: watchIcon,
  trailingLabel: 'More watch options',
  items: [
    { id: 'queue', text: 'Add to queue' },
    { id: 'playlist', text: 'Save to playlist' }
  ],
  onClick: () => watchLater(),
  onSelect: ({ item }) => choose(item.id)
});

document.querySelector('.toolbar').appendChild(button.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | Label of the leading button |
| `icon` | `string` | `undefined` | Icon of the leading button, as an HTML string |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'elevated'` | `'filled'` | Visual style, shared by both halves |
| `size` | `'xs' \| 's' \| 'm' \| 'l' \| 'xl'` | `'s'` | Size of both halves |
| `disabled` | `boolean` | `false` | Whether both halves are disabled |
| `trailingLabel` | `string` | `'More options'` | Accessible name of the trailing button |
| `ariaLabel` | `string` | `undefined` | Accessible name of the leading button, when its label is not enough |
| `groupLabel` | `string` | `undefined` | Accessible name of the pair |
| `items` | `MenuContent[]` | `undefined` | Menu items for the trailing button to open |
| `onClick` | `function` | `undefined` | What the leading button does |
| `onSelect` | `function` | `undefined` | Called with the chosen item |
| `class` | `string` | `undefined` | Additional CSS classes |

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `setText(text)` | `SplitButtonComponent` | Sets the leading button's label |
| `getText()` | `string` | The leading button's label |
| `setIcon(icon)` | `SplitButtonComponent` | Sets the leading button's icon |
| `expand()` | `SplitButtonComponent` | Opens whatever the trailing button opens |
| `collapse()` | `SplitButtonComponent` | Closes it |
| `isExpanded()` | `boolean` | Whether it is open |
| `enable()` / `disable()` | `SplitButtonComponent` | Both halves together |
| `isDisabled()` | `boolean` | Whether the leading button is disabled. `enable()` and `disable()` always move both halves together, so this stands for the pair |
| `on(event, handler)` / `off(event, handler)` | `SplitButtonComponent` | Event listeners |
| `destroy()` | `void` | Takes it off the page and releases the menu |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The group holding both halves |
| `leadingElement` | `HTMLButtonElement` | The leading button |
| `trailingElement` | `HTMLButtonElement` | The trailing button |
| `menu` | `MenuComponent` | The menu, when the component was given items |

## Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | The leading button was activated | `{ splitButton, expanded, originalEvent }` |
| `expand` | The trailing button opened its choices | `{ splitButton, expanded, originalEvent }` |
| `collapse` | It closed them | `{ splitButton, expanded, originalEvent }` |
| `change` | Either of the two, carrying the new state | `{ splitButton, expanded, originalEvent }` |
| `select` | A menu item was chosen | `{ splitButton, item }` |

## Examples

### Without a menu

Given no items, the component only reports that the trailing button was activated, and you open whatever you like. The guidelines allow other surfaces, though a menu is the usual one.

```javascript
const button = createSplitButton({
  text: 'Export',
  trailingLabel: 'More export formats',
  onClick: () => exportPdf()
});

button.on('change', ({ expanded }) => {
  if (expanded) showExportPanel();
  else hideExportPanel();
});
```

### Sizes

```javascript
// The default is small; scale up in large windows or for emphasis
const hero = createSplitButton({ text: 'Get started', size: 'xl', items });
const compact = createSplitButton({ text: 'Filter', size: 'xs', items });
```

### Colour

```javascript
for (const variant of ['filled', 'tonal', 'outlined', 'elevated']) {
  createSplitButton({ text: 'Save', variant, items });
}
```

Unlike a toggle button, a split button's colour does not change when its menu opens. Only a state layer and the shape do.

Filled and tonal halves stay flat. A standalone filled or tonal button rises to elevation level 1 on hover, but in a split button that shadow falls across the 2dp gap and onto the other half, so whichever half the pointer is over appears to float above its neighbour and the pair stops reading as one control. Hover is left to the state layer and the inner corner morph, which is what the split button's own states describe. A connected button group flattens its segments for the same reason. An elevated split button keeps its elevation, since that is what the variant is.

## Measurements

Every number comes from the Material 3 split button tokens. Sizes are given in dp.

| Size | Height | Leading padding | Trailing padding | Chevron | Inner corner | Inner corner, active |
|------|--------|-----------------|------------------|---------|--------------|----------------------|
| xs | 32 | 12 / 10 | 13 | 22 | 4 | 8 |
| s | 40 | 16 / 12 | 13 | 22 | 4 | 12 |
| m | 56 | 24 / 24 | 15 | 26 | 8 | 12 |
| l | 96 | 48 / 48 | 29 | 38 | 12 | 20 |
| xl | 136 | 64 / 64 | 43 | 50 | 16 | 20 |

The gap between the halves is 2dp at every size, and the outer corners are always a full pill. The leading button keeps a 48dp minimum width.

The resting inner corner is one departure from the token table, which gives 4dp at the three smallest sizes and 8 and 12dp at the two largest. Those hold at extra small and small, where they are about an eighth of the height and match the renders in the spec, but at the larger sizes a fixed 4 to 12dp corner reads as square beside a full pill: 4dp is a fourteenth of a 56dp button. The three larger sizes keep the proportion instead, so every size lands between a tenth and a seventh of its height. Set `--mtrl-split-button-inner-shape` to go back to the token value, and `--mtrl-split-button-inner-shape-active` for the hovered and pressed one.

```css
/* The strict token values */
.mtrl-split-button--m { --mtrl-split-button-inner-shape: 4px; }
.mtrl-split-button--l { --mtrl-split-button-inner-shape: 8px; }
.mtrl-split-button--xl { --mtrl-split-button-inner-shape: 12px; }
```

While the menu is closed, the chevron sits 1 to 6dp off centre depending on the size, so it looks centred in a button whose two ends have different shapes. When the menu opens it centres properly and turns 180 degrees, on the standard motion scheme rather than the expressive one.

## Accessibility

- The two halves are a `group`, which `groupLabel` can name
- The leading button is labelled like any button, by its text or by `ariaLabel`
- The trailing button carries `aria-haspopup` and `aria-expanded`, and a label that should say how its choices relate to the action. Beside a "Watch later" button, "More watch options" reads better than "More options"
- Tab moves from the leading button to the trailing one; Space and Enter activate the focused half
- At the two sizes shorter than 48dp, each half still offers a 48dp target
- The whole component mirrors under `direction: rtl`

```html
<div class="mtrl-split-button mtrl-split-button--filled mtrl-split-button--s" role="group" aria-label="Watch options">
  <button class="mtrl-button mtrl-split-button__leading">Watch later</button>
  <button class="mtrl-button mtrl-split-button__trailing" aria-label="More watch options" aria-haspopup="menu" aria-expanded="false">
    <svg class="mtrl-split-button__chevron" aria-hidden="true">…</svg>
  </button>
</div>
```

## CSS Customization

```css
/* The pair */
.mtrl-split-button { /* ... */ }
.mtrl-split-button--filled { /* ... */ }
.mtrl-split-button--xl { /* ... */ }

/* The halves */
.mtrl-split-button__leading { /* ... */ }
.mtrl-split-button__trailing { /* ... */ }
.mtrl-split-button__chevron { /* ... */ }

/* While the menu is open */
.mtrl-split-button--expanded { /* ... */ }
```

### CSS Custom Properties

```css
.mtrl-split-button {
  --mtrl-split-button-inner-shape: 8px;        /* the corners where the halves meet */
  --mtrl-split-button-inner-shape-active: 12px; /* the same, hovered or pressed */
}
```

Colours come from the button, so a split button follows whatever the button's tokens say.

## Best Practices

- Keep the leading label to one or two words, with an icon that matches the action
- Leave the chevron alone: it turns to show the menu's state, and swapping it breaks that
- Align the menu with the trailing button, 4dp away, which is what the component does with its own menu
- Split buttons take more room than buttons, so they can be a size smaller than the primary control beside them

## TypeScript Support

```typescript
import { createSplitButton, SplitButtonConfig, SplitButtonComponent } from 'mtrl';

const config: SplitButtonConfig = {
  text: 'Watch later',
  variant: 'tonal',
  size: 'm',
  items: [{ id: 'queue', text: 'Add to queue' }]
};

const button: SplitButtonComponent = createSplitButton(config);
button.expand();
button.on('select', ({ item }) => console.log(item?.id));
```
