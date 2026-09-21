# Chips Component

Chips are compact elements that stand for one discrete thing: a filter, a selection, an attribute, or a piece of text the user typed. Reach for a chip when the thing it represents can be turned on and off, or removed, on its own. The module exports two factories: `createChip` builds a single chip, and `createChips` builds a set that manages selection, layout and keyboard navigation across the chips inside it. Use the set whenever the chips belong together; a lone chip is for the cases where nothing needs to be coordinated.

## Import

```javascript
import { createChip, createChips } from 'mtrl';
```

## Basic Usage

A single chip:

```javascript
const chip = createChip({
  text: 'JavaScript',
  variant: 'filled',
  value: 'js'
});

document.querySelector('.container').appendChild(chip.element);
```

A set, which owns the selection:

```javascript
const filters = createChips({
  multiSelect: true,
  label: 'Categories',
  chips: [
    { text: 'JavaScript', variant: 'filter', value: 'js' },
    { text: 'TypeScript', variant: 'filter', value: 'ts' },
    { text: 'CSS', variant: 'filter', value: 'css' }
  ],
  onChange: (selectedValues) => applyFilters(selectedValues)
});

document.querySelector('.filters').appendChild(filters.element);
```

Chips given to `createChips` are `ChipConfig` objects, not chip instances. The set creates them and keeps the references.

## Configuration

The two components take different options. A chip's options describe one chip; the set's options describe the group and the chips it should build.

### Chip options

Passed to `createChip`, and to `addChip()` or the `chips` array of a set.

A chip built by a set is put under the set's control: the set installs its own
click handler and the chip's does not run. The `onSelect` and `onChange`
callbacks below are therefore **accepted but never called** for a chip inside a
set — listen to the set's `change` event, or pass the set an `onChange`, instead.
`onTrailingIconClick` is unaffected and works either way.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'filled' \| 'outlined' \| 'elevated' \| 'assist' \| 'filter' \| 'input' \| 'suggestion'` | `'filled'` | Visual style |
| `text` | `string` | `undefined` | The chip's label |
| `icon` | `string` | `undefined` | Leading icon as an HTML string; alias for `leadingIcon` |
| `leadingIcon` | `string` | `undefined` | Leading icon as an HTML string |
| `trailingIcon` | `string` | `undefined` | Trailing icon as an HTML string, usually a remove affordance |
| `value` | `string` | `undefined` | Identifies the chip to the set; derived from the text if omitted |
| `selected` | `boolean` | `false` | Whether the chip starts selected |
| `selectable` | `boolean` | `false` | Makes any variant selectable, not only `filter` |
| `disabled` | `boolean` | `false` | Whether the chip starts disabled |
| `ripple` | `boolean` | `true` | Whether to run the ripple effect on press |
| `rippleConfig` | `{ duration?, timing?, opacity? }` | `undefined` | Overrides for the ripple's duration, easing and start/end opacity |
| `class` | `string` | `undefined` | Additional CSS classes |
| `onSelect` | `(chip) => void` | `undefined` | Standalone chips only: called on every click, whether it selected or deselected the chip |
| `onChange` | `(selected, chip) => void` | `null` | Standalone chips only: called when the selected state changes, either way |
| `onTrailingIconClick` | `(chip) => void` | `undefined` | Called when the trailing icon is clicked |

### Chips options

Passed to `createChips`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chips` | `ChipConfig[]` | `[]` | The chips to build and manage |
| `multiSelect` | `boolean` | `false` | Whether more than one chip can be selected at a time |
| `label` | `string` | `undefined` | Label rendered beside the set |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Which side the label sits on |
| `scrollable` | `boolean` | `false` | Whether the set scrolls horizontally instead of wrapping |
| `vertical` | `boolean` | `false` | Whether the chips stack vertically |
| `class` | `string` | `undefined` | Additional CSS classes |
| `onChange` | `(selectedValues, changedValue) => void` | `null` | Called with every selected value and the one that just changed |
| `on` | `{ [event]: Function }` | `undefined` | Event handlers registered at creation, equivalent to calling `on()` |

## Component API

### Chip

| Method | Returns | Description |
|--------|---------|-------------|
| `setText(content)` | `ChipComponent` | Sets the label |
| `getText()` | `string` | The label |
| `setIcon(icon)` | `ChipComponent` | Sets the leading icon; alias for `setLeadingIcon` |
| `getIcon()` | `string` | The leading icon's HTML |
| `setLeadingIcon(icon)` | `ChipComponent` | Sets the leading icon |
| `setTrailingIcon(icon, onClick?)` | `ChipComponent` | Sets the trailing icon and, optionally, what clicking it does |
| `setValue(value)` | `ChipComponent` | Sets the value |
| `getValue()` | `string \| null` | The value |
| `setSelected(selected)` | `ChipComponent` | Sets the selected state |
| `isSelected()` | `boolean` | Whether it is selected |
| `toggleSelected()` | `ChipComponent` | Flips the selected state |
| `setVariant(variant)` | `ChipComponent` | Swaps the variant |
| `getVariant()` | `ChipVariant \| null` | The current variant |
| `enable()` / `disable()` | `ChipComponent` | Enables or disables the chip |
| `isDisabled()` | `boolean` | Whether it is disabled |
| `addClass(...classes)` | `ChipComponent` | Adds CSS classes |
| `on(event, handler)` / `off(event, handler)` | `ChipComponent` | Event listeners |
| `destroy()` | `void` | Takes it off the page and releases its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The chip's DOM element |

### Chips

| Method | Returns | Description |
|--------|---------|-------------|
| `addChip(chipConfig)` | `ChipsComponent` | Builds a chip from a config and appends it |
| `removeChip(chipOrIndex)` | `ChipsComponent` | Removes a chip, by instance or index |
| `getChips()` | `ChipComponent[]` | Every chip in the set |
| `getSelectedChips()` | `ChipComponent[]` | The selected chips |
| `getSelectedValues()` | `(string \| null)[]` | The selected chips' values, always an array |
| `selectByValue(values, triggerEvent?)` | `ChipsComponent` | Selects by value. `triggerEvent` is accepted but not applied: the set always fires `change` when the selection actually changed |
| `clearSelection()` | `ChipsComponent` | Deselects everything |
| `getValue()` | `string \| null \| string[]` | Form-field view of the selection: a single value in single-select, an array in multi-select |
| `setValue(values)` | `ChipsComponent` | Replaces the selection with the given value or values. It clears first and then selects, so it can fire `change` twice |
| `setScrollable(isScrollable)` | `ChipsComponent` | Turns horizontal scrolling on or off |
| `setVertical(isVertical)` | `ChipsComponent` | Turns the vertical layout on or off |
| `setLabel(text)` | `ChipsComponent` | Sets the label |
| `getLabel()` | `string` | The label |
| `setLabelPosition(position)` | `ChipsComponent` | Moves the label to `'start'` or `'end'` |
| `getLabelPosition()` | `string` | Where the label sits |
| `scrollToChip(chipOrIndex)` | `ChipsComponent` | Scrolls a chip into view |
| `enableKeyboardNavigation()` | `ChipsComponent` | Re-attaches arrow-key navigation, which is already on by default |
| `on(event, handler)` / `off(event, handler)` | `ChipsComponent` | Event listeners |
| `destroy()` | `void` | Destroys the set and every chip in it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The set's DOM element |

`getValue()` and `setValue()` exist so a set can stand in for a form field. The shape of `getValue()` follows `multiSelect`: a `string` or `null` when it is false, an array when it is true. `getSelectedValues()` always returns an array, whichever mode the set is in.

Neither `selectByValue()` nor `setValue()` can currently select quietly. The
`triggerEvent` argument is dropped before it reaches the set's controller, so
every programmatic selection that changes something emits `change`. If you are
rehydrating saved state, register your `change` handler after restoring it, or
guard the handler with a flag of your own. The `onChange` **config** callback is
a separate path and is only called by user interaction, so it does not fire here.

## Events

The set emits its own events. Listen with `on()`, or register handlers up front through the `on` config option.

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `(selectedValues, changedValue)` | The selection changed; `changedValue` is `null` when several changed at once |
| `add` | `(chip)` | A chip was added |
| `remove` | `(chip)` | A chip was removed |

A single chip does not emit selection events of its own. `chip.on()` listens to the DOM events the chip forwards — `click`, `focus`, `blur` and `keydown` — and selection is reported through the `onChange`, `onSelect` and `onTrailingIconClick` callbacks instead.

## Examples

### Filter chips

Filter chips are the selectable variant, and the set decides how many can be on at once. A selected filter chip grows a checkmark.

```javascript
const filters = createChips({
  multiSelect: true,
  scrollable: true,
  label: 'Filter by:',
  chips: [
    { text: 'Completed', variant: 'filter', value: 'completed' },
    { text: 'In progress', variant: 'filter', value: 'in-progress' },
    { text: 'Pending', variant: 'filter', value: 'pending' }
  ],
  onChange: (selectedValues) => updateTaskList(selectedValues)
});

// Restore a saved selection. The set's `onChange` config callback is only
// called by user interaction, so it stays quiet here — but a handler added
// with `on('change', ...)` will still be called, whatever the second argument.
filters.selectByValue(['completed', 'in-progress'], false);
```

### Input chips the user can remove

Input chips represent something the user entered, so each one carries a trailing icon that takes it away.

```javascript
const recipients = createChips({ label: 'Recipients:' });
const removeIcon = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();

  const email = input.value.trim();
  if (!isValidEmail(email)) return;

  recipients.addChip({
    text: email,
    variant: 'input',
    value: email,
    trailingIcon: removeIcon,
    onTrailingIconClick: (chip) => recipients.removeChip(chip)
  });
  input.value = '';
});
```

### A set as a form field

```javascript
const role = createChips({
  label: 'User role:',
  chips: [
    { text: 'Admin', variant: 'filter', value: 'admin' },
    { text: 'Editor', variant: 'filter', value: 'editor' },
    { text: 'Viewer', variant: 'filter', value: 'viewer' }
  ]
});

role.setValue('editor');
role.getValue(); // 'editor', because the set is single-select
```

## Accessibility

- The set is a `group` with `aria-multiselectable` reflecting `multiSelect`
- Each chip is a `role="button"` in the tab order, and carries `aria-selected` once selection is in play and `aria-disabled` when disabled
- Space and Enter activate the focused chip
- Inside a set, the arrow keys move between chips: left and right when the set is horizontal, up and down when `vertical` is true. This is wired up automatically; `enableKeyboardNavigation()` is only there to restore it
- `disable()` takes a chip out of the tab order with `tabindex="-1"`. A chip created with `disabled: true` is only marked `aria-disabled` and keeps `tabindex="0"`, so it stays focusable; call `disable()` after creating it if that matters
- Give a trailing icon's chip a label that says what removing it does, since the icon itself has no text

## Styling

```css
/* One chip */
.mtrl-chip { /* ... */ }
.mtrl-chip--filled { /* ... */ }      /* and --outlined, --elevated, --assist,
                                         --filter, --input, --suggestion */
.mtrl-chip--selected { /* ... */ }
.mtrl-chip--disabled { /* ... */ }
.mtrl-chip--active { /* ... */ }      /* while the chip holds a surface open */

.mtrl-chip-content { /* ... */ }
.mtrl-chip-text { /* ... */ }
.mtrl-chip-leading-icon { /* ... */ }
.mtrl-chip-trailing-icon { /* ... */ }

/* The set */
.mtrl-chips { /* ... */ }
.mtrl-chips--scrollable { /* ... */ }
.mtrl-chips--vertical { /* ... */ }
.mtrl-chips--with-label { /* ... */ }
.mtrl-chips--label-end { /* ... */ }
.mtrl-chips-container { /* ... */ }
.mtrl-chips-label { /* ... */ }
```

A selected filter chip draws its checkmark with a masked pseudo-element whose colour comes from a `--checkmark-color` custom property, defaulting to the text colour. Override it to tint the checkmark on its own:

```css
.mtrl-chip--filter.mtrl-chip--selected {
  --checkmark-color: var(--my-accent);
}
```

Colours otherwise come from the theme's `secondary-container` and `surface-container` roles, so a chip follows whatever the theme says.

## Measurements

The chip's dimensions live in the `$chip-config` map in `src/styles/abstract/_variables.scss`, which says the values follow Material 3 but names no token for any of them. The source of each is given below so it can be checked; none is quoted as a token it does not cite.

| Attribute | Value | Source |
|-----------|-------|--------|
| Height | 32px | `$chip-config: height` |
| Corner radius | 8px | `$chip-config: border-radius` |
| Horizontal padding | 12px | `$chip-config: padding-horizontal` |
| Icon size | 18px | `$chip-config: icon-size` |
| Suggestion chip height | 48px | `$chip-config: suggestion-height` |
| Suggestion chip icon size | 24px | `$chip-config: suggestion-icon-size` |

The outlined variant's border sits at 12% of the outline colour at rest and 38% on focus, and goes transparent once the chip is selected, where the filled background takes over.

## Best Practices

- Give every chip a `value`. Without one the set derives it from the text, which breaks the moment the label is translated or edited
- Use `filter` for chips that select, `input` for chips the user typed, `assist` and `suggestion` for chips that act
- Put a trailing icon only on chips the user is allowed to remove; a leading icon is for identity, not for actions
- Prefer `scrollable` to `vertical` for a long row of filters, and set `vertical` only when the chips sit in a sidebar
- Attach `on('change', ...)` after restoring a saved selection rather than before it. The second argument to `selectByValue()` does not suppress the event, so a handler already registered will see rehydration as a change
