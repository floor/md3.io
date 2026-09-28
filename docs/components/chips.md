# Chips Component

Chips are compact elements that stand for one discrete thing: an action, a filter, a piece of text the user entered, or a suggestion. Material 3 defines four types, and mtrl has a factory for each, plus `createChips` for a set that manages selection, removal and keyboard navigation across the chips inside it.

| Type | Factory | Use it for |
|------|---------|------------|
| Assist | `createAssistChip` | A smart or automated action, like adding an event to a calendar |
| Filter | `createFilterChip` | Narrowing content; selectable, with a checkmark when selected |
| Input | `createInputChip` | Something the user entered, like a recipient; selectable and always removable |
| Suggestion | `createSuggestionChip` | A dynamically generated suggestion, like a reply |

## Import

```javascript
import { createAssistChip, createFilterChip, createInputChip, createSuggestionChip, createChips } from 'mtrl';
```

## Basic Usage

A single chip:

```javascript
const chip = createAssistChip({ label: 'Add to calendar', leadingIcon: calendarIcon });
chip.on('click', () => addEvent());
document.querySelector('.actions').append(chip.element);
```

A set, which owns the selection. Sets are multi-select unless `multiSelect: false`:

```javascript
const filters = createChips({
  label: 'Categories',
  chips: [
    { type: 'filter', label: 'JavaScript', value: 'js' },
    { type: 'filter', label: 'TypeScript', value: 'ts' },
    { type: 'filter', label: 'CSS', value: 'css' }
  ],
  onChange: (selectedValues) => applyFilters(selectedValues)
});
document.querySelector('.filters').append(filters.element);
```

The `chips` array holds `ChipConfig` objects, not chip instances: the set builds the chips and keeps the references. Without a `type`, a chip in a set is a filter chip.

## Configuration

### Chip options

Passed to the four factories, and to the `chips` array or `addChip()` of a set (with `type`).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'assist' \| 'filter' \| 'input' \| 'suggestion'` | `'filter'` | In a set's `chips` or `addChip()`; the factories set it for you |
| `label` | `string` | `''` | The chip's label |
| `value` | `string` | derived from the label | Identifies the chip to its set and to forms |
| `leadingIcon` | `string` | `undefined` | Leading icon as SVG markup (`icon` is an alias) |
| `trailingIcon` | `string` | `undefined` | Trailing icon as SVG markup; not on suggestion chips. On an input chip it replaces the remove icon |
| `avatar` | `string` | `undefined` | Input chips: a 24px round avatar (markup), in place of the leading icon |
| `elevated` | `boolean` | `false` | Assist, filter and suggestion chips: the elevated style instead of the outlined one |
| `selected` | `boolean` | `false` | Filter and input chips: whether the chip starts selected |
| `disabled` | `boolean` | `false` | Whether the chip starts disabled |
| `removeLabel` | `string` | `'Remove {label}'` | Input chips: the remove button's accessible name |
| `onRemove` | `(chip) => void` | `undefined` | Input chips: called when the chip is removed |
| `onTrailingClick` | `(chip) => void` | `undefined` | Filter chips: gives the trailing icon its own button, to open a menu or remove the chip |
| `trailingMenu` | `boolean` | `false` | Filter chips: the trailing button opens a menu (`aria-haspopup`, a drop-down arrow) |
| `trailingLabel` | `string` | `'{label} options'` or `'Remove {label}'` | Filter chips: the trailing button's accessible name |
| `onClick` | `(chip) => void` | `undefined` | Called when the chip is activated |
| `onChange` | `(selected, chip) => void` | `undefined` | Filter and input chips: called when the selected state changes |
| `ripple` | `boolean` | `true` | Whether to run the ripple on press |
| `class` | `string` | `undefined` | Additional CSS classes |

Every input chip is removable: it has a remove button, and Backspace or Delete removes it when focused. On its own, a removed chip leaves the page; in a set, the set removes it and emits `remove`. `onRemove` is called either way.

### Chips options

Passed to `createChips`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chips` | `ChipConfig[]` | `[]` | The chips to build and manage |
| `multiSelect` | `boolean` | `true` | Whether several chips can be selected at once; `false` for single-select |
| `selectionRequired` | `boolean` | `false` | Whether the last selected chip is kept selected, in either mode |
| `label` | `string` | `undefined` | A visible label that names the set |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Which side the label sits on |
| `scrollable` | `boolean` | `false` | Whether the set scrolls horizontally instead of wrapping |
| `vertical` | `boolean` | `false` | Whether the chips stack vertically |
| `onChange` | `(selectedValues, changedValue) => void` | `undefined` | Called with every selected value and the one that just changed |
| `on` | `{ [event]: Function }` | `undefined` | Event handlers registered at creation, as with `on()` |
| `class` | `string` | `undefined` | Additional CSS classes |

## Component API

### Chip

| Method | Returns | Description |
|--------|---------|-------------|
| `setLabel(text)` / `getLabel()` | `ChipComponent` / `string` | The label (`setText` / `getText` are aliases) |
| `setLeadingIcon(icon)` / `getIcon()` | `ChipComponent` / `string` | The leading icon (`setIcon` is an alias) |
| `setTrailingIcon(icon)` | `ChipComponent` | The trailing icon, or an input chip's remove icon |
| `setSelected(selected)` / `toggleSelected()` / `isSelected()` | `ChipComponent` / `boolean` | Selection, for filter and input chips |
| `setValue(value)` / `getValue()` | `ChipComponent` / `string \| null` | The chip's value |
| `enable()` / `disable()` / `isDisabled()` | `ChipComponent` / `boolean` | Disabled state |
| `getType()` | `ChipType` | The chip's type |
| `focus()` | `ChipComponent` | Focuses the chip's action |
| `on(event, handler)` / `off(event, handler)` | `ChipComponent` | Events: `click`, `change`, `remove`, `trailing`, `focus`, `blur`, `keydown` |
| `destroy()` | `void` | Removes listeners and the element |

`chip.action` is the chip's native button. An input chip's remove button and a filter chip's trailing button (`chip.trailingAction`) are its siblings, never nested inside it.

A chip your app makes `draggable` shows Material's dragged state (elevation 4, a stronger state layer) from `dragstart` to `dragend`; mtrl does not move chips itself.

### Chips

| Method | Returns | Description |
|--------|---------|-------------|
| `addChip(config)` / `removeChip(chipOrIndex)` | `ChipsComponent` | Adds or removes a chip |
| `getChips()` / `getSelectedChips()` | `ChipComponent[]` | The chips, or the selected ones |
| `getSelectedValues()` | `(string \| null)[]` | The selected values, in either mode |
| `getValue()` / `setValue(values)` | `string \| string[] \| null` / `ChipsComponent` | Form-style value: an array when multi-select, a string or `null` when single-select |
| `selectByValue(values, triggerEvent?)` / `clearSelection()` | `ChipsComponent` | Programmatic selection |
| `setScrollable(on)` / `setVertical(on)` | `ChipsComponent` | Layout |
| `setLabel(text)` / `setLabelPosition(position)` | `ChipsComponent` | The set's label |
| `scrollToChip(chipOrIndex)` | `ChipsComponent` | Scrolls a scrollable set to a chip |
| `on(event, handler)` / `off(event, handler)` | `ChipsComponent` | Events: `change`, `add`, `remove` |
| `destroy()` | `void` | Removes the set |

## Examples

### Filter chips, single-select

```javascript
const size = createChips({
  multiSelect: false,
  selectionRequired: true,
  label: 'Size',
  chips: ['S', 'M', 'L'].map(label => ({ type: 'filter', label, value: label.toLowerCase() }))
});
size.setValue('m');
size.getValue(); // 'm'
```

### Input chips the user can remove

```javascript
const recipients = createChips({
  label: 'To',
  chips: people.map(person => ({ type: 'input', label: person.name, value: person.email, avatar: person.avatar }))
});
recipients.on('remove', chip => unsend(chip.getValue()));
```

### A filter chip that opens a menu

```javascript
const price = createFilterChip({
  label: 'Price',
  trailingMenu: true,
  onTrailingClick: (chip) => {
    chip.trailingAction.setAttribute('aria-expanded', 'true');
    priceMenu.open();
  }
});

// Anchored to the chip; opened by the chip's trailing button, not by a click on the opener
const priceMenu = createMenu({ opener: price.element, manualOpen: true, items: priceRanges });
priceMenu.on('close', () => price.trailingAction.setAttribute('aria-expanded', 'false'));
```

On compact screens, the guidelines ask for the whole chip to open the menu: call the same handler from `onClick` there.

### Elevated assist chips

```javascript
const actions = ['Directions', 'Call', 'Share'].map(label => createAssistChip({ label, elevated: true }));
```

## Accessibility

- A set follows the web roles of the m3.material.io chips accessibility page: a `grid` named by its visible label through `aria-labelledby`, a `row`, and a `gridcell` for each chip. `aria-multiselectable` tells whether several chips can be selected.
- The set is one Tab stop. The arrow keys move between chips (left and right, or up and down when `vertical`), following the reading direction in right-to-left layouts; Home and End go to the first and last chip.
- A chip with one action is its cell: the cell takes focus and carries `aria-selected`, and Space or Enter activates it. A chip with two actions, an input chip with its remove button or a filter chip with its trailing button, keeps two native buttons inside its cell, and the arrows reach both.
- A chip on its own keeps its native button: filter and input chips are `role="checkbox"` with `aria-checked`, assist and suggestion chips are plain buttons.
- Backspace or Delete removes a focused input chip, and focus moves to the chip that took its place, or the previous one when it was the last.
- An input chip's remove button is named "Remove {label}", or `removeLabel`.
- Chips and remove buttons have 48px touch targets. Keyboard focus draws Material's 3px focus ring, 2px outside the chip, and the focus layer shows for keyboard focus only.
- The ripple is the press: it draws the pressed layer (0.10), as in Compose.

## Styling

```css
.mtrl-chip { }                  /* one chip */
.mtrl-chip--assist, .mtrl-chip--filter, .mtrl-chip--input, .mtrl-chip--suggestion { }
.mtrl-chip--elevated { }
.mtrl-chip--selected, .mtrl-chip--disabled { }
.mtrl-chip--leading, .mtrl-chip--trailing, .mtrl-chip--avatar { }  /* which parts are shown */
.mtrl-chip__action { }          /* the native button */
.mtrl-chip__leading-icon, .mtrl-chip__checkmark, .mtrl-chip__label, .mtrl-chip__trailing-icon { }
.mtrl-chip__remove { }          /* an input chip's remove button */
.mtrl-chip__trailing-action { } /* a filter chip's trailing button */
.mtrl-chip--dragged { }         /* while an app drags the chip */

.mtrl-chips { }                 /* the set */
.mtrl-chips--scrollable, .mtrl-chips--vertical, .mtrl-chips--with-label, .mtrl-chips--label-end { }
.mtrl-chips__container, .mtrl-chips__label { }
```

Colours come from the theme's roles, and a chip exposes custom properties for its parts: `--mtrl-chip-label-color`, `--mtrl-chip-leading-color`, `--mtrl-chip-trailing-color` and `--mtrl-chip-checkmark-color`.

## Measurements

Following the m3.material.io chips specs and Compose's chip tokens:

| Attribute | Value |
|-----------|-------|
| Height | 32px |
| Corner | 8px |
| Outline | 1px `outline-variant`, drawn inside the chip; none when selected or elevated |
| Padding | 16px without icons, 8px beside an icon, 4px beside an avatar |
| Icon | 18px, 8px from the label |
| Avatar | 24px, round |
| Label | Label Large |
| Selected | `secondary-container` |
| Elevated | `surface-container-low` at elevation 1 |
| Touch target | 48px |
| Motion | the checkmark and leading icon expand on the fast spatial spring and fade |
