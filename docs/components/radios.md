# Radios Component

Radio buttons let users select one option from a set. Use them when every option should be visible at once; keep to five options or fewer, stacked vertically, with one selected by default. For more, use a menu or a select.

## Import

```javascript
import { createRadios } from 'mtrl';
```

## Basic Usage

```javascript
const size = createRadios({
  name: 'size',
  value: 'm',
  options: [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' }
  ]
});
size.element.setAttribute('aria-label', 'Size');
size.on('change', ({ value }) => setSize(value));
document.querySelector('.options').append(size.element);
```

Name the group with `aria-label` or `aria-labelledby`; a visible title above it is the usual source.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | generated | The inputs' shared name, which makes them one group for the keyboard and forms |
| `options` | `RadioOptionConfig[]` | `[]` | The options, in order |
| `value` | `string` | `undefined` | The selected value |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | How the options are laid out |
| `disabled` | `boolean` | `false` | Whether the whole group starts disabled |
| `class` | `string` | `undefined` | Additional CSS classes |

### Option

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | required | The option's value |
| `label` | `string` | required | Its label; a click on it selects the option |
| `disabled` | `boolean` | `false` | Whether the option starts disabled |
| `labelBefore` | `boolean` | `false` | Places the label before the radio, in the reading direction |

`rippleConfig` is deprecated and has no effect.

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` / `setValue(value)` | `string` / `RadiosComponent` | The selected value. An unknown value clears the selection and emits `change` |
| `getSelected()` | `RadioOptionConfig \| null` | The selected option |
| `addOption(option)` / `removeOption(value)` | `RadiosComponent` | Adds or removes an option |
| `enable()` / `disable()` | `RadiosComponent` | The whole group |
| `enableOption(value)` / `disableOption(value)` | `RadiosComponent` | One option |
| `on(event, handler)` / `off(event, handler)` | `RadiosComponent` | Events: `change` |
| `destroy()` | `void` | Removes the group |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ value, option, originalEvent? }` | The user selected an option, or an unknown value cleared the selection (`value` is `''` and `option` `null`) |

## Accessibility

- The group is a `radiogroup` of native radio inputs, each named by its label.
- Tab lands on the selected radio (or the first one); the arrow keys move and select, wrapping, and follow the reading direction in right-to-left layouts. Space selects the focused radio. This is the native behaviour of radios sharing a `name`, and what the m3.material.io radio button guidance describes.
- Keyboard focus draws a 0.10 state layer and Material's 3dp focus ring; a pointer shows no ring.

## Styling

```css
.mtrl-radios { }                   /* the group */
.mtrl-radios--vertical, .mtrl-radios--horizontal { }
.mtrl-radios__item { }
.mtrl-radios__input { }            /* the native radio */
.mtrl-radios__label, .mtrl-radios__label--before { }
.mtrl-radios__control { }          /* the 40dp state layer area */
.mtrl-radios__ripple { }           /* the state layer */
.mtrl-radios__circle { }           /* the ring; ::after is the dot */
.mtrl-radios__text { }
```

## Measurements

Following the m3.material.io radio button specs, then Compose's `RadioButtonTokens` and material-web:

| Attribute | Value |
|-----------|-------|
| Icon | 20dp, a 2dp ring |
| Unselected | `on-surface-variant` ring (`on-surface` on hover, focus and press) |
| Selected | `primary` ring and a 10dp `primary` dot |
| Disabled | `on-surface` 38% |
| State layer | 40dp circle: `on-surface` when unselected, `primary` when selected; a press takes the colour of the state it leads to |
| Item | 48dp tall |
| Label | Body Medium, `on-surface`, 8dp from the control |
| Motion | The dot springs in on the fast spatial spring |
