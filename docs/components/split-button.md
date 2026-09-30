---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Split button

A split button pairs one action with a button that opens more choices: Save, with "Save a
copy" behind the chevron; Send, with "Schedule send". Use it when one action is the obvious
default and the rest are variations of it; for unrelated choices use a
[menu](/docs/components/menu/), for alternatives of equal weight a
[button group](/docs/components/button-group/). See the
[M3 split button guidelines](https://m3.material.io/components/split-button/overview).

## Usage

The leading button does the common thing; the trailing one opens a menu of `items`, and its
chevron turns over while the menu is open.

```example
split-button:
  text: Watch later
  icon: watchIcon
  trailingLabel: More watch options
  items:
    - { id: queue, text: Add to queue }
    - { id: playlist, text: Save to playlist }
  on click: watchLater()
```

A chosen item emits `select`: the factory's payload has the `item`, the web component's detail
its `value`, the item's `id`.

## Examples

### Variant and size

`variant` is `filled`, `tonal`, `outlined` or `elevated`, shared by both halves, and `size` runs
from `xs` to `xl` like the button's. Opening the menu changes a state layer and the shape,
never the color.

```example
split-button:
  text: Save
  variant: tonal
  size: m
  items:
    - { id: save-as, text: Save as… }
    - { id: save-copy, text: Save a copy }
```

`setText()` and `setIcon()` change the leading button. Without `items`, the factory only
reports that the trailing button was activated, with `expand`, `collapse` and `change`, and the
app opens whatever it likes. `layer: 'top'` shows the menu in the browser's top layer.

## API

<!-- API: generated from mtrl's types and <m-split-button>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

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
| `layer` | `'top'` | `undefined` | Renders the menu beside the trailing button and shows it in the top layer |
| `onClick` | `(event: SplitButtonEvent) => void` | `undefined` | What the leading button does |
| `onSelect` | `(event: SplitButtonEvent) => void` | `undefined` | Called with the chosen item |
| `on` | `{ [event]: handler }` | `undefined` | Handlers for any of the events |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(text)` / `getText()` | `text: string` | `SplitButtonComponent` / `string` | The leading button's label |
| `setIcon(icon)` | `icon: string` | `SplitButtonComponent` | The leading button's icon |
| `expand()` / `collapse()` | none | `SplitButtonComponent` | Opens or closes what the trailing button opens |
| `isExpanded()` | none | `boolean` | Whether it is open |
| `enable()` / `disable()` | none | `SplitButtonComponent` | Both halves together |
| `isDisabled()` | none | `boolean` | Whether the pair is disabled |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `SplitButtonComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Takes it off the page and releases the menu |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The group holding both halves |
| `leadingElement` | `HTMLButtonElement` | The leading button |
| `trailingElement` | `HTMLButtonElement` | The trailing button |
| `menu` | `MenuComponent` | The menu, when the component was given items |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | The leading button was activated | `{ splitButton, expanded, originalEvent }` |
| `expand` / `collapse` | The trailing button opened or closed its choices | `{ splitButton, expanded, originalEvent }` |
| `change` | Either of the two, with the new state | `{ splitButton, expanded, originalEvent }` |
| `select` | A menu item was chosen | `{ splitButton, expanded, originalEvent, item }` |

The web component's `select` carries `{ value }`; its `click` is the leading button's.

## Accessibility

- The two halves are a `group`, named by `groupLabel`; the leading button is named by its label
  or `ariaLabel`.
- The trailing button has `aria-haspopup` and `aria-expanded`. Its label should say how its
  choices relate to the action: "More watch options" beside "Watch later".
- `Tab` moves from the leading button to the trailing one; `Space` and `Enter` activate the
  focused half.
- At `xs` and `s`, each half still offers a 48dp target. The component mirrors in right-to-left
  layouts.

## Styling

Colors come from the button. Filled and tonal halves stay flat on hover, as in a connected
button group, so the pair reads as one control; an elevated split button keeps its elevation.

```css
.mtrl-split-button { }
.mtrl-split-button--filled, .mtrl-split-button--xl, .mtrl-split-button--expanded { }
.mtrl-split-button__leading, .mtrl-split-button__trailing, .mtrl-split-button__chevron { }

.toolbar .mtrl-split-button {
  --mtrl-split-button-inner-shape: 8px;          /* where the halves meet */
  --mtrl-split-button-inner-shape-active: 12px;  /* the same, hovered or pressed */
}
```

## Measurements

From the M3 split button tokens, in dp.

| Size | Height | Leading padding | Trailing padding | Chevron | Inner corner | Inner corner, active |
|------|--------|-----------------|------------------|---------|--------------|----------------------|
| `xs` | 32 | 12 / 10 | 13 | 22 | 4 | 8 |
| `s` | 40 | 16 / 12 | 13 | 22 | 4 | 12 |
| `m` | 56 | 24 / 24 | 15 | 26 | 8 | 12 |
| `l` | 96 | 48 / 48 | 29 | 38 | 12 | 20 |
| `xl` | 136 | 64 / 64 | 43 | 50 | 16 | 20 |

The halves are 2dp apart, the outer corners are a full pill, and the leading button is at least
48dp wide. The resting inner corner departs from the tokens at `m`, `l` and `xl` (4, 8 and
12dp), which read as square beside a full pill; set `--mtrl-split-button-inner-shape` to go
back to them. While the menu is closed, the chevron sits 1 to 6dp off center, so it looks
centered between two differently shaped ends; open, it centers and turns 180 degrees.
