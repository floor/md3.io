# Switch Component

A switch toggles the state of a single item on or off, with an immediate effect: turning on Wi-Fi, enabling notifications. Use a checkbox instead when the choice is saved later with a form, and pair every switch with a short label that says what it controls when on.

## Import

```javascript
import { createSwitch } from 'mtrl';
```

## Basic Usage

```javascript
const wifi = createSwitch({ label: 'Wi-Fi', checked: true });
wifi.on('change', ({ checked }) => setWifi(checked));
document.querySelector('.settings').append(wifi.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `undefined` | The label, which names the switch |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Which side of the switch the label sits on, in the reading direction |
| `checked` | `boolean` | `false` | Whether the switch starts on |
| `disabled` | `boolean` | `false` | Whether the switch starts disabled |
| `icon` | `string` | a check | Icon in the selected handle, as SVG markup; `'none'` for no icons |
| `unselectedIcon` | `string` | `undefined` | Icon in the unselected handle, which then grows to 24dp: M3's "icons on both" configuration |
| `supportingText` | `string` | `undefined` | Text under the label, linked to the switch with `aria-describedby` |
| `error` | `boolean` | `false` | The error state: an error outline and `aria-invalid`, with or without supporting text |
| `name` | `string` | `undefined` | The input's name, for forms |
| `value` | `string` | `'on'` | The value submitted when on |
| `required` | `boolean` | `false` | Whether the form requires it on |
| `ariaLabel` | `string` | `undefined` | Accessible name when there is no visible label |
| `class` | `string` | `undefined` | Additional CSS classes |

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `check()` / `uncheck()` / `toggle()` | `SwitchComponent` | Changes the state and emits `change` |
| `isChecked()` | `boolean` | Whether the switch is on |
| `getValue()` / `setValue(value)` | `boolean` / `SwitchComponent` | The on state; `'true'` and `'1'` read as on |
| `getValueAttribute()` / `setValueAttribute(value)` | `string` / `SwitchComponent` | The input's `value` attribute |
| `setLabel(text)` / `getLabel()` | `SwitchComponent` / `string` | The label |
| `setSupportingText(text, isError?)` / `removeSupportingText()` | `SwitchComponent` | The supporting text, and the error state with it |
| `enable()` / `disable()` | `SwitchComponent` | Disabled state |
| `on(event, handler)` / `off(event, handler)` | `SwitchComponent` | Events: `change`, `focus`, `blur` |
| `destroy()` | `void` | Removes the switch |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ checked, value, nativeEvent? }` | The state changed. `nativeEvent` is present when the user toggled it, absent for `check()`, `uncheck()`, `toggle()` and `setValue()` |
| `focus` / `blur` | `FocusEvent` | The switch gained or lost focus |

## Examples

### Icons on both states

```javascript
const dark = createSwitch({
  label: 'Dark theme',
  icon: checkIcon,
  unselectedIcon: closeIcon
});
```

### The label after the switch

```javascript
const sync = createSwitch({ label: 'Sync over mobile data', labelPosition: 'end' });
```

### Supporting text and errors

```javascript
const backup = createSwitch({ label: 'Back up photos', supportingText: 'Uses about 2 GB' });

backup.on('change', ({ checked }) => {
  if (checked && !navigator.onLine) backup.setSupportingText('Connect to back up', true);
  else backup.setSupportingText('Uses about 2 GB');
});
```

## Accessibility

- The input has `role="switch"`, named by its label; supporting text describes it through `aria-describedby`, and the error state sets `aria-invalid`.
- Tab lands on the switch, and Space or Enter toggles it, as the m3.material.io switch accessibility guidance has it.
- Keyboard focus draws a 0.10 state layer on the handle and Material's 3dp focus ring around the track; a pointer shows no ring.
- In right-to-left layouts the handle runs from right to left, and the label follows the reading direction.
- When the label is ambiguous, set `ariaLabel` to something more descriptive: "Photo album access" rather than "Photo album".

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

Following the m3.material.io switch specs, then Compose's `SwitchTokens`:

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
