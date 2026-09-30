# Chips

Chips are compact elements that stand for one discrete thing. M3 has four types: **assist**
chips for a smart or automated action, **filter** chips to narrow content, **input** chips for
something the user entered, such as a recipient, and **suggestion** chips for a generated
suggestion, such as a reply. See the
[M3 chips guidelines](https://m3.material.io/components/chips/overview).

`createChips` builds a set, which owns the selection, removal and keyboard navigation of its
chips; `createAssistChip`, `createFilterChip`, `createInputChip` and `createSuggestionChip`
build one chip on its own.

## Usage

A set is multi-select unless `multiSelect` is `false`. Its `chips` are configurations, which the
set builds; without a `type`, a chip in a set is a filter chip.

```example
chips:
  label: Categories
  chips:
    - { type: filter, label: JavaScript, value: js }
    - { type: filter, label: TypeScript, value: ts }
    - { type: filter, label: CSS, value: css }
```

`change` reports the selection: the factory calls its handlers with the selected values and the
value that changed, the web component's detail has `value`, an array in a multi-select set and
a string or `null` in a single-select one.

## Examples

### Single selection

`selectionRequired` keeps the last selected chip selected, in either mode.

```example
chips:
  label: Size
  multiSelect: false
  selectionRequired: true
  chips:
    - { type: filter, label: S, value: s }
    - { type: filter, label: M, value: m, selected: true }
    - { type: filter, label: L, value: l }
```

### Input chips

Every input chip has a remove button, and `Backspace` or `Delete` removes it when focused. In a
set, the set removes it and emits `remove` with the chip; on its own, it leaves the page.
`avatar` puts a 24dp round image in place of the leading icon.

```example
chips:
  label: To
  chips:
    - { type: input, label: Ada Lovelace, value: ada@example.com }
    - { type: input, label: Alan Turing, value: alan@example.com }
```

### Assist chips

`elevated` gives assist, filter and suggestion chips the elevated style in place of the
outline.

```example
chips:
  label: Actions
  chips:
    - { type: assist, label: Add to calendar, value: calendar, leadingIcon: calendarIcon, elevated: true }
    - { type: assist, label: Directions, value: directions, leadingIcon: locationIcon, elevated: true }
```

A filter chip's `trailingMenu` gives it a trailing button that opens a menu; `onTrailingClick`
handles it. A filter chip opening a price menu is planned for [Examples](/examples/). A chip
your app makes `draggable` shows M3's dragged state from `dragstart` to `dragend`; mtrl does
not move chips itself.

## API

<!-- API: generated from mtrl's types and <m-chips>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

#### A chip

Passed to the four factories, and in a set's `chips` or `addChip()`, with `type`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'assist' \| 'filter' \| 'input' \| 'suggestion'` | `'filter'` | In a set's `chips` or `addChip()`; the factories set it |
| `label` | `string` | `''` | The chip's label |
| `value` | `string` | derived from the label | Identifies the chip to its set and to forms |
| `leadingIcon` | `string` | `undefined` | Leading icon as SVG markup (`icon` is an alias) |
| `trailingIcon` | `string` | `undefined` | Trailing icon as SVG markup; not on suggestion chips. On an input chip it replaces the remove icon |
| `avatar` | `string` | `undefined` | Input chips: a 24dp round avatar (markup), in place of the leading icon |
| `elevated` | `boolean` | `false` | Assist, filter and suggestion chips: the elevated style |
| `selected` | `boolean` | `false` | Filter and input chips: whether the chip starts selected |
| `disabled` | `boolean` | `false` | Whether the chip starts disabled |
| `removeLabel` | `string` | `'Remove {label}'` | Input chips: the remove button's accessible name |
| `onRemove` | `(chip) => void` | `undefined` | Input chips: called when the chip is removed |
| `onTrailingClick` | `(chip) => void` | `undefined` | Filter chips: gives the trailing icon its own button |
| `trailingMenu` | `boolean` | `false` | Filter chips: the trailing button opens a menu (`aria-haspopup`, a drop-down arrow) |
| `trailingLabel` | `string` | `'{label} options'` or `'Remove {label}'` | Filter chips: the trailing button's accessible name |
| `onClick` | `(chip) => void` | `undefined` | Called when the chip is activated |
| `onChange` | `(selected, chip) => void` | `undefined` | Filter and input chips: called when a click changes the selected state |
| `onSelect` | `(chip) => void` | `undefined` | Filter and input chips: called with the chip after `onChange` |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

#### A set

Passed to `createChips`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chips` | `ChipConfig[]` | `[]` | The chips to build and manage |
| `multiSelect` | `boolean` | `true` | Whether several chips can be selected at once |
| `selectionRequired` | `boolean` | `false` | Whether the last selected chip is kept selected |
| `label` | `string` | `undefined` | A visible label that names the set |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Which side the label sits on |
| `scrollable` | `boolean` | `false` | Whether the set scrolls horizontally instead of wrapping |
| `vertical` | `boolean` | `false` | Whether the chips stack vertically |
| `onChange` | `(selectedValues, changedValue) => void` | `undefined` | Called with every selected value and the one that changed |
| `on` | `{ change?, add?, remove? }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

#### A chip

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` / `getLabel()` | `text: string` | `ChipComponent` / `string` | The label (`setText` / `getText` are aliases) |
| `setLeadingIcon(icon)` / `getIcon()` | `icon: string` | `ChipComponent` / `string` | The leading icon (`setIcon` is an alias) |
| `setTrailingIcon(icon)` | `icon: string` | `ChipComponent` | The trailing icon, or an input chip's remove icon |
| `setSelected(selected)` / `toggleSelected()` / `isSelected()` | `selected: boolean` | `ChipComponent` / `boolean` | Selection, for filter and input chips |
| `setValue(value)` / `getValue()` | `value: string` | `ChipComponent` / `string \| null` | The chip's value |
| `enable()` / `disable()` / `isDisabled()` | none | `ChipComponent` / `boolean` | The disabled state |
| `getType()` | none | `ChipType` | The chip's type |
| `focus()` | none | `ChipComponent` | Focuses the chip's action |
| `addClass(...classes)` | `...classes: string[]` | `ChipComponent` | Adds classes to the chip |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `ChipComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes listeners and the element |

`chip.action` is the chip's native button. An input chip's remove button and a filter chip's
trailing button (`chip.trailingAction`) are its siblings, never inside it.

#### A set

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addChip(config)` / `removeChip(chipOrIndex)` | `config: ChipConfig` / `chipOrIndex: ChipComponent \| number` | `ChipsComponent` | Adds or removes a chip |
| `getChips()` / `getSelectedChips()` | none | `ChipComponent[]` | The chips, or the selected ones |
| `getSelectedValues()` | none | `(string \| null)[]` | The selected values, in either mode |
| `getValue()` / `setValue(values)` | `values: string \| string[] \| null` | `string \| string[] \| null` / `ChipsComponent` | An array when multi-select, a string or `null` when single-select |
| `selectByValue(values, triggerEvent?)` / `clearSelection()` | `values: string \| string[], triggerEvent?: boolean` | `ChipsComponent` | Programmatic selection |
| `setScrollable(on)` / `setVertical(on)` | `on: boolean` | `ChipsComponent` | Layout |
| `setLabel(text)` / `getLabel()` | `text: string` | `ChipsComponent` / `string` | The set's label |
| `setLabelPosition(position)` / `getLabelPosition()` | `position: 'start' \| 'end'` | `ChipsComponent` / `string` | Which side the label sits on |
| `scrollToChip(chipOrIndex)` | `chipOrIndex: ChipComponent \| number` | `ChipsComponent` | Scrolls a scrollable set to a chip |
| `enableKeyboardNavigation()` | none | `ChipsComponent` | Enables the arrow-key navigation between chips |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `ChipsComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the set |

### Events

| Event | Description | Data |
|-------|-------------|------|
| Chip `click` | The chip was activated | `{ event, element, originalEvent }` |
| Chip `change` | A click changed the selected state | `{ selected, chip }` |
| Chip `remove` / `trailing` | Removed, or its trailing button activated | the chip |
| Chip `focus` / `blur` / `keydown` | The chip's action took or lost focus, or a key went down | `{ event, element, originalEvent }` |
| Set `change` | The selection changed | `(selectedValues, changedValue)`, `changedValue` `null` for programmatic changes |
| Set `add` / `remove` | A chip was added, or is about to be removed | the chip |

The web component's `change` carries `{ value }`, and `remove` the removed chip's `{ value }`.

## Accessibility

- A set is a `grid` named by its visible label through `aria-labelledby`, with a `row`, and a
  `gridcell` for each chip; `aria-multiselectable` tells whether several can be selected.
- The set is one `Tab` stop. The arrow keys move between chips, following the reading
  direction; `Home` and `End` go to the first and last.
- A chip with one action is its cell, which takes focus and carries `aria-selected`; `Space` and
  `Enter` activate it. A chip with two actions keeps two native buttons in its cell, and the
  arrows reach both.
- On its own, a filter or input chip is `role="checkbox"` with `aria-checked`; assist and
  suggestion chips are plain buttons.
- A removed input chip's focus moves to the chip that took its place, or the previous one.
- Chips and remove buttons have 48dp touch targets. Keyboard focus draws a 3dp focus ring, 2dp
  outside the chip.

## Styling

Colors come from the theme's roles; `--mtrl-chip-label-color`, `--mtrl-chip-leading-color`,
`--mtrl-chip-trailing-color` and `--mtrl-chip-checkmark-color` set a chip's parts.

```css
.mtrl-chip { }
.mtrl-chip--assist, .mtrl-chip--filter, .mtrl-chip--input, .mtrl-chip--suggestion { }
.mtrl-chip--elevated, .mtrl-chip--selected, .mtrl-chip--disabled, .mtrl-chip--dragged { }
.mtrl-chip--leading, .mtrl-chip--trailing, .mtrl-chip--avatar { }  /* the parts shown */
.mtrl-chip__action { }          /* the native button */
.mtrl-chip__leading-icon, .mtrl-chip__checkmark, .mtrl-chip__label, .mtrl-chip__trailing-icon { }
.mtrl-chip__remove, .mtrl-chip__trailing-action { }

.mtrl-chips { }
.mtrl-chips--scrollable, .mtrl-chips--vertical, .mtrl-chips--with-label, .mtrl-chips--label-end { }
.mtrl-chips__container, .mtrl-chips__label { }
```

## Measurements

From the m3.material.io chips specs and Compose's chip tokens.

| Attribute | Value |
|-----------|-------|
| Height | 32dp |
| Corner | 8dp |
| Outline | 1dp `outline-variant`, inside the chip; none when selected or elevated |
| Padding | 16dp without icons, 8dp beside an icon, 4dp beside an avatar |
| Icon | 18dp, 8dp from the label |
| Avatar | 24dp, round |
| Label | Label Large |
| Selected | `secondary-container` |
| Elevated | `surface-container-low` at elevation 1 |
| Touch target | 48dp |
| Motion | The checkmark and leading icon expand on the fast spatial spring and fade |
