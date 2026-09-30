# Switch

A switch turns one setting on or off, with an immediate effect: Wi-Fi, notifications, dark
theme. When the choice is saved later with a form, use a [checkbox](/docs/components/checkbox/).
Pair every switch with a short label that says what it controls when on. See the
[M3 switch guidelines](https://m3.material.io/components/switch/overview).

## Usage

```example
switch:
  label: Wi-Fi
  checked: true
  on change: setWifi(checked)
```

## Examples

### Icons

M3 has three configurations: a check in the handle when on (the default), no icons
(`icon: 'none'`), and icons in both states, where `unselectedIcon` also grows the off handle to
24dp. The web component takes `icon`, not `unselectedIcon` yet.

```example
switch:
  label: Dark theme
  icon: none
```

### Supporting text

Supporting text sits under the label and describes the switch. `setSupportingText(text, true)`
shows it as an error, and `error` sets the error state with or without text.

```example
switch:
  label: Back up photos
  supportingText: Uses about 2 GB
  action offline:
    set supportingText: Connect to back up
```

`labelPosition: 'end'` puts the label after the switch.

## API

<!-- API: generated from mtrl's types and <m-switch>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string \| Node` | `undefined` | The label, which names the switch |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Which side of the switch the label sits on, in the reading direction |
| `checked` | `boolean` | `false` | Whether the switch starts on |
| `disabled` | `boolean` | `false` | Whether the switch starts disabled |
| `icon` | `string` | a check | Icon in the selected handle, as SVG markup; `'none'` for no icons |
| `unselectedIcon` | `string` | `undefined` | Icon in the unselected handle, which then grows to 24dp |
| `supportingText` | `string` | `undefined` | Text under the label, linked to the switch with `aria-describedby` |
| `error` | `boolean` | `false` | The error state: an error outline and `aria-invalid`, with or without supporting text |
| `name` | `string` | `undefined` | The input's name, for forms |
| `value` | `string` | `'on'` | The value submitted when on |
| `required` | `boolean` | `false` | Whether the form requires it on |
| `ariaLabel` | `string` | `undefined` | Accessible name when there is no visible label |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `check()` / `uncheck()` / `toggle()` | none | `SwitchComponent` | Changes the state, and emits `change` when the state changes |
| `isChecked()` | none | `boolean` | Whether the switch is on |
| `getValue()` | none | `boolean` | The on state |
| `setValue(value)` | `value: boolean \| string` | `SwitchComponent` | Turns it on or off; the strings `'true'` and `'1'` turn it on |
| `getValueAttribute()` / `setValueAttribute(value)` | `value: string` | `string` / `SwitchComponent` | The input's `value` attribute |
| `getLabel()` / `setLabel(text)` | `text: string` | `string` / `SwitchComponent` | The label |
| `setSupportingText(text, isError?)` | `text: string, isError?: boolean` | `SwitchComponent` | The supporting text, and the error state with it |
| `removeSupportingText()` | none | `SwitchComponent` | Removes the supporting text |
| `enable()` / `disable()` | none | `SwitchComponent` | The disabled state |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `SwitchComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the switch |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The state changed | `{ checked, value, nativeEvent? }` |
| `focus` / `blur` | The switch gained or lost focus | `FocusEvent` |

`nativeEvent` is there when the user toggled it, not for the methods. The web component's
`change` carries `{ checked, value }`.

## Accessibility

- The input has `role="switch"` and is named by its label; supporting text describes it through
  `aria-describedby`, and the error state sets `aria-invalid`.
- `Tab` focuses it; `Space` and `Enter` toggle it, as the M3 switch accessibility guidance has it.
- Keyboard focus draws a 0.10 state layer on the handle and a 3dp focus ring around the track; a
  pointer shows no ring.
- In right-to-left layouts the handle runs from right to left.
- When the label is ambiguous, set `ariaLabel`: "Photo album access" rather than "Photo album".

## Styling

```css
.mtrl-switch { }                  /* the root */
.mtrl-switch--checked, .mtrl-switch--disabled, .mtrl-switch--error { }
.mtrl-switch--label-end, .mtrl-switch--icons { }
.mtrl-switch__container, .mtrl-switch__content, .mtrl-switch__label, .mtrl-switch__helper { }
.mtrl-switch__input { }           /* the native input, over the whole switch */
.mtrl-switch__track, .mtrl-switch__thumb { }
.mtrl-switch__thumb-icon, .mtrl-switch__thumb-icon--unselected { }
```

## Measurements

From the m3.material.io switch specs, then Compose's `SwitchTokens`.

| Attribute | Value |
|-----------|-------|
| Track | 52 × 32dp, fully rounded, a 2dp outline |
| Handle | 16dp off, 24dp on or with an icon, 28dp pressed |
| Icons | 16dp; `on-primary-container` when on, `surface-container-highest` when off |
| Off | `surface-container-highest` track, `outline` outline and handle |
| On | `primary` track, `on-primary` handle |
| Interaction | The handle turns `on-surface-variant` (off) or `primary-container` (on) on hover, focus and press, over a 40dp state layer |
| Disabled | Track `on-surface` 12%, handle `on-surface` 38%; when on, a `surface` handle |
| Label | `on-surface` |
| Motion | The handle moves and resizes on the fast spatial spring |
