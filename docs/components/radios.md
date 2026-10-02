---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Radio buttons

Radio buttons let people select one option from a set, when every option should be visible at
once. Keep to five options or fewer, stacked vertically, with one selected by default; for
more, use a [select](/docs/components/select/). See the
[M3 radio button guidelines](https://m3.material.io/components/radio-button/overview).

## Usage

```example
radios:
  name: size
  value: m
  options:
    - { value: s, label: Small }
    - { value: m, label: Medium }
    - { value: l, label: Large }
  on change: setSize(value)
```

## Examples

### In a row, one option disabled

`direction: 'horizontal'` lays the options out in a row. An option's own `disabled` leaves the
rest of the group usable.

```example
radios:
  name: delivery
  value: standard
  direction: horizontal
  options:
    - { value: standard, label: Standard }
    - { value: express, label: Express, disabled: true }
    - { value: pickup, label: Pick up }
```

### Setting the value

An action selects an option by its value. An unknown value clears the selection and emits
`change`, with `value` `''` and `option` `null`.

```example
radios:
  name: size
  value: m
  options:
    - { value: s, label: Small }
    - { value: m, label: Medium }
    - { value: l, label: Large }
  action reset:
    set value: s
```

An option's `labelBefore` puts its label before the radio, in the reading direction.

## API

<!-- API: generated from mtrl's types and <m-radios>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | required | The inputs' shared name, which makes them one group for the keyboard and forms; an empty name is replaced by a generated one |
| `options` | `RadioOptionConfig[]` | `[]` | The options, in order |
| `value` | `string` | `undefined` | The selected value |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | How the options are laid out |
| `disabled` | `boolean` | `false` | Whether the whole group starts disabled |
| `ripple` | `boolean` | `true` | Whether each radio has its state layer |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

#### Option

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | required | The option's value |
| `label` | `string` | required | Its label; a click on it selects the option |
| `disabled` | `boolean` | `false` | Whether the option starts disabled |
| `labelBefore` | `boolean` | `false` | Places the label before the radio, in the reading direction |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string \| null` | The selected value, or `null` when nothing is selected |
| `setValue(value)` | `value: string \| null` | `RadiosComponent` | Selects an option; `null`, or an unknown value, clears the selection and emits `change` |
| `getSelected()` | none | `RadioOptionConfig \| null` | The selected option |
| `addOption(option)` | `option: RadioOptionConfig` | `RadiosComponent` | Adds an option |
| `removeOption(value)` | `value: string` | `RadiosComponent` | Removes an option |
| `enable()` / `disable()` | none | `RadiosComponent` | The whole group |
| `enableOption(value)` / `disableOption(value)` | `value: string` | `RadiosComponent` | One option |
| `on(event, handler)` / `off(event, handler)` | `event: 'change', handler: Function` | `RadiosComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes the group |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The user selected an option, or an unknown value cleared the selection | `{ value, option, originalEvent }` |

`originalEvent` is the DOM event of a user's selection, `undefined` otherwise. The web
component's `change` carries `{ value }`.

## Accessibility

- A `radiogroup` of native radio inputs, each named by its label. Name the group: the factory's
  element takes `aria-label` or `aria-labelledby`, the web component an `aria-label` attribute.
- `Tab` lands on the selected radio, or the first; the arrow keys move and select, wrapping, and
  follow the reading direction in right-to-left layouts; `Space` selects the focused radio. This
  is the native behavior of radios sharing a `name`.
- Keyboard focus draws a 0.10 state layer and a 3dp focus ring; a pointer shows no ring.

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

From the m3.material.io radio button specs, then Compose's `RadioButtonTokens` and
material-web.

| Attribute | Value |
|-----------|-------|
| Icon | 20dp, a 2dp ring |
| Unselected | `on-surface-variant` ring (`on-surface` on hover, focus and press) |
| Selected | `primary` ring and a 10dp `primary` dot |
| Disabled | `on-surface` 38% |
| State layer | 40dp circle: `on-surface` when unselected, `primary` when selected; a press takes the color of the state it leads to |
| Item | 48dp tall |
| Label | Body Medium, `on-surface`, 8dp from the control |
| Motion | The dot springs in on the fast spatial spring |
