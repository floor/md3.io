# Checkbox Component

Checkboxes let users select one or more items from a list, or turn a single item on or off in a form that is saved later. A checkbox can be selected, unselected or indeterminate (a parent whose children are partly selected), each of them also in error.

## Import

```javascript
import { createCheckbox } from 'mtrl';
```

## Basic Usage

```javascript
const terms = createCheckbox({ label: 'I accept the terms', name: 'terms' });
terms.on('change', ({ checked }) => submit.disabled = !checked);
document.querySelector('form').append(terms.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `undefined` | The label, which names the checkbox; a click on it toggles too |
| `labelPosition` | `'start' \| 'end'` | `'end'` | Which side of the box the label sits on, in the reading direction |
| `checked` | `boolean` | `false` | Whether it starts selected |
| `indeterminate` | `boolean` | `false` | Whether it starts indeterminate |
| `error` | `boolean` | `false` | The error state: error outline, container and state layers, and `aria-invalid` |
| `disabled` | `boolean` | `false` | Whether it starts disabled |
| `name` | `string` | `undefined` | The input's name, for forms |
| `value` | `string` | `'on'` | The value submitted when selected |
| `required` | `boolean` | `false` | Whether the form requires it selected |
| `ariaLabel` | `string` | `undefined` | Accessible name when there is no visible label |
| `class` | `string` | `undefined` | Additional CSS classes |

`variant` is deprecated and has no effect: Material 3 has one checkbox.

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `check()` / `uncheck()` / `toggle()` | `CheckboxComponent` | Changes the state, clears indeterminate and emits `change` |
| `isChecked()` | `boolean` | Whether it is selected |
| `setIndeterminate(state)` | `CheckboxComponent` | Sets or clears the indeterminate state |
| `setError(error)` | `CheckboxComponent` | Sets or clears the error state |
| `getValue()` / `setValue(value)` | `boolean` / `CheckboxComponent` | The selected state; `'true'` and `'1'` read as selected |
| `getValueAttribute()` / `setValueAttribute(value)` | `string` / `CheckboxComponent` | The input's `value` attribute |
| `setLabel(text)` / `getLabel()` | `CheckboxComponent` / `string` | The label |
| `enable()` / `disable()` | `CheckboxComponent` | Disabled state |
| `on(event, handler)` / `off(event, handler)` | `CheckboxComponent` | Events: `change` |
| `destroy()` | `void` | Removes the checkbox |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ checked, value, nativeEvent? }` | The state changed. `nativeEvent` is present when the user toggled it, absent for the methods |

## Examples

### A parent and its children

The m3.material.io checkbox guidelines: checking the parent checks every child, unchecking it unchecks them, and a mix makes it indeterminate. Checking an indeterminate parent checks every child.

```javascript
const children = ['Pickles', 'Tomato', 'Lettuce', 'Cheese']
  .map(label => createCheckbox({ label, name: 'additions', value: label.toLowerCase() }));
const parent = createCheckbox({ label: 'Additions' });
parent.input.setAttribute('aria-controls', children.map(child => child.input.id).join(' '));

const reflect = () => {
  const on = children.filter(child => child.isChecked()).length;
  if (on === children.length) parent.check();
  else if (on === 0) parent.uncheck();
  else { parent.uncheck(); parent.setIndeterminate(true); }
};

// Only user changes: check() and uncheck() emit change too, without nativeEvent.
parent.on('change', ({ checked, nativeEvent }) => {
  if (nativeEvent) children.forEach(child => (checked ? child.check() : child.uncheck()));
});
children.forEach(child => child.on('change', ({ nativeEvent }) => { if (nativeEvent) reflect(); }));
```

Indent the children under the parent, and leave the parent unchecked while it is indeterminate, so a click checks everything.

### A required checkbox in error

```javascript
const consent = createCheckbox({ label: 'Share usage data', required: true });

form.addEventListener('submit', (event) => {
  consent.setError(!consent.isChecked());
  if (!consent.isChecked()) event.preventDefault();
});
```

## Accessibility

- The input is a native checkbox, named by its label; the indeterminate state reaches assistive tech as "mixed", and the error state as `aria-invalid`.
- Tab focuses the checkbox and Space toggles it. Enter is left to the form, which it submits, as with a native checkbox.
- Keyboard focus draws a 0.10 state layer and Material's 3dp focus ring around it; a pointer shows no ring.
- The whole 48dp area and the label toggle the checkbox.

## Styling

```css
.mtrl-checkbox { }                 /* the root */
.mtrl-checkbox--indeterminate, .mtrl-checkbox--error, .mtrl-checkbox--disabled { }
.mtrl-checkbox--label-start, .mtrl-checkbox--label-end { }
.mtrl-checkbox__input { }          /* the native input, over the whole checkbox */
.mtrl-checkbox__icon { }           /* the box; ::before is the state layer, ::after the dash */
.mtrl-checkbox__label { }
```

## Measurements

Following the m3.material.io checkbox specs, then Compose's `CheckboxTokens` and material-web:

| Attribute | Value |
|-----------|-------|
| Box | 18dp, 2dp corner, 2dp outline |
| Unselected | No fill, `on-surface-variant` outline (`on-surface` on hover, focus and press) |
| Selected and indeterminate | `primary` container, `on-primary` check or dash |
| Error | `error` outline and container, `on-error` check |
| Disabled | `on-surface` 38% outline or container, `surface` check and dash |
| State layer | 40dp circle: `on-surface` when unselected, `primary` when selected; a press takes the colour of the state it leads to |
| Touch target | 48dp |
| Label | Body Large, `on-surface`, 12dp from the box |
| Motion | The check draws in on the default spatial spring and leaves at once |
