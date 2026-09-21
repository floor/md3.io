# Button Group Component

A button group is a row (or column) of ordinary buttons that belong together: a
formatting toolbar, a set of view modes, a unit picker. The group owns the
spacing, the shared height and, for connected groups, the corner shape of each
position. The buttons keep everything else — their own colours, state layers,
ripples and shape morphs — because they are the library's own button and icon
button.

## Overview

Material 3 defines two kinds, and the choice is about how tightly the actions
belong together:

- **Standard** spaces its buttons apart (18, 12, 8, 8, 8dp by size). Each button
  reads as its own control. Use it for independent actions, or for a selection
  where the selected button should morph from round to square the way a
  standalone toggle button does.
- **Connected** puts 2dp between its buttons, rounds the outer ends and squares
  the inner corners. The row reads as one control. This is what M3 expressive
  uses in place of the [segmented button](./segmented-button.md), for both
  single- and multi-select.

Selection is a separate axis: `selection: 'none'` gives plain action buttons,
`'single'` and `'multi'` turn them into toggle buttons and add the `change`
event. A group has no colours of its own — `variant` is passed straight to every
button, so a group looks like whatever `filled`, `tonal` or `outlined` buttons
look like in your theme.

## Import

```javascript
import { createButtonGroup } from 'mtrl';
```

## Basic Usage

```javascript
const view = createButtonGroup({
  kind: 'connected',
  selection: 'single',
  required: true,
  variant: 'tonal',
  ariaLabel: 'Period',
  buttons: [
    { text: 'Day', value: 'day', selected: true },
    { text: 'Week', value: 'week' },
    { text: 'Month', value: 'month' }
  ]
});

view.on('change', ({ values }) => load(values[0]));
document.querySelector('.toolbar').appendChild(view.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buttons` | `ButtonGroupItemConfig[]` | `[]` | The buttons, in order |
| `kind` | `'standard' \| 'connected'` | `'standard'` | Spaced buttons, or one joined control |
| `selection` | `'none' \| 'single' \| 'multi'` | `'none'` | Plain actions, or toggle buttons |
| `required` | `boolean` | `false` | With a selection, the last selected button cannot be deselected |
| `shape` | `'round' \| 'square'` | `'round'` | Corner style of the outer ends |
| `size` | `'xs' \| 's' \| 'm' \| 'l' \| 'xl'` | `'s'` | Material size token, shared by every button |
| `labels` | `'always' \| 'selected'` | `'always'` | `'selected'` keeps buttons icon-only until selected |
| `expandedRatio` | `number` | `0.15` | Standard groups: share of its width a pressed button gains. `0` disables the motion |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'elevated' \| 'text'` | `'outlined'` | Applied to every button |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Row or column |
| `density` | `'default' \| 'comfortable' \| 'compact'` | `'default'` | Lowers the container height by 4dp per step |
| `disabled` | `boolean` | `false` | Disables the whole group |
| `equalWidth` | `boolean` | `false` | Gives every button the same width |
| `ripple` | `boolean` | `true` | Ripple on the buttons |
| `rippleConfig` | `{ duration, timing, opacity }` | — | Ripple tuning, passed to each button |
| `ariaLabel` | `string` | `'Button group'` | Accessible name of the group |
| `class` | `string` | — | Extra classes on the container |
| `on` | `{ click, focus, blur, change }` | — | **Accepted but not applied.** Nothing reads it; register handlers with `.on()` after creation |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'button-group'` | Name used in class generation |

### Each button

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | — | Label. A button with an icon and no text is created as an icon button |
| `icon` | `string` | — | Icon as an HTML string |
| `selectedIcon` | `string` | — | Icon shown while selected, on icon-only buttons |
| `value` | `string` | — | Identifies the button in the selection API and the `change` event |
| `id` | `string` | — | Alternative identifier; falls back to the index |
| `selected` | `boolean` | `false` | Initially selected, in a selection group |
| `disabled` | `boolean` | `false` | Disables this button only |
| `ariaLabel` | `string` | — | Needed on icon-only buttons. Nothing checks for it, so an unlabelled one ships silently unnamed |
| `class` | `string` | — | Extra classes on this button |

## Component API

### Selection

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSelected()` | — | `string[]` | Values of the selected buttons, in button order |
| `isSelected(value)` | `value: string` | `boolean` | Whether that button is selected |
| `select(value)` | `value: string` | `ButtonGroupComponent` | Selects it, deselecting the others in a single-select group |
| `deselect(value)` | `value: string` | `ButtonGroupComponent` | Deselects it, unless `required` would leave nothing selected |
| `toggle(value)` | `value: string` | `ButtonGroupComponent` | Flips it |
| `getSelection()` | — | `ButtonGroupSelection` | The configured selection mode |
| `getKind()` | — | `ButtonGroupKind` | `'standard'` or `'connected'` |

All three mutating calls emit `change` when they actually change something, with
no `originalEvent`.

### Buttons and appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getButton(index)` | `index: number` | `ButtonComponent \| undefined` | The button at that position |
| `getButtonById(id)` | `id: string` | `ButtonComponent \| undefined` | Matched against the button's `id` or its `value` |
| `getVariant()` | — | `ButtonGroupVariant` | Current variant |
| `setVariant(variant)` | `variant: ButtonGroupVariant` | `ButtonGroupComponent` | Restyles every button |
| `getOrientation()` | — | `ButtonGroupOrientation` | Current orientation |
| `setOrientation(orientation)` | `orientation: ButtonGroupOrientation` | `ButtonGroupComponent` | Row or column |
| `getDensity()` | — | `ButtonGroupDensity` | Current density |
| `setDensity(density)` | `density: ButtonGroupDensity` | `ButtonGroupComponent` | Recomputes the height and spacing |

### State and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | — | `ButtonGroupComponent` | Enables every button that was not individually disabled |
| `disable()` | — | `ButtonGroupComponent` | Disables all of them |
| `enableButton(index)` | `index: number` | `ButtonGroupComponent` | One button, by position |
| `disableButton(index)` | `index: number` | `ButtonGroupComponent` | One button, by position |
| `on(event, handler)` | `event: string, handler: Function` | `ButtonGroupComponent` | Adds a listener |
| `off(event, handler)` | `event: string, handler: Function` | `ButtonGroupComponent` | Removes one |
| `destroy()` | — | `void` | Destroys every button and releases the container |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The `role="group"` container |
| `buttons` | `ButtonComponent[]` | The button components, in order |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `{ buttonGroup, button, index, originalEvent }` | Any enabled button was activated |
| `focus` | `{ buttonGroup, button, index, originalEvent }` | A button took focus |
| `blur` | `{ buttonGroup, button, index, originalEvent }` | A button lost focus |
| `change` | `{ buttonGroup, values, selected, button?, originalEvent? }` | The selection changed |

`click` fires before `change`, so a selection group emits both for one press.
`values` are the selected buttons' values in button order; `selected` are the
button components themselves.

## Examples

### A connected group as a view switcher

The showcase uses this shape for its unit picker: round outer ends, 8dp inner
corners at size `s`, and the selected button becoming a full pill wherever it
sits in the row.

```javascript
const size = createButtonGroup({
  kind: 'connected',
  selection: 'single',
  variant: 'tonal',
  buttons: [
    { text: '8 oz', value: '8' },
    { text: '12 oz', value: '12', selected: true },
    { text: '16 oz', value: '16' },
    { text: '20 oz', value: '20' }
  ]
});
```

### Multi-select formatting actions

```javascript
const format = createButtonGroup({
  kind: 'standard',
  selection: 'multi',
  variant: 'outlined',
  ariaLabel: 'Formatting',
  buttons: [
    { text: 'Bold', value: 'bold', selected: true },
    { text: 'Italic', value: 'italic' },
    { text: 'Underline', value: 'underline' }
  ]
});

format.on('change', ({ values }) => applyMarks(values));
```

### Labels only on the selected button

With `labels: 'selected'`, buttons that have both an icon and a text stay
icon-only until they are selected; the selected one widens to reveal its label.

```javascript
const mode = createButtonGroup({
  kind: 'connected',
  selection: 'single',
  required: true,
  labels: 'selected',
  variant: 'tonal',
  ariaLabel: 'Mode',
  buttons: [
    { icon: searchIcon, text: 'Explore', value: 'explore', selected: true },
    { icon: locationIcon, text: 'Taxi', value: 'taxi' },
    { icon: settingsIcon, text: 'Islands', value: 'islands' }
  ]
});
```

## Accessibility

- The container is a `role="group"` and carries `aria-label`, which defaults to
  `"Button group"`. Give it something meaningful.
- In a selection group every button carries `aria-pressed`, kept in step with
  the selection whether it changed by click or through `select()` /
  `deselect()` / `toggle()`.
- Icon-only buttons need `ariaLabel`, and nothing enforces it. The source has a
  `validateConfig()` that would warn about an icon with no text and no label,
  but it is never called, so a button with none of the three is created without
  an accessible name and without a word said. Check them yourself.
- Tab moves through the buttons, and Space and Enter activate the focused one —
  they are real `<button>` elements. The group adds no roving-tabindex arrow-key
  behaviour of its own.
- A `required` single-select group refuses to deselect its last selection, so
  the control can never end up saying nothing.

## Styling

```css
/* the container */
.mtrl-button-group { }
.mtrl-button-group--connected { }
.mtrl-button-group--standard { }
.mtrl-button-group--tonal { }
.mtrl-button-group--size-m { }
.mtrl-button-group--square { }
.mtrl-button-group--vertical { }
.mtrl-button-group--selectable { }
.mtrl-button-group--labels-selected { }
.mtrl-button-group--equal-width { }
.mtrl-button-group--density-compact { }
.mtrl-button-group--disabled { }

/* the buttons */
.mtrl-button-group__button { }
.mtrl-button-group__button--first { }
.mtrl-button-group__button--middle { }
.mtrl-button-group__button--last { }
.mtrl-button-group__button--single { }
.mtrl-button-group__button--selected { }
```

The component writes its measurements onto the container as custom properties.
It writes them **inline**, on the element, so a rule in your stylesheet loses to
them: retune a group by setting the property on the element itself, or by
repeating the declaration with `!important`.

```css
/* wins only with !important — the component's own values are inline */
.mtrl-button-group {
  --button-group-height: 40px;
  --button-group-icon: 20px;
  --button-group-gap: 12px;
  --button-group-inner-corner: 8px;
  --button-group-pressed-corner: 4px;
  --button-group-radius: 20px;
}
```

## Measurements

Per size, from `BUTTON_GROUP_SIZE_TOKENS` in `constants.ts`, whose comment cites
the M3 button group specs together with `ButtonGroupSmallTokens.kt` and
`ConnectedButtonGroupSmallTokens.kt` for the `s` size:

| Size | Container height | Icon | Standard gap | Connected inner corner |
|------|------------------|------|--------------|------------------------|
| xs | 32dp | 20dp | 18dp | 4dp |
| s | 40dp | 20dp | 12dp | 8dp |
| m | 56dp | 24dp | 8dp | 8dp |
| l | 96dp | 32dp | 8dp | 16dp |
| xl | 136dp | 40dp | 8dp | 20dp |

| Attribute | Value | Token |
|-----------|-------|-------|
| Connected inner corner, pressed | 4dp | `ConnectedButtonGroupSmallTokens.PressedInnerCornerCornerSize` |
| Pressed width gain, standard | 0.15 | `ButtonGroupDefaults.ExpandedRatio` |

Three more numbers name no token either. Connected groups use a 2dp gap at
every size (`BUTTON_GROUP_CONNECTED_GAP`) and each density step removes 4dp of
container height (`BUTTON_GROUP_DENSITY_STEP`); both constants are read by the
component. The 48dp minimum width on connected `xs` and `s` buttons is
hard-coded in `_button-group.scss` — `BUTTON_GROUP_CONNECTED_MIN_WIDTH` states
the same number but nothing reads it, so change the stylesheet, not the
constant. The container radius is always half the container height.

The pressed expansion only runs on horizontal standard groups, and a neighbour
never gives up more than the padding on its facing side, so labels cannot clip.
