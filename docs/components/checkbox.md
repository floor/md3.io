---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Checkbox

A checkbox lets people select one or more items from a list, or turn one item on or off in a
form that is saved later. It is selected, unselected or indeterminate (a parent whose children
are partly selected), and any of them in error. For a setting that takes effect at once, use a
[switch](/docs/components/switch/). See the
[M3 checkbox guidelines](https://m3.material.io/components/checkbox/overview).

## Usage

```example
checkbox:
  label: I accept the terms
  name: terms
  on change: acceptTerms(checked)
```

## Examples

### Indeterminate

A parent checkbox is indeterminate while some of its children are selected. Checking it
selects every child, unchecking it clears them; keep it unchecked while indeterminate, so a
click checks everything. Its children are the app's to keep in step: `check()`, `uncheck()` and
`setValue()` clear the indeterminate state, and emit `change` when the state changes, without
the `nativeEvent` a user's click carries.

```example
checkbox:
  label: Additions
  indeterminate: true
```

### Required, in error

`error` draws the error colors and sets `aria-invalid`; set it when a required checkbox is left
unselected.

```example
checkbox:
  label: Share usage data
  required: true
  error: true
  action clearError:
    set error: false
```

A parent with its children, from the M3 guidelines, is planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-checkbox>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

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
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `variant` | `string` | `undefined` | Deprecated, no effect: M3 has one checkbox |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `check()` / `uncheck()` / `toggle()` | none | `CheckboxComponent` | Changes the state, clears indeterminate, and emits `change` when the state changes |
| `isChecked()` | none | `boolean` | Whether it is selected |
| `setIndeterminate(state)` | `state: boolean` | `CheckboxComponent` | Sets or clears the indeterminate state |
| `setError(error)` | `error: boolean` | `CheckboxComponent` | Sets or clears the error state |
| `getValue()` | none | `boolean` | The selected state |
| `setValue(value)` | `value: boolean \| string` | `CheckboxComponent` | Selects or clears it; the strings `'true'` and `'1'` select |
| `getValueAttribute()` / `setValueAttribute(value)` | `value: string` | `string` / `CheckboxComponent` | The input's `value` attribute |
| `getLabel()` / `setLabel(text)` | `text: string` | `string` / `CheckboxComponent` | The label |
| `enable()` / `disable()` | none | `CheckboxComponent` | The disabled state |
| `on(event, handler)` / `off(event, handler)` | `event: 'change', handler: Function` | `CheckboxComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the checkbox |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The state changed | `{ checked, value, nativeEvent? }` |

`nativeEvent` is there when the user toggled it, not for the methods. The web component's
`change` carries `{ checked, value }`.

## Accessibility

- A native checkbox, named by its label, or by `ariaLabel` without one.
- Indeterminate reaches assistive tech as "mixed"; error as `aria-invalid`.
- `Tab` focuses it and `Space` toggles it. `Enter` is left to the form, which it submits, as
  with a native checkbox.
- Keyboard focus draws a 0.10 state layer and a 3dp focus ring; a pointer shows no ring.
- The whole 48dp target and the label toggle it.

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

From the m3.material.io checkbox specs, then Compose's `CheckboxTokens` and material-web.

| Attribute | Value |
|-----------|-------|
| Box | 18dp, 2dp corner, 2dp outline |
| Unselected | No fill, `on-surface-variant` outline (`on-surface` on hover, focus and press) |
| Selected and indeterminate | `primary` container, `on-primary` check or dash |
| Error | `error` outline and container, `on-error` check |
| Disabled | `on-surface` 38% outline or container, `surface` check and dash |
| State layer | 40dp circle: `on-surface` when unselected, `primary` when selected; a press takes the color of the state it leads to |
| Touch target | 48dp |
| Label | Body Large, `on-surface`, 12dp from the box |
| Motion | The check draws in on the default spatial spring and leaves at once |
